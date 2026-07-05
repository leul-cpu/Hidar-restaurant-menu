document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const adminWorkspace = document.getElementById('admin-workspace');
    const adminPassInput = document.getElementById('admin-pass');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const adminMenuList = document.getElementById('admin-menu-list');
    const toast = document.getElementById('toast');

    let token = localStorage.getItem('hidar_admin_token');

    if (token) {
        showDashboard();
    }

    loginBtn.addEventListener('click', handleLogin);
    adminPassInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('hidar_admin_token');
        token = null;
        window.location.reload();
    });

    async function handleLogin() {
        const password = adminPassInput.value;
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.success) {
                token = data.token;
                localStorage.setItem('hidar_admin_token', token);
                loginError.style.display = 'none';
                showDashboard();
            } else {
                loginError.textContent = data.message || 'Invalid Password';
                loginError.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Server connection error';
            loginError.style.display = 'block';
        }
    }

    function showDashboard() {
        loginContainer.classList.add('hidden');
        adminWorkspace.classList.remove('hidden');
        loadAdminMenu();
    }

    async function loadAdminMenu() {
        try {
            const res = await fetch('/api/menu');
            const data = await res.json();
            renderAdminMenu(data);
        } catch (error) {
            console.error('Error loading admin menu:', error);
            adminMenuList.innerHTML = '<p style="color: var(--terracotta);">Failed to load menu items.</p>';
        }
    }

    function renderAdminMenu(data) {
        adminMenuList.innerHTML = '';
        data.categories.forEach(category => {
            const section = document.createElement('div');
            section.className = 'admin-section';
            
            const title = document.createElement('h3');
            title.className = 'admin-sec-title';
            title.textContent = category.name;
            section.appendChild(title);

            category.items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'admin-item-row';

                // Item Name Input
                const nameCol = document.createElement('div');
                nameCol.className = 'admin-item-name';
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = item.name;
                nameInput.style.width = '100%';
                nameInput.style.padding = '4px 8px';
                nameInput.style.border = '1px solid rgba(164, 63, 37, 0.15)';
                nameInput.style.borderRadius = '4px';
                nameInput.style.background = 'var(--cream-bg)';
                nameInput.style.fontFamily = 'Plus Jakarta Sans, sans-serif';
                nameCol.appendChild(nameInput);

                // Price Input
                const priceCol = document.createElement('div');
                const priceInput = document.createElement('input');
                priceInput.type = 'number';
                priceInput.className = 'admin-price-input';
                priceInput.value = item.price;
                priceCol.appendChild(priceInput);

                // Availability Checkbox
                const statusCol = document.createElement('div');
                const label = document.createElement('label');
                label.className = 'status-toggle';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = item.available;
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(' Available'));
                statusCol.appendChild(label);

                // Save Action
                const actionCol = document.createElement('div');
                const saveBtn = document.createElement('button');
                saveBtn.className = 'save-btn';
                saveBtn.textContent = 'Save';
                saveBtn.addEventListener('click', () => saveItem(item.id, nameInput.value, priceInput.value, checkbox.checked, saveBtn));
                actionCol.appendChild(saveBtn);

                row.appendChild(nameCol);
                row.appendChild(priceCol);
                row.appendChild(statusCol);
                row.appendChild(actionCol);

                section.appendChild(row);
            });

            adminMenuList.appendChild(section);
        });
    }

    async function saveItem(itemId, name, price, available, btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Saving...';
        btn.disabled = true;

        try {
            const res = await fetch('/api/admin/menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    itemId,
                    name,
                    price: Number(price),
                    available: Boolean(available)
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast('Changes saved successfully!');
            } else {
                showToast('Error: ' + data.message, true);
            }
        } catch (error) {
            console.error('Error saving item:', error);
            showToast('Failed to connect to server', true);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.style.background = isError ? 'var(--terracotta)' : '#2e7d32';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
