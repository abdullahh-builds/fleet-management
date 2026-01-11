# Fleet Management System

A comprehensive fleet management system built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Features

- **User Management** - Admin and Employee roles with authentication
- **Vehicle Management** - Track vehicles, maintenance, and availability
- **Trip Management** - Create, assign, and monitor trips
- **Fuel Management** - Request fuel, track consumption, and manage receipts
- **Maintenance Tracking** - Schedule and track maintenance history
- **Dashboard Analytics** - Real-time statistics and insights

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (production), JSON file storage (development)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Deployment:** AWS EC2, PM2

## Quick Start (Development)

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+ (optional for production)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abdullahh-builds/fleet-management.git
cd fleet-management-app
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

## Project Structure

```
fleet-management-app/
├── frontend/                   # Frontend application
│   ├── public/                # Static HTML pages
│   │   ├── index.html          # Admin dashboard
│   │   ├── login.html          # Authentication
│   │   ├── vehicles.html       # Vehicle management
│   │   ├── trips.html          # Trip management
│   │   ├── fuel.html           # Fuel management
│   │   ├── employee-*.html     # Employee pages
│   │   ├── components/         # Reusable components
│   │   └── css/                # Stylesheets
│   ├── src/                   # Server code
│   │   ├── app.js             # Express server & API
│   │   └── users.json         # Development data storage
│   ├── package.json           # Frontend dependencies
│   └── README.md              # Frontend documentation
├── backend/                   # C++ backend (optional)
│   ├── src/                   # Source code
│   │   ├── main.cpp           # Entry point
│   │   ├── core/              # Core modules
│   │   └── data_structures/   # Custom data structures
│   └── CMakeLists.txt         # Build configuration
├── database/                  # Database related files
│   └── migrations/            # Database migrations
├── scripts/                   # Utility scripts
│   ├── deploy-ec2.sh          # EC2 deployment script
│   ├── quick-setup.sh         # Quick setup script
│   └── *.sh                   # Other utility scripts
├── docs/                      # Documentation
│   ├── README-DEPLOYMENT.md   # Deployment guide
│   └── QUICK-START.md         # Quick start guide
├── tests/                     # Test files
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify user session

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
- `POST /api/fuel` - Create fuel request
- `PATCH /api/fuel/:id/status` - Update fuel status
- `PUT /api/fuel/:id/complete` - Complete fuel request

### Maintenance
- `GET /api/maintenance` - Get all maintenance records
- `POST /api/maintenance` - Create maintenance record
- `PUT /api/maintenance/:id` - Update maintenance
- `DELETE /api/maintenance/:id` - Delete maintenance

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/fleet_management
ALLOWED_ORIGINS=http://localhost:3000
```

### Development Mode

The application automatically uses JSON file storage when `NODE_ENV` is not set to production. This makes it easy to develop without PostgreSQL.

### Production Mode

For production deployment, set the environment variables and the application will automatically use PostgreSQL and create required database tables.

## Deployment

### Quick Deploy to AWS EC2

```bash
# On your EC2 instance
git clone https://github.com/abdullahh-builds/fleet-management.git
cd fleet-management-app
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh
```

For detailed deployment instructions, see [docs/README-DEPLOYMENT.md](docs/README-DEPLOYMENT.md)

## Database Schema

The application uses the following main tables:

- **users** - User accounts and authentication
- **vehicles** - Vehicle information and status  
- **trips** - Trip records and tracking
- **fuel_records** - Fuel consumption data
- **maintenance** - Maintenance schedules and history

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue: [GitHub Issues](https://github.com/abdullahh-builds/fleet-management/issues)

---

**Note:** This is a comprehensive fleet management system demonstrating full-stack development with Node.js, Express.js, and modern web technologies.
