-- AlterTable
ALTER TABLE `Barber` ADD COLUMN `barberServiceId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `barberService` (
    `id` VARCHAR(191) NOT NULL,
    `service` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barberService` ADD CONSTRAINT `barberService_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Barber` ADD CONSTRAINT `Barber_barberServiceId_fkey` FOREIGN KEY (`barberServiceId`) REFERENCES `barberService`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
