// src/pages/Admin/Profile.jsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Pencil,
    Save,
    X,
    UploadCloud,
    MapPin,
    Mail,
    Phone,
    User,
    Building2,
    Hash,
    Globe,
    Linkedin,
    Facebook,
    Twitter,
    Instagram,
} from "lucide-react";

/* -----------------------------------
   Seed (replace with data from API)
----------------------------------- */
const SEED = {
    avatarUrl: "",
    firstName: "Archie",
    lastName: "Llamas",
    role: "Admin",
    location: "Lipa CIty",
    email: "test@gmail.com",
    phone: "+63 9019331931",
    bio: "Admin",
    address: {
        country: "ph",
        cityState: "phh.",
        postalCode: "313",
        taxId: "13",
    },
    social: {
        website: "https://your-parish.example",
        linkedin: "https://linkedin.com/in/username",
        facebook: "https://facebook.com/username",
        twitter: "https://x.com/username",
        instagram: "https://instagram.com/username",
    },
};

export default function Profile() {
    const [data, setData] = useState(SEED);

    // edit state per section
    const [editHeader, setEditHeader] = useState(false);
    const [editPersonal, setEditPersonal] = useState(false);
    const [editAddress, setEditAddress] = useState(false);

    // local draft copies while editing
    const [draftHeader, setDraftHeader] = useState(SEED);
    const [draftPersonal, setDraftPersonal] = useState(SEED);
    const [draftAddress, setDraftAddress] = useState(SEED.address);

    const initials = useMemo(() => {
        const a = (data.firstName || "").trim()[0] || "";
        const b = (data.lastName || "").trim()[0] || "";
        return (a + b || "U").toUpperCase();
    }, [data.firstName, data.lastName]);

    const fileRef = useRef(null);

    /* ---------- actions ---------- */
    const saveHeader = () => {
        setData((p) => ({
            ...p,
            firstName: draftHeader.firstName,
            lastName: draftHeader.lastName,
            role: draftHeader.role,
            location: draftHeader.location,
            social: { ...p.social, ...draftHeader.social },
            avatarUrl: draftHeader.avatarUrl,
        }));
        setEditHeader(false);
    };

    const savePersonal = () => {
        setData((p) => ({
            ...p,
            email: draftPersonal.email,
            phone: draftPersonal.phone,
            bio: draftPersonal.bio,
        }));
        setEditPersonal(false);
    };

    const saveAddress = () => {
        setData((p) => ({
            ...p,
            address: { ...draftAddress },
        }));
        setEditAddress(false);
    };

    const onPickFile = () => fileRef.current?.click();
    const onAvatarChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        setDraftHeader((d) => ({ ...d, avatarUrl: url }));
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Page title (matches your other pages) */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Profile
                </h1>
                <p className="mt-1 text-xs md:text-sm text-gray-500 dark:text-slate-400">
                    View and update your personal information. Changes are saved per
                    section.
                </p>
            </div>

            {/* Profile header card */}
            <Card>
                <SectionHeader
                    title="Profile"
                    editing={editHeader}
                    onEdit={() => {
                        setDraftHeader({
                            ...data,
                            social: { ...data.social },
                        });
                        setEditHeader(true);
                    }}
                    onCancel={() => setEditHeader(false)}
                    onSave={saveHeader}
                />

                {/* Content */}
                <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left: avatar & name */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {editHeader ? (
                                    <button
                                        onClick={onPickFile}
                                        className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                        title="Upload avatar"
                                    >
                                        {draftHeader.avatarUrl ? (
                                            <img
                                                src={draftHeader.avatarUrl}
                                                alt="avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span>{initials}</span>
                                        )}
                                        <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white group-hover:flex">
                                            <UploadCloud className="h-4 w-4" />
                                        </span>
                                    </button>
                                ) : data.avatarUrl ? (
                                    <img
                                        src={data.avatarUrl}
                                        alt="avatar"
                                        className="h-16 w-16 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                                        {initials}
                                    </div>
                                )}
                                {editHeader && (
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={onAvatarChange}
                                        className="hidden"
                                    />
                                )}
                            </div>

                            <div>
                                {editHeader ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                            <input
                                                className="h-9 w-40 rounded-md border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                                placeholder="First name"
                                                value={draftHeader.firstName}
                                                onChange={(e) =>
                                                    setDraftHeader((d) => ({
                                                        ...d,
                                                        firstName: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                className="h-9 w-40 rounded-md border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                                placeholder="Last name"
                                                value={draftHeader.lastName}
                                                onChange={(e) =>
                                                    setDraftHeader((d) => ({
                                                        ...d,
                                                        lastName: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <input
                                            className="h-9 w-80 max-w-full rounded-md border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                            placeholder="Role"
                                            value={draftHeader.role}
                                            onChange={(e) =>
                                                setDraftHeader((d) => ({ ...d, role: e.target.value }))
                                            }
                                        />
                                        <input
                                            className="h-9 w-80 max-w-full rounded-md border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                            placeholder="Location"
                                            value={draftHeader.location}
                                            onChange={(e) =>
                                                setDraftHeader((d) => ({
                                                    ...d,
                                                    location: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {data.firstName} {data.lastName}
                                        </div>
                                        <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                                            {data.role} · <span>{data.location}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: socials (read or edit) */}
                        <div className="flex items-center gap-2">
                            {editHeader ? (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <LabeledInput
                                        icon={<Globe className="h-3.5 w-3.5" />}
                                        placeholder="Website"
                                        value={draftHeader.social.website}
                                        onChange={(v) =>
                                            setDraftHeader((d) => ({
                                                ...d,
                                                social: { ...d.social, website: v },
                                            }))
                                        }
                                    />
                                    <LabeledInput
                                        icon={<Linkedin className="h-3.5 w-3.5" />}
                                        placeholder="LinkedIn"
                                        value={draftHeader.social.linkedin}
                                        onChange={(v) =>
                                            setDraftHeader((d) => ({
                                                ...d,
                                                social: { ...d.social, linkedin: v },
                                            }))
                                        }
                                    />
                                    <LabeledInput
                                        icon={<Facebook className="h-3.5 w-3.5" />}
                                        placeholder="Facebook"
                                        value={draftHeader.social.facebook}
                                        onChange={(v) =>
                                            setDraftHeader((d) => ({
                                                ...d,
                                                social: { ...d.social, facebook: v },
                                            }))
                                        }
                                    />
                                    <LabeledInput
                                        icon={<Twitter className="h-3.5 w-3.5" />}
                                        placeholder="X / Twitter"
                                        value={draftHeader.social.twitter}
                                        onChange={(v) =>
                                            setDraftHeader((d) => ({
                                                ...d,
                                                social: { ...d.social, twitter: v },
                                            }))
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <SocialPill href={data.social.website} icon={<Globe />} />
                                    <SocialPill href={data.social.linkedin} icon={<Linkedin />} />
                                    <SocialPill href={data.social.facebook} icon={<Facebook />} />
                                    <SocialPill href={data.social.instagram} icon={<Instagram />} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Personal Information */}
            <Card>
                <SectionHeader
                    title="Personal Information"
                    editing={editPersonal}
                    onEdit={() => {
                        setDraftPersonal({
                            ...data,
                        });
                        setEditPersonal(true);
                    }}
                    onCancel={() => setEditPersonal(false)}
                    onSave={savePersonal}
                />
                <div className="p-5 sm:p-6">
                    {editPersonal ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FieldEdit
                                label="Email address"
                                icon={<Mail className="h-3.5 w-3.5" />}
                                value={draftPersonal.email}
                                onChange={(v) =>
                                    setDraftPersonal((d) => ({ ...d, email: v }))
                                }
                            />
                            <FieldEdit
                                label="Phone"
                                icon={<Phone className="h-3.5 w-3.5" />}
                                value={draftPersonal.phone}
                                onChange={(v) =>
                                    setDraftPersonal((d) => ({ ...d, phone: v }))
                                }
                            />
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                                    Bio
                                </label>
                                <textarea
                                    rows={3}
                                    value={draftPersonal.bio}
                                    onChange={(e) =>
                                        setDraftPersonal((d) => ({ ...d, bio: e.target.value }))
                                    }
                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                />
                            </div>
                        </div>
                    ) : (
                        <GridRead
                            rows={[
                                { label: "First Name", value: data.firstName, icon: <User /> },
                                { label: "Last Name", value: data.lastName, icon: <User /> },
                                { label: "Email address", value: data.email, icon: <Mail /> },
                                { label: "Phone", value: data.phone, icon: <Phone /> },
                                { label: "Bio", value: data.bio, full: true, icon: <User /> },
                            ]}
                        />
                    )}
                </div>
            </Card>

            {/* Address */}
            <Card>
                <SectionHeader
                    title="Address"
                    editing={editAddress}
                    onEdit={() => {
                        setDraftAddress({ ...data.address });
                        setEditAddress(true);
                    }}
                    onCancel={() => setEditAddress(false)}
                    onSave={saveAddress}
                />
                <div className="p-5 sm:p-6">
                    {editAddress ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FieldEdit
                                label="Country"
                                icon={<Building2 className="h-3.5 w-3.5" />}
                                value={draftAddress.country}
                                onChange={(v) =>
                                    setDraftAddress((d) => ({ ...d, country: v }))
                                }
                            />
                            <FieldEdit
                                label="City/State"
                                icon={<MapPin className="h-3.5 w-3.5" />}
                                value={draftAddress.cityState}
                                onChange={(v) =>
                                    setDraftAddress((d) => ({ ...d, cityState: v }))
                                }
                            />
                            <FieldEdit
                                label="Postal Code"
                                icon={<Hash className="h-3.5 w-3.5" />}
                                value={draftAddress.postalCode}
                                onChange={(v) =>
                                    setDraftAddress((d) => ({ ...d, postalCode: v }))
                                }
                            />
                            <FieldEdit
                                label="TAX ID"
                                icon={<Hash className="h-3.5 w-3.5" />}
                                value={draftAddress.taxId}
                                onChange={(v) =>
                                    setDraftAddress((d) => ({ ...d, taxId: v }))
                                }
                            />
                        </div>
                    ) : (
                        <GridRead
                            rows={[
                                { label: "Country", value: data.address.country, icon: <Building2 /> },
                                { label: "City/State", value: data.address.cityState, icon: <MapPin /> },
                                { label: "Postal Code", value: data.address.postalCode, icon: <Hash /> },
                                { label: "TAX ID", value: data.address.taxId, icon: <Hash /> },
                            ]}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}

/* ======= small pieces ======= */

function Card({ children }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {children}
        </div>
    );
}

function SectionHeader({ title, editing, onEdit, onCancel, onSave }) {
    return (
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 sm:px-6 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {title}
            </div>
            <div className="flex items-center gap-2">
                {!editing ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="gap-1 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onCancel}
                            className="gap-1 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={onSave}
                            className="gap-1 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                        >
                            <Save className="h-3.5 w-3.5" />
                            Save
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

function GridRead({ rows }) {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {rows.map((r, idx) => (
                <div key={idx} className={r.full ? "sm:col-span-2" : ""}>
                    <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {r.label}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                        <span className="text-gray-400 dark:text-gray-500">{r.icon}</span>
                        <span>{r.value || "—"}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function FieldEdit({ label, icon, value, onChange }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                {label}
            </label>
            <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">{icon}</span>
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
            </div>
        </div>
    );
}

function LabeledInput({ icon, value, onChange, placeholder }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-gray-400 dark:text-gray-500">{icon}</span>
            <input
                placeholder={placeholder}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-60 max-w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
        </div>
    );
}

function SocialPill({ href, icon }) {
    if (!href) return null;
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            title={href}
        >
            {React.cloneElement(icon, { className: "h-4 w-4" })}
        </a>
    );
}
