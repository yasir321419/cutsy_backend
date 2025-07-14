/*
  Warnings:

  - You are about to drop the column `barberExperienceId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_barberExperienceId_fkey`;

-- DropIndex
DROP INDEX `User_barberExperienceId_fkey` ON `User`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `barberExperienceId`;

-- CreateTable
CREATE TABLE `Barber` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `selectedHairTypeId` VARCHAR(191) NULL,
    `selectedHairLengthId` VARCHAR(191) NULL,
    `barberExperienceId` VARCHAR(191) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `addressName` VARCHAR(191) NOT NULL,
    `addressLine1` VARCHAR(191) NOT NULL,
    `addressLine2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `states` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `postalCode` VARCHAR(191) NOT NULL,
    `userType` ENUM('ADMIN', 'USER', 'BARBER') NULL,
    `deviceType` ENUM('ANDROID', 'IOS') NULL,
    `deviceToken` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Barber_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_BarberToOtp` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_BarberToOtp_AB_unique`(`A`, `B`),
    INDEX `_BarberToOtp_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Barber` ADD CONSTRAINT `Barber_selectedHairTypeId_fkey` FOREIGN KEY (`selectedHairTypeId`) REFERENCES `hairType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Barber` ADD CONSTRAINT `Barber_selectedHairLengthId_fkey` FOREIGN KEY (`selectedHairLengthId`) REFERENCES `hairLength`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Barber` ADD CONSTRAINT `Barber_barberExperienceId_fkey` FOREIGN KEY (`barberExperienceId`) REFERENCES `barberExperience`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BarberToOtp` ADD CONSTRAINT `_BarberToOtp_A_fkey` FOREIGN KEY (`A`) REFERENCES `Barber`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BarberToOtp` ADD CONSTRAINT `_BarberToOtp_B_fkey` FOREIGN KEY (`B`) REFERENCES `Otp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
