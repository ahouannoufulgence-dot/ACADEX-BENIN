
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
import { supabase } from "@/lib/supabase"
import { useMemo, useEffect, useState } from "react"
import placeholderData from "@/app/lib/placeholder-images.json"
import { cn } from "@/lib/utils"

export default function StudentDashboard() {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("Élève")
  const [mounted, setMounted] = useState(false)
  const [activeYear, setActiveYear] = useState("2026-2027")

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
    setStudentName(localStorage.getItem('acadex_user_name') || "Élève")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    setMounted(true)
  }, [])

  const [grades, setGrades] = useState<any[]>([])
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [totalPaid, setTotalPaid] = useState(0)
  const [rank, setRank] = useState("---")
    const [expectedFee, setExpectedFee] = useState(150000)

  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentId) { setLoadingGrades(false); return }
      const { data } = await supabase.from("grades").select("*").eq("student_matricule", studentId).eq("academic_year", activeYear)
      setGrades(data || [])
      setLoadingGrades(false)
    }
    fetchGrades()
  }, [studentId, activeYear])

  useEffect(() => {
    const fetchPayments = async () => {
      if (!studentId || !activeYear) return
      const { data: studentData } = await supabase.from("students").select("class_id").eq("matricule", studentId).single()
      const classId = studentData?.class_id || ""
      if (classId) {
        const { data: feeData } = await supabase.from("class_fees").select("amount").eq("class_id", classId).eq("academic_year", activeYear).single()
        if (feeData) setExpectedFee(Number(feeData.amount))
      }
      const { data: payData } = await supabase.from("payments").select("amount_paid").eq("student_matricule", studentId).eq("academic_year", activeYear)
      const total = (payData || []).reduce((acc: number, p: any) => acc + Number(p.amount_paid), 0)
      setTotalPaid(total)
      if (classId) {
        const { data: classGrades } = await supabase.from("grades").select("*").eq("class_id", classId).eq("academic_year", activeYear)
        if (classGrades) {
          const avgs: Record<string, number[]> = {}
          classGrades.forEach((g: any) => {
            if (!avgs[g.student_matricule]) avgs[g.student_matricule] = []
            avgs[g.student_matricule].push(Number(g.value))
          })
          const sorted = Object.entries(avgs).map(([mat, vals]) => ({ mat, avg: vals.reduce((a,b)=>a+b,0)/vals.length })).sort((a,b)=>b.avg-a.avg)
          const r = sorted.findIndex(s => s.mat === studentId) + 1
          setRank(r > 0 ? r+"/"+sorted.length : "---")
        }
      }
      if (classId) {
        const { data: classGrades } = await supabase.from("grades").select("*").eq("class_id", classId).eq("academic_year", activeYear)
        if (classGrades) {
          const avgs: Record<string, number[]> = {}
          classGrades.forEach((g: any) => {
            if (!avgs[g.student_matricule]) avgs[g.student_matricule] = []
            avgs[g.student_matricule].push(Number(g.value))
          })
          const sorted = Object.entries(avgs).map(([mat, vals]) => ({ mat, avg: vals.reduce((a,b)=>a+b,0)/vals.length })).sort((a,b)=>b.avg-a.avg)
          const r = sorted.findIndex(s => s.mat === studentId) + 1
          setRank(r > 0 ? r+"/"+sorted.length : "---")
        }
      }
    }
    fetchPayments()
  }, [studentId, activeYear])

  const stats = useMemo(() => {
    if (!mounted || !grades) return [
      { title: "Ma Moyenne", value: "0.00", label: "Générale", icon: GraduationCap, color: "text-primary", bg: "bg-emerald-50", href: "/dashboard/eleve/notes" },
      { title: "Mon Rang", value: rank, label: "Classement", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", href: "/dashboard/eleve/notes" },
      { title: "Absences", value: "0", label: "Sessions", icon: Clock, color: "text-red-500", bg: "bg-red-50", href: "/vie-scolaire" },
      { title: "Scolarité", value: totalPaid >= expectedFee ? "Soldé" : `${Math.round((totalPaid/expectedFee)*100)}%`, label: "Règlement", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", href: "/dashboard/eleve/paiements" },
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
      { title: "Mon Rang", value: rank, label: "Classement", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", href: "/dashboard/eleve/notes" },
      { title: "Absences", value: "0", label: "Sessions", icon: Clock, color: "text-red-500", bg: "bg-red-50", href: "/vie-scolaire" },
      { title: "Scolarité", value: totalPaid >= expectedFee ? "Soldé" : `${Math.round((totalPaid/expectedFee)*100)}%`, label: "Règlement", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", href: "/dashboard/eleve/paiements" },
    ]
  }, [grades, mounted, totalPaid, expectedFee])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="relative z-10 space-y-5 md:space-y-10 animate-in">
        
        <div className="relative min-h-[220px] md:min-h-[380px] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-xl group">
          <Image 
            src="/images/bg-dashboard-eleve.jpg"
            alt="Student Cockpit"
            fill
            className="object-cover brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]"
            priority
            data-ai-hint="students green uniforms"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          <div className="absolute inset-0 p-5 md:p-12 flex flex-col justify-end gap-3">
            <div className="space-y-1 md:space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                <Star className="size-2.5 md:size-3 text-amber-400 fill-amber-400" /> Cockpit de Réussite
              </div>
              <h1 className="text-2xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-tight">
                Prêt pour ton <br className="hidden md:block" /> <span className="text-emerald-400 italic">Excellence</span>, {studentName.split(' ')[0]} ?
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <Badge className="bg-emerald-500 text-white border-none font-black px-3 py-1 rounded-full shadow-lg text-[8px] md:text-xs">
                  ID: {studentId}
                </Badge>
                <div className="flex items-center gap-1.5 md:gap-2 font-bold text-[8px] md:text-sm bg-white/10 backdrop-blur-md text-white/90 px-3 py-1 rounded-full border border-white/10">
                  <ShieldCheck className="size-3 md:size-4 text-emerald-400" /> Certifié {activeYear}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {stats.map((stat, i) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all bg-white relative overflow-hidden h-full">
                <div className={cn("absolute -top-4 -right-4 size-14 md:size-20 rounded-full opacity-[0.05]", stat.bg)} />
                <div className="flex items-center justify-between mb-3 md:mb-8">
                  <div className={`p-2 md:p-4 bg-muted rounded-lg md:rounded-2xl ${stat.color} group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-3.5 md:size-7" />
                  </div>
                  <ArrowRight className="size-2.5 md:size-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{stat.title}</p>
                  <div className="text-lg md:text-3xl font-black text-foreground">
                    {loadingGrades && stat.title === "Ma Moyenne" ? <Loader2 className="animate-spin size-3.5 md:size-5" /> : stat.value}
                  </div>
                  <p className="text-[7px] md:text-[9px] font-bold text-muted-foreground/30 mt-0.5 uppercase tracking-tighter">{stat.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-5 md:gap-10">
          <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden">
             <div className="p-5 md:p-10 border-b flex items-center justify-between bg-muted/5">
               <div className="space-y-0.5">
                 <h3 className="text-base md:text-2xl font-black flex items-center gap-2">
                   <FileText className="text-primary size-4 md:size-7" /> Dernières Notes
                 </h3>
                 <p className="text-[7px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Registre Live Acadex</p>
               </div>
               <Button variant="ghost" asChild className="font-bold text-primary rounded-xl h-8 text-[10px] hover:bg-primary/5">
                 <Link href="/dashboard/eleve/notes">Détails <ArrowRight className="ml-1 size-2" /></Link>
               </Button>
             </div>
             <div className="p-2 md:p-4">
               {!grades || grades.length === 0 ? (
                 <div className="p-12 md:p-20 text-center text-muted-foreground italic font-medium text-xs md:text-base">
                   Aucune note scellée détectée.
                 </div>
               ) : (
                 <div className="grid gap-1 md:gap-2">
                   {grades.slice(0, 4).map((grade: any, i) => (
                     <div key={i} className="p-3 md:p-6 flex items-center justify-between hover:bg-muted/5 transition-all rounded-[1rem] md:rounded-[1.5rem] border border-transparent hover:border-muted/50">
                       <div className="flex items-center gap-3 md:gap-4 min-w-0">
                         <div className="size-9 md:size-14 bg-primary/5 text-primary rounded-lg md:rounded-2xl flex items-center justify-center font-black text-sm md:text-lg shadow-inner shrink-0">
                           {(grade.subject || "?")[0]}
                         </div>
                         <div className="truncate">
                            <p className="font-black text-xs md:text-xl text-foreground uppercase tracking-tight truncate">{grade.subject}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[7px] md:text-[10px] font-bold text-muted-foreground border-muted px-1.5 h-4 md:h-5">{grade.type}</Badge>
                              <span className="text-[7px] md:text-[10px] font-black text-primary uppercase">{grade.term}</span>
                            </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <Badge className="bg-primary text-white h-8 md:h-12 w-12 md:w-24 justify-center rounded-lg md:rounded-2xl text-sm md:text-2xl font-black shadow-lg shadow-primary/10">
                           {grade.value}
                         </Badge>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </Card>

          <div className="lg:col-span-4 space-y-5 md:space-y-8">
            <Card className="p-6 md:p-10 bg-foreground text-white rounded-[2rem] md:rounded-[3rem] shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-base md:text-2xl font-black mb-6 md:mb-10 flex items-center gap-2">
                  <Calendar className="text-primary size-4 md:size-7" /> Planning
                </h3>
                <div className="py-8 md:py-16 text-center text-white/20 italic text-[10px] md:text-sm border-2 border-dashed border-white/5 rounded-2xl md:rounded-3xl">
                  En attente de programme...
                </div>
                <Button asChild variant="secondary" className="w-full mt-6 rounded-lg md:rounded-xl font-black h-10 md:h-14 shadow-lg active:scale-95 transition-all text-xs md:text-base">
                  <Link href="/dashboard/eleve/agenda">Mon Planning</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 md:p-10 rounded-[1.8rem] md:rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-white group hover:bg-primary/5 transition-all cursor-pointer">
               <div className="flex items-center gap-3 mb-4 md:mb-6">
                 <div className="size-9 md:size-12 bg-muted rounded-lg md:rounded-2xl flex items-center justify-center shadow-sm">
                    <Sparkles className="text-primary size-4 md:size-6" />
                 </div>
                 <h4 className="font-black text-sm md:text-xl text-foreground">Conseil Coach</h4>
               </div>
               <p className="text-[10px] md:text-sm font-medium text-muted-foreground italic leading-relaxed">
                 {grades?.length 
                   ? "L'IA analyse tes notes pour optimiser ton prochain trimestre." 
                   : "Tes premières notes permettront à l'IA de construire ton plan de réussite."}
               </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
