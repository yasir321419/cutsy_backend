-- CreateTable
CREATE TABLE `BarberService` (
    `id` VARCHAR(191) NOT NULL,
    `serviceCategoryId` VARCHAR(191) NOT NULL,
    `price` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BarberService` ADD CONSTRAINT `BarberService_serviceCategoryId_fkey` FOREIGN KEY (`serviceCategoryId`) REFERENCES `barberServiceCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BarberService` ADD CONSTRAINT `BarberService_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Barber`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
