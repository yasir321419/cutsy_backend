/*
  Warnings:

  - You are about to drop the column `endAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Booking` DROP COLUMN `endAt`,
    DROP COLUMN `startAt`;
