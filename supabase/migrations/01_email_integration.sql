-- Table to store OAuth connections for Google Gmail
CREATE TABLE IF NOT EXISTS email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp')),
  email_address TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS for email_connections
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to manage their own connections
CREATE POLICY "Users can manage their own email connections" ON email_connections
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Table to store message history (Email reminders and replies)
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  invoice_id UUID REFERENCES invoices NOT NULL,
  client_id UUID REFERENCES clients NOT NULL,
  gmail_message_id TEXT, -- Google-assigned message id for threading
  gmail_thread_id TEXT,  -- Google-assigned thread id
  direction TEXT CHECK (direction IN ('outbound', 'inbound')),
  subject TEXT,
  body_text TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for email_messages
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own messages
CREATE POLICY "Users can view their own email messages" ON email_messages
  FOR ALL TO authenticated USING (auth.uid() = user_id);
