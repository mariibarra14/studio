
"use client";

import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarOpen } = useApp();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/20">
      <Sidebar />
      <div
        className={cn(
          "flex flex-col transition-[margin-left] duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        )}
      >
        <Header />
        {children}
      </div>
    </div>
  );
}
