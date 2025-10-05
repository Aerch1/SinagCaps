"use client";
import { useState } from "react";
import HeroBanner from "@/components/section/HeroBanner";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input"; // ✅ Reusable input
import { Mail, Phone, MapPin, User } from "lucide-react"; // example icons

const HERO_IMG = "/forgot.jpg";

export default function DocumentRequestPage() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        documentType: "",
        purpose: "",
        copies: "1",
        sacramentDate: "",
        sacramentPlace: "",
        additionalInfo: "",
    });

    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log("📨 Document Request Submitted:", formData);

        toast.success("Your document request has been submitted!");
        setShowSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });

        setFormData({
            fullName: "",
            email: "",
            phone: "",
            address: "",
            documentType: "",
            purpose: "",
            copies: "1",
            sacramentDate: "",
            sacramentPlace: "",
            additionalInfo: "",
        });

        setTimeout(() => setShowSuccess(false), 5000);
    };

    return (
        <main className="bg-gray-50 min-h-screen">
            <HeroBanner title="Document Request Form" imageSrc={HERO_IMG} />

            <section className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* ✅ Success Message */}
                    {showSuccess && (
                        <div className="mb-6 bg-green-50 border border-green-400 text-green-700 rounded-md p-4 text-center text-sm font-medium">
                            Thank you! Your document request has been submitted successfully.
                            We will contact you within 3–5 business days.
                        </div>
                    )}

                    {/* ⚠️ Info Box */}
                    <div className="bg-amber-50 border-l-4 border-amber-700 text-amber-800 p-4 mb-8 text-sm">
                        Please allow 3–5 business days for processing. For urgent requests,
                        contact the parish office directly at{" "}
                        <span className="font-semibold">(123) 456-7890</span>.
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* =============================
                PERSONAL INFO
            ============================= */}
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
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="09XX XXX XXXX"
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

                        {/* =============================
                DOCUMENT REQUEST
            ============================= */}
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
                                        <option value="confirmation">
                                            Certificate of Confirmation
                                        </option>
                                        <option value="marriage">Certificate of Marriage</option>
                                        <option value="first-communion">
                                            Certificate of First Communion
                                        </option>
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
                            </div>
                        </div>

                        {/* =============================
                SACRAMENTAL INFO
            ============================= */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
                                Sacramental Information
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Fill in information related to the requested document
                            </p>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Sacrament (if known)
                                    </label>
                                    <Input
                                        type="date"
                                        name="sacramentDate"
                                        value={formData.sacramentDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Place of Sacrament
                                    </label>
                                    <Input
                                        type="text"
                                        name="sacramentPlace"
                                        value={formData.sacramentPlace}
                                        onChange={handleChange}
                                        placeholder="Parish name"
                                    />
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
                                    placeholder="Any other details that may help us locate your records"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/60 focus:outline-none min-h-[100px]"
                                ></textarea>
                            </div>
                        </div>

                        {/* =============================
                SUBMIT BUTTON
            ============================= */}
                        <button
                            type="submit"
                            className="w-full bg-secondary text-white py-3.5 rounded-md text-sm font-semibold hover:bg-secondary/90 transition"
                        >
                            Submit Request
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}
