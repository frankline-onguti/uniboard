# UniBoard System Design

## Role & Permission Matrix (Authoritative)

| Role | Capabilities |
|------|-------------|
| **Student** | View notices, apply for opportunities, track application status |
| **Admin** | Create/edit/delete notices, review applications, manage students |
| **Super Admin** | Create admins, assign roles, system-level control, manage all users |

### Permission Enforcement
- **Middleware**: Role-based route protection
- **UI Routing**: Component-level access control
- **Database**: Row-level security constraints
- **API Access**: JWT claims validation

**Nothing bypasses this matrix.**

## Database Schema (PostgreSQL)

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin', 'super_admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) UNIQUE, -- Only for students
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notices table
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    application_data JSONB, -- Flexible application form data
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notice_id, student_id) -- One application per student per notice
);
```

### Indexes (Performance Critical)
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX idx_notices_active ON notices(is_active) WHERE is_active = true;
CREATE INDEX idx_applications_notice_student ON applications(notice_id, student_id);
CREATE INDEX idx_applications_status ON applications(status);
```

## API Contract (Locked)

### Authentication
```
POST   /api/auth/register     # Student registration
POST   /api/auth/login        # All roles
POST   /api/auth/refresh      # Token refresh
POST   /api/auth/logout       # Invalidate tokens
GET    /api/auth/me           # Current user profile
```

### Notices
```
GET    /api/notices           # List notices (student/admin)
POST   /api/notices           # Create notice (admin only)
GET    /api/notices/:id       # Get single notice
PUT    /api/notices/:id       # Update notice (admin only)
DELETE /api/notices/:id       # Delete notice (admin only)
```

### Applications
```
POST   /api/applications      # Submit application (student)
GET    /api/applications      # List applications (role-based view)
GET    /api/applications/:id  # Get application details
PUT    /api/applications/:id  # Update application status (admin)
```

### Admin Management
```
POST   /api/admins            # Create admin (super_admin only)
GET    /api/users             # List users (admin/super_admin)
PUT    /api/users/:id/role    # Change user role (super_admin only)
DELETE /api/users/:id         # Delete user (super_admin only)
```

## Authentication Flow (JWT Lifecycle)

### Token Strategy
- **Access Token**: Short-lived (15 minutes), contains user claims
- **Refresh Token**: Long-lived (7 days), httpOnly cookie
- **Role Embedding**: User role embedded in JWT claims
- **Middleware Enforcement**: Every protected route validates permissions

### Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'student' | 'admin' | 'super_admin';
  iat: number;
  exp: number;
}
```

### Security Flow
1. Login → Generate access + refresh tokens
2. Frontend stores access token in memory
3. Refresh token in httpOnly cookie
4. Middleware validates token + role on each request
5. Auto-refresh before expiration
6. Logout → Invalidate both tokens

## Component Architecture

### Frontend Structure
```
src/
├── components/
│   ├── auth/           # Login, register forms
│   ├── dashboard/      # Role-specific dashboards
│   ├── notices/        # Notice components
│   ├── applications/   # Application components
│   └── shared/         # Reusable UI components
├── pages/
│   ├── StudentDashboard.tsx
│   ├── AdminDashboard.tsx
│   └── Login.tsx
├── hooks/
│   ├── useAuth.ts      # Authentication state
│   ├── useNotices.ts   # Notice data fetching
│   └── useApplications.ts
├── services/
│   ├── api.ts          # API client
│   ├── auth.ts         # Auth service
│   └── types.ts        # TypeScript interfaces
└── utils/
    ├── permissions.ts  # Role checking utilities
    └── constants.ts    # App constants
```

### Backend Structure
```
src/
├── controllers/
│   ├── authController.ts
│   ├── noticeController.ts
│   ├── applicationController.ts
│   └── adminController.ts
├── routes/
│   ├── auth.ts
│   ├── notices.ts
│   ├── applications.ts
│   └── admin.ts
├── models/
│   ├── User.ts
│   ├── Notice.ts
│   └── Application.ts
├── middlewares/
│   ├── auth.ts         # JWT validation
│   ├── permissions.ts  # Role-based access
│   └── validation.ts   # Request validation
├── services/
│   ├── authService.ts
│   ├── emailService.ts
│   └── notificationService.ts
└── utils/
    ├── database.ts     # DB connection
    ├── jwt.ts          # Token utilities
    └── constants.ts    # Server constants
```

## Data Flow Patterns

### Notice Creation Flow
1. Admin creates notice via POST /api/notices
2. Middleware validates admin role
3. Notice saved to database
4. Real-time notification to students
5. Frontend updates notice list

### Application Submission Flow
1. Student submits application via POST /api/applications
2. Middleware validates student role + notice exists
3. Application saved with 'pending' status
4. Email notification to admins
5. Frontend shows application status

### Role-Based UI Rendering
```typescript
// Frontend permission checking
const canCreateNotice = user?.role === 'admin' || user?.role === 'super_admin';
const canManageUsers = user?.role === 'super_admin';

// Component conditional rendering
{canCreateNotice && <CreateNoticeButton />}
{canManageUsers && <UserManagementPanel />}
```

## Phase 1 Exit Criteria ✅

**Can you answer these questions clearly?**
- ✅ Who can do what? → Role & Permission Matrix
- ✅ Where does this logic live? → Component Architecture
- ✅ What table owns this data? → Database Schema
- ✅ Which API endpoint handles this? → API Contract
- ✅ How does authentication work? → JWT Lifecycle

**If any answer is vague → Phase 1 incomplete.**

Ready for Phase 2: Feature Development.