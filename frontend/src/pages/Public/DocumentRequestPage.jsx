"use client";
import { useState } from "react";
import HeroBanner from "@/components/section/HeroBanner";
import toast from "react-hot-toast";
import api from "@/api/api";
import Input from "@/components/ui/Input";
import { Mail, Phone, MapPin, User } from "lucide-react";

const HERO_IMG = "/docuBg.jpg";

// Document options
const DOCUMENT_OPTIONS = [
    { value: "baptism", label: "Certificate of Baptism" },
    { value: "confirmation", label: "Certificate of Confirmation" },
    { value: "marriage", label: "Certificate of Marriage" },
    { value: "first-communion", label: "Certificate of First Communion" },
    { value: "death", label: "Certificate of Death/Burial" },
    { value: "membership", label: "Certificate of Membership" },
    { value: "other", label: "Other (specify in purpose)" },
];

export default function DocumentRequestPage() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        documentTypes: [],
        purpose: "",
        copies: "1",
        additionalInfo: "",
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData((prev) => {
            const updated = checked
                ? [...prev.documentTypes, value]
                : prev.documentTypes.filter((v) => v !== value);
            return { ...prev, documentTypes: updated };
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const errors = [];
        if (!formData.fullName.trim()) errors.push("Full name is required.");
        if (!formData.email.trim()) errors.push("Email is required.");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            errors.push("Please enter a valid email address.");
        if (!formData.phone.trim()) errors.push("Contact number is required.");
        if (!formData.documentTypes.length)
            errors.push("Please select at least one document type.");
        if (!formData.purpose.trim()) errors.push("Purpose is required.");
        if (!formData.copies || formData.copies < 1 || formData.copies > 10)
            errors.push("Copies must be between 1 and 10.");
        return errors;
    };

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
                document_types: formData.documentTypes,
                purpose: formData.purpose,
                copies: parseInt(formData.copies, 10),
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
                documentTypes: [],
                purpose: "",
                copies: "1",
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

                    <div className="bg-amber-50 border-l-4 border-amber-700 text-amber-800 p-4 mb-8 text-sm">
                        Please allow 3–5 business days for processing. For urgent requests,
                        contact the parish office directly at{" "}
                        <span className="font-semibold">(+63) 966 854 8848</span>.
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Personal Info */}
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

                        {/* Document Request */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">
                                Document Request
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type of Document <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {DOCUMENT_OPTIONS.map((doc) => (
                                            <label key={doc.value} className="inline-flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    value={doc.value}
                                                    checked={formData.documentTypes.includes(doc.value)}
                                                    onChange={handleCheckboxChange}
                                                    className="form-checkbox h-4 w-4 text-blue-600"
                                                />
                                                <span className="text-gray-700 text-sm">{doc.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Purpose of Request <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., For employment, wedding requirements, school enrollment, etc."
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/60 focus:outline-none min-h-[100px]"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Number of Copies <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        name="copies"
                                        min="1"
                                        value={formData.copies}
                                        onChange={handleChange}
                                        required
                                    />
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
