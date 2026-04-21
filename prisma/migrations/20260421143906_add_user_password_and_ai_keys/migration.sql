-- User.passwordHash / aiProvider / aiKeys 在 schema 中已声明但 DB 没有对应列
-- 添加为 nullable，现有用户不受影响
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiProvider" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiKeys" JSONB;
