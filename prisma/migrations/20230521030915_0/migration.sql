/*
  Warnings:

  - Added the required column `index` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `maxIndex` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Message` ADD COLUMN `index` INTEGER NOT NULL;
