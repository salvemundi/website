# Directus Access Policies: De "Juiste" Inrichting (Granulair)

Dit document bevat de **strikte** rechtenverdeling, gespecificeerd op veld-niveau. Rechten die niet in deze lijst staan, worden **geweigerd**.

---

## 1. Payment API (`payment-api`)
**Doel**: Het afhandelen van geldstromen en het markeren van inschrijvingen als betaald.

### 📋 `transactions`
- **Lezen (Read)**: `id`, `approval_status`, `payment_status`, `first_name`, `last_name`, `email`, `transaction_id`, `product_name`, `amount`, `created_at`, `coupon_code`.
- **Aanmaken (Create)**: `amount`, `product_name`, `payment_status`, `email`, `first_name`, `last_name`, `registration`, `pub_crawl_signup`, `trip_signup`, `environment`, `approval_status`, `user_id`, `coupon_code`.
- **Bewerken (Update)**: `payment_status`, `transaction_id`.

### 📋 `event_signups`
- **Lezen (Read)**: `id`, `event_id`, `directus_relations`, `participant_name`, `participant_email`, `participant_phone`, `payment_status`, `qr_token`, `checked_in`, `checked_in_at`, `created_at`.
- **Bewerken (Update)**: `payment_status`, `qr_token`, `checked_in`, `checked_in_at`.

### 📋 `pub_crawl_signups`
- **Lezen (Read)**: `id`, `pub_crawl_event_id`, `name`, `email`, `association`, `amount_tickets`, `payment_status`, `name_initials`, `created_at`, `updated_at`.
- **Bewerken (Update)**: `payment_status`, `updated_at`.

### 📋 `trip_signups`
- **Lezen (Read)**: `id`, `first_name`, `middle_name`, `last_name`, `email`, `role`, `trip_id`, `deposit_paid`, `full_payment_paid`.
- **Bewerken (Update)**: `deposit_paid`, `deposit_paid_at`, `full_payment_paid`, `full_payment_paid_at`.

### 📋 `pub_crawl_tickets`
- **Aanmaken (Create)**: `signup_id`, `name`, `initial`, `qr_token`, `checked_in`.

### 📋 `coupons`
- **Lezen (Read)**: `id`, `coupon_code`, `is_active`, `valid_from`, `valid_until`, `usage_limit`, `usage_count`, `discount_type`, `discount_value`.
- **Bewerken (Update)**: `usage_count`.

### 📋 `trips`
- **Lezen (Read)**: `id`, `name`, `event_date`, `start_date`, `end_date`, `base_price`, `deposit_amount`, `crew_discount`, `is_bus_trip`.

### 📋 `trip_activities`
- **Lezen (Read)**: `id`, `name`, `price`, `options`.

### 📋 `trip_signup_activities`
- **Lezen (Read)**: `id`, `selected_options`, `trip_activity_id`.

### 📋 `site_settings`
- **Lezen (Read)**: `id`, `page`, `disabled_message`.
- **Bewerken (Update)**: `disabled_message`. (Voor opslaan payment settings JSON).

### 📋 `directus_users`
- **Lezen (Read)**: `id`, `email`, `first_name`, `last_name`, `entra_id`.
- **❌ GEEN Create/Update/Delete rechten**.

### 📋 `committee_members`
- **Lezen (Read)**: `id`, `user_id`, `committee_id`, `is_visible`. (Benodigd voor lidmaatschapskorting check).

---

## 2. Admin API (`admin-api`)
**Doel**: Beheer-backend. Heeft specifieke rechten nodig voor provisioning en workflow management.

### 📋 `directus_users`
- **Lezen (Read)**: `id`, `email`, `first_name`, `last_name`, `phone_number`, `date_of_birth`, `status`, `role`, `membership_status`, `membership_expiry`, `entra_id`.
- **Aanmaken (Create)**: `email`, `first_name`, `last_name`, `phone_number`, `date_of_birth`, `password`, `status`, `membership_status`, `membership_expiry`, `entra_id`.
- **Bewerken (Update)**: `membership_status`, `membership_expiry`, `entra_id`, `phone_number`, `date_of_birth`, `status`, `minecraft_username`.

### 📋 `transactions`
- **Lezen (Read)**: `id`, `created_at`, `product_name`, `amount`, `email`, `first_name`, `last_name`, `approval_status`, `payment_status`, `environment`, `user_id`, `registration`, `pub_crawl_signup`, `trip_signup`, `transaction_id`.
- **Bewerken (Update)**: `approval_status`, `approved_by`, `approved_at`, `payment_status`, `transaction_id`.

### 📋 `site_settings`
- **Lezen (Read)**: `id`, `page`, `disabled_message`, 'show'.
- **Bewerken (Update)**: `disabled_message`.

### 📋 `event_signups`
- **Lezen (Read)**: `id`, `event_id`, `participant_name`, `participant_email`, `payment_status`.
- **Bewerken (Update)**: `payment_status`, `qr_token`.

### 📋 `pub_crawl_signups`
- **Lezen (Read)**: `id`, `pub_crawl_event_id`, `name`, `email`, `payment_status`.
- **Bewerken (Update)**: `payment_status`.

### 📋 `roles`
- **Lezen (Read)**: `id`, `name`.

### 📋 `coupons`
- **Lezen (Read)**: `id`, `coupon_code`, `is_active`, `valid_from`, `valid_until`, `usage_limit`, `usage_count`, `discount_type`, `discount_value`.

### 📋 `committees`
- **Lezen (Read)**: `id`, `name`. (Wordt voornamelijk via Graph Sync beheerd, Admin API proxy).

### 📋 `committee_members`
- **Lezen (Read)**: `id`, `user_id`, `committee_id`, `is_visible`, `is_leader`. (Management verloopt via Graph Sync).

---

## 3. Graph Sync (`graph-sync`)
**Doel**: Bidirectionele synchronisatie tussen Entra ID en Directus.

### 📋 `directus_users`
- **Lezen (Read)**: `id`, `email`, `first_name`, `last_name`, `phone_number`, `status`, `role`, `membership_expiry`, `fontys_email`, `date_of_birth`, `title`, `entra_id`.
- **Aanmaken (Create)**: `email`, `first_name`, `last_name`, `phone_number`, `date_of_birth`, `password`, `status`, `entra_id`, `membership_status`, `membership_expiry`.
- **Bewerken (Update)**: `first_name`, `last_name`, `phone_number`, `fontys_email`, `role`, `status`, `membership_expiry`, `entra_id`, `membership_status`, `date_of_birth`, `title`.

### 📋 `committees`
- **Lezen (Read)**: `id`, `name`.
- **Aanmaken (Create)**: `name`.

### 📋 `committee_members`
- **Volledige Toegang (CRUD)**: `id`, `user_id`, `committee_id`, `is_visible`, `is_leader`.

---

## 4. Notification API (`notification-api`)
**Doel**: Versturen van pushberichten.

### 📋 `push_notification`
- **Volledige Toegang (CRUD)**: `id`, `user_id`, `endpoint`, `keys`, `user_agent`, `created_at`, `last_used`.

### 📋 `events`
- **Lezen (Read)**: `id`, `name`.

### 📋 `event_signups`
- **Lezen (Read)**: `id`, `event_id`, `directus_relations`, `participant_name`, `participant_email`, `participant_phone`, `qr_token`, `payment_status`, `checked_in`, `checked_in_at`.

### 📋 `directus_users`
- **Lezen (Read)**: `id`.

### 📋 `intro_parent_signups`
- **Lezen (Read)**: `id`, `user_id`.

---

## 5. Email API (`email-api`)
**Doel**: Versturen van transactionele e-mails.

### 📋 `events`
- **Lezen (Read)**: `id`, `name`, `event_date`, `event_date_end`, `event_time`, `event_time_end`, `description`, `location`, `committee_id`, `image`, `contact`.

### 📋 `directus_users`
- **Lezen (Read)**: `id`, `first_name`, `last_name`, `email`, `membership_expiry`.
