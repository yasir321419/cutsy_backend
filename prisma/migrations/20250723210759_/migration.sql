/*
  Warnings:

  - You are about to drop the column `barberId` on the `Otp` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Otp` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Otp` DROP FOREIGN KEY `Otp_barberId_fkey`;

-- DropForeignKey
ALTER TABLE `Otp` DROP FOREIGN KEY `Otp_userId_fkey`;

-- DropIndex
DROP INDEX `Otp_barberId_fkey` ON `Otp`;

-- DropIndex
DROP INDEX `Otp_userId_fkey` ON `Otp`;

-- AlterTable
ALTER TABLE `Otp` DROP COLUMN `barberId`,
    DROP COLUMN `userId`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `isCreatedProfile` BOOLEAN NOT NULL DEFAULT false;
