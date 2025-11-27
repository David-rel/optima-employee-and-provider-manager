"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { FiHome, FiUsers, FiSettings, FiDollarSign } from "react-icons/fi";
import type { IconType } from "react-icons";

type NavItem = {
  label: string;
  href: string;
  icon: IconType;
};

const navigationItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: FiHome },
  { label: "People", href: "/people", icon: FiUsers },
  { label: "Settings", href: "/settings", icon: FiSettings },
  { label: "Finance", href: "/finance", icon: FiDollarSign },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      // Force light mode for main content - don't apply dark class
      document.documentElement.classList.remove("dark");
    } else {
      // Ensure dark class is removed on mount
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === "true");
    }
  }, []);

  const handleToggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem("sidebarCollapsed", String(newCollapsed));
  };

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    // Force light mode for main content - don't apply dark class
    document.documentElement.classList.remove("dark");
  };

  if (!session?.user) {
    return <>{children}</>;
  }

  const userName = session.user.name;
  const userEmail = session.user.email || "";
  const userInitials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  const profileImageUrl = session.user.image || null;
  const roleLabel = session.user.role
    ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1)
    : "User";

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar - hidden on mobile when menu is closed */}
      <div
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } fixed inset-0 z-40 bg-black/50 lg:hidden`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside
        className={`${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto lg:w-auto`}
      >
        <Sidebar
          companyName="Optima Medical"
          roleLabel={roleLabel}
          logoPath="/optima.png"
          theme={theme}
          navigationItems={navigationItems}
          collapsed={collapsed}
          onToggle={handleToggleSidebar}
        />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          companyName="Optima Medical"
          roleLabel={roleLabel}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          userName={userName || null}
          userEmail={userEmail}
          userInitials={userInitials}
          profileImageUrl={profileImageUrl}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
