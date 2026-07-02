document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Ngăn chặn trang web bị tải lại mặc định

    // 1. Lấy dữ liệu từ các ô nhập liệu
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    // Ẩn thông báo lỗi cũ đi mỗi lần bấm lại
    errorDiv.classList.add('d-none');

    try {
        // 2. Gọi API đăng nhập ở Backend (Port 3000)
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        // 3. Xử lý kết quả trả về từ Server
        if (response.ok) {
            // Đăng nhập thành công -> Lưu Token và Thông tin User vào trình duyệt
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            alert('Đăng nhập thành công!');
            
            // Chuyển hướng sang trang quản lý bán hàng 
            window.location.href = 'index.html'; 
        } else {
            // Thất bại -> Hiển thị thông báo lỗi từ backend trả về
            errorDiv.textContent = data.message || 'Đăng nhập thất bại!';
            errorDiv.classList.remove('d-none');
        }

    } catch (error) {
        console.error('Lỗi kết nối Frontend:', error);
        errorDiv.textContent = 'Không thể kết nối đến máy chủ Backend! Vui lòng kiểm tra lại.';
        errorDiv.classList.remove('d-none');
    }
});