-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Create Policy for Tenants
-- Assuming 'app.current_tenant' is set by the application for specific queries
-- For now, we allow reading all tenants (public info for login) but restrict modification
CREATE POLICY tenant_isolation_policy ON tenants
    USING (true) -- Everyone can read (for subdomain check)
    WITH CHECK (false); -- No one can modify via API directly (admin only)

-- Create Policy for Shipments
-- Users can only see shipments belonging to the current tenant context
CREATE POLICY shipment_tenant_isolation ON shipments
    USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

-- Note: To test this, you must run:
-- SET app.current_tenant = 'UUID_OF_TENANT';
-- SELECT * FROM shipments;
