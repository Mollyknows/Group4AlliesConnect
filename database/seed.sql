INSERT INTO Role (role_name)
VALUES ('user'), ('volunteer'), ('provider'), ('admin')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);
