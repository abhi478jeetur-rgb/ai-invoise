-- V8: Security Audit Fixes

-- 1. Restrict Currency to valid ISO codes to prevent payload tampering
ALTER TABLE invoices
ADD CONSTRAINT valid_currency 
CHECK (currency IN ('USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY'));
