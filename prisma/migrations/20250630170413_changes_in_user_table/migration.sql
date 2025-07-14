-- AlterTable
ALTER TABLE `User` ADD COLUMN `deviceToken` VARCHAR(191) NULL,
    ADD COLUMN `deviceType` ENUM('ANDROID', 'IOS') NULL;
