
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2,
  CreditCard, 
  Sparkles, 
  Calendar, 
  Settings, 
  LogOut,
  Bell,
  MessageSquare,
  Clock,
  Archive,
  PenTool,
  UserCheck,
  Palette,
  GraduationCap,
  TrendingUp,
  FileText,
  Shapes,
  Calculator,
  Zap
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
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { doc, onSnapshot } from "firebase/firestore"
import { useFirestore } from "@/firebase"

const navigationConfig = {
  Directeur: [
    { name: "Dashboard", href: "/dashboard/directeur", icon: LayoutDashboard },
    { name: "Gestion des Élèves", href: "/eleves", icon: Users },
    { name: "Identifiants Élèves", href: "/eleves/identifiants", icon: Zap },
    { name: "Corps Enseignant", href: "/enseignants", icon: UserSquare2 },
    { name: "Matières & Coefs", href: "/matieres", icon: Calculator },
    { name: "Gestion des Notes", href: "/notes", icon: PenTool },
    { name: "Trésorerie", href: "/paiements", icon: CreditCard },
    { name: "Assistant Brain", href: "/assistant", icon: Sparkles, isIA: true },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ],
  Enseignant: [
    { name: "Tableau de Bord", href: "/dashboard/enseignant", icon: LayoutDashboard },
    { name: "Mes Classes", href: "/eleves", icon: Users },
    { name: "Gestion des Notes", href: "/notes", icon: PenTool },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
  ],
  Élève: [
    { name: "Mon Cockpit", href: "/dashboard/eleve", icon: LayoutDashboard },
    { name: "Ma Progression", href: "/statistiques", icon: TrendingUp },
    { name: "Agenda Scolaire", href: "/agenda", icon: Calendar },
    { name: "Messages", href: "/messagerie", icon: MessageSquare },
  ]
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const db = useFirestore()
  const [userName, setUserName] = useState("Utilisateur")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState("")
  const [mounted, setMounted] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX", logo: "" })

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role')
    const name = localStorage.getItem('acadex_user_name')
    const id = localStorage.getItem('acadex_user_id')
    
    if (!role) {
      router.replace("/login")
      return
    }

    setUserName(name || "Utilisateur")
    setUserRole(role)
    setUserId(id || "INV-000")
    setMounted(true)

    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setSchoolInfo({ name: data.schoolName || "ACADEX", logo: data.logoUrl || "" })
      }
    })
    return () => unsub()
  }, [router, db])

  const menuItems = useMemo(() => {
    if (!userRole) return []
    return (navigationConfig as any)[userRole] || []
  }, [userRole])

  const handleLogout = () => {
    localStorage.clear()
    router.replace("/login")
  }

  if (!mounted || !userRole) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F8FAFC]">
        <Sidebar className="hidden md:flex border-none shadow-2xl flex-shrink-0" collapsible="none">
          <SidebarHeader className="h-24 flex items-center px-8 bg-primary">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="size-11 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                {schoolInfo.logo ? (
                  <img src={schoolInfo.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-primary font-black text-2xl">{schoolInfo.name[0]}</span>
                )}
              </div>
              <span className="text-xl font-black text-white tracking-tight uppercase line-clamp-1">{schoolInfo.name}</span>
            </Link>
          </SidebarHeader>
          <ScrollArea className="flex-1 bg-primary">
            <SidebarContent className="px-4 py-6">
              <SidebarGroup>
                <SidebarGroupLabel className="text-white/40 font-black px-4 py-4 uppercase tracking-[0.2em] text-[10px]">
                  Espace {userRole.toUpperCase()}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-2">
                    {menuItems.map((item: any) => (
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
                            <item.icon className={cn("size-5", pathname === item.href ? "text-white" : "text-white/50")} />
                            <span className="font-bold text-sm tracking-wide">{item.name}</span>
                            {item.isIA && (
                              <Badge className="ml-auto bg-amber-400 text-[8px] font-black h-4 px-1 rounded-sm text-black">IA</Badge>
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
          <SidebarFooter className="p-6 bg-primary">
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-white/50 hover:text-white hover:bg-white/10 gap-3 px-4 h-12 rounded-2xl font-bold">
              <LogOut className="size-5" />
              <span>Déconnexion</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-white/80 backdrop-blur-xl px-6 border-b border-border/40">
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-foreground">
                Bonjour <span className="text-primary italic">{userName.split(' ')[0]}</span>
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">{userId}</Badge>
                <span className="text-[8px] font-bold text-muted-foreground uppercase">{userRole}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="size-10 border-2 border-primary/10 shadow-sm">
                <AvatarImage src={`https://picsum.photos/seed/${userName}/200/200`} />
                <AvatarFallback className="bg-primary text-white font-black">{userName[0]}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
