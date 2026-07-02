-- 1. Tạo Database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS supermarket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE supermarket_db;

-- 2. Bảng Nhân viên (Employees) - Dùng cho authController & employeeController
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role ENUM('admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Bảng Danh mục sản phẩm (Categories) - Hỗ trợ phân loại sản phẩm
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB;

-- 4. Bảng Sản phẩm (Products) - Dùng cho productController
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    category_id INT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'Cái', -- Đơn vị tính: Cái, Hộp, Chai...
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Bảng Đơn hàng / Hóa đơn (Orders) - Dùng cho orderController & reportController
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    customer_cash DECIMAL(10, 2), -- Số tiền khách đưa
    change_returned DECIMAL(10, 2), -- Tiền thừa trả khách
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Bảng Chi tiết đơn hàng (Order Items) - Lưu chi tiết từng món hàng trong hóa đơn
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL, -- Giá tại thời điểm bán
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. Thêm dữ liệu mẫu tài khoản Admin mặc định (Mật khẩu mẫu chưa mã hóa: admin123)
-- Lưu ý: Thực tế khi đăng ký qua authController, mật khẩu nên được băm bằng bcrypt.
INSERT INTO employees (username, password, full_name, email, role) 
VALUES ('admin', '$2b$10$X7E70w8p2kMv1YV2zExGDeHBlA6SoxZ1K1p4NqFv8y76543210987', 'Quản Trị Viên', 'admin@supermarket.com', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- 8. Thêm một vài danh mục và sản phẩm mẫu
INSERT INTO categories (name, description) VALUES 
('Thực phẩm', 'Đồ ăn khô, đóng hộp, gia vị'),
('Nước giải khát', 'Bia, nước ngọt, nước khoáng'),
('Hóa mỹ phẩm', 'Bột giặt, dầu gội, sữa tắm')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO products (barcode, name, category_id, price, stock, unit) VALUES
('8930000000001', 'Mì tôm Hảo Hảo', 1, 4000.00, 500, 'Gói'),
('8930000000002', 'Nước ngọt Coca-Cola 320ml', 2, 10000.00, 200, 'Lon'),
('8930000000003', 'Dầu gội Clear 180ml', 3, 65000.00, 50, 'Chai')
ON DUPLICATE KEY UPDATE barcode=barcode;