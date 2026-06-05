
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
  AlertCircle
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
        { title: "Effectif", value: "1,248", change: "+12", trend: "up", icon: Users },
        { title: "Pédagogie", value: "94.2%", change: "+2%", trend: "up", icon: TrendingUp },
        { title: "Trésorerie", value: "84.2M", sub: "FCFA", change: "84%", trend: "up", icon: CreditCard },
        { title: "Vigilance", value: "4", change: "Alertes", trend: "down", icon: ShieldAlert },
      ]
    } else if (role === "enseignant" || role === "professeur") {
      return [
        { title: "Mes Élèves", value: "156", change: `${userClasses.length} Cls`, trend: "up", icon: Users },
        { title: "Moyenne", value: "13.8", change: "+0.5", trend: "up", icon: TrendingUp },
        { title: "Heures / Sem", value: "18h", change: "Validé", trend: "up", icon: Clock },
        { title: "Examens", value: "2", change: "Prévus", trend: "up", icon: Calendar },
      ]
    } else {
      return [
        { title: "Ma Moyenne", value: "15.42", change: "+0.8", trend: "up", icon: GraduationCap },
        { title: "Mon Rang", value: "4ème", change: "Classe", trend: "up", icon: Trophy },
        { title: "Scolarité", value: "À jour", change: "Payé", trend: "up", icon: CreditCard },
        { title: "Absences", value: "2", change: "Total", trend: "down", icon: Clock },
      ]
    }
  }, [userRole, userClasses])

  if (!mounted) return null

  const isDirector = userRole.toLowerCase() === "directeur" || userRole.toLowerCase() === "super administrateur"
  const isTeacher = userRole.toLowerCase() === "enseignant" || userRole.toLowerCase() === "professeur"

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
              <Button variant="outline" className="flex-1 md:flex-none border-2 rounded-2xl h-12 font-bold bg-white">
                <FileDown className="mr-2 size-5" />
                Rapport
              </Button>
              {isDirector && (
                <Button asChild className="flex-1 md:flex-none bg-primary shadow-lg shadow-primary/20 rounded-2xl h-12 px-6 font-bold">
                  <Link href="/disponibilites">
                    <Zap className="mr-2 size-4 fill-white" />
                    Planning IA
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Alerts for Director */}
        {isDirector && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-amber-50 rounded-3xl p-6 border-l-8 border-amber-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-2xl text-white">
                  <AlertCircle className="size-6" />
                </div>
                <div>
                  <h4 className="font-black text-amber-900">Disponibilités manquantes</h4>
                  <p className="text-xs text-amber-700 font-bold">3 enseignants n'ont pas encore rempli leur planning.</p>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm bg-destructive/5 rounded-3xl p-6 border-l-8 border-destructive">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive rounded-2xl text-white">
                  <ShieldAlert className="size-6" />
                </div>
                <div>
                  <h4 className="font-black text-destructive">Conflit de planning</h4>
                  <p className="text-xs text-destructive/70 font-bold">Un chevauchement détecté en Salle 12 (Maths vs Français).</p>
                </div>
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
                  <span className="text-xl md:text-3xl font-black text-foreground">{stat.value}</span>
                  {stat.sub && <span className="text-[10px] font-black text-muted-foreground">{stat.sub}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:gap-8 lg:grid-cols-12">
          {isDirector && (
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1 premium-card p-6 md:p-8 bg-foreground text-white">
                <ShieldAlert className="size-8 text-primary mb-4" />
                <h3 className="text-xl font-black mb-2">Sécurité Notes</h3>
                <p className="text-xs text-white/60 mb-6 font-medium">Le 1er Trimestre est ouvert. Surveillez les modifications en temps réel.</p>
                <Button variant="secondary" asChild className="w-full rounded-xl font-black text-xs h-10">
                  <Link href="/settings">Consulter l'Audit</Link>
                </Button>
              </Card>
              <Card className="md:col-span-2 premium-card p-6 md:p-8 flex flex-col justify-center items-center text-center space-y-4">
                <h3 className="text-2xl font-black">Performance Établissement</h3>
                <p className="text-muted-foreground font-medium max-w-sm">Analyse complète des taux de réussite et de recouvrement.</p>
                <Button asChild className="bg-primary rounded-xl h-12 px-8 font-black">
                  <Link href="/statistiques">Voir Intelligence Globale</Link>
                </Button>
              </Card>
            </div>
          )}

          {isTeacher && (
            <div className="lg:col-span-12 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">Mes Classes Actives</h2>
                <Badge variant="outline" className="rounded-full font-black border-primary text-primary">{userClasses.length} CLASSES</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userClasses.length > 0 ? userClasses.map((cls, i) => (
                  <Card key={i} className="premium-card p-6 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <BookOpen className="size-6" />
                      </div>
                      <Badge className="bg-primary font-black px-4">{cls}</Badge>
                    </div>
                    <h4 className="font-black text-lg mb-1">Rapport de Classe</h4>
                    <p className="text-xs text-muted-foreground font-medium">Saisie des notes & Assiduité</p>
                    <Button asChild variant="link" className="p-0 h-auto font-black text-xs text-primary mt-4 group-hover:translate-x-1 transition-transform">
                      <Link href={`/eleves?class=${cls}`}>Gérer la classe <ChevronRight className="size-3 ml-1" /></Link>
                    </Button>
                  </Card>
                )) : (
                  <Card className="col-span-full p-8 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
                    <p className="font-bold text-muted-foreground">Aucune classe ne vous est encore attribuée.</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
