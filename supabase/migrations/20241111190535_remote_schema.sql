drop policy "Enable insert for admin only" on "public"."report_admin";

create policy "Enable insert for authenticated user only"
on "public"."report_admin"
as permissive
for insert
to authenticated
with check ((requesting_user_id() = user_id));



