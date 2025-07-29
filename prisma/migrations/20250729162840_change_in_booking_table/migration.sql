/*
  Warnings:

  - You are about to drop the column `scheduledTime` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `tip` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `day` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Booking` DROP COLUMN `scheduledTime`,
    ADD COLUMN `day` VARCHAR(191) NOT NULL,
    ADD COLUMN `endTime` VARCHAR(191) NOT NULL,
    ADD COLUMN `startTime` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `discount`,
    DROP COLUMN `tip`,
    MODIFY `platformFee` DOUBLE NULL,
    MODIFY `paymentMethod` ENUM('CARD', 'WALLET') NULL,
    MODIFY `paymentIntentId` VARCHAR(191) NULL,
    MODIFY `totalAmount` DOUBLE NULL;
