import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from './LoadingSpinner';

const AuthChecker = ({ children }) => {
    // const { checkAuth, isCheckingAuth } = useAuthStore();
    const { hasCheckedAuth, checkAuth } = useAuthStore();


    useEffect(() => {
        if (!hasCheckedAuth) checkAuth();   // 👈 one-shot
    }, [hasCheckedAuth, checkAuth]);

    return children;
};

export default AuthChecker;
