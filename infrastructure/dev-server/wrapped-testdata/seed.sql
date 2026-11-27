-- Samu Wrapped-testdata voor één dev-gebruiker (jaar 2026).
-- Alleen voor de dev-database. Gebruik via de workflow "Dev Wrapped test data".
-- Verwacht psql-variabele :email. cleanup.sql wordt er altijd vóór uitgevoerd.
--
-- Wat deze data moet opleveren:
--   slides: activiteiten (+ snelste aanmelding), op rij, heatmap, ritme, favoriete commissie,
--           kroegentocht, stickers, reizen, merch, commissies, Samu in totaal, quiz, badges
--   badges: Snelle Jelle, Binnen 5 minuten, Early Bird, Last Minute Larry, Nachtbraker, On Fire,
--           Commissie-hopper, Verste Sticker, Buurtbaas, Stickeren om 3 uur, Pionier,
--           Chauffeur, Direct Betaald, Extra Bagage
--   (Veteraan/Groentje hangen af van de echte lidmaatschapsgegevens en worden niet gezet.)

SELECT set_config('wrapped.email', lower(:'email'), false);

DO $$
DECLARE
    v_email text := current_setting('wrapped.email');
    v_user uuid;
    v_first text;
    v_last text;
    v_name text;
    v_comm int[] := '{}';
    v_cnames text[] := ARRAY['Feestcommissie', 'Activiteitencommissie', 'Sportcommissie', 'Cultuurcommissie', 'Studiecommissie'];
    v_titles text[] := ARRAY['Borrel', 'Pubquiz', 'Bowlen', 'Lasergamen', 'Gala', 'Spelavond', 'Karaoke', 'BBQ', 'Escape room',
                             'Filmavond', 'Workshop', 'Poolen', 'Beerpong', 'Klimmen', 'Schaatsen', 'Cantus', 'Hackathon', 'Pannenkoeken',
                             'Kerstdiner', 'Silent disco', 'Bierproeverij', 'Sinterklaas', 'Casino-avond', 'Eindfeest'];
    v_locations text[] := ARRAY['Rachelsmolen', 'Stratumseind', 'Café Wilhelmina', 'Strijp-S', 'De Bunker'];
    v_dates date[] := '{}';
    v_run_start date;
    v_date date;
    v_id int;
    v_event int;
    v_pub timestamp;           -- publish_date: timestamp zonder tijdzone, in UTC
    v_deadline timestamptz;
    v_signup timestamptz;
    v_base timestamptz;
    v_preorder int;
    v_trip int;
    v_trip_signup int;
    v_crawl int;
    v_crawl_signup int;
    k int;
    f int;
BEGIN
    SELECT id, COALESCE(first_name, 'Test'), COALESCE(last_name, 'Gebruiker')
      INTO v_user, v_first, v_last
      FROM directus_users WHERE lower(email) = v_email LIMIT 1;
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Geen directus_users-rij met e-mail %', v_email;
    END IF;
    v_name := v_first || ' ' || v_last;

    -- ── Commissies ──────────────────────────────────────────────────
    FOR k IN 1..5 LOOP
        INSERT INTO committees (name, is_visible) VALUES ('[TEST WRAPPED] ' || v_cnames[k], false) RETURNING id INTO v_id;
        v_comm := v_comm || v_id;
    END LOOP;
    INSERT INTO committee_members (committee_id, user_id, is_leader, is_visible) VALUES
        (v_comm[1], v_user, true, true),
        (v_comm[2], v_user, false, true);

    -- ── Datums kiezen ───────────────────────────────────────────────
    -- 18 activiteiten verspreid over het jaar, op dagen zonder bestaande gepubliceerde activiteit
    FOR k IN 0..17 LOOP
        v_date := date '2026-01-12' + k * 17;
        WHILE EXISTS (SELECT 1 FROM events WHERE event_date = v_date AND status = 'published') LOOP
            v_date := v_date + 1;
        END LOOP;
        v_dates := v_dates || v_date;
    END LOOP;
    -- 6 activiteiten op opeenvolgende dagen in een venster zonder andere activiteiten (voor "op rij")
    v_run_start := date '2026-11-02';
    WHILE EXISTS (SELECT 1 FROM events WHERE status = 'published' AND event_date BETWEEN v_run_start AND v_run_start + 5) LOOP
        v_run_start := v_run_start + 1;
    END LOOP;
    FOR k IN 0..5 LOOP
        v_dates := v_dates || (v_run_start + k);
    END LOOP;

    -- ── Activiteiten + aanmeldingen ─────────────────────────────────
    FOR k IN 1..24 LOOP
        v_pub := (v_dates[k] - 3) + time '12:00';
        v_deadline := ((v_dates[k] - 1) + time '23:00') AT TIME ZONE 'Europe/Amsterdam';

        INSERT INTO events (name, event_date, event_time, event_time_end, location, committee_id, status,
                            publish_date, registration_deadline, price_members, price_non_members, created_at)
        VALUES ('[TEST WRAPPED] ' || v_titles[k], v_dates[k], time '20:00', time '23:30',
                v_locations[1 + (k % 5)], v_comm[1 + (k % 5)], 'published',
                v_pub, v_deadline, 5, 8, (v_pub AT TIME ZONE 'UTC') - interval '2 days')
        RETURNING id INTO v_event;

        -- Activiteit 5 en 10 slaat de gebruiker over (anders is alles één lange reeks)
        IF k IN (5, 10) THEN
            v_signup := NULL;
        ELSIF k IN (1, 2, 3) THEN
            v_signup := (v_pub AT TIME ZONE 'UTC') + k * interval '70 seconds';               -- binnen 5 minuten
        ELSIF k IN (4, 6, 7) THEN
            v_signup := ((v_dates[k] - 2) + time '02:30') AT TIME ZONE 'Europe/Amsterdam';    -- nachtbraker
        ELSIF k IN (8, 9) THEN
            v_signup := v_deadline - interval '25 minutes';                                    -- last minute
        ELSE
            v_signup := (v_pub AT TIME ZONE 'UTC') + (1 + k % 6) * interval '1 hour';
        END IF;

        IF v_signup IS NOT NULL THEN
            INSERT INTO event_signups (event_id, participant_name, participant_email, directus_relations,
                                       payment_status, is_member, created_at, checked_in, checked_in_at)
            VALUES (v_event, v_name, v_email, v_user, 'paid', true, v_signup,
                    v_dates[k] < current_date AND k % 4 <> 0,
                    CASE WHEN v_dates[k] < current_date AND k % 4 <> 0 THEN (v_dates[k] + time '19:05') END);
        END IF;

        -- Andere (nep)deelnemers, altijd ná de gebruiker zodat die steeds de eerste is (Snelle Jelle)
        v_base := COALESCE(v_signup, (v_pub AT TIME ZONE 'UTC') + interval '1 hour');
        FOR f IN 1..(2 + k % 4) LOOP
            INSERT INTO event_signups (event_id, participant_name, participant_email, payment_status, is_member, created_at)
            VALUES (v_event, 'Testdeelnemer ' || f, 'test-wrapped-' || f || '@example.invalid', 'paid', true,
                    v_base + f * interval '7 minutes');
        END LOOP;

        INSERT INTO transactions (user_id, email, first_name, last_name, product_name, product_type, amount,
                                  payment_status, mollie_id, created_at)
        SELECT v_user, v_email, v_first, v_last, '[TEST WRAPPED] ' || v_titles[k], 'event', 5,
               'paid', 'tr_testwrapped_event_' || k, v_signup
        WHERE v_signup IS NOT NULL;
    END LOOP;

    -- ── Kroegentochten ──────────────────────────────────────────────
    FOR k IN 1..2 LOOP
        INSERT INTO pub_crawl_events (name, email, date)
        VALUES ('[TEST WRAPPED] Kroegentocht ' || k, 'test-wrapped@example.invalid',
                CASE k WHEN 1 THEN timestamp '2026-03-12 20:00' ELSE timestamp '2026-10-15 20:00' END)
        RETURNING id INTO v_crawl;
        INSERT INTO pub_crawl_signups (pub_crawl_event_id, email, name, amount_tickets, payment_status,
                                       directus_relations, is_member, group_name, created_at)
        VALUES (v_crawl, v_email, v_name, CASE k WHEN 1 THEN 4 ELSE 1 END, 'paid', v_user, true, 'De Testers',
                CASE k WHEN 1 THEN timestamptz '2026-02-20 18:00+01' ELSE timestamptz '2026-09-30 18:00+02' END)
        RETURNING id INTO v_crawl_signup;
        INSERT INTO transactions (user_id, email, first_name, last_name, product_name, product_type, amount,
                                  payment_status, mollie_id, pub_crawl_signup, created_at)
        VALUES (v_user, v_email, v_first, v_last, '[TEST WRAPPED] Kroegentocht ' || k, 'pub_crawl',
                CASE k WHEN 1 THEN 20 ELSE 5 END, 'paid', 'tr_testwrapped_crawl_' || k, v_crawl_signup,
                CASE k WHEN 1 THEN timestamptz '2026-02-20 18:00+01' ELSE timestamptz '2026-09-30 18:00+02' END);
    END LOOP;

    -- ── Stickers ────────────────────────────────────────────────────
    INSERT INTO "Stickers" (user_created, date_created, location_name, latitude, longitude, city, country, status) VALUES
        -- binnen 1 km van Fontys Rachelsmolen (Buurtbaas)
        (v_user, timestamptz '2026-01-20 14:10+01', '[TEST WRAPPED] Lantaarnpaal R1',   51.4515, 5.4805, 'Eindhoven', 'Netherlands', 'published'),
        (v_user, timestamptz '2026-02-03 12:30+01', '[TEST WRAPPED] Fietsenstalling',   51.4520, 5.4790, 'Eindhoven', 'Netherlands', 'published'),
        (v_user, timestamptz '2026-03-17 16:45+01', '[TEST WRAPPED] Bushalte',          51.4505, 5.4815, 'Eindhoven', 'Netherlands', 'published'),
        (v_user, timestamptz '2026-05-08 11:00+02', '[TEST WRAPPED] Kantine',           51.4498, 5.4782, 'Eindhoven', 'Netherlands', 'published'),
        -- midden in de nacht (Stickeren om 3 uur)
        (v_user, timestamptz '2026-03-14 02:40+01', '[TEST WRAPPED] Stratumseind',      51.4405, 5.4800, 'Eindhoven', 'Netherlands', 'published'),
        -- andere steden en landen
        (v_user, timestamptz '2026-04-02 15:00+02', '[TEST WRAPPED] Centraal Station',  52.3791, 4.9003, 'Amsterdam', 'Netherlands', 'published'),
        (v_user, timestamptz '2026-04-25 13:20+02', '[TEST WRAPPED] Domplein',          52.0908, 5.1222, 'Utrecht',   'Netherlands', 'published'),
        (v_user, timestamptz '2026-06-11 17:05+02', '[TEST WRAPPED] Grote Markt',       51.2213, 4.3997, 'Antwerpen', 'Belgium',     'published'),
        (v_user, timestamptz '2026-07-19 10:30+02', '[TEST WRAPPED] Praça do Comércio', 38.7077, -9.1365, 'Lisboa',   'Portugal',    'published'),
        (v_user, timestamptz '2026-08-03 21:15+02', '[TEST WRAPPED] Sagrada Família',   41.4036, 2.1744, 'Barcelona', 'Spain',       'published'),
        -- ver weg en een plek zonder eerdere stickers (Verste Sticker + Pionier)
        (v_user, timestamptz '2026-08-22 09:00+02', '[TEST WRAPPED] Fin del Mundo',     -54.8019, -68.3030, 'Ushuaia', 'Argentina',  'published'),
        (v_user, timestamptz '2026-09-09 14:00+02', '[TEST WRAPPED] Collegezaal',       51.4512, 5.4799, 'Eindhoven', 'Netherlands', 'published');

    -- ── Reis ────────────────────────────────────────────────────────
    INSERT INTO trips (name, status, start_date, end_date, base_price, deposit_amount, is_bus_trip, created_at)
    VALUES ('[TEST WRAPPED] Skireis', 'published', date '2026-02-14', date '2026-02-21', 450, 100, true, date '2025-11-01')
    RETURNING id INTO v_trip;
    INSERT INTO trip_signups (trip_id, first_name, last_name, email, directus_relations, role, status,
                              willing_to_drive, extra_luggage, deposit_paid, deposit_paid_at, terms_accepted, created_at)
    VALUES (v_trip, v_first, v_last, v_email, v_user, 'participant', 'confirmed',
            true, true, true, timestamp '2026-01-05 09:20', true, timestamptz '2026-01-05 09:00+00')
    RETURNING id INTO v_trip_signup;
    INSERT INTO transactions (user_id, email, first_name, last_name, product_name, product_type, amount,
                              payment_status, mollie_id, trip_signup, created_at)
    VALUES (v_user, v_email, v_first, v_last, '[TEST WRAPPED] Skireis aanbetaling', 'trip', 100,
            'paid', 'tr_testwrapped_trip_1', v_trip_signup, timestamptz '2026-01-05 09:20+00');

    -- ── Webshop ─────────────────────────────────────────────────────
    INSERT INTO webshop_preorders (user_id, first_name, last_name, email, subtotal_amount, deposit_amount,
                                   deposit_paid, terms_accepted, created_at)
    VALUES (v_user, v_first, v_last, v_email, 65, 20, true, true, timestamptz '2026-04-10 19:00+02')
    RETURNING id INTO v_preorder;
    INSERT INTO webshop_preorder_lines (preorder_id, quantity, unit_price, product_name_snapshot) VALUES
        (v_preorder, 2, 25, '[TEST WRAPPED] Hoodie'),
        (v_preorder, 1, 15, '[TEST WRAPPED] Sokken');

    RAISE NOTICE 'Wrapped-testdata aangemaakt voor % (%): 24 activiteiten (reeks vanaf %), 2 kroegentochten, 12 stickers, 1 reis, 3 webshop-items',
        v_email, v_user, v_run_start;
END $$;
