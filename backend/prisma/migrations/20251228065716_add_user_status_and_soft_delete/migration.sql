-- AlterTable
ALTER TABLE `users` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'INACTIVE';

-- Data Migration: Set status based on existing data
-- Users who have changed password (mustChangePassword = false) -> ACTIVE
UPDATE `users` SET `status` = 'ACTIVE' WHERE `must_change_password` = false;

-- Users who are inactive (isActive = false) -> HOLD
UPDATE `users` SET `status` = 'HOLD' WHERE `is_active` = false AND `must_change_password` = false;

-- New users and users who haven't changed password remain INACTIVE (default)
