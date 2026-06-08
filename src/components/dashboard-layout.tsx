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
  Zap,
  BarChart3,
  ChevronDown,
  History,
  ClipboardList,
  PanelLeft,
  Menu
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
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { doc, onSnapshot } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import placeholderData from "@/app/lib/placeholder-images.json"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigationConfig = {
  Directeur: [
    { name: "Dashboard", href: "/dashboard/directeur", icon: LayoutDashboard },
    { name: "Statistiques", href: "/statistiques", icon: BarChart3 },
    { name: "Vie de l’Élève", href: "/vie-scolaire", icon: ClipboardList },
    { name: "Élèves", href: "/eleves", icon: Users },
    { name: "Enseignants", href: "/enseignants", icon: UserSquare2 },
    { name: "Notes", href: "/notes", icon: PenTool },
    { name: "Trésorerie", href: "/paiements", icon: CreditCard },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
    { name: "Assistant IA", href: "/assistant", icon: Sparkles, isIA: true },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ],
  Enseignant: [
    { name: "Dashboard", href: "/dashboard/enseignant", icon: LayoutDashboard },
    { name: "Vie Scolaire", href: "/vie-scolaire", icon: ClipboardList },
    { name: "Mes Classes", href: "/eleves", icon: Users },
    { name: "Saisie Notes", href: "/notes", icon: PenTool },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
    { name: "Assistant IA", href: "/assistant", icon: Sparkles, isIA: true },
  ],
  Élève: [
    { name: "Mon Cockpit", href: "/dashboard/eleve", icon: LayoutDashboard },
    { name: "Cahier de Vie", href: "/vie-scolaire", icon: ClipboardList },
    { name: "Mes Notes", href: "/dashboard/eleve/notes", icon: PenTool },
    { name: "Paiements", href: "/dashboard/eleve/paiements", icon: CreditCard },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
    { name: "Assistant", href: "/assistant", icon: Sparkles, isIA: true },
  ]
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const db = useFirestore()
  const [userName, setUserName] = useState("Directeur")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState("")
  const [mounted, setMounted] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX", logo: "" })
  const [availableYears, setAvailableYears] = useState<string[]>(["2026-2027"])
  const [activeYear, setActiveYear] = useState("2026-2027")

  const bgImage = placeholderData.placeholderImages.find(img => img.id === "hero-students")

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role')
    const name = localStorage.getItem('acadex_user_name')
    const id = localStorage.getItem('acadex_user_id')
    const savedYear = localStorage.getItem('acadex_active_year')
    
    if (!role) {
      router.replace("/login")
      return
    }

    setUserName(name || "Monsieur")
    setUserRole(role)
    setUserId(id || "INV-000")
    setActiveYear(savedYear || "2026-2027")
    setMounted(true)

    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setSchoolInfo({ name: data.schoolName || "ACADEX", logo: data.logoUrl || "" })
        if (data.availableYears) setAvailableYears(data.availableYears)
      }
    })
    return () => unsub()
  }, [router, db])

  const handleYearChange = (year: string) => {
    setActiveYear(year)
    localStorage.setItem('acadex_active_year', year)
    window.dispatchEvent(new CustomEvent('acadex_year_changed', { detail: year }))
    router.refresh()
  }

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
        <Sidebar className="border-none shadow-2xl flex-shrink-0" collapsible="icon">
          <SidebarHeader className="h-20 md:h-24 flex items-center px-4 bg-primary overflow-hidden">
            <Link href="/dashboard" className="flex items-center gap-3 w-full">
              <div className="size-10 md:size-11 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                {schoolInfo.logo ? (
                  <img src={schoolInfo.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-primary font-black text-xl md:text-2xl">{schoolInfo.name[0]}</span>
                )}
              </div>
              <span className="text-lg md:text-xl font-black text-white tracking-tight uppercase line-clamp-1 group-data-[collapsible=icon]:hidden">{schoolInfo.name}</span>
            </Link>
          </SidebarHeader>
          <ScrollArea className="flex-1 bg-primary">
            <SidebarContent className="px-2 py-4 md:py-6">
              <SidebarGroup>
                <SidebarGroupLabel className="text-white/40 font-black px-4 py-4 uppercase tracking-[0.2em] text-[10px] group-data-[collapsible=icon]:hidden">
                  MENU {userRole.toUpperCase()}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 md:gap-2">
                    {menuItems.map((item: any) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          className={`group transition-all duration-300 h-11 md:h-12 rounded-xl md:rounded-2xl px-4 ${
                            pathname === item.href 
                              ? "bg-white/20 text-white shadow-lg" 
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                          tooltip={item.name}
                        >
                          <Link href={item.href}>
                            <item.icon className={cn("size-5 md:size-6 shrink-0", pathname === item.href ? "text-white" : "text-white/50")} />
                            <span className="font-bold text-xs md:text-sm tracking-wide group-data-[collapsible=icon]:hidden">{item.name}</span>
                            {item.isIA && (
                              <Badge className="ml-auto bg-amber-400 text-[8px] font-black h-4 px-1 rounded-sm text-black group-data-[collapsible=icon]:hidden">IA</Badge>
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
          <SidebarFooter className="p-4 bg-primary">
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-white/50 hover:text-white hover:bg-white/10 gap-3 px-4 h-11 md:h-12 rounded-xl md:rounded-2xl font-bold">
              <LogOut className="size-5 md:size-6 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Déconnexion</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center justify-between bg-white/80 backdrop-blur-xl px-4 md:px-6 border-b border-border/40">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="text-primary hover:bg-primary/5 size-10 md:size-11 rounded-xl border-2 border-primary/10 transition-all mobile-touch-target" />
              
              <div className="flex flex-col ml-1 md:ml-2">
                <h2 className="text-xs md:text-lg font-black text-foreground truncate max-w-[120px] md:max-w-none">
                  {userName}
                </h2>
                <div className="flex items-center gap-1 md:gap-2">
                  <Badge variant="outline" className="text-[7px] md:text-[8px] font-black border-primary/20 text-primary uppercase">{userId}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 md:h-11 rounded-xl border-2 border-primary/10 bg-white hover:bg-primary/5 font-black flex items-center gap-2 px-3 md:px-4 transition-all text-[10px] md:text-sm mobile-touch-target">
                    <Calendar className="size-3 md:size-4 text-primary" />
                    <span>{activeYear}</span>
                    <ChevronDown className="size-2 md:size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-2 p-1 shadow-2xl">
                  {availableYears.map((year) => (
                    <DropdownMenuItem key={year} onClick={() => handleYearChange(year)} className={cn("p-3 rounded-lg font-bold cursor-pointer", activeYear === year ? "bg-primary text-white" : "hover:bg-muted")}>
                      {year}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Avatar className="size-9 md:size-10 border-2 border-primary/10 shadow-sm mobile-touch-target">
                <AvatarFallback className="bg-primary text-white font-black text-xs md:text-sm">{userName[0]}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC] relative">
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none grayscale">
              <Image src={bgImage?.imageUrl || "https://picsum.photos/seed/acadex-bg/1920/1080"} alt="ACADEX Filigree" fill className="object-cover" />
            </div>
            <div className="relative z-10 safe-area-bottom">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}