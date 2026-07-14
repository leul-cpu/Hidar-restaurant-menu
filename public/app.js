document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const navCategories = document.getElementById('nav-categories');
    const menuSections = document.getElementById('menu-sections');
    const searchInput = document.getElementById('menu-search');

    // App State
    let menuData = null;

    // Load Menu Data
    async function loadMenu() {
        try {
            const response = await fetch('/api/menu');
            if (!response.ok) throw new Error('Network response was not ok');
            menuData = await response.json();
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

    // Search bar functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!menuData) return;

        const filteredCategories = JSON.parse(JSON.stringify(menuData.categories));
        filteredCategories.forEach(category => {
            category.items = category.items.filter(item => 
                item.name.toLowerCase().includes(query)
            );
        });

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
    });

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

    // Start App
    loadMenu();
});
