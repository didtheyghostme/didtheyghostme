create table "public"."user_preference" (
    "id" uuid not null default gen_random_uuid(),
    "preference_key" text not null,
    "preference_value" text not null,
    "user_id" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."user_preference" enable row level security;

CREATE UNIQUE INDEX unique_user_preference ON public.user_preference USING btree (user_id, preference_key, preference_value);

CREATE UNIQUE INDEX user_preference_pkey ON public.user_preference USING btree (id);

alter table "public"."user_preference" add constraint "user_preference_pkey" PRIMARY KEY using index "user_preference_pkey";

alter table "public"."user_preference" add constraint "unique_user_preference" UNIQUE using index "unique_user_preference";

alter table "public"."user_preference" add constraint "user_preference_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_data(user_id) not valid;

alter table "public"."user_preference" validate constraint "user_preference_user_id_fkey";

grant delete on table "public"."user_preference" to "anon";

grant insert on table "public"."user_preference" to "anon";

grant references on table "public"."user_preference" to "anon";

grant select on table "public"."user_preference" to "anon";

grant trigger on table "public"."user_preference" to "anon";

grant truncate on table "public"."user_preference" to "anon";

grant update on table "public"."user_preference" to "anon";

grant delete on table "public"."user_preference" to "authenticated";

grant insert on table "public"."user_preference" to "authenticated";

grant references on table "public"."user_preference" to "authenticated";

grant select on table "public"."user_preference" to "authenticated";

grant trigger on table "public"."user_preference" to "authenticated";

grant truncate on table "public"."user_preference" to "authenticated";

grant update on table "public"."user_preference" to "authenticated";

grant delete on table "public"."user_preference" to "service_role";

grant insert on table "public"."user_preference" to "service_role";

grant references on table "public"."user_preference" to "service_role";

grant select on table "public"."user_preference" to "service_role";

grant trigger on table "public"."user_preference" to "service_role";

grant truncate on table "public"."user_preference" to "service_role";

grant update on table "public"."user_preference" to "service_role";

create policy "Enable delete for users based on user_id authenticated"
on "public"."user_preference"
as permissive
for delete
to authenticated
using ((requesting_user_id() = user_id));


create policy "Enable insert for authenticated users only"
on "public"."user_preference"
as permissive
for insert
to authenticated
with check ((requesting_user_id() = user_id));


create policy "Enable users to view their own data only authenticated"
on "public"."user_preference"
as permissive
for select
to authenticated
using ((requesting_user_id() = user_id));



