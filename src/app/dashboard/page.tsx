
'use client';

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Clock, 
  ShieldAlert, 
  FileDown, 
  GraduationCap, 
  Calendar, 
  Trophy, 
  BookOpen,
  Sparkles,
  ChevronRight,
  AlertCircle,
  BrainCircuit,
  MessageSquare,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useMemo } from "react"
import { jsPDF } from "jspdf"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function DashboardPage() {
  const [userName, setUserName] = useState("Utilisateur")
  const [userRole, setUserRole] = useState("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const role = localStorage.getItem('acadex_user_role') || "Directeur"
      const name = localStorage.getItem('acadex_user_name') || "Utilisateur"
      const classesStr = localStorage.getItem('acadex_user_classes') || "[]"
      
      setUserName(name)
      setUserRole(role)
      setUserClasses(JSON.parse(classesStr))
      setMounted(true)
    } catch (e) {
      console.error("Erreur chargement dashboard:", e)
      setMounted(true)
    }
  }, [])

  const stats = useMemo(() => {
    if (!userRole) return []
    const role = userRole.toLowerCase()
    
    if (role === "directeur" || role === "super administrateur") {
      return [
        { title: "Présence Profs", value: "24/29", change: "En poste", trend: "up", icon: UserCheck },
        { title: "Moyenne École", value: "13.2", change: "+0.4", trend: "up", icon: GraduationCap },
        { title: "Trésorerie", value: "84.2M", sub: "FCFA", change: "84%", trend: "up", icon: CreditCard },
        { title: "Vigilance", value: "2", change: "Alertes", trend: "down", icon: ShieldAlert },
      ]
    } else if (role === "enseignant" || role === "professeur") {
      return [
        { title: "Statut Pointage", value: "Validé", change: "07:54", trend: "up", icon: Clock },
        { title: "Moyenne Classes", value: "13.8", change: "+0.5", trend: "up", icon: TrendingUp },
        { title: "Heures / Sem", value: "18h", change: "Validé", trend: "up", icon: BookOpen },
        { title: "Prochain Cours", value: "08:00", change: "Salle 12", trend: "up", icon: Calendar },
      ]
    } else {
      return [
        { title: "Ma Moyenne", value: "15.42", change: "+0.8", trend: "up", icon: GraduationCap },
        { title: "Mon Rang", value: "4ème", change: "Classe", trend: "up", icon: Trophy },
        { title: "Scolarité", value: "À jour", change: "Payé", trend: "up", icon: CreditCard },
        { title: "Absences", value: "2", change: "Total", trend: "down", icon: Clock },
      ]
    }
  }, [userRole])

  if (!mounted) return null

  const isDirector = userRole.toLowerCase() === "directeur" || userRole.toLowerCase() === "super administrateur"

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 animate-in">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
            <Sparkles className="size-3 fill-primary" />
            ACADEX • {userRole}
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
              Bienvenue Monsieur <span className="text-primary italic">{userName.split(' ')[0]}</span>
            </h1>
            <div className="flex items-center gap-2">
              <Button asChild className="flex-1 md:flex-none bg-primary shadow-lg shadow-primary/20 rounded-2xl h-12 px-6 font-bold">
                <Link href="/assistant">
                  <Sparkles className="mr-2 size-4 fill-white" />
                  Cerveau ACADEX
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* AI Highlight Card */}
        <Card className="border-none shadow-xl bg-foreground text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="size-20 bg-primary/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10">
              <BrainCircuit className="size-10 text-primary" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-black italic">"Posez-moi une question sur votre école."</h3>
              <p className="text-white/60 font-medium">Je connais vos notes, vos présences et vos statistiques en temps réel.</p>
            </div>
            <Button asChild variant="secondary" className="rounded-2xl h-14 px-10 font-black text-lg">
              <Link href="/assistant">Lancer l'Assistant</Link>
            </Button>
          </div>
          <Sparkles className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>

        {/* Attendance Alerts for Director */}
        {isDirector && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-amber-50 rounded-3xl p-6 border-l-8 border-amber-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-2xl text-white">
                  <Clock className="size-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-amber-900">3 Retards ce matin</h4>
                  <p className="text-xs text-amber-700 font-bold">Les cours de Français (6ème A) ont débuté avec 14min de retard.</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold">
                  <Link href="/presence">Gérer</Link>
                </Button>
              </div>
            </Card>
            <Card className="border-none shadow-sm bg-destructive/5 rounded-3xl p-6 border-l-8 border-destructive">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive rounded-2xl text-white">
                  <UserX className="size-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-destructive">Absence non justifiée</h4>
                  <p className="text-xs text-destructive/70 font-bold">M. Tidjani n'a pas pointé pour son cours de Physique à 10h.</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-destructive hover:bg-destructive/10">
                  <Link href="/presence">Alerter</Link>
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="premium-card p-5 md:p-7 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-muted rounded-xl md:rounded-2xl text-primary">
                  <stat.icon className="size-5 md:size-7" />
                </div>
                <Badge className="rounded-full font-bold text-[8px] md:text-[10px] px-2 py-0.5">
                  {stat.change}
                </Badge>
              </div>
              <div>
                <h3 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl md:text-2xl font-black text-foreground">{stat.value}</span>
                  {stat.sub && <span className="text-[10px] font-black text-muted-foreground">{stat.sub}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
