-- Fix user status on server after migration
-- Run this script on your production server database

-- Update users who have already changed their password to ACTIVE
-- (mustChangePassword = false means they've already logged in and changed password)
UPDATE `users`
SET `status` = 'ACTIVE'
WHERE `must_change_password` = false
  AND `status` = 'INACTIVE';

-- Verify the update
SELECT id, username, role, status, must_change_password, created_at
FROM `users`
ORDER BY id;
