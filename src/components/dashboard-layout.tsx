
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
  MessageSquare,
  BarChart3,
  BookOpen,
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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Cockpit", href: "/dashboard", icon: LayoutDashboard, roles: ["Directeur", "Enseignant", "Professeur", "Élève", "Super Administrateur"] },
  { name: "Élèves", href: "/eleves", icon: Users, roles: ["Directeur", "Enseignant", "Professeur"] },
  { name: "Enseignants", href: "/enseignants", icon: UserSquare2, roles: ["Directeur"] },
  { name: "Statistiques", href: "/statistiques", icon: BarChart3, roles: ["Directeur"] },
  { name: "Classement", href: "/classement", icon: Trophy, roles: ["Directeur", "Enseignant", "Professeur"] },
  { name: "Discipline", href: "/discipline", icon: ShieldAlert, roles: ["Directeur", "Enseignant", "Professeur", "Élève"] },
  { name: "Paiements", href: "/paiements", icon: CreditCard, roles: ["Directeur", "Élève"] },
  { name: "IA & Bulletins", href: "/feedback", icon: Sparkles, roles: ["Directeur", "Enseignant", "Professeur"] },
  { name: "Messagerie", href: "/messagerie", icon: MessageSquare, roles: ["Directeur", "Enseignant", "Professeur", "Élève"] },
  { name: "Agenda", href: "/agenda", icon: Calendar, roles: ["Directeur", "Enseignant", "Professeur", "Élève"] },
  { name: "Examens", href: "/examens", icon: History, roles: ["Directeur", "Enseignant", "Professeur"] },
  { name: "Documents", href: "/documents", icon: FileText, roles: ["Directeur", "Enseignant", "Professeur", "Élève"] },
  { name: "Paramètres", href: "/settings", icon: Settings, roles: ["Directeur"] },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState("Utilisateur")
  const [userRole, setUserRole] = useState("")
  const [userId, setUserId] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem('acadex_user_name')
    const savedRole = localStorage.getItem('acadex_user_role') || "Élève"
    const savedId = localStorage.getItem('acadex_user_id') || ""
    
    setUserName(savedName || "Utilisateur")
    setUserRole(savedRole)
    setUserId(savedId)
    setMounted(true)

    const currentNav = navigation.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    if (currentNav) {
      const hasPermission = currentNav.roles.some(role => 
        role.toLowerCase() === savedRole.toLowerCase() || 
        (savedRole.toLowerCase() === "super administrateur") ||
        (savedRole.toLowerCase() === "directeur")
      )
      if (!hasPermission) {
        router.push("/dashboard")
      }
    }
  }, [pathname, router])

  const filteredNavigation = useMemo(() => {
    if (!userRole) return []
    return navigation.filter(item => {
      if (userRole.toLowerCase() === "super administrateur" || userRole.toLowerCase() === "directeur") return true
      return item.roles.some(role => role.toLowerCase() === userRole.toLowerCase())
    })
  }, [userRole])

  const handleLogout = () => {
    localStorage.clear()
    router.push("/login")
  }

  if (!mounted) return null

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
                  Espace {userRole}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-2">
                    {filteredNavigation.map((item) => (
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
              <span>Quitter</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-20 flex h-24 items-center justify-between bg-white/80 backdrop-blur-xl px-10 border-b border-border/40">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="md:hidden" />
              <div className="flex flex-col">
                <div className="text-lg font-black text-foreground">
                  Bonjour Monsieur <span className="text-primary italic">{userName}</span>
                </div>
                {userId && (
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <ShieldAlert className="size-3" />
                    ID OFFICIEL : {userId}
                  </div>
                )}
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
                      <p className="text-base font-black text-foreground group-hover:text-primary transition-colors">{userName}</p>
                      <div className="flex items-center justify-end gap-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{userRole}</p>
                        {userId && <Badge variant="outline" className="text-[8px] h-4 py-0 font-black border-primary/20 text-primary">{userId}</Badge>}
                      </div>
                    </div>
                    <Avatar className="size-12 border-2 border-primary/10 group-hover:border-primary transition-all shadow-md">
                      <AvatarImage src={`https://picsum.photos/seed/${userName}/200/200`} />
                      <AvatarFallback className="bg-primary text-white font-black">{userName[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mt-4 rounded-3xl p-3 shadow-2xl border-none">
                  <DropdownMenuLabel className="px-4 py-3">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Identité Connectée</p>
                    <p className="font-black text-foreground">{userName}</p>
                    <p className="text-[10px] font-bold text-primary">{userId}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-2xl h-11 px-4 font-bold cursor-pointer">
                    <Link href="/settings">Mon profil & Sécurité</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-2xl h-11 px-4 font-black cursor-pointer">
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
