/*
  Warnings:

  - Added the required column `genderCategory` to the `barberService` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `barberService` ADD COLUMN `genderCategory` ENUM('MALE', 'FEMALE', 'UNISEX') NOT NULL;
