// src/Router.jsx
import { Routes, Route } from 'react-router-dom';
import App from './App';
import BOMPage from './components/BOM/BOMPage';

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/bom" element={<BOMPage />} />
    </Routes>
  );
}
