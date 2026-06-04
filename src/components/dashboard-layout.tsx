
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  GraduationCap, 
  Calendar, 
  Bell, 
  Search, 
  Settings, 
  LogOut,
  Sparkles,
  FileText,
  CreditCard,
  Menu,
  ChevronRight,
  ShieldAlert,
  Trophy,
  History
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Élèves", href: "/eleves", icon: Users },
  { name: "Classement", href: "/classement", icon: Trophy },
  { name: "Discipline", href: "/discipline", icon: ShieldAlert },
  { name: "Paiements", href: "/paiements", icon: CreditCard },
  { name: "Bulletins & IA", href: "/feedback", icon: Sparkles },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Examens", href: "/examens", icon: History },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Paramètres", href: "/settings", icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-none shadow-2xl flex-shrink-0">
          <SidebarHeader className="h-20 flex items-center px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-2xl">A</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">ACADEX</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-3 overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/40 font-semibold px-4 py-2 uppercase tracking-widest text-[10px]">
                Menu Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        className={`group transition-all duration-200 h-11 ${
                          pathname === item.href 
                            ? "bg-white/10 text-white" 
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-5" />
                          <span className="font-medium">{item.name}</span>
                          {pathname === item.href && (
                            <div className="ml-auto size-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 gap-3 px-3 h-11">
              <LogOut className="size-5" />
              <span className="font-medium">Déconnexion</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-white px-8 border-b border-border/50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="relative hidden lg:block w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Rechercher un élève, une classe..." 
                  className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-full h-11"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <Bell className="size-6" />
                <span className="absolute top-1.5 right-1.5 size-2 bg-destructive rounded-full ring-2 ring-white" />
              </button>
              
              <div className="h-8 w-px bg-border/60" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-3 hover:bg-transparent px-0 h-auto group">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Dr. Koffi Mensah</p>
                      <p className="text-xs text-muted-foreground">Directeur Académique</p>
                    </div>
                    <Avatar className="size-10 border-2 border-primary/10 group-hover:border-primary transition-colors shadow-sm">
                      <AvatarImage src="https://picsum.photos/seed/acadex-avatar/200/200" />
                      <AvatarFallback className="bg-primary text-white">KM</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profil</DropdownMenuItem>
                  <DropdownMenuItem>Messages</DropdownMenuItem>
                  <DropdownMenuItem>Paramètres</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground">Déconnexion</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-8 scroll-smooth bg-[#F8FAFC]">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
