
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";
import {
  Calendar,
  BarChart2,
  MessageSquare,
  Ticket,
  Menu,
  Home,
  Settings,
  LogOut,
} from "lucide-react";

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useApp();

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
            <Link href="/home" className={cn("flex items-center gap-2 font-semibold", !isSidebarOpen && "hidden")}>
              <Ticket className="h-6 w-6 text-primary" />
              <span className="">VivoPass</span>
            </Link>
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
            <ul className="space-y-2">
              <li>
                <Link
                  href="/home"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    !isSidebarOpen && "justify-center"
                  )}
                >
                  <Home className="h-5 w-5" />
                  <span className={cn(!isSidebarOpen && "hidden")}>Home</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    !isSidebarOpen && "justify-center"
                  )}
                >
                  <Calendar className="h-5 w-5" />
                  <span className={cn(!isSidebarOpen && "hidden")}>Events</span>
                </Link>
              </li>
               <li>
                <Link
                  href="#"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    !isSidebarOpen && "justify-center"
                  )}
                >
                  <BarChart2 className="h-5 w-5" />
                  <span className={cn(!isSidebarOpen && "hidden")}>Reports</span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    !isSidebarOpen && "justify-center"
                  )}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className={cn(!isSidebarOpen && "hidden")}>Forums</span>
                </Link>
              </li>
            </ul>
          </nav>
          <div className="mt-auto border-t p-2">
             <Link
                href="/profile"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  !isSidebarOpen && "justify-center"
                )}
              >
                <Settings className="h-5 w-5" />
                <span className={cn(!isSidebarOpen && "hidden")}>Settings</span>
              </Link>
              <Link
                  href="/login"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    !isSidebarOpen && "justify-center"
                  )}
                >
                  <LogOut className="h-5 w-5" />
                  <span className={cn(!isSidebarOpen && "hidden")}>Log out</span>
              </Link>
          </div>
        </div>
      </aside>
       {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        ></div>
      )}
    </>
  );
}
