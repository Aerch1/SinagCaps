import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { ChevronDown } from "lucide-react";

export default function PublicLayout() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img src="/logotest1.webp" alt="Logo" className="w-full h-12 object-contain" />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-6 relative">
              <Link to="/" className="text-gray-700 hover:text-secondary transition">
                Home
              </Link>

              {/* Services Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-secondary transition group">
                  <span>Services</span>
                  <ChevronDown className="w-4 h-4 transform transition-transform duration-200 group-hover:rotate-180" />
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-zinc-800 text-white shadow-lg rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-20">
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-white hover:bg-secondary hover:text-white transition "
                  >
                    Service 1
                  </Link>
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-white hover:bg-secondary hover:text-white transition"
                  >
                    Service 2
                  </Link>
                </div>
              </div>

              {/* About Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-secondary transition group">
                  <span>About</span>
                  <ChevronDown className="w-4 h-4 transform transition-transform duration-200 group-hover:rotate-180" />
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-zinc-800 text-white shadow-lg rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-20">
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-white hover:bg-secondary hover:text-white transition"
                  >
                    Our Mission
                  </Link>
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-white hover:bg-secondary hover:text-white transition"
                  >
                    Our Team
                  </Link>
                </div>
              </div>

              <Link to="/contact" className="text-gray-700 hover:text-secondary transition">
                Contact
              </Link>
              <Link to="/event" className="text-gray-700 hover:text-secondary transition">
                Event
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Hi, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-sm transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm text-gray-700 hover:text-green-600 transition"
                  >
                    Login
                  </Link>
                  <button className="bg-secondary hover:bg-secondary text-white px-4 py-2 rounded transition duration-300 ease-in-out">
                    <Link to="/signup">Sign Up</Link>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
