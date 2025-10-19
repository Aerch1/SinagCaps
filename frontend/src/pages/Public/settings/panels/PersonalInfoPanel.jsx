"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useAuthStore } from "../../../../store/authStore.js";
import { Info } from "lucide-react";
import Input from "@/components/ui/Input.jsx";
import DateInput from "@/components/ui/DateInput.jsx";
import Dropdown from "@/components/ui/Dropdown1.jsx";
import api from "@/api/api";

function Row({ label, children, hint }) {
  return (
    <div className="py-3 px-6 transition-colors hover:bg-gray-50">
      <div className="flex items-center gap-4">
        <div className="w-40 shrink-0 text-sm text-gray-600">{label}</div>
        <div className="flex-1">{children}</div>
        {hint ? <Info className="h-4 w-4 text-gray-400" /> : <div className="w-4" />}
      </div>
    </div>
  );
}

export default function PersonalInfoPanel() {
  const { user, setUser } = useAuthStore();

  // Local state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [location, setLocation] = useState(user?.location || "");
  const [dob, setDob] = useState(() =>
    user?.dob ? parseISO(String(user.dob)) : null
  );

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  // Sync when user changes
  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setGender(user?.gender || "");
    setLocation(user?.location || "");
    setDob(user?.dob ? parseISO(String(user.dob)) : null);
  }, [user]);

  // ✅ Save (partial update)
  const handleSave = async () => {
    const payload = {
      ...(name && { name: name.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(gender && { gender }),
      ...(dob && { dob: format(dob, "yyyy-MM-dd") }),
      ...(location && { location: location.trim() }),
    };

    if (Object.keys(payload).length === 0) {
      setSaveErr("Nothing to save yet.");
      return;
    }

    setSaving(true);
    setSaveErr("");
    setSaveMsg("");

    try {
      const { data } = await api.post("/profile", payload);
      const nextUser = data?.user ? data.user : { ...user, ...payload };
      setUser?.(nextUser);
      setSaveMsg(data?.message || "Profile updated successfully.");
    } catch (e) {
      const msg =
        e?.response?.data?.message || "Failed to save changes. Please try again.";
      setSaveErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white">
      <div className="max-w-4xl mx-auto py-2">
        <div className="overflow-hidden border-gray-200">

          {/* Full Name */}
          <Row label="Full name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              className="bg-gray-50 border-gray-200  hover:border-gray-300 focus:bg-white"
            />
          </Row>

          {/* Phone */}
          <Row label="Phone">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              className="bg-gray-50 border-gray-200 hover:border-gray-300 focus:bg-white"
            />
          </Row>

          {/* Gender Dropdown */}
          <Row label="Gender">
            <Dropdown
              value={gender}
              onChange={(val) => setGender(val)}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Prefer not to say", label: "Prefer not to say" },
              ]}
              placeholder="Select gender"
              className="w-full"
            />
          </Row>

          {/* Date of Birth */}
          <Row label="Date of birth">
            <DateInput
              value={dob ? format(dob, "yyyy-MM-dd") : ""}
              onDateChange={(val) => setDob(new Date(val))}
              placeholder="Select date"
              maxYear={new Date().getFullYear()}
            />
          </Row>

          {/* Location */}
          <Row label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              className="bg-gray-50 border-gray-200 hover:border-gray-300 focus:bg-white"
            />
          </Row>

          {/* Save Button */}
          <div className="pt-3 pb-6 px-6">
            {saveErr ? (
              <p className="text-sm text-red-600 mb-3">{saveErr}</p>
            ) : saveMsg ? (
              <p className="text-sm text-green-600 mb-3">{saveMsg}</p>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`w-full md:w-64 mx-auto block rounded-xl py-3 font-semibold text-white transition ${saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-black"
                }`}
            >
              {saving ? "Saving…" : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
