-- ═══════════════════════════════════════════════════════
--  Migration 003 — Notifications de validation
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  choir_id   UUID NOT NULL REFERENCES choirs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id    UUID REFERENCES songs(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('song_submitted', 'song_validated', 'song_rejected')),
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Un membre du chœur peut notifier un autre membre du même chœur
-- (choriste → chef à la soumission, chef → choriste à la validation/rejet)
CREATE POLICY "insert for choir members" ON notifications
  FOR INSERT WITH CHECK (
    choir_id IN (SELECT choir_id FROM choir_members WHERE user_id = auth.uid())
  );

-- Commentaires des types :
-- song_submitted : un choriste a soumis un chant, notifie le(s) chef(s)
-- song_validated : le chef a validé un chant, notifie l'auteur
-- song_rejected  : le chef a rejeté un chant, notifie l'auteur
