-- AlterTable
ALTER TABLE `saved_boms` ADD COLUMN `custom_default_notes` JSON NULL;

-- CreateTable
CREATE TABLE `default_notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `note_order` INTEGER NOT NULL,
    `note_text` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `default_notes_note_order_key`(`note_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
