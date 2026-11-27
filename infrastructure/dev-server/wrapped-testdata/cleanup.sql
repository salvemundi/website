-- Verwijdert alle Samu Wrapped-testdata uit de dev-database.
-- Herkenbaar aan de marker "[TEST WRAPPED]" (namen) of "tr_testwrapped_" (mollie_id).
-- Raakt geen andere data aan. Wordt ook vóór elke seed uitgevoerd, zodat seeden herhaalbaar is.

DELETE FROM event_signups
WHERE event_id IN (SELECT id FROM events WHERE name LIKE '[TEST WRAPPED]%');
DELETE FROM events WHERE name LIKE '[TEST WRAPPED]%';

DELETE FROM committee_members
WHERE committee_id IN (SELECT id FROM committees WHERE name LIKE '[TEST WRAPPED]%');
DELETE FROM committees WHERE name LIKE '[TEST WRAPPED]%';

DELETE FROM pub_crawl_signups
WHERE pub_crawl_event_id IN (SELECT id FROM pub_crawl_events WHERE name LIKE '[TEST WRAPPED]%');
DELETE FROM pub_crawl_events WHERE name LIKE '[TEST WRAPPED]%';

DELETE FROM "Stickers" WHERE location_name LIKE '[TEST WRAPPED]%';

DELETE FROM trip_signups
WHERE trip_id IN (SELECT id FROM trips WHERE name LIKE '[TEST WRAPPED]%');
DELETE FROM trips WHERE name LIKE '[TEST WRAPPED]%';

DELETE FROM transactions WHERE mollie_id LIKE 'tr_testwrapped_%';

CREATE TEMP TABLE _wrapped_test_preorders ON COMMIT DROP AS
SELECT DISTINCT preorder_id AS id FROM webshop_preorder_lines WHERE product_name_snapshot LIKE '[TEST WRAPPED]%';
DELETE FROM webshop_preorder_lines WHERE preorder_id IN (SELECT id FROM _wrapped_test_preorders);
DELETE FROM webshop_preorders WHERE id IN (SELECT id FROM _wrapped_test_preorders);
