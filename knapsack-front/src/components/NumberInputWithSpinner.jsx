// src/components/NumberInputWithSpinner.jsx

export default function NumberInputWithSpinner({
  value,
  onChange,
  disabled = false,
  className = '',
  minValue = 0
}) {
  const handleInputChange = (e) => {
    const filtered = e.target.value.replace(/[^0-9.]/g, '');
    // Same as GlobalInputs/BOMPage: empty becomes 0, then enforce minValue
    const newValue = filtered === '' ? 0 : Math.max(minValue, parseFloat(filtered) || 0);
    onChange(newValue);
  };

  const increment = () => onChange((value || minValue) + 1);
  const decrement = () => onChange(Math.max(minValue, (value || minValue) - 1));

  return (
    <div className="relative group">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        className={`w-full rounded border border-gray-300 px-3 py-2 text-sm text-center font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${className}`}
      />
      {!disabled && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
          <button
            type="button"
            onClick={increment}
            className="w-6 h-4 flex items-center justify-center bg-white hover:bg-purple-50 border border-gray-300 rounded shadow-sm transition-all hover:border-purple-400 hover:shadow active:bg-purple-100"
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
            className="w-6 h-4 flex items-center justify-center bg-white hover:bg-purple-50 border border-gray-300 rounded shadow-sm transition-all hover:border-purple-400 hover:shadow active:bg-purple-100"
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
