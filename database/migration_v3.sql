-- ============================================================
-- MEROO.GI - DATABASE MIGRATION v3.0
-- Fixes: Service Delete Bug, Worker Progress Edit, Admin Review CRUD,
--        Google OAuth Metadata, Priority Parameters, Vault, Checklists & Finance
-- ============================================================

-- 1. Update Trigger User Baru agar siap untuk Login via Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, role, phone, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Costumer'
    ),
    NULLIF(LOWER(TRIM(BOTH '@' FROM COALESCE(new.raw_user_meta_data->>'username', ''))), ''),
    COALESCE(new.raw_user_meta_data->>'role', 'consumer'),
    new.raw_user_meta_data->>'phone',
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN new;
END;
$$;

-- 2. Tambah parameter tingkat keahlian pada Services untuk skala prioritas Worker
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS required_seniority TEXT DEFAULT 'junior'
  CHECK (required_seniority IN ('junior', 'mid', 'senior'));

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 3. FIX BUG HAPUS PRODUK YANG SUDAH DI-REVIEW:
--    a) Tambah RLS Policy CRUD penuh untuk Admin di tabel services & categories
--    b) Ubah foreign key reviews.service_id menjadi ON DELETE SET NULL agar riwayat rating worker tidak hilang
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_service_id_fkey;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_service_id_fkey
  FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;

-- 4. Izinkan Worker & Admin mengedit/menghapus Progress Updates jika ada kendala
DROP POLICY IF EXISTS "Workers and admins can update progress" ON public.progress_updates;
CREATE POLICY "Workers and admins can update progress" ON public.progress_updates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = progress_updates.order_id
        AND (orders.worker_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    )
  );

DROP POLICY IF EXISTS "Workers and admins can delete progress" ON public.progress_updates;
CREATE POLICY "Workers and admins can delete progress" ON public.progress_updates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = progress_updates.order_id
        AND (orders.worker_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    )
  );

-- 5. Izinkan Admin mengedit & menghapus Ulasan (Reviews)
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
CREATE POLICY "Admins can update reviews" ON public.reviews
  FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
CREATE POLICY "Admins can delete reviews" ON public.reviews
  FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 6. Encrypted Credential Vault & Jembatan Kode Verifikasi (2FA) via Order Detail
CREATE TABLE IF NOT EXISTS public.order_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  game_uid TEXT NOT NULL,
  login_identifier TEXT NOT NULL,
  encrypted_password TEXT,
  verification_status TEXT DEFAULT 'idle' CHECK (verification_status IN ('idle', 'waiting_code', 'submitted', 'verified')),
  verification_code TEXT,
  last_accessed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.order_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view credential status" ON public.order_credentials;
CREATE POLICY "Participants can view credential status" ON public.order_credentials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_credentials.order_id
        AND (orders.consumer_id = auth.uid() OR orders.worker_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    )
  );

CREATE OR REPLACE FUNCTION wipe_completed_order_credentials()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') THEN
    UPDATE public.order_credentials
    SET encrypted_password = NULL,
        verification_code = NULL,
        verification_status = 'idle',
        updated_at = NOW()
    WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_wipe_order_credentials ON public.orders;
CREATE TRIGGER trigger_wipe_order_credentials
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION wipe_completed_order_credentials();

-- 7. Checklist Harian / Mingguan / Bulanan & Kalender Tracking Worker
CREATE TABLE IF NOT EXISTS public.order_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cadence TEXT DEFAULT 'daily' CHECK (cadence IN ('daily', 'weekly', 'monthly', 'custom')),
  task_key TEXT NOT NULL,
  task_label TEXT NOT NULL,
  target_detail TEXT,
  is_done BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklists_order_date ON public.order_checklists(order_id, task_date);
ALTER TABLE public.order_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view checklists" ON public.order_checklists;
CREATE POLICY "Participants can view checklists" ON public.order_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_checklists.order_id
        AND (orders.consumer_id = auth.uid() OR orders.worker_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    )
  );

DROP POLICY IF EXISTS "Workers and admins can manage checklists" ON public.order_checklists;
CREATE POLICY "Workers and admins can manage checklists" ON public.order_checklists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_checklists.order_id
        AND (orders.worker_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    )
  );

-- 8. Manajemen Keuangan & Pembagian Uang (Worker / Admin / Kas Studio)
CREATE TABLE IF NOT EXISTS public.finance_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  worker_share_pct NUMERIC NOT NULL DEFAULT 75.0,
  admin_share_pct NUMERIC NOT NULL DEFAULT 15.0,
  studio_treasury_pct NUMERIC NOT NULL DEFAULT 10.0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.finance_settings (id, worker_share_pct, admin_share_pct, studio_treasury_pct)
VALUES (1, 75.0, 15.0, 10.0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.financial_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  gross_amount INTEGER NOT NULL,
  worker_amount INTEGER NOT NULL,
  admin_amount INTEGER NOT NULL,
  treasury_amount INTEGER NOT NULL,
  payout_status TEXT DEFAULT 'unpaid' CHECK (payout_status IN ('unpaid', 'paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and workers can view allocations" ON public.financial_allocations;
CREATE POLICY "Admin and workers can view allocations" ON public.financial_allocations
  FOR SELECT USING (
    worker_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can manage allocations" ON public.financial_allocations;
CREATE POLICY "Admins can manage allocations" ON public.financial_allocations
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');