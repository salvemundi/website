import { createHash } from 'node:crypto';
import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { connectionString, directusConfig } from './local-env.mjs';
import * as data from './seed-data.mjs';

const nextDataCache = resolve(dirname(fileURLToPath(import.meta.url)), '../../../apps/frontend/.next/dev/cache/fetch-cache');
const SEED_EMAIL_DOMAIN = 'seed.salvemundi.test';
const IMPORT_CONCURRENCY = 6;

const seededTables = [
    'committees', 'committee_members', 'events', 'Board', 'Board_Members', 'clubs', 'safe_havens', 'sponsors',
    'documents', 'hero_banners', 'webshop_drop_windows', 'webshop_products', 'webshop_product_variants',
    'webshop_product_media', 'vacancy_ict_directions', 'vacancies', 'vacancy_direction_links', 'trips',
    'trip_activities', 'pub_crawl_events', 'intro_planning', 'intro_blogs', 'intro_settings', 'whatsapp_groups',
    'Stickers', 'coupons', 'feature_flags',
];

function seedUserId(email) {
    const hex = createHash('sha1').update(email).digest('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function seedEmail(name) {
    const local = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, '.');
    return `${local}@${SEED_EMAIL_DOMAIN}`;
}

function collectAssetIds() {
    const ids = [
        ...data.people.map((p) => p.avatar),
        ...data.committees.map((c) => c.image),
        ...data.events.map((e) => e.image),
        ...data.clubs.map((c) => c.image),
        ...data.safeHavens.map((s) => s.image),
        ...data.sponsors.map((s) => s.image),
        ...data.documents.map((d) => d.file),
        ...data.heroBanners.map((b) => b.image),
        ...data.products.flatMap((p) => p.media),
        ...data.introBlogs.map((b) => b.image),
        data.trip.image,
        data.pubCrawl.image,
    ];
    return [...new Set(ids.filter(Boolean))];
}

async function importAsset(directus, id) {
    const response = await fetch(`${directus.url}/files/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${directus.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${data.SOURCE_ASSET_URL}/${id}`, data: { id } }),
    });
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
}

// Directus keeps the id we pass, so the seed can reference the same asset ids as production.
async function importAssets(sql) {
    const wanted = collectAssetIds();
    const existing = new Set((await sql`SELECT id FROM directus_files WHERE id = ANY(${wanted}::uuid[])`).map((row) => row.id));
    const missing = wanted.filter((id) => !existing.has(id));
    if (missing.length > 0) console.log(`Importing ${missing.length} of ${wanted.length} images from salvemundi.nl...`);

    const directus = directusConfig();
    const failed = new Set();
    const queue = [...missing];
    await Promise.all(Array.from({ length: IMPORT_CONCURRENCY }, async () => {
        for (let id = queue.shift(); id; id = queue.shift()) {
            try {
                await importAsset(directus, id);
            } catch (error) {
                failed.add(id);
                console.warn(`  Could not import ${id}: ${error.message}`);
            }
        }
    }));

    const available = new Set(wanted.filter((id) => !failed.has(id)));
    return (id) => (id && available.has(id) ? id : null);
}

async function seedUsers(tx, asset) {
    const boardMembers = new Set(data.committees.find((c) => c.name === 'Bestuur').members);
    const users = data.people.map((person) => {
        const [first_name, ...rest] = person.name.split(' ');
        const email = seedEmail(person.name);
        return {
            id: seedUserId(email),
            first_name,
            last_name: rest.join(' '),
            name: person.name,
            email,
            avatar: asset(person.avatar),
            title: boardMembers.has(person.name) ? data.boardTitles[person.name] : null,
            status: 'active',
            membership_status: 'active',
            membership_expiry: '2027-09-01',
            emailverified: true,
        };
    });

    await tx`DELETE FROM directus_users WHERE email LIKE ${`%@${SEED_EMAIL_DOMAIN}`}`;
    await tx`INSERT INTO directus_users ${tx(users)}`;
    return new Map(users.map((user) => [user.name, user.id]));
}

async function seedCommittees(tx, asset, userIds) {
    for (const committee of data.committees) {
        const [{ id }] = await tx`INSERT INTO committees ${tx({
            name: committee.name,
            commissie_token: committee.token,
            email: committee.email,
            image: asset(committee.image),
            short_description: committee.short_description,
            description: committee.description,
            is_visible: true,
        })} RETURNING id`;
        await tx`INSERT INTO committee_members ${tx(committee.members.map((name) => ({
            committee_id: id,
            user_id: userIds.get(name),
            is_leader: committee.leaders.includes(name),
            is_visible: true,
        })))}`;
    }
    return new Map((await tx`SELECT id, name FROM committees`).map((row) => [row.name, row.id]));
}

async function seedBoards(tx, userIds) {
    for (const board of [...data.pastBoards].reverse()) {
        const [{ id }] = await tx`INSERT INTO "Board" ${tx({ naam: board.naam, year: board.year, date_created: new Date() })} RETURNING id`;
        await tx`INSERT INTO "Board_Members" ${tx(board.members.map(([name, functie]) => ({
            board_id: id,
            name,
            functie,
            user_id: userIds.get(name) ?? null,
            date_created: new Date(),
        })))}`;
    }
}

async function seedEvents(tx, asset, committeeIds) {
    await tx`INSERT INTO events ${tx(data.events.map((event) => ({
        name: event.name,
        committee_id: committeeIds.get(event.committee),
        event_date: event.event_date,
        event_date_end: event.event_date_end ?? null,
        event_time: event.event_time,
        event_time_end: event.event_time_end,
        location: event.location,
        price_members: event.price_members,
        price_non_members: event.price_non_members,
        contact: event.contact,
        image: asset(event.image),
        short_description: event.short_description,
        description: event.description,
        registration_deadline: `${event.event_date}T12:00:00+01:00`,
        status: 'published',
        publish_date: new Date(),
    })))}`;
}

async function seedPublicContent(tx, asset, userIds) {
    await tx`INSERT INTO clubs ${tx(data.clubs.map((club) => ({
        name: club.name,
        description: club.description,
        image: asset(club.image),
        discord_link: club.discord_link ?? null,
    })))}`;

    await tx`INSERT INTO safe_havens ${tx(data.safeHavens.map((haven, index) => ({
        contact_name: haven.name,
        image: asset(haven.image),
        user_id: userIds.get(haven.name),
        email: seedEmail(haven.name),
        phone_number: `+3160000000${index + 1}`,
    })))}`;

    await tx`INSERT INTO sponsors ${tx(data.sponsors.map((sponsor) => ({ website_url: sponsor.website_url, image: asset(sponsor.image), dark_bg: false })))}`;

    await tx`INSERT INTO documents ${tx(data.documents.map((doc, index) => ({
        title: doc.title,
        category: doc.category,
        file: asset(doc.file),
        display_order: index,
    })))}`;

    await tx`INSERT INTO hero_banners ${tx(data.heroBanners.map((banner, index) => ({
        title: banner.title,
        image: asset(banner.image),
        sort: index,
        date_created: new Date(),
    })))}`;

    await tx`INSERT INTO "Stickers" ${tx(data.stickers.map((sticker) => ({
        ...sticker,
        status: 'published',
        user_created: userIds.get('Daan Dekker'),
        date_created: new Date(),
    })))}`;
}

async function seedWebshop(tx, asset) {
    const [{ id: dropWindowId }] = await tx`INSERT INTO webshop_drop_windows ${tx({
        name: 'Mokken drop winter 2026',
        status: 'open',
        opens_at: '2026-11-01T00:00:00+01:00',
        closes_at: '2027-01-31T23:59:00+01:00',
    })} RETURNING id`;

    for (const [index, product] of data.products.entries()) {
        const [{ id }] = await tx`INSERT INTO webshop_products ${tx({
            name: product.name,
            slug: product.slug,
            type: product.type,
            price: product.price,
            deposit_amount: 0,
            description: product.description,
            display_order: index,
            drop_window_id: product.dropWindow ? dropWindowId : null,
            custom_fields: product.custom_fields ? tx.json(product.custom_fields) : null,
            is_active: true,
        })} RETURNING id`;

        const media = product.media.map(asset).filter(Boolean);
        if (media.length > 0) {
            await tx`INSERT INTO webshop_product_media ${tx(media.map((assetId, order) => ({ product_id: id, asset: assetId, display_order: order })))}`;
        }
        if (product.variants.length > 0) {
            await tx`INSERT INTO webshop_product_variants ${tx(product.variants.map((variant, order) => ({
                product_id: id,
                size: variant.size,
                sku: `${product.slug}-${order}`,
                display_order: order,
            })))}`;
        }
    }
}

async function seedVacancies(tx) {
    const directionRows = await tx`INSERT INTO vacancy_ict_directions ${tx(data.vacancyDirections.map((name) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z]+/g, '-'),
    })))} RETURNING id, name`;
    const directionIds = new Map(directionRows.map((row) => [row.name, row.id]));

    for (const { directions, skills, ...vacancy } of data.vacancies) {
        const [{ id }] = await tx`INSERT INTO vacancies ${tx({
            ...vacancy,
            skills: tx.json(skills),
            is_visible: true,
            created_at: new Date(),
            published_at: new Date(),
        })} RETURNING id`;
        await tx`INSERT INTO vacancy_direction_links ${tx(directions.map((name) => ({ vacancies_id: id, vacancy_ict_directions_id: directionIds.get(name) })))}`;
    }
}

async function seedTripAndPubCrawl(tx, asset) {
    const { activities, ...trip } = data.trip;
    const [{ id: tripId }] = await tx`INSERT INTO trips ${tx({
        ...trip,
        image: asset(trip.image),
        status: 'published',
        registration_open: true,
        is_bus_trip: true,
        allow_deposit_payments: true,
        allow_final_payments: false,
        created_at: new Date(),
    })} RETURNING id`;
    await tx`INSERT INTO trip_activities ${tx(activities.map((activity, index) => ({
        trip_id: tripId,
        name: activity.name,
        description: activity.description,
        price: activity.price,
        max_participants: activity.max_participants,
        options: tx.json(activity.options ?? []),
        max_selections: activity.max_selections ?? null,
        is_active: true,
        display_order: index,
        created_at: new Date(),
    })))}`;

    await tx`INSERT INTO pub_crawl_events ${tx({
        ...data.pubCrawl,
        image: asset(data.pubCrawl.image),
        groups: tx.json(data.pubCrawl.groups),
    })}`;
}

async function seedIntro(tx, asset, userIds) {
    const author = userIds.get('Fenna de Groot');
    await tx`INSERT INTO intro_settings ${tx({ student_signups_open: true, parent_signups_open: true, attendance_visible: false })}`;
    await tx`INSERT INTO intro_planning ${tx(data.introPlanning.map((item) => ({ ...item, status: 'published', user_created: author })))}`;
    await tx`INSERT INTO intro_blogs ${tx(data.introBlogs.map((blog, index) => ({
        ...blog,
        image: asset(blog.image),
        status: 'published',
        is_published: true,
        sort: index,
        user_created: author,
        created_at: new Date(Date.now() - (data.introBlogs.length - index) * 86_400_000),
    })))}`;
    await tx`INSERT INTO whatsapp_groups ${tx(data.whatsappGroups.map((group) => ({ ...group, is_active: true })))}`;
}

async function main() {
    const sql = postgres(connectionString(), { max: 4, onnotice: () => {} });
    try {
        const [{ ready }] = await sql`SELECT to_regclass('public.events') IS NOT NULL AS ready`;
        if (!ready) throw new Error('The app tables do not exist yet. Run `bun run dev:db:init` first.');

        const asset = await importAssets(sql);

        await sql.begin(async (tx) => {
            await tx.unsafe(`TRUNCATE ${seededTables.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`);
            const userIds = await seedUsers(tx, asset);
            const committeeIds = await seedCommittees(tx, asset, userIds);
            await seedBoards(tx, userIds);
            await seedEvents(tx, asset, committeeIds);
            await seedPublicContent(tx, asset, userIds);
            await seedWebshop(tx, asset);
            await seedVacancies(tx);
            await seedTripAndPubCrawl(tx, asset);
            await seedIntro(tx, asset, userIds);
            await tx`INSERT INTO coupons ${tx(data.coupons.map((coupon) => ({ ...coupon, is_active: true, date_created: new Date() })))}`;
            await tx`INSERT INTO feature_flags ${tx(data.featureFlags)}`;
        });

        // unstable_cache would otherwise keep serving the pre-seed (often empty) results for up to an hour.
        rmSync(nextDataCache, { recursive: true, force: true });

        console.log('Local database seeded.');
        // A running dev server also holds unstable_cache entries in memory, which the rmSync above can't reach.
        console.log('Restart `bun run dev` if it is running, otherwise cached pages may still show the old data.');
    } finally {
        await sql.end();
    }
}

await main();
