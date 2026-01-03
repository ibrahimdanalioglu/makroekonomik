// Utility function for formatting currency
const formatCurrency = (value) => value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Global variable for bread modal chart
let breadModalChartInstance = null;
// Global variable for inflation view chart
let inflationChartInstance = null;
// Global variable for limits view chart
let limitsChartInstance = null;
// Global variable for exchange view chart
let exchangeChartInstance = null;
// Global variable for housing view chart
let housingChartInstance = null;

// Utility function for generic number formatting (Turkish style)
const formatNumber = (value, fractionDigits = 0) => {
    if (value === null || value === undefined) return null;
    return value.toLocaleString('tr-TR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
};

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

    const tableRows = breadData.map(b => {
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

    const data = breadData.map(b => ({
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

// Function to close modal

function closeModal() {
    const modals = [document.getElementById('bread-modal'), document.getElementById('limits-modal')];
    modals.forEach(m => m && m.classList.add('hidden'));
    document.body.style.overflow = '';
}

// Function to render limits view (Table and Chart)
function renderLimitsView() {
    const tableBody = document.getElementById('limits-table-body');
    if (!tableBody) return;

    // Month mapping for sorting
    const monthMap = {
        'Ocak': 1, 'Şubat': 2, 'Mart': 3, 'Nisan': 4, 'Mayıs': 5, 'Haziran': 6,
        'Temmuz': 7, 'Ağustos': 8, 'Eylül': 9, 'Ekim': 10, 'Kasım': 11, 'Aralık': 12
    };

    const sortedLimits = [...limitsData].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return monthMap[b.month] - monthMap[a.month];
    });

    const tableRows = sortedLimits.map(item => `
        <tr class="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors border-b border-border-light dark:border-border-dark">
            <td class="py-4 px-4 text-sm font-medium text-left align-middle">${item.month} ${item.year}</td>
            <td class="py-4 px-4 text-sm font-semibold text-right align-middle text-text-main-light dark:text-text-main-dark">₺${formatCurrency(item.minWage)}</td>
            <td class="py-4 px-4 text-sm font-medium text-right align-middle text-red-500">₺${formatCurrency(item.hungerLimit)}</td>
            <td class="py-4 px-4 text-sm font-medium text-right align-middle text-orange-500">₺${formatCurrency(item.povertyLimit)}</td>
        </tr>
    `).join('');

    tableBody.innerHTML = tableRows;

    renderLimitsChart();
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
        renderLimitsChart();
    }
}

// Function to render chart in limits section
function renderLimitsChart() {
    const ctxElement = document.getElementById('limitsChart');
    if (!ctxElement) return; // Guard clause if element doesn't exist
    const ctx = ctxElement.getContext('2d');

    if (limitsChartInstance) {
        limitsChartInstance.destroy();
    }

    // Data for limits chart (Newest last for line chart progression)
    const sortedData = [...limitsData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthMap = {
            'Ocak': 1, 'Şubat': 2, 'Mart': 3, 'Nisan': 4, 'Mayıs': 5, 'Haziran': 6,
            'Temmuz': 7, 'Ağustos': 8, 'Eylül': 9, 'Ekim': 10, 'Kasım': 11, 'Aralık': 12
        };
        return monthMap[a.month] - monthMap[b.month];
    });

    limitsChartInstance = new Chart(ctx, {
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

// Function to render inflation view
async function renderInflationView() {
    try {
        // Use global variable from inflation_data.js to avoid CORS issues with file:// protocol
        const data = typeof inflationData !== 'undefined' ? inflationData : [];
        if (data.length === 0) {
            console.error('Inflation data lookup failed. Make sure inflation_data.js is loaded.');
        }

        // Table Data (Show as is - Newest First)
        const tableBody = document.getElementById('inflation-table-body');
        if (tableBody) {
            tableBody.innerHTML = data.map(item => {
                const enagMonthly = formatNumber(item["Enag Aylık Tüfe"], 2);
                const tuikMonthly = formatNumber(item["Tüik Aylık Tüfe"], 2);
                const enagAnnual = formatNumber(item["Enag Yıllık Tüfe"], 2);
                const tuikAnnual = formatNumber(item["Tüik Yıllık Tüfe"], 2);

                return `
                <tr class="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors border-b border-border-light dark:border-border-dark">
                    <td class="py-4 px-4 text-sm font-medium text-left align-middle">${item.Tarih}</td>
                    <td class="py-4 px-4 text-sm text-center align-middle text-text-secondary-light dark:text-text-secondary-dark">${enagMonthly ? enagMonthly + '%' : '-'}</td>
                    <td class="py-4 px-4 text-sm text-center align-middle text-text-secondary-light dark:text-text-secondary-dark">${tuikMonthly ? tuikMonthly + '%' : '-'}</td>
                    <td class="py-4 px-4 text-sm text-center align-middle font-semibold text-text-main-light dark:text-text-main-dark">${enagAnnual ? enagAnnual + '%' : '-'}</td>
                    <td class="py-4 px-4 text-sm text-center align-middle font-semibold text-text-main-light dark:text-text-main-dark">${tuikAnnual ? tuikAnnual + '%' : '-'}</td>
                </tr>
            `}).join('');
        }

        renderInflationChart(data);

    } catch (error) {
        console.error('Error loading inflation data:', error);
    }
}

// Function to render inflation chart
function renderInflationChart(data) {
    const ctx = document.getElementById('inflationChart');
    if (!ctx) return;

    if (inflationChartInstance) {
        inflationChartInstance.destroy();
    }

    // Prepare data for chart (Oldest First for timeline)
    // Filter out entries where both annual rates are null if desired, or keep them to show gaps
    // The source data is Newest First, so reverse it
    const chartData = [...data].reverse().filter(item => item["Tüik Yıllık Tüfe"] !== null || item["Enag Yıllık Tüfe"] !== null);

    inflationChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: chartData.map(d => d.Tarih),
            datasets: [
                {
                    label: 'TÜİK Yıllık',
                    data: chartData.map(d => d["Tüik Yıllık Tüfe"]),
                    borderColor: '#2b6cee', // Primary Blue
                    backgroundColor: 'rgba(43, 108, 238, 0.1)',
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'ENAG Yıllık',
                    data: chartData.map(d => d["Enag Yıllık Tüfe"]),
                    borderColor: '#ef4444', // Red
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#4c669a' }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    padding: 12,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '%' + formatNumber(context.parsed.y, 2);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                    ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 20
                    }
                }
            }
        }
    });
}

// Function to render exchange view
function renderExchangeView(period = '1Y') {
    // Check if data exists
    if (typeof exchangeData === 'undefined' || !exchangeData.usd || !exchangeData.eur) {
        console.error('Exchange data missing');
        return;
    }

    // Filter Data based on period
    const now = new Date();
    let cutoffDate = new Date();

    switch (period) {
        case '1W': cutoffDate.setDate(now.getDate() - 7); break;
        case '1M': cutoffDate.setMonth(now.getMonth() - 1); break;
        case '3M': cutoffDate.setMonth(now.getMonth() - 3); break;
        case '6M': cutoffDate.setMonth(now.getMonth() - 6); break;
        case '1Y': cutoffDate.setFullYear(now.getFullYear() - 1); break;
        case 'ALL': cutoffDate = new Date(0); break; // All time
        default: cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    // Helper to filter array
    const filterByDate = (arr) => arr.filter(item => new Date(item.Tarih) >= cutoffDate);

    const filteredUSD = filterByDate(exchangeData.usd);
    const filteredEUR = filterByDate(exchangeData.eur);

    // Update Buttons State
    document.querySelectorAll('.exchange-filter-btn').forEach(btn => {
        if (btn.dataset.period === period) {
            btn.classList.add('bg-primary', 'text-white', 'border-primary');
            btn.classList.remove('bg-background-light', 'dark:bg-background-dark', 'text-text-secondary-light', 'dark:text-text-secondary-dark');
        } else {
            btn.classList.remove('bg-primary', 'text-white', 'border-primary');
            btn.classList.add('bg-background-light', 'dark:bg-background-dark', 'text-text-secondary-light', 'dark:text-text-secondary-dark');
        }
    });

    // Render Chart
    renderExchangeChart(filteredUSD, filteredEUR);

    // Render Table (Tabs logic handles which data to show, default USD)
    // We need to pass the full filtered sets to the table renderer so strictly speaking we might need to store them globally or pass them effectively.
    // For simplicity, let's store filtered data globally or in a scope accessible by the table renderer, OR re-filter in table renderer.
    // Better approach: Pass the currently selected currency to the renderer.

    // Store filtered data for table usage
    window.filteredExchangeData = { usd: filteredUSD, eur: filteredEUR };

    // Get current selected tab currency
    const currentTab = document.querySelector('.exchange-tab-btn.bg-white')?.dataset.currency ||
        document.querySelector('.exchange-tab-btn.bg-surface-dark')?.dataset.currency ||
        'usd'; // Default

    renderExchangeTable(currentTab);

    // Setup Filters (only once)
    setupExchangeFilters();
    setupExchangeTableTabs();
}

// Function to render exchange chart
function renderExchangeChart(usdData, eurData) {
    const ctx = document.getElementById('exchangeChart');
    if (!ctx) return;

    if (exchangeChartInstance) {
        exchangeChartInstance.destroy();
    }

    // Prepare data (Chronological order for chart)
    const sortedUSD = [...usdData].sort((a, b) => new Date(a.Tarih) - new Date(b.Tarih));
    const sortedEUR = [...eurData].sort((a, b) => new Date(a.Tarih) - new Date(b.Tarih));

    // Get unique labels from both datasets
    const allDates = new Set([...sortedUSD.map(d => d.Tarih), ...sortedEUR.map(d => d.Tarih)]);
    const labels = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

    // Map data to labels (fill missing with null)
    const usdValues = labels.map(date => {
        const item = sortedUSD.find(d => d.Tarih === date);
        return item ? item['Efektif Satış'] : null;
    });

    const eurValues = labels.map(date => {
        const item = sortedEUR.find(d => d.Tarih === date);
        return item ? item['Efektif Satış'] : null;
    });

    exchangeChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'USD Satış',
                    data: usdValues,
                    borderColor: '#22c55e', // Green
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'EUR Satış',
                    data: eurValues,
                    borderColor: '#3b82f6', // Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#4c669a' }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    padding: 12,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '₺' + formatNumber(context.parsed.y, 2);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                    ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 12
                    }
                }
            }
        }
    });
}

// Function to render exchange table based on selected currency
function renderExchangeTable(currency) {
    const tableBody = document.getElementById('exchange-table-body');
    if (!tableBody || !window.filteredExchangeData) return;

    const data = window.filteredExchangeData[currency];
    if (!data) return;

    // Sort by date descending
    const sortedData = [...data].sort((a, b) => new Date(b.Tarih) - new Date(a.Tarih));

    tableBody.innerHTML = sortedData.map(item => {
        const buy = formatNumber(item['Efektif Alış'], 2);
        const sell = formatNumber(item['Efektif Satış'], 2);
        const colorClass = currency === 'usd' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400';

        return `
            <tr class="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors border-b border-border-light dark:border-border-dark">
                <td class="py-3 px-4 text-sm font-medium text-left align-middle text-text-main-light dark:text-text-main-dark">${item.Tarih}</td>
                <td class="py-3 px-4 text-sm text-right align-middle text-text-secondary-light dark:text-text-secondary-dark">₺${buy}</td>
                <td class="py-3 px-4 text-sm text-right align-middle font-bold ${colorClass}">₺${sell}</td>
            </tr>
        `;
    }).join('');
}

// Setup listeners for exchange table tabs
let tableTabsSetup = false;
function setupExchangeTableTabs() {
    if (tableTabsSetup) return;
    const tabsContainer = document.getElementById('exchange-table-tabs');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const currency = e.target.dataset.currency;

                // Update active state
                document.querySelectorAll('.exchange-tab-btn').forEach(btn => {
                    if (btn.dataset.currency === currency) {
                        btn.classList.add('bg-white', 'dark:bg-surface-dark', 'text-primary', 'shadow-sm');
                        btn.classList.remove('text-text-secondary-light', 'dark:text-text-secondary-dark');
                    } else {
                        btn.classList.remove('bg-white', 'dark:bg-surface-dark', 'text-primary', 'shadow-sm');
                        btn.classList.add('text-text-secondary-light', 'dark:text-text-secondary-dark');
                    }
                });

                renderExchangeTable(currency);
            }
        });
        tableTabsSetup = true;
    }
}

// Setup listeners for exchange filters
let filtersSetup = false;
function setupExchangeFilters() {
    if (filtersSetup) return;
    const filterContainer = document.getElementById('exchange-filters');
    if (filterContainer) {
        filterContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const period = e.target.dataset.period;
                renderExchangeView(period);
            }
        });
        filtersSetup = true;
    }
}

// Setup Global Listeners (Scroll to top, etc.)
function initGlobal() {
    // Close buttons
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.onclick = closeModal;
    }

    // Setup Scroll to Top Button
    const scrollTopBtn = document.getElementById('scroll-to-top');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.remove('opacity-0', 'invisible');
                scrollTopBtn.classList.add('opacity-100', 'visible');
            } else {
                scrollTopBtn.classList.add('opacity-0', 'invisible');
                scrollTopBtn.classList.remove('opacity-100', 'visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Function to render Min Wage View Specifics (Cards, Grid)
function initMinWageView() {
    const salaryCardEl = document.getElementById('min-wage-card');
    const productGridEl = document.getElementById('product-grid');

    if (!salaryCardEl && !productGridEl) return;

    // Get latest limits data
    const monthMap = {
        'Ocak': 1, 'Şubat': 2, 'Mart': 3, 'Nisan': 4, 'Mayıs': 5, 'Haziran': 6,
        'Temmuz': 7, 'Ağustos': 8, 'Eylül': 9, 'Ekim': 10, 'Kasım': 11, 'Aralık': 12
    };

    const sortedLimits = [...limitsData].sort((a, b) => {
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

    renderLimitsView();
}

// Routing Logic
const viewCache = {};

async function loadView(viewName) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    if (viewCache[viewName]) {
        mainContent.innerHTML = viewCache[viewName];
        return;
    }

    try {
        const response = await fetch(`views/${viewName}.html`);
        if (!response.ok) throw new Error('View not found');
        const html = await response.text();
        viewCache[viewName] = html;
        mainContent.innerHTML = html;
    } catch (error) {
        console.error('Error loading view:', error);
        mainContent.innerHTML = `<div class="p-8 text-center">
            <h2 class="text-xl font-bold text-red-500 mb-2">Sayfa Yüklenemedi</h2>
            <p class="text-text-secondary-light dark:text-text-secondary-dark">Bu uygulamanın düzgün çalışması için bir sunucu üzerinde çalıştırılması gerekir (Örn: Live Server).</p>
        </div>`;
    }
}

// Routing Logic
async function handleRoute() {
    const hash = window.location.hash || '#/';

    if (hash === '#/min-wage') {
        await loadView('min-wage');
        initMinWageView();
    } else if (hash === '#/inflation') {
        await loadView('inflation');
        renderInflationView();
    } else if (hash === '#/exchange') {
        await loadView('exchange');
        renderExchangeView();
    } else if (hash === '#/housing') {
        await loadView('housing');
        renderHousingView();
    } else {
        await loadView('landing');
    }
    window.scrollTo(0, 0);
}

// Run the app after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initGlobal();
    handleRoute();
    window.addEventListener('hashchange', handleRoute);
});


// Function to render Housing View
async function renderHousingView() {
    const loadingEl = document.getElementById('housing-loading');
    const contentEl = document.getElementById('housing-content');
    const citySelect = document.getElementById('housing-city-select');

    if (!loadingEl || !contentEl) return;

    try {
        // Load data if not already loaded
        const data = await HousingDataManager.loadData();

        if (!data || Object.keys(data).length === 0) {
            console.error("No housing data found");
            loadingEl.innerHTML = '<div class="text-red-500">Veri yüklenemedi.</div>';
            return;
        }

        // Populate City Select if empty
        if (citySelect && citySelect.options.length <= 1) {
            const cities = HousingDataManager.getCityList();
            cities.forEach(city => {
                // Skip TOPLAM as it represents "Total" (Already in HTML as "Türkiye Geneli")
                if (city === 'TOPLAM') return;

                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });

            // Add Listener
            citySelect.addEventListener('change', (e) => {
                updateHousingDashboard(e.target.value);
            });
        }

        // Hide loader, show content
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        contentEl.classList.add('animate-fade-in');

        // Render Initial Dashboard (Default: TOPLAM)
        updateHousingDashboard('TOPLAM');

    } catch (error) {
        console.error("Error in renderHousingView:", error);
    }
}

function updateHousingDashboard(city) {
    const cityData = HousingDataManager.getCityData(city);
    if (!cityData || cityData.length === 0) return;

    // Get latest year data
    const latest = cityData[0]; // Sorted by Year Desc
    if (!latest) return;

    // Update KPI Cards
    const totalEl = document.getElementById('housing-total-sales');
    if (totalEl) totalEl.textContent = formatNumber(latest.totalSales);

    const yearEl = document.getElementById('housing-year-label');
    if (yearEl) {
        yearEl.textContent = `(${latest.year}${latest.year === '2025' || latest.year === 2025 ? '*' : ''})`;
    }

    const firstEl = document.getElementById('housing-first-sales');
    if (firstEl) firstEl.textContent = formatNumber(latest.firstHand);

    const firstRatio = latest.totalSales > 0 ? (latest.firstHand / latest.totalSales) * 100 : 0;
    const firstRatioEl = document.getElementById('housing-first-ratio');
    if (firstRatioEl) firstRatioEl.textContent = formatNumber(firstRatio, 1);

    const secondEl = document.getElementById('housing-second-sales');
    if (secondEl) secondEl.textContent = formatNumber(latest.secondHand);

    const secondRatio = latest.totalSales > 0 ? (latest.secondHand / latest.totalSales) * 100 : 0;
    const secondRatioEl = document.getElementById('housing-second-ratio');
    if (secondRatioEl) secondRatioEl.textContent = formatNumber(secondRatio, 1);

    const mortRatioEl = document.getElementById('housing-mortgage-ratio');
    if (mortRatioEl) mortRatioEl.textContent = '%' + formatNumber(latest.mortgageRatio, 1);

    const mortSalesEl = document.getElementById('housing-mortgage-sales');
    if (mortSalesEl) mortSalesEl.textContent = `(${formatNumber(latest.mortgage)} Adet)`;

    // Update Table
    const tableBody = document.getElementById('housing-table-body');
    if (tableBody) {
        tableBody.innerHTML = cityData.map(item => `
            <tr class="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors border-b border-border-light dark:border-border-dark">
                <td class="py-4 px-6 text-sm font-medium text-left text-text-main-light dark:text-text-main-dark">${item.year}</td>
                <td class="py-4 px-6 text-sm font-bold text-right text-text-main-light dark:text-text-main-dark">${formatNumber(item.totalSales)}</td>
                <td class="py-4 px-6 text-sm text-right text-text-secondary-light dark:text-text-secondary-dark">${formatNumber(item.firstHand)}</td>
                <td class="py-4 px-6 text-sm text-right text-text-secondary-light dark:text-text-secondary-dark">${formatNumber(item.secondHand)}</td>
                <td class="py-4 px-6 text-sm text-right text-text-secondary-light dark:text-text-secondary-dark">${formatNumber(item.mortgage)}</td>
                <td class="py-4 px-6 text-sm text-right font-medium text-purple-600 dark:text-purple-400">%${formatNumber(item.mortgageRatio, 2)}</td>
            </tr>
        `).join('');
    }

    // Update Chart
    renderHousingChart(cityData, city);
}

function renderHousingChart(data, cityName) {
    const ctx = document.getElementById('housingChart');
    if (!ctx) return;

    if (housingChartInstance) {
        housingChartInstance.destroy();
    }

    // Data is Descending (Newest first), reverse for Chart (Oldest first)
    // Filter out null/undefined years if any
    const chartData = [...data].reverse().filter(d => d.year);

    housingChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar', // Using mixed chart type
        data: {
            labels: chartData.map(d => d.year),
            datasets: [
                {
                    label: 'Sıfır Konut',
                    data: chartData.map(d => d.firstHand),
                    backgroundColor: 'rgba(34, 197, 94, 0.7)', // Green
                    borderColor: '#22c55e',
                    borderWidth: 1,
                    stack: 'Stack 0',
                    order: 2
                },
                {
                    label: 'İkinci El',
                    data: chartData.map(d => d.secondHand),
                    backgroundColor: 'rgba(249, 115, 22, 0.7)', // Orange
                    borderColor: '#f97316',
                    borderWidth: 1,
                    stack: 'Stack 0',
                    order: 3
                },
                {
                    label: 'Kredili Satış Oranı (%)',
                    data: chartData.map(d => d.mortgageRatio),
                    type: 'line',
                    borderColor: '#9333ea', // Purple
                    backgroundColor: '#9333ea',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#9333ea',
                    pointRadius: 4,
                    yAxisID: 'y1',
                    order: 1,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#4c669a' }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    padding: 12,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.type === 'line') {
                                label += '%' + formatNumber(context.parsed.y, 2);
                            } else {
                                label += formatNumber(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
                },
                y: {
                    position: 'left',
                    title: { display: true, text: 'Konut Satış Adedi' },
                    grid: { color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                    ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
                },
                y1: {
                    position: 'right',
                    title: { display: true, text: 'Kredili Satış Oranı (%)' },
                    grid: { display: false },
                    min: 0,
                    // max: 100, // Optional: fix to 100% or let it auto-scale
                    ticks: { color: '#a855f7', callback: (value) => '%' + value }
                }
            }
        }
    });
}
