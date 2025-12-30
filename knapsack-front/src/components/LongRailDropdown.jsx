import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";

const ChevronDownIcon = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckIcon = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z"
      clipRule="evenodd"
    />
  </svg>
);

export function LongRailDropdown({
  label = "Long Rail Variation",
  required = false,
  value,
  onChange,
  options,
  placeholder = "-SELECT-",
}) {
  const selected = options.find((o) => o.value === value) || null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <Listbox value={value} onChange={onChange}>
        <div className="relative mt-1">
          {/* Button */}
          <Listbox.Button
            className={`relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              selected ? "text-gray-900" : "text-gray-400"
            }`}
          >
            <span className="block truncate">
              {selected ? selected.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
              <ChevronDownIcon className="h-5 w-5" />
            </span>
          </Listbox.Button>

          {/* Options (ALWAYS DOWN) */}
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className="
                absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md
                bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none
              "
            >
              {options.map((opt) => {
                const disabled = !!opt.disabled;
                return (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={disabled}
                    className={({ active, selected }) =>
                      [
                        "relative select-none py-2 pl-10 pr-3",
                        disabled
                          ? "cursor-not-allowed text-gray-300"
                          : "cursor-pointer",
                        active && !disabled ? "bg-blue-50 text-blue-700" : "",
                        selected ? "font-semibold" : "font-normal",
                      ].join(" ")
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="block truncate">{opt.label}</span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <CheckIcon className="h-4 w-4" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                );
              })}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {/* Optional helper */}
      {/* <p className="mt-1 text-xs text-gray-500">Choose the rail type used for this project.</p> */}
    </div>
  );
}
