
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
  ShieldCheck,
  Zap,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"
import placeholderData from "@/app/lib/placeholder-images.json"
import { cn } from "@/lib/utils"

export default function StudentDashboard() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("Élève")
  const [mounted, setMounted] = useState(false)
  const [activeYear, setActiveYear] = useState("2026-2027")

  const heroImage = placeholderData.placeholderImages.find(img => img.id === "hero-students-class")

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
    setStudentName(localStorage.getItem('acadex_user_name') || "Élève")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    setMounted(true)
  }, [])

  const gradesQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "grades"), where("studentId", "==", studentId), where("academicYear", "==", activeYear))
  }, [db, studentId, activeYear])

  const { data: grades, loading: loadingGrades } = useCollection(gradesQuery)

  const stats = useMemo(() => {
    if (!mounted || !grades) return [
      { title: "Ma Moyenne", value: "0.00", label: "Générale", icon: GraduationCap, color: "text-primary", bg: "bg-emerald-50", href: "/dashboard/eleve/notes" },
      { title: "Mon Rang", value: "---", label: "Classement", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", href: "/dashboard/eleve/notes" },
      { title: "Absences", value: "0", label: "Sessions", icon: Clock, color: "text-red-500", bg: "bg-red-50", href: "/vie-scolaire" },
      { title: "Scolarité", value: "---", label: "Statut", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", href: "/dashboard/eleve/paiements" },
    ]
    
    const subjects: Record<string, any> = {}
    grades.forEach((g: any) => {
      const sub = g.subject
      const val = Number(g.value)
      if (isNaN(val)) return
      if (!subjects[sub]) subjects[sub] = { vals: [], coef: Number(g.coefficient) || 1 }
      subjects[sub].vals.push(val)
    })

    let totalWeighted = 0
    let totalCoef = 0
    Object.values(subjects).forEach((s: any) => {
      const avgSub = s.vals.reduce((a:number, b:number)=>a+b, 0) / s.vals.length
      totalWeighted += avgSub * s.coef
      totalCoef += s.coef
    })

    const avg = totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : "0.00"

    return [
      { title: "Ma Moyenne", value: avg, label: "Générale", icon: GraduationCap, color: "text-primary", bg: "bg-emerald-50", href: "/dashboard/eleve/notes" },
      { title: "Mon Rang", value: "---", label: "Classement", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", href: "/dashboard/eleve/notes" },
      { title: "Absences", value: "0", label: "Sessions", icon: Clock, color: "text-red-500", bg: "bg-red-50", href: "/vie-scolaire" },
      { title: "Scolarité", value: "---", label: "Statut", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", href: "/dashboard/eleve/paiements" },
    ]
  }, [grades, mounted])

  if (!mounted) return null

  return (
    <DashboardLayout>
      {/* Immersive Background Image - Exact green uniform students */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image 
          src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-green-uniforms/1920/1080"}
          alt="ACADEX Background"
          fill
          className="object-cover opacity-15"
          priority
          data-ai-hint="students green uniforms"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="relative z-10 space-y-6 md:space-y-10 animate-in">
        
        {/* Student Banner */}
        <div className="relative min-h-[280px] md:min-h-[380px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl group">
          <Image 
            src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-green-uniforms/1920/1080"}
            alt="Student Cockpit"
            fill
            className="object-cover brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]"
            priority
            data-ai-hint="students green uniforms"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end gap-4">
            <div className="space-y-2 md:space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[9px] font-black uppercase tracking-widest">
                <Star className="size-3 text-amber-400 fill-amber-400" /> Cockpit de Réussite
              </div>
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-tight">
                Prêt pour ton <br /> <span className="text-emerald-400 italic">Excellence</span>, {studentName.split(' ')[0]} ?
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-emerald-500 text-white border-none font-black px-4 py-2 rounded-full shadow-lg shadow-emerald-500/30 text-[10px] md:text-xs">
                  ID: {studentId}
                </Badge>
                <div className="flex items-center gap-2 font-bold text-[10px] md:text-sm bg-white/10 backdrop-blur-md text-white/90 px-4 py-2 rounded-full border border-white/10">
                  <ShieldCheck className="size-3 md:size-4 text-emerald-400" /> Certifié Acadex {activeYear}
                </div>
              </div>
            </div>
            <div className="md:absolute md:right-12 md:bottom-12 mt-4 md:mt-0">
               <Button asChild className="w-full md:w-auto bg-white text-primary hover:bg-white/90 shadow-2xl rounded-2xl h-14 md:h-16 px-8 md:px-10 font-black text-base transition-all active:scale-95">
                 <Link href="/assistant">
                   <Sparkles className="mr-3 size-5 fill-primary/20" /> Coaching IA
                 </Link>
               </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, i) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-none shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm h-full relative overflow-hidden">
                <div className={cn("absolute -top-4 -right-4 size-16 md:size-20 rounded-full opacity-[0.05]", stat.bg)} />
                <div className="flex items-center justify-between mb-4 md:mb-8">
                  <div className={`p-3 md:p-4 bg-muted rounded-xl md:rounded-2xl ${stat.color} group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-5 md:size-7" />
                  </div>
                  <ArrowRight className="size-3 md:size-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{stat.title}</p>
                  <div className="text-xl md:text-3xl font-black text-foreground">
                    {loadingGrades && stat.title === "Ma Moyenne" ? <Loader2 className="animate-spin size-5" /> : stat.value}
                  </div>
                  <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-tighter">{stat.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
          <Card className="lg:col-span-8 border-none shadow-sm bg-white/95 rounded-[2rem] md:rounded-[3rem] overflow-hidden">
             <div className="p-6 md:p-10 border-b flex items-center justify-between bg-muted/5">
               <div className="space-y-1">
                 <h3 className="text-lg md:text-2xl font-black flex items-center gap-3">
                   <FileText className="text-primary size-5 md:size-7" /> Dernières Notes
                 </h3>
                 <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Registre Live Acadex</p>
               </div>
               <Button variant="ghost" asChild className="font-bold text-primary rounded-xl h-10 text-xs hover:bg-primary/5">
                 <Link href="/dashboard/eleve/notes">Détails <ArrowRight className="ml-1 size-3" /></Link>
               </Button>
             </div>
             <div className="p-2 md:p-4">
               {!grades || grades.length === 0 ? (
                 <div className="p-20 text-center text-muted-foreground italic font-medium">
                   Aucune note scellée détectée.
                 </div>
               ) : (
                 <div className="grid gap-2">
                   {grades.slice(0, 4).map((grade: any, i) => (
                     <div key={i} className="p-4 md:p-6 flex items-center justify-between hover:bg-muted/5 transition-all rounded-[1.5rem] border border-transparent hover:border-muted/50">
                       <div className="flex items-center gap-4">
                         <div className="size-10 md:size-14 bg-primary/5 text-primary rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">
                           {(grade.subject || "?")[0]}
                         </div>
                         <div>
                            <p className="font-black text-sm md:text-xl text-foreground uppercase tracking-tight">{grade.subject}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[8px] md:text-[10px] font-bold text-muted-foreground border-muted px-2">{grade.type}</Badge>
                              <span className="text-[8px] md:text-[10px] font-black text-primary uppercase">{grade.term}</span>
                            </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <Badge className="bg-primary text-white h-10 md:h-12 w-16 md:w-24 justify-center rounded-xl md:rounded-2xl text-lg md:text-2xl font-black shadow-lg shadow-primary/10">
                           {grade.value}
                         </Badge>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </Card>

          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <Card className="p-8 md:p-10 bg-foreground text-white rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-lg md:text-2xl font-black mb-8 md:mb-10 flex items-center gap-3">
                  <Calendar className="text-primary size-5 md:size-7" /> Prochain Cours
                </h3>
                <div className="py-10 md:py-16 text-center text-white/20 italic text-xs md:text-sm border-2 border-dashed border-white/5 rounded-3xl">
                  En attente de programmation...
                </div>
                <Button asChild variant="secondary" className="w-full mt-8 rounded-xl font-black h-12 md:h-14 shadow-lg active:scale-95 transition-all">
                  <Link href="/dashboard/eleve/agenda">Voir mon Planning</Link>
                </Button>
              </div>
              <Zap className="absolute -bottom-10 -right-10 size-40 md:size-56 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            </Card>

            <Card className="p-8 md:p-10 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-white/10 backdrop-blur-sm group hover:bg-primary/10 transition-all cursor-pointer">
               <div className="flex items-center gap-4 mb-5 md:mb-6">
                 <div className="size-10 md:size-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5">
                    <Sparkles className="text-primary size-5 md:size-6" />
                 </div>
                 <h4 className="font-black text-lg md:text-xl text-foreground">Conseil du Coach</h4>
               </div>
               <p className="text-xs md:text-sm font-medium text-muted-foreground italic leading-relaxed">
                 {grades?.length 
                   ? "L'IA analyse tes notes de " + activeYear + " pour optimiser ton prochain trimestre." 
                   : "Tes premières notes permettront à l'IA de construire ton plan de réussite."}
               </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
