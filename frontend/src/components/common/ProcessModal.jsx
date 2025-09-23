"use client";

import React, { useState } from "react";

export default function ProcessModal({ appointment, onClose, onSave, onComplete }) {
  // Example requirements (can be dynamic by service type)
  const defaultReqs = {
    Baptism: ["Birth Certificate", "Parent IDs", "Godparent Form"],
    Wedding: ["Marriage License", "Baptism Certificates", "Seminar Attendance"],
    Funeral: ["Death Certificate", "Parish Clearance"],
  };

  const requirements = defaultReqs[appointment.serviceType] || [];
  const [checked, setChecked] = useState({});
  const [priest, setPriest] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Process Appointment</h2>
          <p className="text-sm text-gray-500 mt-1">
            {appointment.name} — {appointment.serviceType} on{" "}
            {appointment.date} at {appointment.time}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Requirements */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Requirements</h3>
            <div className="space-y-2">
              {requirements.map((req) => (
                <label key={req} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={!!checked[req]}
                    onChange={(e) =>
                      setChecked((prev) => ({ ...prev, [req]: e.target.checked }))
                    }
                  />
                  {req}
                </label>
              ))}
            </div>
          </div>

          {/* Assign Priest */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Assign Priest / Staff</h3>
            <select
              className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={priest}
              onChange={(e) => setPriest(e.target.value)}
            >
              <option value="">Select priest/staff</option>
              <option value="fr-jose">Fr. Jose</option>
              <option value="fr-michael">Fr. Michael</option>
              <option value="deacon-juan">Deacon Juan</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Internal Notes</h3>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-gray-300 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for parish records..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onSave({ checked, priest, notes })}
              className="px-4 py-2 rounded-md border text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Save Progress
            </button>
            <button
              onClick={() => onComplete({ checked, priest, notes })}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Mark Completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
