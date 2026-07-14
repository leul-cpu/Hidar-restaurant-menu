document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const navCategories = document.getElementById('nav-categories');
    const menuSections = document.getElementById('menu-sections');
    const searchInput = document.getElementById('menu-search');

    // App State
    let menuData = null;
    let cart = {}; // itemId -> quantity
    let activePollInterval = null;
    let currentStaffTab = 'active'; // 'active' or 'served'

    // ==========================================================================
    // Routing & SPA View Manager
    // ==========================================================================
    function handleRouting() {
        // Clear any running polling intervals
        if (activePollInterval) {
            clearInterval(activePollInterval);
            activePollInterval = null;
        }

        const hash = window.location.hash;

        // Hide all views first
        menuApp.classList.add('hidden');
        orderTrackingApp.classList.add('hidden');
        staffDashboardApp.classList.add('hidden');

        if (hash.startsWith('#/order/')) {
            // Render Order Tracking View
            const orderId = hash.replace('#/order/', '');
            showOrderTracking(orderId);
        } else if (hash === '#/staff') {
            // Render Staff View
            showStaffDashboard();
        } else {
            // Render Main Menu View
            // QR gate check
            if (!tableToken || tableToken.trim() === '') {
                qrGate.classList.remove('hidden');
            } else {
                qrGate.classList.add('hidden');
                menuApp.classList.remove('hidden');
                tableNumberEl.textContent = tableToken.trim();
                if (!menuData) {
                    loadMenu();
                } else {
                    renderMenu(menuData);
                }
            }
        }
    }

    window.addEventListener('hashchange', handleRouting);
    // Trigger router on initial load
    setTimeout(handleRouting, 50);

    // ==========================================================================
    // Main Menu & Cart Flow
    // ==========================================================================
    async function loadMenu() {
        try {
            const response = await fetch('/api/menu');
            if (!response.ok) throw new Error('Network response was not ok');
            menuData = await response.json();
            buildMenuItemMap();
            renderMenu(menuData);
            setupScrollSpy();
        } catch (error) {
            console.error('Error fetching menu:', error);
            menuSections.innerHTML = `
                <div class="loading-state">
                    <p style="color: var(--terracotta); font-weight: bold;">Could not load menu.</p>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Please check connection and reload.</p>
                </div>
            `;
        }
    }

    // Render Menu Categories and Items
    function renderMenu(data) {
        navCategories.innerHTML = '';
        menuSections.innerHTML = '';

        data.categories.forEach(category => {
            // Category navigation link
            const navLink = document.createElement('a');
            navLink.className = 'nav-item';
            navLink.href = `#cat-${category.id}`;
            navLink.textContent = category.name;
            navLink.addEventListener('click', (e) => {
                e.preventDefault();
                const section = document.getElementById(`cat-${category.id}`);
                if (section.classList.contains('collapsed')) {
                    section.classList.remove('collapsed');
                }
                const headerOffset = 130;
                const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                navLink.classList.add('active');
            });
            navCategories.appendChild(navLink);

            // Category section
            const section = document.createElement('section');
            section.className = 'category-section';
            section.id = `cat-${category.id}`;

            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <h2 class="category-title">${category.name}</h2>
                <span class="collapse-icon">−</span>
            `;
            header.addEventListener('click', () => {
                section.classList.toggle('collapsed');
                const isCollapsed = section.classList.contains('collapsed');
                header.querySelector('.collapse-icon').textContent = isCollapsed ? '+' : '−';
            });
            section.appendChild(header);

            if (category.image) {
                const img = document.createElement('img');
                img.className = 'category-banner';
                // ⚡ Bolt: Use native lazy loading to defer off-screen banner images,
                // reducing initial payload and improving Largest Contentful Paint (LCP) for mobile users.
                img.loading = 'lazy';
                img.src = category.image;
                img.alt = category.name;
                section.appendChild(img);
            }

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'category-items';

            const list = document.createElement('ul');
            list.className = 'items-list';

            category.items.forEach(item => {
                const li = document.createElement('li');
                li.className = `menu-item-wrapper ${!item.available ? 'unavailable' : ''}`;

                let statusTag = '';
                if (!item.available) {
                    statusTag = '<span class="item-status-tag">Sold Out</span>';
                }

                li.innerHTML = `
                    <div class="item-name-desc">
                        <span class="item-name">${item.name}</span>
                        ${statusTag}
                        <span class="item-leader-dots"></span>
                    </div>
                    <span class="item-price">${item.price} ETB</span>
                `;
                list.appendChild(li);
            });

            itemsContainer.appendChild(list);
            section.appendChild(itemsContainer);
            menuSections.appendChild(section);
        });
    }

    function changeItemQuantity(itemId, change) {
        const currentQty = cart[itemId] || 0;
        const newQty = Math.max(0, currentQty + change);
        if (newQty === 0) {
            delete cart[itemId];
        } else {
            cart[itemId] = newQty;
        }
        updateCartState();
        renderMenu(menuData);
    }

    function updateCartState() {
        let totalCount = 0;
        let totalPrice = 0;

        for (let itemId in cart) {
            const qty = cart[itemId];
            totalCount += qty;

            // Find item price
            let foundItem = null;
            for (let cat of menuData.categories) {
                foundItem = cat.items.find(i => i.id === itemId);
                if (foundItem) break;
            }
            if (foundItem) {
                totalPrice += foundItem.price * qty;
            }
        }

        if (totalCount > 0) {
            cartBar.classList.remove('hidden');
            cartCountEl.textContent = `${totalCount} item${totalCount > 1 ? 's' : ''} selected`;
        } else {
            cartBar.classList.add('hidden');
        }

        cartTotalPrice.textContent = `${totalPrice} ETB`;
    }

    // Cart Modal Logic
    viewCartBtn.addEventListener('click', () => {
        renderCartModal();
        cartModal.classList.remove('hidden');
    });

    closeCartBtn.addEventListener('click', () => {
        cartModal.classList.add('hidden');
    });

    function renderCartModal() {
        cartItemsList.innerHTML = '';
        let totalPrice = 0;

        for (let itemId in cart) {
            const qty = cart[itemId];
            let menuItem = null;
            for (let cat of menuData.categories) {
                menuItem = cat.items.find(i => i.id === itemId);
                if (menuItem) break;
            }

            if (menuItem) {
                const rowTotal = menuItem.price * qty;
                totalPrice += rowTotal;

                const row = document.createElement('div');
                row.className = 'cart-item-row';
                row.innerHTML = `
                    <div class="cart-item-info">
                        <span class="cart-item-name">${menuItem.name}</span>
                        <span class="cart-item-price">${menuItem.price} ETB x ${qty}</span>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="window.adjustCart('${itemId}', -1)">−</button>
                        <span class="qty-val">${qty}</span>
                        <button class="qty-btn" onclick="window.adjustCart('${itemId}', 1)">+</button>
                    </div>
                `;
                cartItemsList.appendChild(row);
            }
        }

        cartTotalPrice.textContent = `${totalPrice} ETB`;
    }

    // Global helper exposed to window for inline onclick attributes in modal list
    window.adjustCart = (itemId, change) => {
        changeItemQuantity(itemId, change);
        renderCartModal();
    };

    // Submit Order
    submitOrderBtn.addEventListener('click', async () => {
        const orderItems = [];
        for (let itemId in cart) {
            orderItems.push({ itemId, quantity: cart[itemId] });
        }

        if (orderItems.length === 0) return;

        submitOrderBtn.disabled = true;
        submitOrderBtn.textContent = 'Submitting order...';

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: tableToken,
                    items: orderItems
                })
            });

            const data = await response.json();
            if (data.success) {
                // Clear cart
                cart = {};
                updateCartState();
                cartModal.classList.add('hidden');

                // Save orderId so the Track Order button works without needing input
                localStorage.setItem('hidar_last_order_id', data.orderId);

                // Redirect to Tracking
                window.location.hash = `#/order/${data.orderId}`;
            } else {
                alert('Order Failed: ' + data.message);
            }
        } catch (error) {
            console.error('Order submission error:', error);
            alert('Connection failure placing order.');
        } finally {
            submitOrderBtn.disabled = false;
            submitOrderBtn.textContent = 'Submit Order';
        }
    });

    // Search bar functionality with debounce and optimized filtering
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!menuData) return;

        // Optimization: Use Map/Filter structure instead of expensive JSON deep clone
        const filteredCategories = menuData.categories.map(category => ({
            ...category,
            items: category.items.filter(item =>
                item.name.toLowerCase().includes(query)
            )
        }));

        menuSections.innerHTML = '';
        filteredCategories.forEach(category => {
            if (category.items.length === 0) return;

            const section = document.createElement('section');
            section.className = 'category-section';
            section.id = `cat-${category.id}`;

            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <h2 class="category-title">${category.name}</h2>
                <span class="collapse-icon">−</span>
            `;
            header.addEventListener('click', () => {
                section.classList.toggle('collapsed');
                const isCollapsed = section.classList.contains('collapsed');
                header.querySelector('.collapse-icon').textContent = isCollapsed ? '+' : '−';
            });
            section.appendChild(header);

            if (category.image) {
                const img = document.createElement('img');
                img.className = 'category-banner';
                // ⚡ Bolt: Use native lazy loading to defer off-screen banner images,
                // reducing initial payload and improving Largest Contentful Paint (LCP) for mobile users.
                img.loading = 'lazy';
                img.src = category.image;
                img.alt = category.name;
                section.appendChild(img);
            }

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'category-items';

            const list = document.createElement('ul');
            list.className = 'items-list';

            category.items.forEach(item => {
                const li = document.createElement('li');
                li.className = `menu-item-wrapper ${!item.available ? 'unavailable' : ''}`;

                let statusTag = '';
                if (!item.available) {
                    statusTag = '<span class="item-status-tag">Sold Out</span>';
                }

                li.innerHTML = `
                    <div class="item-name-desc">
                        <span class="item-name">${item.name}</span>
                        ${statusTag}
                        <span class="item-leader-dots"></span>
                    </div>
                    <span class="item-price">${item.price} ETB</span>
                `;
                list.appendChild(li);
            });

            itemsContainer.appendChild(list);
            section.appendChild(itemsContainer);
            menuSections.appendChild(section);
        });
    }, 250));

    // ScrollSpy highlighter logic
    function setupScrollSpy() {
        const sections = document.querySelectorAll('.category-section');
        const navItems = document.querySelectorAll('.nav-item');

        window.addEventListener('scroll', () => {
            let current = '';
            const scrollPos = window.scrollY + 150;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            if (current) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${current}`) {
                        item.classList.add('active');
                        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                });
            }
        });
    }

    // ==========================================================================
    // Customer Order Tracking Flow
    // ==========================================================================
    async function showOrderTracking(orderId) {
        orderTrackingApp.classList.remove('hidden');
        trackOrderId.textContent = orderId;

        async function updateStatus() {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                if (!res.ok) throw new Error('Order not found');
                const order = await res.json();

                trackTableNumber.textContent = order.table;
                trackTotalPrice.textContent = `${order.total} ETB`;

                // Render order items list
                trackItemsList.innerHTML = '';
                order.items.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'track-item-li';
                    li.innerHTML = `
                        <span>${item.name} (x${item.quantity})</span>
                        <span>${item.price * item.quantity} ETB</span>
                    `;
                    trackItemsList.appendChild(li);
                });

                // Update timeline status steps
                updateTimelineSteps(order.status);
            } catch (err) {
                console.error(err);
                trackOrderId.textContent = 'Not Found';
            }
        }

        await updateStatus();
        // Poll every 3 seconds for live tracking updates
        activePollInterval = setInterval(updateStatus, 3000);
    }

    function updateTimelineSteps(status) {
        const steps = ['pending', 'preparing', 'ready', 'served'];
        const statusIndex = steps.indexOf(status);

        steps.forEach((step, idx) => {
            const stepEl = document.getElementById(`step-${step}`);
            if (!stepEl) return;

            stepEl.classList.remove('active', 'completed');
            if (idx === statusIndex) {
                stepEl.classList.add('active');
            } else if (idx < statusIndex) {
                stepEl.classList.add('completed');
            }
        });
    }

    trackBackBtn.addEventListener('click', () => {
        window.location.hash = '';
    });

    // ==========================================================================
    // Track Order Quick-Lookup Modal (from header button — auto-loads last order)
    // ==========================================================================
    const trackOrderHeaderBtn = document.getElementById('track-order-header-btn');
    const trackOrderModal = document.getElementById('track-order-modal');
    const closeTrackModalBtn = document.getElementById('close-track-modal-btn');
    const trackModalResult = document.getElementById('track-modal-result');
    const trackModalError = document.getElementById('track-modal-error');
    const modalTrackId = document.getElementById('modal-track-id');
    const modalTrackTable = document.getElementById('modal-track-table');
    const modalTrackItems = document.getElementById('modal-track-items');
    const modalTrackTotal = document.getElementById('modal-track-total');
    const modalOpenFullBtn = document.getElementById('modal-open-full-tracking');

    async function openTrackModal() {
        const savedOrderId = localStorage.getItem('hidar_last_order_id');

        // Reset state
        trackModalResult.classList.add('hidden');
        trackModalError.classList.add('hidden');
        trackOrderModal.classList.remove('hidden');

        if (!savedOrderId) {
            trackModalError.textContent = 'No active order found. Please place an order first.';
            trackModalError.classList.remove('hidden');
            return;
        }

        try {
            const res = await fetch(`/api/orders/${savedOrderId}`);
            if (!res.ok) throw new Error('Not found');
            const order = await res.json();

            modalTrackId.textContent = order.id;
            modalTrackTable.textContent = order.table;
            modalTrackTotal.textContent = `${order.total} ETB`;

            modalTrackItems.innerHTML = '';
            order.items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'track-item-li';
                li.innerHTML = `<span>${item.name} (x${item.quantity})</span><span>${item.price * item.quantity} ETB</span>`;
                modalTrackItems.appendChild(li);
            });

            updateModalTimeline(order.status);

            modalOpenFullBtn.onclick = () => {
                trackOrderModal.classList.add('hidden');
                window.location.hash = `#/order/${order.id}`;
            };

            trackModalResult.classList.remove('hidden');
        } catch (err) {
            trackModalError.textContent = 'Could not load your order. Please try again.';
            trackModalError.classList.remove('hidden');
        }
    }

    if (trackOrderHeaderBtn) {
        trackOrderHeaderBtn.addEventListener('click', openTrackModal);
    }

    if (closeTrackModalBtn) {
        closeTrackModalBtn.addEventListener('click', () => {
            trackOrderModal.classList.add('hidden');
        });
    }

    if (trackOrderModal) {
        trackOrderModal.addEventListener('click', (e) => {
            if (e.target === trackOrderModal) trackOrderModal.classList.add('hidden');
        });
    }

    function updateModalTimeline(status) {
        const steps = ['pending', 'preparing', 'ready', 'served'];
        const statusIndex = steps.indexOf(status);
        steps.forEach((step, idx) => {
            const el = document.getElementById(`modal-step-${step}`);
            if (!el) return;
            el.classList.remove('active', 'completed');
            if (idx === statusIndex) el.classList.add('active');
            else if (idx < statusIndex) el.classList.add('completed');
        });
    }

    // ==========================================================================
    // Staff Dashboard Flow
    // ==========================================================================
    let staffPin = localStorage.getItem('hidar_staff_pin');

    function showStaffDashboard() {
        staffDashboardApp.classList.remove('hidden');

        if (!staffPin) {
            staffLoginContainer.classList.remove('hidden');
            staffWorkspace.classList.add('hidden');
        } else {
            staffLoginContainer.classList.add('hidden');
            staffWorkspace.classList.remove('hidden');
            loadStaffOrders();
            activePollInterval = setInterval(loadStaffOrders, 3000);
        }
    }

    staffLoginBtn.addEventListener('click', async () => {
        const pin = staffPinInput.value;
        try {
            const res = await fetch('/api/staff/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await res.json();
            if (data.success) {
                staffPin = pin;
                localStorage.setItem('hidar_staff_pin', pin);
                staffPinInput.value = '';
                staffLoginError.style.display = 'none';
                showStaffDashboard();
            } else {
                staffLoginError.style.display = 'block';
            }
        } catch (error) {
            console.error(error);
            staffLoginError.textContent = 'Connection error';
            staffLoginError.style.display = 'block';
        }
    });

    staffLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('hidar_staff_pin');
        staffPin = null;
        window.location.reload();
    });

    async function loadStaffOrders() {
        try {
            const res = await fetch('/api/orders', {
                headers: { 'x-staff-pin': staffPin }
            });
            if (!res.ok) throw new Error('Failed to load orders');
            const orders = await res.json();
            renderStaffOrders(orders);
        } catch (err) {
            console.error(err);
            staffOrdersList.innerHTML = '<p style="color: var(--terracotta);">Failed to update live feeds.</p>';
        }
    }

    function renderStaffOrders(orders) {
        staffOrdersList.innerHTML = '';

        // Filter orders by active tab
        const filtered = orders.filter(order => {
            if (currentStaffTab === 'active') {
                return order.status !== 'served';
            } else {
                // Show served orders only from the last 24 hours
                if (order.status !== 'served') return false;
                const hoursElapsed = (new Date() - new Date(order.timestamp)) / 3600000;
                return hoursElapsed <= 24;
            }
        });

        // Sort: pending first, then preparing, then ready, served by date desc
        filtered.sort((a, b) => {
            if (currentStaffTab === 'active') {
                const priority = { pending: 0, preparing: 1, ready: 2 };
                return priority[a.status] - priority[b.status] || new Date(b.timestamp) - new Date(a.timestamp);
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        if (filtered.length === 0) {
            staffOrdersList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--muted-plum);">
                    <p>No orders in this section.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(order => {
            const card = document.createElement('div');
            card.className = `staff-order-card ${order.status}`;

            // Format time elapsed
            const timeElapsed = Math.floor((new Date() - new Date(order.timestamp)) / 60000);
            const timeText = timeElapsed <= 0 ? 'Just now' : `${timeElapsed}m ago`;

            let itemsMarkup = '';
            order.items.forEach(it => {
                itemsMarkup += `
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px;">
                        <span>• ${it.name} <strong>x${it.quantity}</strong></span>
                        <span>${it.price * it.quantity} ETB</span>
                    </div>
                `;
            });

            let actionsMarkup = '';
            if (order.status === 'pending') {
                actionsMarkup = `<button class="staff-action-btn btn-prepare" onclick="window.updateOrderStatus('${order.id}', 'preparing')">Start Cooking</button>`;
            } else if (order.status === 'preparing') {
                actionsMarkup = `<button class="staff-action-btn btn-ready" onclick="window.updateOrderStatus('${order.id}', 'ready')">Mark Ready</button>`;
            } else if (order.status === 'ready') {
                actionsMarkup = `<button class="staff-action-btn btn-serve" onclick="window.updateOrderStatus('${order.id}', 'served')">Mark Served</button>`;
            }

            card.innerHTML = `
                <div class="staff-order-title">
                    <div>
                        <strong style="color: var(--terracotta); font-size: 1.15rem;">${order.id}</strong>
                        <span class="staff-order-meta"> (Table ${order.table})</span>
                    </div>
                    <span class="item-status-tag" style="background: var(--cream-accent);">${order.status}</span>
                </div>
                <div style="margin-bottom: 12px;">
                    ${itemsMarkup}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--muted-plum); border-top: 1px dashed rgba(210,173,105,0.15); padding-top: 8px;">
                    <span>Elapsed: ${timeText}</span>
                    <strong>Total: ${order.total} ETB</strong>
                </div>
                <div class="staff-order-actions">
                    ${actionsMarkup}
                </div>
            `;
            staffOrdersList.appendChild(card);
        });
    }

    // Action updates status from click handlers in staff dashboard cards
    window.updateOrderStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-staff-pin': staffPin
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                loadStaffOrders();
            } else {
                alert('Status update failed: ' + data.message);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to connect to server updating status.');
        }
    };

    // Tab buttons handling
    document.querySelectorAll('.staff-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.staff-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentStaffTab = e.target.getAttribute('data-tab');
            loadStaffOrders();
        });
    });
});
