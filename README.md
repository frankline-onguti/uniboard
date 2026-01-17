# UniBoard

A modern university dashboard system for students and administrators.

## Problem Statement

Universities need a centralized platform where students can view notices, apply for opportunities, and administrators can manage communications efficiently.

## Current Status

🚀 **Phase 4 Complete** - Student Dashboard fully functional  
🔧 **Phase 5 In Progress** - Admin Dashboard implementation  

### ✅ Implemented Features

- **Authentication & Authorization**: JWT-based auth with role hierarchy (student, admin, super_admin)
- **Student Dashboard**: Complete notice viewing and application system
- **Database Core**: PostgreSQL with proper schema and relationships
- **API Layer**: RESTful APIs with proper validation and error handling
- **Role-Based Access**: Secure route protection and middleware

### 🔧 In Development

- **Admin Dashboard**: Notice management and application review system
- **Enhanced UI**: Improved responsive design and user experience

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

### Admin Endpoints (In Development)
- `POST /api/notices` - Create notice
- `PUT /api/notices/:id` - Update notice
- `DELETE /api/notices/:id` - Delete notice
- `GET /api/applications` - Get all applications
- `PATCH /api/applications/:id/approve` - Approve application
- `PATCH /api/applications/:id/reject` - Reject application

## Git Workflow

- `main` - Production ready code
- `develop` - Integration branch for completed features
- `feature/*` - New feature development
- `release/*` - Release preparation (when needed)
- `hotfix/*` - Emergency fixes

## Releases

### Released
- **v1.0.0** (Current) - MVP Student Dashboard
  - Complete student authentication and dashboard
  - Notice viewing and application submission
  - Application status tracking
  - Role-based access control

### Planned
- **v1.1.0** - Admin Dashboard
  - Complete admin interface for notice management
  - Application review and moderation system
  - Enhanced user management

- **v2.0.0** - Advanced Features
  - Real-time notifications
  - Advanced search and filtering
  - Analytics dashboard
  - Email notification system

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.