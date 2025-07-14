/*
  Warnings:

  - You are about to drop the column `barberServiceId` on the `Barber` table. All the data in the column will be lost.
  - You are about to drop the `barberService` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Barber` DROP FOREIGN KEY `Barber_barberServiceId_fkey`;

-- DropForeignKey
ALTER TABLE `barberService` DROP FOREIGN KEY `barberService_createdById_fkey`;

-- DropIndex
DROP INDEX `Barber_barberServiceId_fkey` ON `Barber`;

-- AlterTable
ALTER TABLE `Barber` DROP COLUMN `barberServiceId`,
    ADD COLUMN `barberServiceCategoryId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `barberService`;

-- CreateTable
CREATE TABLE `barberServiceCategory` (
    `id` VARCHAR(191) NOT NULL,
    `service` VARCHAR(191) NOT NULL,
    `genderCategory` ENUM('MALE', 'FEMALE', 'UNISEX') NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barberServiceCategory` ADD CONSTRAINT `barberServiceCategory_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Barber` ADD CONSTRAINT `Barber_barberServiceCategoryId_fkey` FOREIGN KEY (`barberServiceCategoryId`) REFERENCES `barberServiceCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
