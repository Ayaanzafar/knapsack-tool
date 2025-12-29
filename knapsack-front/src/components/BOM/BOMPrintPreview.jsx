// src/components/BOM/BOMPrintPreview.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../../styles/print.css';
import { API_URL } from '../../services/config';
import NotesSection from './NotesSection';
import {
  DEFAULT_ALUMINIUM_RATE_PER_KG,
  DEFAULT_MODULE_WP,
  DEFAULT_SPARE_PERCENTAGE
} from '../../constants/bomDefaults';

export default function BOMPrintPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bomData, setBomData] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);
  const [aluminumRate, setAluminumRate] = useState(DEFAULT_ALUMINIUM_RATE_PER_KG);
  const [sparePercentage, setSparePercentage] = useState(DEFAULT_SPARE_PERCENTAGE);
  const [moduleWp, setModuleWp] = useState(DEFAULT_MODULE_WP);
  const [scale, setScale] = useState(100); // Scale percentage for zoom
  const [changeLog, setChangeLog] = useState([]);
  const [userNotes, setUserNotes] = useState([]);

  useEffect(() => {
    // Check if loading from temp data (for PDF export)
    const searchParams = new URLSearchParams(location.search);
    const tempId = searchParams.get('tempId');

    if (tempId) {
      // Load from backend temp storage for PDF generation
      const token = localStorage.getItem('token');
      fetch(`${API_URL}/api/bom/temp-data/${tempId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || `Failed to load temp data (HTTP ${res.status})`);
          }
          return res.json();
        })
        .then(data => {
          setBomData(data.bomData);
          setPrintSettings(data.printSettings);
          setAluminumRate(data.aluminumRate || DEFAULT_ALUMINIUM_RATE_PER_KG);
          setSparePercentage(data.sparePercentage || DEFAULT_SPARE_PERCENTAGE);
          setModuleWp(data.moduleWp || DEFAULT_MODULE_WP);
          setChangeLog(data.changeLog || []);
          setUserNotes(data.userNotes || []);

          const { includeQuantity, includeSpare, includeCosting } = data.printSettings;
          const allThree = includeQuantity && includeSpare && includeCosting;

          if (allThree) {
            setScale(75);
          } else {
            setScale(90);
          }

          // Signal that page is ready for PDF generation
          window.bomPageReady = true;

          // Auto-print if requested
          if (searchParams.get('autoPrint') === 'true') {
            setTimeout(() => {
              window.print();
            }, 1000);
          }
        })
        .catch(err => {
          console.error('Failed to load temp data:', err);
          alert('Failed to load print data');
          navigate(-1);
        });
      return;
    }

    // Get data from location state (normal navigation)
    if (location.state?.bomData && location.state?.printSettings) {
      setBomData(location.state.bomData);
      setPrintSettings(location.state.printSettings);
      setAluminumRate(location.state.aluminumRate || DEFAULT_ALUMINIUM_RATE_PER_KG);
      setSparePercentage(location.state.sparePercentage || DEFAULT_SPARE_PERCENTAGE);
      setModuleWp(location.state.moduleWp || DEFAULT_MODULE_WP);
      setChangeLog(location.state.changeLog || []);
      setUserNotes(location.state.userNotes || []);

      // Set smart default scale based on sections selected
      const { includeQuantity, includeSpare, includeCosting } = location.state.printSettings;
      const allThree = includeQuantity && includeSpare && includeCosting;

      // If all 3 sections in portrait, default to 75% to avoid cut-off
      if (allThree) {
        setScale(75);
      } else {
        setScale(90); // For 1-2 sections, 90% is usually good
      }

      // Auto-print if requested
      if (location.state.autoPrint) {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    } else {
      // No data, redirect back
      alert('No print data available');
      navigate(-1);
    }
  }, [location.state, location.search, navigate]);

  // Format numbers in Indian style
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

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (!bomData || !printSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  const { includeQuantity, includeSpare, includeCosting } = printSettings;
  const orientation = (includeQuantity && includeSpare && includeCosting) ? 'landscape' : 'portrait';

  return (
    <>
      {/* Single Watermark - Fixed position repeats on every printed page */}
      <div className="watermark-layer">
        <img src="/watermark0.png" alt="" />
      </div>

      {/* Dynamic Print Orientation */}
      <style>{`
        @page {
          size: A4 ${orientation};
          margin-top: 1cm;
          margin-right: 0.3cm;
          margin-left: 0.3cm;
          margin-bottom: 0.4in; /* ✅ critical: same effect as browser bottom margin */
        }

        /* Hide custom page number on screen */
        .page-number {
          display: none;
        }

        /* Watermark layer - Screen */
        .watermark-layer {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .watermark-layer img {
          width: 50%;
          height: auto;
          opacity: 0.08;
        }

        /* =========================
          PRINT STYLES
        ========================= */
        @media print {

          /* --- WATERMARK FOR PRINT - position:fixed repeats on EVERY page --- */
          .watermark-layer {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            pointer-events: none !important;
            z-index: 999 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            mix-blend-mode: multiply !important;
          }

          .watermark-layer img {
            width: 60% !important;
            max-width: 700px !important;
            height: auto !important;
            opacity: 0.15 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Make backgrounds semi-transparent to show watermark */
          .print-content .bg-white {
            background-color: rgba(255, 255, 255, 0.95) !important;
          }

          .print-content table th,
          .print-content table td {
            background-color: rgba(255, 255, 255, 0) !important;
          }

          .print-content table th {
            background-color: rgba(251, 191, 36, 1) !important;
          }

          .print-content .bg-yellow-400 {
            background-color: rgba(251, 191, 36, 1) !important;
          }

          .print-content .bg-blue-50 {
            background-color: rgba(239, 246, 255, 0.9) !important;
          }

          .print-content .bg-green-50 {
            background-color: rgba(240, 253, 244, 0.9) !important;
          }

          .print-content .bg-purple-50 {
            background-color: rgba(250, 245, 255, 0.9) !important;
          }

          .print-content .bg-yellow-50 {
            background-color: rgba(254, 252, 232, 0.9) !important;
          }

          .print-content .bg-orange-50 {
            background-color: rgba(255, 247, 237, 0.9) !important;
          }

          .print-content .bg-gray-50 {
            background-color: rgba(249, 250, 251, 0.9) !important;
          }

          .print-content .bg-red-50 {
            background-color: rgba(254, 242, 242, 0.9) !important;
          }

          .print-content .bg-yellow-50 {
            background-color: rgba(254, 252, 232, 0.9) !important;
          }

          /* --- PRINT PAGE SAFE AREA --- */
          .print-content {
            box-sizing: border-box !important;
            position: relative;
            z-index: 1;

            /* ✅ this is the key: page-level bottom safety */
            padding-bottom: 35mm !important;

            font-size: ${scale}% !important;
          }

          .print-content > * {
            font-size: inherit !important;
            position: relative;
            z-index: 1;
          }

          /* Ensure content backgrounds are preserved */
          .print-content,
          .print-content * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* --- CUSTOM FOOTER --- */
          .page-number{
              bottom: 4mm !important;
              right: 6mm !important;
              background: transparent !important;
              padding: 0 !important;
            }


          /* --- TABLE SCALING (prevents bottom collision) --- */
          .print-content table {
            zoom: ${orientation === 'landscape' ? '0.92' : '0.96'}; /* ✅ IMPORTANT: reduces table size to fit all columns */
            width: 100% !important;
            table-layout: auto !important;
          }

          .print-content th,
          .print-content td {
            line-height: 1.3 !important;
            padding: 3px 4px !important;
            height: ${orientation === 'landscape' ? '20px' : '24px'} !important;
            vertical-align: middle !important;
          }

          .print-content tr {
            height: ${orientation === 'landscape' ? '20px' : '24px'} !important;
          }

          .print-content tbody tr {
            height: ${orientation === 'landscape' ? '20px' : '24px'} !important;
          }

          .print-content th {
            font-size: ${orientation === 'landscape' ? '0.55rem' : '0.65rem'} !important;
          }

          .print-content td {
            font-size: ${orientation === 'landscape' ? '0.5rem' : '0.6rem'} !important;
          }

          /* Ensure images don't expand row height */
          .print-content table img {
            max-height: 16px !important;
            width: auto !important;
            display: block !important;
            margin: 0 auto !important;
          }

          /* --- HEADINGS --- */
          .print-content h1 {
            font-size: ${scale > 80 ? '1.25rem' : '1.1rem'} !important;
          }

          .print-content h2 {
            font-size: ${scale > 80 ? '1rem' : '0.9rem'} !important;
          }

          .print-content h3 {
            font-size: ${scale > 80 ? '0.85rem' : '0.75rem'} !important;
          }

          /* --- SUMMARY / NOTES --- */
          .print-content .summary-card {
            padding: ${scale > 80 ? '0.5rem' : '0.35rem'} !important;
          }

          .print-content .notes-section {
            font-size: ${scale > 80 ? '0.6rem' : '0.55rem'} !important;
            padding: ${scale > 80 ? '0.5rem' : '0.35rem'} !important;
          }

          .print-content .notes-section h3 {
            margin-bottom: ${scale > 80 ? '0.35rem' : '0.25rem'} !important;
          }

          .print-content img {
            max-width: ${scale > 80 ? '32px' : '24px'} !important;
            max-height: ${scale > 80 ? '32px' : '24px'} !important;
          }
        }

        /* =========================
          SCREEN PREVIEW
        ========================= */
        @media screen {
          .print-content {
            position: relative;
            z-index: 1;
            margin: 2rem auto;
            max-width: ${orientation === 'landscape' ? '297mm' : '210mm'};
            min-height: ${orientation === 'landscape' ? '210mm' : '297mm'};
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            transform: scale(${scale / 100});
            transform-origin: top center;
            background: transparent;
          }
        }

      `}</style>

      {/* Action Buttons & Controls - Hidden in print */}
      <div className="no-print fixed top-4 right-4 z-50 flex flex-col gap-3">
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print
          </button>
        </div>

        {/* Zoom/Scale Controls */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Scale: {scale}%
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScale(Math.max(60, scale - 5))}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
              title="Zoom Out"
            >
              −
            </button>
            <input
              type="range"
              min="60"
              max="100"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-32"
            />
            <button
              onClick={() => setScale(Math.min(100, scale + 5))}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
              title="Zoom In"
            >
              +
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setScale(70)}
              className={`px-2 py-1 text-xs rounded ${scale === 70 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              70%
            </button>
            <button
              onClick={() => setScale(75)}
              className={`px-2 py-1 text-xs rounded ${scale === 75 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              75%
            </button>
            <button
              onClick={() => setScale(80)}
              className={`px-2 py-1 text-xs rounded ${scale === 80 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              80%
            </button>
            <button
              onClick={() => setScale(90)}
              className={`px-2 py-1 text-xs rounded ${scale === 90 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              90%
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Adjust scale to fit content on page
          </p>
        </div>
      </div>

      {/* Print Content */}
      <div className={`print-content ${orientation}`}>
        <div className="p-6 bg-white">
          {/* Header */}
          <div className="mb-6 border-b-2 border-purple-600 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Bill of Materials (BOM) for {bomData.projectInfo.longRailVariation || ''}</h1>
            <p className="text-lg text-gray-700 mt-1">{bomData.projectInfo.projectName}</p>
            <p className="text-sm text-gray-500 mt-1">
              Generated: {new Date(bomData.projectInfo.generatedAt).toLocaleString()}
            </p>
          </div>

          {/* BOM Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-xs">
              <thead>
                {/* Row 1: Main headers */}
                <tr className="bg-yellow-400">
                  {includeQuantity && (
                    <>
                      <th colSpan={5} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">
                        {bomData.projectInfo.projectName}
                      </th>
                      <th colSpan={2} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                        Building Code
                      </th>
                      {bomData.tabs.map((tab, index) => (
                        <th key={`bc-${index}-${tab}`} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                          {tab}
                        </th>
                      ))}
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Total</th>
                    </>
                  )}

                  {includeSpare && (
                    <>
                      <th rowSpan={2} className="bg-gray-200 w-4"></th>
                      <th rowSpan={2} colSpan={2} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">Spare</th>
                    </>
                  )}

                  {includeCosting && (
                    <>
                      <th className="bg-gray-200 w-4"></th>
                      <th colSpan={6} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">
                        Weight Calculation and Cost Calculation
                      </th>
                    </>
                  )}
                </tr>

                {/* Row 2: Secondary headers */}
                <tr className="bg-yellow-400">
                  {includeQuantity && (
                    <>
                      <th colSpan={5} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">
                        {bomData.projectInfo.longRailVariation || 'BOM for U Cleat Long Rail'}
                      </th>
                      <th colSpan={2} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                        No. of Panels
                      </th>
                      {bomData.tabs.map((tab, index) => (
                        <th key={`panel-${index}-${tab}`} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                          {bomData.panelCounts[tab] || 0}
                        </th>
                      ))}
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                        {Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0)}
                      </th>
                    </>
                  )}

                  {includeCosting && (
                    <>
                      <th className="bg-gray-200 w-4"></th>
                      <th colSpan={6} className="border border-gray-400 px-2 py-1 text-sm font-bold text-center">
                        Aluminum Rate per kg: ₹{aluminumRate}
                      </th>
                    </>
                  )}
                </tr>

                {/* Row 3: Column headers */}
                <tr className="bg-yellow-400">
                  {includeQuantity && (
                    <>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">S.N</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Sunrack<br />Code</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Profile</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Item Description</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Material</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Length<br />(mm)</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">UoM</th>
                      {bomData.tabs.map((tab, index) => (
                        <th key={`qty-${index}-${tab}`} className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">
                          Qty.
                        </th>
                      ))}
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Quantity</th>
                    </>
                  )}

                  {includeSpare && (
                    <>
                      <th className="bg-gray-200 w-4"></th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Spare<br />Quantity</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Total<br />Quantity</th>
                    </>
                  )}

                  {includeCosting && (
                    <>
                      <th className="bg-gray-200 w-4"></th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Wt/RM<br />(kg/m)</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">RM<br />(m)</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Wt<br />(kg)</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Al Rate/Kg<br />(₹/kg)</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Rate/Piece<br />(₹)</th>
                      <th className="border border-gray-400 px-2 py-1 text-xs font-bold text-center">Cost<br />(₹)</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {bomData.bomItems.map((item, index) => {
                  const isEven = index % 2 === 0;
                  const bgColor = isEven ? 'bg-white' : 'bg-gray-50';
                  const hasManualAlRate = item.userEdits?.manualAluminumRate !== undefined && item.userEdits?.manualAluminumRate !== null;
                  const effectiveAlRate = hasManualAlRate ? item.userEdits.manualAluminumRate : aluminumRate;

                  return (
                    <tr key={item._id || item.sn} className={bgColor}>
                      {includeQuantity && (
                        <>
                          <td className={`border border-gray-400 px-2 py-1 text-xs text-center ${bgColor}`}>{item.sn}</td>
                          <td className={`border border-gray-400 px-2 py-1 text-xs text-center ${bgColor}`}>{item.sunrackCode || '-'}</td>
                          <td className={`border border-gray-400 px-2 py-1 text-center ${bgColor}`}>
                            {item.profileImage ? (
                              <img src={item.profileImage} alt={item.sunrackCode} className="w-8 h-8 object-contain mx-auto" />
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className={`border border-gray-400 px-2 py-1 text-xs text-left ${bgColor}`}>{item.itemDescription}</td>
                          <td className={`border border-gray-400 px-2 py-1 text-xs text-center ${bgColor}`}>{item.material}</td>
                          <td className={`border border-gray-400 px-2 py-1 text-xs text-center ${bgColor}`}>{item.length || '-'}</td>
                          <td className={`border border-gray-400 px-2 py-1 text-xs text-center ${bgColor}`}>{item.uom}</td>
                          {bomData.tabs.map((tab, idx) => (
                            <td key={`qty-${idx}-${tab}`} className={`border border-gray-400 px-2 py-1 text-xs text-center ${bgColor}`}>
                              {item.quantities[tab] || 0}
                            </td>
                          ))}
                          <td className={`border border-gray-400 px-2 py-1 text-xs text-center font-bold bg-blue-50`}>
                            {item.totalQuantity}
                          </td>
                        </>
                      )}

                      {includeSpare && (
                        <>
                          <td className="bg-gray-200"></td>
                          <td className="border border-gray-400 px-2 py-1 text-xs text-center bg-green-50">{item.spareQuantity}</td>
                          <td className="border border-gray-400 px-2 py-1 text-xs text-center font-bold bg-purple-50">{item.finalTotal}</td>
                        </>
                      )}

                      {includeCosting && (
                        <>
                          <td className="bg-gray-200"></td>
                          <td className="border border-gray-400 px-2 py-1 text-xs text-center bg-yellow-50">{formatNumber(item.wtPerRm, 2)}</td>
                          <td className="border border-gray-400 px-2 py-1 text-xs text-center bg-yellow-50">{formatNumber(item.rm, 1)}</td>
                          <td className="border border-gray-400 px-2 py-1 text-xs text-center bg-orange-50">{formatNumber(item.wt, 1)}</td>
                          <td className={`border border-gray-400 px-2 py-1 text-xs text-center ${hasManualAlRate ? 'bg-blue-100' : 'bg-orange-50'}`}>
                            {((item.wtPerRm > 0 || item.wt > 0) && !item.costPerPiece) ? formatNumber(Number(effectiveAlRate) || 0, 2) : '-'}
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-xs text-center">
                            {item.costPerPiece ? formatNumber(item.costPerPiece, 2) : '-'}
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-xs text-center font-bold bg-green-50">
                            ₹{formatIndianNumber(item.cost, 2)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6 summary-cards">
            <div className="p-3 border-2 border-gray-300 rounded summary-card">
              <p className="text-xs font-semibold text-gray-600">Total Capacity</p>
              <p className="text-lg font-bold text-gray-800">
                {((Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0) * moduleWp) / 1000).toFixed(2)} kWp
              </p>
            </div>
            <div className="p-3 border-2 border-gray-300 rounded summary-card">
              <p className="text-xs font-semibold text-gray-600">Cost/Wp</p>
              <p className="text-lg font-bold text-gray-800">
                ₹{formatIndianNumber(
                  bomData.bomItems.reduce((acc, item) => acc + (item.cost || 0), 0) /
                  (Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0) * moduleWp),
                  2
                )}
              </p>
            </div>
            <div className="p-3 border-2 border-gray-300 rounded summary-card">
              <p className="text-xs font-semibold text-gray-600">Total Cost</p>
              <p className="text-lg font-bold text-gray-800">
                ₹{formatIndianNumber(bomData.bomItems.reduce((acc, item) => acc + (item.cost || 0), 0), 2)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {/* <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded notes-section">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Note:</h3>
            <ol className="list-decimal list-inside space-y-1 text-xs text-gray-700">
              <li>Cut Length of Long Rails subject to change during detailing based on availability.</li>
              <li>For all Roofs purlins are assumed to be at 1300mm where details of existing purlins are not shown in layout shared by client.</li>
              <li>Length of Long Rails subject to change based on actual purlin locations at site to fix the Long rail only on purlin. If any extra length of rails are required, they shall be charged extra.</li>
              <li>For Roofs with purlin span more than 1.7m, 2 Long Rails + 1 Mini Rail per each side of panel are considered.</li>
              <li>Purlin Details of sheds T10, T11, T14, T15 are not mentioned in report. They are assumed to be 1.5m. If the actual span is more than 1.7m, an extra Mini rail must be considered additionally (at extra cost).</li>
            </ol>
          </div> */}

          {/* Notes Section (includes default notes + user notes) */}
          <div className="mt-4">
            <NotesSection
              userNotes={userNotes || []}
              onNotesChange={() => {}}
              editMode={false}
            />
          </div>

          {/* Disclaimer/Changelog Section */}
          {printSettings?.includeDisclaimer && changeLog && changeLog.length > 0 && (
            <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded mt-4 notes-section">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Disclaimer - Changes Made to this BOM:</h3>
              <div className="space-y-1">
                {changeLog.map((change, idx) => (
                  <div key={idx} className="text-xs text-gray-700">
                    <strong>{change.type}:</strong> {change.itemName}
                    {change.tabName && ` (${change.tabName})`}
                    {change.oldValue !== undefined && change.newValue !== undefined &&
                      ` - Changed from ${change.oldValue} to ${change.newValue}`
                    }
                    {change.reason && ` - Reason: ${change.reason}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Page Number - Outside content container */}
      </div>

      <div className="page-number"></div>

    </>
  );
}
