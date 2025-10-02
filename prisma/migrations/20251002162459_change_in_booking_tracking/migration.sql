/*
  Warnings:

  - You are about to alter the column `status` on the `BookingTracking` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(11))`.

*/
-- AlterTable
ALTER TABLE `BookingTracking` MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'STARTED', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'PAID') NULL;
