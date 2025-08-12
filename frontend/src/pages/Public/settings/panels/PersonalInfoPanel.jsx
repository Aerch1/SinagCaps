// src/pages/settings/panels/PersonalInfoPanel.jsx
"use client";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { format, parseISO, isValid as isValidDateFn } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuthStore } from "../../../../store/authStore.js";
import { User as UserIcon, ChevronRight, Info } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const PROFILE_URL = `${API_BASE}/profile`;

function Row({ label, children, hint, error }) {
    return (
        <div className="py-3 px-6">
            <div className="flex items-center gap-4">
                <div className="w-40 shrink-0 text-sm text-gray-600">{label}</div>
                <div className="flex-1">{children}</div>
                {hint ? <Info className="h-4 w-4 text-gray-400" /> : <div className="w-4" />}
            </div>
            <div className="pl-[10.25rem] mt-1 min-h-[18px]">
                {error ? <p className="text-xs text-red-500">{error}</p> : null}
            </div>
        </div>
    );
}

export default function PersonalInfoPanel() {
    const { user, setUser } = useAuthStore();

    // local form state
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [gender, setGender] = useState(user?.gender || "");
    const [location, setLocation] = useState(user?.location || "");
    const [dob, setDob] = useState(() => (user?.dob ? parseISO(String(user.dob)) : null));

    // keep form in sync when `user` changes (after login/check-auth/refresh)
    useEffect(() => {
        setName(user?.name || "");
        setPhone(user?.phone || "");
        setGender(user?.gender || "");
        setLocation(user?.location || "");
        setDob(user?.dob ? parseISO(String(user.dob)) : null);
    }, [user]);

    // errors + save state
    const [nameErr, setNameErr] = useState("");
    const [phoneErr, setPhoneErr] = useState("");
    const [genderErr, setGenderErr] = useState("");
    const [dobErr, setDobErr] = useState("");
    const [locErr, setLocErr] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [saveErr, setSaveErr] = useState("");

    const baseInput =
        "w-full rounded-xl bg-black/5 text-gray-700 p-4 border outline-none transition";
    const okInput = "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
    const errInput = "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100";

    // simple validators
    const validPhone = (v) => /^[0-9()+\-.\s]{7,20}$/.test(v.trim());

    const validate = () => {
        let ok = true;
        setNameErr(""); setPhoneErr(""); setGenderErr(""); setDobErr(""); setLocErr("");
        setSaveErr(""); setSaveMsg("");

        if (!name.trim()) { setNameErr("Please enter your full name."); ok = false; }
        if (!phone.trim()) { setPhoneErr("Please enter your phone number."); ok = false; }
        else if (!validPhone(phone)) { setPhoneErr("Please enter a valid phone number."); ok = false; }

        if (!gender) { setGenderErr("Please select a gender."); ok = false; }

        if (!dob || !isValidDateFn(dob)) { setDobErr("Please select a valid date of birth."); ok = false; }

        if (!location.trim()) { setLocErr("Please enter your location."); ok = false; }

        return ok;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const payload = {
            name: name.trim(),
            phone: phone.trim(),
            gender,
            dob: dob ? format(dob, "yyyy-MM-dd") : "", // ← picker -> DB-safe string
            location: location.trim(),
        };

        setSaving(true);
        setSaveErr(""); setSaveMsg("");
        try {
            const { data } = await axios.post(PROFILE_URL, payload, { withCredentials: true });
            const nextUser = data?.user ? data.user : { ...user, ...payload };
            setUser?.(nextUser);
            setSaveMsg(data?.message || "Changes saved.");
        } catch (e) {
            const msg = e?.response?.data?.message || "Failed to save changes. Please try again.";
            setSaveErr(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-2">
                <div className="overflow-hidden border-gray-200">

                    {/* Profile picture row (upload later) */}
                    <div className="px-6 mt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-100 grid place-items-center overflow-hidden">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-5 w-5 text-gray-500" />
                                    )}
                                </div>
                                <span className="text-gray-700">Profile picture</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="h-px bg-gray-200 mt-5" />
                    </div>

                    {/* Full name */}
                    <Row label="Full name *" hint error={nameErr}>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => setNameErr("")}
                            placeholder="Not set"
                            className={`${baseInput} ${nameErr ? errInput : okInput}`}
                        />
                    </Row>

                    {/* Phone */}
                    <Row label="Phone *" error={phoneErr}>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onFocus={() => setPhoneErr("")}
                            placeholder="Not set"
                            className={`${baseInput} ${phoneErr ? errInput : okInput}`}
                        />
                    </Row>

                    {/* Gender */}
                    <Row label="Gender *" error={genderErr}>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            onFocus={() => setGenderErr("")}
                            className={`${baseInput} ${genderErr ? errInput : okInput}`}
                        >
                            <option value="" disabled>Not set</option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Non-binary</option>
                            <option>Prefer not to say</option>
                        </select>
                    </Row>

                    {/* DOB (DatePicker) */}
                    <Row label="Date of birth *" error={dobErr}>
                        <DatePicker
                            selected={dob}
                            onChange={(d) => { setDob(d); setDobErr(""); }}
                            maxDate={new Date()}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select date"
                            className={`${baseInput} ${dobErr ? errInput : okInput}`}
                            wrapperClassName="w-full"

                        />
                    </Row>

                    {/* Location */}
                    <Row label="Location *" error={locErr}>
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onFocus={() => setLocErr("")}
                            placeholder="Not set"
                            className={`${baseInput} ${locErr ? errInput : okInput}`}
                        />
                    </Row>

                    {/* Save */}
                    <div className="pt-2 pb-6 px-6">
                        {saveErr ? (
                            <p className="text-sm text-red-600 mb-3">{saveErr}</p>
                        ) : saveMsg ? (
                            <p className="text-sm text-green-600 mb-3">{saveMsg}</p>
                        ) : null}

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className={`w-full md:w-64 mx-auto block rounded-xl py-3 font-semibold text-white transition
                ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-black"}`}
                        >
                            {saving ? "Saving…" : "SAVE"}
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
}
