-- migration 0026 — helper for generating random lifetime Nest promo codes

drop function if exists public.generate_lifetime_promo_codes(integer, text, text, integer, timestamptz);

create or replace function public.generate_lifetime_promo_codes(
  code_count integer default 1,
  code_prefix text default 'ROOST',
  code_description text default 'Lifetime Nest promo code',
  code_max_redemptions integer default 1,
  code_expires_at timestamptz default null
)
returns table (
  promo_id uuid,
  promo_code text,
  promo_description text,
  promo_max_redemptions integer,
  promo_expires_at timestamptz,
  promo_created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  alphabet_length integer := length(alphabet);
  generated_code text;
  inserted_id uuid;
  inserted_code text;
  inserted_description text;
  inserted_max_redemptions integer;
  inserted_expires_at timestamptz;
  inserted_created_at timestamptz;
  created_total integer := 0;
  i integer;
begin
  if code_count < 1 then
    raise exception 'code_count must be at least 1';
  end if;

  if code_max_redemptions < 1 then
    raise exception 'code_max_redemptions must be at least 1';
  end if;

  while created_total < code_count loop
    loop
      generated_code := upper(trim(code_prefix)) || '-';

      for i in 1..12 loop
        generated_code := generated_code || substr(alphabet, 1 + floor(random() * alphabet_length)::integer, 1);

        if i in (4, 8) then
          generated_code := generated_code || '-';
        end if;
      end loop;

      insert into public.promo_codes (
        code,
        description,
        type,
        max_redemptions,
        expires_at
      )
      values (
        generated_code,
        code_description,
        'lifetime_nest',
        code_max_redemptions,
        code_expires_at
      )
      on conflict (code) do nothing
      returning
        promo_codes.id,
        promo_codes.code,
        promo_codes.description,
        promo_codes.max_redemptions,
        promo_codes.expires_at,
        promo_codes.created_at
      into
        inserted_id,
        inserted_code,
        inserted_description,
        inserted_max_redemptions,
        inserted_expires_at,
        inserted_created_at;

      exit when inserted_id is not null;
    end loop;

    promo_id := inserted_id;
    promo_code := inserted_code;
    promo_description := inserted_description;
    promo_max_redemptions := inserted_max_redemptions;
    promo_expires_at := inserted_expires_at;
    promo_created_at := inserted_created_at;

    return next;

    inserted_id := null;
    inserted_code := null;
    inserted_description := null;
    inserted_max_redemptions := null;
    inserted_expires_at := null;
    inserted_created_at := null;
    created_total := created_total + 1;
  end loop;
end;
$$;

revoke all on function public.generate_lifetime_promo_codes(integer, text, text, integer, timestamptz) from public;
revoke all on function public.generate_lifetime_promo_codes(integer, text, text, integer, timestamptz) from anon;
revoke all on function public.generate_lifetime_promo_codes(integer, text, text, integer, timestamptz) from authenticated;
grant execute on function public.generate_lifetime_promo_codes(integer, text, text, integer, timestamptz) to service_role;
