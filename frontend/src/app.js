// Load environment variables from .env file
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL setup (production)
let pool = null;
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    
    // Check if DATABASE_URL contains a remote host (AWS RDS, Heroku, etc.)
    const isRemoteDB = process.env.DATABASE_URL.includes('rds.amazonaws.com') || 
                       process.env.DATABASE_URL.includes('heroku') ||
                       !process.env.DATABASE_URL.includes('localhost');
    
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isRemoteDB ? { rejectUnauthorized: false } : false
    });
    console.log('🐘 Using PostgreSQL database');
} else {
    console.log('📁 Using local JSON file storage (development mode)');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// ==================== AUTH SYSTEM (Hash Table Implementation) ====================
// Hash Table with PostgreSQL/JSON persistent storage
const USERS_FILE = path.join(__dirname, 'users.json');

class AuthSystem {
    constructor() {
        this.users = new Map();
        this.useDatabase = pool !== null;
        this.init();
    }

    async init() {
        if (this.useDatabase) {
            await this.initDatabase();
            await this.loadUsersFromDB();
            await this.loadVehiclesFromDB();
        } else {
            this.loadUsersFromFile();
        }
        await this.initializeAdmin();
    }

    async initDatabase() {
        try {
            // Create users table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    user_id VARCHAR(50) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    assigned_vehicle VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
            
            // Add assigned_vehicle column if it doesn't exist (migration)
            try {
                await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_vehicle VARCHAR(50);`);
                console.log('✓ Migration: Added assigned_vehicle column to users');
            } catch (error) {
                console.log('Note: assigned_vehicle migration skipped (already exists)');
            }
            
            // Create vehicles table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS vehicles (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    registration VARCHAR(100) NOT NULL,
                    model VARCHAR(100) NOT NULL,
                    make VARCHAR(100) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    year INTEGER NOT NULL,
                    km INTEGER DEFAULT 0,
                    days_service INTEGER DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'AVAILABLE',
                    vehicle_group VARCHAR(100),
                    vin VARCHAR(100),
                    number_plate VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);`);
            
            // Add number_plate column if it doesn't exist (migration)
            try {
                await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS number_plate VARCHAR(100);`);
                console.log('✓ Migration: Added number_plate column to vehicles');
            } catch (error) {
                console.log('Note: number_plate migration skipped (already exists)');
            }
            
            // Create trips table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS trips (
                    trip_id VARCHAR(50) PRIMARY KEY,
                    driver_id VARCHAR(50) NOT NULL,
                    driver_name VARCHAR(255) NOT NULL,
                    vehicle_id VARCHAR(50) NOT NULL,
                    vehicle_name VARCHAR(255) NOT NULL,
                    start_location TEXT,
                    start_lat DECIMAL(10,7),
                    start_lon DECIMAL(10,7),
                    destination TEXT,
                    dest_lat DECIMAL(10,7),
                    dest_lon DECIMAL(10,7),
                    start_odometer INTEGER NOT NULL,
                    end_odometer INTEGER,
                    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    end_time TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'ONGOING',
                    distance INTEGER,
                    purpose VARCHAR(255),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);`);
            
            // Create maintenance table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS maintenance (
                    maintenance_id VARCHAR(50) PRIMARY KEY,
                    vehicle_id VARCHAR(50) NOT NULL,
                    vehicle_name VARCHAR(255),
                    service_type VARCHAR(100) NOT NULL,
                    priority VARCHAR(20) NOT NULL,
                    scheduled_date DATE NOT NULL,
                    current_odometer INTEGER,
                    estimated_cost INTEGER DEFAULT 0,
                    actual_cost INTEGER,
                    service_provider VARCHAR(255),
                    status VARCHAR(20) DEFAULT 'pending',
                    notes TEXT,
                    completion_notes TEXT,
                    completed_at TIMESTAMP,
                    requested_by VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
                );
            `);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance(vehicle_id);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance(priority);`);
            
            // Alter maintenance table to make current_odometer nullable (migration)
            try {
                await pool.query(`ALTER TABLE maintenance ALTER COLUMN current_odometer DROP NOT NULL;`);
                console.log('✓ Migration: Made current_odometer nullable');
            } catch (error) {
                // Ignore if already nullable or column doesn't exist
                if (!error.message.includes('does not exist')) {
                    console.log('Note: current_odometer migration skipped (already applied or column nullable)');
                }
            }
            
            // Add requested_by column if it doesn't exist (migration)
            try {
                await pool.query(`ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS requested_by VARCHAR(255);`);
                console.log('✓ Migration: Added requested_by column');
            } catch (error) {
                console.log('Note: requested_by migration skipped (already exists)');
            }
            
            // Add GPS tracking columns to trips table (migration)
            try {
                await pool.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS current_lat NUMERIC(10, 7);`);
                await pool.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS current_lon NUMERIC(10, 7);`);
                await pool.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS last_update TIMESTAMP;`);
                console.log('✓ Migration: Added GPS tracking columns to trips');
            } catch (error) {
                console.log('Note: GPS tracking columns migration skipped (already exists)');
            }
            
            // Create fuel records table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS fuel_records (
                    fuel_id VARCHAR(50) PRIMARY KEY,
                    vehicle_id VARCHAR(50) NOT NULL,
                    vehicle_name VARCHAR(255),
                    driver_id VARCHAR(50),
                    driver_name VARCHAR(255),
                    trip_id VARCHAR(50),
                    fuel_type VARCHAR(50) NOT NULL,
                    quantity_liters DECIMAL(10,2) NOT NULL,
                    cost_per_liter DECIMAL(10,2) NOT NULL,
                    total_cost DECIMAL(10,2) NOT NULL,
                    odometer_reading INTEGER NOT NULL,
                    fuel_station VARCHAR(255),
                    location VARCHAR(255),
                    receipt_number VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'pending',
                    filled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
                    FOREIGN KEY (driver_id) REFERENCES users(user_id),
                    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
                );
            `);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_records(vehicle_id);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_fuel_driver ON fuel_records(driver_id);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_fuel_date ON fuel_records(filled_at);`);
            
            // Add status column to fuel_records if it doesn't exist (migration)
            try {
                const statusCheck = await pool.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='fuel_records' AND column_name='status'
                `);
                
                if (statusCheck.rows.length === 0) {
                    await pool.query(`ALTER TABLE fuel_records ADD COLUMN status VARCHAR(20) DEFAULT 'pending';`);
                    console.log('✓ Migration: Added status column to fuel_records');
                } else {
                    console.log('Note: fuel_records status column already exists');
                }
            } catch (error) {
                console.log('Note: fuel_records status migration error:', error.message);
            }
            
            // Add receipt columns migration
            try {
                const receiptCheck = await pool.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='fuel_records' AND column_name='receipt_image'
                `);
                
                if (receiptCheck.rows.length === 0) {
                    await pool.query(`ALTER TABLE fuel_records ADD COLUMN receipt_image TEXT;`);
                    await pool.query(`ALTER TABLE fuel_records ADD COLUMN receipt_details TEXT;`);
                    await pool.query(`ALTER TABLE fuel_records ADD COLUMN approved_at TIMESTAMP;`);
                    await pool.query(`ALTER TABLE fuel_records ADD COLUMN completed_at TIMESTAMP;`);
                    await pool.query(`ALTER TABLE fuel_records ALTER COLUMN odometer_reading DROP NOT NULL;`);
                    console.log('✓ Migration: Added receipt columns to fuel_records');
                } else {
                    console.log('Note: fuel_records receipt columns already exist');
                }
            } catch (error) {
                console.log('Note: fuel_records receipt migration error:', error.message);
            }
            
            // Create index after ensuring column exists
            try {
                await pool.query(`CREATE INDEX IF NOT EXISTS idx_fuel_status ON fuel_records(status);`);
            } catch (error) {
                console.log('Note: fuel_records status index creation skipped');
            }

            console.log('✅ Database tables initialized');
        } catch (error) {
            console.error('❌ Database initialization error:', error.message);
        }
    }

    async loadUsersFromDB() {
        try {
            const result = await pool.query('SELECT * FROM users');
            result.rows.forEach(user => {
                this.users.set(user.email, {
                    userId: user.user_id,
                    email: user.email,
                    password: user.password,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                    assignedVehicle: user.assigned_vehicle
                });
            });
            console.log(`✅ Loaded ${this.users.size} users from PostgreSQL`);
        } catch (error) {
            console.error('❌ Error loading users from database:', error.message);
        }
    }

    async loadVehiclesFromDB() {
        try {
            const result = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
            if (result.rows.length > 0) {
                vehicles = result.rows.map(v => ({
                    id: v.id,
                    name: v.name,
                    registration: v.registration,
                    model: v.model,
                    make: v.make,
                    type: v.type,
                    year: v.year,
                    km: v.km,
                    daysService: v.days_service,
                    status: v.status,
                    group: v.vehicle_group,
                    vin: v.vin,
                    numberPlate: v.number_plate
                }));
                console.log(`✅ Loaded ${vehicles.length} vehicles from PostgreSQL`);
            } else {
                // Insert default Pakistani vehicles
                console.log('📝 Inserting default Pakistani vehicles...');
                const defaultVehicles = [
                    { id: 'V001', name: 'Corolla GLi 2020', registration: 'LED-1234', model: 'Corolla GLi', make: 'Toyota', type: 'Car', year: 2020, km: 45000, daysService: 120, status: 'AVAILABLE', group: 'Lahore Fleet', vin: '2T1BURHE0KC123456', numberPlate: 'LED-1234' },
                    { id: 'V002', name: 'Civic Oriel 2019', registration: 'KHI-5678', model: 'Civic Oriel', make: 'Honda', type: 'Car', year: 2019, km: 52000, daysService: 150, status: 'AVAILABLE', group: 'Karachi Fleet', vin: '19XFC2F59KE654321', numberPlate: 'KHI-5678' },
                    { id: 'V003', name: 'City Aspire 2021', registration: 'ISB-9012', model: 'City Aspire', make: 'Honda', type: 'Car', year: 2021, km: 30000, daysService: 90, status: 'AVAILABLE', group: 'Islamabad Fleet', vin: '19XFB2F56ME789012', numberPlate: 'ISB-9012' },
                    { id: 'V004', name: 'Yaris ATIV 2022', registration: 'LHR-3456', model: 'Yaris ATIV', make: 'Toyota', type: 'Car', year: 2022, km: 18000, daysService: 60, status: 'AVAILABLE', group: 'Lahore Fleet', vin: '3MYDLBYV8MY345678', numberPlate: 'LHR-3456' },
                    { id: 'V005', name: 'Suzuki Cultus 2020', registration: 'FSD-7890', model: 'Cultus VXL', make: 'Suzuki', type: 'Car', year: 2020, km: 42000, daysService: 110, status: 'AVAILABLE', group: 'Faisalabad Fleet', vin: 'JSAFJD32S00456789', numberPlate: 'FSD-7890' },
                    { id: 'V006', name: 'Alto VXR 2021', registration: 'RWP-2345', model: 'Alto VXR', make: 'Suzuki', type: 'Car', year: 2021, km: 25000, daysService: 75, status: 'AVAILABLE', group: 'Rawalpindi Fleet', vin: 'JSAFJD35S00567890', numberPlate: 'RWP-2345' },
                    { id: 'V007', name: 'Hiace Grand Cabin', registration: 'MLT-6789', model: 'Hiace Grand Cabin', make: 'Toyota', type: 'Van', year: 2019, km: 85000, daysService: 200, status: 'AVAILABLE', group: 'Multan Fleet', vin: 'JTFSX23P300678901', numberPlate: 'MLT-6789' },
                    { id: 'V008', name: 'Bolan Cargo Van', registration: 'QTA-1122', model: 'Bolan', make: 'Suzuki', type: 'Van', year: 2018, km: 95000, daysService: 250, status: 'INACTIVE', group: 'Quetta Fleet', vin: 'JSAFJD42S00789012', numberPlate: 'QTA-1122' },
                    { id: 'V009', name: 'Hilux Revo 2021', registration: 'PEW-3344', model: 'Hilux Revo', make: 'Toyota', type: 'Truck', year: 2021, km: 60000, daysService: 140, status: 'AVAILABLE', group: 'Peshawar Fleet', vin: 'MR0FD22G800890123', numberPlate: 'PEW-3344' },
                    { id: 'V010', name: 'Shehzore Pickup', registration: 'GUJ-5566', model: 'Shehzore', make: 'Isuzu', type: 'Truck', year: 2020, km: 72000, daysService: 180, status: 'AVAILABLE', group: 'Gujranwala Fleet', vin: 'MPATFR70JK0901234', numberPlate: 'GUJ-5566' },
                    { id: 'V011', name: 'Hino Dump Truck', registration: 'SRG-7788', model: 'Hino 700', make: 'Hino', type: 'Truck', year: 2017, km: 150000, daysService: 320, status: 'AVAILABLE', group: 'Sargodha Fleet', vin: 'JHFDR42E400012345', numberPlate: 'SRG-7788' },
                    { id: 'V012', name: 'FAW Cargo Truck', registration: 'BWP-9900', model: 'FAW X-PV', make: 'FAW', type: 'Truck', year: 2019, km: 110000, daysService: 270, status: 'AVAILABLE', group: 'Bahawalpur Fleet', vin: 'LFNA1DBN5K0123456', numberPlate: 'BWP-9900' },
                    { id: 'V013', name: 'Fortuner 2022', registration: 'LED-1010', model: 'Fortuner', make: 'Toyota', type: 'SUV', year: 2022, km: 22000, daysService: 65, status: 'AVAILABLE', group: 'Lahore Fleet', vin: '5TFDY5F19NX234567', numberPlate: 'LED-1010' },
                    { id: 'V014', name: 'BR-V 2020', registration: 'KHI-2020', model: 'BR-V', make: 'Honda', type: 'SUV', year: 2020, km: 48000, daysService: 130, status: 'AVAILABLE', group: 'Karachi Fleet', vin: '19XFW1F50KE345678', numberPlate: 'KHI-2020' },
                    { id: 'V015', name: 'Vitara 2021', registration: 'HYD-3030', model: 'Vitara', make: 'Suzuki', type: 'SUV', year: 2021, km: 35000, daysService: 95, status: 'AVAILABLE', group: 'Hyderabad Fleet', vin: 'JSAETD94S00456789', numberPlate: 'HYD-3030' }
                ];
                
                for (const vehicle of defaultVehicles) {
                    await pool.query(
                        `INSERT INTO vehicles (id, name, registration, model, make, type, year, km, days_service, status, vehicle_group, vin, number_plate) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                        [vehicle.id, vehicle.name, vehicle.registration, vehicle.model, vehicle.make, vehicle.type, 
                         vehicle.year, vehicle.km, vehicle.daysService, vehicle.status, vehicle.group, vehicle.vin, vehicle.numberPlate]
                    );
                }
                vehicles = defaultVehicles;
                console.log(`✅ Inserted ${defaultVehicles.length} Pakistani vehicles`);
            }
        } catch (error) {
            console.error('❌ Error loading vehicles from database:', error.message);
        }
    }

    loadUsersFromFile() {
        try {
            if (fs.existsSync(USERS_FILE)) {
                const data = fs.readFileSync(USERS_FILE, 'utf8');
                const usersArray = JSON.parse(data);
                usersArray.forEach(user => {
                    this.users.set(user.email, user);
                });
                console.log(`✅ Loaded ${usersArray.length} users from JSON file`);
            }
        } catch (error) {
            console.error('⚠️ Error loading users from file:', error.message);
        }
    }

    async saveUsers() {
        if (this.useDatabase) {
            // Data already saved in real-time DB operations
            return;
        }
        
        try {
            const usersArray = Array.from(this.users.values());
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersArray, null, 2));
        } catch (error) {
            console.error('⚠️ Error saving users to file:', error.message);
        }
    }

    hashEmail(email) {
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            hash = (hash * 31 + email.charCodeAt(i)) % 100;
        }
        return Math.abs(hash);
    }

    async initializeAdmin() {
        if (!this.users.has('admin@fleet.com')) {
            const admin = {
                userId: 'U001',
                email: 'admin@fleet.com',
                password: 'admin123',
                name: 'System Administrator',
                role: 'ADMIN',
                status: 'ACTIVE'
            };
            
            if (this.useDatabase) {
                try {
                    await pool.query(
                        'INSERT INTO users (user_id, email, password, name, role, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
                        [admin.userId, admin.email, admin.password, admin.name, admin.role, admin.status]
                    );
                } catch (error) {
                    console.error('❌ Error creating admin in database:', error.message);
                }
            }
            
            this.users.set(admin.email, admin);
            await this.saveUsers();
            console.log('✅ Admin account initialized: admin@fleet.com');
        } else {
            console.log('✅ Admin account already exists: admin@fleet.com');
        }
    }

    async register(email, password, name) {
        if (this.users.has(email)) {
            return { success: false, message: 'Email already registered' };
        }

        if (email.toLowerCase() === 'admin@fleet.com') {
            return { success: false, message: 'This email is reserved for system administrator' };
        }

        // Generate unique user ID
        let userId;
        if (this.useDatabase) {
            try {
                // Get the maximum user_id number and increment
                const result = await pool.query(
                    "SELECT user_id FROM users WHERE user_id LIKE 'U%' ORDER BY user_id DESC LIMIT 1"
                );
                if (result.rows.length > 0) {
                    const lastId = result.rows[0].user_id;
                    const lastNum = parseInt(lastId.substring(1));
                    userId = 'U' + (lastNum + 1).toString().padStart(3, '0');
                } else {
                    userId = 'U001';
                }
            } catch (error) {
                console.error('Error generating user ID:', error);
                userId = 'U' + Date.now().toString().slice(-6);
            }
        } else {
            userId = 'U' + (this.users.size + 1).toString().padStart(3, '0');
        }
        
        const user = {
            userId,
            email,
            password,
            name,
            role: 'EMPLOYEE',
            status: 'PENDING'
        };

        if (this.useDatabase) {
            try {
                await pool.query(
                    'INSERT INTO users (user_id, email, password, name, role, status, assigned_vehicle) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [userId, email, password, name, 'EMPLOYEE', 'PENDING', 'None']
                );
            } catch (error) {
                console.error('❌ Error registering user in database:', error.message);
                return { success: false, message: 'Registration failed: ' + error.message };
            }
        }

        this.users.set(email, user);
        await this.saveUsers();
        console.log(`✅ User registered: ${email} (ID: ${userId}, Status: PENDING)`);
        return { success: true, user };
    }

    login(email, password) {
        const user = this.users.get(email);
        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }

        if (user.password !== password) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Allow login but return status for client-side routing
        console.log(`✅ User logged in: ${email} (Role: ${user.role}, Status: ${user.status})`);
        return { success: true, user };
    }

    getUserByEmail(email) {
        return this.users.get(email);
    }

    async updateUserStatus(email, newStatus) {
        const user = this.users.get(email);
        if (!user) {
            return false;
        }
        
        if (this.useDatabase) {
            try {
                await pool.query(
                    'UPDATE users SET status = $1 WHERE email = $2',
                    [newStatus, email]
                );
            } catch (error) {
                console.error('❌ Error updating user status in database:', error.message);
                return false;
            }
        }
        
        user.status = newStatus;
        await this.saveUsers();
        console.log(`✅ User status updated: ${email} -> ${newStatus}`);
        return true;
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }

    getPendingUsers() {
        return Array.from(this.users.values()).filter(u => u.status === 'PENDING');
    }

    async deleteUser(email) {
        const user = this.users.get(email);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.role === 'ADMIN') {
            return { success: false, message: 'Cannot delete admin account' };
        }

        if (this.useDatabase) {
            try {
                await pool.query('DELETE FROM users WHERE email = $1', [email]);
            } catch (error) {
                console.error('❌ Error deleting user from database:', error.message);
                return { success: false, message: 'Failed to delete user' };
            }
        }

        this.users.delete(email);
        await this.saveUsers();
        console.log(`✅ User deleted: ${email}`);
        return { success: true, message: 'User deleted successfully' };
    }
}

// Initialize auth system
let authSystem;

// ==================== DATA STORAGE ====================
// In-memory storage (simulating C++ backend data structures)
// Vehicles loaded from PostgreSQL database on startup
let vehicles = [];
let trips = [];

(async () => {
    authSystem = new AuthSystem();
    await authSystem.init();
    
    // Start server after initialization
    startServer();
})();

function startServer() {

let drivers = [
    { id: 'D001', name: 'Rajesh Kumar', license: 'DL-1234567890', phone: '+91-9876543210', experience: 5, status: 'AVAILABLE' },
    { id: 'D002', name: 'Amit Sharma', license: 'DL-2345678901', phone: '+91-9876543211', experience: 8, status: 'AVAILABLE' },
    { id: 'D003', name: 'Priya Singh', license: 'DL-3456789012', phone: '+91-9876543212', experience: 3, status: 'AVAILABLE' }
];

const locations = [
    { id: 0, name: 'Warehouse' },
    { id: 1, name: 'City Center' },
    { id: 2, name: 'Service Station' },
    { id: 3, name: 'Highway Junction' },
    { id: 4, name: 'Delivery Hub' },
    { id: 5, name: 'Industrial Area' }
];

const graph = {
    0: [{ dest: 1, weight: 15 }, { dest: 2, weight: 8 }],
    1: [{ dest: 0, weight: 15 }, { dest: 3, weight: 12 }, { dest: 4, weight: 25 }],
    2: [{ dest: 0, weight: 8 }, { dest: 3, weight: 10 }, { dest: 5, weight: 14 }],
    3: [{ dest: 1, weight: 12 }, { dest: 2, weight: 10 }, { dest: 4, weight: 18 }],
    4: [{ dest: 1, weight: 25 }, { dest: 3, weight: 18 }, { dest: 5, weight: 20 }],
    5: [{ dest: 2, weight: 14 }, { dest: 4, weight: 20 }]
};

// ==================== ROUTES ====================

// Home - Always redirect to login (client-side auth will handle rest)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// ==================== AUTH ROUTES ====================

// Signup (Register new user)
app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const result = await authSystem.register(email, password, name);
    
    if (result.success) {
        res.status(201).json({
            success: true,
            message: 'Account created successfully. Waiting for admin approval.',
            user: {
                userId: result.user.userId,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
                status: result.user.status
            }
        });
    } else {
        res.status(400).json(result);
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = authSystem.login(email, password);

    if (result.success) {
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                userId: result.user.userId,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
                status: result.user.status,
                assignedVehicle: result.user.assignedVehicle
            }
        });
    } else {
        res.status(401).json(result);
    }
});

// Dashboard Statistics API
app.get('/api/stats/dashboard', async (req, res) => {
    try {
        const users = authSystem.getAllUsers();
        
        // Count users by status
        let activeUsers = 0;
        let pendingUsers = 0;
        let inactiveUsers = 0;
        let assignedDrivers = 0;
        let availableDrivers = 0;
        
        users.forEach(user => {
            if (user.status === 'ACTIVE') {
                activeUsers++;
                if (user.role === 'EMPLOYEE') {
                    if (user.assignedVehicle) {
                        assignedDrivers++;
                    } else {
                        availableDrivers++;
                    }
                }
            }
            else if (user.status === 'PENDING') pendingUsers++;
            else if (user.status === 'INACTIVE') inactiveUsers++;
        });
        
        // Count assigned vehicles from users
        const assignedVehicleIds = users
            .filter(u => u.assignedVehicle)
            .map(u => u.assignedVehicle);
        
        const totalDrivers = users.filter(u => u.role === 'EMPLOYEE').length;
        
        // Get actual maintenance priority counts from database
        const maintenanceResult = await pool.query(`
            SELECT 
                priority,
                COUNT(*) as count
            FROM maintenance
            WHERE status = 'pending'
            GROUP BY priority
        `);
        
        let criticalCount = 0;
        let highCount = 0;
        let normalCount = 0;
        
        maintenanceResult.rows.forEach(row => {
            if (row.priority === 'high') {
                criticalCount = parseInt(row.count);
            } else if (row.priority === 'medium') {
                highCount = parseInt(row.count);
            } else if (row.priority === 'low') {
                normalCount = parseInt(row.count);
            }
        });
        
        // Sample vehicle data (from your DSA implementation)
        const stats = {
            vehicles: {
                total: vehicles.length,
                active: vehicles.filter(v => v.status === 'AVAILABLE').length,
                underRepair: vehicles.filter(v => v.status === 'MAINTENANCE').length,
                inactive: vehicles.filter(v => v.status === 'INACTIVE').length
            },
            drivers: {
                total: totalDrivers,
                available: availableDrivers,
                assigned: assignedDrivers,
                onLeave: 0
            },
            maintenance: {
                critical: criticalCount,
                high: highCount,
                normal: normalCount
            },
            users: {
                total: users.length,
                active: activeUsers,
                pending: pendingUsers,
                inactive: inactiveUsers
            },
            assignments: {
                assigned: assignedVehicleIds.length,
                unassigned: vehicles.length - assignedVehicleIds.length
            }
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
    }
});

// Get all users (Admin only)
app.get('/api/auth/users', (req, res) => {
    const users = authSystem.getAllUsers();
    res.json({
        success: true,
        count: users.length,
        dataStructure: 'Hash Table (Auth System)',
        complexity: 'O(1) lookup',
        users: users.map(u => ({
            userId: u.userId,
            email: u.email,
            name: u.name,
            role: u.role,
            status: u.status,
            assignedVehicle: u.assignedVehicle
        }))
    });
});

// Get pending users (Admin only)
app.get('/api/auth/pending', (req, res) => {
    const pending = authSystem.getPendingUsers();
    res.json({
        success: true,
        count: pending.length,
        users: pending.map(u => ({
            userId: u.userId,
            email: u.email,
            name: u.name,
            role: u.role,
            status: u.status,
            assignedVehicle: u.assignedVehicle
        }))
    });
});

// Approve/Reject user (Admin only)
app.put('/api/auth/users/:email/status', async (req, res) => {
    const { email } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const success = await authSystem.updateUserStatus(email, status);
    
    if (success) {
        res.json({
            success: true,
            message: `User status updated to ${status}`
        });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
});

// Get all users (for drivers page)
app.get('/api/users/all', (req, res) => {
    const users = Array.from(authSystem.users.values()).map(u => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        assignedVehicle: u.assignedVehicle
    }));
    
    res.json({ success: true, users });
});

// Get all users from database
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY user_id');
        res.json({ 
            success: true, 
            users: result.rows 
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// Get single user by email
app.get('/api/users/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const user = authSystem.users.get(email);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Return user data without password
        res.json({ 
            success: true, 
            user: {
                userId: user.userId,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                assignedVehicle: user.assignedVehicle
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});

// Assign vehicle to driver
app.post('/api/users/assign-vehicle', async (req, res) => {
    const { email, vehicleId } = req.body;
    
    try {
        const user = authSystem.users.get(email);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }
        
        if (user.role !== 'EMPLOYEE') {
            return res.status(400).json({ success: false, message: 'Only employees can be assigned vehicles' });
        }
        
        // Check if vehicle exists
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Vehicle not found' });
        }
        
        // Check vehicle status in database to ensure it's truly available
        if (authSystem.useDatabase) {
            const vehicleCheck = await pool.query(
                'SELECT status FROM vehicles WHERE id = $1',
                [vehicleId]
            );
            
            if (vehicleCheck.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Vehicle not found in database' });
            }
            
            if (vehicleCheck.rows[0].status !== 'AVAILABLE') {
                return res.status(400).json({ success: false, message: 'Vehicle is already assigned or unavailable' });
            }
            
            // Check if any other user has this vehicle assigned
            const userCheck = await pool.query(
                'SELECT user_id, name FROM users WHERE assigned_vehicle = $1',
                [vehicleId]
            );
            
            if (userCheck.rows.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Vehicle is already assigned to ${userCheck.rows[0].name}` 
                });
            }
        }
        
        if (vehicle.status !== 'AVAILABLE') {
            return res.status(400).json({ success: false, message: 'Vehicle is not available for assignment' });
        }
        
        // Update user with assigned vehicle
        user.assignedVehicle = vehicleId;
        
        // Update vehicle status to ASSIGNED
        vehicle.status = 'ASSIGNED';
        
        if (authSystem.useDatabase) {
            // Update user
            await pool.query(
                'UPDATE users SET assigned_vehicle = $1 WHERE email = $2',
                [vehicleId, email]
            );
            
            // Update vehicle status
            await pool.query(
                'UPDATE vehicles SET status = $1 WHERE id = $2',
                ['ASSIGNED', vehicleId]
            );
        }
        
        await authSystem.saveUsers();
        
        // Reload vehicles from database to sync status
        await authSystem.loadVehiclesFromDB();
        
        res.json({ success: true, message: 'Vehicle assigned successfully' });
    } catch (error) {
        console.error('Error assigning vehicle:', error);
        res.status(500).json({ success: false, message: 'Failed to assign vehicle' });
    }
});

// Unassign vehicle from driver
app.post('/api/users/unassign-vehicle', async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = authSystem.users.get(email);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }
        
        const vehicleId = user.assignedVehicle;
        
        // Update user - remove assigned vehicle
        user.assignedVehicle = null;
        
        // Update vehicle status back to AVAILABLE
        if (vehicleId) {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (vehicle) {
                vehicle.status = 'AVAILABLE';
            }
        }
        
        if (authSystem.useDatabase) {
            // Update user
            await pool.query(
                'UPDATE users SET assigned_vehicle = NULL WHERE email = $1',
                [email]
            );
            
            // Update vehicle status back to AVAILABLE
            if (vehicleId) {
                await pool.query(
                    'UPDATE vehicles SET status = $1 WHERE id = $2',
                    ['AVAILABLE', vehicleId]
                );
            }
        }
        
        await authSystem.saveUsers();
        
        // Reload vehicles from database to sync status
        await authSystem.loadVehiclesFromDB();
        
        res.json({ success: true, message: 'Vehicle unassigned successfully' });
    } catch (error) {
        console.error('Error unassigning vehicle:', error);
        res.status(500).json({ success: false, message: 'Failed to unassign vehicle' });
    }
});

// Delete user (Admin only)
app.delete('/api/auth/users/:email', async (req, res) => {
    const { email } = req.params;

    if (email === 'admin@fleet.com') {
        return res.status(403).json({ success: false, message: 'Cannot delete admin account' });
    }

    const result = await authSystem.deleteUser(email);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// ==================== VEHICLE ROUTES ====================

// Get all vehicles (Hash Table simulation)
app.get('/api/vehicles', (req, res) => {
    res.json({
        success: true,
        count: vehicles.length,
        dataStructure: 'Hash Table',
        complexity: 'O(1) lookup',
        data: vehicles
    });
});

// Get single vehicle by ID (Hash Table O(1) lookup)
app.get('/api/vehicles/:id', (req, res) => {
    const vehicle = vehicles.find(v => v.id === req.params.id);
    if (vehicle) {
        res.json({
            success: true,
            dataStructure: 'Hash Table',
            complexity: 'O(1)',
            data: vehicle
        });
    } else {
        res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
});

// Add vehicle (Hash Table insert)
app.post('/api/vehicles', async (req, res) => {
    const vehicle = {
        id: req.body.id || `V${String(vehicles.length + 1).padStart(3, '0')}`,
        name: req.body.name,
        registration: req.body.registration,
        model: req.body.model,
        make: req.body.make || 'Unknown',
        type: req.body.type,
        year: req.body.year,
        km: req.body.km || 0,
        daysService: req.body.daysService || 0,
        status: req.body.status || 'AVAILABLE',
        group: req.body.group || 'Fleet',
        vin: req.body.vin || '',
        numberPlate: req.body.numberPlate || req.body.registration
    };
    
    vehicles.push(vehicle);
    
    // Save to PostgreSQL database
    if (authSystem.useDatabase) {
        try {
            await pool.query(
                `INSERT INTO vehicles (id, name, registration, model, make, type, year, km, days_service, status, vehicle_group, vin, number_plate) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [vehicle.id, vehicle.name, vehicle.registration, vehicle.model, vehicle.make, vehicle.type, 
                 vehicle.year, vehicle.km, vehicle.daysService, vehicle.status, vehicle.group, vehicle.vin, vehicle.numberPlate]
            );
            console.log(`✅ Vehicle saved to database: ${vehicle.id}`);
        } catch (error) {
            console.error('❌ Error saving vehicle to database:', error.message);
        }
    }
    
    res.json({
        success: true,
        message: 'Vehicle added successfully',
        dataStructure: 'Hash Table',
        complexity: 'O(1) insert',
        data: vehicle
    });
});

// Delete vehicle (Hash Table delete)
app.delete('/api/vehicles/:id', async (req, res) => {
    const index = vehicles.findIndex(v => v.id === req.params.id);
    if (index !== -1) {
        const deleted = vehicles.splice(index, 1);
        
        // Delete from PostgreSQL database
        if (authSystem.useDatabase) {
            try {
                await pool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
                console.log(`✅ Vehicle deleted from database: ${req.params.id}`);
            } catch (error) {
                console.error('❌ Error deleting vehicle from database:', error.message);
            }
        }
        
        res.json({
            success: true,
            message: 'Vehicle deleted',
            dataStructure: 'Hash Table',
            complexity: 'O(1) delete',
            data: deleted[0]
        });
    } else {
        res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
});

// Update vehicle status (PATCH)
app.patch('/api/vehicles/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'INACTIVE'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    // Update in memory
    const vehicleIndex = vehicles.findIndex(v => v.id === id);
    if (vehicleIndex === -1) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    
    vehicles[vehicleIndex].status = status;
    
    // Update in database
    if (authSystem.useDatabase) {
        try {
            await pool.query('UPDATE vehicles SET status = $1 WHERE id = $2', [status, id]);
            console.log(`✅ Vehicle status updated: ${id} -> ${status}`);
        } catch (error) {
            console.error('❌ Error updating vehicle in database:', error.message);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
    }
    
    res.json({
        success: true,
        message: 'Vehicle status updated',
        data: vehicles[vehicleIndex]
    });
});

// Get all drivers (Queue simulation)
app.get('/api/drivers', (req, res) => {
    res.json({
        success: true,
        count: drivers.length,
        dataStructure: 'Queue (FIFO)',
        data: drivers
    });
});

// Assign driver (Queue dequeue)
app.post('/api/drivers/assign', (req, res) => {
    const { vehicleId } = req.body;
    
    const availableDriver = drivers.find(d => d.status === 'AVAILABLE');
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!availableDriver) {
        return res.status(400).json({ success: false, message: 'No available drivers' });
    }
    
    if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    
    availableDriver.status = 'ON_DUTY';
    vehicle.status = 'IN_USE';
    
    res.json({
        success: true,
        message: 'Driver assigned (FIFO)',
        dataStructure: 'Queue',
        complexity: 'O(1) dequeue',
        driver: availableDriver,
        vehicle: vehicle
    });
});

// Get maintenance priority (Min Heap simulation)
app.get('/api/vehicles/maintenance-priority', (req, res) => {
    // Calculate priority for each vehicle
    const withPriority = vehicles.map(v => ({
        ...v,
        priority: Math.floor(v.km / 5000) + Math.floor(v.daysService / 30),
        needsMaintenance: v.km > 10000 || v.daysService > 90
    }));
    
    // Sort by priority (Min Heap extract min simulation)
    const sorted = withPriority.sort((a, b) => a.priority - b.priority);
    
    res.json({
        success: true,
        dataStructure: 'Min Heap',
        complexity: 'O(log n) extract',
        urgentCount: sorted.filter(v => v.needsMaintenance).length,
        data: sorted
    });
});

// Calculate shortest route (Dijkstra's Algorithm)
app.post('/api/routes', (req, res) => {
    const { from, to } = req.body;
    
    if (from === undefined || to === undefined) {
        return res.status(400).json({ success: false, message: 'Source and destination required' });
    }
    
    // Dijkstra's algorithm
    const dist = Array(6).fill(Infinity);
    const visited = Array(6).fill(false);
    const parent = Array(6).fill(-1);
    
    dist[from] = 0;
    
    for (let count = 0; count < 6 - 1; count++) {
        let minDist = Infinity;
        let u = -1;
        
        for (let i = 0; i < 6; i++) {
            if (!visited[i] && dist[i] < minDist) {
                minDist = dist[i];
                u = i;
            }
        }
        
        if (u === -1) break;
        visited[u] = true;
        
        if (graph[u]) {
            graph[u].forEach(edge => {
                const v = edge.dest;
                const weight = edge.weight;
                
                if (!visited[v] && dist[u] !== Infinity && dist[u] + weight < dist[v]) {
                    dist[v] = dist[u] + weight;
                    parent[v] = u;
                }
            });
        }
    }
    
    // Reconstruct path
    const path = [];
    let current = to;
    while (current !== -1) {
        path.unshift(locations[current].name);
        current = parent[current];
    }
    
    if (dist[to] === Infinity) {
        return res.status(404).json({ success: false, message: 'No route found' });
    }
    
    res.json({
        success: true,
        algorithm: "Dijkstra's Algorithm",
        complexity: 'O(E log V)',
        distance: dist[to],
        path: path,
        from: locations[from].name,
        to: locations[to].name
    });
});

// Get locations
app.get('/api/locations', (req, res) => {
    res.json({
        success: true,
        data: locations
    });
});

// Get B-Tree sorted vehicles
app.get('/api/vehicles/sorted/all', (req, res) => {
    const sorted = [...vehicles].sort((a, b) => a.id.localeCompare(b.id));
    
    res.json({
        success: true,
        dataStructure: 'B-Tree (Sorted Index)',
        complexity: 'O(log n) search',
        count: sorted.length,
        data: sorted
    });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        statistics: {
            totalVehicles: vehicles.length,
            totalDrivers: drivers.length,
            availableVehicles: vehicles.filter(v => v.status === 'AVAILABLE').length,
            availableDrivers: drivers.filter(d => d.status === 'AVAILABLE').length,
            dataStructures: {
                hashTable: 'Vehicle Management - O(1)',
                queue: 'Driver Assignment - FIFO',
                minHeap: 'Maintenance Priority - O(log n)',
                graph: 'Route Optimization - O(E log V)',
                btree: 'Sorted Indexing - O(log n)'
            }
        }
    });
});

// ==================== TRIP MANAGEMENT ROUTES ====================

// Get all trips with optional filtering
app.get('/api/trips', async (req, res) => {
    try {
        const { status, driver_id, vehicle_id } = req.query;
        
        let query = 'SELECT * FROM trips';
        let params = [];
        let conditions = [];
        
        if (status) {
            conditions.push(`status = $${params.length + 1}`);
            params.push(status);
        }
        
        if (driver_id) {
            conditions.push(`driver_id = $${params.length + 1}`);
            params.push(driver_id);
        }
        
        if (vehicle_id) {
            conditions.push(`vehicle_id = $${params.length + 1}`);
            params.push(vehicle_id);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            trips: result.rows
        });
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch trips' });
    }
});

// Start a new trip
app.post('/api/trips/start', async (req, res) => {
    try {
        const { 
            driver_id, 
            driver_name, 
            vehicle_id, 
            vehicle_name, 
            start_location,
            start_lat,
            start_lon,
            destination,
            dest_lat,
            dest_lon,
            start_odometer, 
            purpose,
            notes,
            estimated_distance
        } = req.body;
        
        console.log('=== TRIP START REQUEST ===');
        console.log('driver_id:', driver_id);
        console.log('vehicle_id:', vehicle_id);
        console.log('start_location:', start_location);
        console.log('destination:', destination);
        console.log('purpose:', purpose);
        
        // Validate required fields
        if (!driver_id || !vehicle_id || !start_location || !destination || !purpose) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        // Check if driver already has an ongoing trip
        const ongoingCheck = await pool.query(
            'SELECT trip_id FROM trips WHERE driver_id = $1 AND status = $2',
            [driver_id, 'ONGOING']
        );
        
        if (ongoingCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Driver already has an ongoing trip' });
        }
        
        // Check if vehicle is already in use
        const vehicleCheck = await pool.query(
            'SELECT trip_id FROM trips WHERE vehicle_id = $1 AND status = $2',
            [vehicle_id, 'ONGOING']
        );
        
        if (vehicleCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Vehicle is already in use' });
        }
        
        // Generate trip ID
        const trip_id = 'TRIP-' + Date.now();
        
        // Insert new trip with all location data
        await pool.query(
            `INSERT INTO trips (
                trip_id, driver_id, driver_name, vehicle_id, vehicle_name, 
                start_location, start_lat, start_lon, 
                destination, dest_lat, dest_lon, 
                start_odometer, start_time, status, distance, purpose, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
                trip_id, driver_id, driver_name, vehicle_id, vehicle_name,
                start_location, start_lat || null, start_lon || null,
                destination, dest_lat || null, dest_lon || null,
                start_odometer || 0, new Date(), 'ONGOING', estimated_distance || null, purpose, notes || null
            ]
        );
        
        // Update vehicle status to IN_USE
        await pool.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['IN_USE', vehicle_id]);
        await authSystem.loadVehiclesFromDB();
        
        res.json({ success: true, message: 'Trip started successfully', trip_id });
    } catch (error) {
        console.error('Error starting trip:', error);
        res.status(500).json({ success: false, message: 'Failed to start trip' });
    }
});

// End a trip
app.post('/api/trips/end', async (req, res) => {
    try {
        const { trip_id, end_location, end_odometer, notes } = req.body;
        
        if (!trip_id || !end_odometer) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        // Get trip details
        const tripResult = await pool.query('SELECT * FROM trips WHERE trip_id = $1', [trip_id]);
        
        if (tripResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }
        
        const trip = tripResult.rows[0];
        
        if (trip.status !== 'ONGOING') {
            return res.status(400).json({ success: false, message: 'Trip is not ongoing' });
        }
        
        // Calculate distance and duration
        const distance_km = end_odometer - trip.start_odometer;
        const end_time = new Date();
        const start_time = new Date(trip.start_time);
        const duration_minutes = Math.round((end_time - start_time) / 1000 / 60);
        
        // Update trip
        await pool.query(
            `UPDATE trips SET end_location = $1, end_odometer = $2, end_time = $3, 
             status = $4, distance_km = $5, duration_minutes = $6, notes = $7
             WHERE trip_id = $8`,
            [end_location, end_odometer, end_time, 'COMPLETED', distance_km, duration_minutes, notes, trip_id]
        );
        
        // Update vehicle status back to ASSIGNED or AVAILABLE
        const userCheck = await pool.query('SELECT assigned_vehicle FROM users WHERE assigned_vehicle = $1', [trip.vehicle_id]);
        const newVehicleStatus = userCheck.rows.length > 0 ? 'ASSIGNED' : 'AVAILABLE';
        
        await pool.query('UPDATE vehicles SET status = $1, km = km + $2 WHERE id = $3', 
            [newVehicleStatus, distance_km, trip.vehicle_id]);
        await authSystem.loadVehiclesFromDB();
        
        res.json({ success: true, message: 'Trip ended successfully', distance_km, duration_minutes });
    } catch (error) {
        console.error('Error ending trip:', error);
        res.status(500).json({ success: false, message: 'Failed to end trip' });
    }
});

// Get trip statistics
app.get('/api/trips/stats', async (req, res) => {
    try {
        const ongoingResult = await pool.query('SELECT COUNT(*) FROM trips WHERE status = $1', ['ONGOING']);
        const completedResult = await pool.query('SELECT COUNT(*) FROM trips WHERE status = $1', ['COMPLETED']);
        const totalDistanceResult = await pool.query('SELECT SUM(distance_km) FROM trips WHERE status = $1', ['COMPLETED']);
        const avgDistanceResult = await pool.query('SELECT AVG(distance_km) FROM trips WHERE status = $1', ['COMPLETED']);
        
        res.json({
            success: true,
            stats: {
                ongoing: parseInt(ongoingResult.rows[0].count),
                completed: parseInt(completedResult.rows[0].count),
                total: parseInt(ongoingResult.rows[0].count) + parseInt(completedResult.rows[0].count),
                totalDistance: parseFloat(totalDistanceResult.rows[0].sum || 0).toFixed(2),
                avgDistance: parseFloat(avgDistanceResult.rows[0].avg || 0).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error fetching trip stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch trip statistics' });
    }
});

// ============================================
// MAINTENANCE MANAGEMENT ENDPOINTS
// ============================================

// Get all maintenance records
app.get('/api/maintenance', async (req, res) => {
    try {
        const { vehicle_id, user_email } = req.query;
        
        let query = `
            SELECT m.*, v.name as vehicle_name, v.registration
            FROM maintenance m
            LEFT JOIN vehicles v ON m.vehicle_id = v.id
        `;
        
        const params = [];
        const conditions = [];
        let paramCount = 1;
        
        if (vehicle_id) {
            conditions.push(`m.vehicle_id = $${paramCount}`);
            params.push(vehicle_id);
            paramCount++;
        }
        
        // Filter by user's assigned vehicle if user_email is provided
        if (user_email) {
            conditions.push(`m.requested_by = $${paramCount}`);
            params.push(user_email);
            paramCount++;
        }
        
        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }
        
        query += `
            ORDER BY 
                CASE m.priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                END,
                m.scheduled_date ASC
        `;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            maintenance: result.rows
        });
    } catch (error) {
        console.error('Error fetching maintenance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch maintenance records' });
    }
});

// Schedule new maintenance
app.post('/api/maintenance', async (req, res) => {
    try {
        const { vehicle_id, service_type, maintenance_type, description, priority, scheduled_date, current_odometer, odometer_reading, estimated_cost, notes, requested_by, status } = req.body;
        
        // Support both field names for compatibility
        const maintenanceType = maintenance_type || service_type;
        const maintenanceDescription = description || notes;
        const odometerValue = odometer_reading || current_odometer;
        
        // Validate required fields (odometer is now optional)
        if (!vehicle_id || !maintenanceType || !priority || !scheduled_date) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        // Generate maintenance ID
        const maxResult = await pool.query(
            "SELECT MAX(CAST(SUBSTRING(maintenance_id FROM 2) AS INTEGER)) as max FROM maintenance WHERE maintenance_id LIKE 'M%'"
        );
        const nextNum = (maxResult.rows[0].max || 0) + 1;
        const maintenance_id = 'M' + String(nextNum).padStart(3, '0');
        
        // Get vehicle name
        const vehicleResult = await pool.query('SELECT name FROM vehicles WHERE id = $1', [vehicle_id]);
        const vehicle_name = vehicleResult.rows[0]?.name || 'Unknown Vehicle';
        
        // Insert maintenance record
        const result = await pool.query(`
            INSERT INTO maintenance (
                maintenance_id, vehicle_id, vehicle_name, service_type, priority,
                scheduled_date, current_odometer, estimated_cost, notes, status, requested_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [maintenance_id, vehicle_id, vehicle_name, maintenanceType, priority, 
            scheduled_date, odometerValue, estimated_cost || 0, maintenanceDescription, status || 'PENDING', requested_by]);
        
        // Update vehicle status to MAINTENANCE only if status is APPROVED and vehicle is available
        if (status === 'APPROVED') {
            await pool.query(
                "UPDATE vehicles SET status = 'MAINTENANCE' WHERE id = $1 AND status IN ('AVAILABLE', 'INACTIVE')", 
                [vehicle_id]
            );
        }
        
        res.json({
            success: true,
            message: 'Maintenance request submitted successfully',
            maintenance: result.rows[0]
        });
    } catch (error) {
        console.error('Error scheduling maintenance:', error);
        res.status(500).json({ success: false, message: 'Failed to schedule maintenance' });
    }
});

// Approve/Reject Maintenance Request
app.patch('/api/maintenance/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !['APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        
        const result = await pool.query(`
            UPDATE maintenance 
            SET status = $1
            WHERE maintenance_id = $2
            RETURNING *
        `, [status, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Maintenance record not found' });
        }
        
        // Update vehicle status if approved
        if (status === 'APPROVED') {
            const vehicle_id = result.rows[0].vehicle_id;
            await pool.query(
                "UPDATE vehicles SET status = 'MAINTENANCE' WHERE id = $1 AND status IN ('AVAILABLE', 'INACTIVE')", 
                [vehicle_id]
            );
        }
        
        res.json({
            success: true,
            message: `Maintenance request ${status.toLowerCase()}`,
            maintenance: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating maintenance status:', error);
        res.status(500).json({ success: false, message: 'Failed to update maintenance status' });
    }
});

// Complete maintenance
app.post('/api/maintenance/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { actual_cost, service_provider, completion_notes } = req.body;
        
        if (!actual_cost || !service_provider) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const result = await pool.query(`
            UPDATE maintenance 
            SET status = 'completed',
                actual_cost = $1,
                service_provider = $2,
                completion_notes = $3,
                completed_at = NOW()
            WHERE maintenance_id = $4
            RETURNING *
        `, [actual_cost, service_provider, completion_notes, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Maintenance record not found' });
        }
        
        // Update vehicle status back to AVAILABLE
        const vehicle_id = result.rows[0].vehicle_id;
        await pool.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['AVAILABLE', vehicle_id]);
        
        res.json({
            success: true,
            message: 'Maintenance marked as complete',
            maintenance: result.rows[0]
        });
    } catch (error) {
        console.error('Error completing maintenance:', error);
        res.status(500).json({ success: false, message: 'Failed to complete maintenance' });
    }
});

// Delete maintenance
app.delete('/api/maintenance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM maintenance WHERE maintenance_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Maintenance record not found' });
        }
        
        res.json({
            success: true,
            message: 'Maintenance record deleted'
        });
    } catch (error) {
        console.error('Error deleting maintenance:', error);
        res.status(500).json({ success: false, message: 'Failed to delete maintenance' });
    }
});

// ============================================
// FUEL MANAGEMENT ENDPOINTS
// ============================================

// Get all fuel records with filtering and statistics
app.get('/api/fuel', async (req, res) => {
    try {
        const { vehicle_id, driver_id, start_date, end_date } = req.query;
        
        let query = `
            SELECT f.*, v.registration, v.name as vehicle_name
            FROM fuel_records f
            LEFT JOIN vehicles v ON f.vehicle_id = v.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (vehicle_id) {
            query += ` AND f.vehicle_id = $${paramCount}`;
            params.push(vehicle_id);
            paramCount++;
        }
        
        if (driver_id) {
            query += ` AND f.driver_id = $${paramCount}`;
            params.push(driver_id);
            paramCount++;
        }
        
        if (start_date) {
            query += ` AND f.filled_at >= $${paramCount}`;
            params.push(start_date);
            paramCount++;
        }
        
        if (end_date) {
            query += ` AND f.filled_at <= $${paramCount}`;
            params.push(end_date);
            paramCount++;
        }
        
        query += ' ORDER BY f.filled_at DESC';
        
        const result = await pool.query(query, params);
        
        // Calculate statistics
        const totalLiters = result.rows.reduce((sum, record) => sum + parseFloat(record.quantity_liters || 0), 0);
        const totalCost = result.rows.reduce((sum, record) => sum + parseFloat(record.total_cost || 0), 0);
        const avgCostPerLiter = result.rows.length > 0 ? totalCost / totalLiters : 0;
        
        res.json({
            success: true,
            count: result.rows.length,
            records: result.rows,
            statistics: {
                totalLiters: parseFloat(totalLiters.toFixed(2)),
                totalCost: parseFloat(totalCost.toFixed(2)),
                avgCostPerLiter: parseFloat(avgCostPerLiter.toFixed(2)),
                totalRecords: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching fuel records:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch fuel records' });
    }
});

// Add new fuel record
app.post('/api/fuel', async (req, res) => {
    try {
        const { 
            vehicle_id, driver_id, trip_id, fuel_type, quantity_liters, 
            cost_per_liter, odometer_reading, fuel_station, location, 
            receipt_number, notes 
        } = req.body;
        
        // Validate required fields
        if (!vehicle_id || !fuel_type || !quantity_liters || !cost_per_liter) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: vehicle_id, fuel_type, quantity_liters, cost_per_liter' 
            });
        }
        
        // Generate fuel ID
        const maxResult = await pool.query(
            "SELECT MAX(CAST(SUBSTRING(fuel_id FROM 2) AS INTEGER)) as max FROM fuel_records WHERE fuel_id LIKE 'F%'"
        );
        const nextNum = (maxResult.rows[0].max || 0) + 1;
        const fuel_id = 'F' + String(nextNum).padStart(4, '0');
        
        // Get vehicle and driver names
        const vehicleResult = await pool.query('SELECT name FROM vehicles WHERE id = $1', [vehicle_id]);
        const vehicle_name = vehicleResult.rows[0]?.name || 'Unknown Vehicle';
        
        let driver_name = null;
        if (driver_id) {
            const driverResult = await pool.query('SELECT name FROM users WHERE user_id = $1', [driver_id]);
            driver_name = driverResult.rows[0]?.name || null;
        }
        
        // Calculate total cost
        const total_cost = parseFloat(quantity_liters) * parseFloat(cost_per_liter);
        
        // Insert fuel record
        const result = await pool.query(`
            INSERT INTO fuel_records (
                fuel_id, vehicle_id, vehicle_name, driver_id, driver_name, trip_id,
                fuel_type, quantity_liters, cost_per_liter, total_cost, 
                odometer_reading, fuel_station, location, receipt_number, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `, [
            fuel_id, vehicle_id, vehicle_name, driver_id, driver_name, trip_id,
            fuel_type, quantity_liters, cost_per_liter, total_cost,
            odometer_reading, fuel_station, location, receipt_number, notes
        ]);
        
        // Update vehicle odometer only if provided
        if (odometer_reading && odometer_reading > 0) {
            await pool.query('UPDATE vehicles SET km = $1 WHERE id = $2', [odometer_reading, vehicle_id]);
        }
        
        res.json({
            success: true,
            message: 'Fuel record added successfully',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding fuel record:', error);
        res.status(500).json({ success: false, message: 'Failed to add fuel record' });
    }
});

// Get fuel statistics by vehicle
app.get('/api/fuel/stats/vehicle', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                v.id,
                v.name,
                v.registration,
                v.type,
                COUNT(f.fuel_id) as total_refuels,
                COALESCE(SUM(f.quantity_liters), 0) as total_liters,
                COALESCE(SUM(f.total_cost), 0) as total_cost,
                COALESCE(AVG(f.cost_per_liter), 0) as avg_cost_per_liter,
                MAX(f.filled_at) as last_refuel
            FROM vehicles v
            LEFT JOIN fuel_records f ON v.id = f.vehicle_id
            GROUP BY v.id, v.name, v.registration, v.type
            ORDER BY total_cost DESC
        `);
        
        res.json({
            success: true,
            vehicles: result.rows.map(v => ({
                ...v,
                total_liters: parseFloat(v.total_liters || 0).toFixed(2),
                total_cost: parseFloat(v.total_cost || 0).toFixed(2),
                avg_cost_per_liter: parseFloat(v.avg_cost_per_liter || 0).toFixed(2)
            }))
        });
    } catch (error) {
        console.error('Error fetching vehicle fuel stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch vehicle fuel statistics' });
    }
});

// Get fuel consumption trends
app.get('/api/fuel/stats/trends', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const result = await pool.query(`
            SELECT 
                DATE(filled_at) as date,
                COUNT(*) as refuel_count,
                SUM(quantity_liters) as total_liters,
                SUM(total_cost) as total_cost,
                AVG(cost_per_liter) as avg_cost_per_liter
            FROM fuel_records
            WHERE filled_at >= NOW() - INTERVAL '${days} days'
            GROUP BY DATE(filled_at)
            ORDER BY date DESC
        `);
        
        res.json({
            success: true,
            trends: result.rows.map(t => ({
                ...t,
                total_liters: parseFloat(t.total_liters || 0).toFixed(2),
                total_cost: parseFloat(t.total_cost || 0).toFixed(2),
                avg_cost_per_liter: parseFloat(t.avg_cost_per_liter || 0).toFixed(2)
            }))
        });
    } catch (error) {
        console.error('Error fetching fuel trends:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch fuel trends' });
    }
});

// Delete fuel record
app.delete('/api/fuel/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM fuel_records WHERE fuel_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Fuel record not found' });
        }
        
        res.json({
            success: true,
            message: 'Fuel record deleted'
        });
    } catch (error) {
        console.error('Error deleting fuel record:', error);
        res.status(500).json({ success: false, message: 'Failed to delete fuel record' });
    }
});

// Update fuel record status (approve/reject)
app.patch('/api/fuel/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        
        const result = await pool.query(
            'UPDATE fuel_records SET status = $1 WHERE fuel_id = $2 RETURNING *',
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Fuel record not found' });
        }
        
        res.json({
            success: true,
            message: `Fuel record ${status}`,
            record: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating fuel status:', error);
        res.status(500).json({ success: false, message: 'Failed to update fuel status' });
    }
});

// Approve fuel record
app.put('/api/fuel/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'UPDATE fuel_records SET status = $1, approved_at = CURRENT_TIMESTAMP WHERE fuel_id = $2 RETURNING *',
            ['approved', id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Fuel record not found' });
        }
        
        res.json({
            success: true,
            message: 'Fuel record approved',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('Error approving fuel record:', error);
        res.status(500).json({ success: false, message: 'Failed to approve fuel record' });
    }
});

// Reject fuel record
app.put('/api/fuel/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'UPDATE fuel_records SET status = $1 WHERE fuel_id = $2 RETURNING *',
            ['rejected', id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Fuel record not found' });
        }
        
        res.json({
            success: true,
            message: 'Fuel record rejected',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('Error rejecting fuel record:', error);
        res.status(500).json({ success: false, message: 'Failed to reject fuel record' });
    }
});

// Complete fuel request with receipt
app.put('/api/fuel/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { receipt_image, receipt_number, notes, status } = req.body;
        
        const result = await pool.query(`
            UPDATE fuel_records 
            SET receipt_image = $1, 
                receipt_number = $2, 
                notes = $3,
                status = $4,
                completed_at = CURRENT_TIMESTAMP
            WHERE fuel_id = $5 
            RETURNING *
        `, [receipt_image, receipt_number, notes, status || 'completed', id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Fuel record not found' });
        }
        
        res.json({
            success: true,
            message: 'Receipt uploaded successfully',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('Error completing fuel record:', error);
        res.status(500).json({ success: false, message: 'Failed to complete fuel record' });
    }
});

// ===== TRIP MANAGEMENT ENDPOINTS =====

// Get all trips (with optional filters)
app.get('/api/trips', async (req, res) => {
    try {
        const { driver_id, status, vehicle_id } = req.query;
        
        let query = 'SELECT * FROM trips WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (driver_id) {
            query += ` AND driver_id = $${paramCount}`;
            params.push(driver_id);
            paramCount++;
        }
        
        if (status) {
            query += ` AND status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (vehicle_id) {
            query += ` AND vehicle_id = $${paramCount}`;
            params.push(vehicle_id);
            paramCount++;
        }
        
        query += ' ORDER BY start_time DESC';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            trips: result.rows
        });
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch trips' });
    }
});

// Save GPS location for trip tracking
app.post('/api/trips/location', async (req, res) => {
    try {
        const { trip_id, latitude, longitude, speed, timestamp } = req.body;
        
        if (!trip_id || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        console.log(`GPS Update - Trip: ${trip_id}, Lat: ${latitude}, Lon: ${longitude}`);
        
        // Update current location in trips table
        const result = await pool.query(
            `UPDATE trips 
            SET current_lat = $1, 
                current_lon = $2,
                last_update = NOW()
            WHERE trip_id = $3 AND status = 'ONGOING'
            RETURNING trip_id`,
            [latitude, longitude, trip_id]
        );
        
        if (result.rowCount > 0) {
            console.log(`Location updated for trip ${trip_id}`);
            res.json({
                success: true,
                message: 'Location updated',
                latitude,
                longitude
            });
        } else {
            res.status(404).json({ success: false, message: 'Trip not found or not ongoing' });
        }
    } catch (error) {
        console.error('Error saving location:', error);
        res.status(500).json({ success: false, message: 'Failed to save location' });
    }
});

// End a trip
app.patch('/api/trips/:id/end', async (req, res) => {
    try {
        const { id } = req.params;
        const { end_odometer, end_time, distance, completion_notes, status } = req.body;
        
        console.log('Ending trip:', id, 'with distance:', distance);
        
        const result = await pool.query(
            `UPDATE trips 
            SET end_odometer = $1,
                end_time = $2,
                distance = $3,
                notes = COALESCE(notes || ' | Completion: ' || $4, $4),
                status = $5
            WHERE trip_id = $6
            RETURNING *`,
            [
                end_odometer || 0,
                end_time || new Date().toISOString(),
                distance || 0,
                completion_notes || '',
                status || 'COMPLETED',
                id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }
        
        // Update vehicle status back to AVAILABLE
        const vehicle_id = result.rows[0].vehicle_id;
        await pool.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['AVAILABLE', vehicle_id]);
        await authSystem.loadVehiclesFromDB();
        
        console.log('Trip ended successfully:', result.rows[0]);
        
        res.json({
            success: true,
            message: 'Trip ended successfully',
            trip: result.rows[0]
        });
    } catch (error) {
        console.error('Error ending trip:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to end trip' });
    }
});

// Get live/ongoing trips (for admin monitoring)
app.get('/api/trips/live', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM trips 
            WHERE status = 'ONGOING' 
            ORDER BY start_time DESC`
        );
        
        res.json({
            success: true,
            trips: result.rows
        });
    } catch (error) {
        console.error('Error fetching live trips:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch live trips' });
    }
});

// Delete single trip
app.delete('/api/trips/:tripId', async (req, res) => {
    try {
        const { tripId } = req.params;
        
        const result = await pool.query(
            'DELETE FROM trips WHERE trip_id = $1 RETURNING *',
            [tripId]
        );
        
        if (result.rowCount === 0) {
            return res.json({ success: false, message: 'Trip not found' });
        }
        
        console.log('Trip deleted:', tripId);
        res.json({ success: true, message: 'Trip deleted successfully' });
    } catch (error) {
        console.error('Error deleting trip:', error);
        res.status(500).json({ success: false, message: 'Failed to delete trip' });
    }
});

// Delete all trips for a specific user
app.delete('/api/users/:userId/trips', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await pool.query(
            'DELETE FROM trips WHERE driver_id = $1 RETURNING trip_id',
            [userId]
        );
        
        console.log(`Deleted ${result.rowCount} trips for user:`, userId);
        res.json({ 
            success: true, 
            message: `Deleted ${result.rowCount} trips`,
            count: result.rowCount 
        });
    } catch (error) {
        console.error('Error deleting user trips:', error);
        res.status(500).json({ success: false, message: 'Failed to delete trips' });
    }
});

// Delete all trips (for testing/admin)
app.delete('/api/trips', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM trips RETURNING trip_id');
        
        console.log(`Deleted all trips: ${result.rowCount} total`);
        res.json({ 
            success: true, 
            message: `Deleted all trips (${result.rowCount} total)`,
            count: result.rowCount 
        });
    } catch (error) {
        console.error('Error deleting all trips:', error);
        res.status(500).json({ success: false, message: 'Failed to delete trips' });
    }
});

    app.listen(PORT, () => {
        console.log('========================================');
        console.log('  Fleet Management API Server');
        console.log('========================================');
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Storage: ${authSystem.useDatabase ? 'PostgreSQL' : 'JSON File'}`);
        console.log('📊 API Endpoints:');
        console.log('   GET    /api/vehicles');
        console.log('   POST   /api/vehicles');
        console.log('   GET    /api/drivers');
        console.log('   POST   /api/drivers/assign');
        console.log('   GET    /api/maintenance');
        console.log('   POST   /api/routes');
        console.log('   GET    /api/stats');
        console.log('========================================');
    });
}
