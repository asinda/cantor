-- ══════════════════════════════════════════════════════════════
--  Cantor — Schema Supabase
--  Copier-coller dans l'éditeur SQL de Supabase
-- ══════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
--  CHORALES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS choirs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS choir_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  choir_id  UUID REFERENCES choirs(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT DEFAULT 'choriste', -- 'chef', 'chantre', 'choriste'
  voice     TEXT,                    -- 'soprano', 'alto', 'tenor', 'basse'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(choir_id, user_id)
);

-- ──────────────────────────────────────────────────────────────
--  CHANTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS songs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  choir_id         UUID REFERENCES choirs(id) ON DELETE CASCADE,
  created_by       UUID REFERENCES auth.users(id),

  -- Informations de base
  title            TEXT NOT NULL,
  languages        TEXT[] DEFAULT '{}',   -- ['fr', 'ki', 'sw', 'en']
  liturgical_type  TEXT,  -- 'entree','kyrie','gloria','psaume','alleluia','sanctus','agnus_dei','communion','sortie'
  liturgical_season TEXT, -- 'avent','noel','careme','paques','ordinaire','tous'
  difficulty       TEXT DEFAULT 'moyen',  -- 'facile','moyen','difficile'
  mood             TEXT,

  -- Données musicales
  key_signature    TEXT,   -- 'Do majeur', 'Ré mineur', etc.
  tempo_bpm        INTEGER,
  structure        JSONB,  -- [{type:'couplet',text:'...'},{type:'refrain',text:'...'}]
  chords           TEXT,

  -- Médias
  score_url        TEXT,   -- partition PDF (Supabase Storage)
  audio_url        TEXT,   -- mélodie principale

  -- Audio par pupitre
  audio_soprano    TEXT,
  audio_alto       TEXT,
  audio_tenor      TEXT,
  audio_bass       TEXT,

  -- Notes
  musical_notes    TEXT,  -- indications du chef
  internal_notes   TEXT,  -- notes internes

  -- Statut
  status           TEXT DEFAULT 'nouveau', -- 'nouveau','en_cours','appris'

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Paroles multilingues
CREATE TABLE IF NOT EXISTS song_lyrics (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id      UUID REFERENCES songs(id) ON DELETE CASCADE,
  language     TEXT NOT NULL,  -- 'fr', 'ki', 'sw', 'en'
  lyrics       TEXT,
  phonetic     TEXT,           -- transcription phonétique
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(song_id, language)
);

-- ──────────────────────────────────────────────────────────────
--  YOUTUBE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS youtube_links (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id        UUID REFERENCES songs(id) ON DELETE CASCADE,
  url            TEXT NOT NULL,
  video_id       TEXT,
  title          TEXT,
  channel        TEXT,
  thumbnail      TEXT,
  version_type   TEXT DEFAULT 'choral', -- 'choral','karaoke','satb','soprano','alto','tenor','bass','instrumental'
  is_primary     BOOLEAN DEFAULT false,
  -- Analyse IA (rempli par le service Python)
  detected_key   TEXT,
  detected_bpm   INTEGER,
  detected_chords TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
--  GUIDE VOIX (note de départ par pupitre)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_guides (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id        UUID REFERENCES songs(id) ON DELETE CASCADE,
  voice_part     TEXT NOT NULL,  -- 'soprano','alto','tenor','basse'
  starting_note  TEXT,           -- 'Mi4', 'Sol3', etc.
  entry_seconds  REAL,           -- moment d'entrée dans le chant (secondes)
  instructions   TEXT,           -- indications du chef
  audio_ref_url  TEXT,           -- extrait audio de référence
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(song_id, voice_part)
);

-- ──────────────────────────────────────────────────────────────
--  RÉPÉTITIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rehearsals (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  choir_id   UUID REFERENCES choirs(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehearsal_songs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rehearsal_id UUID REFERENCES rehearsals(id) ON DELETE CASCADE,
  song_id      UUID REFERENCES songs(id) ON DELETE CASCADE,
  mastery      INTEGER DEFAULT 0 CHECK (mastery BETWEEN 0 AND 100),
  notes        TEXT,
  UNIQUE(rehearsal_id, song_id)
);

-- ──────────────────────────────────────────────────────────────
--  FEUILLES DE MESSE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mass_sheets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  choir_id         UUID REFERENCES choirs(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  date             DATE,
  liturgical_season TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mass_sheet_songs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mass_sheet_id  UUID REFERENCES mass_sheets(id) ON DELETE CASCADE,
  song_id        UUID REFERENCES songs(id) ON DELETE CASCADE,
  position       INTEGER NOT NULL DEFAULT 0,
  moment         TEXT,  -- 'entree','kyrie','gloria','psaume','alleluia','sanctus','agnus_dei','communion','sortie'
  UNIQUE(mass_sheet_id, position)
);

-- ──────────────────────────────────────────────────────────────
--  VERSIONS PROPRES À LA CHORALE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS choir_song_versions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  choir_id         UUID REFERENCES choirs(id) ON DELETE CASCADE,
  song_id          UUID REFERENCES songs(id) ON DELETE CASCADE,
  custom_key       TEXT,
  custom_tempo     INTEGER,
  arrangement_notes TEXT,
  is_official      BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(choir_id, song_id)
);

-- ──────────────────────────────────────────────────────────────
--  RLS (Row Level Security)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE choirs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_lyrics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_guides      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsal_songs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_sheets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_sheet_songs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_song_versions ENABLE ROW LEVEL SECURITY;

-- Politique : membres d'une chorale voient les données de leur chorale
CREATE POLICY "choir_members_select" ON songs
  FOR SELECT USING (
    choir_id IN (
      SELECT choir_id FROM choir_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "choir_members_insert" ON songs
  FOR INSERT WITH CHECK (
    choir_id IN (
      SELECT choir_id FROM choir_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "choir_members_update" ON songs
  FOR UPDATE USING (
    choir_id IN (
      SELECT choir_id FROM choir_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "choir_members_delete" ON songs
  FOR DELETE USING (
    created_by = auth.uid() OR
    choir_id IN (
      SELECT choir_id FROM choir_members WHERE user_id = auth.uid() AND role IN ('chef','chantre')
    )
  );

-- Fonction mise à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
