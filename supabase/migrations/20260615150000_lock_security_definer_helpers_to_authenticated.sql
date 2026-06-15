-- Lock internal SECURITY DEFINER helpers to signed-in callers only.
--
-- get_user_churches / has_role / user_owns_church run with definer rights and
-- bypass RLS, and are parameterised by an arbitrary user_id. They are only ever
-- invoked from RLS policies (all scoped TO authenticated) or by signed-in users
-- acting on their own id (e.g. the useChurch hook calling get_user_churches).
--
-- By default Postgres grants EXECUTE to PUBLIC, so the anon role could call them
-- directly via PostgREST and, knowing a target user's UUID, learn that user's
-- church memberships/roles. Revoke from PUBLIC and grant back only to the roles
-- that legitimately need them.

REVOKE EXECUTE ON FUNCTION public.get_user_churches(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_owns_church(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_user_churches(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_owns_church(uuid, uuid) TO authenticated, service_role;
