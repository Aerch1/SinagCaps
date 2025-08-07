"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "../../store/authStore.js"
import { useNavigate, useParams } from "react-router-dom"
import Input from "../../components/input.jsx"
import { Lock } from 'lucide-react'
import ErrorAlert from "../../components/ErrorAlert.jsx"
import SuccessAlert from "../../components/SuccessAlert.jsx"

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { resetPassword, isLoading, error, message, clearError, clearMessage, clearAll, setError } = useAuthStore()
  const { token } = useParams()
  const navigate = useNavigate()

  // Clear any existing errors/messages when component mounts
  useEffect(() => {
    clearAll()
  }, [clearAll])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side validation
    if (!password) {
      setError("Please enter a new password")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (!confirmPassword) {
      setError("Please confirm your password")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      await resetPassword(token, password)
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (error) {
      // Error is handled in authStore
    }
  }

  return (
    <div className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit}>
          <Input
            icon={Lock}
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <ErrorAlert error={error} onClose={clearError} />
          <SuccessAlert message={message} onClose={clearMessage} />

          <button
            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage;
