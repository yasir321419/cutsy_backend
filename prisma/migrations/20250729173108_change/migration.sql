/*
  Warnings:

  - You are about to drop the column `comment` on the `Review` table. All the data in the column will be lost.
  - You are about to alter the column `rating` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `Review` DROP COLUMN `comment`,
    ADD COLUMN `review` VARCHAR(191) NULL,
    MODIFY `rating` DOUBLE NOT NULL;
