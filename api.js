// ProfitLens - API Module
const LensAPI = {
    storage: {
        get(key, def = null) { try { return JSON.parse(localStorage.getItem(`lens_${key}`)) || def; } catch { return def; } },
        set(key, val) { localStorage.setItem(`lens_${key}`, JSON.stringify(val)); }
    },

    products: {
        getAll() { return LensAPI.storage.get('products', []); },
        save(products) { LensAPI.storage.set('products', products); },
        add(product) {
            const products = this.getAll();
            product.id = Date.now().toString(36);
            product.createdAt = new Date().toISOString();
            product.profit = product.price - product.cost - (product.shipping || 0) - (product.fees || 0);
            product.margin = product.price > 0 ? (product.profit / product.price * 100) : 0;
            products.unshift(product);
            this.save(products);
            return product;
        },
        update(id, updates) {
            const products = this.getAll();
            const idx = products.findIndex(p => p.id === id);
            if (idx !== -1) {
                Object.assign(products[idx], updates);
                products[idx].profit = products[idx].price - products[idx].cost - (products[idx].shipping || 0) - (products[idx].fees || 0);
                products[idx].margin = products[idx].price > 0 ? (products[idx].profit / products[idx].price * 100) : 0;
                this.save(products);
                return products[idx];
            }
            return null;
        },
        delete(id) { let products = this.getAll(); products = products.filter(p => p.id !== id); this.save(products); }
    },

    scenarios: {
        getAll() { return LensAPI.storage.get('scenarios', []); },
        save(scenarios) { LensAPI.storage.set('scenarios', scenarios); },
        add(scenario) {
            const scenarios = this.getAll();
            scenario.id = Date.now().toString(36);
            scenario.createdAt = new Date().toISOString();
            scenarios.unshift(scenario);
            this.save(scenarios);
            return scenario;
        },
        delete(id) { let scenarios = this.getAll(); scenarios = scenarios.filter(s => s.id !== id); this.save(scenarios); },

        calculate(baseProduct, adjustments) {
            const price = baseProduct.price * (1 + (adjustments.priceChange || 0) / 100);
            const cost = baseProduct.cost * (1 + (adjustments.costChange || 0) / 100);
            const volume = (baseProduct.volume || 1) * (1 + (adjustments.volumeChange || 0) / 100);
            const profit = price - cost - (baseProduct.shipping || 0) - (baseProduct.fees || 0);
            return { price, cost, profit, margin: price > 0 ? (profit / price * 100) : 0, revenue: price * volume, totalProfit: profit * volume };
        }
    },

    getAnalytics() {
        const products = this.products.getAll();
        const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.volume || 1)), 0);
        const totalCost = products.reduce((sum, p) => sum + (p.cost * (p.volume || 1)), 0);
        const totalProfit = products.reduce((sum, p) => sum + (p.profit * (p.volume || 1)), 0);
        const avgMargin = products.length ? products.reduce((sum, p) => sum + p.margin, 0) / products.length : 0;
        const lowMargin = products.filter(p => p.margin < 20);
        return { total: products.length, revenue: totalRevenue, cost: totalCost, profit: totalProfit, avgMargin, lowMarginCount: lowMargin.length };
    },

    format: {
        currency(n) { return '$' + Number(n).toFixed(2); },
        percent(n) { return n.toFixed(1) + '%'; }
    },

    toast: { show(msg, type = 'success') { const c = document.getElementById('toast-container') || this.create(); const t = document.createElement('div'); t.className = `toast toast-${type}`; t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i> ${msg}`; c.appendChild(t); setTimeout(() => t.classList.add('show'), 10); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000); }, create() { const c = document.createElement('div'); c.id = 'toast-container'; c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;'; document.body.appendChild(c); const s = document.createElement('style'); s.textContent = '.toast{display:flex;align-items:center;gap:10px;padding:12px 20px;background:#1e1e3f;border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;margin-bottom:10px;transform:translateX(120%);transition:0.3s;}.toast.show{transform:translateX(0);}.toast-success{border-left:3px solid #10b981;}'; document.head.appendChild(s); return c; } }
};
window.LensAPI = LensAPI;
