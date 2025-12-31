const fs = require('fs');
const path = require('path');

const EXTRACTED_PATH = path.join(__dirname, 'extracted_excel', 'xl');

function getSharedStrings() {
    const filePath = path.join(EXTRACTED_PATH, 'sharedStrings.xml');
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf8');
    const strings = [];

    // Split by <si> tags
    const siRegex = /<si>(.*?)<\/si>/g;
    let siMatch;
    while ((siMatch = siRegex.exec(content)) !== null) {
        const siContent = siMatch[1];
        // Join all <t> tags within this <si>
        const tRegex = /<t(?:[^>]*)>(.*?)<\/t>/g;
        let tMatch;
        let fullString = "";
        while ((tMatch = tRegex.exec(siContent)) !== null) {
            fullString += tMatch[1];
        }
        strings.push(fullString);
    }
    return strings;
}

function excelDateToJSDate(serial) {
    if (typeof serial !== 'number' || serial < 10000) return serial;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
}

function parseSheet(sheetNum, sharedStrings) {
    const filePath = path.join(EXTRACTED_PATH, 'worksheets', `sheet${sheetNum}.xml`);
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf8');
    const rows = [];

    const rowRegex = /<row r="(\d+)">(.*?)<\/row>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(content)) !== null) {
        const rowNum = parseInt(rowMatch[1]);
        const rowData = rowMatch[2];
        const cells = {};

        const cellRegex = /<c r="([A-Z]+)\d+"(?:[^>]*)?(?: t="s")?>(?:<f>.*?<\/f>)?<v>(.*?)<\/v><\/c>/g;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowData)) !== null) {
            const col = cellMatch[1];
            const val = cellMatch[2];
            const isShared = cellMatch[0].includes('t="s"');

            if (isShared) {
                cells[col] = sharedStrings[parseInt(val)];
            } else {
                const numericVal = parseFloat(val);
                if (col === 'A' && numericVal > 30000) {
                    cells[col] = excelDateToJSDate(numericVal);
                } else {
                    cells[col] = numericVal;
                }
            }
        }

        if (Object.keys(cells).length > 0) {
            rows.push({ row: rowNum, cells });
        }
    }
    return rows;
}

const sharedStrings = getSharedStrings();
console.log(`Loaded ${sharedStrings.length} shared strings.`);

const skipHeaders = ["YIL", "AY", "Tarih", "Yürürlük Tarihi", "Net Asgari Ücret", "Açlık Sınırı", "Yoksulluk Sınırı", "TARİH", "FİYAT", "GRAMAJ"];

function isHeader(row, headerFields) {
    return headerFields.some(field => {
        const val = row.cells[field];
        if (typeof val !== 'string') return false;
        // Clean up common Excel header noise
        const cleanVal = val.trim().toUpperCase();
        return skipHeaders.some(h => cleanVal.includes(h.toUpperCase()));
    });
}

// Sheet 7: Inflation
const inflationRows = parseSheet(7, sharedStrings);
const inflationData = inflationRows.filter(r => !isHeader(r, ['A', 'B'])).map(r => ({
    year: r.cells.A,
    month: r.cells.B,
    monthly: r.cells.C,
    annual: r.cells.D
}));

function formatPeriod(period) {
    if (typeof period !== 'string') return period;

    // Pattern: 01.01.2009 - 30.06.2009
    const rangeRegex = /(\d{2})\.(\d{2})\.(\d{4}) - (\d{2})\.(\d{2})\.(\d{4})/;
    const match = period.match(rangeRegex);

    if (match) {
        const startDay = match[1];
        const startMonth = match[2];
        const year = match[3];
        const endDay = match[4];
        const endMonth = match[5];

        if (startMonth === '01' && endMonth === '06') {
            return `${year} Ocak-Haziran`;
        } else if (startMonth === '07' && endMonth === '12') {
            return `${year} Temmuz-Aralık`;
        } else if (startMonth === '01' && endMonth === '12') {
            return `${year} Yıllık`;
        }
    }
    return period;
}

// Sheet 8: Minimum Wage
const asgariRows = parseSheet(8, sharedStrings);
const asgariData = asgariRows.filter(r => !isHeader(r, ['A', 'B'])).map(r => {
    let net = r.cells.B;
    // Before 2005, numbers are in millions.
    // Let's normalize everything to YTL (Current TL)
    // If the net is > 100000 and period contains a year < 2005, divide by 1M
    const rawPeriod = String(r.cells.A);
    if (net > 100000 && !rawPeriod.includes("2024") && !rawPeriod.includes("2025")) {
        net = net / 1000000;
    }
    return {
        period: formatPeriod(r.cells.A),
        net: net
    };
});

// Sheet 9: Hunger & Poverty
const limitRows = parseSheet(9, sharedStrings);
const limitData = limitRows.filter(r => !isHeader(r, ['A', 'B'])).map(r => ({
    year: r.cells.A,
    month: r.cells.B,
    hungerLimit: r.cells.C,
    povertyLimit: r.cells.D,
    minWage: r.cells.E
}));

// Sheet 17: Bread Prices
const breadRows = parseSheet(17, sharedStrings);
const breadData = breadRows.filter(r => !isHeader(r, ['A', 'B', 'C'])).map(r => ({
    date: r.cells.A,
    price: r.cells.B,
    gram: r.cells.C,
    note: r.cells.D
}));

const result = {
    inflation: inflationData,
    minimumWage: asgariData,
    limits: limitData,
    bread: breadData
};

fs.writeFileSync(path.join(__dirname, 'economic_data.json'), JSON.stringify(result, null, 2));
console.log('Saved data to economic_data.json');
