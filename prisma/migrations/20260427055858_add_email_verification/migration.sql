-- AlterTable
ALTER TABLE "otp_verifications" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'PASSWORD_RESET';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
