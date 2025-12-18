const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Temporary storage for BOM data (in production, use Redis or database)
const tempStorage = new Map();

// Clean up old temp data after 5 minutes
const TEMP_DATA_TTL = 5 * 60 * 1000; // 5 minutes

// Store temporary BOM data
const storeTempData = (data) => {
    const id = `bom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    tempStorage.set(id, {
        data,
        timestamp: Date.now()
    });

    // Schedule cleanup
    setTimeout(() => {
        tempStorage.delete(id);
    }, TEMP_DATA_TTL);

    return id;
};

// Retrieve temporary BOM data
exports.getTempData = (req, res) => {
    const { id } = req.params;
    const stored = tempStorage.get(id);

    if (!stored) {
        return res.status(404).json({ error: 'Temporary data not found or expired' });
    }

    res.json(stored.data);
};

// Helper to format numbers in Indian style
const formatIndianNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '0';
    if (typeof value !== 'number') return '0';

    const fixedValue = value.toFixed(decimals);
    const [integerPart, decimalPart] = fixedValue.split('.');

    let lastThree = integerPart.slice(-3);
    let otherNumbers = integerPart.slice(0, -3);

    if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
    }

    let formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

    return decimalPart ? `${formatted}.${decimalPart}` : formatted;
};

const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(decimals) : '-';
};

// Helper to get full image URL
const getImageUrl = (path, req) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Assuming relative paths are served from backend
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}${path.startsWith('/') ? '' : '/'}${path}`;
};

const generateBOMHtml = (data, req) => {
    const { bomData, printSettings, aluminumRate, sparePercentage, moduleWp, changeLog } = data;
    const { includeQuantity, includeSpare, includeCosting } = printSettings;

    // Determine orientation based on settings
    const orientation = (includeQuantity && includeSpare && includeCosting) ? 'landscape' : 'portrait';

    // Calculate totals for summary
    const totalPanels = Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0);
    const totalCapacity = (totalPanels * moduleWp) / 1000;
    const totalCost = bomData.bomItems.reduce((acc, item) => acc + (item.cost || 0), 0);
    const costPerWp = totalCost / (totalPanels * moduleWp);

    // --- Row Headers (Row 1, 2, 3) ---
    // (We keep the same header logic as it seemed mostly correct in structure, just styling needed)

    // Generate Table Headers
    let headerRow1 = '';
    let headerRow2 = '';
    let headerRow3 = '';

    // --- Row 1 ---
    if (includeQuantity) {
        headerRow1 += `
      <th colspan="5" class="border border-gray-400 px-2 py-1 text-sm font-bold text-center">${bomData.projectInfo.projectName}</th>
      <th colspan="2" class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Building Code</th>
      ${bomData.tabs.map(tab => `<th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">${tab}</th>`).join('')}
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Total</th>
    `;
    }
    if (includeSpare) {
        headerRow1 += `
      <th rowspan="2" class="bg-gray-200 w-4"></th>
      <th rowspan="2" colspan="2" class="border border-gray-400 px-2 py-1 text-sm font-bold text-center">Spare</th>
    `;
    }
    if (includeCosting) {
        headerRow1 += `
      <th class="bg-gray-200 w-4"></th>
      <th colspan="5" class="border border-gray-400 px-2 py-1 text-sm font-bold text-center">Weight Calculation and Cost Calculation</th>
    `;
    }

    // --- Row 2 ---
    if (includeQuantity) {
        headerRow2 += `
      <th colspan="5" class="border border-gray-400 px-2 py-1 text-sm font-bold text-center">BOM for U Cleat Long Rail</th>
      <th colspan="2" class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">No. of Panels</th>
      ${bomData.tabs.map(tab => `<th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">${bomData.panelCounts[tab] || 0}</th>`).join('')}
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">${totalPanels}</th>
    `;
    }
    if (includeCosting) {
        headerRow2 += `
      <th class="bg-gray-200 w-4"></th>
      <th colspan="5" class="border border-gray-400 px-2 py-1 text-sm font-bold text-center">Aluminum Rate per kg: ₹${aluminumRate}</th>
    `;
    }

    // --- Row 3 ---
    if (includeQuantity) {
        headerRow3 += `
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">S.N</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Sunrack<br>Code</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Profile</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Item Description</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Material</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Length<br>(mm)</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">UoM</th>
      ${bomData.tabs.map(() => `<th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Qty.</th>`).join('')}
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Quantity</th>
    `;
    }
    if (includeSpare) {
        headerRow3 += `
      <th class="bg-gray-200 w-4"></th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Spare<br>Quantity</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Total<br>Quantity</th>
    `;
    }
    if (includeCosting) {
        headerRow3 += `
      <th class="bg-gray-200 w-4"></th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Wt/RM<br>(kg/m)</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">RM<br>(m)</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Wt<br>(kg)</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Rate/Piece<br>(₹)</th>
      <th class="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Cost<br>(₹)</th>
    `;
    }

    // Generate Table Body
    const tableRows = bomData.bomItems.map((item, index) => {
        const isEven = index % 2 === 0;
        const bgClass = isEven ? 'bg-white' : 'bg-gray-50';
        let rowHtml = `<tr class="${bgClass}">`;

        if (includeQuantity) {
            let imgTag = '-';
            if (item.profileImage) {
                // Fix: Prepend full URL for Puppeteer to resolve
                const fullImgUrl = getImageUrl(item.profileImage, req);
                imgTag = `<img src="${fullImgUrl}" alt="profile" class="w-8 h-8 object-contain mx-auto" style="max-height: 30px; width: auto;" />`;
            }

            rowHtml += `
        <td class="border border-gray-400 px-2 py-1 text-xs text-center">${item.sn}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center whitespace-nowrap">${item.sunrackCode || '-'}</td>
        <td class="border border-gray-400 px-2 py-1 text-center">${imgTag}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-left">${item.itemDescription || '-'}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center">${item.material || '-'}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center">${item.length || '-'}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center">${item.uom}</td>
        ${bomData.tabs.map(tab => `<td class="border border-gray-400 px-2 py-1 text-xs text-center">${item.quantities[tab] || 0}</td>`).join('')}
        <td class="border border-gray-400 px-2 py-1 text-xs text-center font-bold bg-blue-50">${item.totalQuantity}</td>
      `;
        }

        if (includeSpare) {
            rowHtml += `
        <td class="bg-gray-200"></td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center bg-green-50">${item.spareQuantity}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center font-bold bg-purple-50">${item.finalTotal}</td>
      `;
        }

        if (includeCosting) {
            rowHtml += `
        <td class="bg-gray-200"></td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center bg-yellow-50">${formatNumber(item.wtPerRm, 2)}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center bg-yellow-50">${formatNumber(item.rm, 1)}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center bg-orange-50">${formatNumber(item.wt, 1)}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center">${formatNumber(item.costPerPiece, 2)}</td>
        <td class="border border-gray-400 px-2 py-1 text-xs text-center font-bold bg-green-50 text-right">₹${formatIndianNumber(item.cost, 2)}</td>
      `;
        }

        rowHtml += '</tr>';
        return rowHtml;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BOM Export</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page {
          size: A4 ${orientation};
          margin-top: 1cm;
          margin-bottom: 35mm;
          margin-left: 0.5cm;
          margin-right: 0.5cm;
        }

        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 10px; 
          color: #111;
        }
        
        /* Table Styles - Enforcing Borders */
        table {
           width: 100%;
           border-collapse: collapse;
        }
        
        .border-gray-400 {
            border-color: #9ca3af !important;
        }

        /* Ensure darker borders for printing */
        th, td {
            border: 1px solid #6b7280; 
        }

        /* Utility overrides */
        .summary-card {
           padding: 0.5rem;
           border: 1px solid #d1d5db;
           border-radius: 0.5rem;
           background: #fff;
        }
        
        .notes-section {
           padding: 0.5rem;
           background-color: #fefce8;
           border-left: 4px solid #facc15;
           border-radius: 0.25rem;
        }

        /* Tailwind Text Sizes in print context */
        .text-xs { font-size: 0.70rem; line-height: 1rem; }
        .text-sm { font-size: 0.8rem; line-height: 1.1rem; }
        
        /* Background Colors forced for print */
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-gray-200 { background-color: #e5e7eb !important; }
        .bg-yellow-400 { background-color: #facc15 !important; }
        .bg-yellow-50 { background-color: #fefce8 !important; }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-green-50 { background-color: #f0fdf4 !important; }
        .bg-purple-50 { background-color: #faf5ff !important; }
        .bg-orange-50 { background-color: #fff7ed !important; }
        .bg-red-50 { background-color: #fef2f2 !important; }

      </style>
    </head>
    <body class="p-6 bg-white">
      
      <!-- Header -->
      <div class="mb-4 border-b-2 border-purple-600 pb-2">
        <h1 class="text-xl font-bold text-gray-900">Bill of Materials (BOM)</h1>
        <p class="text-sm text-gray-700 mt-1 font-semibold">${bomData.projectInfo.projectName}</p>
        <p class="text-xs text-gray-500">
          Generated: ${new Date(bomData.projectInfo.generatedAt).toLocaleString()}
        </p>
      </div>

      <!-- Table -->
      <div class="mb-6">
        <table class="w-full">
          <thead>
            <tr class="bg-yellow-400">${headerRow1}</tr>
            <tr class="bg-yellow-400">${headerRow2}</tr>
            <tr class="bg-yellow-400">${headerRow3}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-3 gap-4 mb-4 page-break-inside-avoid">
        <div class="summary-card">
          <p class="text-xs font-semibold text-gray-600">Total Capacity</p>
          <p class="text-base font-bold text-gray-800">${totalCapacity.toFixed(2)} kWp</p>
        </div>
        <div class="summary-card">
          <p class="text-xs font-semibold text-gray-600">Cost/Wp</p>
          <p class="text-base font-bold text-gray-800">₹${formatIndianNumber(costPerWp, 2)}</p>
        </div>
        <div class="summary-card">
          <p class="text-xs font-semibold text-gray-600">Total Cost</p>
          <p class="text-base font-bold text-gray-800">₹${formatIndianNumber(totalCost, 2)}</p>
        </div>
      </div>

      <!-- Notes -->
      <div class="notes-section mb-4 page-break-inside-avoid">
        <h3 class="text-xs font-bold text-gray-800 mb-1">Note:</h3>
        <ol class="list-decimal list-inside space-y-0.5 text-xs text-gray-700">
          <li>Cut Length of Long Rails subject to change during detailing based on availability.</li>
          <li>For all Roofs purlins are assumed to be at 1300mm where details of existing purlins are not shown in layout shared by client.</li>
          <li>Length of Long Rails subject to change based on actual purlin locations at site to fix the Long rail only on purlin. If any extra length of rails are required, they shall be charged extra.</li>
          <li>For Roofs with purlin span more than 1.7m, 2 Long Rails + 1 Mini Rail per each side of panel are considered.</li>
          <li>Purlin Details of sheds T10, T11, T14, T15 are not mentioned in report. They are assumed to be 1.5m. If the actual span is more than 1.7m, an extra Mini rail must be considered additionally (at extra cost).</li>
        </ol>
      </div>

      <!-- Disclaimer/Changelog -->
      ${(printSettings.includeDisclaimer && changeLog && changeLog.length > 0) ? `
        <div class="p-3 bg-red-50 border-l-4 border-red-400 rounded mt-4 page-break-inside-avoid">
            <h3 class="text-xs font-bold text-gray-800 mb-2">Disclaimer - Changes Made to this BOM:</h3>
            <div class="space-y-1">
            ${changeLog.map(change => `
                <div class="text-xs text-gray-700">
                <strong>${change.type}:</strong> ${change.itemName || ''}
                ${change.tabName ? ` (${change.tabName})` : ''}
                ${(change.oldValue !== undefined && change.newValue !== undefined) ? ` - Changed from ${change.oldValue} to ${change.newValue}` : ''}
                ${change.reason ? ` - Reason: ${change.reason}` : ''}
                </div>
            `).join('')}
            </div>
        </div>
      ` : ''}

    </body>
    </html>
  `;
};

exports.exportPdf = async (req, res) => {
    let browser;
    try {
        let bomData, printSettings, aluminumRate, sparePercentage, moduleWp, changeLog;

        // Handle Form POST (from standard HTML form submission for file download)
        // This is needed to bypass IDM/CORS issues with XHR downloads
        if (req.body.jsonPayload) {
            try {
                const parsed = JSON.parse(req.body.jsonPayload);
                bomData = parsed.bomData;
                printSettings = parsed.printSettings;
                aluminumRate = parsed.aluminumRate;
                sparePercentage = parsed.sparePercentage;
                moduleWp = parsed.moduleWp;
                changeLog = parsed.changeLog;
            } catch (e) {
                console.error('PDF Export: Failed to parse jsonPayload', e);
                return res.status(400).json({ error: 'Invalid JSON payload' });
            }
        } else {
            // Direct JSON POST
            bomData = req.body.bomData;
            printSettings = req.body.printSettings;
            aluminumRate = req.body.aluminumRate;
            sparePercentage = req.body.sparePercentage;
            moduleWp = req.body.moduleWp;
            changeLog = req.body.changeLog;
        }

        if (!bomData || !printSettings) {
            console.error('PDF Export: Missing data');
            return res.status(400).json({ error: 'Missing BOM data or print settings' });
        }

        console.log(`PDF Export: Generating PDF for project "${bomData.projectInfo.projectName}"`);

        // Store data temporarily
        const tempId = storeTempData({
            bomData,
            printSettings,
            aluminumRate: aluminumRate || 527.85,
            sparePercentage: sparePercentage || 1,
            moduleWp: moduleWp || 710,
            changeLog: changeLog || []
        });

        console.log(`PDF Export: Data stored with temp ID: ${tempId}`);

        // Launch Puppeteer
        console.log('PDF Export: Launching Puppeteer...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security' // Allow loading local resources
            ]
        });

        const page = await browser.newPage();

        // Set viewport for better rendering
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 2
        });

        // Navigate to the actual BOMPrintPreview page
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const previewUrl = `${frontendUrl}/bom/print-preview?tempId=${tempId}`;

        console.log(`PDF Export: Navigating to ${previewUrl}`);
        await page.goto(previewUrl, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait for the page to signal it's ready
        console.log('PDF Export: Waiting for page to be ready...');
        await page.waitForFunction('window.bomPageReady === true', { timeout: 30000 });

        // Give extra time for images and styles to fully load
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('PDF Export: Generating PDF buffer...');
        const orientation = (printSettings.includeQuantity && printSettings.includeSpare && printSettings.includeCosting);

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: orientation,
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>', // Empty header
            footerTemplate: `
                <div style="width: 100%; font-size: 10px; padding: 0 10mm; text-align: right; color: #333;">
                    <span>Page <span class="pageNumber"></span></span>
                </div>
            `,
            preferCSSPageSize: false,
            margin: {
                top: '10mm',
                bottom: '15mm',
                left: '3mm',
                right: '3mm'
            }
        });

        console.log(`PDF Export: PDF generated successfully, size: ${pdfBuffer.length} bytes`);
        await browser.close();

        // Clean up temp data
        tempStorage.delete(tempId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="BOM-${bomData.projectInfo.projectName.replace(/[^a-z0-9]/gi, '_')}.pdf"`
        });

        res.send(pdfBuffer);
        console.log('PDF Export: Response sent');

    } catch (error) {
        console.error('PDF Export Error:', error);
        if (browser) {
            await browser.close();
        }
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
};
