-- CreateTable
CREATE TABLE `BarberAvailableHour` (
    `id` VARCHAR(191) NOT NULL,
    `day` ENUM('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT') NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BarberAvailableHour` ADD CONSTRAINT `BarberAvailableHour_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Barber`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
