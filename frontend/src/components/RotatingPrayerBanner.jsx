import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function RotatingPrayerBanner({
    messages = [
        "Need prayers? We’re here for you.",
        "Let us lift you up in prayer.",
        "Our parish prays for each other. Share your intentions.",
        "Going through something? Let’s pray together.",
        "Need a prayer intention?"
    ],
    buttonText = "Request a Prayer",
    to = "/prayer-intentions/new",   // change to your actual form route
    intervalMs = 6000                // time each message stays visible
}) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState("enter"); // "enter" | "idle" | "exit"
    const timerRef = useRef(null);
    const prefersReducedMotion = usePrefersReducedMotion();

    const currentMessage = useMemo(() => messages[index % messages.length], [messages, index]);

    // Rotate messages
    useEffect(() => {
        if (messages.length <= 1) return;

        if (prefersReducedMotion) {
            // No animation: simple interval swap
            timerRef.current = setInterval(() => {
                setIndex((i) => (i + 1) % messages.length);
            }, intervalMs);
            return () => clearInterval(timerRef.current);
        }

        // Animated cycle: enter -> idle -> exit -> index++
        setPhase("enter");
        const enter = setTimeout(() => setPhase("idle"), 150);
        const stay = setTimeout(() => setPhase("exit"), intervalMs - 250);
        const next = setTimeout(() => {
            setIndex((i) => (i + 1) % messages.length);
            setPhase("enter");
        }, intervalMs);

        return () => {
            clearTimeout(enter);
            clearTimeout(stay);
            clearTimeout(next);
        };
    }, [index, messages.length, intervalMs, prefersReducedMotion]);

    // Pause on hover/focus
    const onMouseEnter = () => { if (timerRef.current) clearInterval(timerRef.current); };
    const onMouseLeave = () => { setIndex((i) => i); }; // triggers useEffect reschedule

    return (
        <div
            className="w-full bg-gradient-to-r from-amber-50 to-blue-50 border-y border-black/5"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="mx-auto max-w-6xl px-4 py-4 md:py-5 flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Message */}
                <div
                    role="status"
                    aria-live="polite"
                    className={[
                        "text-center md:text-left text-sm md:text-base font-medium text-slate-800 transition-all duration-300",
                        prefersReducedMotion ? "" :
                            phase === "enter" ? "opacity-0 translate-y-1" :
                                phase === "exit" ? "opacity-0 -translate-y-1" :
                                    "opacity-100 translate-y-0"
                    ].join(" ")}
                    style={{ willChange: "transform, opacity" }}
                    key={index} // re-run animation per message
                >
                    {currentMessage}
                </div>

                {/* Button (same every time) */}
                <Link
                    to={to}
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold
                     bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2
                     focus:ring-amber-600 focus:ring-offset-2 shadow-sm transition-colors"
                    aria-label={`${buttonText}: go to form`}
                >
                    {buttonText}
                </Link>
            </div>
        </div>
    );
}

/** Hook: respects system reduced motion setting */
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const m = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduced(!!m.matches);
        update();
        m.addEventListener?.("change", update);
        return () => m.removeEventListener?.("change", update);
    }, []);
    return reduced;
}
