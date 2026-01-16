
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";
import {
  Calendar,
  BarChart2,
  Ticket,
  Menu,
  Settings,
  User,
  CreditCard,
  ClipboardList,
  ConciergeBell,
  LayoutDashboard,
  Building,
  Users,
  PieChart,
} from "lucide-react";
import { usePathname } from 'next/navigation';
import { useTranslation } from "react-i18next";

type NavLink = {
  href: string;
  icon: React.ElementType;
  labelKey: string;
  roles: string[];
  subItems?: NavLink[];
};

const navLinks: NavLink[] = [
  // Common
  { href: "/profile", icon: User, labelKey: "nav.profile", roles: ["usuario_final", "organizador", "soporte_tecnico", "administrador"]},
  { href: "/settings", icon: Settings, labelKey: "nav.settings", roles: ["usuario_final", "organizador", "soporte_tecnico", "administrador"]},
  
  // usuario_final
  { href: "/events", icon: Calendar, labelKey: "nav.events", roles: ["usuario_final", "administrador"]},
  { href: "/bookings", icon: ClipboardList, labelKey: "nav.my_bookings", roles: ["usuario_final", "administrador"]},
  { href: "/payments", icon: CreditCard, labelKey: "nav.my_payments", roles: ["usuario_final", "administrador"]},
  { href: "/complementary-services", icon: ConciergeBell, labelKey: "nav.comp_services", roles: ["usuario_final"]},
  { href: "/community", icon: Users, labelKey: "nav.community", roles: ["usuario_final", "organizador"], },
  { href: "/surveys", icon: PieChart, labelKey: "nav.surveys", roles: ["usuario_final", "organizador"], },

  // organizador
  { href: "/events/my", icon: Calendar, labelKey: "nav.my_events", roles: ["organizador", "administrador"]},
  { href: "/services/my", icon: ConciergeBell, labelKey: "nav.my_services", roles: ["organizador", "administrador"]},
  { href: "/payments/history", icon: CreditCard, labelKey: "nav.payments_history", roles: ["organizador", "administrador"]},
  { href: "/venues", icon: Building, labelKey: "nav.venues", roles: ["organizador", "administrador"]},
  { href: "/reports", icon: BarChart2, labelKey: "nav.reports", roles: ["organizador", "soporte_tecnico", "administrador"]},
  
  // soporte_tecnico
  { href: "/control-panel", icon: LayoutDashboard, labelKey: "nav.control_panel", roles: ["soporte_tecnico", "administrador"]},
];


const NavItem = ({ link, isSidebarOpen }: { link: NavLink; isSidebarOpen: boolean }) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isActive = pathname === link.href;

  return (
    <li>
      <Link
        href={link.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-primary/10 text-primary",
          !isSidebarOpen && "justify-center"
        )}
      >
        <link.icon className="h-5 w-5" />
        <span className={cn(!isSidebarOpen && "hidden")}>{t(link.labelKey)}</span>
      </Link>
    </li>
  );
};


export function Sidebar() {
  const { isSidebarOpen, toggleSidebar, userRole, isLoadingUser } = useApp();
  const pathname = usePathname();

  const filteredNavLinks = navLinks.filter(link => 
    link.roles.includes(userRole || "") || (userRole === 'administrador')
  );

  const mainNav = filteredNavLinks.filter(l => !["/profile", "/settings"].includes(l.href));
  const footerNav = filteredNavLinks.filter(l => ["/profile", "/settings"].includes(l.href));


  return (
    <>
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-background border-r transition-transform md:translate-x-0",
          isSidebarOpen ? "w-64" : "w-20",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div
            className={cn(
              "flex items-center border-b h-14",
              isSidebarOpen ? "justify-between px-4" : "justify-center"
            )}
          >
            <Link href="/profile" className={cn("flex items-center gap-2 font-semibold", !isSidebarOpen && "hidden")}>
              <Ticket className="h-6 w-6 text-primary" />
              <span className="">VivoPass</span>
            </Link>
             <div className={cn("flex items-center", isSidebarOpen && "hidden")}>
                <Ticket className="h-6 w-6 text-primary" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden md:flex"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-4">
             {isLoadingUser ? (
                <div className="space-y-2 px-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-8 w-full bg-muted rounded animate-pulse" />
                    ))}
                </div>
             ) : (
                <ul className="space-y-2">
                    {mainNav.map((link) => (
                      <NavItem key={link.href} link={link} isSidebarOpen={isSidebarOpen} />
                    ))}
                </ul>
             )}
          </nav>
          <div className="mt-auto border-t p-2">
             <ul className="space-y-1">
                {footerNav.map((link) => (
                    <NavItem key={link.href} link={link} isSidebarOpen={isSidebarOpen} />
                ))}
              </ul>
          </div>
        </div>
      </aside>
       {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
    </>
  );
}
