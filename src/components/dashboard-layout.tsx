
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
  ShieldCheck,
  AlertTriangle
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
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { useEffect, useState, useMemo } from "react"

const navigation = [
  { name: "Cockpit", href: "/dashboard", icon: LayoutDashboard, roles: ["Directeur", "Professeur", "Élève", "Super Administrateur"] },
  { name: "Élèves", href: "/eleves", icon: Users, roles: ["Directeur", "Professeur"] },
  { name: "Enseignants", href: "/enseignants", icon: UserSquare2, roles: ["Directeur"] },
  { name: "Statistiques", href: "/statistiques", icon: BarChart3, roles: ["Directeur", "Professeur"] },
  { name: "Classement", href: "/classement", icon: Trophy, roles: ["Directeur", "Professeur"] },
  { name: "Discipline", href: "/discipline", icon: ShieldAlert, roles: ["Directeur", "Professeur", "Élève"] },
  { name: "Paiements", href: "/paiements", icon: CreditCard, roles: ["Directeur", "Élève"] },
  { name: "IA & Bulletins", href: "/feedback", icon: Sparkles, roles: ["Directeur", "Professeur"] },
  { name: "Messagerie", href: "/messagerie", icon: MessageSquare, roles: ["Directeur", "Professeur", "Élève"] },
  { name: "Emploi du temps", href: "/agenda", icon: Calendar, roles: ["Directeur", "Professeur", "Élève"] },
  { name: "Examens", href: "/examens", icon: History, roles: ["Directeur", "Professeur"] },
  { name: "Documents", href: "/documents", icon: FileText, roles: ["Directeur", "Professeur", "Élève"] },
  { name: "Paramètres", href: "/settings", icon: Settings, roles: ["Directeur"] },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState("Utilisateur")
  const [userRole, setUserRole] = useState("")
  const [isAuthorized, setIsAuthorized] = useState(true)

  useEffect(() => {
    const savedName = localStorage.getItem('acadex_user_name')
    const savedRole = localStorage.getItem('acadex_user_role') || "Élève"
    
    setUserName(savedName || "Utilisateur")
    setUserRole(savedRole)

    // Strict URL Protection
    const currentNav = navigation.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    if (currentNav && !currentNav.roles.includes(savedRole)) {
      setIsAuthorized(false)
      toast({
        variant: "destructive",
        title: "Accès non autorisé",
        description: "Vous n'avez pas les permissions pour accéder à cet espace.",
      })
      router.push("/dashboard")
    } else {
      setIsAuthorized(true)
    }
  }, [pathname, router])

  const filteredNavigation = useMemo(() => {
    return navigation.filter(item => {
      if (userRole === "Super Administrateur") return true
      return item.roles.includes(userRole)
    })
  }, [userRole])

  const handleLogout = () => {
    localStorage.removeItem('acadex_user_name')
    localStorage.removeItem('acadex_user_role')
    localStorage.removeItem('acadex_user_classes')
    toast({
      title: "Déconnexion",
      description: "À bientôt sur ACADEX !",
    })
    router.push("/login")
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="size-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto shadow-xl">
            <AlertTriangle className="size-12" />
          </div>
          <h1 className="text-4xl font-black text-foreground">Accès Interdit</h1>
          <p className="text-muted-foreground font-medium">Votre rôle ({userRole}) ne vous permet pas d'accéder à cette section de l'établissement.</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-primary rounded-2xl h-12 px-8 font-bold">
            Retourner au Cockpit
          </Button>
        </div>
      </div>
    )
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
                  Menu {userRole}
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
            <div className="px-4 py-4 bg-white/5 rounded-2xl mb-4 border border-white/10">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Session Sécurisée</span>
              </div>
            </div>
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
              <div className="text-lg font-black text-foreground">
                Bonjour Monsieur <span className="text-primary italic">{userName}</span>
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
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{userRole}</p>
                    </div>
                    <Avatar className="size-12 border-2 border-primary/10 group-hover:border-primary transition-all shadow-md">
                      <AvatarImage src={`https://picsum.photos/seed/${userName}/200/200`} />
                      <AvatarFallback className="bg-primary text-white font-black">{userName[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mt-4 rounded-3xl p-3 shadow-2xl border-none">
                  <DropdownMenuItem asChild className="rounded-2xl h-11 px-4 font-bold cursor-pointer">
                    <Link href="/settings">Paramètres du compte</Link>
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
