
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  Loader2, 
  Zap,
  Calendar,
  Activity,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock,
  LayoutGrid,
  UserCheck,
  ArrowUpRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { Progress } from "@/components/ui/progress"

const sparkData = [
  { v: 10 }, { v: 15 }, { v: 12 }, { v: 18 }, { v: 22 }, { v: 20 }, { v: 25 }
];

export default function DirectorDashboard() {
  const [mounted, setMounted] = useState(false)
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [directorName, setDirectorName] = useState("Directeur")
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX", logo: "" })

  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [unusedIds, setUnusedIds] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [sanctions, setSanctions] = useState<any[]>([])
  const [conductConfig, setConductConfig] = useState<any>({ note_depart: 20 })
  const [recentAudit, setRecentAudit] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(true)

  useEffect(() => {
    setMounted(true)
    const year = localStorage.getItem('acadex_active_year') || "2026-2027"
    const name = localStorage.getItem('acadex_user_name') || "le Directeur"
    setActiveYear(year)
    setDirectorName(name)

    const fetchSettings = async () => {
      const { data } = await supabase.from('school_settings').select('*').eq('id', 'main_config').single()
      if (data) setSchoolInfo({ name: data.school_name || "ACADEX", logo: data.logo_url || "" })
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoadingStudents(true)
      setLoadingTeachers(true)
      setLoadingGrades(true)

      const [studentsRes, teachersRes, idsRes, paymentsRes, gradesRes, auditRes, sanctionsRes, conductRes] = await Promise.all([
        supabase.from('students').select('*').eq('academic_year', activeYear).eq('status', 'Actif'),
        supabase.from('teachers').select('*'),
        supabase.from('registration_ids').select('*').eq('status', 'non utilisé'),
        supabase.from('payments').select('*').eq('academic_year', activeYear),
        supabase.from('grades').select('*').eq('academic_year', activeYear),
        supabase.from('student_life').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('sanctions').select('*').eq('academic_year', activeYear),
        supabase.from('conduct_config').select('*').eq('id', 'main').single()
      ])

      setStudents(studentsRes.data || [])
      setTeachers(teachersRes.data || [])
      setUnusedIds(idsRes.data || [])
      setPayments(paymentsRes.data || [])
      setGrades(gradesRes.data || [])
      setSanctions(sanctionsRes.data || [])
      if (conductRes.data) setConductConfig(conductRes.data)
      setRecentAudit(auditRes.data || [])
      setLoadingStudents(false)
      setLoadingTeachers(false)
      setLoadingGrades(false)
    }
    fetchData()
  }, [activeYear])

  const stats = useMemo(() => {
    const totalStudents = students?.length || 0
    const totalTeachers = teachers?.length || 0
    const idsCount = unusedIds?.length || 0
    const revenue = (payments || []).reduce((acc, p: any) => acc + (parseFloat(p.amount_paid) || 0), 0)
    
    let globalSum = 0, gpaCount = 0, totalGradesEntered = grades?.length || 0
    
    if (students && grades) {
      students.forEach((s: any) => {
        const sGrades = grades.filter(g => g.student_matricule === s.matricule)
        const termAvgs: number[] = []
        ;['T1', 'T2', 'T3'].forEach(term => {
          const tGrades = sGrades.filter((g: any) => g.term === term)
          if (tGrades.length === 0) return
          const subjects: Record<string, any> = {}
          tGrades.forEach((g: any) => {
            if (!g.type) return
            if (!subjects[g.subject]) subjects[g.subject] = { ints: [], devs: [], coef: Number(g.coefficient) || 2 }
            if (g.type.startsWith('int')) subjects[g.subject].ints.push(Number(g.value))
            if (g.type.startsWith('dev')) subjects[g.subject].devs.push(Number(g.value))
          })
          let totalW = 0, totalC = 0
          Object.values(subjects).forEach((sub: any) => {
            const avgInt = sub.ints.length > 0 ? sub.ints.reduce((a:number, b:number) => a + b, 0) / sub.ints.length : null
            const blocks = []
            if (avgInt !== null) blocks.push(avgInt)
            sub.devs.forEach((d: number) => blocks.push(d))
            if (blocks.length > 0) {
              totalW += (blocks.reduce((a, b) => a + b, 0) / blocks.length) * sub.coef
              totalC += sub.coef
            }
          })
          if (totalC > 0) {
            // Intégrer la note de conduite (coef 1)
            const termSanctions = sanctions.filter((sc: any) => sc.student_matricule === (s.student_matricule || s.matricule) && sc.trimestre === term)
            const totalPoints = termSanctions.reduce((acc: number, sc: any) => acc + Number(sc.points_retranches || 0), 0)
            const conductValue = Math.max(0, (conductConfig.note_depart || 20) - totalPoints)
            totalW += conductValue * 1
            totalC += 1
            termAvgs.push(totalW / totalC)
          }
        })
        if (termAvgs.length > 0) {
          globalSum += termAvgs.reduce((a, b) => a + b, 0) / termAvgs.length
          gpaCount++
        }
      })
    }

    const avg = gpaCount > 0 ? (globalSum / gpaCount).toFixed(2) : "0.00"
    const completionRate = Math.min(100, Math.round((totalGradesEntered / (Math.max(1, totalStudents) * 50)) * 100))

    return { totalStudents, totalTeachers, idsCount, revenue, avg, completionRate }
  }, [students, teachers, unusedIds, payments, grades, sanctions, conductConfig])

  if (!mounted) return null
  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-5 md:space-y-8 animate-in fade-in duration-500">

        <Card className="relative h-[200px] md:h-[280px] rounded-[1.8rem] md:rounded-[2.5rem] overflow-hidden border-none shadow-2xl group">
          <Image 
            src="/images/bg-dashboard-directeur.jpg"
            alt="School Class"
            fill
            className="object-cover brightness-75 group-hover:scale-105 transition-transform duration-[8000ms]"
            priority
            data-ai-hint="school class green"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-emerald-500 text-white border-none font-black px-3 py-1 rounded-full text-[8px] md:text-xs w-fit">
                  <Activity className="mr-1.5 size-2.5 animate-pulse" /> SYSTÈME LIVE
                </Badge>
                {stats.completionRate < 95 && (
                  <Badge className="bg-amber-500 text-white border-none font-black px-3 py-1 rounded-full text-[8px] md:text-xs">
                    SAISIE : {stats.completionRate}%
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Bonjour, <br className="md:hidden" /> <span className="text-emerald-400 italic">M. {directorName.split(' ')[0]}</span>
              </h2>
              <p className="text-white/70 text-[10px] md:text-lg font-medium">Pilotez votre établissement avec excellence.</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Effectif", value: stats.totalStudents, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", sparkColor: "#10b981", loading: loadingStudents },
            { label: "Profs", value: stats.totalTeachers, icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50", sparkColor: "#3b82f6", loading: loadingTeachers },
            { label: "Moyenne", value: stats.avg, icon: GraduationCap, color: "text-primary", bg: "bg-primary/5", sparkColor: "#14532D", loading: loadingGrades },
            { label: "Recettes", value: `${(stats.revenue / 1000).toFixed(0)}k`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50", sparkColor: "#f59e0b" }
          ].map((stat, i) => (
            <Card key={i} className="p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.8rem] border-none shadow-sm bg-white flex flex-col justify-between group hover:shadow-xl transition-all h-32 md:h-44 relative overflow-hidden">
               <div className="flex items-center justify-between relative z-10">
                  <div className={cn("p-2 rounded-lg shadow-inner", stat.bg)}>
                    <stat.icon className={cn("size-4 md:size-6", stat.color)} />
                  </div>
                  {stat.loading ? <Loader2 className="animate-spin size-3 text-muted-foreground" /> : <ArrowUpRight className="size-3 md:size-4 opacity-20" />}
               </div>
               
               <div className="relative z-10 mt-2">
                  <p className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{stat.label}</p>
                  <h3 className="text-lg md:text-2xl font-black text-foreground tabular-nums">{stat.value}</h3>
               </div>

               <div className="absolute inset-x-0 bottom-0 h-12 md:h-16 opacity-30 pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}>
                      <Line 
                        type="monotone" 
                        dataKey="v" 
                        stroke={stat.sparkColor} 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
           <Card className="lg:col-span-8 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h3 className="text-base md:text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Clock className="text-primary size-4 md:size-5" /> Audit d'Activité & Saisie
                </h3>
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <div className="flex-1 md:w-48">
                      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Remplissage global</p>
                      <Progress value={stats.completionRate} className="h-2" />
                   </div>
                   <Badge className="bg-primary/5 text-primary border-none font-black text-[9px]">{stats.completionRate}%</Badge>
                </div>
              </div>
              <div className="space-y-2">
                 {recentAudit?.length === 0 ? (
                    <div className="py-10 text-center opacity-30 italic text-xs">Aucune activité enregistrée.</div>
                 ) : recentAudit?.map((log: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 md:p-4 bg-muted/10 rounded-xl hover:bg-muted/20 transition-all border border-transparent">
                       <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                             "size-8 rounded-lg flex items-center justify-center shrink-0",
                             log.category === 'presence' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                          )}>
                             {log.category === 'presence' ? <UserCheck className="size-4" /> : <ShieldCheck className="size-4" />}
                          </div>
                          <div className="min-w-0">
                             <h4 className="font-black text-[10px] md:text-sm truncate uppercase">{log.motif}</h4>
                             <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground truncate">Par {log.author_name || "Système"}</p>
                          </div>
                       </div>
                       <Badge className="bg-white border-2 border-muted text-[7px] md:text-[9px] font-black h-5 md:h-6 px-2 rounded-full shrink-0">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                       </Badge>
                    </div>
                 ))}
              </div>
           </Card>

           <div className="lg:col-span-4 space-y-6">
              {stats.idsCount > 0 && (
                <Link href="/eleves/identifiants" className="block group">
                  <Card className="p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-red-600 text-white shadow-xl shadow-red-600/20 active:scale-95 transition-all overflow-hidden relative">
                    <div className="relative z-10 space-y-3">
                      <div className="size-9 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                         <AlertTriangle className="size-5 text-white animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm md:text-lg leading-tight uppercase">Flux Identifiants</h4>
                        <p className="text-white/70 text-[8px] md:text-[10px] font-bold">{stats.idsCount} codes en attente</p>
                      </div>
                    </div>
                    <LayoutGrid className="absolute -bottom-4 -right-4 size-24 text-white/5" />
                  </Card>
                </Link>
              )}

              <Card className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-foreground text-white shadow-xl relative overflow-hidden group border-none min-h-[180px] flex flex-col justify-between">
                 <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center shadow-inner">
                          <Sparkles className="size-5 text-primary animate-pulse" />
                       </div>
                       <h3 className="text-sm md:text-lg font-black uppercase tracking-tight">Cerveau <span className="text-primary italic">ACADEX</span></h3>
                    </div>
                    <p className="text-white/60 text-[9px] md:text-xs font-medium italic border-l-2 border-primary pl-3 leading-relaxed">
                       "L'analyse des registres montre un taux de saisie de {stats.completionRate}%. La vision stratégique est déjà fiable pour le pilotage financier."
                    </p>
                 </div>
                 <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white h-10 md:h-12 rounded-xl font-black text-[9px] md:text-xs shadow-xl active:scale-95 transition-all relative z-10">
                    <Link href="/assistant">Lancer l'Audit Groq</Link>
                 </Button>
                 <Zap className="absolute -bottom-6 -right-6 size-24 text-white/[0.02] pointer-events-none" />
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
