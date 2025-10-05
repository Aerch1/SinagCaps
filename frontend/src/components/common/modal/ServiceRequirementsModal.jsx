"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ServiceRequirementsModal({ open, onClose, service }) {
    if (!service) return null;

    const requirementsMap = {
        wedding: [
            "Baptismal and Confirmation Certificates (both parties, for marriage purposes)",
            "Marriage License (from the Civil Registrar)",
            "Pre-Cana Seminar Certificate",
            "List of Principal Sponsors (Ninongs/Ninangs)",
            "Recent ID Photos of couple",
        ],
        baptism: [
            "Birth Certificate of the Child",
            "Parents’ Marriage Certificate (if married)",
            "Baptismal Seminar Attendance Certificate",
            "List of Godparents (must be confirmed Catholics)",
        ],
        rcia: [
            "Filled-out RCIA Registration Form",
            "Birth Certificate (PSA copy)",
            "Certificate of No Baptism (if applicable)",
            "Sponsor’s Endorsement Letter",
        ],
        confirmation: [
            "Baptismal Certificate (with annotation ‘For Confirmation’)",
            "Certificate of Catechism/Preparation Seminar",
            "Sponsor’s Confirmation Certificate",
            "Recent ID Photo",
        ],
        "first-commune": [
            "Baptismal Certificate",
            "Attendance in First Communion Preparation Class",
            "Recent ID Photo",
        ],
        confession: [
            "Personal appearance required (no documents needed)",
            "Maintain a spirit of repentance and readiness for confession",
        ],
        anointing: [
            "Patient’s Full Name and Address",
            "Contact Number of Family Representative",
            "Brief Description of Condition or Hospital Details",
        ],
        funeral: [
            "Death Certificate",
            "Burial Permit (if applicable)",
            "Information of Deceased (Full Name, Age, Address)",
            "Schedule of Wake or Interment",
        ],
        intentions: [
            "Intentions Form (Mass Offering)",
            "Name(s) of the person(s) for whom prayers are offered",
            "Preferred date/time (subject to availability)",
        ],
        blessings: [
            "Full Name and Contact Number",
            "Address or Location for Blessing",
            "Type of Blessing (home, car, business, articles)",
            "Schedule Preference (subject to priest availability)",
        ],
    };

    const list = requirementsMap[service] || [];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="capitalize text-lg font-semibold">
                        {service.replace("-", " ")} Requirements
                    </DialogTitle>
                </DialogHeader>

                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
                    {list.map((req, i) => (
                        <li key={i}>{req}</li>
                    ))}
                </ul>

                <p className="text-xs text-gray-500 mt-4">
                    Note: Bring both original and photocopy of each document during verification.
                </p>
            </DialogContent>
        </Dialog>
    );
}
