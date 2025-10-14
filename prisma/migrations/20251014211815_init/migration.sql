-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CREATOR', 'BRAND');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandStore" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "storeUrl" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "BrandStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponMap" (
    "id" TEXT NOT NULL,
    "couponCode" TEXT NOT NULL,
    "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
    "creatorId" TEXT NOT NULL,
    "brandStoreId" TEXT NOT NULL,

    CONSTRAINT "CouponMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderTotal" DECIMAL(65,30) NOT NULL,
    "commissionAmount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payoutDate" TIMESTAMP(3),
    "couponMapId" TEXT NOT NULL,
    "brandStoreId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BrandStore_brandId_key" ON "BrandStore"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponMap_couponCode_key" ON "CouponMap"("couponCode");

-- AddForeignKey
ALTER TABLE "BrandStore" ADD CONSTRAINT "BrandStore_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponMap" ADD CONSTRAINT "CouponMap_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponMap" ADD CONSTRAINT "CouponMap_brandStoreId_fkey" FOREIGN KEY ("brandStoreId") REFERENCES "BrandStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_couponMapId_fkey" FOREIGN KEY ("couponMapId") REFERENCES "CouponMap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_brandStoreId_fkey" FOREIGN KEY ("brandStoreId") REFERENCES "BrandStore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
