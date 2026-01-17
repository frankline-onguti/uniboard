-- Migration: Create refresh tokens table
-- Created: 2024-01-17T00:00:03.000Z

-- Refresh tokens table for JWT authentication
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    user_agent TEXT, -- Track device/browser
    ip_address INET -- Track IP for security
);

-- Indexes for performance
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Cleanup expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup trigger (optional - can also be done via cron job)
-- This will clean up expired tokens when new ones are inserted
CREATE OR REPLACE FUNCTION auto_cleanup_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up expired tokens for this user
    DELETE FROM refresh_tokens 
    WHERE user_id = NEW.user_id 
    AND expires_at < CURRENT_TIMESTAMP;
    
    -- Limit to 5 active tokens per user (security measure)
    DELETE FROM refresh_tokens 
    WHERE user_id = NEW.user_id 
    AND id NOT IN (
        SELECT id FROM refresh_tokens 
        WHERE user_id = NEW.user_id 
        ORDER BY created_at DESC 
        LIMIT 5
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_cleanup_refresh_tokens
    AFTER INSERT ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION auto_cleanup_expired_tokens();