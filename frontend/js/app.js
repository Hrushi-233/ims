import auth from './auth.js';
import api from './api.js';

// Configuration
const ROUTES = [
    { path: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', roles: ['admin', 'staff'] },
    { path: 'products', label: 'Products', icon: 'package', roles: ['admin', 'staff'] },
    { path: 'sales', label: 'My Orders', icon: 'shopping-cart', roles: ['staff'] },
    { path: 'categories', label: 'Categories', icon: 'tags', roles: ['admin', 'staff'] },
    { path: 'sales-history', label: 'Sales History', icon: 'history', roles: ['admin'] },
    { path: 'purchases', label: 'Purchases', icon: 'credit-card', roles: ['admin'] },
    { path: 'stock-alerts', label: 'Stock Alerts', icon: 'bell', roles: ['admin'] },
    { path: 'activity-logs', label: 'Activity Logs', icon: 'activity', roles: ['admin'] },
    { path: 'suppliers', label: 'Suppliers', icon: 'contact', roles: ['admin'] },
    { path: 'users', label: 'User Directory', icon: 'users', roles: ['admin'] },
];

const state = {
    currentPath: 'dashboard',
    user: auth.getUser()
};
if (!state.user) {
    window.location.href = 'login.html';
}
console.log('Current User Role:', state.user ? state.user.role : 'Guest');

let salesChartInstance = null;

// --- Initialization ---
function init() {
    auth.checkAuth();

    // Set initial path based on role
    state.currentPath = 'dashboard';

    renderSidebar();
    renderTopBar();
    renderCurrentPage();

    document.getElementById('logout-btn').onclick = () => auth.logout();

    // Listen for hash changes if we want back button support
    window.addEventListener('hashchange', handleHashChange);

    // Check initial hash
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const route = ROUTES.find(r => r.path === hash);
        if (route && route.roles.includes(state.user.role)) {
            state.currentPath = hash;
            renderCurrentPage();
            renderSidebar();
        }
    } else if (state.user.role === 'staff') {
        window.location.hash = 'dashboard';
    }
}

function handleHashChange() {
    const hash = window.location.hash.substring(1);
    const route = ROUTES.find(r => r.path === hash);
    if (route && route.roles.includes(state.user.role)) {
        state.currentPath = hash;
        renderCurrentPage();
        renderSidebar();
    }
}

// --- UI Rendering ---
function renderSidebar() {
    const navLinks = document.getElementById('nav-links');
    navLinks.innerHTML = '';

    const visibleRoutes = ROUTES.filter(r => r.roles.includes(state.user.role));

    visibleRoutes.forEach(route => {
        const link = document.createElement('a');
        link.href = `#${route.path}`;
        link.className = `sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all hover:bg-white/5 hover:text-white ${state.currentPath === route.path ? 'active text-white' : 'text-slate-400'}`;

        link.innerHTML = `
            <i data-lucide="${route.icon}" class="w-5 h-5"></i>
            <span>${route.label}</span>
        `;

        navLinks.appendChild(link);
    });

    lucide.createIcons();
}

function renderTopBar() {
    document.getElementById('user-name').textContent = state.user.name;
    const adminTag = state.user.role === 'admin' ? '<span class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Admin</span>' : '';
    document.getElementById('user-name').innerHTML += adminTag;
}

function renderCurrentPage() {
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');

    const route = ROUTES.find(r => r.path === state.currentPath);
    pageTitle.textContent = route ? route.label : 'Not Found';

    contentArea.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    `;

    switch (state.currentPath) {
        case 'dashboard': renderDashboard(); break;
        case 'products': renderProducts(); break;
        case 'sales': renderSales(); break;
        case 'categories': renderCategories(); break;
        case 'sales-history': renderSalesHistory(); break;
        case 'purchases': renderPurchases(); break;
        case 'stock-alerts': renderStockAlerts(); break;
        case 'activity-logs': renderActivityLogs(); break;
        case 'suppliers': renderSuppliers(); break;
        case 'users': renderUsers(); break;
        default: contentArea.innerHTML = '<p class="text-slate-500">Feature coming soon...</p>';
    }
}

// --- Page Views ---

async function renderDashboard() {
    const container = document.getElementById('content-area');
    try {
        const stats = await api.get('/stats');

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <i data-lucide="package"></i>
                    </div>
                    <p class="text-slate-500 text-sm font-semibold mb-1">Total Products</p>
                    <h3 class="text-3xl font-extrabold text-slate-900">${stats.totalProducts}</h3>
                </div>
                <div class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                        <i data-lucide="shopping-cart"></i>
                    </div>
                    <p class="text-slate-500 text-sm font-semibold mb-1">Recent Sales</p>
                    <h3 class="text-3xl font-extrabold text-slate-900">${stats.recentSales}</h3>
                </div>
                <div class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                        <i data-lucide="bell"></i>
                    </div>
                    <p class="text-slate-500 text-sm font-semibold mb-1">Low Stock Alerts</p>
                    <h3 class="text-3xl font-extrabold text-slate-900 text-amber-600">${stats.lowStockAlerts}</h3>
                </div>
            </div>
            
            <div class="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <h4 class="text-lg font-extrabold text-slate-900 mb-6">Sales Trend (30 Days)</h4>
                <div class="h-64">
                    <canvas id="salesChart"></canvas>
                </div>
            </div>
        `;
        lucide.createIcons();

        // Render Chart
        const trendData = await api.get('/sales-trend');
        const canvas = document.getElementById('salesChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (salesChartInstance) {
            salesChartInstance.destroy();
        }

        salesChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.map(d => d.name),
                datasets: [{
                    label: 'Daily Sales ($)',
                    data: trendData.map(d => d.sales),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { borderDash: [5, 5], color: '#f1f5f9' },
                        ticks: { font: { weight: 'bold', family: 'Inter' }, color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { weight: 'bold', family: 'Inter' }, color: '#94a3b8' }
                    }
                }
            }
        });
    } catch (err) {
        container.innerHTML = `<p class="text-red-500 font-semibold">Error loading dashboard: ${err.message}</p>`;
    }
}

async function renderProducts() {
    const container = document.getElementById('content-area');
    try {
        const products = await api.get('/products');
        const categories = await api.get('/categories');
        const suppliers = await api.get('/suppliers');

        container.innerHTML = `
            <div class="flex justify-between items-center mb-8">
                <p class="text-slate-500 font-medium">${state.user.role === 'admin' ? 'Manage and monitor your warehouse inventory.' : 'View current warehouse inventory levels.'}</p>
                ${state.user.role === 'admin' ? `
                <button id="add-product-btn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                    <i data-lucide="plus" class="w-5 h-5"></i> Add Product
                </button>
                ` : ''}
            </div>

            <div class="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th class="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Product Name</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Category</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Price</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Stock</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Supplier</th>
                            ${state.user.role === 'admin' ? '<th class="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${products.map(p => `
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-8 py-5">
                                    <div class="flex flex-col">
                                        <span class="font-bold text-slate-900">${p.name}</span>
                                        <span class="text-xs text-slate-400">${p.description || 'No description'}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-5">
                                    <span class="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full uppercase">${p.category_name || 'N/A'}</span>
                                </td>
                                <td class="px-6 py-5 font-bold text-slate-700">$${p.price.toFixed(2)}</td>
                                <td class="px-6 py-5">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold ${p.quantity < 10 ? 'text-amber-600' : 'text-slate-900'}">${p.quantity}</span>
                                        ${p.quantity < 10 ? '<span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>' : ''}
                                    </div>
                                </td>
                                <td class="px-6 py-5 text-slate-500 font-medium">${p.supplier_name || 'N/A'}</td>
                                ${state.user.role === 'admin' ? `
                                <td class="px-8 py-5 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onclick="window.editProduct(${p.id})">
                                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                                        </button>
                                        <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onclick="window.deleteProduct(${p.id})">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </td>
                                ` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${products.length === 0 ? '<div class="p-20 text-center text-slate-400 font-medium">No products found. Add your first product to get started!</div>' : ''}
            </div>
        `;
        lucide.createIcons();

        // Setup Add Product Modal
        if (state.user.role === 'admin') {
            document.getElementById('add-product-btn').onclick = () => renderProductModal(null, categories, suppliers);
        }

        // Export functions to global scope for onclick handlers
        window.editProduct = (id) => {
            const product = products.find(p => p.id === id);
            renderProductModal(product, categories, suppliers);
        };

        window.deleteProduct = async (id) => {
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    await api.delete(`/products/${id}`);
                    renderProducts();
                } catch (err) {
                    alert(err.message);
                }
            }
        };

    } catch (err) {
        container.innerHTML = `<p class="text-red-500 font-semibold">Error loading products: ${err.message}</p>`;
    }
}

async function renderSales() {
    const container = document.getElementById('content-area');
    try {
        const products = await api.get('/products');
        let cart = [];

        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Product List -->
                <div class="space-y-6">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-extrabold text-slate-900">Available Products</h4>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">${products.length} Items</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        ${products.map(p => `
                            <button ${state.user.role === 'admin' ? `onclick="window.addToCart(${p.id})"` : ''} class="text-left bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm ${state.user.role === 'admin' ? 'hover:shadow-md hover:border-blue-200 active:scale-95' : 'cursor-default'} transition-all group">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase italic">${p.category_name || 'General'}</span>
                                    <span class="font-bold text-blue-600">$${p.price.toFixed(2)}</span>
                                </div>
                                <h5 class="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">${p.name}</h5>
                                <p class="text-[11px] text-slate-400 mt-1 font-medium italic">Stock: <span class="${p.quantity < 10 ? 'text-amber-600 font-extrabold' : 'text-slate-500'}">${p.quantity} units</span></p>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Shopping Cart -->
                <div class="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-fit sticky top-32">
                    <div class="flex items-center justify-between mb-8">
                        <h4 class="text-xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h4>
                        <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                        </div>
                    </div>

                    <div id="cart-items" class="space-y-4 mb-8 min-h-[100px]">
                        <p class="text-center text-slate-400 py-10 italic font-medium">Your cart is empty.</p>
                    </div>

                    <div class="pt-8 border-t border-slate-100 space-y-4">
                        <div class="flex justify-between text-slate-500 font-semibold text-sm">
                            <span>Subtotal</span>
                            <span id="cart-subtotal">$0.00</span>
                        </div>
                        <div class="flex justify-between text-slate-900 font-extrabold text-xl tracking-tight">
                            <span>Total</span>
                            <span id="cart-total" class="text-blue-600">$0.00</span>
                        </div>
                        ${state.user.role === 'admin' ? `
                        <button id="checkout-btn" disabled class="w-full py-4 mt-4 bg-slate-100 text-slate-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-not-allowed">
                            Complete Order
                        </button>
                        ` : '<div class="p-4 bg-slate-50 text-slate-400 text-center text-xs font-bold rounded-xl italic">Read-only access for staff</div>'}
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();

        // Cart Logic
        const renderCart = () => {
            const cartItemsContainer = document.getElementById('cart-items');
            const totalEl = document.getElementById('cart-total');
            const subtotalEl = document.getElementById('cart-subtotal');
            const checkoutBtn = document.getElementById('checkout-btn');
            if (state.user.role !== 'admin' || !checkoutBtn) return;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p class="text-center text-slate-400 py-10 italic font-medium">Your cart is empty.</p>';
                totalEl.textContent = '$0.00';
                subtotalEl.textContent = '$0.00';
                checkoutBtn.disabled = true;
                checkoutBtn.className = "w-full py-4 mt-4 bg-slate-100 text-slate-400 font-bold rounded-2xl transition-all cursor-not-allowed";
                return;
            }

            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl animate-in slide-in-from-right-4 duration-200">
                    <div class="flex flex-col">
                        <span class="font-bold text-slate-900 text-sm">${item.name}</span>
                        <span class="text-xs text-slate-400 font-medium">$${item.price.toFixed(2)} × ${item.quantity}</span>
                    </div>
                    <div class="flex items-center gap-3">
                         <span class="font-bold text-slate-900">$${(item.price * item.quantity).toFixed(2)}</span>
                         <button onclick="window.removeFromCart(${item.id})" class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all">
                            <i data-lucide="x" class="w-4 h-4"></i>
                         </button>
                    </div>
                </div>
            `).join('');

            lucide.createIcons();

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            totalEl.textContent = `$${total.toFixed(2)}`;
            subtotalEl.textContent = `$${total.toFixed(2)}`;
            checkoutBtn.disabled = false;
            checkoutBtn.className = "w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95";
        };

        window.addToCart = (id) => {
            const product = products.find(p => p.id === id);
            if (product.quantity <= 0) return alert('Out of stock!');

            const existing = cart.find(item => item.id === id);
            if (existing) {
                if (existing.quantity >= product.quantity) return alert('Cannot exceed available stock!');
                existing.quantity++;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            renderCart();
        };

        window.removeFromCart = (id) => {
            cart = cart.filter(item => item.id !== id);
            renderCart();
        };

        if (state.user.role === 'admin') {
            document.getElementById('checkout-btn').onclick = async () => {
                try {
                    const saleData = {
                        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
                    };
                    const res = await api.post('/sales', saleData);
                    alert('Order completed successfully!');
                    renderSales();
                } catch (err) {
                    alert(err.message);
                }
            };
        }

    } catch (err) {
        container.innerHTML = `<p class="text-red-500 font-semibold">Error loading sales: ${err.message}</p>`;
    }
}

async function renderCategories() {
    const container = document.getElementById('content-area');
    try {
        const categories = await api.get('/categories');
        container.innerHTML = `
            <div class="flex justify-between items-center mb-8">
                <p class="text-slate-500 font-medium">Browse product categories.</p>
                ${state.user.role === 'admin' ? `
                <button id="add-cat-btn" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                    <i data-lucide="plus" class="w-5 h-5"></i> Add Category
                </button>
                ` : ''}
            </div>
            <div class="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th class="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">ID</th>
                            <th class="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Name</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${categories.map(c => `
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-8 py-5 text-slate-400 font-bold">#${c.id}</td>
                                <td class="px-8 py-5 text-right font-extrabold text-slate-900">${c.name}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        lucide.createIcons();

        if (state.user.role === 'admin') {
            document.getElementById('add-cat-btn').onclick = () => renderCategoryModal();
        }
    } catch (err) {
        container.innerHTML = `<p class="text-red-500 font-semibold">Error loading categories: ${err.message}</p>`;
    }
}

async function renderSalesHistory() {
    const container = document.getElementById('content-area');
    try {
        const sales = await api.get('/sales');
        container.innerHTML = `
            <div class="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th class="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Order ID</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Cashier</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Items</th>
                            <th class="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${sales.map(s => `
                            <tr>
                                <td class="px-8 py-5 font-bold text-slate-900">ORD-${s.id}</td>
                                <td class="px-6 py-5 text-slate-500 font-medium">${s.cashier}</td>
                                <td class="px-6 py-5 font-extrabold text-blue-600">$${s.total_amount.toFixed(2)}</td>
                                <td class="px-6 py-5">
                                    <div class="flex flex-col gap-1">
                                        ${s.items.map(i => `<span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full w-fit">x${i.quantity} ${i.product_name}</span>`).join('')}
                                    </div>
                                </td>
                                <td class="px-8 py-5 text-right text-xs text-slate-400 font-bold">${s.date}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        container.innerHTML = `<p class="text-red-500 font-semibold">Error: ${err.message}</p>`;
    }
}

async function renderPurchases() {
    const container = document.getElementById('content-area');
    try {
        const purchases = await api.get('/purchases');
        container.innerHTML = `
            <div class="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th class="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Purchase ID</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Supplier</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Cost</th>
                            <th class="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${purchases.map(p => `
                            <tr>
                                <td class="px-8 py-5 font-bold text-slate-900 tracking-tighter cursor-help italic">PUR-${p.id}</td>
                                <td class="px-6 py-5 text-emerald-600 font-extrabold">${p.supplier_name}</td>
                                <td class="px-6 py-5 font-bold text-slate-700">$${p.total_cost.toFixed(2)}</td>
                                <td class="px-8 py-5 text-right text-xs text-slate-400 font-bold">${p.date}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        container.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    }
}

async function renderStockAlerts() {
    const container = document.getElementById('content-area');
    try {
        const alerts = await api.get('/stock-alerts');
        container.innerHTML = `
            <div class="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden text-center p-10">
                <i data-lucide="bell" class="w-12 h-12 text-amber-500 mx-auto mb-4"></i>
                <h4 class="text-xl font-bold mb-8">Stock Level Warnings</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${alerts.map(a => `
                        <div class="p-6 bg-amber-50 border border-amber-100 rounded-3xl text-left">
                            <h5 class="font-extrabold text-slate-900 mb-1">${a.product_name}</h5>
                            <p class="text-sm text-amber-700 font-bold mb-4">Current Stock: ${a.quantity}</p>
                            <div class="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                                <div class="bg-amber-600 h-full" style="width: ${(a.quantity / a.threshold) * 100}%"></div>
                            </div>
                        </div>
                    `).join('')}
                    ${alerts.length === 0 ? '<p class="col-span-full text-slate-400 italic font-medium">No stock alerts at this time.</p>' : ''}
                </div>
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        container.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    }
}

async function renderActivityLogs() {
    const container = document.getElementById('content-area');
    try {
        const logs = await api.get('/activity-logs');
        container.innerHTML = `
            <div class="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                <table class="w-full text-left">
                    <tbody class="divide-y divide-slate-50">
                        ${logs.map(l => `
                            <tr>
                                <td class="px-8 py-5 flex items-center gap-4">
                                    <div class="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400">
                                        <i data-lucide="activity" class="w-4 h-4"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-slate-900">${l.action}</p>
                                        <p class="text-xs text-slate-400 font-medium">${l.user_name} • ${new Date(l.timestamp).toLocaleString()}</p>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        container.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    }
}

async function renderSuppliers() {
    const container = document.getElementById('content-area');
    try {
        const suppliers = await api.get('/suppliers');
        container.innerHTML = `
            <div class="flex justify-between items-center mb-8">
                <p class="text-slate-500 font-medium">Manage your network of product suppliers.</p>
                <button id="add-sup-btn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                    <i data-lucide="plus" class="w-5 h-5"></i> Add Supplier
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 ${suppliers.map(s => `
                    <div class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                        <h4 class="text-lg font-extrabold text-slate-900 mb-4">${s.name}</h4>
                        <div class="space-y-3">
                            <div class="flex items-start gap-3 text-slate-500 text-xs font-semibold">
                                <i data-lucide="phone" class="w-4 h-4 text-blue-500"></i> <span>${s.contact}</span>
                            </div>
                            <div class="flex items-start gap-3 text-slate-500 text-xs font-semibold">
                                <i data-lucide="mail" class="w-4 h-4 text-emerald-500"></i> <span>${s.email}</span>
                            </div>
                            <div class="flex items-start gap-3 text-slate-500 text-xs font-semibold">
                                <i data-lucide="map-pin" class="w-4 h-4 text-amber-500"></i> <span>${s.address}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        lucide.createIcons();

        if (state.user.role === 'admin') {
            document.getElementById('add-sup-btn').onclick = () => renderSupplierModal();
        }
    } catch (err) {
        container.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    }
}

async function renderUsers() {
    const container = document.getElementById('content-area');
    try {
        const users = await api.get('/users');
        container.innerHTML = `
             <div class="flex justify-between items-center mb-8">
                <p class="text-slate-500 font-medium">Manage system users and their roles.</p>
                <button id="add-user-btn" class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
                    <i data-lucide="user-plus" class="w-5 h-5"></i> Add User
                </button>
            </div>
             <div class="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th class="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Full Name</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Role</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${users.map(u => `
                            <tr>
                                <td class="px-8 py-5 font-bold text-slate-900">${u.name}</td>
                                <td class="px-6 py-5 text-slate-500 font-medium">${u.email}</td>
                                <td class="px-8 py-5 text-right">
                                    <span class="px-3 py-1 ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'} text-[10px] font-extrabold rounded-full uppercase italic">${u.role}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        lucide.createIcons();

        document.getElementById('add-user-btn').onclick = () => renderUserModal();
    } catch (err) {
        container.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    }
}


init();


// --- Modals ---

function renderProductModal(product, categories, suppliers) {
    const isEdit = !!product;
    const modalRoot = document.getElementById('modal-root');

    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div class="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="text-xl font-extrabold text-slate-900">${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
                    <button id="close-modal" class="text-slate-400 hover:text-slate-600 transition-colors"><i data-lucide="x"></i></button>
                </div>
                <form id="product-form" class="p-8 space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Product Name</label>
                            <input type="text" id="p-name" value="${isEdit ? product.name : ''}" required class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                            <textarea id="p-desc" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium h-20">${isEdit ? product.description : ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Price ($)</label>
                            <input type="number" step="0.01" id="p-price" value="${isEdit ? product.price : ''}" required class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Quantity</label>
                            <input type="number" id="p-qty" value="${isEdit ? product.quantity : ''}" required class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                            <select id="p-cat" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none">
                                <option value="">Select Category</option>
                                ${categories.map(c => `<option value="${c.id}" ${isEdit && product.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Supplier</label>
                            <select id="p-sup" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none">
                                <option value="">Select Supplier</option>
                                ${suppliers.map(s => `<option value="${s.id}" ${isEdit && product.supplier_id === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="flex gap-4 pt-4">
                        <button type="submit" class="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20">${isEdit ? 'Update Product' : 'Create Product'}</button>
                        <button type="button" id="cancel-modal" class="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();

    const closeModal = () => modalRoot.innerHTML = '';
    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('cancel-modal').onclick = closeModal;

    document.getElementById('product-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('p-name').value,
            description: document.getElementById('p-desc').value,
            price: parseFloat(document.getElementById('p-price').value),
            quantity: parseInt(document.getElementById('p-qty').value),
            category_id: parseInt(document.getElementById('p-cat').value) || null,
            supplier_id: parseInt(document.getElementById('p-sup').value) || null
        };

        try {
            if (isEdit) {
                await api.put(`/products/${product.id}`, data);
            } else {
                await api.post('/products', data);
            }
            closeModal();
            renderProducts();
        } catch (err) {
            alert(err.message);
        }
    };
}

function renderCategoryModal() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div class="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="text-xl font-extrabold text-slate-900">Add Category</h3>
                    <button id="close-modal" class="text-slate-400 hover:text-slate-600 transition-colors"><i data-lucide="x"></i></button>
                </div>
                <form id="cat-form" class="p-8 space-y-6">
                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Category Name</label>
                        <input type="text" id="cat-name" required placeholder="e.g. Electronics" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium">
                    </div>
                    <div class="flex gap-4 pt-4">
                        <button type="submit" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20">Save Category</button>
                        <button type="button" id="cancel-modal" class="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    const closeModal = () => modalRoot.innerHTML = '';
    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('cancel-modal').onclick = closeModal;

    document.getElementById('cat-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const name = document.getElementById('cat-name').value;
            await api.post('/categories', { name });
            closeModal();
            renderCategories();
        } catch (err) {
            alert(err.message);
        }
    };
}

function renderSupplierModal() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div class="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="text-xl font-extrabold text-slate-900">Add Supplier</h3>
                    <button id="close-modal" class="text-slate-400 hover:text-slate-600 transition-colors"><i data-lucide="x"></i></button>
                </div>
                <form id="sup-form" class="p-8 space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Supplier Name</label>
                            <input type="text" id="sup-name" required class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Contact Number</label>
                            <input type="text" id="sup-contact" required class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address</label>
                            <input type="email" id="sup-email" required class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Office Address</label>
                            <textarea id="sup-addr" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium h-20"></textarea>
                        </div>
                    </div>
                    <div class="flex gap-4 pt-4">
                        <button type="submit" class="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20">Save Supplier</button>
                        <button type="button" id="cancel-modal" class="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    const closeModal = () => modalRoot.innerHTML = '';
    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('cancel-modal').onclick = closeModal;

    document.getElementById('sup-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                name: document.getElementById('sup-name').value,
                contact: document.getElementById('sup-contact').value,
                email: document.getElementById('sup-email').value,
                address: document.getElementById('sup-addr').value
            };
            await api.post('/suppliers', data);
            closeModal();
            renderSuppliers();
        } catch (err) {
            alert(err.message);
        }
    };
}

function renderUserModal() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div class="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="text-xl font-extrabold text-slate-900">Add New User</h3>
                    <button id="close-modal" class="text-slate-400 hover:text-slate-600 transition-colors"><i data-lucide="x"></i></button>
                </div>
                <form id="user-form" class="p-8 space-y-6">
                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Full Name</label>
                        <input type="text" id="u-name" required class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address</label>
                        <input type="email" id="u-email" required class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Password</label>
                        <input type="password" id="u-pass" required class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Role</label>
                        <select id="u-role" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium appearance-none">
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="flex gap-4 pt-4">
                        <button type="submit" class="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20">Create User</button>
                        <button type="button" id="cancel-modal" class="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    const closeModal = () => modalRoot.innerHTML = '';
    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('cancel-modal').onclick = closeModal;

    document.getElementById('user-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                name: document.getElementById('u-name').value,
                email: document.getElementById('u-email').value,
                password: document.getElementById('u-pass').value,
                role: document.getElementById('u-role').value
            };
            await api.post('/users', data);
            closeModal();
            renderUsers();
        } catch (err) {
            alert(err.message);
        }
    };
}
