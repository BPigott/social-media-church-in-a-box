-- Hotfix applied directly to production (2026-06-01): the "already redeemed" check must run
-- BEFORE the active/expiry/exhausted state checks, so a returning redeemer who is already
-- exempt always gets a success response even if the code has since been deactivated, expired,
-- or exhausted. 20260601090800_add_comp_codes already reflects this final ordering for fresh
-- installs; this migration exists so git history matches production's migration_history.

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
