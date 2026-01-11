-- Drop and recreate trips table with new schema
DROP TABLE IF EXISTS trips CASCADE;

CREATE TABLE trips (
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

CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
