// ==========================================
// TOÀN BỘ FILE QUẢN LÝ BÁN HÀNG (frontend/js/pos.js)
// ==========================================

// 1. KIỂM TRA BẢO MẬT: Nếu chưa đăng nhập, đá về trang login lập tức
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'login.html';
}

// Hiển thị tên nhân viên lên thanh Navbar
document.getElementById('userInfo').innerHTML = `<i class="bi bi-person-circle me-1"></i> ${user.full_name || 'Nhân viên'}`;

// Các biến lưu trữ dữ liệu cục bộ
let cart = [];           // Giỏ hàng hiện tại của khách
let allProducts = [];    // Kho hàng tải từ Backend về để tìm kiếm nhanh
let allCustomers = [];   // Danh sách khách hàng tải từ Backend để check realtime

const barcodeInput = document.getElementById('barcodeInput');
const suggestionBox = document.getElementById('suggestionBox');

// Các phần tử DOM liên quan đến Khách hàng mới thêm
const customerPhoneInput = document.getElementById('customerPhoneInput');
const customerNameInput = document.getElementById('customerNameInput');
const customerStatusMessage = document.getElementById('customerStatusMessage');

// 2. TẢI TOÀN BỘ SẢN PHẨM & KHÁCH HÀNG: Lấy dữ liệu khi vừa vào trang quầy
async function loadInitialData() {
    try {
        // Tải sản phẩm
        const resProducts = await fetch('http://localhost:3000/api/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resProducts.ok) {
            const result = await resProducts.json();
            allProducts = result.data;
        }

        // Tải danh sách khách hàng có sẵn để đối chiếu số điện thoại
        await loadCustomersList();

    } catch (error) {
        console.error('Không thể tải dữ liệu ban đầu cho quầy POS:', error);
    }
}

async function loadCustomersList() {
    try {
        const resCustomers = await fetch('http://localhost:3000/api/customers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resCustomers.ok) {
            const result = await resCustomers.json();
            allCustomers = result.data;
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách khách hàng:', error);
    }
}

loadInitialData(); // Kích hoạt chạy ngay khi trang web mở lên

// LẮNG NGHE SỰ KIỆN NHẬP SỐ ĐIỆN THOẠI KHÁCH HÀNG (REALTIME CHECK)
if (customerPhoneInput) {
    customerPhoneInput.addEventListener('input', (e) => {
        const phone = e.target.value.trim();
        customerStatusMessage.classList.remove('d-none');

        if (!phone) {
            customerStatusMessage.classList.add('d-none');
            customerNameInput.value = '';
            customerNameInput.disabled = false;
            return;
        }

        // Tìm kiếm số điện thoại trong hệ thống đám mây
        const found = allCustomers.find(c => c.phone === phone);

        if (found) {
            customerStatusMessage.className = "small mt-2 text-success fw-bold";
            customerStatusMessage.innerHTML = `<i class="bi bi-check-circle-fill"></i> Thành viên: ${found.full_name} (Điểm: ${Number(found.points || 0).toLocaleString()}đ)`;
            customerNameInput.value = found.full_name;
            customerNameInput.disabled = true; // Khóa lại không cho sửa tên nếu là thành viên cũ
        } else {
            customerStatusMessage.className = "small mt-2 text-info";
            customerStatusMessage.innerHTML = `<i class="bi bi-plus-circle-fill"></i> Khách hàng mới (Vui lòng điền họ tên bên dưới)`;
            customerNameInput.disabled = false;
        }
    });
}

// 3. AUTO-SUGGEST: Lắng nghe mỗi khi nhân viên gõ từng chữ vào ô tìm kiếm sản phẩm
barcodeInput.addEventListener('input', (e) => {
    const keyword = e.target.value.trim().toLowerCase();
    suggestionBox.innerHTML = '';

    if (!keyword) {
        suggestionBox.classList.add('d-none');
        return;
    }

    const matches = allProducts.filter(p => 
        p.name.toLowerCase().includes(keyword) || 
        p.barcode.includes(keyword)
    );

    if (matches.length === 0) {
        suggestionBox.classList.add('d-none');
        return;
    }

    matches.forEach(product => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2';
        button.innerHTML = `
            <div>
                <strong class="text-primary">${product.name}</strong> 
                <small class="text-muted d-block">Mã: ${product.barcode}</small>
            </div>
            <span class="badge bg-success">${parseFloat(product.price).toLocaleString()} đ</span>
        `;
        
        button.addEventListener('click', () => {
            addToCart(product);
            barcodeInput.value = ''; 
            suggestionBox.classList.add('d-none'); 
            barcodeInput.focus();
        });
        
        suggestionBox.appendChild(button);
    });

    suggestionBox.classList.remove('d-none');
});

document.addEventListener('click', (e) => {
    if (e.target !== barcodeInput && e.target !== suggestionBox) {
        suggestionBox.classList.add('d-none');
    }
});

// 4. XỬ LÝ ENTER / BẤM NÚT "THÊM MÓN"
document.getElementById('barcodeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const inputVal = barcodeInput.value.trim().toLowerCase();
    if (!inputVal) return;

    let product = allProducts.find(p => p.barcode === inputVal);

    if (!product) {
        product = allProducts.find(p => p.name.toLowerCase().includes(inputVal));
    }

    if (product) {
        addToCart(product);
        barcodeInput.value = ''; 
        suggestionBox.classList.add('d-none'); 
        barcodeInput.focus();
    } else {
        alert('Không tìm thấy sản phẩm nào khớp với từ khóa hoặc mã vạch này!');
    }
});

// 5. HÀM THÊM SẢN PHẨM VÀO GIỎ
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            barcode: product.barcode,
            name: product.name,
            price: parseFloat(product.price),
            unit: product.unit || 'Cái',
            quantity: 1
        });
    }
    renderCart();
}

// 6. CẬP NHẬT GIAO DIỆN BẢNG GIỎ HÀNG VÀ TỔNG TIỀN
function renderCart() {
    const tbody = document.getElementById('cartTableBody');
    const emptyMsg = document.getElementById('emptyCartMessage');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    tbody.innerHTML = '';
    
    if (cart.length === 0) {
        emptyMsg.classList.remove('d-none');
        checkoutBtn.disabled = true;
        document.getElementById('totalQuantity').textContent = '0';
        document.getElementById('totalAmount').textContent = '0 đ';
        return;
    }
    
    emptyMsg.classList.add('d-none');
    checkoutBtn.disabled = false;
    
    let totalQty = 0;
    let totalAmt = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalQty += item.quantity;
        totalAmt += itemTotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="ps-3 fw-bold text-muted">${index + 1}</td>
            <td><code>${item.barcode}</code></td>
            <td class="fw-semibold">${item.name} <span class="badge bg-secondary ms-1">${item.unit}</span></td>
            <td class="text-center">${item.price.toLocaleString()} đ</td>
            <td class="text-center">
                <input type="number" class="form-control form-control-sm mx-auto text-center" style="width: 70px;" 
                       value="${item.quantity}" min="1" onchange="updateQty(${item.id}, this.value)">
            </td>
            <td class="text-end pe-3 fw-bold text-primary">${itemTotal.toLocaleString()} đ</td>
            <td>
                <button class="btn btn-sm text-danger" onclick="removeItem(${item.id})"><i class="bi bi-trash3"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    document.getElementById('totalQuantity').textContent = totalQty;
    document.getElementById('totalAmount').textContent = totalAmt.toLocaleString() + ' đ';
}

window.updateQty = (id, val) => {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity = parseInt(val) || 1;
        renderCart();
    }
};

window.removeItem = (id) => {
    cart = cart.filter(i => i.id !== id);
    renderCart();
};

// 7. THANH TOÁN ĐƠN HÀNG VÀ XỬ LÝ ĐỒNG BỘ KHÁCH HÀNG TỰ ĐỘNG
document.getElementById('checkoutBtn').addEventListener('click', async () => {
    if (cart.length === 0) return;

    let customerId = null; 
    const phone = customerPhoneInput.value.trim();
    const fullName = customerNameInput.value.trim();

    // KIỂM TRA & TẠO KHÁCH HÀNG TỰ ĐỘNG NẾU NHÂN VIÊN CÓ NHẬP THÔNG TIN
    if (phone) {
        const existCustomer = allCustomers.find(c => c.phone === phone);
        if (existCustomer) {
            customerId = existCustomer.id; // Nếu có sẵn khách cũ, gán ID luôn
        } else {
            // Nếu là số điện thoại mới mà không nhập tên thì báo lỗi
            if (!fullName) {
                alert('Vui lòng điền thêm Họ tên để tạo tài khoản mới cho số điện thoại này!');
                customerNameInput.focus();
                return;
            }

            // Tiến hành gọi API thêm nhanh khách hàng mới vào Database trước
            try {
                const responseCustomer = await fetch('http://localhost:3000/api/customers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ phone, full_name: fullName })
                });
                
                const resCustomer = await responseCustomer.json();

                if (responseCustomer.ok && resCustomer.success) {
                    customerId = resCustomer.data.id; // Nhận ID vừa được sinh ra từ backend
                    await loadCustomersList(); // Cập nhật danh sách khách hàng cục bộ
                } else {
                    alert('Lỗi tạo tài khoản khách hàng: ' + (resCustomer.message || 'Không xác định'));
                    return;
                }
            } catch (err) {
                alert('Lỗi kết nối máy chủ khi đăng ký tài khoản khách hàng mới!');
                return;
            }
        }
    }

    // TIẾN HÀNH THANH TOÁN HÓA ĐƠN
    let totalAmt = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
    }));

    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                employee_id: user.id,
                customer_id: customerId, // Gửi kèm id khách hàng (null nếu là khách vãng lai)
                total_amount: totalAmt,
                items: orderItems
            })
        });

        const result = await response.json();

        if (response.ok) {
            // --- CẬP NHẬT DỮ LIỆU ĐỘNG VÀO MẪU IN HÓA ĐƠN (MODAL) ---
            document.getElementById('invOrderId').textContent = `Số HD: #${result.orderId}`;
            
            // Thiết lập thời gian thực xuất hóa đơn
            const now = new Date();
            document.getElementById('invDate').textContent = `Ngày: ${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;
            
            document.getElementById('invEmployee').textContent = `Thu ngân: ${user.full_name || 'Nhân viên'}`;
            document.getElementById('invCustomer').textContent = phone ? `Khách hàng: ${fullName}` : 'Khách hàng: Khách vãng lai';
            
            // Đổ danh sách sản phẩm vào bảng hóa đơn nhỏ
            const invBody = document.getElementById('invItemsBody');
            invBody.innerHTML = '';
            cart.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-end">${(item.price * item.quantity).toLocaleString()} đ</td>
                `;
                invBody.appendChild(tr);
            });
            
            document.getElementById('invTotalAmount').textContent = totalAmt.toLocaleString() + ' đ';
            
            // Gọi Bootstrap Modal hiển thị trực quan hóa đơn lên màn hình quầy
            const myInvoiceModal = new bootstrap.Modal(document.getElementById('invoiceModal'));
            myInvoiceModal.show();
            // -------------------------------------------------------

            // Xóa sạch giỏ hàng & form thông tin khách hàng cũ sau thanh toán thành công
            cart = [];
            customerPhoneInput.value = '';
            customerNameInput.value = '';
            customerNameInput.disabled = false;
            customerStatusMessage.classList.add('d-none');
            
            renderCart();
            loadInitialData(); // Tải lại kho hàng đồng bộ và làm mới danh sách cục bộ
        } else {
            alert('Lỗi thanh toán: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi khi thanh toán đơn hàng:', error);
        alert('Không thể kết nối đến máy chủ thanh toán!');
    }
});

// 8. ĐĂNG XUẤT HỆ THỐNG
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});