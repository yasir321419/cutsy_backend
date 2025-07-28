-- AlterTable
ALTER TABLE `Barber` MODIFY `name` VARCHAR(191) NULL,
    MODIFY `phoneNumber` VARCHAR(191) NULL,
    MODIFY `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    MODIFY `latitude` DOUBLE NULL,
    MODIFY `longitude` DOUBLE NULL,
    MODIFY `addressName` VARCHAR(191) NULL,
    MODIFY `addressLine1` VARCHAR(191) NULL,
    MODIFY `city` VARCHAR(191) NULL,
    MODIFY `states` VARCHAR(191) NULL,
    MODIFY `country` VARCHAR(191) NULL,
    MODIFY `postalCode` VARCHAR(191) NULL;
