/*
  Warnings:

  - You are about to drop the `_BarberToOtp` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_BarberToOtp` DROP FOREIGN KEY `_BarberToOtp_A_fkey`;

-- DropForeignKey
ALTER TABLE `_BarberToOtp` DROP FOREIGN KEY `_BarberToOtp_B_fkey`;

-- AlterTable
ALTER TABLE `Otp` ADD COLUMN `barberId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `_BarberToOtp`;

-- AddForeignKey
ALTER TABLE `Otp` ADD CONSTRAINT `Otp_barberId_fkey` FOREIGN KEY (`barberId`) REFERENCES `Barber`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
