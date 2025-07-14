/*
  Warnings:

  - Added the required column `createdById` to the `BarberDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `document` to the `BarberDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `BarberDocument` ADD COLUMN `createdById` VARCHAR(191) NOT NULL,
    ADD COLUMN `document` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `BarberDocument` ADD CONSTRAINT `BarberDocument_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Barber`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
