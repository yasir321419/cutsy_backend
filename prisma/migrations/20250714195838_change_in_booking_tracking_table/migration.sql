/*
  Warnings:

  - You are about to drop the column `voucherCode` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `voucherId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `barberLat` to the `BookingTracking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `barberLng` to the `BookingTracking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Booking` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `BookingTracking` ADD COLUMN `barberLat` DOUBLE NOT NULL,
    ADD COLUMN `barberLng` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `voucherCode`,
    DROP COLUMN `voucherId`;
