# UniBoard

A modern university dashboard system for students and administrators.

## Problem Statement

Universities need a centralized platform where students can view notices, apply for opportunities, and administrators can manage communications efficiently.

## MVP Features

- **Authentication & Roles**: Students, admins, super-admin access control
- **Student Dashboard**: View notices, apply for opportunities
- **Admin Dashboard**: Post notices, manage users, review applications
- **Notifications**: Email and in-app notification system
- **Real-time Updates**: Live notice updates and application status

## Tech Stack

### Frontend
- React with TypeScript
- TailwindCSS for styling
- React Query for data fetching
- Vite for build tooling

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- JWT authentication
- Redis for caching (optional)

### DevOps
- Docker for containerization
- GitHub Actions for CI/CD
- Vercel for frontend deployment
- Railway/Render for backend deployment

## Development Setup

```bash
# Clone repository
git clone https://github.com/frankline-onguti/uniboard.git
cd uniboard

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development server
npm run dev
```

## Project Structure

```
uniboard/
├── frontend/          # React TypeScript app
├── backend/           # Node.js Express API
├── database/          # PostgreSQL migrations & seeds
├── docker/            # Docker configurations
└── docs/              # Project documentation
```

## Git Workflow

- `main` - Production ready code
- `develop` - Integration branch
- `feature/*` - New features
- `release/*` - Release preparation
- `hotfix/*` - Emergency fixes

## Releases

- v1.0.0 - MVP with core dashboard functionality
- v1.1.0 - Enhanced notifications and search
- v2.0.0 - Analytics and advanced features

## License

MIT License - see LICENSE file for details.