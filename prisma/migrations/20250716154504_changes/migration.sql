/*
  Warnings:

  - Added the required column `totalAmount` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Barber` ADD COLUMN `handlerAccountId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `totalAmount` DOUBLE NULL;

-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `totalAmount` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `customerId` VARCHAR(191) NULL;
