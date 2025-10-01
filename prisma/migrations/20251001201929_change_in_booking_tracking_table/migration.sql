/*
  Warnings:

  - A unique constraint covering the columns `[bookingId]` on the table `BookingTracking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `BookingTracking_bookingId_key` ON `BookingTracking`(`bookingId`);
