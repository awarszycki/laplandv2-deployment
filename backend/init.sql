-- Tworzenie bazy danych (jeśli nie istnieje)
CREATE DATABASE IF NOT EXISTS lapland CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lapland;

-- 1. TABELA PROJEKTÓW (WYPRAW)
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wstawienie domyślnego projektu, aby zachować wsteczną kompatybilność danych
INSERT INTO projects (id, name, description) 
VALUES (1, 'Laponia 2026', 'Główna wyprawa zimowa na północ')
ON DUPLICATE KEY UPDATE id=id;

-- 2. TABELA UCZESTNIKÓW
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    project_id INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_members_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABELA WYDATKÓW
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid_by_id INT NOT NULL,
    project_id INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABELA EKWIPUNKU INDYWIDUALNEGO
CREATE TABLE IF NOT EXISTS gear_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    weight_g INT NOT NULL DEFAULT 0,
    packed BOOLEAN NOT NULL DEFAULT FALSE,
    member_id INT NOT NULL,
    project_id INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_gear_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_gear_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABELA EKWIPUNKU WSPÓLNEGO
CREATE TABLE IF NOT EXISTS shared_gear (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    weight_g INT NOT NULL DEFAULT 0,
    assigned_member_id INT DEFAULT NULL,
    packed BOOLEAN NOT NULL DEFAULT FALSE,
    project_id INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_shared_gear_member FOREIGN KEY (assigned_member_id) REFERENCES members(id) ON DELETE SET NULL,
    CONSTRAINT fk_shared_gear_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Przykładowe dane startowe przypisane do projektu o ID 1
INSERT INTO members (id, name, project_id) VALUES 
(1, 'Ania', 1),
(2, 'Bartek', 1)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO expenses (id, description, amount, paid_by_id, project_id) VALUES 
(1, 'Paliwo', 450.00, 1, 1),
(2, 'Nocleg', 1200.00, 2, 1)
ON DUPLICATE KEY UPDATE id=id;