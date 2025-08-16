import { Link } from "react-router-dom";

export default function Step4ReviewSubmit({ formData }) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Review Your Appointment Request</h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                    <h4 className="font-medium mb-2">Service Details</h4>
                    <p><strong>Service:</strong> {formData.serviceType}</p>
                    <p><strong>Date:</strong> {formData.preferredDate}</p>
                    <p><strong>Time:</strong> {formData.preferredTime}</p>
                </div>

                <div>
                    <h4 className="font-medium mb-2">Personal Information</h4>
                    <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Phone:</strong> {formData.phone}</p>
                </div>

                <div>
                    <h4 className="font-medium mb-2">Additional Details</h4>
                    <p><strong>Purpose:</strong> {formData.purpose}</p>
                    <p><strong>Number of People:</strong> {formData.numberOfPeople}</p>
                    <p><strong>Urgent:</strong> {formData.isUrgent ? "Yes" : "No"}</p>
                    {formData.additionalNotes && <p><strong>Notes:</strong> {formData.additionalNotes}</p>}
                </div>

                <label className="flex items-start">
                    <input type="checkbox" checked={formData.agreeToTerms} disabled className="h-4 w-4 mt-1" />
                    <span className="ml-2 text-sm">
                        I have read and agree to the&nbsp;
                        <Link to="/appointments/general-info" className="text-emerald-600 underline">
                            general information and terms
                        </Link>
                    </span>
                </label>
            </div>
        </div>
    );
}
