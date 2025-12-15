/*
  Warnings:

  - Added the required column `updated_at` to the `generated_boms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bom_master_items` ADD COLUMN `cost_per_piece` DECIMAL(10, 2) NULL,
    ADD COLUMN `item_type` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `generated_boms` ADD COLUMN `bom_items` JSON NULL,
    ADD COLUMN `bom_metadata` JSON NULL,
    ADD COLUMN `change_log` JSON NULL,
    ADD COLUMN `isLatest` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1,
    MODIFY `bom_data` JSON NULL;

-- CreateIndex
CREATE INDEX `generated_boms_isLatest_idx` ON `generated_boms`(`isLatest`);

-- RenameIndex
ALTER TABLE `generated_boms` RENAME INDEX `generated_boms_project_id_fkey` TO `generated_boms_project_id_idx`;
