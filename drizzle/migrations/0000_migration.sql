CREATE TABLE public.client_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  message text NOT NULL,
  stack text,
  url text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.client_error_logs TO authenticated;
GRANT ALL ON public.client_error_logs TO service_role;
ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users log own errors" ON public.client_error_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND length(message) <= 2000);
CREATE POLICY "Admins read errors" ON public.client_error_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX ON public.client_error_logs (created_at DESC);