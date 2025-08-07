import { Link } from "react-router-dom"
import { useAuthStore } from "../../store/authStore.js"

const HomePage = () => {
    const { user } = useAuthStore()

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Hero Section */}
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
                    Welcome to <span className="text-green-600">YourApp</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Your one-stop solution for all your needs. Join thousands of satisfied users today.
                </p>
                {!user && (
                    <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        <div className="rounded-md shadow">
                            <Link
                                to="/signup"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10"
                            >
                                Get Started
                            </Link>
                        </div>
                        <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                            <Link
                                to="/login"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Features Section */}
            <div className="mt-20">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="text-center">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white mx-auto">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Fast & Reliable</h3>
                        <p className="mt-2 text-base text-gray-500">Lightning fast performance with 99.9% uptime guarantee.</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white mx-auto">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Secure</h3>
                        <p className="mt-2 text-base text-gray-500">Bank-level security with end-to-end encryption.</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white mx-auto">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">24/7 Support</h3>
                        <p className="mt-2 text-base text-gray-500">Round-the-clock customer support whenever you need help.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage;
