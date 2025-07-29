/*
  Warnings:

  - Added the required column `bookingId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Made the column `review` on table `Review` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Review` ADD COLUMN `bookingId` VARCHAR(191) NOT NULL,
    MODIFY `review` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
