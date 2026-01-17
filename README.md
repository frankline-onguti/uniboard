# UniBoard

A modern university dashboard system for students and administrators.

## Problem Statement

Universities need a centralized platform where students can view notices, apply for opportunities, and administrators can manage communications efficiently.

## Current Status

🚀 **UniBoard v1.0.0 MVP** - Complete university dashboard system ready for production

### ✅ Production Features

- **Authentication & Authorization**: JWT-based auth with complete role hierarchy (student, admin, super_admin)
- **Student Dashboard**: Complete notice viewing and application submission system
- **Admin Dashboard**: Full notice management and application review workflow
- **Super Admin Controls**: User management and role assignment system
- **Database Core**: PostgreSQL with optimized schema and proper relationships
- **API Layer**: RESTful APIs with comprehensive validation and error handling
- **Role-Based Security**: Enterprise-grade access control and route protection
- **Responsive Design**: Fully functional on desktop and mobile devices

## Tech Stack

### Frontend
- React 18 with TypeScript
- TailwindCSS for styling
- React Router for navigation
- Axios for API communication
- Vite for build tooling

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- JWT authentication
- Joi for validation

### DevOps
- Docker for containerization
- GitHub Actions for CI/CD (planned)
- Environment-based configuration

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/frankline-onguti/uniboard.git
cd uniboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup database
cd ../database
# Run schema.sql and seeds.sql in your PostgreSQL database

# Setup environment variables
cd ..
cp .env.example .env
# Edit .env with your database credentials
```

### Running the Application

```bash
# Terminal 1: Start backend (from backend folder)
npm run dev

# Terminal 2: Start frontend (from frontend folder)  
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Project Structure

```
uniboard/
├── frontend/          # React TypeScript app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts (Auth, etc.)
│   │   └── services/      # API service layer
├── backend/           # Node.js Express API
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Custom middleware
│   │   └── services/      # Business logic
├── database/          # PostgreSQL schema & seeds
├── shared/            # Shared TypeScript types
└── docs/              # Project documentation
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Student Endpoints
- `GET /api/notices` - Get active notices
- `POST /api/applications` - Submit application
- `GET /api/applications/me` - Get my applications

### Admin Endpoints
- `POST /api/notices` - Create notice (admin only)
- `PUT /api/notices/:id` - Update notice (admin only)
- `DELETE /api/notices/:id` - Delete notice (admin only)
- `GET /api/applications` - Get all applications (admin only)
- `PATCH /api/applications/:id/approve` - Approve application (admin only)
- `PATCH /api/applications/:id/reject` - Reject application (admin only)

### Super Admin Endpoints
- `GET /api/super-admin/users` - Get all users (super admin only)
- `PATCH /api/super-admin/users/:id/role` - Change user role (super admin only)
- `DELETE /api/super-admin/users/:id` - Delete user (super admin only)

## Git Workflow

- `main` - Production ready code
- `develop` - Integration branch for completed features
- `feature/*` - New feature development
- `release/*` - Release preparation (when needed)
- `hotfix/*` - Emergency fixes

## Releases

### Current Release
- **v1.0.0** - UniBoard MVP (Released)
  - Complete student dashboard with authentication and application system
  - Full admin dashboard with notice management and application review
  - Super admin controls with user management and role assignment
  - Enterprise-grade role hierarchy and security enforcement
  - Production-ready core functionality with comprehensive testing

### Planned Releases
- **v1.1.0** - Enhanced User Experience
  - Real-time notifications and updates
  - Advanced search and filtering capabilities
  - Performance optimizations and caching

- **v2.0.0** - Advanced Enterprise Features
  - Analytics and reporting dashboard
  - Email notification system
  - API rate limiting and advanced monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.