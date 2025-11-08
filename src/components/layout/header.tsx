
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Ticket, Menu } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useApp } from "@/context/app-context";

export function Header() {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');
  const { toggleSidebar } = useApp();

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
              <Avatar className="h-10 w-10">
                {userAvatar && (
                    <AvatarImage 
                        src={userAvatar.imageUrl} 
                        alt={userAvatar.description}
                        data-ai-hint={userAvatar.imageHint}
                    />
                )}
                <AvatarFallback>
                    <User />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/login">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    </header>
  );
}
