-- Allow user deletion (GDPR "delete my account") to cascade to the generations ledger.
--
-- generations.user_id was created with the default ON DELETE NO ACTION, so deleting
-- an auth.users row failed with:
--   update or delete on table "users" violates foreign key constraint
--   "generations_user_id_fkey" on table "generations" (SQLSTATE 23503)
--
-- The column is NOT NULL, so SET NULL is not viable. Every other user-linked table
-- (subscriptions, user_roles, churches, comp_code_redemptions, ...) already cascades;
-- bring the generations ledger into line so account deletion succeeds.

alter table public.generations
  drop constraint generations_user_id_fkey,
  add constraint generations_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
