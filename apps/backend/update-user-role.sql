-- Update user role to admin (roleId = 1)
UPDATE "user" 
SET "roleId" = 1 
WHERE email = 'user@casdoor.local';

-- Verify the update
SELECT id, email, "firstName", "roleId" 
FROM "user" 
WHERE email = 'user@casdoor.local';
