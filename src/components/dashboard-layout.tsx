
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
    { name: "Gestion des Élèves", href: "/eleves", icon: Users },
    { name: "Identifiants Élèves", href: "/eleves/identifiants", icon: Zap },
    { name: "Corps Enseignant", href: "/enseignants", icon: UserSquare2 },
    { name: "Matières & Coefs", href: "/matieres", icon: Calculator },
    { name: "Gestion des Notes", href: "/notes", icon: PenTool },
    { name: "Trésorerie", href: "/paiements", icon: CreditCard },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
    { name: "Années Scolaires", href: "/archives", icon: History },
    { name: "Assistant Brain", href: "/assistant", icon: Sparkles, isIA: true },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ],
  Enseignant: [
    { name: "Tableau de Bord", href: "/dashboard/enseignant", icon: LayoutDashboard },
    { name: "Mes Classes", href: "/eleves", icon: Users },
    { name: "Gestion des Notes", href: "/notes", icon: PenTool },
    { name: "Mon Programme", href: "/disponibilites", icon: Calendar },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
    { name: "Assistant IA", href: "/assistant", icon: Sparkles, isIA: true },
  ],
  Élève: [
    { name: "Mon Cockpit", href: "/dashboard/eleve", icon: LayoutDashboard },
    { name: "Mes Notes", href: "/dashboard/eleve/notes", icon: PenTool },
    { name: "Ma Progression", href: "/dashboard/eleve/progression", icon: TrendingUp },
    { name: "Mes Absences", href: "/dashboard/eleve/absences", icon: Clock },
    { name: "Mon Emploi du Temps", href: "/dashboard/eleve/agenda", icon: Calendar },
    { name: "Mes Paiements", href: "/dashboard/eleve/paiements", icon: CreditCard },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
    { name: "Assistant ACADEX", href: "/assistant", icon: Sparkles, isIA: true },
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
    
    if (savedYear) {
      setActiveYear(savedYear)
    } else {
      setActiveYear("2026-2027")
      localStorage.setItem('acadex_active_year', "2026-2027")
    }
    
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
    // Dispatch d'un événement personnalisé pour notifier toutes les pages
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
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-foreground">
                  Bonjour <span className="text-primary italic">{userName}</span>
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">{userId}</Badge>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">{userRole}</span>
                </div>
              </div>
              
              <div className="h-10 w-px bg-border/40 hidden sm:block" />
              
              <div className="hidden sm:flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl border-2 border-primary/10 bg-white hover:bg-primary/5 font-black flex items-center gap-3 px-4 transition-all">
                      <Calendar className="size-4 text-primary" />
                      <span className="text-sm">{activeYear}</span>
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 rounded-xl border-2 p-1 shadow-2xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest p-2 border-b">Année Scolaire Active</p>
                    {availableYears.map((year) => (
                      <DropdownMenuItem 
                        key={year} 
                        onClick={() => handleYearChange(year)}
                        className={cn("p-3 rounded-lg font-bold cursor-pointer transition-all", activeYear === year ? "bg-primary text-white" : "hover:bg-muted")}
                      >
                        {year}
                        {activeYear === year && <Badge className="ml-auto bg-white/20 text-[8px]">ACTIVE</Badge>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex sm:hidden">
                 <Badge className="bg-primary text-white font-black">{activeYear}</Badge>
              </div>
              <Avatar className="size-10 border-2 border-primary/10 shadow-sm">
                <AvatarImage src={`https://picsum.photos/seed/${userName}/200/200`} />
                <AvatarFallback className="bg-primary text-white font-black">{userName[0]}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] relative">
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none grayscale">
              <Image 
                src={bgImage?.imageUrl || "https://picsum.photos/seed/acadex-bg/1920/1080"} 
                alt="ACADEX Background Filigree" 
                fill 
                className="object-cover"
                data-ai-hint={bgImage?.imageHint || "smiling students"}
              />
            </div>
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
