
const HousingDataManager = {
    data: null,
    cities: [],

    // URLs for the CSV files
    sources: {
        firstHand: 'data/konut_satis_verileri/ilk_el_satislar.csv',
        secondHand: 'data/konut_satis_verileri/ikinci_el_satislar.csv',
        mortgage: 'data/konut_satis_verileri/ipotekli_satislar.csv'
    },

    async loadData() {
        if (this.data) return this.data;

        try {
            const [firstHandRaw, secondHandRaw, mortgageRaw] = await Promise.all([
                fetch(this.sources.firstHand).then(r => r.text()),
                fetch(this.sources.secondHand).then(r => r.text()),
                fetch(this.sources.mortgage).then(r => r.text())
            ]);

            const firstHand = this.parseCSV(firstHandRaw);
            const secondHand = this.parseCSV(secondHandRaw);
            const mortgage = this.parseCSV(mortgageRaw);

            this.data = this.mergeDatasets(firstHand, secondHand, mortgage);
            this.extractCities(firstHand); // Cities are the same in all files

            console.log("Housing Data Loaded:", this.data);
            return this.data;
        } catch (error) {
            console.error("Error loading housing data:", error);
            return null;
        }
    },

    // Helper to clean numeric strings with dots (e.g. "444.096" -> 444096)
    cleanNumber(str) {
        if (!str) return 0;
        // Trim whitespace, remove potential thousands separator dots
        const cleanStr = str.toString().trim().replace(/\./g, '');
        const val = parseInt(cleanStr, 10);
        return isNaN(val) ? 0 : val;
    },

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        // Parse Header
        // Assuming format: Tarih, TOPLAM, Adana, Adıyaman...
        const headers = lines[0].trim().split(',').map(h => h.trim());

        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].trim().split(',');
            // Skip empty rows
            if (row.length < headers.length) continue;

            const rowData = {};
            const year = row[0].trim(); // First column is Date/Year

            // Iterate over columns starting from index 1 (Cities + TOPLAM)
            for (let j = 1; j < headers.length; j++) {
                const city = headers[j];
                const value = this.cleanNumber(row[j]);

                if (!rowData[city]) rowData[city] = {};

                // Store simply as key-value for now, will merge later
                // Structure: [ { year: "2025", "TOPLAM": 444096, "Adana": 8911... }, ... ]
                // Actually, let's pivot this immediately to be more useful
                // We want to link data by City and Year.
            }

            // Let's return just the raw row object: { year: "2025", "TOPLAM": 444096, "Adana": 8911 ... }
            const rowObj = { year: year };
            headers.forEach((h, index) => {
                if (index === 0) return; // Skip Date col
                rowObj[h] = this.cleanNumber(row[index]);
            });
            result.push(rowObj);
        }
        return result;
    },

    mergeDatasets(firstHand, secondHand, mortgage) {
        // We want a structure:
        // {
        //    "TOPLAM": [ { year: 2025, firstHand: X, secondHand: Y, mortgage: Z, total: X+Y }, ... ],
        //    "Adana": [ ... ]
        // }

        const merged = {};

        // Get all cities from the first dataset keys (excluding 'year')
        if (firstHand.length === 0) return {};
        const cities = Object.keys(firstHand[0]).filter(k => k !== 'year');

        cities.forEach(city => {
            merged[city] = [];

            // Iterate through years found in firstHand (assuming consistent years across files)
            firstHand.forEach(fItem => {
                const year = fItem.year;

                // Find corresponding rows in other datasets
                const sItem = secondHand.find(i => i.year === year);
                const mItem = mortgage.find(i => i.year === year);

                const firstVal = fItem[city] || 0;
                const secondVal = sItem ? (sItem[city] || 0) : 0;
                const mortgageVal = mItem ? (mItem[city] || 0) : 0;

                // Calculate derived values
                // Note: user said "Total Sales = First + Second".
                // "TOPLAM" column in CSVs is likely the sum of cities, but let's strictly follow the formula 
                // "Total Sales for a city = First Hand + Second Hand".
                const totalSales = firstVal + secondVal;

                // Mortgage ratio
                const mortgageRatio = totalSales > 0 ? (mortgageVal / totalSales) * 100 : 0;

                merged[city].push({
                    year: year,
                    firstHand: firstVal,
                    secondHand: secondVal,
                    mortgage: mortgageVal,
                    totalSales: totalSales,
                    mortgageRatio: mortgageRatio
                });
            });

            // Sort by Year Descending
            merged[city].sort((a, b) => b.year - a.year);
        });

        return merged;
    },

    extractCities(parsedData) {
        if (parsedData.length === 0) return;
        // Keys of the first row object, excluding 'year'
        this.cities = Object.keys(parsedData[0]).filter(k => k !== 'year').sort((a, b) => a.localeCompare(b, 'tr-TR'));
        // Move "TOPLAM" to the beginning if exists
        const totalIndex = this.cities.indexOf('TOPLAM');
        if (totalIndex > -1) {
            this.cities.splice(totalIndex, 1);
            this.cities.unshift('TOPLAM');
        }
    },

    getCityList() {
        return this.cities;
    },

    getCityData(cityName) {
        return this.data ? this.data[cityName] : [];
    }
};
