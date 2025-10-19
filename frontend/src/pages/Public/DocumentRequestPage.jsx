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
        documentType: "",
        purpose: "",
        copies: "1",
        additionalInfo: "",
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
        if (!formData.documentType.trim())
            errors.push("Please select a document type.");
        if (!formData.purpose.trim()) errors.push("Purpose is required.");
        if (!formData.copies || formData.copies < 1 || formData.copies > 10)
            errors.push("Copies must be between 1 and 10.");

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
                document_type: formData.documentType,
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
                documentType: "",
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
                                        Type of Document <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="documentType"
                                        value={formData.documentType}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/60 focus:outline-none"
                                    >
                                        <option value="">Select a document type</option>
                                        <option value="baptism">Certificate of Baptism</option>
                                        <option value="confirmation">Certificate of Confirmation</option>
                                        <option value="marriage">Certificate of Marriage</option>
                                        <option value="first-communion">Certificate of First Communion</option>
                                        <option value="death">Certificate of Death/Burial</option>
                                        <option value="membership">Certificate of Membership</option>
                                        <option value="other">Other (specify in purpose)</option>
                                    </select>
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
