// src/components/ui.jsx

export function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${className}`}>
      {title && <div className="border-b px-4 py-3 font-semibold">{title}</div>}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function TextField({ label, value, setValue, className = '', disabled = false }) {
  return (
    <label className={`block ${className}`}>
      {label && <div className={`mb-1 text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>}
      <input
        className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        value={value}
        onChange={e => setValue(e.target.value)}
        spellCheck={false}
        disabled={disabled}
      />
    </label>
  );
}

export function NumberField({ label, value, setValue, step, className = '', disabled = false }) {
  // Determine if decimals are allowed based on step
  const allowDecimals = step && parseFloat(step) < 1;

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Filter input based on whether decimals are allowed
    let filtered;
    if (allowDecimals) {
      filtered = inputValue.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = filtered.split('.');
      if (parts.length > 2) {
        filtered = parts[0] + '.' + parts.slice(1).join('');
      }
    } else {
      filtered = inputValue.replace(/[^0-9]/g, '');
    }

    // Convert empty string to 0 immediately, prevent negative values
    if (filtered === '') {
      setValue(0);
    } else {
      const numValue = allowDecimals ? parseFloat(filtered) : parseInt(filtered);
      setValue(Math.max(0, numValue || 0));
    }
  };

  return (
    <label className={`block ${className}`}>
      {label && <div className={`mb-1 text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>}
      <input
        type="text"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
        className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}

export function ReadOnlyField({ label, value }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-gray-600">{label}</div>
      <div className="w-full rounded-xl border bg-gray-50 px-3 py-2">{value}</div>
    </label>
  );
}

export function KV({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', className = '' }) {
  const variants = {
    primary: 'text-white bg-purple-600 hover:bg-purple-700',
    outline: 'text-purple-600 border border-purple-600 hover:bg-purple-50',
    danger: 'text-red-600 border border-red-300 hover:bg-red-50',
    ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
