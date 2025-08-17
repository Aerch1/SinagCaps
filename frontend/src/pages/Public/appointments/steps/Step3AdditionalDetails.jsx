"use client";

import BaptismForm from "../../../../forms/BaptismForm.jsx";
import DefaultForm from "../../../../forms/DefaultForm.jsx";

/**
 * Thin wrapper: picks the correct form by serviceType and
 * passes the validator hook up via registerValidator.
 */
export default function Step3ContactAndDetails({ formData, setFormData, registerValidator }) {
    const isBaptism = formData.serviceType === "baptism";

    if (isBaptism) {
        return (
            <BaptismForm
                formData={formData}
                setFormData={setFormData}
                registerValidator={registerValidator}
            />
        );
    }

    return (
        <DefaultForm
            formData={formData}
            setFormData={setFormData}
            registerValidator={registerValidator}
        />
    );
}
