-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#1E40AF',
    contact_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Shipments
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    tracking_number TEXT UNIQUE NOT NULL,
    container_number TEXT,
    vessel_name TEXT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    current_status TEXT DEFAULT 'BOOKED',
    eta TIMESTAMP WITH TIME ZONE,
    ata TIMESTAMP WITH TIME ZONE,
    last_location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Payment Escrows
CREATE TABLE IF NOT EXISTS payment_escrows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    escrow_contract_address TEXT,
    buyer_wallet_address TEXT NOT NULL,
    seller_wallet_address TEXT NOT NULL,
    amount_usdc NUMERIC(20, 6) NOT NULL,
    is_locked BOOLEAN DEFAULT TRUE,
    tx_hash_deposit TEXT,
    tx_hash_release TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    performed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
