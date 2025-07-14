-- AlterTable
ALTER TABLE `Admin` MODIFY `userType` ENUM('ADMIN', 'USER', 'BARBER') NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `userType` ENUM('ADMIN', 'USER', 'BARBER') NULL;
