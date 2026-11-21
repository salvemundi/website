-- MANUAL TEST-ENVIRONMENT migration for Android (FCM) device registration.
-- Apply AFTER mobile_notifications.sql. Confirm the target database before running.
-- Nothing runs this file automatically. Idempotent and additive: existing iOS rows
-- become platform='ios' through the column default and keep the hex APNs token rule.
BEGIN;
ALTER TABLE mobile_devices ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'ios';
ALTER TABLE mobile_devices DROP CONSTRAINT IF EXISTS mobile_devices_platform_check;
ALTER TABLE mobile_devices ADD CONSTRAINT mobile_devices_platform_check CHECK (platform IN ('ios','android'));
-- APNs tokens stay lower-case hex. FCM registration tokens are opaque, case-sensitive
-- URL-safe strings (letters, digits, ':', '_' and '-'). PostgreSQL regex bounds
-- are limited to 255, so check the token length separately.
ALTER TABLE mobile_devices DROP CONSTRAINT IF EXISTS mobile_devices_token_check;
ALTER TABLE mobile_devices ADD CONSTRAINT mobile_devices_token_check CHECK (
  (platform = 'ios' AND token ~ '^[a-f0-9]{64,200}$')
  OR (platform = 'android' AND char_length(token) BETWEEN 100 AND 1024
    AND token !~ '[^A-Za-z0-9_:-]')
);
CREATE INDEX IF NOT EXISTS mobile_devices_platform ON mobile_devices(environment, platform);
COMMIT;
