"use client";
import { useState } from "react";
import HeroBanner from "@/components/section/HeroBanner";
import toast from "react-hot-toast";
import api from "@/api/api"; // ✅ Axios instance
import Input from "@/components/ui/Input";
import { Mail, Phone, MapPin, User } from "lucide-react";

const HERO_IMG = "/docuBg.jpg";

export default function DocumentRequestPage() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        documents: [], // array of selected documents
        additionalInfo: "",
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const documentOptions = [
        { value: "baptism", label: "Certificate of Baptism" },
        { value: "confirmation", label: "Certificate of Confirmation" },
        { value: "marriage", label: "Certificate of Marriage" },
        { value: "first-communion", label: "Certificate of First Communion" },
        { value: "death", label: "Certificate of Death/Burial" },
        { value: "membership", label: "Certificate of Membership" },
        { value: "other", label: "Other (specify in purpose)" },
    ];

    /* ======================================================
       HANDLE INPUT CHANGE
    ====================================================== */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDocumentChange = (e, field, index) => {
        const { value } = e.target;
        setFormData((prev) => {
            const documents = [...prev.documents];
            documents[index][field] = value;
            return { ...prev, documents };
        });
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData((prev) => {
            let updated = [...prev.documents];
            if (checked) {
                updated.push({ document_type: value, purpose: "", copies: 1 });
            } else {
                updated = updated.filter(doc => doc.document_type !== value);
            }
            return { ...prev, documents: updated };
        });
    };

    /* ======================================================
       SIMPLE VALIDATION
    ====================================================== */
    const validateForm = () => {
        const errors = [];
        if (!formData.fullName.trim()) errors.push("Full name is required.");
        if (!formData.email.trim()) errors.push("Email is required.");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            errors.push("Please enter a valid email address.");
        if (!formData.phone.trim()) errors.push("Contact number is required.");
        if (formData.documents.length === 0)
            errors.push("Please select at least one document type.");
        formData.documents.forEach((doc, i) => {
            if (!doc.purpose.trim())
                errors.push(`Purpose is required for ${doc.document_type}.`);
            if (!doc.copies || doc.copies < 1 || doc.copies > 10)
                errors.push(`Copies for ${doc.document_type} must be between 1 and 10.`);
        });
        return errors;
    };

    /* ======================================================
       SUBMIT FORM → Backend
    ====================================================== */
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (errors.length > 0) {
            errors.forEach((err) => toast.error(err));
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                full_name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                documents: formData.documents,
                additional_info: formData.additionalInfo || null,
            };

            const { data } = await api.post("/public/documents", payload);

            toast.success(data.message || "Your document request was submitted!");
            setShowSuccess(true);
            setFormData({
                fullName: "",
                email: "",
                phone: "",
                address: "",
                documents: [],
                additionalInfo: "",
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => setShowSuccess(false), 5000);
        } catch (error) {
            const err =
                error.response?.data?.error ||
                error.response?.data?.errors?.join(", ") ||
                "Submission failed. Please try again.";
            toast.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="bg-gray-50 min-h-screen">
            <HeroBanner title="Document Request Form" imageSrc={HERO_IMG} />

            <section className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* ✅ Success Message */}
                    {showSuccess && (
                        <div className="mb-6 bg-green-50 border border-green-400 text-green-700 rounded-md p-4 text-center text-sm font-medium space-y-2">
                            <p>
                                ✅ Thank you! Your document request has been submitted successfully.
                                We will contact you within 3–5 business days.
                            </p>
                            <p className="text-[13px] text-green-800/90">
                                📌 <strong>Important:</strong> To <strong>view or track</strong> your request,
                                please <strong>log in using the email you entered</strong> in this form.
                                You will also receive updates through your email notifications.
                            </p>
                        </div>
                    )}

                    {/* ⚠️ Info Box */}
                    <div className="bg-amber-50 border-l-4 border-amber-700 text-amber-800 p-4 mb-8 text-sm">
                        Please allow 3–5 business days for processing. For urgent requests,
                        contact the parish office directly at{" "}
                        <span className="font-semibold">(+63) 966 854 8848</span>.
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* PERSONAL INFO */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">
                                Personal Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        icon={User}
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                        required
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            icon={Mail}
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="example@email.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Number <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            icon={Phone}
                                            type="tel"
                                            name="phone"
                                            pattern="^09\d{9}$"
                                            title="Enter a valid PH mobile number (e.g., 09123456789)"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="09XXXXXXXXX"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Complete Address
                                    </label>
                                    <Input
                                        icon={MapPin}
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Street, City, Province"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* DOCUMENT REQUEST */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">
                                Document Request
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type of Documents <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {documentOptions.map((doc) => {
                                            const index = formData.documents.findIndex(d => d.document_type === doc.value);
                                            return (
                                                <div key={doc.value} className="flex flex-col border p-2 rounded-md">
                                                    <label className="inline-flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            value={doc.value}
                                                            checked={index !== -1}
                                                            onChange={handleCheckboxChange}
                                                            className="form-checkbox h-4 w-4 text-blue-600"
                                                        />
                                                        <span className="text-sm">{doc.label}</span>
                                                    </label>

                                                    {index !== -1 && (
                                                        <div className="mt-2 space-y-2">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                name="copies"
                                                                value={formData.documents[index].copies}
                                                                onChange={(e) => handleDocumentChange(e, "copies", index)}
                                                                placeholder="Number of copies"
                                                            />
                                                            <textarea
                                                                name="purpose"
                                                                value={formData.documents[index].purpose}
                                                                onChange={(e) => handleDocumentChange(e, "purpose", index)}
                                                                placeholder="Purpose of request"
                                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/60 focus:outline-none min-h-[60px]"
                                                            ></textarea>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Additional Information
                                    </label>
                                    <textarea
                                        name="additionalInfo"
                                        value={formData.additionalInfo}
                                        onChange={handleChange}
                                        placeholder="Any other details that may help us process your request"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/60 focus:outline-none min-h-[100px]"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-secondary text-white py-3.5 rounded-md text-sm font-semibold hover:bg-secondary/90 transition disabled:opacity-70"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}
