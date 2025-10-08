"use client";

import { useMemo } from "react";
import { getFormComponent } from "../../../../forms/index.js";

export default function Step3Forms({
    formData,
    setFormData,
    registerValidator,
    formErrors = {},
}) {
    // Dynamically select the form component (BaptismForm, DefaultForm, etc.)
    const FormComponent = useMemo(
        () => getFormComponent(formData.formType || "default"),
        [formData.formType]
    );

    // If no service is chosen, block this step
    if (!formData.service_id && !formData.serviceType) {
        return (
            <div className="p-6 text-sm text-gray-600 border rounded-md">
                Please go back to Step 1 and select a service first.
            </div>
        );
    }

    return (
        <div className="space-y-6">

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <FormComponent
                    formData={formData}
                    setFormData={setFormData}
                    registerValidator={registerValidator}
                    formErrors={formErrors}
                />
            </div>

            <p className="text-xs text-gray-500">
                ⚠️ All information will be validated by the parish office. Incomplete or incorrect
                details may cause delays or rejection.
            </p>
        </div>
    );
}
