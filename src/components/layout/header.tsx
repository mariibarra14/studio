
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Ticket, Menu, Gem } from "lucide-react";
import { useApp } from "@/context/app-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export function Header() {
  const { toggleSidebar, user, isLoadingUser } = useApp();
  const router = useRouter();

  const handleLogout = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault(); // Prevent the Link from navigating immediately
    
    // Clear local storage and redirect
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('roleId');
    router.push('/login');
  };


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <div className="flex items-center gap-2 md:hidden">
            <Link href="/home" className="flex items-center gap-2 font-semibold">
                <Ticket className="h-6 w-6 text-primary" />
                <span className="">VivoPass</span>
            </Link>
        </div>
      <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              {isLoadingUser ? (
                <Skeleton className="h-10 w-10 rounded-full" />
              ) : (
                <Avatar className="h-10 w-10">
                    <AvatarImage 
                        src={user?.fotoPerfil || undefined}
                        alt={user?.nombre || "User Avatar"}
                    />
                  <AvatarFallback>
                      <User />
                  </AvatarFallback>
                </Avatar>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
             {isLoadingUser ? (
                <div className="p-2">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ) : user ? (
                <>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.nombre} {user.apellido}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.correo}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                         <Gem className="mr-2 h-4 w-4" />
                         <span>{user.nombreRol || user.rol}</span>
                    </DropdownMenuItem>
                </>
            ) : (
                <DropdownMenuLabel>Not logged in</DropdownMenuLabel>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/login" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    </header>
  );
}
