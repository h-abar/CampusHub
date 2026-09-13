-- CampusHub / بوابة الاتصال المؤسسي — جامعة المعرفة
-- PostgreSQL schema
-- Run: psql -d campushub -f schema.sql

CREATE TABLE IF NOT EXISTS admins (
  id          TEXT PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  name        TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'admin',
  department  TEXT,
  password    TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  services    JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venues (
  id                    TEXT PRIMARY KEY,
  name_ar               TEXT NOT NULL,
  name_en               TEXT,
  category              TEXT,
  capacity              INTEGER NOT NULL DEFAULT 0,
  capacity_by_event_type JSONB,
  area                  TEXT,
  location              TEXT,
  floor                 TEXT,
  amenities             JSONB NOT NULL DEFAULT '[]',
  features              JSONB NOT NULL DEFAULT '[]',
  image                 TEXT,
  hourly_rate           NUMERIC,
  daily_rate            NUMERIC,
  adjacent_to           TEXT,
  enabled               BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS requests (
  id                    TEXT PRIMARY KEY,
  tracking_code         TEXT UNIQUE NOT NULL,
  service_type          TEXT NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  request_date          DATE,
  event_dates           JSONB NOT NULL DEFAULT '[]',
  venues                JSONB NOT NULL DEFAULT '[]',
  status                TEXT NOT NULL DEFAULT 'pending',
  status_history        JSONB NOT NULL DEFAULT '[]',
  priority              TEXT NOT NULL DEFAULT 'normal',
  requester_name        TEXT NOT NULL,
  requester_email       TEXT,
  requester_phone       TEXT,
  requester_department  TEXT,
  requester_type        TEXT NOT NULL DEFAULT 'internal',
  external_entity       TEXT,
  additional_notes      TEXT,
  admin_notes           TEXT,
  -- Extended form fields
  venue_event_type      TEXT,
  news_date             DATE,
  publishing_channels   JSONB,
  design_language       TEXT,
  target_audience       TEXT,
  design_category       TEXT,
  design_links          TEXT,
  design_logos          JSONB,
  workshop_attachments  JSONB,
  design_brief          TEXT,
  other_event_type      TEXT,
  needs_venue_booking   BOOLEAN,
  needs_documentation   BOOLEAN,
  documentation_type    TEXT,
  support_services      JSONB,
  expected_visitors     INTEGER,
  visitor_gender        TEXT,
  messages              JSONB NOT NULL DEFAULT '[]',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade path for existing databases
ALTER TABLE requests ADD COLUMN IF NOT EXISTS messages JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_service ON requests(service_type);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_tracking ON requests(tracking_code);

CREATE TABLE IF NOT EXISTS settings (
  id    INTEGER PRIMARY KEY DEFAULT 1,
  data  JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
