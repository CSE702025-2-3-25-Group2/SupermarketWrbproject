const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const customerController = require('../controllers/customerController');

// Middleware xác thực Token vòng bảo mật bảo vệ API
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện!' });
    }

    try {
        const decoded = jwt.verify(token, 'SUPERMARKET_SECRET_KEY');
        req.employee = decoded; // Lưu dữ liệu nhân viên đã giải mã vào req
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ!' });
    }
};

// --- TUYẾN ĐƯỜNG XÁC THỰC & NHÂN VIÊN ---
router.post('/auth/login', authController.login);
router.get('/employees', verifyToken, authController.getAllEmployees);
router.post('/employees', verifyToken, authController.createEmployee);
router.delete('/employees/:id', verifyToken, authController.deleteEmployee);

// --- TUYẾN ĐƯỜNG SẢN PHẨM / KHO ---
router.get('/products', verifyToken, productController.getAllProducts);
router.get('/products/barcode/:barcode', verifyToken, productController.getProductByBarcode);
router.post('/products', verifyToken, productController.createProduct);
router.put('/products/:id', verifyToken, productController.updateProduct);
router.delete('/products/:id', verifyToken, productController.deleteProduct);

// --- TUYẾN ĐƯỜNG ĐƠN HÀNG & THỐNG KÊ ---
router.post('/orders', verifyToken, orderController.createOrder);
router.get('/orders', verifyToken, orderController.getOrderHistory); 
router.get('/orders/detail/:id', verifyToken, orderController.getOrderDetail);
router.get('/orders/stats', verifyToken, orderController.getDashboardStats);
// --- TUYẾN ĐƯỜNG KHÁCH HÀNG (CRM) ---
router.get('/customers', verifyToken, customerController.getAllCustomers);
router.post('/customers', verifyToken, customerController.createCustomer);
router.delete('/customers/:id', verifyToken, customerController.deleteCustomer);
const supplierController = require('../controllers/supplierController');
const categoryController = require('../controllers/categoryController');

// API Danh mục
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', categoryController.createCategory);

// API Nhà cung cấp
router.get('/suppliers', supplierController.getAllSuppliers);
router.post('/suppliers', supplierController.createSupplier);

// API Nhập hàng kho
router.get('/receipts', supplierController.getReceipts);
router.post('/receipts', supplierController.createReceipt);

// API Danh mục (Đã thêm verifyToken)
router.get('/categories', verifyToken, categoryController.getAllCategories);
router.post('/categories', verifyToken, categoryController.createCategory);

// API Nhà cung cấp (Đã thêm verifyToken)
router.get('/suppliers', verifyToken, supplierController.getAllSuppliers);
router.post('/suppliers', verifyToken, supplierController.createSupplier);

// API Nhập hàng kho (Đã thêm verifyToken)
router.get('/receipts', verifyToken, supplierController.getReceipts);
router.post('/receipts', verifyToken, supplierController.createReceipt);

module.exports = router;

