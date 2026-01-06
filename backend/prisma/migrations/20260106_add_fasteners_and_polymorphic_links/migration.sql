-- CreateTable: fasteners
CREATE TABLE `fasteners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `old_serial_number` VARCHAR(20) NULL,
    `item_description` VARCHAR(255) NOT NULL,
    `generic_name` VARCHAR(100) NOT NULL,
    `material` VARCHAR(100) NULL,
    `standard_length` INTEGER NULL,
    `uom` VARCHAR(20) NOT NULL,
    `category` VARCHAR(50) NULL,
    `cost_per_piece` DECIMAL(10, 2) NULL,
    `profile_image_path` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fasteners_old_serial_number_key`(`old_serial_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: bom_formulas - Add new columns
ALTER TABLE `bom_formulas`
    ADD COLUMN `sunrack_profile_id` INTEGER NULL,
    ADD COLUMN `fastener_id` INTEGER NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    MODIFY `item_serial_number` VARCHAR(20) NULL;

-- AlterTable: bom_variation_items - Add new columns
ALTER TABLE `bom_variation_items`
    ADD COLUMN `sunrack_profile_id` INTEGER NULL,
    ADD COLUMN `fastener_id` INTEGER NULL,
    MODIFY `master_item_id` INTEGER NULL;

-- AlterTable: sunrack_profiles - Add new columns
ALTER TABLE `sunrack_profiles`
    ADD COLUMN `material` VARCHAR(100) NULL,
    ADD COLUMN `standard_length` INTEGER NULL,
    ADD COLUMN `uom` VARCHAR(20) NULL,
    ADD COLUMN `category` VARCHAR(50) NULL;

-- CreateIndex
CREATE INDEX `bom_formulas_sunrack_profile_id_idx` ON `bom_formulas`(`sunrack_profile_id`);
CREATE INDEX `bom_formulas_fastener_id_idx` ON `bom_formulas`(`fastener_id`);
CREATE INDEX `bom_formulas_formula_key_idx` ON `bom_formulas`(`formula_key`);

CREATE INDEX `bom_variation_items_sunrack_profile_id_idx` ON `bom_variation_items`(`sunrack_profile_id`);
CREATE INDEX `bom_variation_items_fastener_id_idx` ON `bom_variation_items`(`fastener_id`);

-- AddForeignKey
ALTER TABLE `bom_formulas` ADD CONSTRAINT `bom_formulas_sunrack_profile_id_fkey`
    FOREIGN KEY (`sunrack_profile_id`) REFERENCES `sunrack_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bom_formulas` ADD CONSTRAINT `bom_formulas_fastener_id_fkey`
    FOREIGN KEY (`fastener_id`) REFERENCES `fasteners`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bom_variation_items` ADD CONSTRAINT `bom_variation_items_sunrack_profile_id_fkey`
    FOREIGN KEY (`sunrack_profile_id`) REFERENCES `sunrack_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bom_variation_items` ADD CONSTRAINT `bom_variation_items_fastener_id_fkey`
    FOREIGN KEY (`fastener_id`) REFERENCES `fasteners`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
