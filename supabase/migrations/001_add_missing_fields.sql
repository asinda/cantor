-- ═══════════════════════════════════════════════════════
--  Migration 001 — Champs manquants pour la production
--  À exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── 1. Répétitions : heure + lieu ──────────────────────
ALTER TABLE rehearsals
  ADD COLUMN IF NOT EXISTS time     TIME,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- ── 2. Chorales : logo + ville ─────────────────────────
ALTER TABLE choirs
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS city     TEXT;

-- ── 3. Table subscriptions (plans SaaS) ────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  choir_id     UUID        NOT NULL REFERENCES choirs(id) ON DELETE CASCADE,
  stripe_id    TEXT        UNIQUE,
  plan         TEXT        NOT NULL DEFAULT 'free'
                           CHECK (plan IN ('free', 'essential', 'pro')),
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_subscriptions_choir_id ON subscriptions(choir_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_id);

-- RLS sur subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membres voient leur subscription" ON subscriptions;
CREATE POLICY "Membres voient leur subscription"
  ON subscriptions FOR SELECT
  USING (
    choir_id IN (
      SELECT choir_id FROM choir_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Chef gère la subscription" ON subscriptions;
CREATE POLICY "Chef gère la subscription"
  ON subscriptions FOR ALL
  USING (
    choir_id IN (
      SELECT choir_id FROM choir_members
      WHERE user_id = auth.uid() AND role = 'chef'
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 4. Insérer plan gratuit pour les chorales existantes ─
INSERT INTO subscriptions (choir_id, plan, status)
SELECT id, 'free', 'active'
FROM choirs
WHERE id NOT IN (SELECT choir_id FROM subscriptions)
ON CONFLICT DO NOTHING;
