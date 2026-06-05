"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2,
  Trophy, 
  CreditCard, 
  Sparkles, 
  Calendar, 
  Settings, 
  LogOut,
  Bell,
  MessageSquare,
  BarChart3,
  BookOpen,
  Clock,
  Archive,
  PenTool,
  UserCheck,
  Palette,
  GraduationCap,
  TrendingUp,
  FileText,
  ShieldCheck,
  Shapes
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
import { cn } from "@/lib/utils"
import { doc, onSnapshot } from "firebase/firestore"
import { useFirestore } from "@/firebase"

const navigationConfig = {
  Directeur: [
    { name: "Dashboard", href: "/dashboard/directeur", icon: LayoutDashboard },
    { name: "Élèves", href: "/eleves", icon: Users },
    { name: "Enseignants", href: "/enseignants", icon: UserSquare2 },
    { name: "Classes", href: "/classes", icon: Shapes },
    { name: "Matières", href: "/matieres", icon: BookOpen },
    { name: "Gestion des Notes", href: "/notes", icon: PenTool },
    { name: "Présence Enseignants", href: "/presence", icon: UserCheck },
    { name: "Absences Élèves", href: "/absences", icon: FileText },
    { name: "Paiements", href: "/paiements", icon: CreditCard },
    { name: "Emplois du Temps", href: "/disponibilites", icon: Clock },
    { name: "Archives", href: "/archives", icon: Archive },
    { name: "Personnalisation", href: "/personalisation", icon: Palette },
    { name: "Assistant Brain", href: "/assistant", icon: Sparkles, isIA: true },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ],
  Enseignant: [
    { name: "Tableau de Bord", href: "/dashboard/enseignant", icon: LayoutDashboard },
    { name: "Mes Classes", href: "/eleves", icon: Users },
    { name: "Mes Matières", href: "/matieres", icon: BookOpen },
    { name: "Gestion des Notes", href: "/notes", icon: PenTool },
    { name: "Absences Élèves", href: "/absences", icon: FileText },
    { name: "Mes Heures de Cours", href: "/disponibilites", icon: Clock },
    { name: "Mon Emploi du Temps", href: "/agenda", icon: Calendar },
    { name: "Ma Présence", href: "/presence", icon: UserCheck },
    { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
    { name: "Assistant ACADEX", href: "/assistant", icon: Sparkles, isIA: true },
  ],
  Élève: [
    { name: "Mon Tableau de Bord", href: "/dashboard/eleve", icon: LayoutDashboard },
    { name: "Mes Notes", href: "/eleves/profile", icon: GraduationCap },
    { name: "Ma Progression", href: "/statistiques", icon: TrendingUp },
    { name: "Mes Absences", href: "/absences", icon: Clock },
    { name: "Mon Emploi du Temps", href: "/agenda", icon: Calendar },
    { name: "Mes Paiements", href: "/paiements", icon: CreditCard },
    { name: "Messages", href: "/messagerie", icon: MessageSquare },
    { name: "Assistant Personnel", href: "/assistant", icon: Sparkles, isIA: true },
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
  const [schoolName, setSchoolName] = useState("ACADEX")
  const [schoolLogo, setSchoolLogo] = useState("")

  useEffect(() => {
    try {
      const savedName = localStorage.getItem('acadex_user_name')
      const savedRole = localStorage.getItem('acadex_user_role')
      const savedId = localStorage.getItem('acadex_user_id')
      
      if (!savedRole) {
        router.push("/login")
        return
      }

      setUserName(savedName || "Utilisateur")
      setUserRole(savedRole)
      setUserId(savedId || "INV-000")
      setMounted(true)

      const unsubscribe = onSnapshot(doc(db, "school_settings", "main_config"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSchoolName(data.schoolName || "ACADEX")
          setSchoolLogo(data.logoUrl || "")
        }
      })
      return () => unsubscribe()
    } catch (e) {
      setMounted(true)
    }
  }, [router, db])

  const menuItems = useMemo(() => {
    if (!userRole) return []
    return (navigationConfig as any)[userRole] || []
  }, [userRole])

  const handleLogout = () => {
    localStorage.clear()
    router.push("/login")
  }

  if (!mounted || !userRole) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F8FAFC]">
        {/* DESKTOP SIDEBAR */}
        <Sidebar className="hidden md:flex border-none shadow-2xl flex-shrink-0" collapsible="none">
          <SidebarHeader className="h-24 flex items-center px-8 bg-primary">
            <Link href={`/dashboard/${userRole.toLowerCase()}`} className="flex items-center gap-3">
              <div className="size-11 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-primary font-black text-2xl">{schoolName[0]}</span>
                )}
              </div>
              <span className="text-xl font-black text-white tracking-tight uppercase line-clamp-1">{schoolName}</span>
            </Link>
          </SidebarHeader>
          <ScrollArea className="flex-1 bg-primary">
            <SidebarContent className="px-4 py-6">
              <SidebarGroup>
                <SidebarGroupLabel className="text-white/40 font-black px-4 py-4 uppercase tracking-[0.2em] text-[10px]">
                  ESPACE {userRole.toUpperCase()}
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
                            <item.icon className={cn("size-5 transition-transform group-hover:scale-110", pathname === item.href ? "text-white" : "text-white/50")} />
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
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className="w-full justify-start text-white/50 hover:text-white hover:bg-white/10 gap-3 px-4 h-12 rounded-2xl font-bold"
            >
              <LogOut className="size-5" />
              <span>Déconnexion</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0 pb-20 md:pb-0">
          <header className="sticky top-0 z-30 flex h-20 md:h-24 items-center justify-between bg-white/80 backdrop-blur-xl px-6 md:px-10 border-b border-border/40">
            <div className="flex flex-col">
              <h2 className="text-base md:text-lg font-black text-foreground">
                Bonjour <span className="text-primary italic">{userName.split(' ')[0]}</span>
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">{userId}</Badge>
                <span className="text-[8px] font-bold text-muted-foreground uppercase">{userRole}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-8">
              <div className="relative p-2 text-muted-foreground hover:text-primary transition-all bg-muted/30 rounded-xl">
                <Bell className="size-5 md:size-6" />
                <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full ring-2 ring-white" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-3 hover:bg-transparent px-0 group">
                    <Avatar className="size-10 md:size-12 border-2 border-primary/10 shadow-sm">
                      <AvatarImage src={`https://picsum.photos/seed/${userName}/200/200`} />
                      <AvatarFallback className="bg-primary text-white font-black">{userName[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-3xl p-3 shadow-2xl border-none">
                  <DropdownMenuLabel className="px-4 py-3">
                    <p className="text-xs font-black text-muted-foreground uppercase mb-1">PROFIL</p>
                    <p className="font-black text-foreground">{userName}</p>
                    <p className="text-[10px] font-bold text-primary">{userId}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 rounded-2xl h-11 px-4 font-black">
                    <LogOut className="size-4 mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#F8FAFC]">
            <div className="mx-auto max-w-7xl w-full pb-10">
              {children}
            </div>
          </main>

          {/* MOBILE BOTTOM NAV */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-border/40 safe-area-bottom">
            <div className="flex justify-around items-center h-16">
              {menuItems.slice(0, 4).map((item: any) => {
                const isActive = pathname === item.href
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full relative",
                      isActive ? "text-primary scale-110" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className={cn("size-6", isActive ? "fill-primary/10" : "")} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.name.split(' ')[0]}</span>
                    {isActive && <div className="absolute top-0 size-1 bg-primary rounded-full" />}
                  </Link>
                )
              })}
            </div>
          </nav>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
