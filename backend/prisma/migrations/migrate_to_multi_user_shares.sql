-- Step 1: Create new bom_share_users table
CREATE TABLE IF NOT EXISTS `bom_share_users` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `bom_share_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL,
  `is_accessed` BOOLEAN NOT NULL DEFAULT false,
  `accessed_at` DATETIME(3) NULL,
  `created_bom_id` INTEGER NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `bom_share_users_bom_share_id_user_id_key`(`bom_share_id`, `user_id`),
  INDEX `bom_share_users_bom_share_id_idx`(`bom_share_id`),
  INDEX `bom_share_users_user_id_idx`(`user_id`),
  INDEX `bom_share_users_created_bom_id_idx`(`created_bom_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 2: Migrate existing data from bom_shares to bom_share_users
INSERT INTO `bom_share_users` (`bom_share_id`, `user_id`, `is_accessed`, `accessed_at`, `created_bom_id`, `created_at`)
SELECT 
  `id` as `bom_share_id`,
  `shared_with_user_id` as `user_id`,
  `is_accessed`,
  `accessed_at`,
  `created_bom_id`,
  `created_at`
FROM `bom_shares`
WHERE `shared_with_user_id` IS NOT NULL;

-- Step 3: Add foreign key constraints
ALTER TABLE `bom_share_users` ADD CONSTRAINT `bom_share_users_bom_share_id_fkey` 
  FOREIGN KEY (`bom_share_id`) REFERENCES `bom_shares`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bom_share_users` ADD CONSTRAINT `bom_share_users_user_id_fkey` 
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bom_share_users` ADD CONSTRAINT `bom_share_users_created_bom_id_fkey` 
  FOREIGN KEY (`created_bom_id`) REFERENCES `saved_boms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Drop old columns from bom_shares
ALTER TABLE `bom_shares` 
  DROP FOREIGN KEY `bom_shares_shared_with_user_id_fkey`,
  DROP FOREIGN KEY `bom_shares_created_bom_id_fkey`,
  DROP INDEX `bom_shares_shared_with_user_id_idx`,
  DROP COLUMN `shared_with_user_id`,
  DROP COLUMN `is_accessed`,
  DROP COLUMN `accessed_at`,
  DROP COLUMN `created_bom_id`;
