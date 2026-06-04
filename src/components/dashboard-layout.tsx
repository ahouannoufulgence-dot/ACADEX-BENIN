
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2,
  Trophy, 
  ShieldAlert, 
  CreditCard, 
  Sparkles, 
  Calendar, 
  History, 
  FileText, 
  Settings, 
  LogOut,
  Bell,
  Search,
  BookOpen,
  PieChart
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
import { usePathname, useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"

const navigation = [
  { name: "Cockpit Directeur", href: "/dashboard", icon: LayoutDashboard },
  { name: "Élèves", href: "/eleves", icon: Users },
  { name: "Enseignants", href: "/enseignants", icon: UserSquare2 },
  { name: "Classement", href: "/classement", icon: Trophy },
  { name: "Discipline", href: "/discipline", icon: ShieldAlert },
  { name: "Paiements", href: "/paiements", icon: CreditCard },
  { name: "IA & Bulletins", href: "/feedback", icon: Sparkles },
  { name: "Emploi du temps", href: "/agenda", icon: Calendar },
  { name: "Examens", href: "/examens", icon: History },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Paramètres", href: "/settings", icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès. À bientôt !",
    })
    router.push("/login")
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F8FAFC] overflow-hidden">
        <Sidebar className="border-none shadow-2xl flex-shrink-0">
          <SidebarHeader className="h-24 flex items-center px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="size-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary font-black text-2xl">A</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">ACADEX</span>
            </Link>
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent className="px-4 py-6">
              <SidebarGroup>
                <SidebarGroupLabel className="text-white/40 font-black px-4 py-4 uppercase tracking-[0.2em] text-[10px]">
                  Pilotage Établissement
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-2">
                    {navigation.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          className={`group transition-all duration-300 h-12 rounded-2xl px-4 ${
                            pathname === item.href 
                              ? "bg-white/15 text-white shadow-lg" 
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Link href={item.href}>
                            <item.icon className={`size-5 transition-transform group-hover:scale-110 ${pathname === item.href ? "text-white" : "text-white/50"}`} />
                            <span className="font-bold text-sm tracking-wide">{item.name}</span>
                            {pathname === item.href && (
                              <div className="ml-auto size-2 rounded-full bg-white shadow-[0_0_12px_white] animate-pulse" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </ScrollArea>
          <SidebarFooter className="p-6">
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className="w-full justify-start text-white/50 hover:text-white hover:bg-white/10 gap-3 px-4 h-12 rounded-2xl font-bold transition-all"
            >
              <LogOut className="size-5" />
              <span>Quitter ACADEX</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-20 flex h-24 items-center justify-between bg-white/80 backdrop-blur-xl px-10 border-b border-border/40">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="md:hidden" />
              <div className="relative hidden lg:block w-[400px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Recherche globale (Élève, Prof, Reçu...)" 
                  className="pl-12 bg-muted/40 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-[1.25rem] h-12 font-medium text-base shadow-inner"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="relative p-2.5 text-muted-foreground hover:text-primary transition-all cursor-pointer bg-muted/30 rounded-2xl hover:bg-primary/5">
                <Bell className="size-6" />
                <span className="absolute top-2.5 right-2.5 size-2.5 bg-destructive rounded-full ring-4 ring-white" />
              </div>
              
              <div className="h-10 w-px bg-border/80" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-4 hover:bg-transparent px-0 h-auto group">
                    <div className="text-right hidden sm:block space-y-0.5">
                      <p className="text-base font-black text-foreground group-hover:text-primary transition-colors">Dr. Koffi Mensah</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Super Administrateur</p>
                    </div>
                    <Avatar className="size-12 border-2 border-primary/10 group-hover:border-primary transition-all shadow-md">
                      <AvatarImage src="https://picsum.photos/seed/acadex-avatar/200/200" />
                      <AvatarFallback className="bg-primary text-white font-black">KM</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mt-4 rounded-3xl p-3 shadow-2xl border-none">
                  <DropdownMenuLabel className="px-4 py-3">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.1em] mb-1">Session Active</p>
                    <p className="text-sm font-bold">2025 - 2026</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-2 bg-muted/50" />
                  <DropdownMenuItem className="rounded-2xl h-11 px-4 font-bold focus:bg-primary/5 focus:text-primary cursor-pointer">Profil Directeur</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-2xl h-11 px-4 font-bold focus:bg-primary/5 focus:text-primary cursor-pointer">Historique d'Audit</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-2xl h-11 px-4 font-bold focus:bg-primary/5 focus:text-primary cursor-pointer">Changer d'Établissement</DropdownMenuItem>
                  <DropdownMenuSeparator className="mx-2 bg-muted/50" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-2xl h-11 px-4 font-black cursor-pointer"
                  >
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-10 scroll-smooth bg-[#F8FAFC]">
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
