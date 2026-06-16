-- ═══════════════════════════════════════════════════════
--  Migration 002 — Validation des chants par l'admin
-- ═══════════════════════════════════════════════════════

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (validation_status IN ('brouillon', 'en_attente', 'validé', 'rejeté')),
  ADD COLUMN IF NOT EXISTS validated_by   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validated_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_note TEXT;

-- Index pour filtrer par statut
CREATE INDEX IF NOT EXISTS idx_songs_validation_status ON songs(choir_id, validation_status);

-- Commentaires des statuts :
-- brouillon    : chant en cours de saisie, non soumis
-- en_attente   : soumis par un choriste, attend validation du chef
-- validé       : approuvé par le chef, visible par tous
-- rejeté       : refusé avec note explicative
