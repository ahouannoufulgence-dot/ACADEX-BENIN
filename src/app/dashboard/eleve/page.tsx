
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
  ArrowRight,
  FileText,
  Loader2,
  ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"
import placeholderData from "@/app/lib/placeholder-images.json"

export default function StudentDashboard() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("Élève")
  const [mounted, setMounted] = useState(false)

  const heroImage = placeholderData.placeholderImages.find(img => img.id === "hero-students")

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
    setStudentName(localStorage.getItem('acadex_user_name') || "Élève")
    setMounted(true)
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId))
  }, [db, studentId])

  const { data: grades, loading: loadingGrades } = useCollection(gradesQuery)

  const stats = useMemo(() => {
    if (!mounted || !grades) return [
      { title: "Ma Moyenne", value: "0.00", label: "Moyenne Générale", icon: GraduationCap, color: "text-primary", href: "/dashboard/eleve/notes" },
      { title: "Mon Rang", value: "---", label: "Non calculé", icon: Trophy, color: "text-amber-500", href: "/dashboard/eleve/progression" },
      { title: "Absences", value: "0", label: "Heures enregistrées", icon: Clock, color: "text-red-500", href: "/dashboard/eleve/absences" },
      { title: "Scolarité", value: "0", label: "FCFA payés", icon: CreditCard, color: "text-emerald-600", href: "/dashboard/eleve/paiements" },
    ]
    
    const subjects: Record<string, any> = {}
    grades.forEach((g: any) => {
      const sub = g.subject
      const val = Number(g.value)
      if (isNaN(val)) return

      if (!subjects[sub]) subjects[sub] = { i1: 0, i2: 0, i3: 0, d1: 0, d2: 0, coef: Number(g.coefficient) || 1 }
      
      if (g.type === 'int1') subjects[sub].i1 = val
      if (g.type === 'int2') subjects[sub].i2 = val
      if (g.type === 'int3') subjects[sub].i3 = val
      if (g.type === 'dev1') subjects[sub].d1 = val
      if (g.type === 'dev2') subjects[sub].d2 = val
    })

    let totalWeighted = 0
    let totalCoef = 0
    
    Object.values(subjects).forEach((s: any) => {
      const avgInt = (s.i1 + s.i2 + s.i3) / 3
      const avgSub = (avgInt + s.d1 + s.d2) / 3
      totalWeighted += avgSub * s.coef
      totalCoef += s.coef
    })

    const avg = totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : "0.00"

    return [
      { title: "Ma Moyenne", value: avg, label: "Moyenne Générale", icon: GraduationCap, color: "text-primary", href: "/dashboard/eleve/notes" },
      { title: "Mon Rang", value: "---", label: "Non calculé", icon: Trophy, color: "text-amber-500", href: "/dashboard/eleve/progression" },
      { title: "Absences", value: "0", label: "Heures enregistrées", icon: Clock, color: "text-red-500", href: "/dashboard/eleve/absences" },
      { title: "Scolarité", value: "0", label: "FCFA payés", icon: CreditCard, color: "text-emerald-600", href: "/dashboard/eleve/paiements" },
    ]
  }, [grades, mounted])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        
        {/* Immersive Student Banner */}
        <div className="relative min-h-[300px] rounded-[3.5rem] overflow-hidden shadow-2xl group">
          <Image 
            src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-student/1920/1080"}
            alt="Student Cockpit Background"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-1000"
            priority
            data-ai-hint={heroImage?.imageHint || "smiling students"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/60 to-transparent" />
          
          <div className="absolute inset-0 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                Bienvenue sur ton <span className="text-emerald-400 italic">Cockpit</span>,
              </h1>
              <p className="text-xl md:text-2xl font-bold text-white/90">{studentName}</p>
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black px-4 md:px-6 py-2 uppercase tracking-widest text-[10px] md:text-xs">
                  {studentId}
                </Badge>
                <div className="flex items-center gap-2 font-bold text-xs bg-emerald-500 text-white px-4 md:px-6 py-2 rounded-full shadow-lg shadow-emerald-500/30">
                  <ShieldCheck className="size-3 md:size-4" /> Certification Acadex Live
                </div>
              </div>
            </div>
            <Button asChild className="bg-white text-primary hover:bg-white/90 shadow-2xl rounded-2xl h-14 md:h-16 px-8 md:px-10 font-black text-base md:text-lg transition-all active:scale-95">
               <Link href="/assistant">
                 <Sparkles className="mr-3 size-5 md:size-6 fill-primary/20" /> Assistant IA
               </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="p-7 rounded-[2.5rem] border-none shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all bg-white h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 bg-muted rounded-2xl ${stat.color} group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-6 md:size-7" />
                  </div>
                  <ArrowRight className="size-4 md:size-5 opacity-30 group-hover:opacity-100 transition-all" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <div className="text-2xl md:text-3xl font-black text-foreground">
                      {loadingGrades && stat.title === "Ma Moyenne" ? <Loader2 className="animate-spin size-5" /> : stat.value}
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/60 mt-2">{stat.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
             <div className="p-6 md:p-8 border-b flex items-center justify-between bg-muted/10">
               <h3 className="text-lg md:text-xl font-black flex items-center gap-3">
                 <FileText className="text-primary size-5 md:size-6" /> Dernières Notes Scellées
               </h3>
               <Button variant="ghost" asChild className="font-bold text-primary rounded-xl mobile-touch-target">
                 <Link href="/dashboard/eleve/notes">Voir tout</Link>
               </Button>
             </div>
             <div className="p-0">
               {!grades || grades.length === 0 ? (
                 <div className="p-20 text-center text-muted-foreground italic font-medium">
                   Aucune note enregistrée pour le moment.
                 </div>
               ) : (
                 <div className="divide-y divide-muted/30">
                   {grades.slice(0, 5).map((grade: any, i) => (
                     <div key={i} className="p-5 md:p-6 flex items-center justify-between hover:bg-muted/5 transition-all">
                       <div className="flex items-center gap-4">
                         <div className="size-10 md:size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">
                           {(grade.subject || "?")[0]}
                         </div>
                         <div>
                            <p className="font-black text-sm md:text-base text-foreground">{grade.subject}</p>
                            <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase">{grade.type} - {grade.term}</p>
                         </div>
                       </div>
                       <Badge className="bg-primary text-white h-10 w-20 justify-center rounded-xl text-lg font-black">
                         {grade.value}
                       </Badge>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </Card>

          <div className="lg:col-span-4 space-y-6">
            <Card className="premium-card p-8 bg-foreground text-white">
              <h3 className="text-lg md:text-xl font-black mb-6 flex items-center gap-3">
                <Calendar className="text-primary size-5 md:size-6" /> Prochain Cours
              </h3>
              <div className="p-12 text-center text-white/40 italic text-xs">
                Emploi du temps en cours de synchronisation.
              </div>
              <Button asChild variant="secondary" className="w-full mt-6 rounded-xl font-black h-12 md:h-14 mobile-touch-target">
                <Link href="/dashboard/eleve/agenda">Voir planning complet</Link>
              </Button>
            </Card>

            <Card className="premium-card p-8 border-2 border-dashed border-primary/20">
               <div className="flex items-center gap-4 mb-4">
                 <Sparkles className="text-primary size-5 md:size-6" />
                 <h4 className="font-black text-lg">Conseil IA</h4>
               </div>
               <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">
                 {grades?.length ? "L'IA analyse tes résultats pour optimiser tes révisions." : "En attente de tes premières notes pour te coacher."}
               </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
