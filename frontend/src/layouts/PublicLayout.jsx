import { Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
      <Header user={user} onLogout={handleLogout} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

    </div>
  );
}
