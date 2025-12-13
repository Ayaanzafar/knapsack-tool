/*
  Warnings:

  - Added the required column `design_weight` to the `bom_master_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `generic_name` to the `bom_master_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Step 1: Add columns with default values for existing rows
ALTER TABLE `bom_master_items`
    ADD COLUMN `design_weight` DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    ADD COLUMN `generic_name` VARCHAR(100) NOT NULL DEFAULT 'N/A',
    ADD COLUMN `selected_rm_vendor` VARCHAR(50) NULL;

-- Step 2: Update generic_name to match item_description for existing rows
UPDATE `bom_master_items` SET `generic_name` = `item_description` WHERE `generic_name` = 'N/A';

-- Step 3: Remove default values (new rows must provide these values)
ALTER TABLE `bom_master_items`
    ALTER COLUMN `design_weight` DROP DEFAULT,
    ALTER COLUMN `generic_name` DROP DEFAULT;

-- CreateTable
CREATE TABLE `rm_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_serial_number` VARCHAR(20) NOT NULL,
    `vendor_name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(50) NULL,

    INDEX `rm_codes_item_serial_number_idx`(`item_serial_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rm_codes` ADD CONSTRAINT `rm_codes_item_serial_number_fkey` FOREIGN KEY (`item_serial_number`) REFERENCES `bom_master_items`(`serial_number`) ON DELETE CASCADE ON UPDATE CASCADE;
