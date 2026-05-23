-- ==============================================================================
-- v4_knowledge_base.sql
-- Create AI Knowledge Base table and configure storage
-- ==============================================================================

-- 1. Create the `user_knowledge_base` table
CREATE TABLE IF NOT EXISTS public.user_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    extracted_text TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own documents
CREATE POLICY "Users can view own knowledge base documents" 
    ON public.user_knowledge_base
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own knowledge base documents" 
    ON public.user_knowledge_base
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own knowledge base documents" 
    ON public.user_knowledge_base
    FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Configure Storage Bucket for ai-knowledge-base
-- Check if bucket exists, insert if not
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-knowledge-base', 'ai-knowledge-base', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Policy: Users can upload to their own folder in ai-knowledge-base
CREATE POLICY "Users can upload knowledge base files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'ai-knowledge-base' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can view their own knowledge base files
CREATE POLICY "Users can view own knowledge base files"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'ai-knowledge-base' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can delete their own knowledge base files
CREATE POLICY "Users can delete own knowledge base files"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'ai-knowledge-base' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
