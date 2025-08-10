"use client"
import Input from "../../components/input.jsx"
import { Loader, Lock, Mail, User } from 'lucide-react'
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import PasswordStrengthMeter from "../../components/PasswordStrengthMeter.jsx"
import { useAuthStore } from "../../store/authStore.js"
import ErrorAlert from "../../components/ErrorAlert.jsx"
import SuccessAlert from "../../components/SuccessAlert.jsx"

const SignUpPage = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const { signup, error, isLoading, message, clearError, clearMessage, clearAll } = useAuthStore()

  useEffect(() => {
    clearAll()
  }, [clearAll])

  const handleSignUp = async (e) => {
    e.preventDefault()
    try {
      const result = await signup(email, password, name)
      if (result) {
        navigate("/verify-email")
      }
    } catch (error) { }
  }

  return (
    <div className="min-h-screen bg-[url('/test3.jpg')] bg-cover bg-center flex items-center justify-center p-2 sm:p-4">
      {/* Main Wrapper */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-5xl bg-gray-800 bg-opacity-95 backdrop-filter backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[420px] md:min-h-[460px]">

          {/* Left Side */}
          <div className="hidden md:flex md:w-1/2 bg-[url('src/assets/hero2.png')] bg-cover bg-center relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-end p-6 text-white">
              <h1 className="text-2xl lg:text-3xl font-bold text-center mb-3">
                Join OLOPGV
              </h1>
              <p className="text-base lg:text-lg text-center text-gray-200 leading-relaxed">
                Create your account to start your academic journey
              </p>
            </div>
          </div>

          {/* Right Side */}
          <div className="w-full md:w-1/2 flex flex-col min-h-[420px] md:min-h-auto">
            <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col justify-center">

              {/* Mobile Logo */}
              <div className="flex justify-center mb-2">
                <img src="/logo.png" alt="OLOPGV Logo" className="w-14 h-14 sm:w-16 sm:h-16" />
              </div>

              <div className="mb-5 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl text-center font-bold mb-1 text-white">
                  OLOPGV SIGN UP
                </h2>
                <p className="text-gray-400 text-sm text-center">
                  Create your account with your details below
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                <Input
                  icon={User}
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  icon={Mail}
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  icon={Lock}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <ErrorAlert error={error} onClose={clearError} />
                <SuccessAlert message={message} onClose={clearMessage} />

                <PasswordStrengthMeter password={password} />

                <button
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#710000] to-[#500000] text-white font-medium rounded-lg shadow-lg hover:from-[#600000] hover:to-[#400000] focus:outline-none focus:ring-2 focus:ring-[#710000] focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02]"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : "Create Account"}
                </button>
              </form>
            </div>

            {/* Bottom Section */}
            <div className="px-5 sm:px-6 md:px-10 py-3 sm:py-4 bg-gray-900 bg-opacity-50 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
