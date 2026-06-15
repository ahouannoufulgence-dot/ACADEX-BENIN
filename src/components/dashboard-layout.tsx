
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
  MessageSquare,
  PenTool,
  BarChart3,
  ChevronDown,
  History,
  ClipboardList,
  Layers,
  CalendarDays,
  TrendingUp,
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import placeholderData from "@/app/lib/placeholder-images.json"

const navigationConfig = {
  Directeur: [
    { name: "Dashboard", href: "/dashboard/directeur", icon: LayoutDashboard },
    { name: "Promotions", href: "/promotions", icon: Layers },
    { name: "Plannings", href: "/agenda", icon: CalendarDays },
    { name: "Statistiques", href: "/statistiques", icon: BarChart3 },
    { name: "Vie Scolaire", href: "/vie-scolaire", icon: ClipboardList },
    { name: "Élèves", href: "/eleves", icon: Users },
    { name: "Identifiants", href: "/eleves/identifiants", icon: Zap },
    { name: "Enseignants", href: "/enseignants", icon: UserSquare2 },
    { name: "Notes", href: "/notes", icon: PenTool },
    { name: "Trésorerie", href: "/paiements", icon: CreditCard },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
    { name: "Assistant IA", href: "/assistant", icon: Sparkles, isIA: true },
    { name: "Archives", href: "/archives", icon: History },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ],
  Enseignant: [
    { name: "Dashboard", href: "/dashboard/enseignant", icon: LayoutDashboard },
    { name: "Vie Scolaire", href: "/vie-scolaire", icon: ClipboardList },
    { name: "Mon Planning", href: "/disponibilites", icon: CalendarDays },
    { name: "Mes Classes", href: "/eleves", icon: Users },
    { name: "Saisie Notes", href: "/notes", icon: PenTool },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
    { name: "Assistant IA", href: "/assistant", icon: Sparkles, isIA: true },
  ],
  Élève: [
    { name: "Mon Cockpit", href: "/dashboard/eleve", icon: LayoutDashboard },
    { name: "Ma Progression", href: "/dashboard/eleve/progression", icon: TrendingUp },
    { name: "Cahier de Vie", href: "/vie-scolaire", icon: ClipboardList },
    { name: "Mon Planning", href: "/dashboard/eleve/agenda", icon: CalendarDays },
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

  const heroImage = placeholderData.placeholderImages.find(img => img.id === "hero-students-class")

  const showBackground = useMemo(() => {
    const immersivePages = [
      '/dashboard/eleve',
      '/dashboard/directeur',
      '/dashboard/enseignant',
      '/dashboard',
      '/login',
      '/'
    ];
    return immersivePages.includes(pathname);
  }, [pathname]);

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role')
    const name = localStorage.getItem('acadex_user_name')
    const id = localStorage.getItem('acadex_user_id')
    const savedYear = localStorage.getItem('acadex_active_year')
    
    if (!role && pathname !== '/login' && pathname !== '/' && !pathname.startsWith('/register')) {
      router.replace("/login")
      return
    }

    setUserRole(role)
    setUserName(name || "Monsieur")
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
  }, [router, db, pathname])

  const handleYearChange = (year: string) => {
    setActiveYear(year)
    localStorage.setItem('acadex_active_year', year)
    window.dispatchEvent(new CustomEvent('acadex_year_changed', { detail: year }))
  }

  const menuItems = useMemo(() => {
    if (!userRole) return []
    return (navigationConfig as any)[userRole] || []
  }, [userRole])

  const handleLogout = () => {
    localStorage.clear()
    router.replace("/login")
  }

  if (!mounted) return null

  if (!userRole && (pathname === '/login' || pathname === '/' || pathname.startsWith('/register'))) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F8FAFC] relative overflow-hidden">
        {showBackground && (
          <div className="fixed inset-0 z-0">
            <Image 
              src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-students-happy/1920/1080"}
              alt="Professional Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/65" />
          </div>
        )}

        <Sidebar className="border-none shadow-2xl flex-shrink-0 z-40" collapsible="icon">
          <SidebarHeader className="h-18 md:h-24 flex items-center px-4 bg-primary overflow-hidden">
            <Link href="/dashboard" className="flex items-center gap-3 w-full">
              <div className="size-9 md:size-11 bg-white rounded-xl md:rounded-[0.8rem] flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                {schoolInfo.logo ? (
                  <img src={schoolInfo.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-primary font-black text-lg md:text-2xl">{schoolInfo.name[0]}</span>
                )}
              </div>
              <span className="text-base md:text-xl font-black text-white tracking-tight uppercase line-clamp-1 group-data-[collapsible=icon]:hidden">{schoolInfo.name}</span>
            </Link>
          </SidebarHeader>
          <ScrollArea className="flex-1 bg-primary">
            <SidebarContent className="px-2 py-4 md:py-6">
              <SidebarGroup>
                <SidebarGroupLabel className="text-white/40 font-black px-4 py-4 uppercase tracking-[0.25em] text-[9px] group-data-[collapsible=icon]:hidden">
                  COCKPIT {userRole?.toUpperCase()}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 md:gap-2">
                    {menuItems.map((item: any) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          className={`group transition-all duration-300 h-10 md:h-12 rounded-xl md:rounded-2xl px-4 ${
                            pathname === item.href 
                              ? "bg-white/20 text-white shadow-lg" 
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                          tooltip={item.name}
                        >
                          <Link href={item.href}>
                            <item.icon className={cn("size-4 md:size-4.5 shrink-0", pathname === item.href ? "text-white" : "text-white/50")} />
                            <span className="font-bold text-[11px] md:text-sm tracking-wide group-data-[collapsible=icon]:hidden">{item.name}</span>
                            {item.isIA && (
                              <Badge className="ml-auto bg-amber-400 text-[7px] font-black h-3.5 px-1 rounded-sm text-black group-data-[collapsible=icon]:hidden animate-pulse">IA</Badge>
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
          <SidebarFooter className="p-3 md:p-4 bg-primary">
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-white/50 hover:text-white hover:bg-white/10 gap-3 px-4 h-10 md:h-12 rounded-xl font-bold">
              <LogOut className="size-4 md:size-5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden text-[11px] md:text-sm uppercase tracking-widest">Déconnexion</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-transparent">
          <header className="sticky top-0 z-30 flex h-14 md:h-20 items-center justify-between bg-white/85 backdrop-blur-xl px-4 md:px-7 border-b border-border/40 shadow-sm">
            <div className="flex items-center gap-3 md:gap-5">
              <SidebarTrigger className="text-primary hover:bg-primary/5 size-9 md:size-11 rounded-xl border-2 border-primary/10 transition-all mobile-touch-target" />
              
              <div className="flex flex-col ml-1">
                <h2 className="text-xs md:text-lg font-black text-foreground truncate max-w-[110px] md:max-w-none uppercase tracking-tight">
                  {userName}
                </h2>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[7px] md:text-[9px] font-black border-primary/20 text-primary px-1.5 h-3.5 md:h-5 uppercase tracking-tighter">{userId}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 md:h-12 rounded-xl border-2 border-primary/10 bg-white hover:bg-primary/5 font-black flex items-center gap-2 px-3 md:px-5 transition-all text-[9px] md:text-sm mobile-touch-target shadow-sm">
                    <Calendar className="size-3 md:size-4 text-primary" />
                    <span>{activeYear}</span>
                    <ChevronDown className="size-2 md:size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl border-2 p-1.5 shadow-2xl">
                  {availableYears.map((year) => (
                    <DropdownMenuItem key={year} onClick={() => handleYearChange(year)} className={cn("p-3 rounded-xl font-bold cursor-pointer text-xs md:text-sm", activeYear === year ? "bg-primary text-white" : "hover:bg-muted")}>
                      {year}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Avatar className="size-8 md:size-11 border-2 border-primary/10 shadow-sm mobile-touch-target">
                <AvatarFallback className="bg-primary text-white font-black text-[10px] md:text-base uppercase">{userName[0]}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-transparent relative">
            <div className="relative z-10 safe-area-bottom p-4 md:p-10">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
