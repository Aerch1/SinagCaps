"use client";

import { useMemo } from "react";
import { getFormComponent } from "../../../../forms/index.js";
import { Trash2 } from "lucide-react";

export default function Step3Forms({
    formData,
    setFormData,
    registerValidator,
    formErrors = {},
    handleFileChange,
    handleRemoveFile,
}) {
    // Dynamically select the form component (BaptismForm, DefaultForm, etc.)
    const FormComponent = useMemo(
        () => getFormComponent(formData.formType || "default"),
        [formData.formType]
    );

    // If no service is chosen, block this step
    if (!formData.service_id && !formData.serviceType) {
        return (
            <div className="p-6 sm:p-8 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl">
                Please go back to Step 1 and select a service first.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6 lg:p-8">
                    <FormComponent
                        formData={formData}
                        setFormData={setFormData}
                        registerValidator={registerValidator}
                        formErrors={formErrors}
                    />
                </div>
            </div>

            {/* Global Document Upload Section */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
                <h4 className="text-base font-semibold text-gray-900 mb-2">
                    Upload Supporting Documents (Optional)
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                    PDF or Image files. You can upload multiple files.
                </p>

                <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
                />

                {formData.documentFiles?.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.documentFiles.map((file, idx) => (
                            <div
                                key={idx}
                                className="relative flex flex-col items-center bg-gray-50 p-2 rounded-lg border"
                            >
                                {file.type.startsWith("image/") ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Document ${idx + 1}`}
                                        className="max-w-full h-32 object-contain rounded-md border"
                                    />
                                ) : file.type === "application/pdf" ? (
                                    <a
                                        href={URL.createObjectURL(file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline text-sm"
                                    >
                                        View PDF {idx + 1}
                                    </a>
                                ) : (
                                    <p className="text-gray-700 text-sm truncate">{file.name}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(idx)}
                                    className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-700 rounded-full"
                                    title="Remove file"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <p className="text-xs sm:text-sm text-gray-600 px-2 sm:px-4">
                ⚠️ All information will be validated by the parish office. Incomplete or incorrect
                details may cause delays or rejection.
            </p>
        </div>
    );
}
