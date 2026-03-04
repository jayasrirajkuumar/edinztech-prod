export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";

    const variants = {
        primary: "bg-primary text-white hover:bg-orange-600 focus:ring-primary",
        secondary: "bg-secondary text-white hover:bg-blue-800 focus:ring-secondary",
        outline: "border border-gray-300 bg-white text-text hover:bg-gray-50 focus:ring-primary",
        ghost: "bg-transparent text-text hover:bg-gray-100 focus:ring-gray-400",
        danger: "bg-danger text-white hover:bg-red-700 focus:ring-danger",
        warning: "bg-warning text-white hover:bg-yellow-600 focus:ring-warning",
        success: "bg-success text-white hover:bg-green-700 focus:ring-success",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
