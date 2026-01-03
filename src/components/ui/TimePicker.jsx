import React, { useEffect, useState, useMemo } from 'react';

export default function TimePicker({ label, value, onChange, error }) {
    // Value is "HH:mm" (24h)
    // We render a single select with 15-minute intervals

    // Generate options: 12:00 AM -> 11:45 PM
    const timeOptions = useMemo(() => {
        const options = [];
        const periods = ['AM', 'PM'];
        const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

        periods.forEach(period => {
            hours.forEach(h => {
                ['00', '15', '30', '45'].forEach(m => {
                    // Display Label
                    const label = `${h.toString().padStart(2, '0')}:${m} ${period}`;

                    // Value (24h)
                    let h24 = h;
                    if (period === 'PM' && h !== 12) h24 += 12;
                    if (period === 'AM' && h === 12) h24 = 0;

                    const val = `${h24.toString().padStart(2, '0')}:${m}`;
                    options.push({ label, value: val });
                });
            });
        });
        return options;
    }, []);

    // Helper to format custom value if not in options
    const formatValueToLabel = (val) => {
        if (!val) return '';
        const [h, m] = val.split(':');
        let hNum = parseInt(h, 10);
        const p = hNum >= 12 ? 'PM' : 'AM';
        if (hNum > 12) hNum -= 12;
        if (hNum === 0) hNum = 12;
        return `${hNum.toString().padStart(2, '0')}:${m} ${p}`;
    };

    const handleChange = (e) => {
        onChange(e.target.value);
    };

    // If current value is not in options (e.g. 12:07), adds it temporarily? 
    // Or just let it be selected (browser selects matching value).
    // If value is not in list, native select shows empty or first option.
    // We should append the custom value if it exists and is not in list.
    const currentOptionExists = timeOptions.some(o => o.value === value);

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <div className="relative">
                <select
                    value={value || ''}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                >
                    <option value="" disabled>Select Time</option>
                    {!currentOptionExists && value && (
                        <option value={value}>{formatValueToLabel(value)}</option>
                    )}
                    {timeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
