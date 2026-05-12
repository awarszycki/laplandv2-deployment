CREATE DATABASE IF NOT EXISTS lapland CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lapland;

CREATE TABLE IF NOT EXISTS members (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(10) NOT NULL DEFAULT 'PLN',
  payer_id        INT NOT NULL,
  split_ids       JSON NOT NULL,
  date            VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS gear_items (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  category  VARCHAR(50) NOT NULL,
  name      VARCHAR(200) NOT NULL,
  packed    TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shared_gear (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(200) NOT NULL,
  taken_by INT DEFAULT NULL,
  packed   TINYINT(1) NOT NULL DEFAULT 0
);

-- Default members
INSERT IGNORE INTO members (id, name) VALUES
  (1, 'Ania'),
  (2, 'Marek'),
  (3, 'Kasia'),
  (4, 'Piotr');

-- Default shared gear
INSERT IGNORE INTO shared_gear (id, name) VALUES
  (1, 'Apteczka grupowa'),
  (2, 'Powerbank 20000mAh'),
  (3, 'Namiot 4-osobowy'),
  (4, 'Zestaw garnków'),
  (5, 'Latarki (2 szt.)');
