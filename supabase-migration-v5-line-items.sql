-- ==============================================================================
-- v5_line_items.sql
-- Add line_items column to support multiple invoice items
-- ==============================================================================

-- 1. Add the column
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb NOT NULL;

-- 2. Migrate existing single-item data into the line_items JSONB array
-- We create an array with a single object containing the existing title, description, and amount.
UPDATE public.invoices
SET line_items = jsonb_build_array(
    jsonb_build_object(
        'name', COALESCE(title, 'Professional Services'),
        'description', description,
        'quantity', 1,
        'rate', amount,
        'total', amount
    )
)
WHERE line_items = '[]'::jsonb AND amount > 0;

-- 3. (Optional) We can keep `title`, `description`, and `amount` columns for backward compatibility 
-- or general invoice-level metadata (e.g. invoice total amount, invoice short title).
-- The `amount` column will now represent the invoice TOTAL amount, which makes sense.
