# Fleet Management System

A comprehensive web application for managing vehicle fleets, tracking trips, monitoring fuel consumption, and scheduling maintenance.

## Features

- User authentication with role-based access control
- Vehicle management and tracking
- Trip planning and monitoring
- Fuel management and consumption tracking
- Maintenance scheduling and history
- Real-time analytics dashboard
- RESTful API for all operations

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Production), JSON files (Development)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Deployment**: AWS EC2, PM2
- **Version Control**: Git

## Prerequisites

- Node.js 16.0 or higher
- npm or yarn
- PostgreSQL 12+ (for production)
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/fleet-management-system.git
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

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fleet.com | admin123 |
| Employee | abdullah@fleet.com | abdullah123 |

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/fleet_management
ALLOWED_ORIGINS=http://your-domain.com:3000
```

### Development Mode

The application automatically uses JSON file storage when running in development mode, making it easy to get started without setting up PostgreSQL.

### Production Mode

For production deployment, set the environment variables and the application will automatically use PostgreSQL and create the required database tables.

## API Documentation

### Authentication

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify user session

### Vehicles

- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Trips

- `GET /api/trips` - Get all trips
- `POST /api/trips` - Create new trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Fuel

- `GET /api/fuel` - Get fuel records
- `POST /api/fuel` - Add fuel record
- `PUT /api/fuel/:id` - Update fuel record

### Maintenance

- `GET /api/maintenance` - Get maintenance records
- `POST /api/maintenance` - Schedule maintenance
- `PUT /api/maintenance/:id` - Update maintenance record

## Deployment

### AWS EC2

1. Launch an EC2 instance with Amazon Linux 2023
2. Configure security groups for SSH (port 22) and HTTP (port 3000)
3. Run the deployment script:

```bash
curl -o deploy.sh https://raw.githubusercontent.com/your-username/fleet-management-system/main/deploy-ec2.sh
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment

```bash
git clone https://github.com/your-username/fleet-management-system.git
cd fleet-management-system
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

## Project Structure

```
fleet-management-system/
├── frontend/
│   ├── public/
│   │   ├── index.html              # Admin dashboard
│   │   ├── login.html              # Authentication
│   │   ├── vehicles.html           # Vehicle management
│   │   ├── trips.html              # Trip management
│   │   ├── fuel.html               # Fuel management
│   │   ├── maintenance.html        # Maintenance scheduling
│   │   ├── components/             # Reusable UI components
│   │   └── css/                    # Stylesheets
│   ├── src/
│   │   ├── app.js                  # Express server and API
│   │   └── users.json              # Development user data
│   └── package.json
├── backend/
│   └── src/                        # C++ algorithm implementations
├── deploy-ec2.sh                   # AWS deployment script
└── README.md
```

## Database Schema

The application uses the following main tables:

- **users** - User accounts and authentication
- **vehicles** - Vehicle information and status
- **trips** - Trip records and tracking
- **fuel_records** - Fuel consumption data
- **maintenance** - Maintenance schedules and history

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Testing

### API Testing

Test endpoints using curl:

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleet.com","password":"admin123"}'

# Test vehicle creation
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"registration":"ABC-123","model":"Toyota Camry","type":"Car","year":2023}'
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue: [GitHub Issues](https://github.com/your-username/fleet-management-system/issues)
- Email: support@example.com

## Acknowledgments

- Built with Express.js and PostgreSQL
- Deployed on AWS EC2
- Uses PM2 for process management
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
