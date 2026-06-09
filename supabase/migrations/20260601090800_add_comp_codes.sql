-- Comp codes: Bob mints a code and shares it; a friend redeems it to gain billing exemption.
-- Validation/redemption runs server-side only (service_role), mirroring the subscriptions RLS pattern.

CREATE TABLE public.comp_codes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE,            -- stored normalised (upper/trim)
  note             text,                            -- who/what it's for
  active           boolean NOT NULL DEFAULT true,
  max_redemptions  integer,                         -- NULL = unlimited
  redemption_count integer NOT NULL DEFAULT 0,
  expires_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Audit trail + double-redeem guard
CREATE TABLE public.comp_code_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     uuid NOT NULL REFERENCES public.comp_codes(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code_id, user_id)
);

-- RLS on, with no permissive policies -> only service_role (which bypasses RLS) can read/write.
ALTER TABLE public.comp_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Atomic redemption: lock the code row, validate, record redemption, grant exemption.
CREATE OR REPLACE FUNCTION public.redeem_comp_code(p_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_code public.comp_codes;
BEGIN
  SELECT * INTO v_code FROM public.comp_codes
    WHERE code = upper(trim(p_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid');
  END IF;
  -- A returning redeemer is already exempt: report success regardless of the code's
  -- remaining count or expiry. This must be checked before the state checks below.
  IF EXISTS (
    SELECT 1 FROM public.comp_code_redemptions
    WHERE code_id = v_code.id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_redeemed');
  END IF;
  IF NOT v_code.active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'inactive');
  END IF;
  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;
  IF v_code.max_redemptions IS NOT NULL AND v_code.redemption_count >= v_code.max_redemptions THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'exhausted');
  END IF;

  INSERT INTO public.comp_code_redemptions(code_id, user_id) VALUES (v_code.id, p_user_id);
  UPDATE public.comp_codes SET redemption_count = redemption_count + 1 WHERE id = v_code.id;

  -- subscriptions.user_id is UNIQUE -> upsert grants exemption whether or not a row exists.
  INSERT INTO public.subscriptions(user_id, status, exempt)
    VALUES (p_user_id, 'active', true)
  ON CONFLICT (user_id) DO UPDATE SET exempt = true, status = 'active', updated_at = now();

  RETURN jsonb_build_object('ok', true, 'reason', 'granted');
END;
$$;

-- Only service_role may execute (the edge function calls it). Block direct client access.
REVOKE ALL ON FUNCTION public.redeem_comp_code(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_comp_code(text, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_comp_code(text, uuid) TO service_role;
