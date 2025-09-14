// src/pages/Public/appointments/steps/Step3ContactAndDetails.jsx
"use client"

import formRegistry from "../../../../forms"

export default function Step3ContactAndDetails({ formData, setFormData, registerValidator }) {
    const { serviceType } = formData
    const FormComponent = formRegistry[serviceType] || formRegistry["default"]

    return (
        <FormComponent
            formData={formData}
            setFormData={setFormData}
            registerValidator={registerValidator}
        />
    )
}
