export default function Step3AdditionalDetails({ formData, setFormData }) {
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((p) => ({
            ...p,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Additional Details</h3>

            <textarea
                name="purpose"
                rows="3"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="Purpose / Reason"
                className="px-3 py-2 border rounded-md"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="number"
                    name="numberOfPeople"
                    value={formData.numberOfPeople}
                    onChange={handleChange}
                    min="1"
                    className="px-3 py-2 border rounded-md"
                />

                <label className="flex items-center">
                    <input
                        type="checkbox"
                        name="isUrgent"
                        checked={formData.isUrgent}
                        onChange={handleChange}
                        className="h-4 w-4 text-emerald-600"
                    />
                    <span className="ml-2 text-sm">This is an urgent request</span>
                </label>
            </div>

            <textarea
                name="additionalNotes"
                rows="3"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Additional Notes"
                className="px-3 py-2 border rounded-md"
            />
        </div>
    );
}
