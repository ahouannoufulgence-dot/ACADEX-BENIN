"use client"

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
  UserCheck,
  UserX
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"

export default function DashboardPage() {
  const [userName, setUserName] = useState("Utilisateur")
  const [userRole, setUserRole] = useState("")
  const [userId, setUserId] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const role = localStorage.getItem('acadex_user_role') || "Directeur"
      const name = localStorage.getItem('acadex_user_name') || "Utilisateur"
      const id = localStorage.getItem('acadex_user_id') || "INV-000"
      
      setUserName(name)
      setUserRole(role)
      setUserId(id)
      setMounted(true)
    } catch (e) {
      console.error("Erreur chargement cockpit:", e)
      setMounted(true)
    }
  }, [])

  const stats = useMemo(() => {
    if (!userRole) return []
    const role = userRole.toLowerCase()
    
    if (role === "directeur") {
      return [
        { title: "Présence Profs", value: "0/0", change: "Initialisation", trend: "up", icon: UserCheck },
        { title: "Moyenne École", value: "0.0", change: "---", trend: "up", icon: GraduationCap },
        { title: "Trésorerie", value: "0", sub: "FCFA", change: "0%", trend: "up", icon: CreditCard },
        { title: "Vigilance", value: "0", change: "Alertes", trend: "down", icon: ShieldAlert },
      ]
    } else if (role === "enseignant") {
      return [
        { title: "Statut Pointage", value: "---", change: "--:--", trend: "up", icon: Clock },
        { title: "Moyenne Classes", value: "0.0", change: "---", trend: "up", icon: TrendingUp },
        { title: "Heures / Sem", value: "0h", change: "Contrat", trend: "up", icon: BookOpen },
        { title: "Prochain Cours", value: "--:--", change: "---", trend: "up", icon: Calendar },
      ]
    } else {
      return [
        { title: "Ma Moyenne", value: "0.00", change: "---", trend: "up", icon: GraduationCap },
        { title: "Mon Rang", value: "---", change: "Classe", trend: "up", icon: Trophy },
        { title: "Scolarité", value: "Non Payé", change: "Attente", trend: "up", icon: CreditCard },
        { title: "Absences", value: "0", change: "Total", trend: "down", icon: Clock },
      ]
    }
  }, [userRole])

  if (!mounted) return null

  const isDirector = userRole.toLowerCase() === "directeur"

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
            <Sparkles className="size-3 fill-primary" />
            ACADEX • {userRole}
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
              Bienvenue, <span className="text-primary italic">{userName.split(' ')[0]}</span>
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

        {/* IA HIGHLIGHT CARD */}
        <Card className="border-none shadow-xl bg-foreground text-white p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="size-20 bg-primary/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10">
              <BrainCircuit className="size-10 text-primary" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-black italic">"Parlez à votre établissement."</h3>
              <p className="text-white/60 font-medium text-sm md:text-base">Analyse de notes, absences et paiements en langage naturel.</p>
            </div>
            <Button asChild variant="secondary" className="w-full md:w-auto rounded-2xl h-14 px-10 font-black text-lg">
              <Link href="/assistant">Lancer l'Assistant</Link>
            </Button>
          </div>
          <Sparkles className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>

        {/* EMPTY STATE ALERTS FOR DIRECTOR */}
        {isDirector && (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <Card className="border-none shadow-sm bg-muted/20 rounded-3xl p-8 border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-center">
               <div className="size-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                 <AlertCircle className="size-8 text-muted-foreground" />
               </div>
               <h4 className="font-black text-foreground text-lg">Aucune activité récente</h4>
               <p className="text-sm text-muted-foreground font-medium max-w-md">Commencez par inscrire des élèves ou configurer les enseignants pour voir les statistiques s'actualiser ici.</p>
            </Card>
          </div>
        )}

        {/* KPI GRID */}
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
                  {stat.sub && <span className="text-[10px] font-black text-muted-foreground ml-1">{stat.sub}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}