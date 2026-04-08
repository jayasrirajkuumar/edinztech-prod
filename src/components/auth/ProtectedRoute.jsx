import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const location = useLocation();
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const user = userInfo?.user || userInfo; // Handle both structures

    const token = localStorage.getItem('token')
        || userInfo?.token
        || userInfo?.accessToken
        || userInfo?.data?.token
        || userInfo?.data?.accessToken
        || userInfo?.user?.token
        || userInfo?.user?.accessToken;

    if (!user || !user.email || !token) {
        // Not logged in or missing auth token
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        // Not admin
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
