const HouseholdCreditDataManager = {
    data: [],

    async loadData() {
        if (this.data.length > 0) return this.data;

        try {
            const response = await fetch('data/hanehalki_kredi_borcu.csv');
            const text = await response.text();
            this.data = this.parseCSV(text);
            return this.data;
        } catch (error) {
            console.error('Error loading credit debt data:', error);
            return [];
        }
    },

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        return lines.slice(1).map(line => {
            const values = line.split(',');
            const entry = {};

            headers.forEach((header, index) => {
                // Remove dots from numbers and convert to float, except for 'Tarih'
                let value = values[index].trim();
                if (header !== 'Tarih') {
                    // Remove all dots (thousand separators) and confirm it is a number
                    // The format seems to be like "5.325.390.112.000" which is likely just an integer representation with dots
                    const cleanValue = value.replace(/\./g, '');
                    entry[header] = parseFloat(cleanValue);
                } else {
                    entry[header] = value;
                }
            });
            return entry;
        });
    }
};
