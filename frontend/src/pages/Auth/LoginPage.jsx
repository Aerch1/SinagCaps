"use client"
import { useState, useEffect } from "react"
import { Mail, Lock, Loader } from 'lucide-react'
import { Link, useNavigate } from "react-router-dom"
import Input from "../../components/input.jsx"
import { useAuthStore } from "../../store/authStore.js"
import ErrorAlert from "../../components/ErrorAlert.jsx"
import SuccessAlert from "../../components/SuccessAlert.jsx"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const { login, isLoading, error, message, clearError, clearMessage, clearAll } = useAuthStore()

  // ✅ Clear any existing errors/messages when component mounts
  useEffect(() => {
    clearAll()
  }, [clearAll])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const userData = await login(email, password)
      if (userData) {
        if (!userData.isVerified) {
          navigate("/verify-email")
          return
        }
        if (userData?.role === "admin") {
          navigate("/admin")
        } else {
          navigate("/")
        }
      }
    } catch (error) {
      // Error is handled in authStore
    }
  }

  return (
    <div className="min-h-screen bg-[url('/test3.jpg')] bg-cover bg-center flex items-center justify-center p-2 sm:p-4">
      {/* Main Wrapper - Centered Container */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-4xl bg-gray-800 bg-opacity-95  backdrop-filter backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[500px] md:min-h-[550px]">

          {/* Left Side - Image Section */}
          <div className="hidden md:flex md:w-1/2 bg-[url('src/assets/hero2.png')] bg-cover bg-center relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-end p-8 text-white">
              <h1 className="text-3xl lg:text-4xl text-pr font-bold text-center mb-4">
                Welcome Back
              </h1>
              <p className="text-lg lg:text-xl text-center text-gray-200 leading-relaxed">
                Access your OLOPGV account to continue your academic journey
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full md:w-1/2 flex flex-col min-h-[500px] md:min-h-auto">
            <div className="flex-1 p-6 sm:p-8 md:p-8 flex flex-col justify-center">

              {/* Mobile Logo - Only shown on small screens */}
              <div className="flex justify-center mb-2">
                <img src="/logo.png" alt="OLOPGV Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>

              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl text-center font-bold mb-2 text-white  bg-clip-text">
                  OLOPGV LOGIN
                </h2>
                <p className="text-gray-400 text-sm">
                  Please enter your credentials to access your account
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
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

                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#710000] hover:text-[#500000] hover:underline transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                <ErrorAlert error={error} onClose={clearError} />
                <SuccessAlert message={message} onClose={clearMessage} />

                <button
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#710000] to-[#500000] text-white font-medium rounded-lg shadow-lg hover:from-[#600000] hover:to-[#400000] focus:outline-none focus:ring-2 focus:ring-[#710000] focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02]"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : "Sign In"}
                </button>
              </form>
            </div>

            {/* Bottom Section */}
            <div className="px-6 sm:px-8 md:px-12 py-4 sm:py-6 bg-gray-900 bg-opacity-50 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-[#710000] font-medium hover:text-[#500000] hover:underline transition-colors duration-200"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage;