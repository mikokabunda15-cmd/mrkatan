-- =====================================================
-- MR KETAN FASHION STORE - INVENTORY MANAGEMENT SYSTEM
-- Database Installation Script
-- =====================================================
-- Run this SQL file in phpMyAdmin or MySQL CLI to create
-- the database and populate it with demo data.
-- =====================================================

CREATE DATABASE IF NOT EXISTS mr_ketan_inventory
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mr_ketan_inventory;

-- =====================================================
-- TABLE: users
-- =====================================================
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS restocks;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: categories
-- =====================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: products
-- =====================================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(150) NOT NULL,
    category_id INT NOT NULL,
    colour VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    original_quantity INT NOT NULL DEFAULT 0,
    current_quantity INT NOT NULL DEFAULT 0,
    total_sold INT NOT NULL DEFAULT 0,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    product_image VARCHAR(255) DEFAULT NULL,
    barcode_image VARCHAR(255) DEFAULT NULL,
    minimum_stock_level INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL DEFAULT NULL,
    last_restocked_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_serial (serial_number),
    INDEX idx_category (category_id),
    INDEX idx_archived (archived_at)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: sales
-- =====================================================
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_reference VARCHAR(50) NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('completed', 'reversed') NOT NULL DEFAULT 'completed',
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_reference (transaction_reference),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: sale_items
-- =====================================================
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_sale (sale_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: restocks
-- =====================================================
CREATE TABLE restocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity_added INT NOT NULL,
    purchase_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    supplier VARCHAR(100) DEFAULT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_product (product_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: stock_movements
-- =====================================================
CREATE TABLE stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    movement_type ENUM('sale', 'restock', 'adjustment', 'initial') NOT NULL,
    quantity_changed INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_product (product_id),
    INDEX idx_type (movement_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: settings
-- =====================================================
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB;

-- =====================================================
-- DEMO DATA: Users
-- Password for all: admin123 / emp123
-- =====================================================
INSERT INTO users (full_name, username, password_hash, role) VALUES
('Ketan Patel', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uGZaw5kJy', 'admin'),
('Ravi Kumar', 'employee', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uGZaw5kJy', 'employee');

-- =====================================================
-- DEMO DATA: Categories
-- =====================================================
INSERT INTO categories (category_name, description) VALUES
('Shirts', 'Formal and casual shirts'),
('Trousers', 'Formal and casual trousers'),
('Shoes', 'Formal shoes and sneakers'),
('Jackets', 'Leather and bomber jackets'),
('T-Shirts', 'Cotton and polo t-shirts'),
('Jeans', 'Denim jeans');

-- =====================================================
-- DEMO DATA: Products
-- =====================================================
INSERT INTO products (serial_number, product_name, category_id, colour, size, original_quantity, current_quantity, total_sold, purchase_price, selling_price, minimum_stock_level) VALUES
('MKS001', 'Black Formal Shirt', 1, 'Black', 'L', 20, 15, 5, 150.00, 250.00, 5),
('MKS002', 'White Formal Shirt', 1, 'White', 'M', 25, 18, 7, 140.00, 240.00, 5),
('MKS003', 'Blue Casual Shirt', 1, 'Blue', 'XL', 15, 10, 5, 160.00, 280.00, 4),
('MKS004', 'Navy Formal Trousers', 2, 'Navy', 'L', 18, 12, 6, 200.00, 350.00, 4),
('MKS005', 'Black Formal Trousers', 2, 'Black', 'M', 20, 14, 6, 190.00, 340.00, 4),
('MKS006', 'Grey Denim Jeans', 6, 'Grey', 'L', 22, 16, 6, 220.00, 380.00, 5),
('MKS007', 'Dark Blue Jeans', 6, 'Dark Blue', 'XL', 15, 3, 12, 230.00, 400.00, 5),
('MKS008', 'Brown Leather Jacket', 4, 'Brown', 'L', 8, 5, 3, 500.00, 850.00, 2),
('MKS009', 'Black Bomber Jacket', 4, 'Black', 'XL', 10, 7, 3, 450.00, 780.00, 3),
('MKS010', 'White Sneakers', 3, 'White', 'M', 12, 8, 4, 300.00, 500.00, 3),
('MKS011', 'Black Formal Shoes', 3, 'Black', 'L', 15, 10, 5, 350.00, 580.00, 3),
('MKS012', 'Red Cotton T-Shirt', 5, 'Red', 'M', 30, 22, 8, 80.00, 150.00, 8),
('MKS013', 'Black Cotton T-Shirt', 5, 'Black', 'L', 35, 0, 35, 80.00, 150.00, 8),
('MKS014', 'Green Polo Shirt', 1, 'Green', 'S', 12, 2, 10, 170.00, 290.00, 3),
('MKS015', 'Khaki Chinos', 2, 'Khaki', 'M', 16, 11, 5, 180.00, 320.00, 4);

-- =====================================================
-- DEMO DATA: Settings
-- =====================================================
INSERT INTO settings (setting_key, setting_value) VALUES
('store_name', 'Mr Ketan Fashion Store'),
('store_address', 'Main Market Road, City Center'),
('store_phone', '+265 999 123 456'),
('currency', 'K'),
('low_stock_threshold', '5'),
('critical_stock_threshold', '2');

-- =====================================================
-- DEMO DATA: Sample Sales
-- =====================================================
INSERT INTO sales (transaction_reference, total_amount, user_id, status) VALUES
('TXN-00001', 500.00, 1, 'completed'),
('TXN-00002', 250.00, 2, 'completed'),
('TXN-00003', 780.00, 1, 'completed'),
('TXN-00004', 340.00, 2, 'completed'),
('TXN-00005', 150.00, 1, 'completed');

INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 1, 2, 250.00, 500.00),
(2, 1, 1, 250.00, 250.00),
(3, 9, 1, 780.00, 780.00),
(4, 5, 1, 340.00, 340.00),
(5, 12, 1, 150.00, 150.00);

-- =====================================================
-- DEMO DATA: Sample Restocks
-- =====================================================
INSERT INTO restocks (product_id, quantity_added, purchase_cost, supplier, user_id) VALUES
(1, 10, 1500.00, 'Fashion Distributors', 1),
(7, 15, 3450.00, 'Wholesale Mart', 1),
(13, 20, 1600.00, 'Supplier A', 1);

-- =====================================================
-- DEMO DATA: Stock Movements
-- =====================================================
INSERT INTO stock_movements (product_id, movement_type, quantity_changed, previous_quantity, new_quantity, reference_id, user_id, notes) VALUES
(1, 'sale', -2, 17, 15, 1, 1, 'Sale: 2 units @ K250 each'),
(1, 'sale', -1, 16, 15, 2, 2, 'Sale: 1 unit @ K250'),
(9, 'sale', -1, 8, 7, 3, 1, 'Sale: 1 unit @ K780'),
(5, 'sale', -1, 15, 14, 4, 2, 'Sale: 1 unit @ K340'),
(12, 'sale', -1, 23, 22, 5, 1, 'Sale: 1 unit @ K150'),
(1, 'restock', 10, 5, 15, 1, 1, 'Restock: +10 units from Fashion Distributors'),
(7, 'restock', 15, 0, 3, 2, 1, 'Restock: +15 units from Wholesale Mart'),
(13, 'restock', 20, 0, 0, 3, 1, 'Restock: +20 units from Supplier A');
