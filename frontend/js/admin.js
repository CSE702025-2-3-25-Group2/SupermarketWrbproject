// Biến lưu trữ dữ liệu tập trung để thực hiện tìm kiếm Realtime ở Frontend
let allProducts = [];
let allCustomers = [];
let allOrders = [];
let importCart = []; // Giỏ hàng lưu trữ danh sách hàng nhập kho tạm thời

document.addEventListener('DOMContentLoaded', () => {
    // Tải dữ liệu ban đầu khi trang web vừa mở
    loadProducts();
    loadCategories();
    loadSuppliers();
    loadCustomers();
    loadOrders();
    
    // Khởi tạo các sự kiện lắng nghe (Event Listeners)
    initSearchEvents();
    initImportEvents();
    initCategorySupplierEvents();
    
    // Xử lý nút Đăng xuất
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('employee');
            alert('Đã đăng xuất thành công!');
            window.location.href = 'login.html';
        });
    }
});

// Hàm tiện ích để lấy token từ localStorage
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// ==========================================
// PHẦN 1: TÌM KIẾM REALTIME TRÊN GIAO DIỆN
// ==========================================
function initSearchEvents() {
    // 1. Tìm kiếm Sản phẩm (Theo tên hoặc Mã vạch)
    const searchProductInput = document.getElementById('searchProduct');
    if (searchProductInput) {
        searchProductInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            const filtered = allProducts.filter(p => 
                p.name.toLowerCase().includes(keyword) || p.barcode.includes(keyword)
            );
            renderProducts(filtered);
        });
    }

    // 2. Tìm kiếm Khách hàng (Theo full_name hoặc Số điện thoại)
    const searchCustomerInput = document.getElementById('searchCustomer');
    if (searchCustomerInput) {
        searchCustomerInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            const filtered = allCustomers.filter(c => 
                (c.full_name && c.full_name.toLowerCase().includes(keyword)) || c.phone.includes(keyword)
            );
            renderCustomers(filtered);
        });
    }

    // 3. Tìm kiếm Hóa đơn (Theo Mã HD hoặc Tên khách hàng)
    const searchOrderInput = document.getElementById('searchOrder');
    if (searchOrderInput) {
        searchOrderInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            const filtered = allOrders.filter(o => 
                String(o.id).includes(keyword) || 
                (o.customer_name && o.customer_name.toLowerCase().includes(keyword))
            );
            renderOrders(filtered);
        });
    }
}

// ==========================================
// PHẦN 2: LẤY VÀ HIỂN THỊ DỮ LIỆU TỪ API
// ==========================================

// --- 2.1 Quản lý Kho Sản Phẩm ---
async function loadProducts() {
    try {
        const res = await fetch('http://localhost:3000/api/products', {
            method: 'GET',
            headers: getAuthHeaders() 
        });
        
        if (!res.ok) throw new Error(`Lỗi kết nối: Status ${res.status}`);
        
        const result = await res.json();
        if (result.success) {
            allProducts = result.data;
            renderProducts(allProducts);
            populateProductSelectForImport(allProducts); 
        }
    } catch (err) { 
        console.error('Lỗi tải sản phẩm:', err);
        document.getElementById('productTableBody').innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">Lỗi tải dữ liệu sản phẩm (Có thể do lỗi Token)!</td></tr>`;
    }
}

function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Không tìm thấy sản phẩm nào!</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><code class="text-dark fw-bold">${p.barcode}</code></td>
            <td>${p.name}</td>
            <td class="text-primary fw-bold">${Number(p.price).toLocaleString()} đ</td>
            <td><span class="badge ${p.stock > 10 ? 'bg-success' : 'bg-danger'} fs-6">${p.stock}</span></td>
            <td>${p.unit || 'Cái'}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editProduct(${p.id})"><i class="bi bi-pencil-square"></i> Sửa</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})"><i class="bi bi-trash"></i> Xóa</button>
            </td>
        </tr>
    `).join('');
}

// --- 2.2 Quản lý Danh Mục ---
async function loadCategories() {
    try {
        const res = await fetch('http://localhost:3000/api/categories', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!res.ok) return;
        const result = await res.json();
        if (result.success) {
            const listGroup = document.getElementById('categoryListGroup');
            if (listGroup) {
                listGroup.innerHTML = result.data.map(c => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${c.name} <span class="badge bg-secondary rounded-pill">Mã: ${c.id}</span>
                    </li>
                `).join('');
            }
        }
    } catch (err) { console.error('Lỗi tải danh mục:', err); }
}

// --- 2.3 Quản lý Nhà Cung Cấp ---
async function loadSuppliers() {
    try {
        const res = await fetch('http://localhost:3000/api/suppliers', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!res.ok) return;
        const result = await res.json();
        if (result.success) {
            const tbody = document.getElementById('supplierTableBody');
            if (tbody) {
                tbody.innerHTML = result.data.map(s => `
                    <tr>
                        <td>${s.id}</td>
                        <td><strong>${s.name}</strong></td>
                        <td>${s.phone || 'Chưa có'}</td>
                        <td>${s.address || 'Chưa có'}</td>
                    </tr>
                `).join('');
            }
            const selectImport = document.getElementById('importSupplierSelect');
            if (selectImport) {
                selectImport.innerHTML = result.data.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            }
        }
    } catch (err) { console.error('Lỗi tải đối tác:', err); }
}

// --- 2.4 Quản lý Khách Hàng ---
async function loadCustomers() {
    try {
        const res = await fetch('http://localhost:3000/api/customers', {
            method: 'GET',
            headers: getAuthHeaders() 
        });
        if (!res.ok) throw new Error(`Lỗi kết nối khách hàng: Status ${res.status}`);
        const result = await res.json();
        if (result.success) { 
            allCustomers = result.data; 
            renderCustomers(allCustomers); 
        }
    } catch (err) { console.error('Lỗi tải khách hàng:', err); }
}

function renderCustomers(data) {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Chưa có khách hàng nào trong hệ thống!</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(c => `
        <tr>
            <td>${c.id}</td>
            <td><strong>${c.full_name || 'Không rõ'}</strong></td> <!-- SỬA: Thay c.name thành c.full_name -->
            <td>${c.phone}</td>
            <td><span class="text-success fw-bold">${Number(c.points || 0).toLocaleString()}đ</span></td>
        </tr>
    `).join('');
}

// --- 2.5 Lịch Sử Hóa Đơn Giao Dịch ---
async function loadOrders() {
    try {
        const res = await fetch('http://localhost:3000/api/orders', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!res.ok) {
            console.warn(`Đường dẫn API hóa đơn đang trả về mã lỗi: ${res.status}. Hãy kiểm tra lại backend/src/routes/index.js`);
            const tbody = document.getElementById('orderTableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-warning py-3">Tính năng lịch sử hóa đơn đang được phát triển hoặc chưa khớp Route (404/500).</td></tr>`;
            return;
        }
        
        const result = await res.json();
        if (result.success) { 
            allOrders = result.data; 
            renderOrders(allOrders); 
        }
    } catch (err) { 
        console.error('Lỗi phân tích hóa đơn:', err); 
    }
}

function renderOrders(data) {
    const tbody = document.getElementById('orderTableBody');
    if (!tbody) return;
    tbody.innerHTML = data.map(o => `
        <tr>
            <td><code>HD-${o.id}</code></td>
            <td>${new Date(o.created_at).toLocaleString('vi-VN')}</td>
            <td>${o.customer_name || 'Khách vãng lai'}</td>
            <td class="text-danger fw-bold">${Number(o.total_amount).toLocaleString()} đ</td>
            <td>${o.employee_name || 'Hệ thống'}</td>
        </tr>
    `).join('');
}


// ==========================================
// PHẦN 3: NGHIỆP VỤ LẬP PHIẾU NHẬP HÀNG KHO
// ==========================================
function populateProductSelectForImport(products) {
    const select = document.getElementById('importProductSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Click chọn mặt hàng nhập kho --</option>' + 
        products.map(p => `<option value="${p.id}" data-name="${p.name}" data-price="${p.price}">[${p.barcode}] ${p.name} - Tồn: ${p.stock}</option>`).join('');
}

function initImportEvents() {
    const importSelect = document.getElementById('importProductSelect');
    if (!importSelect) return;

    importSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (!selectedOption.value) return;

        const productId = parseInt(selectedOption.value);
        const name = selectedOption.getAttribute('data-name');
        const defaultPrice = Math.round(parseFloat(selectedOption.getAttribute('data-price')) * 0.7); 

        const exist = importCart.find(item => item.product_id === productId);
        if (exist) {
            exist.quantity += 1;
        } else {
            importCart.push({ product_id: productId, name: name, import_price: defaultPrice, quantity: 1 });
        }
        renderImportTable();
        e.target.value = ""; 
    });

    const submitImportBtn = document.getElementById('submitImportBtn');
    if (submitImportBtn) {
        submitImportBtn.addEventListener('click', async () => {
            if (importCart.length === 0) return alert('Vui lòng thêm sản phẩm vào phiếu nhập!');
            const supplierId = document.getElementById('importSupplierSelect').value;
            if (!supplierId) return alert('Vui lòng chọn một nhà cung cấp!');

            const bodyData = {
                supplier_id: parseInt(supplierId),
                items: importCart
            };

            try {
                const res = await fetch('http://localhost:3000/api/receipts', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(bodyData)
                }).then(r => r.json());

                if (res.success) {
                    alert('Thành công: ' + res.message);
                    importCart = [];
                    renderImportTable();
                    loadProducts(); 
                } else {
                    alert('Thất bại: ' + res.message);
                }
            } catch (err) { alert('Lỗi kết nối API nhập kho!'); }
        });
    }
}

function renderImportTable() {
    const tbody = document.getElementById('importTableBody');
    if (!tbody) return;
    let total = 0;

    tbody.innerHTML = importCart.map((item, index) => {
        const subTotal = item.import_price * item.quantity;
        total += subTotal;
        return `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td><input type="number" class="form-control form-control-sm" value="${item.import_price}" onchange="updateImportItem(${index}, 'price', this.value)"></td>
                <td><input type="number" class="form-control form-control-sm" value="${item.quantity}" min="1" onchange="updateImportItem(${index}, 'qty', this.value)"></td>
                <td class="fw-bold text-dark">${subTotal.toLocaleString()} đ</td>
                <td><button class="btn btn-sm btn-danger" onclick="removeImportItem(${index})"><i class="bi bi-trash"></i></button></td>
            </tr>
        `;
    }).join('');

    document.getElementById('importTotalAmount').innerText = total.toLocaleString() + ' đ';
}

window.updateImportItem = (index, field, value) => {
    if (field === 'price') importCart[index].import_price = parseFloat(value) || 0;
    if (field === 'qty') importCart[index].quantity = parseInt(value) || 1;
    renderImportTable();
};

window.removeImportItem = (index) => {
    importCart.splice(index, 1);
    renderImportTable();
};

// ==========================================
// PHẦN 4: THÊM DANH MỤC VÀ NHÀ CUNG CẤP
// ==========================================
function initCategorySupplierEvents() {
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', async () => {
            const input = document.getElementById('newCategoryName');
            const name = input.value.trim();
            if (!name) return alert('Vui lòng nhập tên danh mục!');

            try {
                const res = await fetch('http://localhost:3000/api/categories', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ name })
                }).then(r => r.json());

                if (res.success) {
                    input.value = '';
                    loadCategories();
                } else { alert(res.message); }
            } catch (err) { alert('Lỗi kết nối thêm danh mục!'); }
        });
    }

    const supplierForm = document.getElementById('supplierForm');
    if (supplierForm) {
        supplierForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('supplierName').value.trim();
            const phone = document.getElementById('supplierPhone').value.trim();
            const address = document.getElementById('supplierAddress').value.trim();

            try {
                const res = await fetch('http://localhost:3000/api/suppliers', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ name, phone, address })
                }).then(r => r.json());

                if (res.success) {
                    supplierForm.reset();
                    loadSuppliers();
                } else { alert(res.message); }
            } catch (err) { alert('Lỗi kết nối thêm nhà cung cấp!'); }
        });
    }
}

// ==========================================
// PHẦN 5: THAO TÁC SẢN PHẨM (SỬA / XÓA)
// ==========================================
window.deleteProduct = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này khỏi kho hàng?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }).then(r => r.json());

        if (res.success) {
            alert(res.message);
            loadProducts(); 
        } else { alert('Lỗi: ' + res.message); }
    } catch (err) { alert('Không thể kết nối đến máy chủ để xóa!'); }
};

window.editProduct = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    alert(`Tính năng sửa cho sản phẩm: ${product.name}.\nBạn hãy xây dựng Form cập nhật qua API UPDATE tương tự.`);
};