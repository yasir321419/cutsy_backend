/*
  Warnings:

  - You are about to drop the column `document` on the `BarberDocument` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `BarberDocument` DROP COLUMN `document`,
    ADD COLUMN `certificate` VARCHAR(191) NULL,
    ADD COLUMN `drivingLicence` VARCHAR(191) NULL;
