"use client"
import { useState } from "react"
import { useAuthStore } from "../../store/authStore.js"
import Input from "../../components/input"
import { ArrowLeft, Loader, Mail } from 'lucide-react'
import { Link } from "react-router-dom"
import ErrorAlert from "../../components/ErrorAlert.jsx"
import SuccessAlert from "../../components/SuccessAlert.jsx"

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)
    const { isLoading, forgotPassword, error, message, clearError, clearMessage } = useAuthStore()

    const handleSubmit = async (e) => {
        e.preventDefault()
        clearError()

        const ok = await forgotPassword(email);   // returns true on success, null on validation fail
        if (!ok) return;                          // stay on the form, show <ErrorAlert>

        setIsSubmitted(true);
    }

    return (
        <div className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
                <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
                    Forgot Password
                </h2>

                {!isSubmitted ? (
                    // ✅ noValidate disables native bubbles even if inputs have constraints
                    <form onSubmit={handleSubmit} noValidate>
                        <p className="text-gray-300 mb-6 text-center">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <Input
                            icon={Mail}
                            type="email"                      // keep email keyboard; native validation is off due to noValidate
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <ErrorAlert error={error} onClose={clearError} />

                        <button
                            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader className="size-6 animate-spin mx-auto" /> : "Send Reset Link"}
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="h-8 w-8 text-white" />
                        </div>
                        <SuccessAlert message={message} onClose={clearMessage} />
                    </div>
                )}
            </div>

            <div className="px-8 py-4 bg-gray-900 bg-opacity-50 flex justify-center">
                <Link to={"/login"} className="text-sm text-green-400 hover:underline flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
                </Link>
            </div>
        </div>
    )
}

export default ForgotPasswordPage
