-- MANUAL ACCEPTANCE-ONLY migration. Confirm the target database before running.
-- Nothing runs this file automatically. Existing association/auth tables are unchanged.
BEGIN;
CREATE TABLE IF NOT EXISTS mobile_notification_preferences (
  environment text NOT NULL CHECK (environment = 'acc'),
  user_id uuid NOT NULL REFERENCES directus_users(id) ON DELETE CASCADE,
  registrations boolean NOT NULL DEFAULT true,
  payments boolean NOT NULL DEFAULT true,
  event_changes boolean NOT NULL DEFAULT true,
  reminders boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(environment, user_id)
);
CREATE TABLE IF NOT EXISTS mobile_devices (
  id bigserial PRIMARY KEY,
  environment text NOT NULL CHECK (environment = 'acc'),
  user_id uuid NOT NULL REFERENCES directus_users(id) ON DELETE CASCADE,
  session_id text NOT NULL REFERENCES auth_sessions(id) ON DELETE CASCADE,
  token text NOT NULL CHECK (token ~ '^[a-f0-9]{64,200}$'),
  apns_environment text NOT NULL CHECK (apns_environment IN ('sandbox','production')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(environment, apns_environment, token)
);
CREATE INDEX IF NOT EXISTS mobile_devices_user ON mobile_devices(environment, user_id);
CREATE TABLE IF NOT EXISTS mobile_notification_users (
  environment text NOT NULL CHECK (environment = 'acc'),
  user_id uuid NOT NULL REFERENCES directus_users(id) ON DELETE CASCADE,
  initialized_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(environment, user_id)
);
CREATE TABLE IF NOT EXISTS mobile_notification_observations (
  environment text NOT NULL CHECK (environment = 'acc'),
  user_id uuid NOT NULL REFERENCES directus_users(id) ON DELETE CASCADE,
  registration_id bigint NOT NULL,
  snapshot jsonb NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(environment, user_id, registration_id)
);
CREATE TABLE IF NOT EXISTS mobile_notification_outbox (
  id bigserial PRIMARY KEY,
  environment text NOT NULL CHECK (environment = 'acc'),
  device_id bigint NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('registrations','payments','eventChanges','reminders')),
  dedupe_key text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','skipped')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  sent_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(environment, device_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS mobile_outbox_pending ON mobile_notification_outbox(environment, status, next_attempt_at);
ALTER TABLE mobile_notification_outbox ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';
-- Extended activity subscriptions and organizer thresholds. Also upgrades an earlier manual migration.
ALTER TABLE mobile_notification_preferences ADD COLUMN IF NOT EXISTS activity_announcements boolean NOT NULL DEFAULT false;
ALTER TABLE mobile_notification_preferences ADD COLUMN IF NOT EXISTS activity_committee_ids integer[] NOT NULL DEFAULT '{}';
ALTER TABLE mobile_notification_preferences ADD COLUMN IF NOT EXISTS organizer_almost_full boolean NOT NULL DEFAULT false;
ALTER TABLE mobile_notification_preferences ADD COLUMN IF NOT EXISTS organizer_capacity_percent integer NOT NULL DEFAULT 90 CHECK (organizer_capacity_percent BETWEEN 50 AND 100);
ALTER TABLE mobile_notification_preferences ADD COLUMN IF NOT EXISTS organizer_signup_thresholds integer[] NOT NULL DEFAULT '{}';
ALTER TABLE mobile_notification_outbox DROP CONSTRAINT IF EXISTS mobile_notification_outbox_kind_check;
ALTER TABLE mobile_notification_outbox ADD CONSTRAINT mobile_notification_outbox_kind_check CHECK (kind IN ('registrations','payments','eventChanges','reminders','activityAnnouncements','organizerAlmostFull','organizerSignups'));
CREATE TABLE IF NOT EXISTS mobile_notification_activity_users (
  environment text NOT NULL CHECK (environment='acc'),
  user_id uuid NOT NULL REFERENCES directus_users(id) ON DELETE CASCADE,
  initialized_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(environment,user_id)
);
CREATE TABLE IF NOT EXISTS mobile_notification_activity_observations (
  environment text NOT NULL CHECK (environment='acc'),
  user_id uuid NOT NULL REFERENCES directus_users(id) ON DELETE CASCADE,
  event_id bigint NOT NULL,
  snapshot jsonb NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(environment,user_id,event_id)
);
COMMIT;
