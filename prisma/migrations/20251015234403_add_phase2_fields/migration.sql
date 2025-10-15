-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "BrandStore" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "storeDescription" TEXT,
ADD COLUMN     "storeName" TEXT,
ADD COLUMN     "webhookSecret" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "CouponMap" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "discountValue" DECIMAL(65,30) NOT NULL DEFAULT 10,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "shopifyDiscountId" TEXT,
ADD COLUMN     "shopifyPriceRuleId" TEXT,
ADD COLUMN     "status" "CouponStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usageLimit" INTEGER;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
