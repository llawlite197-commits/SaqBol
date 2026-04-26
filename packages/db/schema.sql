BEGIN;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = ON;
SET check_function_bodies = ON;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE account_type_enum AS ENUM (
    'CITIZEN',
    'EMPLOYEE',
    'SYSTEM'
);

CREATE TYPE user_status_enum AS ENUM (
    'PENDING_VERIFICATION',
    'ACTIVE',
    'BLOCKED',
    'SUSPENDED',
    'DELETED'
);

CREATE TYPE region_kind_enum AS ENUM (
    'REGION',
    'CITY'
);

CREATE TYPE complaint_status_enum AS ENUM (
    'NEW',
    'UNDER_REVIEW',
    'NEED_INFO',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'REJECTED',
    'DUPLICATE'
);

CREATE TYPE contact_type_enum AS ENUM (
    'PHONE',
    'URL',
    'EMAIL',
    'CARD',
    'IBAN'
);

CREATE TYPE request_source_enum AS ENUM (
    'PUBLIC_WEB',
    'WORKSPACE_WEB',
    'API',
    'SYSTEM'
);

CREATE TYPE notification_channel_enum AS ENUM (
    'EMAIL',
    'SMS',
    'IN_APP'
);

CREATE TYPE notification_status_enum AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED',
    'CANCELLED'
);

CREATE TYPE news_status_enum AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);

CREATE TYPE otp_purpose_enum AS ENUM (
    'REGISTRATION',
    'LOGIN',
    'PASSWORD_RESET',
    'EMAIL_VERIFICATION',
    'PHONE_VERIFICATION',
    'TWO_FACTOR'
);

CREATE TYPE otp_delivery_channel_enum AS ENUM (
    'SMS',
    'EMAIL'
);

CREATE TYPE two_factor_method_enum AS ENUM (
    'TOTP',
    'SMS',
    'EMAIL'
);

CREATE TYPE two_factor_session_status_enum AS ENUM (
    'PENDING',
    'VERIFIED',
    'EXPIRED',
    'FAILED',
    'CANCELLED'
);

CREATE TYPE export_job_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'EXPIRED',
    'CANCELLED'
);

CREATE TYPE export_job_type_enum AS ENUM (
    'COMPLAINTS_CSV',
    'COMPLAINTS_XLSX',
    'COMPLAINT_CARD_PDF',
    'AUDIT_LOGS_CSV',
    'NEWS_CSV'
);

CREATE TYPE setting_value_type_enum AS ENUM (
    'STRING',
    'NUMBER',
    'BOOLEAN',
    'JSON'
);

CREATE TYPE comment_visibility_enum AS ENUM (
    'INTERNAL',
    'CITIZEN',
    'SYSTEM'
);

CREATE TYPE file_scan_status_enum AS ENUM (
    'PENDING_SCAN',
    'ACTIVE',
    'QUARANTINED',
    'DELETED'
);

CREATE TYPE blacklist_source_enum AS ENUM (
    'COMPLAINT',
    'MANUAL',
    'IMPORT',
    'EXTERNAL_SYNC'
);

CREATE SEQUENCE complaint_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 50;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_update_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Table "%" is append-only. UPDATE and DELETE are not allowed.', TG_TABLE_NAME;
END;
$$;

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name_kz VARCHAR(150) NOT NULL,
    name_ru VARCHAR(150) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roles_code UNIQUE (code),
    CONSTRAINT chk_roles_code_not_blank CHECK (btrim(code) <> '')
);

CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    kind region_kind_enum NOT NULL DEFAULT 'REGION',
    name_kz VARCHAR(200) NOT NULL,
    name_ru VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_regions_code UNIQUE (code),
    CONSTRAINT chk_regions_code_not_blank CHECK (btrim(code) <> '')
);

CREATE TABLE fraud_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name_kz VARCHAR(200) NOT NULL,
    name_ru VARCHAR(200) NOT NULL,
    description_kz TEXT,
    description_ru TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fraud_types_code UNIQUE (code),
    CONSTRAINT chk_fraud_types_code_not_blank CHECK (btrim(code) <> '')
);

CREATE TABLE complaint_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code complaint_status_enum NOT NULL,
    name_kz VARCHAR(150) NOT NULL,
    name_ru VARCHAR(150) NOT NULL,
    description TEXT,
    is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_complaint_statuses_code UNIQUE (code)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type account_type_enum NOT NULL,
    email CITEXT,
    phone VARCHAR(32),
    password_hash TEXT,
    status user_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts SMALLINT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_contact_presence CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CONSTRAINT chk_users_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,20}$'),
    CONSTRAINT chk_users_failed_login_attempts CHECK (failed_login_attempts >= 0)
);

CREATE TABLE employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    patronymic VARCHAR(100),
    position_title VARCHAR(200),
    department_name VARCHAR(200),
    region_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    preferred_2fa_method two_factor_method_enum NOT NULL DEFAULT 'TOTP',
    last_activity_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_employee_profiles_user_id UNIQUE (user_id),
    CONSTRAINT chk_employee_profiles_employee_code_not_blank CHECK (btrim(employee_code) <> '')
);

CREATE TABLE citizen_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    iin CHAR(12),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    patronymic VARCHAR(100),
    birth_date DATE,
    region_id UUID,
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'ru',
    address TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_citizen_profiles_user_id UNIQUE (user_id),
    CONSTRAINT chk_citizen_profiles_iin_format CHECK (iin IS NULL OR iin ~ '^[0-9]{12}$'),
    CONSTRAINT chk_citizen_profiles_preferred_language CHECK (preferred_language IN ('kk', 'ru'))
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_by_user_id UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_roles_revocation_consistency CHECK (
        (revoked_at IS NULL AND revoked_by_user_id IS NULL)
        OR (revoked_at IS NOT NULL)
    )
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number VARCHAR(32) NOT NULL DEFAULT ('SB-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('complaint_number_seq')::TEXT, 9, '0')),
    citizen_user_id UUID NOT NULL,
    region_id UUID NOT NULL,
    fraud_type_id UUID NOT NULL,
    title VARCHAR(255),
    description TEXT NOT NULL,
    incident_at TIMESTAMPTZ,
    damage_amount NUMERIC(18,2),
    damage_currency CHAR(3) NOT NULL DEFAULT 'KZT',
    current_status complaint_status_enum NOT NULL DEFAULT 'NEW',
    current_assignee_employee_id UUID,
    duplicate_of_complaint_id UUID,
    submission_source request_source_enum NOT NULL DEFAULT 'PUBLIC_WEB',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_complaints_complaint_number UNIQUE (complaint_number),
    CONSTRAINT chk_complaints_description_not_blank CHECK (btrim(description) <> ''),
    CONSTRAINT chk_complaints_damage_amount_non_negative CHECK (damage_amount IS NULL OR damage_amount >= 0),
    CONSTRAINT chk_complaints_damage_currency_format CHECK (damage_currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_complaints_duplicate_self_reference CHECK (duplicate_of_complaint_id IS NULL OR duplicate_of_complaint_id <> id)
);

CREATE TABLE complaint_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL,
    contact_type contact_type_enum NOT NULL,
    raw_value TEXT NOT NULL,
    normalized_value TEXT,
    label VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_complaint_contacts_raw_value_not_blank CHECK (btrim(raw_value) <> '')
);

CREATE TABLE complaint_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL,
    uploaded_by_user_id UUID,
    original_file_name VARCHAR(255) NOT NULL,
    storage_bucket VARCHAR(128) NOT NULL,
    storage_object_key VARCHAR(1024) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    checksum_sha256 CHAR(64),
    file_status file_scan_status_enum NOT NULL DEFAULT 'PENDING_SCAN',
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    scan_completed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_complaint_files_storage_object UNIQUE (storage_bucket, storage_object_key),
    CONSTRAINT chk_complaint_files_original_file_name_not_blank CHECK (btrim(original_file_name) <> ''),
    CONSTRAINT chk_complaint_files_file_size_non_negative CHECK (file_size_bytes >= 0),
    CONSTRAINT chk_complaint_files_checksum_format CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~ '^[0-9a-fA-F]{64}$')
);

CREATE TABLE complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL,
    from_status complaint_status_enum,
    to_status complaint_status_enum NOT NULL,
    reason_code VARCHAR(100),
    reason_text TEXT,
    changed_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_complaint_status_history_reason_code_not_blank CHECK (reason_code IS NULL OR btrim(reason_code) <> '')
);

CREATE TABLE complaint_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL,
    author_user_id UUID,
    parent_comment_id UUID,
    visibility comment_visibility_enum NOT NULL DEFAULT 'INTERNAL',
    comment_text TEXT NOT NULL,
    is_system_generated BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_complaint_comments_text_not_blank CHECK (btrim(comment_text) <> '')
);

CREATE TABLE blacklist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_type contact_type_enum NOT NULL,
    raw_value TEXT NOT NULL,
    normalized_value TEXT NOT NULL,
    fraud_type_id UUID,
    region_id UUID,
    source_complaint_id UUID,
    source_type blacklist_source_enum NOT NULL DEFAULT 'COMPLAINT',
    notes TEXT,
    risk_score SMALLINT NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_blacklist_entries_raw_value_not_blank CHECK (btrim(raw_value) <> ''),
    CONSTRAINT chk_blacklist_entries_normalized_value_not_blank CHECK (btrim(normalized_value) <> ''),
    CONSTRAINT chk_blacklist_entries_risk_score_range CHECK (risk_score BETWEEN 0 AND 100)
);

CREATE TABLE blacklist_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checked_by_user_id UUID,
    check_type contact_type_enum NOT NULL,
    input_value TEXT NOT NULL,
    normalized_value TEXT,
    matched_blacklist_entry_id UUID,
    match_found BOOLEAN NOT NULL DEFAULT FALSE,
    match_count INTEGER NOT NULL DEFAULT 0,
    source request_source_enum NOT NULL DEFAULT 'PUBLIC_WEB',
    request_ip INET,
    user_agent TEXT,
    response_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_blacklist_checks_input_value_not_blank CHECK (btrim(input_value) <> ''),
    CONSTRAINT chk_blacklist_checks_match_count_non_negative CHECK (match_count >= 0)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    channel notification_channel_enum NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    status notification_status_enum NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    related_entity_type VARCHAR(100),
    related_entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notifications_notification_type_not_blank CHECK (btrim(notification_type) <> ''),
    CONSTRAINT chk_notifications_body_not_blank CHECK (btrim(body) <> '')
);

CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug CITEXT NOT NULL,
    title_kz VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    summary_kz TEXT,
    summary_ru TEXT,
    content_kz TEXT NOT NULL,
    content_ru TEXT NOT NULL,
    region_id UUID,
    status news_status_enum NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMPTZ,
    author_user_id UUID,
    cover_image_bucket VARCHAR(128),
    cover_image_object_key VARCHAR(1024),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_news_slug_not_blank CHECK (btrim(slug::TEXT) <> ''),
    CONSTRAINT chk_news_title_kz_not_blank CHECK (btrim(title_kz) <> ''),
    CONSTRAINT chk_news_title_ru_not_blank CHECK (btrim(title_ru) <> ''),
    CONSTRAINT chk_news_content_kz_not_blank CHECK (btrim(content_kz) <> ''),
    CONSTRAINT chk_news_content_ru_not_blank CHECK (btrim(content_ru) <> ''),
    CONSTRAINT chk_news_published_at_consistency CHECK (
        (status = 'PUBLISHED' AND published_at IS NOT NULL)
        OR status <> 'PUBLISHED'
    )
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    request_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    http_method VARCHAR(16),
    request_path TEXT,
    response_status_code INTEGER,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_audit_logs_action_type_not_blank CHECK (btrim(action_type) <> ''),
    CONSTRAINT chk_audit_logs_entity_type_not_blank CHECK (btrim(entity_type) <> ''),
    CONSTRAINT chk_audit_logs_response_status_code_range CHECK (
        response_status_code IS NULL OR response_status_code BETWEEN 100 AND 599
    )
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash CHAR(64) NOT NULL,
    token_family_id UUID NOT NULL,
    replaced_by_token_id UUID,
    issued_ip INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash),
    CONSTRAINT chk_refresh_tokens_token_hash_format CHECK (token_hash ~ '^[0-9a-fA-F]{64}$'),
    CONSTRAINT chk_refresh_tokens_expires_at_future CHECK (expires_at > created_at)
);

CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    purpose otp_purpose_enum NOT NULL,
    channel otp_delivery_channel_enum NOT NULL,
    target VARCHAR(255) NOT NULL,
    code_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    attempts_used SMALLINT NOT NULL DEFAULT 0,
    max_attempts SMALLINT NOT NULL DEFAULT 5,
    request_ip INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_otp_codes_target_not_blank CHECK (btrim(target) <> ''),
    CONSTRAINT chk_otp_codes_code_hash_format CHECK (code_hash ~ '^[0-9a-fA-F]{64}$'),
    CONSTRAINT chk_otp_codes_expires_at_future CHECK (expires_at > created_at),
    CONSTRAINT chk_otp_codes_attempts_used_non_negative CHECK (attempts_used >= 0),
    CONSTRAINT chk_otp_codes_max_attempts_positive CHECK (max_attempts > 0),
    CONSTRAINT chk_otp_codes_attempts_not_exceed_max CHECK (attempts_used <= max_attempts)
);

CREATE TABLE two_factor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    method two_factor_method_enum NOT NULL,
    session_status two_factor_session_status_enum NOT NULL DEFAULT 'PENDING',
    verification_token_hash CHAR(64) NOT NULL,
    challenge_expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    trusted_device BOOLEAN NOT NULL DEFAULT FALSE,
    request_ip INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_two_factor_sessions_verification_token_hash UNIQUE (verification_token_hash),
    CONSTRAINT chk_two_factor_sessions_verification_token_hash_format CHECK (verification_token_hash ~ '^[0-9a-fA-F]{64}$'),
    CONSTRAINT chk_two_factor_sessions_expires_at_future CHECK (challenge_expires_at > created_at),
    CONSTRAINT chk_two_factor_sessions_verified_at_consistency CHECK (
        (session_status = 'VERIFIED' AND verified_at IS NOT NULL)
        OR session_status <> 'VERIFIED'
    )
);

CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by_user_id UUID NOT NULL,
    job_type export_job_type_enum NOT NULL,
    job_status export_job_status_enum NOT NULL DEFAULT 'PENDING',
    filters JSONB NOT NULL DEFAULT '{}'::JSONB,
    file_name VARCHAR(255),
    storage_bucket VARCHAR(128),
    storage_object_key VARCHAR(1024),
    row_count INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_export_jobs_row_count_non_negative CHECK (row_count IS NULL OR row_count >= 0),
    CONSTRAINT chk_export_jobs_completed_at_consistency CHECK (
        (job_status = 'COMPLETED' AND completed_at IS NOT NULL)
        OR job_status <> 'COMPLETED'
    ),
    CONSTRAINT chk_export_jobs_failed_at_consistency CHECK (
        (job_status = 'FAILED' AND failed_at IS NOT NULL)
        OR job_status <> 'FAILED'
    )
);

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(150) NOT NULL,
    setting_group VARCHAR(100) NOT NULL DEFAULT 'general',
    setting_value JSONB NOT NULL,
    value_type setting_value_type_enum NOT NULL DEFAULT 'STRING',
    description TEXT,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by_user_id UUID,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_system_settings_setting_key_format CHECK (setting_key ~ '^[a-z][a-z0-9_.-]{1,149}$'),
    CONSTRAINT chk_system_settings_value_type_consistency CHECK (
        (value_type = 'STRING' AND jsonb_typeof(setting_value) = 'string')
        OR (value_type = 'NUMBER' AND jsonb_typeof(setting_value) = 'number')
        OR (value_type = 'BOOLEAN' AND jsonb_typeof(setting_value) = 'boolean')
        OR (value_type = 'JSON' AND jsonb_typeof(setting_value) IN ('object', 'array'))
    )
);

ALTER TABLE employee_profiles
    ADD CONSTRAINT fk_employee_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE employee_profiles
    ADD CONSTRAINT fk_employee_profiles_region
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT;

ALTER TABLE citizen_profiles
    ADD CONSTRAINT fk_citizen_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE citizen_profiles
    ADD CONSTRAINT fk_citizen_profiles_region
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT;

ALTER TABLE user_roles
    ADD CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_roles
    ADD CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;

ALTER TABLE user_roles
    ADD CONSTRAINT fk_user_roles_assigned_by_user
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE user_roles
    ADD CONSTRAINT fk_user_roles_revoked_by_user
    FOREIGN KEY (revoked_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_citizen_user
    FOREIGN KEY (citizen_user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_region
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT;

ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_fraud_type
    FOREIGN KEY (fraud_type_id) REFERENCES fraud_types(id) ON DELETE RESTRICT;

ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_current_status
    FOREIGN KEY (current_status) REFERENCES complaint_statuses(code) ON DELETE RESTRICT;

ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_current_assignee_employee
    FOREIGN KEY (current_assignee_employee_id) REFERENCES employee_profiles(id) ON DELETE SET NULL;

ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_duplicate_of_complaint
    FOREIGN KEY (duplicate_of_complaint_id) REFERENCES complaints(id) ON DELETE SET NULL;

ALTER TABLE complaint_contacts
    ADD CONSTRAINT fk_complaint_contacts_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE complaint_files
    ADD CONSTRAINT fk_complaint_files_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE complaint_files
    ADD CONSTRAINT fk_complaint_files_uploaded_by_user
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE complaint_status_history
    ADD CONSTRAINT fk_complaint_status_history_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE complaint_status_history
    ADD CONSTRAINT fk_complaint_status_history_from_status
    FOREIGN KEY (from_status) REFERENCES complaint_statuses(code) ON DELETE RESTRICT;

ALTER TABLE complaint_status_history
    ADD CONSTRAINT fk_complaint_status_history_to_status
    FOREIGN KEY (to_status) REFERENCES complaint_statuses(code) ON DELETE RESTRICT;

ALTER TABLE complaint_status_history
    ADD CONSTRAINT fk_complaint_status_history_changed_by_user
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE complaint_comments
    ADD CONSTRAINT fk_complaint_comments_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE complaint_comments
    ADD CONSTRAINT fk_complaint_comments_author_user
    FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE complaint_comments
    ADD CONSTRAINT fk_complaint_comments_parent_comment
    FOREIGN KEY (parent_comment_id) REFERENCES complaint_comments(id) ON DELETE SET NULL;

ALTER TABLE blacklist_entries
    ADD CONSTRAINT fk_blacklist_entries_fraud_type
    FOREIGN KEY (fraud_type_id) REFERENCES fraud_types(id) ON DELETE SET NULL;

ALTER TABLE blacklist_entries
    ADD CONSTRAINT fk_blacklist_entries_region
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL;

ALTER TABLE blacklist_entries
    ADD CONSTRAINT fk_blacklist_entries_source_complaint
    FOREIGN KEY (source_complaint_id) REFERENCES complaints(id) ON DELETE SET NULL;

ALTER TABLE blacklist_checks
    ADD CONSTRAINT fk_blacklist_checks_checked_by_user
    FOREIGN KEY (checked_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE blacklist_checks
    ADD CONSTRAINT fk_blacklist_checks_matched_blacklist_entry
    FOREIGN KEY (matched_blacklist_entry_id) REFERENCES blacklist_entries(id) ON DELETE SET NULL;

ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE news
    ADD CONSTRAINT fk_news_region
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL;

ALTER TABLE news
    ADD CONSTRAINT fk_news_author_user
    FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE audit_logs
    ADD CONSTRAINT fk_audit_logs_actor_user
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_replaced_by_token
    FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens(id) ON DELETE SET NULL;

ALTER TABLE otp_codes
    ADD CONSTRAINT fk_otp_codes_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE two_factor_sessions
    ADD CONSTRAINT fk_two_factor_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE export_jobs
    ADD CONSTRAINT fk_export_jobs_requested_by_user
    FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE system_settings
    ADD CONSTRAINT fk_system_settings_updated_by_user
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX uq_users_email_active
    ON users (email)
    WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX uq_users_phone_active
    ON users (phone)
    WHERE phone IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_users_account_type
    ON users (account_type);

CREATE INDEX idx_users_status
    ON users (status);

CREATE INDEX idx_users_created_at
    ON users (created_at DESC);

CREATE UNIQUE INDEX uq_employee_profiles_employee_code_active
    ON employee_profiles (employee_code)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_employee_profiles_region_id
    ON employee_profiles (region_id);

CREATE INDEX idx_employee_profiles_is_active
    ON employee_profiles (is_active);

CREATE UNIQUE INDEX uq_citizen_profiles_iin_active
    ON citizen_profiles (iin)
    WHERE iin IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_citizen_profiles_region_id
    ON citizen_profiles (region_id);

CREATE INDEX idx_regions_kind
    ON regions (kind);

CREATE INDEX idx_regions_is_active
    ON regions (is_active);

CREATE INDEX idx_fraud_types_is_active
    ON fraud_types (is_active)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_fraud_types_sort_order
    ON fraud_types (sort_order);

CREATE INDEX idx_complaint_statuses_sort_order
    ON complaint_statuses (sort_order);

CREATE UNIQUE INDEX uq_user_roles_active
    ON user_roles (user_id, role_id)
    WHERE revoked_at IS NULL;

CREATE INDEX idx_user_roles_role_id
    ON user_roles (role_id);

CREATE INDEX idx_user_roles_revoked_at
    ON user_roles (revoked_at);

CREATE INDEX idx_complaints_citizen_user_id
    ON complaints (citizen_user_id);

CREATE INDEX idx_complaints_region_id
    ON complaints (region_id);

CREATE INDEX idx_complaints_fraud_type_id
    ON complaints (fraud_type_id);

CREATE INDEX idx_complaints_current_status
    ON complaints (current_status);

CREATE INDEX idx_complaints_current_assignee_employee_id
    ON complaints (current_assignee_employee_id);

CREATE INDEX idx_complaints_submitted_at
    ON complaints (submitted_at DESC);

CREATE INDEX idx_complaints_last_status_changed_at
    ON complaints (last_status_changed_at DESC);

CREATE INDEX idx_complaints_duplicate_of_complaint_id
    ON complaints (duplicate_of_complaint_id);

CREATE INDEX idx_complaints_search
    ON complaints
    USING GIN (to_tsvector('simple', COALESCE(complaint_number, '') || ' ' || COALESCE(title, '') || ' ' || COALESCE(description, '')));

CREATE INDEX idx_complaint_contacts_complaint_id
    ON complaint_contacts (complaint_id);

CREATE INDEX idx_complaint_contacts_type_normalized_value
    ON complaint_contacts (contact_type, normalized_value)
    WHERE normalized_value IS NOT NULL;

CREATE UNIQUE INDEX uq_complaint_contacts_unique_per_complaint
    ON complaint_contacts (complaint_id, contact_type, normalized_value)
    WHERE normalized_value IS NOT NULL;

CREATE INDEX idx_complaint_files_complaint_id
    ON complaint_files (complaint_id);

CREATE INDEX idx_complaint_files_uploaded_by_user_id
    ON complaint_files (uploaded_by_user_id);

CREATE INDEX idx_complaint_files_file_status
    ON complaint_files (file_status);

CREATE INDEX idx_complaint_status_history_complaint_id_created_at
    ON complaint_status_history (complaint_id, created_at DESC);

CREATE INDEX idx_complaint_status_history_changed_by_user_id
    ON complaint_status_history (changed_by_user_id);

CREATE INDEX idx_complaint_comments_complaint_id_created_at
    ON complaint_comments (complaint_id, created_at DESC);

CREATE INDEX idx_complaint_comments_author_user_id
    ON complaint_comments (author_user_id);

CREATE INDEX idx_complaint_comments_visibility
    ON complaint_comments (visibility)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_blacklist_entries_active_normalized_value
    ON blacklist_entries (entry_type, normalized_value)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_blacklist_entries_fraud_type_id
    ON blacklist_entries (fraud_type_id);

CREATE INDEX idx_blacklist_entries_region_id
    ON blacklist_entries (region_id);

CREATE INDEX idx_blacklist_entries_is_active
    ON blacklist_entries (is_active)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_blacklist_checks_checked_by_user_id
    ON blacklist_checks (checked_by_user_id);

CREATE INDEX idx_blacklist_checks_type_normalized_value
    ON blacklist_checks (check_type, normalized_value);

CREATE INDEX idx_blacklist_checks_created_at
    ON blacklist_checks (created_at DESC);

CREATE INDEX idx_notifications_user_id_status
    ON notifications (user_id, status);

CREATE INDEX idx_notifications_channel
    ON notifications (channel);

CREATE INDEX idx_notifications_created_at
    ON notifications (created_at DESC);

CREATE UNIQUE INDEX uq_news_slug_active
    ON news (slug)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_news_status
    ON news (status);

CREATE INDEX idx_news_published_at
    ON news (published_at DESC);

CREATE INDEX idx_news_region_id
    ON news (region_id);

CREATE INDEX idx_news_search
    ON news
    USING GIN (to_tsvector('simple', COALESCE(title_kz, '') || ' ' || COALESCE(title_ru, '') || ' ' || COALESCE(summary_kz, '') || ' ' || COALESCE(summary_ru, '') || ' ' || COALESCE(content_kz, '') || ' ' || COALESCE(content_ru, '')));

CREATE INDEX idx_audit_logs_actor_user_id
    ON audit_logs (actor_user_id);

CREATE INDEX idx_audit_logs_entity_type_entity_id
    ON audit_logs (entity_type, entity_id);

CREATE INDEX idx_audit_logs_request_id
    ON audit_logs (request_id);

CREATE INDEX idx_audit_logs_created_at
    ON audit_logs (created_at DESC);

CREATE INDEX idx_audit_logs_action_type
    ON audit_logs (action_type);

CREATE INDEX idx_refresh_tokens_user_id
    ON refresh_tokens (user_id);

CREATE INDEX idx_refresh_tokens_token_family_id
    ON refresh_tokens (token_family_id);

CREATE INDEX idx_refresh_tokens_expires_at
    ON refresh_tokens (expires_at);

CREATE INDEX idx_refresh_tokens_revoked_at
    ON refresh_tokens (revoked_at);

CREATE INDEX idx_otp_codes_user_id
    ON otp_codes (user_id);

CREATE INDEX idx_otp_codes_target_purpose_active
    ON otp_codes (target, purpose, expires_at)
    WHERE consumed_at IS NULL;

CREATE INDEX idx_otp_codes_created_at
    ON otp_codes (created_at DESC);

CREATE INDEX idx_two_factor_sessions_user_id
    ON two_factor_sessions (user_id);

CREATE INDEX idx_two_factor_sessions_status
    ON two_factor_sessions (session_status);

CREATE INDEX idx_two_factor_sessions_challenge_expires_at
    ON two_factor_sessions (challenge_expires_at);

CREATE INDEX idx_export_jobs_requested_by_user_id
    ON export_jobs (requested_by_user_id);

CREATE INDEX idx_export_jobs_job_status
    ON export_jobs (job_status);

CREATE INDEX idx_export_jobs_created_at
    ON export_jobs (created_at DESC);

CREATE UNIQUE INDEX uq_system_settings_key_active
    ON system_settings (setting_key)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_system_settings_group
    ON system_settings (setting_group)
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_roles_set_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_regions_set_updated_at
    BEFORE UPDATE ON regions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_fraud_types_set_updated_at
    BEFORE UPDATE ON fraud_types
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_complaint_statuses_set_updated_at
    BEFORE UPDATE ON complaint_statuses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_employee_profiles_set_updated_at
    BEFORE UPDATE ON employee_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_citizen_profiles_set_updated_at
    BEFORE UPDATE ON citizen_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_roles_set_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_complaints_set_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_complaint_contacts_set_updated_at
    BEFORE UPDATE ON complaint_contacts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_complaint_files_set_updated_at
    BEFORE UPDATE ON complaint_files
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_complaint_comments_set_updated_at
    BEFORE UPDATE ON complaint_comments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_blacklist_entries_set_updated_at
    BEFORE UPDATE ON blacklist_entries
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_notifications_set_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_news_set_updated_at
    BEFORE UPDATE ON news
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_refresh_tokens_set_updated_at
    BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_otp_codes_set_updated_at
    BEFORE UPDATE ON otp_codes
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_two_factor_sessions_set_updated_at
    BEFORE UPDATE ON two_factor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_export_jobs_set_updated_at
    BEFORE UPDATE ON export_jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_system_settings_set_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_complaint_status_history_immutable
    BEFORE UPDATE OR DELETE ON complaint_status_history
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_delete();

CREATE TRIGGER trg_blacklist_checks_immutable
    BEFORE UPDATE OR DELETE ON blacklist_checks
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_delete();

CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_delete();

COMMENT ON TABLE roles IS 'Application roles available in the system.';
COMMENT ON COLUMN roles.id IS 'Primary key of the role.';
COMMENT ON COLUMN roles.code IS 'Stable machine-readable role code.';
COMMENT ON COLUMN roles.name_kz IS 'Role name in Kazakh.';
COMMENT ON COLUMN roles.name_ru IS 'Role name in Russian.';
COMMENT ON COLUMN roles.description IS 'Role description.';
COMMENT ON COLUMN roles.is_system IS 'Whether the role is a system role protected from removal.';
COMMENT ON COLUMN roles.is_active IS 'Whether the role is active and assignable.';
COMMENT ON COLUMN roles.sort_order IS 'Display ordering value.';
COMMENT ON COLUMN roles.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN roles.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE regions IS 'Reference dictionary of Kazakhstan regions and cities of republican significance.';
COMMENT ON COLUMN regions.id IS 'Primary key of the region.';
COMMENT ON COLUMN regions.code IS 'Stable machine-readable region code.';
COMMENT ON COLUMN regions.kind IS 'Region kind: region or city.';
COMMENT ON COLUMN regions.name_kz IS 'Region name in Kazakh.';
COMMENT ON COLUMN regions.name_ru IS 'Region name in Russian.';
COMMENT ON COLUMN regions.is_active IS 'Whether the region is active for selection and reporting.';
COMMENT ON COLUMN regions.sort_order IS 'Display ordering value.';
COMMENT ON COLUMN regions.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN regions.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE fraud_types IS 'Reference dictionary of fraud types used to classify complaints.';
COMMENT ON COLUMN fraud_types.id IS 'Primary key of the fraud type.';
COMMENT ON COLUMN fraud_types.code IS 'Stable machine-readable fraud type code.';
COMMENT ON COLUMN fraud_types.name_kz IS 'Fraud type name in Kazakh.';
COMMENT ON COLUMN fraud_types.name_ru IS 'Fraud type name in Russian.';
COMMENT ON COLUMN fraud_types.description_kz IS 'Fraud type description in Kazakh.';
COMMENT ON COLUMN fraud_types.description_ru IS 'Fraud type description in Russian.';
COMMENT ON COLUMN fraud_types.is_active IS 'Whether the fraud type is active for new complaints.';
COMMENT ON COLUMN fraud_types.sort_order IS 'Display ordering value.';
COMMENT ON COLUMN fraud_types.deleted_at IS 'Soft delete timestamp.';
COMMENT ON COLUMN fraud_types.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN fraud_types.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE complaint_statuses IS 'Reference dictionary of supported complaint statuses.';
COMMENT ON COLUMN complaint_statuses.id IS 'Primary key of the complaint status reference row.';
COMMENT ON COLUMN complaint_statuses.code IS 'Enum status code.';
COMMENT ON COLUMN complaint_statuses.name_kz IS 'Status name in Kazakh.';
COMMENT ON COLUMN complaint_statuses.name_ru IS 'Status name in Russian.';
COMMENT ON COLUMN complaint_statuses.description IS 'Status description and business meaning.';
COMMENT ON COLUMN complaint_statuses.is_terminal IS 'Whether the status is terminal.';
COMMENT ON COLUMN complaint_statuses.is_active IS 'Whether the status can be used by the application.';
COMMENT ON COLUMN complaint_statuses.sort_order IS 'Display ordering value.';
COMMENT ON COLUMN complaint_statuses.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN complaint_statuses.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE users IS 'Core user accounts for citizens, employees and system actors.';
COMMENT ON COLUMN users.id IS 'Primary key of the user account.';
COMMENT ON COLUMN users.account_type IS 'High-level account category.';
COMMENT ON COLUMN users.email IS 'Primary email address used for login and notifications.';
COMMENT ON COLUMN users.phone IS 'Primary phone number used for login and notifications.';
COMMENT ON COLUMN users.password_hash IS 'Password hash stored using a strong password hashing algorithm.';
COMMENT ON COLUMN users.status IS 'Current lifecycle status of the user account.';
COMMENT ON COLUMN users.is_email_verified IS 'Whether the email address has been verified.';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp of successful email verification.';
COMMENT ON COLUMN users.is_phone_verified IS 'Whether the phone number has been verified.';
COMMENT ON COLUMN users.phone_verified_at IS 'Timestamp of successful phone verification.';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the latest successful login.';
COMMENT ON COLUMN users.failed_login_attempts IS 'Counter of consecutive failed login attempts.';
COMMENT ON COLUMN users.locked_until IS 'Temporary lock expiration timestamp.';
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp of the latest password change.';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp.';
COMMENT ON COLUMN users.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN users.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE employee_profiles IS 'Employee profile data for workspace users.';
COMMENT ON COLUMN employee_profiles.id IS 'Primary key of the employee profile.';
COMMENT ON COLUMN employee_profiles.user_id IS 'Foreign key to the underlying user account.';
COMMENT ON COLUMN employee_profiles.employee_code IS 'Internal employee identifier or personnel code.';
COMMENT ON COLUMN employee_profiles.first_name IS 'Employee first name.';
COMMENT ON COLUMN employee_profiles.last_name IS 'Employee last name.';
COMMENT ON COLUMN employee_profiles.patronymic IS 'Employee patronymic.';
COMMENT ON COLUMN employee_profiles.position_title IS 'Employee position title.';
COMMENT ON COLUMN employee_profiles.department_name IS 'Department or organizational unit.';
COMMENT ON COLUMN employee_profiles.region_id IS 'Region assigned to the employee, if applicable.';
COMMENT ON COLUMN employee_profiles.is_active IS 'Whether the employee profile is active.';
COMMENT ON COLUMN employee_profiles.preferred_2fa_method IS 'Preferred second-factor verification method.';
COMMENT ON COLUMN employee_profiles.last_activity_at IS 'Timestamp of the latest activity in the workspace.';
COMMENT ON COLUMN employee_profiles.deleted_at IS 'Soft delete timestamp.';
COMMENT ON COLUMN employee_profiles.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN employee_profiles.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE citizen_profiles IS 'Citizen profile data linked to citizen user accounts.';
COMMENT ON COLUMN citizen_profiles.id IS 'Primary key of the citizen profile.';
COMMENT ON COLUMN citizen_profiles.user_id IS 'Foreign key to the underlying user account.';
COMMENT ON COLUMN citizen_profiles.iin IS 'Individual identification number of the citizen.';
COMMENT ON COLUMN citizen_profiles.first_name IS 'Citizen first name.';
COMMENT ON COLUMN citizen_profiles.last_name IS 'Citizen last name.';
COMMENT ON COLUMN citizen_profiles.patronymic IS 'Citizen patronymic.';
COMMENT ON COLUMN citizen_profiles.birth_date IS 'Citizen birth date.';
COMMENT ON COLUMN citizen_profiles.region_id IS 'Citizen region.';
COMMENT ON COLUMN citizen_profiles.preferred_language IS 'Preferred interface language.';
COMMENT ON COLUMN citizen_profiles.address IS 'Citizen address or location details.';
COMMENT ON COLUMN citizen_profiles.deleted_at IS 'Soft delete timestamp.';
COMMENT ON COLUMN citizen_profiles.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN citizen_profiles.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE user_roles IS 'Role assignments for user accounts with revocation history support.';
COMMENT ON COLUMN user_roles.id IS 'Primary key of the role assignment.';
COMMENT ON COLUMN user_roles.user_id IS 'Foreign key to the user receiving the role.';
COMMENT ON COLUMN user_roles.role_id IS 'Foreign key to the assigned role.';
COMMENT ON COLUMN user_roles.assigned_by_user_id IS 'User who assigned the role.';
COMMENT ON COLUMN user_roles.assigned_at IS 'Timestamp when the role was assigned.';
COMMENT ON COLUMN user_roles.revoked_at IS 'Timestamp when the role assignment was revoked.';
COMMENT ON COLUMN user_roles.revoked_by_user_id IS 'User who revoked the role assignment.';
COMMENT ON COLUMN user_roles.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN user_roles.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE complaints IS 'Main register of citizen complaints about internet and financial fraud.';
COMMENT ON COLUMN complaints.id IS 'Primary key of the complaint.';
COMMENT ON COLUMN complaints.complaint_number IS 'Human-readable complaint registration number.';
COMMENT ON COLUMN complaints.citizen_user_id IS 'Citizen user who submitted the complaint.';
COMMENT ON COLUMN complaints.region_id IS 'Region associated with the complaint.';
COMMENT ON COLUMN complaints.fraud_type_id IS 'Fraud type classification of the complaint.';
COMMENT ON COLUMN complaints.title IS 'Short title or subject of the complaint.';
COMMENT ON COLUMN complaints.description IS 'Detailed complaint description.';
COMMENT ON COLUMN complaints.incident_at IS 'Timestamp of the reported incident.';
COMMENT ON COLUMN complaints.damage_amount IS 'Financial damage amount reported by the citizen.';
COMMENT ON COLUMN complaints.damage_currency IS 'ISO currency code for the damage amount.';
COMMENT ON COLUMN complaints.current_status IS 'Current complaint status.';
COMMENT ON COLUMN complaints.current_assignee_employee_id IS 'Current assigned employee profile.';
COMMENT ON COLUMN complaints.duplicate_of_complaint_id IS 'Reference to the original complaint if this complaint is marked as duplicate.';
COMMENT ON COLUMN complaints.submission_source IS 'Origin channel where the complaint was created.';
COMMENT ON COLUMN complaints.submitted_at IS 'Timestamp when the complaint was submitted.';
COMMENT ON COLUMN complaints.last_status_changed_at IS 'Timestamp of the latest status change.';
COMMENT ON COLUMN complaints.resolved_at IS 'Timestamp when the complaint was resolved or closed.';
COMMENT ON COLUMN complaints.metadata IS 'Additional structured metadata for integrations and workflow.';
COMMENT ON COLUMN complaints.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN complaints.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE complaint_contacts IS 'Suspicious phones, emails, URLs, cards and IBANs attached to complaints.';
COMMENT ON COLUMN complaint_contacts.id IS 'Primary key of the complaint contact row.';
COMMENT ON COLUMN complaint_contacts.complaint_id IS 'Foreign key to the complaint.';
COMMENT ON COLUMN complaint_contacts.contact_type IS 'Type of suspicious contact or identifier.';
COMMENT ON COLUMN complaint_contacts.raw_value IS 'Original value entered by the user.';
COMMENT ON COLUMN complaint_contacts.normalized_value IS 'Normalized value used for matching and search.';
COMMENT ON COLUMN complaint_contacts.label IS 'Optional label describing the contact in the complaint context.';
COMMENT ON COLUMN complaint_contacts.is_primary IS 'Whether this contact is the main suspicious identifier for the complaint.';
COMMENT ON COLUMN complaint_contacts.metadata IS 'Additional structured metadata.';
COMMENT ON COLUMN complaint_contacts.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN complaint_contacts.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE complaint_files IS 'Files attached to complaints, including citizen evidence and internal files.';
COMMENT ON COLUMN complaint_files.id IS 'Primary key of the complaint file row.';
COMMENT ON COLUMN complaint_files.complaint_id IS 'Foreign key to the complaint.';
COMMENT ON COLUMN complaint_files.uploaded_by_user_id IS 'User who uploaded the file.';
COMMENT ON COLUMN complaint_files.original_file_name IS 'Original client-side file name.';
COMMENT ON COLUMN complaint_files.storage_bucket IS 'S3-compatible bucket name.';
COMMENT ON COLUMN complaint_files.storage_object_key IS 'Object key in S3-compatible storage.';
COMMENT ON COLUMN complaint_files.mime_type IS 'MIME type of the file.';
COMMENT ON COLUMN complaint_files.file_size_bytes IS 'File size in bytes.';
COMMENT ON COLUMN complaint_files.checksum_sha256 IS 'SHA-256 checksum of the stored file.';
COMMENT ON COLUMN complaint_files.file_status IS 'Technical file status after upload and scanning.';
COMMENT ON COLUMN complaint_files.is_internal IS 'Whether the file is visible only to employees.';
COMMENT ON COLUMN complaint_files.scan_completed_at IS 'Timestamp when file scanning finished.';
COMMENT ON COLUMN complaint_files.deleted_at IS 'Soft delete timestamp.';
COMMENT ON COLUMN complaint_files.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN complaint_files.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE complaint_status_history IS 'Append-only history of complaint status transitions.';
COMMENT ON COLUMN complaint_status_history.id IS 'Primary key of the complaint status history row.';
COMMENT ON COLUMN complaint_status_history.complaint_id IS 'Foreign key to the complaint.';
COMMENT ON COLUMN complaint_status_history.from_status IS 'Previous status before the change.';
COMMENT ON COLUMN complaint_status_history.to_status IS 'New status after the change.';
COMMENT ON COLUMN complaint_status_history.reason_code IS 'Optional machine-readable reason code.';
COMMENT ON COLUMN complaint_status_history.reason_text IS 'Human-readable reason or explanation.';
COMMENT ON COLUMN complaint_status_history.changed_by_user_id IS 'User who performed the status change.';
COMMENT ON COLUMN complaint_status_history.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN complaint_status_history.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE complaint_comments IS 'Comments and discussion entries related to complaints.';
COMMENT ON COLUMN complaint_comments.id IS 'Primary key of the complaint comment.';
COMMENT ON COLUMN complaint_comments.complaint_id IS 'Foreign key to the complaint.';
COMMENT ON COLUMN complaint_comments.author_user_id IS 'Author of the comment. Null is allowed for system comments.';
COMMENT ON COLUMN complaint_comments.parent_comment_id IS 'Optional parent comment for threaded discussions.';
COMMENT ON COLUMN complaint_comments.visibility IS 'Visibility scope of the comment.';
COMMENT ON COLUMN complaint_comments.comment_text IS 'Comment body text.';
COMMENT ON COLUMN complaint_comments.is_system_generated IS 'Whether the comment was generated automatically by the system.';
COMMENT ON COLUMN complaint_comments.deleted_at IS 'Soft delete timestamp.';
COMMENT ON COLUMN complaint_comments.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN complaint_comments.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE blacklist_entries IS 'Registry of suspicious values confirmed or imported into the blacklist.';
COMMENT ON COLUMN blacklist_entries.id IS 'Primary key of the blacklist entry.';
COMMENT ON COLUMN blacklist_entries.entry_type IS 'Type of suspicious value.';
COMMENT ON COLUMN blacklist_entries.raw_value IS 'Original value as first recorded.';
COMMENT ON COLUMN blacklist_entries.normalized_value IS 'Normalized value used for matching and uniqueness.';
COMMENT ON COLUMN blacklist_entries.fraud_type_id IS 'Fraud type associated with the entry.';
COMMENT ON COLUMN blacklist_entries.region_id IS 'Region associated with the entry, if applicable.';
COMMENT ON COLUMN blacklist_entries.source_complaint_id IS 'Complaint that led to the blacklist entry.';
COMMENT ON COLUMN blacklist_entries.source_type IS 'Source by which the blacklist entry was created.';
COMMENT ON COLUMN blacklist_entries.notes IS 'Internal notes about the blacklist entry.';
COMMENT ON COLUMN blacklist_entries.risk_score IS 'Risk score from 0 to 100.';
COMMENT ON COLUMN blacklist_entries.is_active IS 'Whether the blacklist entry is active.';
COMMENT ON COLUMN blacklist_entries.last_seen_at IS 'Timestamp when the value was last observed.';
COMMENT ON COLUMN blacklist_entries.deleted_at IS 'Soft delete timestamp.';
COMMENT ON COLUMN blacklist_entries.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN blacklist_entries.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE blacklist_checks IS 'Append-only log of blacklist verification requests.';
COMMENT ON COLUMN blacklist_checks.id IS 'Primary key of the blacklist check row.';
COMMENT ON COLUMN blacklist_checks.checked_by_user_id IS 'User who executed the check, if authenticated.';
COMMENT ON COLUMN blacklist_checks.check_type IS 'Type of value being checked.';
COMMENT ON COLUMN blacklist_checks.input_value IS 'Original value submitted for verification.';
COMMENT ON COLUMN blacklist_checks.normalized_value IS 'Normalized value used for comparison.';
COMMENT ON COLUMN blacklist_checks.matched_blacklist_entry_id IS 'Matched blacklist entry, if any.';
COMMENT ON COLUMN blacklist_checks.match_found IS 'Whether at least one match was found.';
COMMENT ON COLUMN blacklist_checks.match_count IS 'Number of matching records found.';
COMMENT ON COLUMN blacklist_checks.source IS 'Source channel from which the check was performed.';
COMMENT ON COLUMN blacklist_checks.request_ip IS 'IP address of the requester.';
COMMENT ON COLUMN blacklist_checks.user_agent IS 'User agent of the requester.';
COMMENT ON COLUMN blacklist_checks.response_payload IS 'Response metadata or risk summary payload.';
COMMENT ON COLUMN blacklist_checks.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN blacklist_checks.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE notifications IS 'Outbound and in-application notifications delivered to users.';
COMMENT ON COLUMN notifications.id IS 'Primary key of the notification.';
COMMENT ON COLUMN notifications.user_id IS 'Recipient user identifier.';
COMMENT ON COLUMN notifications.channel IS 'Notification delivery channel.';
COMMENT ON COLUMN notifications.notification_type IS 'Machine-readable notification type code.';
COMMENT ON COLUMN notifications.subject IS 'Notification subject or title.';
COMMENT ON COLUMN notifications.body IS 'Notification body content.';
COMMENT ON COLUMN notifications.payload IS 'Structured payload for templating or navigation.';
COMMENT ON COLUMN notifications.status IS 'Current delivery or read status.';
COMMENT ON COLUMN notifications.sent_at IS 'Timestamp when the notification was sent to the provider.';
COMMENT ON COLUMN notifications.delivered_at IS 'Timestamp when the notification was delivered successfully.';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when the user read the notification.';
COMMENT ON COLUMN notifications.failed_at IS 'Timestamp when delivery failed.';
COMMENT ON COLUMN notifications.failure_reason IS 'Failure description returned by the provider or system.';
COMMENT ON COLUMN notifications.related_entity_type IS 'Business entity type linked to the notification.';
COMMENT ON COLUMN notifications.related_entity_id IS 'Business entity identifier linked to the notification.';
COMMENT ON COLUMN notifications.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN notifications.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE news IS 'News and educational publications displayed on the public portal.';
COMMENT ON COLUMN news.id IS 'Primary key of the news record.';
COMMENT ON COLUMN news.slug IS 'Unique SEO-friendly slug.';
COMMENT ON COLUMN news.title_kz IS 'News title in Kazakh.';
COMMENT ON COLUMN news.title_ru IS 'News title in Russian.';
COMMENT ON COLUMN news.summary_kz IS 'Short summary in Kazakh.';
COMMENT ON COLUMN news.summary_ru IS 'Short summary in Russian.';
COMMENT ON COLUMN news.content_kz IS 'Full content in Kazakh.';
COMMENT ON COLUMN news.content_ru IS 'Full content in Russian.';
COMMENT ON COLUMN news.region_id IS 'Optional region linked to the publication.';
COMMENT ON COLUMN news.status IS 'Publication lifecycle status.';
COMMENT ON COLUMN news.published_at IS 'Timestamp when the publication became public.';
COMMENT ON COLUMN news.author_user_id IS 'Author or publisher user.';
COMMENT ON COLUMN news.cover_image_bucket IS 'Bucket containing the cover image.';
COMMENT ON COLUMN news.cover_image_object_key IS 'Object key of the cover image.';
COMMENT ON COLUMN news.deleted_at IS 'Soft delete timestamp.';
COMMENT ON COLUMN news.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN news.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE audit_logs IS 'Append-only audit trail of security-sensitive and business-critical actions.';
COMMENT ON COLUMN audit_logs.id IS 'Primary key of the audit event.';
COMMENT ON COLUMN audit_logs.actor_user_id IS 'User who performed the action, if applicable.';
COMMENT ON COLUMN audit_logs.action_type IS 'Action type code.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Affected entity type.';
COMMENT ON COLUMN audit_logs.entity_id IS 'Affected entity identifier.';
COMMENT ON COLUMN audit_logs.request_id IS 'Request correlation identifier.';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address associated with the request.';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent associated with the request.';
COMMENT ON COLUMN audit_logs.http_method IS 'HTTP method used for the request.';
COMMENT ON COLUMN audit_logs.request_path IS 'Request path associated with the action.';
COMMENT ON COLUMN audit_logs.response_status_code IS 'HTTP response status code.';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous entity state snapshot.';
COMMENT ON COLUMN audit_logs.new_values IS 'New entity state snapshot.';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional event metadata.';
COMMENT ON COLUMN audit_logs.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN audit_logs.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE refresh_tokens IS 'Rotating refresh tokens for session continuation.';
COMMENT ON COLUMN refresh_tokens.id IS 'Primary key of the refresh token row.';
COMMENT ON COLUMN refresh_tokens.user_id IS 'Owner of the refresh token.';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 hash of the refresh token.';
COMMENT ON COLUMN refresh_tokens.token_family_id IS 'Token family identifier used for rotation and compromise detection.';
COMMENT ON COLUMN refresh_tokens.replaced_by_token_id IS 'Reference to the next refresh token issued during rotation.';
COMMENT ON COLUMN refresh_tokens.issued_ip IS 'IP address from which the token was issued.';
COMMENT ON COLUMN refresh_tokens.user_agent IS 'User agent from which the token was issued.';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Refresh token expiration timestamp.';
COMMENT ON COLUMN refresh_tokens.revoked_at IS 'Token revocation timestamp.';
COMMENT ON COLUMN refresh_tokens.last_used_at IS 'Last successful use timestamp.';
COMMENT ON COLUMN refresh_tokens.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN refresh_tokens.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE otp_codes IS 'One-time passcodes used for verification and authentication flows.';
COMMENT ON COLUMN otp_codes.id IS 'Primary key of the OTP row.';
COMMENT ON COLUMN otp_codes.user_id IS 'User linked to the OTP, if already known.';
COMMENT ON COLUMN otp_codes.purpose IS 'Business purpose of the OTP.';
COMMENT ON COLUMN otp_codes.channel IS 'Channel used to deliver the OTP.';
COMMENT ON COLUMN otp_codes.target IS 'Phone number or email address that received the OTP.';
COMMENT ON COLUMN otp_codes.code_hash IS 'SHA-256 hash of the OTP code.';
COMMENT ON COLUMN otp_codes.expires_at IS 'OTP expiration timestamp.';
COMMENT ON COLUMN otp_codes.consumed_at IS 'Timestamp when the OTP was successfully used.';
COMMENT ON COLUMN otp_codes.attempts_used IS 'Number of verification attempts already used.';
COMMENT ON COLUMN otp_codes.max_attempts IS 'Maximum allowed number of verification attempts.';
COMMENT ON COLUMN otp_codes.request_ip IS 'IP address associated with the OTP request.';
COMMENT ON COLUMN otp_codes.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN otp_codes.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE two_factor_sessions IS 'Second-factor verification sessions for employee authentication.';
COMMENT ON COLUMN two_factor_sessions.id IS 'Primary key of the two-factor session.';
COMMENT ON COLUMN two_factor_sessions.user_id IS 'User performing second-factor verification.';
COMMENT ON COLUMN two_factor_sessions.method IS 'Selected second-factor method.';
COMMENT ON COLUMN two_factor_sessions.session_status IS 'Current lifecycle status of the second-factor session.';
COMMENT ON COLUMN two_factor_sessions.verification_token_hash IS 'SHA-256 hash of the temporary verification token.';
COMMENT ON COLUMN two_factor_sessions.challenge_expires_at IS 'Expiration timestamp for the challenge.';
COMMENT ON COLUMN two_factor_sessions.verified_at IS 'Timestamp when verification succeeded.';
COMMENT ON COLUMN two_factor_sessions.trusted_device IS 'Whether the device can be treated as trusted according to policy.';
COMMENT ON COLUMN two_factor_sessions.request_ip IS 'IP address associated with the second-factor request.';
COMMENT ON COLUMN two_factor_sessions.user_agent IS 'User agent associated with the second-factor request.';
COMMENT ON COLUMN two_factor_sessions.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN two_factor_sessions.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE export_jobs IS 'Asynchronous export jobs for CSV, XLSX and PDF generation.';
COMMENT ON COLUMN export_jobs.id IS 'Primary key of the export job.';
COMMENT ON COLUMN export_jobs.requested_by_user_id IS 'User who requested the export.';
COMMENT ON COLUMN export_jobs.job_type IS 'Export job type.';
COMMENT ON COLUMN export_jobs.job_status IS 'Current processing status of the export job.';
COMMENT ON COLUMN export_jobs.filters IS 'Filter criteria used to generate the export.';
COMMENT ON COLUMN export_jobs.file_name IS 'Generated file name visible to the user.';
COMMENT ON COLUMN export_jobs.storage_bucket IS 'Bucket containing the generated export file.';
COMMENT ON COLUMN export_jobs.storage_object_key IS 'Object key of the generated export file.';
COMMENT ON COLUMN export_jobs.row_count IS 'Number of rows included in the export, if applicable.';
COMMENT ON COLUMN export_jobs.started_at IS 'Timestamp when processing started.';
COMMENT ON COLUMN export_jobs.completed_at IS 'Timestamp when processing completed successfully.';
COMMENT ON COLUMN export_jobs.failed_at IS 'Timestamp when processing failed.';
COMMENT ON COLUMN export_jobs.expires_at IS 'Timestamp after which the exported file should be treated as expired.';
COMMENT ON COLUMN export_jobs.error_message IS 'Technical error description for failed jobs.';
COMMENT ON COLUMN export_jobs.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN export_jobs.updated_at IS 'Last row update timestamp.';

COMMENT ON TABLE system_settings IS 'Application configuration settings stored in the database.';
COMMENT ON COLUMN system_settings.id IS 'Primary key of the system setting.';
COMMENT ON COLUMN system_settings.setting_key IS 'Unique configuration key.';
COMMENT ON COLUMN system_settings.setting_group IS 'Functional group of the setting.';
COMMENT ON COLUMN system_settings.setting_value IS 'Setting value stored as JSONB.';
COMMENT ON COLUMN system_settings.value_type IS 'Declared logical type of the setting value.';
COMMENT ON COLUMN system_settings.description IS 'Human-readable setting description.';
COMMENT ON COLUMN system_settings.is_secret IS 'Whether the setting contains a secret value.';
COMMENT ON COLUMN system_settings.is_public IS 'Whether the setting may be exposed to non-sensitive client configuration.';
COMMENT ON COLUMN system_settings.updated_by_user_id IS 'User who last changed the setting.';
COMMENT ON COLUMN system_settings.deleted_at IS 'Soft delete timestamp.';
COMMENT ON COLUMN system_settings.created_at IS 'Row creation timestamp.';
COMMENT ON COLUMN system_settings.updated_at IS 'Last row update timestamp.';

INSERT INTO roles (id, code, name_kz, name_ru, description, is_system, is_active, sort_order)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'CITIZEN', 'Азамат', 'Гражданин', 'Public portal citizen role.', TRUE, TRUE, 10),
    ('11111111-1111-1111-1111-111111111102', 'OPERATOR', 'Оператор', 'Оператор', 'Workspace operator role for first-line processing.', TRUE, TRUE, 20),
    ('11111111-1111-1111-1111-111111111103', 'SUPERVISOR', 'Жетекші', 'Руководитель', 'Supervisor role for assignment and oversight.', TRUE, TRUE, 30),
    ('11111111-1111-1111-1111-111111111104', 'ADMIN', 'Әкімші', 'Администратор', 'Administrative role with platform management permissions.', TRUE, TRUE, 40)
ON CONFLICT (code) DO UPDATE
SET
    name_kz = EXCLUDED.name_kz,
    name_ru = EXCLUDED.name_ru,
    description = EXCLUDED.description,
    is_system = EXCLUDED.is_system,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO complaint_statuses (id, code, name_kz, name_ru, description, is_terminal, is_active, sort_order)
VALUES
    ('44444444-4444-4444-4444-444444444401', 'NEW', 'ЖАҢА', 'НОВАЯ', 'Complaint has been submitted and registered in the system.', FALSE, TRUE, 10),
    ('44444444-4444-4444-4444-444444444402', 'UNDER_REVIEW', 'ҚАРАУДА', 'НА РАССМОТРЕНИИ', 'Complaint is under primary review by staff.', FALSE, TRUE, 20),
    ('44444444-4444-4444-4444-444444444403', 'NEED_INFO', 'ҚОСЫМША АҚПАРАТ ҚАЖЕТ', 'ТРЕБУЕТСЯ ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ', 'Additional information is required from the citizen.', FALSE, TRUE, 30),
    ('44444444-4444-4444-4444-444444444404', 'ASSIGNED', 'ТАҒАЙЫНДАЛДЫ', 'НАЗНАЧЕНА', 'Complaint has been assigned to an employee.', FALSE, TRUE, 40),
    ('44444444-4444-4444-4444-444444444405', 'IN_PROGRESS', 'ӨҢДЕЛУДЕ', 'В РАБОТЕ', 'Complaint is actively being processed.', FALSE, TRUE, 50),
    ('44444444-4444-4444-4444-444444444406', 'RESOLVED', 'ШЕШІЛДІ', 'РЕШЕНА', 'Complaint has been resolved.', TRUE, TRUE, 60),
    ('44444444-4444-4444-4444-444444444407', 'REJECTED', 'ҚАБЫЛДАНБАДЫ', 'ОТКЛОНЕНА', 'Complaint was rejected according to business rules.', TRUE, TRUE, 70),
    ('44444444-4444-4444-4444-444444444408', 'DUPLICATE', 'ҚАЙТАЛАНҒАН', 'ДУБЛИКАТ', 'Complaint duplicates an existing record.', TRUE, TRUE, 80)
ON CONFLICT (code) DO UPDATE
SET
    name_kz = EXCLUDED.name_kz,
    name_ru = EXCLUDED.name_ru,
    description = EXCLUDED.description,
    is_terminal = EXCLUDED.is_terminal,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO regions (id, code, kind, name_kz, name_ru, is_active, sort_order)
VALUES
    ('22222222-2222-2222-2222-222222222201', 'ASTANA', 'CITY', 'Астана', 'Астана', TRUE, 10),
    ('22222222-2222-2222-2222-222222222202', 'ALMATY_CITY', 'CITY', 'Алматы', 'Алматы', TRUE, 20),
    ('22222222-2222-2222-2222-222222222203', 'SHYMKENT', 'CITY', 'Шымкент', 'Шымкент', TRUE, 30),
    ('22222222-2222-2222-2222-222222222204', 'ABAI', 'REGION', 'Абай облысы', 'область Абай', TRUE, 40),
    ('22222222-2222-2222-2222-222222222205', 'AKMOLA', 'REGION', 'Ақмола облысы', 'Акмолинская область', TRUE, 50),
    ('22222222-2222-2222-2222-222222222206', 'AKTOBE', 'REGION', 'Ақтөбе облысы', 'Актюбинская область', TRUE, 60),
    ('22222222-2222-2222-2222-222222222207', 'ALMATY_REGION', 'REGION', 'Алматы облысы', 'Алматинская область', TRUE, 70),
    ('22222222-2222-2222-2222-222222222208', 'ATYRAU', 'REGION', 'Атырау облысы', 'Атырауская область', TRUE, 80),
    ('22222222-2222-2222-2222-222222222209', 'EAST_KAZAKHSTAN', 'REGION', 'Шығыс Қазақстан облысы', 'Восточно-Казахстанская область', TRUE, 90),
    ('22222222-2222-2222-2222-222222222210', 'ZHAMBYL', 'REGION', 'Жамбыл облысы', 'Жамбылская область', TRUE, 100),
    ('22222222-2222-2222-2222-222222222211', 'ZHETISU', 'REGION', 'Жетісу облысы', 'область Жетісу', TRUE, 110),
    ('22222222-2222-2222-2222-222222222212', 'WEST_KAZAKHSTAN', 'REGION', 'Батыс Қазақстан облысы', 'Западно-Казахстанская область', TRUE, 120),
    ('22222222-2222-2222-2222-222222222213', 'KARAGANDA', 'REGION', 'Қарағанды облысы', 'Карагандинская область', TRUE, 130),
    ('22222222-2222-2222-2222-222222222214', 'KOSTANAY', 'REGION', 'Қостанай облысы', 'Костанайская область', TRUE, 140),
    ('22222222-2222-2222-2222-222222222215', 'KYZYLORDA', 'REGION', 'Қызылорда облысы', 'Кызылординская область', TRUE, 150),
    ('22222222-2222-2222-2222-222222222216', 'MANGYSTAU', 'REGION', 'Маңғыстау облысы', 'Мангистауская область', TRUE, 160),
    ('22222222-2222-2222-2222-222222222217', 'PAVLODAR', 'REGION', 'Павлодар облысы', 'Павлодарская область', TRUE, 170),
    ('22222222-2222-2222-2222-222222222218', 'NORTH_KAZAKHSTAN', 'REGION', 'Солтүстік Қазақстан облысы', 'Северо-Казахстанская область', TRUE, 180),
    ('22222222-2222-2222-2222-222222222219', 'TURKISTAN', 'REGION', 'Түркістан облысы', 'Туркестанская область', TRUE, 190),
    ('22222222-2222-2222-2222-222222222220', 'ULYTAU', 'REGION', 'Ұлытау облысы', 'область Ұлытау', TRUE, 200)
ON CONFLICT (code) DO UPDATE
SET
    kind = EXCLUDED.kind,
    name_kz = EXCLUDED.name_kz,
    name_ru = EXCLUDED.name_ru,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO fraud_types (id, code, name_kz, name_ru, description_kz, description_ru, is_active, sort_order, deleted_at)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'PHISHING', 'Фишинг', 'Фишинг', 'Жалған сайттар немесе хабарламалар арқылы деректерді ұрлау.', 'Хищение данных через поддельные сайты или сообщения.', TRUE, 10, NULL),
    ('33333333-3333-3333-3333-333333333302', 'PHONE_SCAM', 'Телефон арқылы алаяқтық', 'Телефонное мошенничество', 'Банк, полиция немесе басқа ұйым атынан қоңырау шалу арқылы алдау.', 'Обман по телефону от имени банка, полиции или другой организации.', TRUE, 20, NULL),
    ('33333333-3333-3333-3333-333333333303', 'SMS_SCAM', 'SMS алаяқтығы', 'SMS-мошенничество', 'Зиянды сілтемелері бар немесе төлем талап ететін SMS-хабарламалар.', 'SMS-сообщения с вредоносными ссылками или требованиями оплаты.', TRUE, 30, NULL),
    ('33333333-3333-3333-3333-333333333304', 'MESSENGER_ACCOUNT_TAKEOVER', 'Мессенджердегі аккаунтты басып алу', 'Захват аккаунта в мессенджере', 'Мессенджер аккаунтын бұзып, оның атынан ақша сұрау.', 'Взлом аккаунта в мессенджере и запрос денег от имени владельца.', TRUE, 40, NULL),
    ('33333333-3333-3333-3333-333333333305', 'MARKETPLACE_FRAUD', 'Маркетплейс алаяқтығы', 'Мошенничество на маркетплейсах', 'Сауда платформаларында жалған сатушы немесе сатып алушы схемалары.', 'Схемы с ложным продавцом или покупателем на торговых площадках.', TRUE, 50, NULL),
    ('33333333-3333-3333-3333-333333333306', 'INVESTMENT_FRAUD', 'Инвестициялық алаяқтық', 'Инвестиционное мошенничество', 'Жалған инвестициялық жобалар және уәде етілген жоғары табыс схемалары.', 'Фиктивные инвестиционные проекты и схемы с обещанием высокой доходности.', TRUE, 60, NULL),
    ('33333333-3333-3333-3333-333333333307', 'LOAN_FRAUD', 'Несиеге байланысты алаяқтық', 'Мошенничество с займами и кредитами', 'Жалған несие рәсімдеу, алдын ала комиссия сұрау немесе жалған МҚҰ схемалары.', 'Оформление фиктивных кредитов, запрос предоплаты или схемы с ложными МФО.', TRUE, 70, NULL),
    ('33333333-3333-3333-3333-333333333308', 'CARD_DETAILS_THEFT', 'Карта деректерін ұрлау', 'Кража данных банковской карты', 'Банк картасының реквизиттерін, CVV немесе 3DS кодтарын иемдену.', 'Хищение реквизитов банковской карты, CVV или 3DS-кодов.', TRUE, 80, NULL),
    ('33333333-3333-3333-3333-333333333309', 'FAKE_ECOMMERCE_WEBSITE', 'Жалған интернет-дүкен', 'Поддельный интернет-магазин', 'Төлем қабылдап, тауарды жеткізбейтін жалған сайттар.', 'Поддельные сайты, принимающие оплату без доставки товара.', TRUE, 90, NULL),
    ('33333333-3333-3333-3333-333333333310', 'CRYPTO_FRAUD', 'Криптовалютаға қатысты алаяқтық', 'Мошенничество с криптовалютой', 'Криптоәмиян, инвестиция немесе айырбастау бойынша алаяқтық схемалар.', 'Мошеннические схемы, связанные с криптокошельками, инвестициями или обменом.', TRUE, 100, NULL),
    ('33333333-3333-3333-3333-333333333311', 'JOB_FRAUD', 'Жұмысқа орналастыру алаяқтығы', 'Мошенничество с трудоустройством', 'Жалған жұмыс ұсыныстары және алдын ала төлем талаптары.', 'Фиктивные вакансии и требования предоплаты за трудоустройство.', TRUE, 110, NULL),
    ('33333333-3333-3333-3333-333333333312', 'ROMANCE_FRAUD', 'Романтикалық алаяқтық', 'Романтическое мошенничество', 'Сенімге кіріп, кейін ақша немесе жеке деректер сұрау.', 'Вхождение в доверие с последующим запросом денег или персональных данных.', TRUE, 120, NULL)
ON CONFLICT (code) DO UPDATE
SET
    name_kz = EXCLUDED.name_kz,
    name_ru = EXCLUDED.name_ru,
    description_kz = EXCLUDED.description_kz,
    description_ru = EXCLUDED.description_ru,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    deleted_at = EXCLUDED.deleted_at,
    updated_at = NOW();

COMMIT;
