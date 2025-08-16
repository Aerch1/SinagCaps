export default function Step2PersonalInfo({ formData, setFormData }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="px-3 py-2 border rounded-md" />
                <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="px-3 py-2 border rounded-md" />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="px-3 py-2 border rounded-md" />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="px-3 py-2 border rounded-md" />
            </div>

            <textarea
                rows="3"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Complete Address"
                className="px-3 py-2 border rounded-md"
            />
        </div>
    );
}
