import React, { useEffect, useState } from 'react';
import TimePicker from './TimePicker';

export default function DateTimePicker({ label, value, onChange, error, min }) {
    // Value is ISO String "YYYY-MM-DDTHH:mm" (or fuller ISO)
    const [datePart, setDatePart] = useState('');
    const [timePart, setTimePart] = useState('');

    useEffect(() => {
        if (value) {
            // Handle ISO string
            const dt = new Date(value);
            if (!isNaN(dt.getTime())) {
                // Formatting to YYYY-MM-DD
                const yyyy = dt.getFullYear();
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                setDatePart(`${yyyy}-${mm}-${dd}`);

                // Formatting to HH:mm
                const hh = String(dt.getHours()).padStart(2, '0');
                const min = String(dt.getMinutes()).padStart(2, '0');
                setTimePart(`${hh}:${min}`);
            }
        } else {
            setDatePart('');
            setTimePart('');
        }
    }, [value]);

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setDatePart(newDate);
        combineAndEmit(newDate, timePart);
    };

    const handleTimeChange = (newTime) => {
        setTimePart(newTime);
        combineAndEmit(datePart, newTime);
    };

    const combineAndEmit = (d, t) => {
        if (d && t) {
            // Combine to ISO-like string YYYY-MM-DDTHH:mm
            onChange(`${d}T${t}`);
        } else {
            // Keep value empty or partial? Usually null if invalid
            // Or emit partial if needed, but standard is full datetime
            if (!d && !t) onChange('');
            // If one is missing, maybe don't emit yet? Or emit partial?
            // Let's emit empty if incomplete to trigger validation error "Required"
            else onChange('');
        }
    };

    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <div className="flex flex-col gap-2">
                <div className="w-full">
                    <input
                        type="date"
                        value={datePart}
                        onChange={handleDateChange}
                        min={min ? new Date(min).toISOString().split('T')[0] : undefined}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                    />
                </div>
                <div className="w-full">
                    <TimePicker
                        value={timePart}
                        onChange={handleTimeChange}
                    />
                </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
