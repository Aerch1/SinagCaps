import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from './LoadingSpinner';

const AuthChecker = ({ children }) => {
    const { checkAuth, isCheckingAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isCheckingAuth) {
        return <LoadingSpinner />;
    }

    return children;
};

export default AuthChecker;
