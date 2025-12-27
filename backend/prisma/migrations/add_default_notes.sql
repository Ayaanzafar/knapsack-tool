-- Add custom_default_notes column to saved_boms table
ALTER TABLE `saved_boms` ADD COLUMN `custom_default_notes` JSON NULL AFTER `change_log`;

-- Create default_notes table
CREATE TABLE `default_notes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `note_order` INT NOT NULL UNIQUE,
  `note_text` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the 5 default notes
INSERT INTO `default_notes` (`note_order`, `note_text`, `created_at`, `updated_at`) VALUES
(1, 'Cut Length of Long Rails subject to change during detailing based on availability.', NOW(), NOW()),
(2, 'For all Roofs purlins are assumed to be at 1300mm where details of existing purlins are not shown in layout shared by client.', NOW(), NOW()),
(3, 'Length of Long Rails subject to change based on actual purlin locations at site to fix the Long rail only on purlin. If any extra length of rails are required, they shall be charged extra.', NOW(), NOW()),
(4, 'For Roofs with purlin span more than 1.7m, 2 Long Rails + 1 Mini Rail per each side of panel are considered.', NOW(), NOW()),
(5, 'Purlin Details of sheds T10, T11, T14, T15 are not mentioned in report. They are assumed to be 1.5m. If the actual span is more than 1.7m, an extra Mini rail must be considered additionally (at extra cost).', NOW(), NOW());
