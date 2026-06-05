
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
  UserX,
  Target
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
        { title: "Effectif Total", value: "0", change: "Élèves", trend: "up", icon: Users },
        { title: "Moyenne École", value: "0.0", change: "---", trend: "up", icon: GraduationCap },
        { title: "Trésorerie", value: "0", sub: "FCFA", change: "0%", trend: "up", icon: CreditCard },
        { title: "Présence Profs", value: "0/0", change: "Pointage", trend: "up", icon: UserCheck },
      ]
    } else if (role === "enseignant") {
      return [
        { title: "Mes Classes", value: "0", change: "Attribuées", trend: "up", icon: Users },
        { title: "Notes à Saisir", value: "0", change: "Alertes", trend: "down", icon: PenTool },
        { title: "Prochain Cours", value: "--:--", change: "---", trend: "up", icon: Clock },
        { title: "Mon Pointage", value: "---", change: "Statut", trend: "up", icon: UserCheck },
      ]
    } else {
      return [
        { title: "Ma Moyenne", value: "0.00", change: "T1", trend: "up", icon: GraduationCap },
        { title: "Mon Rang", value: "---", change: "Classe", trend: "up", icon: Trophy },
        { title: "Absences", value: "0", change: "Total", trend: "down", icon: Clock },
        { title: "Scolarité", value: "---", change: "Statut", trend: "up", icon: CreditCard },
      ]
    }
  }, [userRole])

  if (!mounted) return null

  const isDirector = userRole.toLowerCase() === "directeur"
  const isTeacher = userRole.toLowerCase() === "enseignant"
  const isStudent = userRole.toLowerCase() === "élève"

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
                  {isStudent ? "Aide IA" : "Cerveau ACADEX"}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ROLE SPECIFIC HIGHLIGHT */}
        <Card className="border-none shadow-xl bg-foreground text-white p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="size-20 bg-primary/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10">
              <BrainCircuit className="size-10 text-primary" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-black italic">
                {isDirector ? "\"Parlez à votre établissement.\"" : isTeacher ? "\"Gérez vos classes avec fluidité.\"" : "\"Suis ta réussite en temps réel.\""}
              </h3>
              <p className="text-white/60 font-medium text-sm md:text-base">
                {isDirector ? "Analyse de notes, absences et paiements en langage naturel." : isTeacher ? "Saisissez les notes et marquez les absences en un clic." : "Consulte tes notes, ton agenda et tes paiements."}
              </p>
            </div>
            <Button asChild variant="secondary" className="w-full md:w-auto rounded-2xl h-14 px-10 font-black text-lg">
              <Link href={isStudent ? "/eleves/profile" : isTeacher ? "/notes" : "/assistant"}>
                {isStudent ? "Voir mes notes" : isTeacher ? "Saisir les notes" : "Lancer l'Assistant"}
              </Link>
            </Button>
          </div>
          <Sparkles className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>

        {/* ALERTS SECTION */}
        {isDirector && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="premium-card p-6 bg-amber-50 border-2 border-amber-200 flex items-center gap-4">
              <div className="size-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <AlertCircle className="size-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-amber-900 text-sm">Notes Manquantes</h4>
                <p className="text-xs text-amber-700 font-bold">3 enseignants n'ont pas encore rempli les notes du T1.</p>
              </div>
              <Button variant="ghost" className="text-amber-700 font-black text-xs">Relancer</Button>
            </Card>
            <Card className="premium-card p-6 bg-emerald-50 border-2 border-emerald-200 flex items-center gap-4">
              <div className="size-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <CreditCard className="size-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-emerald-900 text-sm">Trésorerie</h4>
                <p className="text-xs text-emerald-700 font-bold">27 paiements sont en attente de régularisation.</p>
              </div>
              <Button variant="ghost" className="text-emerald-700 font-black text-xs">Détails</Button>
            </Card>
          </div>
        )}

        {isTeacher && (
           <Card className="premium-card p-8 bg-muted/20 border-2 border-dashed border-muted-foreground/10 text-center">
             <div className="size-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
               <Target className="size-8 text-primary" />
             </div>
             <h4 className="font-black text-foreground">Aujourd'hui</h4>
             <p className="text-sm text-muted-foreground font-medium">Vous n'avez aucun cours programmé pour ce moment.</p>
           </Card>
        )}

        {/* KPI GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="premium-card p-5 md:p-7 flex flex-col justify-between group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-muted rounded-xl md:rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
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

        {/* QUICK ACCESS FOR STUDENTS */}
        {isStudent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Link href="/eleves/profile" className="premium-card p-8 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all">
                <div className="size-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><GraduationCap className="size-8" /></div>
                <h4 className="font-black">Consulter mes notes</h4>
             </Link>
             <Link href="/agenda" className="premium-card p-8 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all">
                <div className="size-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Calendar className="size-8" /></div>
                <h4 className="font-black">Emploi du temps</h4>
             </Link>
             <Link href="/paiements" className="premium-card p-8 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all">
                <div className="size-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><CreditCard className="size-8" /></div>
                <h4 className="font-black">État financier</h4>
             </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
