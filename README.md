# Fleet Management System

A comprehensive fleet management system built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Features

- **User Management** - Admin and Employee roles
- **Vehicle Management** - Track vehicles, maintenance, and fuel
- **Trip Management** - Create and monitor trips
- **Fuel Management** - Request fuel, track consumption
- **Maintenance Tracking** - Schedule and track maintenance
- **Dashboard Analytics** - Real-time statistics and insights

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (production), JSON file storage (development)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Deployment:** AWS EC2, PM2

## Quick Start (Development)

### Prerequisites

- Node.js 14+ and npm
- PostgreSQL 12+ (optional for production)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abdullah-fcc/fleet-management-system.git
cd fleet-management-system
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Start the development server:
```bash
npm start
```

4. Access the application at `http://localhost:3000`

### Default Login Credentials

**Admin:**
- Email: admin@fleet.com
- Password: admin123

**Employee:**
- Email: abdullah@fleet.com
- Password: abdullah123

## Deployment to AWS EC2

See [README-DEPLOYMENT.md](README-DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

```bash
# On your EC2 instance
git clone https://github.com/abdullah-fcc/fleet-management-system.git
cd fleet-management-system
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

## Project Structure

```
fleet-management-system/
├── frontend/
│   ├── public/
│   │   ├── index.html           # Admin dashboard
│   │   ├── login.html           # Authentication
│   │   ├── vehicles.html        # Vehicle management
│   │   ├── trips.html           # Trip management
│   │   ├── fuel.html            # Fuel management
│   │   ├── employee-*.html      # Employee pages
│   │   ├── components/          # Reusable components
│   │   └── css/                 # Stylesheets
│   ├── src/
│   │   ├── app.js              # Express server & API
│   │   └── users.json          # Development data storage
│   └── package.json
├── backend/
│   └── src/                    # C++ backend (optional)
├── deploy-ec2.sh               # EC2 deployment script
├── README-DEPLOYMENT.md        # Deployment guide
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get trip by ID
- `POST /api/trips` - Create trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Fuel
- `GET /api/fuel` - Get all fuel records
- `GET /api/fuel/:id` - Get fuel record by ID
- `POST /api/fuel` - Create fuel request
- `PATCH /api/fuel/:id/status` - Update fuel status
- `PUT /api/fuel/:id/complete` - Complete fuel request

### Maintenance
- `GET /api/maintenance` - Get all maintenance records
- `GET /api/maintenance/:id` - Get maintenance by ID
- `POST /api/maintenance` - Create maintenance record
- `PUT /api/maintenance/:id` - Update maintenance
- `DELETE /api/maintenance/:id` - Delete maintenance

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Environment Variables

Create a `.env` file in the `frontend` directory:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/fleet_management
ALLOWED_ORIGINS=http://localhost:3000
```

## Development Mode

The application automatically uses JSON file storage when `NODE_ENV` is not set to `production` or when `DATABASE_URL` is not configured. This makes it easy to develop without setting up PostgreSQL.

## Production Mode

Set environment variables:
```bash
export NODE_ENV=production
export DATABASE_URL=postgresql://user:password@host:5432/fleet_management
```

The application will automatically:
- Use PostgreSQL database
- Enable SSL for remote databases
- Create required tables on startup

## Features in Detail

### User Management
- Role-based access control (Admin/Employee)
- User creation and management
- Vehicle assignment to employees

### Vehicle Management
- Complete vehicle information tracking
- Status monitoring (Available/In Use/Maintenance)
- Maintenance scheduling
- Fuel consumption tracking

### Trip Management
- Create and assign trips
- Track trip status and progress
- Distance and duration monitoring
- Trip history and analytics

### Fuel Management
- Fuel request workflow
- Admin approval system
- Receipt upload capability
- Fuel consumption analytics

### Maintenance Tracking
- Schedule maintenance tasks
- Track maintenance history
- Cost tracking
- Service provider management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue: https://github.com/abdullah-fcc/fleet-management-system/issues
- Email: support@example.com

## Acknowledgments

- Built with Express.js and PostgreSQL
- UI inspired by modern fleet management systems
- Icons and design patterns from standard web practices

---

**Note:** This is an educational project demonstrating full-stack development with Node.js and PostgreSQL.
