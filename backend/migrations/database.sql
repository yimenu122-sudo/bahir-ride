-- =============================================
-- BAHIR-RIDE POSTGRESQL DATABASE SCHEMA v1.0
-- =============================================
-- Enable UUID extension for secure identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- 1. CORE USER MANAGEMENT & AUTHENTICATION
-- =============================================

-- User roles enumeration
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'fleet_manager',
    'dispatcher',
    'support',
    'driver',
    'passenger'
);

-- User status enumeration
CREATE TYPE user_status AS ENUM (
    'pending',
    'active',
    'suspended',
    'inactive',
    'under_review'
);

-- Platform type enumeration
CREATE TYPE platform_type AS ENUM (
    'android',
    'ios',
    'web'
);

-- Language preference enumeration
CREATE TYPE app_language AS ENUM (
    'am',
    'en'
);

-- Ride booking source enumeration
CREATE TYPE ride_booking_source AS ENUM (
    'mobile_app',
    'phone_call',
    'web_dashboard',
    'kiosk'
);

-- Verification type enumeration
CREATE TYPE verification_type AS ENUM (
    'phone',    -- SMS / OTP
    'email',    -- Email OTP / link
    'document'  -- ID (Fayda, passport, license)
);

-- Main users table with RBAC implementation
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'passenger',
    status user_status NOT NULL DEFAULT 'pending',
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_picture_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    
    -- Ethiopian National ID (Fayda ID System)
    fayda_id VARCHAR(50) UNIQUE,
    fayda_id_front_url TEXT,
    fayda_id_back_url TEXT,
    
    -- Preferences
    preferred_language app_language NOT NULL DEFAULT 'en',
    country_code VARCHAR(5) DEFAULT '+251',
    city VARCHAR(100) DEFAULT 'Bahir Dar',
    notification_enabled BOOLEAN DEFAULT TRUE,
    
    -- Location tracking
    last_known_location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMP,
    
    -- Timestamps
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for users
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_location ON users USING GIST(last_known_location);
CREATE INDEX idx_users_fayda_id ON users(fayda_id);

-- User verification table
CREATE TABLE user_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type verification_type NOT NULL, -- using strict ENUM
    verification_code VARCHAR(10),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verifications_user ON user_verifications(user_id);
CREATE INDEX idx_verifications_code ON user_verifications(verification_code);

CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Passenger preferences
    default_payment_method VARCHAR(50) DEFAULT 'cash',
    is_accessible_ride_requested BOOLEAN DEFAULT FALSE,
    
    -- Loyalty program (future expansion)
    passenger_rating DECIMAL(3,2) DEFAULT 5.0,
    total_rides INTEGER DEFAULT 0,
    
    -- Safety features
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    -- Ethiopian payment methods
    telebirr_account VARCHAR(50),
    cbe_birr_account VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for passengers
CREATE INDEX idx_passengers_user ON passengers(user_id);
CREATE INDEX idx_passengers_rating ON passengers(passenger_rating);

-- Driver status enumeration
CREATE TYPE driver_status AS ENUM (
    'offline',
    'available',
    'on_ride',
    'break',
    'maintenance'
);

-- Driver details table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry_date DATE NOT NULL,
    license_front_url TEXT,
    license_back_url TEXT,
    
    -- Driver metrics
    total_rides_completed INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 5.0,
    
    -- Availability
    current_status driver_status DEFAULT 'offline',
    is_online BOOLEAN DEFAULT FALSE,
    last_online_at TIMESTAMP WITH TIME ZONE,
    
    -- Location tracking WITHOUT PostGIS (using decimal lat/lng)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    last_location_update TIMESTAMP,

    -- Commission preference
    commission_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'subscription'
    subscription_package_id UUID, -- References subscription_packages
    
    -- Bank/Mobile money details
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    telebirr_number VARCHAR(15),
    cbe_birr_number VARCHAR(15),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drivers_status ON drivers(current_status);
CREATE INDEX idx_drivers_online ON drivers(is_online);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    color VARCHAR(30),
    
    -- Documents
    registration_certificate_url TEXT,
    insurance_url TEXT,
    vehicle_photo_url TEXT,
    
    -- Capacity
    max_passengers INTEGER DEFAULT 4,
    
    -- Status
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
CREATE INDEX idx_vehicles_approved ON vehicles(is_approved);

-- =============================================
-- 3. RIDE MANAGEMENT SYSTEM
-- =============================================

-- Ride status enumeration
CREATE TYPE ride_status AS ENUM (
    'requested',
    'driver_assigned',
    'driver_arrived',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
);

-- Payment method enumeration
CREATE TYPE payment_method AS ENUM (
    'cash',
    'telebirr',
    'cbe_birr',
    'wallet',
    'card'
);

-- Payment status enumeration
CREATE TYPE payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);

-- Main rides table
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_code VARCHAR(20) UNIQUE NOT NULL, -- Format: BR-2026-00123
    
    -- Participants
    passenger_id UUID NOT NULL REFERENCES passengers(id),
    driver_id UUID REFERENCES drivers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    vehicle_type VARCHAR(20) NOT NULL, -- e.g., 'car', 'moto', 'bajaj'
    
    -- Booking & Staff Tracking
    booking_source ride_booking_source NOT NULL DEFAULT 'mobile_app',
    booked_by_staff_id UUID REFERENCES users(id), -- Support staff who created the ride
    assigned_by_dispatcher_id UUID REFERENCES users(id), -- Dispatcher who assigned the driver
    
    -- Locations (using PostGIS geography)
    pickup_latitude DECIMAL(10,8),
    pickup_longitude DECIMAL(11,8),
    pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address TEXT NOT NULL,

    destination_latitude DECIMAL(10,8),
    destination_longitude DECIMAL(11,8),
    destination_location GEOGRAPHY(POINT, 4326) NOT NULL,
    destination_address TEXT NOT NULL,
    
    -- Route information
    estimated_distance DECIMAL(8,2), -- in kilometers
    estimated_duration INTEGER, -- in minutes
    actual_distance DECIMAL(8,2),
    actual_duration INTEGER,
    
    -- Timing
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    arrival_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status ride_status NOT NULL DEFAULT 'requested',
    cancellation_reason TEXT,
    cancelled_by user_role,
    
    -- Pricing
    base_fare DECIMAL(8,2) NOT NULL,
    distance_fare DECIMAL(8,2),
    time_fare DECIMAL(8,2),
    surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
    total_fare DECIMAL(8,2) NOT NULL,
    
    -- Payment
    payment_method payment_method,
    payment_status payment_status DEFAULT 'pending',
    payment_id VARCHAR(100), -- Reference from payment gateway
    
    -- Commission
    commission_percentage DECIMAL(5,2) DEFAULT 10.00,
    commission_amount DECIMAL(8,2),
    driver_earnings DECIMAL(8,2),
    
    -- Ratings
    passenger_rating INTEGER CHECK (passenger_rating >= 1 AND passenger_rating <= 5),
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    passenger_feedback TEXT,
    driver_feedback TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rides performance
CREATE INDEX idx_rides_passenger ON rides(passenger_id);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_date ON rides(requested_at);
CREATE INDEX idx_rides_payment_status ON rides(payment_status);
CREATE INDEX idx_rides_pickup ON rides USING GIST(pickup_location);
CREATE INDEX idx_rides_destination ON rides USING GIST(destination_location);
CREATE INDEX idx_rides_booking_source ON rides(booking_source);
CREATE INDEX idx_rides_staff ON rides(booked_by_staff_id, assigned_by_dispatcher_id);

-- Ride tracking history
CREATE TABLE ride_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    speed DECIMAL(5,2), -- km/h
    accuracy DECIMAL(5,2), -- meters
    battery_level INTEGER, -- percentage
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tracking_ride ON ride_tracking(ride_id);
CREATE INDEX idx_tracking_time ON ride_tracking(recorded_at);
CREATE INDEX idx_tracking_location ON ride_tracking USING GIST(location);

-- =============================================
-- 4. PAYMENT & WALLET SYSTEM
-- =============================================

-- Wallet transactions table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'ETB',
    
    -- Security
    pin_hash VARCHAR(255),
    is_locked BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

-- Transaction types enumeration
CREATE TYPE transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'ride_payment',
    'commission',
    'refund',
    'bonus',
    'penalty'
);

-- Transaction status enumeration
CREATE TYPE transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'reversed'
);

-- Wallet transactions
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) UNIQUE NOT NULL, -- External reference
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    amount DECIMAL(10,2) NOT NULL,
    transaction_type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    
    -- Related entities
    ride_id UUID REFERENCES rides(id),
    payment_gateway VARCHAR(50), -- 'telebirr', 'cbe_birr', 'stripe', etc.
    gateway_reference VARCHAR(100),
    
    description TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_wtransactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_wtransactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wtransactions_type_status ON wallet_transactions(transaction_type, status);
CREATE INDEX idx_wtransactions_ride ON wallet_transactions(ride_id);

-- Subscription packages for drivers
CREATE TABLE subscription_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_name VARCHAR(100) NOT NULL,
    package_name_amharic VARCHAR(100),
    
    description TEXT,
    description_amharic TEXT,
    
    duration_days INTEGER NOT NULL, -- 30, 90, 365
    price DECIMAL(8,2) NOT NULL,
    commission_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    is_active BOOLEAN DEFAULT TRUE,
    max_rides_per_day INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_packages_active ON subscription_packages(is_active);

-- Driver subscriptions
CREATE TABLE driver_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    package_id UUID NOT NULL REFERENCES subscription_packages(id),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    payment_method payment_method,
    transaction_id UUID REFERENCES wallet_transactions(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_driver_subs_active ON driver_subscriptions(is_active);
CREATE INDEX idx_driver_subs_driver ON driver_subscriptions(driver_id);

-- =============================================
-- 5. NOTIFICATION & COMMUNICATION SYSTEM
-- =============================================

-- Notification types enumeration
CREATE TYPE notification_type AS ENUM (
    'ride_request',
    'ride_accepted',
    'driver_arrived',
    'ride_started',
    'ride_completed',
    'payment_received',
    'promotion',
    'system_alert',
    'support_ticket'
);

-- Notification channels enumeration
CREATE TYPE notification_channel AS ENUM (
    'push',
    'sms',
    'email',
    'in_app'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    title VARCHAR(200) NOT NULL,
    title_amharic VARCHAR(200),
    message TEXT NOT NULL,
    message_amharic TEXT,
    
    notification_type notification_type NOT NULL,
    channels notification_channel[] DEFAULT '{push,in_app}',
    
    -- Related entity
    ride_id UUID REFERENCES rides(id),
    ticket_id UUID, -- References support_tickets
    
    -- Tracking
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    metadata JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- =============================================
-- 6. SUPPORT & TICKETING SYSTEM
-- =============================================

-- Ticket status enumeration
CREATE TYPE ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);

-- Ticket priority enumeration
CREATE TYPE ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL, -- Format: TICKET-2024-00123
    
    -- User information
    user_id UUID NOT NULL REFERENCES users(id),
    user_role user_role NOT NULL,
    
    -- Ticket details
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'payment', 'ride', 'technical', 'account', 'safety'
    
    -- Status tracking
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id), -- Support staff
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Related entities
    ride_id UUID REFERENCES rides(id),
    transaction_id UUID REFERENCES wallet_transactions(id),
    
    -- Resolution
    resolution TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX idx_tickets_created ON support_tickets(created_at);

-- Ticket conversations
CREATE TABLE ticket_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    message TEXT NOT NULL,
    attachments TEXT[], -- Array of file URLs
    
    is_internal_note BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_ticket ON ticket_conversations(ticket_id);
CREATE INDEX idx_conversations_user ON ticket_conversations(user_id);

-- =============================================
-- 6.1 PHONE RIDE REQUESTS & MANUAL DISPATCHING
-- =============================================

-- Table to store metadata specific to phone-based bookings
CREATE TABLE phone_ride_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    
    -- Caller Details
    caller_phone_number VARCHAR(15) NOT NULL,
    is_registered_passenger BOOLEAN DEFAULT TRUE,
    
    -- Call Information (for auditing/compliance)
    call_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    call_end_time TIMESTAMP WITH TIME ZONE,
    call_recording_url TEXT,
    
    -- Support Interaction
    support_staff_id UUID NOT NULL REFERENCES users(id),
    support_notes TEXT,
    
    -- Ticket link for complaint/follow-up tracking
    ticket_id UUID REFERENCES support_tickets(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_phone_requests_ride ON phone_ride_requests(ride_id);
CREATE INDEX idx_phone_requests_phone ON phone_ride_requests(caller_phone_number);
CREATE INDEX idx_phone_requests_staff ON phone_ride_requests(support_staff_id);

-- Table to log manual driver assignments by dispatchers
CREATE TABLE dispatcher_manual_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    dispatcher_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    
    -- Assignment Logic
    assignment_reason TEXT, -- e.g., "Passenger proximity override", "Driver request", "Emergency"
    assignment_method VARCHAR(50) DEFAULT 'manual_search', -- 'manual_search', 'priority_queue', 'emergency_dispatch'
    
    -- Coordination Tracking
    communication_channel VARCHAR(20) DEFAULT 'system', -- 'system', 'phone_call', 'radio'
    is_accepted_by_driver BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_manual_assignments_ride ON dispatcher_manual_assignments(ride_id);
CREATE INDEX idx_manual_assignments_dispatcher ON dispatcher_manual_assignments(dispatcher_id);
CREATE INDEX idx_manual_assignments_driver ON dispatcher_manual_assignments(driver_id);

-- =============================================
-- 7. ADMINISTRATIVE & ANALYTICS TABLES
-- =============================================

-- System configuration
CREATE TABLE system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_group VARCHAR(50) NOT NULL, -- 'pricing', 'commission', 'notification', 'security'
    
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_configs_key ON system_configurations(config_key);
CREATE INDEX idx_configs_group ON system_configurations(config_group);

-- Fare pricing matrix
CREATE TABLE fare_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_type VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Bahir Dar',
    
    base_fare DECIMAL(8,2) NOT NULL,
    per_km_rate DECIMAL(8,2) NOT NULL,
    per_minute_rate DECIMAL(8,2) NOT NULL,
    minimum_fare DECIMAL(8,2) NOT NULL,
    
    -- Surge pricing
    surge_start_threshold INTEGER, -- Number of concurrent requests
    surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(vehicle_type, city, effective_from)
);

CREATE INDEX idx_fare_vehicle_type ON fare_pricing(vehicle_type);
CREATE INDEX idx_fare_active ON fare_pricing(is_active);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_role user_role,
    
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    
    old_values JSONB,
    new_values JSONB,
    
    ip_address INET,
    user_agent TEXT,
    platform platform_type,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- =============================================
-- 8. LOCALIZATION & MULTILINGUAL SUPPORT
-- =============================================

-- Application translations
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_key VARCHAR(200) NOT NULL,
    english TEXT NOT NULL,
    amharic TEXT NOT NULL,
    
    -- Context
    screen VARCHAR(100),
    component VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(translation_key, screen)
);

CREATE INDEX idx_translations_key ON translations(translation_key);

-- City and zone management for future expansion
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_amharic VARCHAR(100),
    
    location GEOGRAPHY(POLYGON, 4326), -- City boundaries
    center_point GEOGRAPHY(POINT, 4326),
    
    is_active BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(50) DEFAULT 'Africa/Addis_Ababa',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cities_active ON cities(is_active);
CREATE INDEX idx_cities_location ON cities USING GIST(location);

-- =============================================
-- 9. TRIGGERS & AUTOMATED FUNCTIONS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- Function to generate ride codes
CREATE OR REPLACE FUNCTION generate_ride_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ride_code := 'BR-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                     LPAD((COALESCE(
                         (SELECT MAX(SUBSTRING(ride_code FROM 10)::INT) 
                          FROM rides 
                          WHERE ride_code LIKE 'BR-' || EXTRACT(YEAR FROM NOW()) || '-%'), 0) + 1)::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_ride_code_trigger
BEFORE INSERT ON rides
FOR EACH ROW
EXECUTE FUNCTION generate_ride_code();

-- Function to calculate ride fare
CREATE OR REPLACE FUNCTION calculate_ride_fare(
    p_distance_km DECIMAL,
    p_duration_min INTEGER,
    p_vehicle_type VARCHAR(20),
    p_city VARCHAR DEFAULT 'Bahir Dar'
)
RETURNS DECIMAL AS $$
DECLARE
    v_fare fare_pricing%ROWTYPE;
    v_total DECIMAL(8,2);
BEGIN
    -- Get active fare pricing for vehicle type and city
    SELECT * INTO v_fare
    FROM fare_pricing
    WHERE vehicle_type = p_vehicle_type
        AND city = p_city
        AND is_active = TRUE
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY effective_from DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No fare pricing found for vehicle type % in city %', p_vehicle_type, p_city;
    END IF;
    
    -- Calculate fare
    v_total := v_fare.base_fare + 
               (p_distance_km * v_fare.per_km_rate) + 
               (p_duration_min * v_fare.per_minute_rate);
    
    -- Apply minimum fare
    IF v_total < v_fare.minimum_fare THEN
        v_total := v_fare.minimum_fare;
    END IF;
    
    -- Apply surge multiplier if applicable
    v_total := v_total * v_fare.surge_multiplier;
    
    RETURN ROUND(v_total, 2);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. INITIAL DATA & CONFIGURATION
-- =============================================

-- Insert default system configurations
INSERT INTO system_configurations (config_key, config_value, config_group, description) VALUES
-- Pricing
('default_commission_rate', '15', 'commission', 'Default commission percentage for drivers'),
('driver_approval_required', 'true', 'security', 'Whether driver approval is required by admin'),
('max_passenger_cancellations', '3', 'rides', 'Max cancellations per day before penalty'),
('ride_timeout_seconds', '60', 'rides', 'Time before unaccepted ride request times out'),

-- Notification
('sms_enabled', 'true', 'notification', 'Enable SMS notifications'),
('push_enabled', 'true', 'notification', 'Enable push notifications'),
('email_enabled', 'false', 'notification', 'Enable email notifications'),

-- Security
('session_timeout_minutes', '30', 'security', 'User session timeout in minutes'),
('max_login_attempts', '5', 'security', 'Maximum failed login attempts before lock'),
('password_min_length', '8', 'security', 'Minimum password length'),

-- Business
('business_name', 'Bahir-Ride', 'general', 'Application business name'),
('business_name_amharic', 'ባህር-ራይድ', 'general', 'የንግድ ስም በአማርኛ'),
('support_phone', '+251900000000', 'general', 'Customer support phone number');

-- Insert default fare pricing for Bahir Dar
INSERT INTO fare_pricing (vehicle_type, city, base_fare, per_km_rate, per_minute_rate, minimum_fare, is_active, effective_from) VALUES
('car', 'Bahir Dar', 25.00, 12.00, 2.00, 40.00, TRUE, '2024-01-01'),
('bajaj', 'Bahir Dar', 15.00, 8.00, 1.50, 25.00, TRUE, '2024-01-01'),
('motorcycle', 'Bahir Dar', 12.00, 6.00, 1.00, 20.00, TRUE, '2024-01-01'),
('minivan', 'Bahir Dar', 35.00, 15.00, 3.00, 60.00, TRUE, '2024-01-01');

-- Insert subscription packages for drivers
INSERT INTO subscription_packages (package_name, package_name_amharic, description, description_amharic, duration_days, price, commission_percentage) VALUES
('Daily Package', 'ዕለታዊ ፓኬጅ', 'Pay per ride with 15% commission', 'ጉዞ በጉዞ ይክፈሉ እና 15% ኮሚሽን ይከፍሉ', 1, 0.00, 15.00),
('Weekly Basic', 'ሳምንታዊ መሰረታዊ', 'Weekly subscription with 5% commission', 'ሳምንታዊ ምዝገባ ከ5% ኮሚሽን ጋር', 7, 150.00, 5.00),
('Monthly Pro', 'ወርሃዊ ፕሮ', 'Monthly subscription with 0% commission', 'ወርሃዊ ምዝገባ ከ0% ኮሚሽን ጋር', 30, 500.00, 0.00),
('Quarterly Premium', 'ሩብ ዓመት ፕሪሚየም', 'Quarterly subscription with 0% commission and priority rides', 'ሩብ ዓመት ምዝገባ ከ0% ኮሚሽን እና ቅድሚያ ጉዞዎች ጋር', 90, 1200.00, 0.00);

-- Insert default city (Bahir Dar)
INSERT INTO cities (name, name_amharic, center_point) VALUES
('Bahir Dar', 'ባህር ዳር', ST_GeogFromText('POINT(11.5936 37.3907)'));

-- =============================================
-- 11. DATABASE VIEWS FOR ANALYTICS
-- =============================================

-- View for ride analytics
CREATE VIEW ride_analytics AS
SELECT 
    DATE(r.requested_at) as ride_date,
    EXTRACT(HOUR FROM r.requested_at) as hour_of_day,
    r.vehicle_type,
    r.status,
    r.booking_source,
    COUNT(*) as total_rides,
    SUM(r.total_fare) as total_revenue,
    AVG(r.total_fare) as avg_fare,
    AVG(r.actual_duration) as avg_duration_minutes,
    AVG(r.actual_distance) as avg_distance_km,
    AVG(r.passenger_rating) as avg_passenger_rating,
    AVG(r.driver_rating) as avg_driver_rating
FROM rides r
GROUP BY DATE(r.requested_at), EXTRACT(HOUR FROM r.requested_at), r.vehicle_type, r.status, r.booking_source;

-- View for driver performance
CREATE VIEW driver_performance AS
SELECT 
    d.id,
    u.first_name || ' ' || u.last_name as driver_name,
    d.total_rides_completed,
    d.total_earnings,
    d.average_rating,
    COUNT(DISTINCT r.id) as monthly_rides,
    SUM(r.total_fare) as monthly_earnings,
    AVG(r.passenger_rating) as monthly_avg_rating,
    AVG(r.actual_duration) as avg_ride_duration
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN rides r ON d.id = r.driver_id 
    AND r.requested_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND r.status = 'completed'
GROUP BY d.id, u.first_name, u.last_name, d.total_rides_completed, d.total_earnings, d.average_rating;

-- View for active users
CREATE VIEW active_users AS
SELECT 
    role,
    COUNT(*) as total_users,
    COUNT(CASE WHEN last_login_at >= NOW() - INTERVAL '7 days' THEN 1 END) as active_last_7_days,
    COUNT(CASE WHEN last_login_at >= NOW() - INTERVAL '30 days' THEN 1 END) as active_last_30_days
FROM users
WHERE status = 'active'
GROUP BY role;

-- =============================================
-- 12. DATABASE SECURITY & PERMISSIONS
-- =============================================

-- Create application user (execute this separately with admin privileges)
/*
CREATE USER bahirride_app WITH PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE bahirride TO bahirride_app;
GRANT USAGE ON SCHEMA public TO bahirride_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bahirride_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO bahirride_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO bahirride_app;
*/

-- =============================================
-- DATABASE SCHEMA COMPLETED
-- =============================================