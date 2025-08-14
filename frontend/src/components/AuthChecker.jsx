import { useEffect, useLayoutEffect } from "react";
import { useAuthStore } from "../store/authStore";
import LoadingSpinner from "./LoadingSpinner";

export default function AuthChecker({ children }) {
    const { hasCheckedAuth, isCheckingAuth, checkAuth } = useAuthStore();

    // Run before paint so the app doesn't flash unauthenticated UI
    useEffect(() => {
        if (!hasCheckedAuth) {
            checkAuth();
        }
    }, [hasCheckedAuth, checkAuth]);

    const authReady = hasCheckedAuth && !isCheckingAuth;

    if (!authReady) {
        // Full-screen lightweight splash while bootstrapping auth
        return (
            <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40">
                <LoadingSpinner />
            </div>
        );
    }

    return children;
}
