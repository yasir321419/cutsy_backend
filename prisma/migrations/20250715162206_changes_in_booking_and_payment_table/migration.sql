-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `cancellationReason` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `cancellationReason` VARCHAR(191) NULL;
