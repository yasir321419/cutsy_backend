-- AlterTable
ALTER TABLE `User` ADD COLUMN `barberExperienceId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `barberExperience` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barberExperience` ADD CONSTRAINT `barberExperience_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_barberExperienceId_fkey` FOREIGN KEY (`barberExperienceId`) REFERENCES `barberExperience`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
