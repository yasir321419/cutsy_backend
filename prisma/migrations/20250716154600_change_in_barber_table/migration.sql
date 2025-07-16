/*
  Warnings:

  - You are about to drop the column `handlerAccountId` on the `Barber` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Barber` DROP COLUMN `handlerAccountId`,
    ADD COLUMN `barberAccountId` VARCHAR(191) NULL;
