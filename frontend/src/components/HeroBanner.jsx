// src/components/HeroBanner.jsx
"use client";

export default function HeroBanner({ title, imageSrc, height = "h-56 md:h-64 lg:h-72" }) {
    return (
        <div className="relative w-full overflow-hidden">
            <div className={`relative ${height}`}>
                {/* background image */}
                <img
                    src={imageSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                />
                {/* overlay for readability */}
                <div className="absolute inset-0 bg-black/40" />
                {/* centered title */}
                <div className="relative z-10 flex h-full items-center justify-center px-4">
                    <h1 className="text-center text-white text-2xl md:text-3xl font-bold tracking-wide">
                        {title}
                    </h1>
                </div>
            </div>
        </div>
    );
}
