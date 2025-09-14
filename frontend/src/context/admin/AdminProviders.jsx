// src/context/admin/AdminProviders.jsx
import { SidebarProvider } from "./SidebarContext";

export default function AdminProviders({ children }) {
    return (
        <SidebarProvider defaultExpanded={true}>
            {children}
        </SidebarProvider>
    );
}
