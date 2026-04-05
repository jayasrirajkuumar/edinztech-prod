import { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, className = '', rightElement, ...props }, ref) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium text-text mb-1">{label}</label>}
        <div className="relative">
            <input
                ref={ref}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none ${error ? 'border-danger' : 'border-gray-300'
                    } ${rightElement ? 'pr-10' : ''} ${className}`}
                {...props}
            />
            {rightElement && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                    {rightElement}
                </div>
            )}
        </div>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
));



export const TextArea = forwardRef(({ label, error, className = '', ...props }, ref) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium text-text mb-1">{label}</label>}
        <textarea
            ref={ref}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none ${error ? 'border-danger' : 'border-gray-300'
                } ${className}`}
            {...props}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
));
