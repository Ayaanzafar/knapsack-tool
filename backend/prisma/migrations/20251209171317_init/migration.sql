-- CreateTable
CREATE TABLE `projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tabs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `module_length` DECIMAL(10, 2) NOT NULL DEFAULT 2278,
    `module_width` DECIMAL(10, 2) NOT NULL DEFAULT 1134,
    `frame_thickness` DECIMAL(10, 2) NOT NULL DEFAULT 35,
    `mid_clamp` DECIMAL(10, 2) NOT NULL DEFAULT 20,
    `end_clamp_width` DECIMAL(10, 2) NOT NULL DEFAULT 40,
    `buffer` DECIMAL(10, 2) NOT NULL DEFAULT 15,
    `purlin_distance` DECIMAL(10, 2) NOT NULL DEFAULT 1700,
    `rails_per_side` INTEGER NOT NULL DEFAULT 2,
    `lengths_input` TEXT NULL,
    `enabled_lengths` JSON NULL,
    `max_pieces` INTEGER NOT NULL DEFAULT 3,
    `max_waste_pct` VARCHAR(50) NULL,
    `alpha_joint` DECIMAL(10, 2) NOT NULL DEFAULT 220,
    `beta_small` DECIMAL(10, 2) NOT NULL DEFAULT 60,
    `allow_undershoot_pct` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `gamma_short` DECIMAL(10, 2) NOT NULL DEFAULT 5,
    `cost_per_mm` VARCHAR(50) NOT NULL DEFAULT '0.1',
    `cost_per_joint_set` VARCHAR(50) NOT NULL DEFAULT '50',
    `joiner_length` VARCHAR(50) NOT NULL DEFAULT '100',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'cost',
    `user_mode` VARCHAR(20) NOT NULL DEFAULT 'normal',
    `enable_sb2` BOOLEAN NOT NULL DEFAULT false,

    INDEX `tabs_project_id_idx`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tab_rows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tab_id` INTEGER NOT NULL,
    `row_number` INTEGER NOT NULL,
    `modules` INTEGER NOT NULL DEFAULT 0,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `support_base_1` DECIMAL(10, 2) NULL,
    `support_base_2` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tab_rows_tab_id_idx`(`tab_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bom_master_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serial_number` VARCHAR(20) NOT NULL,
    `sunrack_code` VARCHAR(50) NULL,
    `item_description` VARCHAR(255) NOT NULL,
    `material` VARCHAR(100) NULL,
    `standard_length` INTEGER NULL,
    `uom` VARCHAR(20) NOT NULL,
    `category` VARCHAR(50) NULL,
    `profile_image_path` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bom_master_items_serial_number_key`(`serial_number`),
    UNIQUE INDEX `bom_master_items_sunrack_code_key`(`sunrack_code`),
    INDEX `bom_master_items_sunrack_code_idx`(`sunrack_code`),
    INDEX `bom_master_items_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bom_formulas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_serial_number` VARCHAR(20) NOT NULL,
    `formula_key` VARCHAR(50) NOT NULL,
    `formula_description` TEXT NULL,
    `calculation_level` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `generated_boms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bom_data` JSON NOT NULL,
    `generated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tabs` ADD CONSTRAINT `tabs_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tab_rows` ADD CONSTRAINT `tab_rows_tab_id_fkey` FOREIGN KEY (`tab_id`) REFERENCES `tabs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_formulas` ADD CONSTRAINT `bom_formulas_item_serial_number_fkey` FOREIGN KEY (`item_serial_number`) REFERENCES `bom_master_items`(`serial_number`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_boms` ADD CONSTRAINT `generated_boms_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
