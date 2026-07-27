-- ==========================================
-- Database Seed Data for Smart Parking System
-- Target Database: PostgreSQL
-- ==========================================

-- 1. Insert Roles
INSERT INTO roles (name) VALUES ('ROLE_USER') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON CONFLICT (name) DO NOTHING;

-- 2. Insert Users (Admin password is 'admin123', User password is 'user123' - plaintext representation in mock, hashed in production)
INSERT INTO users (id, name, email, password_hash, phone) 
VALUES ('user_1', 'Admin User', 'admin@quickpark.com', '$2a$10$r8V1P8qB7r6GgN2a8b.d/uqWJjG0W4GZ8Y4Hk7H4L7X7N3a8e.d.a', '9999999999')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, name, email, password_hash, phone) 
VALUES ('user_2', 'John Doe', 'user@quickpark.com', '$2a$10$w8T2M9qC7r6GgN2a8b.d/uqWJjG0W4GZ8Y4Hk7H4L7X7N3a8e.d.u', '9876543210')
ON CONFLICT (email) DO NOTHING;

-- 3. Map User Roles
INSERT INTO user_roles (user_id, role_id) 
VALUES ('user_1', (SELECT id FROM roles WHERE name = 'ROLE_ADMIN'))
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id) 
VALUES ('user_2', (SELECT id FROM roles WHERE name = 'ROLE_USER'))
ON CONFLICT DO NOTHING;

-- 4. Seed Registered Vehicles for default user
INSERT INTO vehicles (id, user_id, license_plate, vehicle_type, model_name)
VALUES ('v_1', 'user_2', 'TN-07-BY-1234', 'sedan', 'Honda City')
ON CONFLICT DO NOTHING;

-- 5. Seed Parking Locations (Chennai Areas)
INSERT INTO parking_locations (id, name, address, total_slots, available_slots, hourly_rate, daily_rate, latitude, longitude)
VALUES (
    'loc_1', 
    'T. Nagar Parking Plaza', 
    'Pondy Bazaar, T. Nagar, Chennai - 600017', 
    10, 
    10, 
    50.00, 
    250.00, 
    13.0405, 
    80.2337
) ON CONFLICT DO NOTHING;

INSERT INTO parking_locations (id, name, address, total_slots, available_slots, hourly_rate, daily_rate, latitude, longitude)
VALUES (
    'loc_2', 
    'Adyar Metro Parking', 
    'Adyar Depot, LB Road, Adyar, Chennai - 600020', 
    10, 
    10, 
    40.00, 
    200.00, 
    13.0063, 
    80.2574
) ON CONFLICT DO NOTHING;

INSERT INTO parking_locations (id, name, address, total_slots, available_slots, hourly_rate, daily_rate, latitude, longitude)
VALUES (
    'loc_3', 
    'Velachery Junction Garage', 
    'Grand Mall, Velachery Bypass Road, Velachery, Chennai - 600042', 
    10, 
    10, 
    30.00, 
    150.00, 
    12.9803, 
    80.2211
) ON CONFLICT DO NOTHING;

-- 6. Seed Parking Slots (10 slots per location: 5 sedan, 3 suv, 2 bike)
-- Slots for Location 1 (T. Nagar)
INSERT INTO parking_slots (id, location_id, slot_number, vehicle_type, status) VALUES
('s_loc_1_sedan_1', 'loc_1', 'A1', 'sedan', 'available'),
('s_loc_1_sedan_2', 'loc_1', 'A2', 'sedan', 'available'),
('s_loc_1_sedan_3', 'loc_1', 'A3', 'sedan', 'available'),
('s_loc_1_sedan_4', 'loc_1', 'A4', 'sedan', 'available'),
('s_loc_1_sedan_5', 'loc_1', 'A5', 'sedan', 'available'),
('s_loc_1_suv_1', 'loc_1', 'B1', 'suv', 'available'),
('s_loc_1_suv_2', 'loc_1', 'B2', 'suv', 'available'),
('s_loc_1_suv_3', 'loc_1', 'B3', 'suv', 'available'),
('s_loc_1_bike_1', 'loc_1', 'C1', 'bike', 'available'),
('s_loc_1_bike_2', 'loc_1', 'C2', 'bike', 'available')
ON CONFLICT DO NOTHING;

-- Slots for Location 2 (Adyar)
INSERT INTO parking_slots (id, location_id, slot_number, vehicle_type, status) VALUES
('s_loc_2_sedan_1', 'loc_2', 'A1', 'sedan', 'available'),
('s_loc_2_sedan_2', 'loc_2', 'A2', 'sedan', 'available'),
('s_loc_2_sedan_3', 'loc_2', 'A3', 'sedan', 'available'),
('s_loc_2_sedan_4', 'loc_2', 'A4', 'sedan', 'available'),
('s_loc_2_sedan_5', 'loc_2', 'A5', 'sedan', 'available'),
('s_loc_2_suv_1', 'loc_2', 'B1', 'suv', 'available'),
('s_loc_2_suv_2', 'loc_2', 'B2', 'suv', 'available'),
('s_loc_2_suv_3', 'loc_2', 'B3', 'suv', 'available'),
('s_loc_2_bike_1', 'loc_2', 'C1', 'bike', 'available'),
('s_loc_2_bike_2', 'loc_2', 'C2', 'bike', 'available')
ON CONFLICT DO NOTHING;

-- Slots for Location 3 (Velachery)
INSERT INTO parking_slots (id, location_id, slot_number, vehicle_type, status) VALUES
('s_loc_3_sedan_1', 'loc_3', 'A1', 'sedan', 'available'),
('s_loc_3_sedan_2', 'loc_3', 'A2', 'sedan', 'available'),
('s_loc_3_sedan_3', 'loc_3', 'A3', 'sedan', 'available'),
('s_loc_3_sedan_4', 'loc_3', 'A4', 'sedan', 'available'),
('s_loc_3_sedan_5', 'loc_3', 'A5', 'sedan', 'available'),
('s_loc_3_suv_1', 'loc_3', 'B1', 'suv', 'available'),
('s_loc_3_suv_2', 'loc_3', 'B2', 'suv', 'available'),
('s_loc_3_suv_3', 'loc_3', 'B3', 'suv', 'available'),
('s_loc_3_bike_1', 'loc_3', 'C1', 'bike', 'available'),
('s_loc_3_bike_2', 'loc_3', 'C2', 'bike', 'available')
ON CONFLICT DO NOTHING;
