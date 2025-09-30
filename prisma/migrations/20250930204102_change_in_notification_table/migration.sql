-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_barberId_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_bookingId_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropIndex
DROP INDEX `Notification_barberId_fkey` ON `Notification`;

-- DropIndex
DROP INDEX `Notification_bookingId_fkey` ON `Notification`;

-- DropIndex
DROP INDEX `Notification_userId_fkey` ON `Notification`;

-- AlterTable
ALTER TABLE `Notification` MODIFY `userId` VARCHAR(191) NULL,
    MODIFY `bookingId` VARCHAR(191) NULL,
    MODIFY `barberId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_barberId_fkey` FOREIGN KEY (`barberId`) REFERENCES `Barber`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
