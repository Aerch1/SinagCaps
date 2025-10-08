"use client";
import { useLayoutEffect } from "react";
import { useAuthStore } from "../../store/authStore.js";
import LoadingSpinner from "../common/LoadingSpinner.jsx";

export default function AuthChecker({ children }) {
    const { hasCheckedAuth, isCheckingAuth, checkAuth } = useAuthStore();

    // Run before paint → avoids flashing logged-out view
    useLayoutEffect(() => {
        if (!hasCheckedAuth) {
            checkAuth();
        }
    }, [hasCheckedAuth, checkAuth]);

    const authReady = hasCheckedAuth && !isCheckingAuth;

    if (!authReady) {
        // Full-screen lightweight splash while bootstrapping auth
        return (
            <div className="fixed inset-0 z-[9999] grid place-items-center bg-white">
                <LoadingSpinner />
            </div>
        );
    }

    return children;
}
