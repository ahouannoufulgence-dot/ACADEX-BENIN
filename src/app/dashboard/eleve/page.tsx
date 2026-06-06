
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  Trophy, 
  Clock, 
  Sparkles,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, limit } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"

export default function StudentDashboard() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
    setMounted(true)
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId))
  }, [db, studentId])

  const lastGradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId), orderBy("updatedAt", "desc"), limit(3))
  }, [db, studentId])

  const paymentsQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "payments"), where("studentId", "==", studentId))
  }, [db, studentId])

  const { data: grades } = useCollection(gradesQuery)
  const { data: lastGrades } = useCollection(lastGradesQuery)
  const { data: payments } = useCollection(paymentsQuery)

  const stats = useMemo(() => {
    if (!mounted) return []
    
    const avg = grades?.length 
      ? (grades.reduce((acc, g: any) => acc + (g.average || 0), 0) / grades.length).toFixed(2)
      : "0.00"
    
    const totalPaid = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const paymentStatus = totalPaid > 0 ? "En règle" : "À régulariser"

    return [
      { title: "Ma Moyenne", value: avg, label: "Moyenne Générale", icon: GraduationCap, color: "text-primary", href: "/dashboard/eleve/notes" },
      { title: "Mon Rang", value: "---", label: "Non calculé", icon: Trophy, color: "text-amber-500", href: "/dashboard/eleve/progression" },
      { title: "Absences", value: "0", label: "Heures ce mois", icon: Clock, color: "text-red-500", href: "/dashboard/eleve/absences" },
      { title: "Scolarité", value: paymentStatus, label: `${totalPaid.toLocaleString()} FCFA versés`, icon: CreditCard, color: "text-emerald-600", href: "/dashboard/eleve/paiements" },
    ]
  }, [grades, payments, mounted])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Mon <span className="text-primary italic">Cockpit</span></h1>
            <p className="text-muted-foreground font-medium">L'excellence est une habitude. Suis tes efforts ici.</p>
          </div>
          <Button asChild className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black">
             <Link href="/assistant">
               <Sparkles className="mr-2 size-5 fill-white" /> Demander à l'IA
             </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="p-7 rounded-[2.5rem] border-none shadow-sm flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all bg-white overflow-hidden h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 bg-muted rounded-2xl ${stat.color} group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-7" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-foreground">{stat.value}</span>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/60 mt-2">{stat.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Dernières Notes */}
          <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
             <div className="p-8 border-b flex items-center justify-between bg-muted/10">
               <h3 className="text-xl font-black flex items-center gap-3">
                 <FileText className="text-primary" /> Mes dernières notes
               </h3>
               <Button variant="ghost" asChild className="font-bold text-primary hover:bg-primary/5 rounded-xl">
                 <Link href="/dashboard/eleve/notes">Voir tout</Link>
               </Button>
             </div>
             <div className="p-0">
               {lastGrades?.length === 0 ? (
                 <div className="p-20 text-center space-y-4">
                   <p className="text-muted-foreground font-medium">Aucune note enregistrée pour le moment.</p>
                 </div>
               ) : (
                 <div className="divide-y divide-muted/30">
                   {lastGrades?.map((grade: any, i) => (
                     <div key={i} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all">
                       <div className="flex items-center gap-4">
                         <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">
                           {grade.subject[0]}
                         </div>
                         <div>
                           <p className="font-black text-foreground">{grade.subject}</p>
                           <p className="text-[10px] uppercase font-bold text-muted-foreground">{grade.term}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-6">
                         <Badge className="bg-primary text-white h-10 w-20 justify-center rounded-xl text-lg font-black">
                           {grade.average}
                         </Badge>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </Card>

          {/* Agenda Rapide */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="premium-card p-8 bg-foreground text-white">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <Calendar className="text-primary" /> Agenda demain
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black uppercase text-primary">08:00 - 10:00</p>
                    <p className="font-bold">Mathématiques</p>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white font-bold">Salle 12</Badge>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center opacity-60">
                  <div>
                    <p className="text-xs font-black uppercase text-primary">10:00 - 12:00</p>
                    <p className="font-bold">Français</p>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white font-bold">Salle 05</Badge>
                </div>
              </div>
              <Button asChild variant="secondary" className="w-full mt-6 rounded-xl font-black h-12">
                <Link href="/dashboard/eleve/agenda">Emploi du temps complet</Link>
              </Button>
            </Card>

            <Card className="premium-card p-8 border-2 border-dashed border-primary/20">
               <div className="flex items-center gap-4 mb-4">
                 <Sparkles className="text-primary animate-pulse" />
                 <h4 className="font-black text-lg">Conseil IA</h4>
               </div>
               <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                 "Tu as progressé en Mathématiques. Continue tes exercices sur les fonctions pour viser le 18/20 au devoir."
               </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
