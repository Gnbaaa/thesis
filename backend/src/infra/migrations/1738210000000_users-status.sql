-- UC-011: Хэрэглэгчийн эрх удирдах — admin нь хэрэглэгчийг түдгэлзүүлэх / хаах.
-- 'active'  — энгийн идэвхтэй хэрэглэгч
-- 'suspended' — түр түдгэлзсэн (нэвтрэх боломжтой ч зарим үйлдэл хийгдэхгүй)
-- 'closed' — бүрэн хаагдсан
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
