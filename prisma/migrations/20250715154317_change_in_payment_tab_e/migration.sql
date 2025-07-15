/*
  Warnings:

  - Added the required column `paymentIntentId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `paymentIntentId` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` ENUM('PENDING', 'ACCEPTED', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'PAID') NOT NULL DEFAULT 'PENDING';
