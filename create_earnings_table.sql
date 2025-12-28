-- Earnings table for tracking worker rewards
CREATE TABLE IF NOT EXISTS public.earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add proof_image_url to reports table for storing temporary proof during verification
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS proof_image_url TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50); -- 'pending', 'verified', 'rejected'

-- RLS Policies for earnings
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow any select on earnings" ON public.earnings;
CREATE POLICY "Allow any select on earnings" ON public.earnings 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow any insert on earnings" ON public.earnings;
CREATE POLICY "Allow any insert on earnings" ON public.earnings 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow any update on earnings" ON public.earnings;
CREATE POLICY "Allow any update on earnings" ON public.earnings 
FOR UPDATE USING (true) WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_earnings_worker_id ON public.earnings(worker_id);
CREATE INDEX IF NOT EXISTS idx_earnings_report_id ON public.earnings(report_id);
