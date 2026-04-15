-- ============================================================
-- TBO OS — RPCs para incrementar contadores de tracking
-- Feature #90 — Chamadas atômicas de incremento
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_email_send_opens(send_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.email_sends
  SET opened = opened + 1
  WHERE id = send_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_email_send_clicks(send_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.email_sends
  SET clicked = clicked + 1
  WHERE id = send_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
