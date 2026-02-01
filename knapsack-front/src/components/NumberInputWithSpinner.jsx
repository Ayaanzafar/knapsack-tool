// src/components/NumberInputWithSpinner.jsx

import { useState, useEffect } from 'react';

export default function NumberInputWithSpinner({
  value,
  onChange,
  disabled = false,
  className = '',
  minValue = 0,
  size = 'md'  // 'sm', 'md', 'lg'
}) {
  // Internal state to preserve decimal points during typing
  const [displayValue, setDisplayValue] = useState(String(value ?? ''));

  // Sync display value when external value changes
  useEffect(() => {
    setDisplayValue(String(value ?? ''));
  }, [value]);

  // Size configurations
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs pr-7',
    md: 'px-3 py-1.5 text-sm pr-8',
    lg: 'px-3 py-2 text-sm pr-8'
  };

  const handleInputChange = (e) => {
    const filtered = e.target.value.replace(/[^0-9.]/g, '');

    // Update display value immediately to preserve typing experience
    setDisplayValue(filtered);

    if (filtered === '') {
      onChange(0);
      return;
    }

    // Allow typing decimal point (e.g., "10." stays as "10." not become "10")
    if (filtered.endsWith('.')) {
      // Don't call onChange yet, wait for more digits
      return;
    }

    // Parse to number and enforce minValue
    const numValue = parseFloat(filtered) || 0;
    onChange(Math.max(minValue, numValue));
  };

  const increment = () => {
    const newValue = (value || minValue) + 1;
    onChange(newValue);
    setDisplayValue(String(newValue));
  };

  const decrement = () => {
    const newValue = Math.max(minValue, (value || minValue) - 1);
    onChange(newValue);
    setDisplayValue(String(newValue));
  };

  return (
    <div className="relative group">
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleInputChange}
        disabled={disabled}
        className={`w-full rounded border border-gray-300 text-center font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${sizeClasses[size]} ${className}`}
      />
      {!disabled && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
          <button
            type="button"
            onClick={increment}
            className="w-6 h-2.5 flex items-center justify-center bg-white hover:bg-purple-50 border border-gray-300 rounded shadow-sm transition-all hover:border-purple-400 hover:shadow active:bg-purple-100"
            title="Increment"
          >
            <svg
              className="w-3 h-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={decrement}
            className="w-6 h-2.5 flex items-center justify-center bg-white hover:bg-purple-50 border border-gray-300 rounded shadow-sm transition-all hover:border-purple-400 hover:shadow active:bg-purple-100"
            title="Decrement"
          >
            <svg
              className="w-3 h-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
