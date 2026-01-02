// Utility function for formatting currency
const formatCurrency = (value) => value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Global variable for bread modal chart
let breadModalChartInstance = null;

// Utility function for generic number formatting (Turkish style)
const formatNumber = (value, fractionDigits = 0) =>
    value.toLocaleString('tr-TR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });

// Function to create the HTML for the salary card
function createSalaryCardHTML(data) {
    return `
        <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
            <div>
                <p class="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Güncel Net Aylık Ücret</p>
                <div class="flex items-baseline gap-2">
                    <h2 class="text-4xl md:text-6xl font-black tracking-tight">₺${formatCurrency(data.net)}</h2>
                </div>
                <p class="text-blue-100 mt-2 text-sm leading-snug">Brüt: ₺${formatCurrency(data.gross)} <span class="hidden sm:inline">•</span> <br class="sm:hidden"> İşverene Maliyeti: ₺${formatCurrency(data.costToEmployer)}</p>
                <div class="mt-6 pt-5 border-t border-white/20 flex flex-col sm:flex-row gap-8">
                    <div>
                        <p class="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1 opacity-90">Açlık Sınırı (${data.limitDate || 'Güncel'})</p>
                        <p class="text-2xl font-bold text-red-300">₺${formatCurrency(data.hungerLimit)}</p>
                    </div>
                    <div>
                        <p class="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1 opacity-90">Yoksulluk Sınırı (${data.limitDate || 'Güncel'})</p>
                        <p class="text-2xl font-bold text-white">₺${formatNumber(data.povertyLimit, 2)}</p>
                    </div>
                </div>
                <button onclick="openLimitsModal()" class="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-200 hover:text-white transition-colors animate-pulse">
                    <span class="material-symbols-outlined text-xs">info</span>
                    <span>Geçmiş Veriler ve Detaylar için tıklayınız</span>
                </button>
            </div>
            <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 flex-1 min-w-[140px]">
                    <div class="flex items-center gap-2 mb-2 text-blue-50">
                        <span class="material-symbols-outlined">trending_up</span>
                        <span class="text-sm font-medium">Ücret Artışı</span>
                    </div>
                    <p class="text-2xl font-bold">+%${formatNumber(data.yearlyChange, 2)}</p>
                    <p class="text-xs text-blue-200">Önceki ücrete kıyasla</p>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 flex-1 min-w-[140px]">
                    <div class="flex items-center gap-2 mb-2 text-blue-50">
                        <span class="material-symbols-outlined">analytics</span>
                        <span class="text-sm font-medium">Enflasyon Oranı</span>
                    </div>
                    <p class="text-2xl font-bold text-red-300">%${formatNumber(data.inflationRate, 2)}</p>
                    <p class="text-xs text-blue-200">2025 yıllık</p>
                </div>
            </div>
        </div>
    `;
}

// Function to create the HTML for a single product card
function createProductCardHTML(product, netSalary) {
    const quantity = netSalary / product.unitPrice;

    let displayValue;
    if (product.name === "ABD Doları") {
        // Special display for USD: $ sign with Turkish numeric separators
        displayValue = `$${formatNumber(quantity, 2)}`;
    } else if (product.unitName === 'Gr.') {
        displayValue = `${formatNumber(quantity, 2)} Gr.`;
    } else {
        displayValue = `${formatNumber(Math.floor(quantity), 0)} ${product.unitName}`;
    }

    return `
        <div class="${product.name === 'Ekmek' ? 'cursor-pointer hover:border-primary border-2' : ''} group bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
             ${product.name === 'Ekmek' ? 'onclick="openBreadModal()"' : ''}>
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 rounded-full bg-${product.color}-100 dark:bg-${product.color}-900/30 text-${product.color}-600 dark:text-${product.color}-400">
                    <span class="material-symbols-outlined text-2xl">${product.icon}</span>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark bg-background-light dark:bg-background-dark px-2 py-1 rounded mb-1">
                        Fiyat: ₺${product.name === 'Ekmek' ? product.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 10 }) : formatCurrency(product.unitPrice)}${product.unitName === 'gr' ? '/gr' : ''}
                    </span>
                    ${product.name === 'Ekmek' ? '<span class="text-[10px] text-primary font-bold uppercase animate-pulse">Detaylar için tıkla</span>' : ''}
                </div>
            </div>
            <div>
                <h3 class="text-3xl font-bold text-text-main-light dark:text-text-main-dark mb-1">${displayValue}</h3>
                <p class="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">${product.name}</p>
                <p class="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">${product.description}</p>
            </div>
        </div>
    `;
}


// Function to open bread history modal
function openBreadModal() {
    const modal = document.getElementById('bread-modal');
    const tableBody = document.getElementById('bread-table-body');

    const tableRows = historicalData.bread.map(b => {
        const minWage = b.minimum_wage;
        const breadPrice = b.price;
        const quantity = minWage / breadPrice;

        return `
            <tr class="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors border-b border-border-light dark:border-border-dark">
                <td class="py-4 px-2 sm:px-4 text-[11px] sm:text-sm font-medium text-left">${b.date}</td>
                <td class="py-4 px-2 sm:px-4 text-[11px] sm:text-sm font-semibold text-right">₺${minWage.toLocaleString('tr-TR', { minimumFractionDigits: minWage < 1000000 ? 2 : 0, maximumFractionDigits: 2 })}</td>
                <td class="hidden sm:table-cell py-4 px-4 text-sm text-right">₺${breadPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 10 })}</td>
                <td class="py-4 px-2 sm:px-4">
                    <div class="flex items-center justify-end gap-1 sm:gap-2">
                        <span class="text-[11px] sm:text-sm font-bold text-primary">${Math.floor(quantity)} Adet</span>
                        <div class="hidden sm:block h-1.5 bg-border-light dark:bg-border-dark rounded-full w-24 overflow-hidden">
                            <div class="h-full bg-primary" style="width: ${Math.min((quantity / 2000) * 100, 100)}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).reverse().join(''); // Show newest first

    tableBody.innerHTML = tableRows;

    // Reset view to table
    const tableContainer = document.getElementById('bread-table-container');
    const chartContainer = document.getElementById('bread-chart-container');
    const toggleBtn = document.getElementById('toggle-bread-view');

    if (tableContainer) tableContainer.classList.remove('hidden');
    if (chartContainer) chartContainer.classList.add('hidden');
    if (toggleBtn) {
        toggleBtn.querySelector('span:last-child').textContent = 'Grafiği Göster';
        toggleBtn.querySelector('.material-symbols-outlined').textContent = 'show_chart';
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

// Function to toggle between table and chart in bread modal
function toggleBreadView() {
    const tableContainer = document.getElementById('bread-table-container');
    const chartContainer = document.getElementById('bread-chart-container');
    const toggleBtn = document.getElementById('toggle-bread-view');
    const isChartVisible = !chartContainer.classList.contains('hidden');

    if (isChartVisible) {
        // Switch to Table
        chartContainer.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        toggleBtn.querySelector('span:last-child').textContent = 'Grafiği Göster';
        toggleBtn.querySelector('.material-symbols-outlined').textContent = 'show_chart';
    } else {
        // Switch to Chart
        tableContainer.classList.add('hidden');
        chartContainer.classList.remove('hidden');
        toggleBtn.querySelector('span:last-child').textContent = 'Tabloyu Göster';
        toggleBtn.querySelector('.material-symbols-outlined').textContent = 'table_rows';
        renderBreadModalChart();
    }
}

// Function to render chart in bread modal
function renderBreadModalChart() {
    const ctx = document.getElementById('breadModalChart').getContext('2d');

    if (breadModalChartInstance) {
        breadModalChartInstance.destroy();
    }

    const data = historicalData.bread.map(b => ({
        date: b.date,
        quantity: b.minimum_wage / b.price
    }));

    breadModalChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Ekmek Adedi',
                data: data.map(d => d.quantity),
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#2b6cee',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: (context) => `${Math.floor(context.parsed.y)} Adet Ekmek`
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)', maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

// Global variable for limits modal chart
let limitsModalChartInstance = null;

// Function to close modal
function closeModal() {
    const modals = [document.getElementById('bread-modal'), document.getElementById('limits-modal')];
    modals.forEach(m => m && m.classList.add('hidden'));
    document.body.style.overflow = '';
}

// Function to open limits history modal
function openLimitsModal() {
    const modal = document.getElementById('limits-modal');
    const tableBody = document.getElementById('limits-table-body');

    // Month mapping for sorting
    const monthMap = {
        'Ocak': 1, 'Şubat': 2, 'Mart': 3, 'Nisan': 4, 'Mayıs': 5, 'Haziran': 6,
        'Temmuz': 7, 'Ağustos': 8, 'Eylül': 9, 'Ekim': 10, 'Kasım': 11, 'Aralık': 12
    };

    const sortedLimits = [...historicalData.limits].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return monthMap[b.month] - monthMap[a.month];
    });

    const tableRows = sortedLimits.map(item => `
        <tr class="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors border-b border-border-light dark:border-border-dark">
            <td class="py-4 px-2 sm:px-4 text-[11px] sm:text-sm font-medium text-left">${item.month} ${item.year}</td>
            <td class="py-4 px-2 sm:px-4 text-[11px] sm:text-sm font-semibold text-right">₺${formatCurrency(item.minWage)}</td>
            <td class="py-4 px-2 sm:px-4 text-[11px] sm:text-sm text-red-500 font-medium text-right">₺${formatCurrency(item.hungerLimit)}</td>
            <td class="py-4 px-2 sm:px-4 text-[11px] sm:text-sm text-orange-500 font-medium text-right">₺${formatCurrency(item.povertyLimit)}</td>
        </tr>
    `).join('');

    tableBody.innerHTML = tableRows;

    // Reset view to table
    const tableContainer = document.getElementById('limits-table-container');
    const chartContainer = document.getElementById('limits-chart-container');
    const toggleBtn = document.getElementById('toggle-limits-view');

    if (tableContainer) tableContainer.classList.remove('hidden');
    if (chartContainer) chartContainer.classList.add('hidden');
    if (toggleBtn) {
        toggleBtn.querySelector('span:last-child').textContent = 'Grafiği Göster';
        toggleBtn.querySelector('.material-symbols-outlined').textContent = 'show_chart';
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

// Function to toggle between table and chart in limits modal
function toggleLimitsView() {
    const tableContainer = document.getElementById('limits-table-container');
    const chartContainer = document.getElementById('limits-chart-container');
    const toggleBtn = document.getElementById('toggle-limits-view');
    const isChartVisible = !chartContainer.classList.contains('hidden');

    if (isChartVisible) {
        chartContainer.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        toggleBtn.querySelector('span:last-child').textContent = 'Grafiği Göster';
        toggleBtn.querySelector('.material-symbols-outlined').textContent = 'show_chart';
    } else {
        tableContainer.classList.add('hidden');
        chartContainer.classList.remove('hidden');
        toggleBtn.querySelector('span:last-child').textContent = 'Tabloyu Göster';
        toggleBtn.querySelector('.material-symbols-outlined').textContent = 'table_rows';
        renderLimitsModalChart();
    }
}

// Function to render chart in limits modal
function renderLimitsModalChart() {
    const ctx = document.getElementById('limitsModalChart').getContext('2d');

    if (limitsModalChartInstance) {
        limitsModalChartInstance.destroy();
    }

    // Data for limits chart (Newest last for line chart progression)
    const sortedData = [...historicalData.limits].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthMap = {
            'Ocak': 1, 'Şubat': 2, 'Mart': 3, 'Nisan': 4, 'Mayıs': 5, 'Haziran': 6,
            'Temmuz': 7, 'Ağustos': 8, 'Eylül': 9, 'Ekim': 10, 'Kasım': 11, 'Aralık': 12
        };
        return monthMap[a.month] - monthMap[b.month];
    });

    limitsModalChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(d => `${d.month} ${d.year}`),
            datasets: [
                {
                    label: 'Asgari Ücret',
                    data: sortedData.map(d => d.minWage),
                    borderColor: '#3b82f6',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointRadius: 2,
                    tension: 0.3
                },
                {
                    label: 'Açlık Sınırı',
                    data: sortedData.map(d => d.hungerLimit),
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 2,
                    tension: 0.3
                },
                {
                    label: 'Yoksulluk Sınırı',
                    data: sortedData.map(d => d.povertyLimit),
                    borderColor: '#f97316',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 2,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#4c669a' }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ₺${formatCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(128, 128, 128, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

// Main function to render the application
function renderApp() {
    // Get DOM elements
    const lastUpdatedEl = document.getElementById('last-updated');
    const salaryCardEl = document.getElementById('min-wage-card');
    const productGridEl = document.getElementById('product-grid');
    // Close buttons
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.onclick = closeModal;
    }

    const closeLimitsModalBtn = document.getElementById('close-limits-modal');
    if (closeLimitsModalBtn) {
        closeLimitsModalBtn.onclick = closeModal;
    }

    const toggleBreadViewBtn = document.getElementById('toggle-bread-view');
    if (toggleBreadViewBtn) {
        toggleBreadViewBtn.onclick = toggleBreadView;
    }

    const toggleLimitsViewBtn = document.getElementById('toggle-limits-view');
    if (toggleLimitsViewBtn) {
        toggleLimitsViewBtn.onclick = toggleLimitsView;
    }

    // Close on backdrop click
    const breadModal = document.getElementById('bread-modal');
    if (breadModal) {
        breadModal.onclick = (e) => {
            if (e.target === breadModal.firstElementChild) closeModal();
        };
    }

    const limitsModal = document.getElementById('limits-modal');
    if (limitsModal) {
        limitsModal.onclick = (e) => {
            if (e.target === limitsModal.firstElementChild) closeModal();
        };
    }



    // Get latest limits data
    const monthMap = {
        'Ocak': 1, 'Şubat': 2, 'Mart': 3, 'Nisan': 4, 'Mayıs': 5, 'Haziran': 6,
        'Temmuz': 7, 'Ağustos': 8, 'Eylül': 9, 'Ekim': 10, 'Kasım': 11, 'Aralık': 12
    };

    const sortedLimits = [...historicalData.limits].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return monthMap[b.month] - monthMap[a.month];
    });

    const latestLimit = sortedLimits[0];

    // Update salaryData with latest limits
    if (latestLimit) {
        salaryData.hungerLimit = latestLimit.hungerLimit;
        salaryData.povertyLimit = latestLimit.povertyLimit;
        salaryData.limitDate = `${latestLimit.month} ${latestLimit.year}`;
    }

    // Render salary card
    if (salaryCardEl) {
        salaryCardEl.innerHTML = createSalaryCardHTML(salaryData);
    }

    // Render product grid
    if (productGridEl) {
        productGridEl.innerHTML = products.map(product => createProductCardHTML(product, salaryData.net)).join('');
    }

}

// Routing Logic
function handleRoute() {
    const hash = window.location.hash || '#/';
    const landingView = document.getElementById('landing-view');
    const minWageView = document.getElementById('min-wage-view');

    // Default: hide all views
    if (landingView) landingView.classList.add('hidden');
    if (minWageView) minWageView.classList.add('hidden');

    if (hash === '#/min-wage') {
        if (minWageView) minWageView.classList.remove('hidden');
        window.scrollTo(0, 0);
    } else {
        // Default to landing page
        if (landingView) landingView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
}

// Run the app after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    handleRoute(); // Initial route check
    window.addEventListener('hashchange', handleRoute);
});
