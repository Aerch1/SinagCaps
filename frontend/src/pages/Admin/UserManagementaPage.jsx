"use client";
import { useEffect, useMemo, useState } from "react";
import UserTable from "../../components/common/UserTable";
import api from "@/api/api";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import Dropdown1 from "@/components/ui/Dropdown1"; // ✅ use your existing dropdown

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("user");
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
    });

    const rowsPerPage = 5;

    // Fetch all users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/users");
            const raw = res.data?.users || [];
            const formatted = raw.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                status: u.isVerified ? "Activated" : "Deactivated",
                lastAccess: u.lastLogin
                    ? new Date(u.lastLogin).toLocaleString("en-PH", { hour12: true })
                    : "Never",
            }));
            setUsers(formatted);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filtered = useMemo(() => {
        return users.filter((u) => (tab === "admin" ? u.role === "admin" : u.role === "user"));
    }, [tab, users]);

    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filtered.slice(start, start + rowsPerPage);
    }, [filtered, currentPage]);

    const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

    const handleAction = async (id, action) => {
        const confirmMsg =
            action === "delete"
                ? "Are you sure you want to permanently delete this user?"
                : `Are you sure you want to ${action} this user?`;


        try {
            toast.loading("Processing...");
            if (action === "delete") {
                await api.delete(`/admin/users/${id}`);
            } else {
                await api.patch(`/admin/users/${id}/status`, {
                    status: action === "activate" ? "activated" : "deactivated",
                });
            }
            toast.dismiss();
            toast.success(`User ${action}d successfully`);
            fetchUsers();
        } catch (err) {
            toast.dismiss();
            toast.error("Action failed");
        }
    };

    // ✅ Handle create account
    const handleCreateAccount = async () => {
        if (!newUser.email || !newUser.password) return toast.error("Email and password are required");

        try {
            toast.loading("Creating account...");
            await api.post("/admin/users/create", newUser);
            toast.dismiss();
            toast.success(`${newUser.role === "admin" ? "Admin" : "User"} created successfully`);
            setShowAddModal(false);
            setNewUser({ name: "", email: "", password: "", role: "user" });
            fetchUsers();
        } catch (err) {
            toast.dismiss();
            toast.error(err.response?.data?.message || "Failed to create account");
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-base md:text-lg lg:text-2xl font-bold text-slate-900">
                        User & Admin Management
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">
                        Manage registered users and admin accounts securely.
                    </p>
                </div>

                {/* ✅ Add Account Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
                >
                    + Add Account
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {["user", "admin"].map((key) => (
                    <button
                        key={key}
                        onClick={() => {
                            setTab(key);
                            setCurrentPage(1);
                        }}
                        className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${tab === key
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        {key === "user" ? "Users" : "Admins"}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-white shadow-sm p-3 md:p-4 lg:p-6">
                {loading ? (
                    <p className="text-center text-gray-500 py-6 md:py-8 text-xs md:text-sm">
                        Loading users...
                    </p>
                ) : (
                    <UserTable rows={paginatedRows} onView={() => { }} onAction={handleAction} />
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-3 md:pt-4 border-t border-gray-100 mt-3 md:mt-4 gap-2">
                        <p className="text-xs md:text-sm text-gray-600">
                            Page <span className="font-semibold text-gray-800">{currentPage}</span> of{" "}
                            <span className="font-semibold text-gray-800">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <button
                                onClick={handlePrev}
                                disabled={currentPage === 1}
                                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium border transition-colors ${currentPage === 1
                                    ? "text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-700 border-gray-300 hover:bg-gray-100"
                                    }`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentPage === totalPages}
                                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium border transition-colors ${currentPage === totalPages
                                    ? "text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-700 border-gray-300 hover:bg-gray-100"
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ✅ Add Account Modal */}
            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Account">
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Full Name (optional)"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* ✅ Dropdown1 for Role */}
                    <Dropdown1
                        label="Select Role"
                        options={[
                            { label: "User", value: "user" },
                            { label: "Admin", value: "admin" },
                        ]}
                        value={newUser.role}
                        onChange={(val) => setNewUser({ ...newUser, role: val })}
                    />

                    <div className="flex justify-end gap-2 pt-3">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateAccount}
                            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
