import { SidebarProvider } from "./SidebarContext";
import { ThemeProvider } from "./ThemeContext";

export default function AdminProviders({ children }) {
    return (
        <ThemeProvider storageKey="adminTheme" defaultTheme="light">
            <SidebarProvider defaultExpanded={true}>
                {children}
            </SidebarProvider>
        </ThemeProvider>
    );
}
