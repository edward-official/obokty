-- ============================================================
-- ObokTy Database Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- User Table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    partner_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    native_language VARCHAR(10) NOT NULL CHECK (native_language IN ('ko', 'pl')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Couple Request Table
-- ============================================================
CREATE TABLE IF NOT EXISTS couple_requests (
    id          SERIAL PRIMARY KEY,
    sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      VARCHAR(10) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (sender_id, receiver_id)
);

-- ============================================================
-- Word Table
-- ============================================================
CREATE TABLE IF NOT EXISTS words (
    id              SERIAL PRIMARY KEY,
    base_word       VARCHAR(100) NOT NULL,  -- 영어 기준어 (e.g. "window")
    translation_pl  VARCHAR(100) NOT NULL,  -- 폴란드어 번역 (e.g. "okno")
    translation_kr  VARCHAR(100) NOT NULL,  -- 한국어 번역 (e.g. "창문")
    category        VARCHAR(50)             -- 카테고리 (e.g. "household")
);

-- ============================================================
-- Game Session Table
-- ============================================================
CREATE TABLE IF NOT EXISTS game_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id       UUID NOT NULL REFERENCES users(id),
    total_rounds    INTEGER NOT NULL CHECK (total_rounds > 0),
    time_limit_sec  INTEGER NOT NULL CHECK (time_limit_sec > 0),
    status          VARCHAR(10) NOT NULL DEFAULT 'waiting'
                        CHECK (status IN ('waiting', 'playing', 'finished')),
    winner_id       UUID REFERENCES users(id),  -- NULL = 동점
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Round Answer Table
-- ============================================================
CREATE TABLE IF NOT EXISTS round_answers (
    id              SERIAL PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_number    INTEGER NOT NULL,
    word_id         INTEGER NOT NULL REFERENCES words(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    chosen_answer   VARCHAR(100),           -- 시간 초과 시 NULL
    is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at     TIMESTAMPTZ,
    UNIQUE (session_id, round_number, user_id)
);

-- ============================================================
-- Seed: 초기 단어 데이터 (폴란드어-한국어 20단어)
-- ============================================================
INSERT INTO words (base_word, translation_pl, translation_kr, category) VALUES
  ('window',     'okno',       '창문',   'household'),
  ('door',       'drzwi',      '문',     'household'),
  ('table',      'stół',       '테이블', 'household'),
  ('chair',      'krzesło',    '의자',   'household'),
  ('water',      'woda',       '물',     'food'),
  ('bread',      'chleb',      '빵',     'food'),
  ('apple',      'jabłko',     '사과',   'food'),
  ('cat',        'kot',        '고양이', 'animals'),
  ('dog',        'pies',       '개',     'animals'),
  ('book',       'książka',    '책',     'education'),
  ('school',     'szkoła',     '학교',   'education'),
  ('friend',     'przyjaciel', '친구',   'people'),
  ('family',     'rodzina',    '가족',   'people'),
  ('love',       'miłość',     '사랑',   'emotions'),
  ('happy',      'szczęśliwy', '행복한', 'emotions'),
  ('sun',        'słońce',     '태양',   'nature'),
  ('rain',       'deszcz',     '비',     'nature'),
  ('city',       'miasto',     '도시',   'places'),
  ('road',       'droga',      '길',     'places'),
  ('time',       'czas',       '시간',   'general')
ON CONFLICT DO NOTHING;
