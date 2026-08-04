-- VOKRIX RLS TEMPLATE — applied once per product by Build Specialist's brief.
-- Replace {table_name} with the real table for that product.
--
-- RLS only checks customer_id — NOT product_id.
-- product_id is filtered in the dashboard query, not enforced by RLS.
-- Reason: free trial users have no product_id in JWT app_metadata,
-- so checking product_id in RLS blocks them from seeing their own records.

-- 1. Required columns
-- product_id text NOT NULL
-- customer_id uuid NOT NULL

-- 2. Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- 3. Policies — customer sees only their own rows across all products
CREATE POLICY "{table_name}_select" ON {table_name} FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "{table_name}_insert" ON {table_name} FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "{table_name}_update" ON {table_name} FOR UPDATE TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "{table_name}_delete" ON {table_name} FOR DELETE TO authenticated USING (customer_id = auth.uid());

-- 4. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON {table_name} TO authenticated;
GRANT SELECT ON {table_name} TO anon;
GRANT USAGE, SELECT ON SEQUENCE {table_name}_id_seq TO authenticated, service_role;
