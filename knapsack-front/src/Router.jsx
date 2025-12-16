// src/Router.jsx
import { Routes, Route } from 'react-router-dom';
import App from './App';
import BOMPage from './components/BOM/BOMPage';
import BOMPrintPreview from './components/BOM/BOMPrintPreview';

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/bom" element={<BOMPage />} />
      <Route path="/bom/print-preview" element={<BOMPrintPreview />} />
    </Routes>
  );
}
