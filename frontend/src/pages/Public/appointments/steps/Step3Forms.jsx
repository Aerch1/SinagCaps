"use client";

import { useMemo } from "react";
import { getFormComponent } from "../../../../forms/index.js";

export default function Step3Forms({
    formData,
    setFormData,
    registerValidator,
    formErrors = {},
    uploadedFiles,          // new
    setUploadedFiles,       // new
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
                        uploadedFiles={uploadedFiles}          // pass down
                        setUploadedFiles={setUploadedFiles}    // pass down
                    />
                </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 px-2 sm:px-4">
                ⚠️ All information will be validated by the parish office. Incomplete or incorrect
                details may cause delays or rejection.
            </p>
        </div>
    );
}