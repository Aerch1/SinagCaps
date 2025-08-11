"use client";
export default function RowItem({ icon, title, description, action }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 last:border-b-0 sm:px-6">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-full bg-gray-50 p-2 ring-1 ring-gray-200">
                    {icon}
                </div>
                <div>
                    <div className="text-sm font-medium text-gray-900">{title}</div>
                    {description ? (
                        <div className="mt-0.5 text-sm text-gray-600">{description}</div>
                    ) : null}
                </div>
            </div>
            <div className="shrink-0">{action}</div>
        </div>
    );
}
