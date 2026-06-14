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
  TrendingUp,
  Sparkles,
  ShieldCheck,
  User,
  ArrowUpRight,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle2,
  Clock,
  LayoutGrid,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection } from "@/firebase"
import { collection, doc, onSnapshot, query, where, orderBy, limit } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import placeholderData from "@/app/lib/placeholder-images.json"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts"

export default function DirectorDashboard() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX", logo: "" })

  const heroImage = placeholderData.placeholderImages.find(img => img.id === "hero-students-class")

  useEffect(() => {
    setMounted(true)
    const year = localStorage.getItem('acadex_active_year') || "2026-2027"
    setActiveYear(year)

    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setSchoolInfo({ name: d.schoolName || "ACADEX", logo: d.logoUrl || "" })
      }
    })
    return () => unsub()
  }, [db])

  const studentsQuery = useMemo(() => query(collection(db, "students"), where("academicYear", "==", activeYear), where("status", "==", "Actif")), [db, activeYear])
  const teachersQuery = useMemo(() => query(collection(db, "teachers")), [db])
  const regIdsQuery = useMemo(() => query(collection(db, "registration_ids"), where("status", "==", "non utilisé")), [db])
  const paymentsQuery = useMemo(() => query(collection(db, "payments"), where("academicYear", "==", activeYear)), [db, activeYear])
  const gradesQuery = useMemo(() => query(collection(db, "grades"), where("academicYear", "==", activeYear)), [db, activeYear])
  const auditQuery = useMemo(() => query(collection(db, "student_life"), orderBy("createdAt", "desc"), limit(5)), [db])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)
  const { data: teachers, loading: loadingTeachers } = useCollection(teachersQuery)
  const { data: unusedIds } = useCollection(regIdsQuery)
  const { data: payments } = useCollection(paymentsQuery)
  const { data: grades, loading: loadingGrades } = useCollection(gradesQuery)
  const { data: recentAudit } = useCollection(auditQuery)

  const stats = useMemo(() => {
    const totalStudents = students?.length || 0
    const totalTeachers = teachers?.length || 0
    const idsCount = unusedIds?.length || 0
    const revenue = (payments || []).reduce((acc, p: any) => acc + (parseFloat(p.amountPaid) || 0), 0)
    const validGrades = (grades || []).map((g: any) => parseFloat(g.value)).filter(v => !isNaN(v) && v >= 0)
    const avg = validGrades.length > 0 ? (validGrades.reduce((acc, v) => acc + v, 0) / validGrades.length).toFixed(2) : "14.20"

    const promoMap: Record<string, { sum: number, count: number }> = {}
    grades?.forEach((g: any) => {
      const level = g.classId?.split(' ')[0] || '---'
      if (!promoMap[level]) promoMap[level] = { sum: 0, count: 0 }
      promoMap[level].sum += Number(g.value)
      promoMap[level].count++
    })
    const promoData = Object.entries(promoMap).map(([name, d]) => ({ 
      name, 
      avg: Number((d.sum / d.count).toFixed(2)) 
    })).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 5)

    const expected = totalStudents * 150000
    const financeData = [
      { name: 'Perçu', value: revenue },
      { name: 'Attendu', value: Math.max(0, expected - revenue) }
    ]

    return { totalStudents, totalTeachers, idsCount, revenue, avg, promoData, financeData, expected }
  }, [students, teachers, unusedIds, payments, grades])

  if (!mounted) return null
  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20">
        
        {/* Header Statutaire Mobile-Optimized */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
           <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                 <div className="size-9 md:size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 shrink-0">
                    <ShieldCheck className="size-5 md:size-6" />
                 </div>
                 <h1 className="text-xl md:text-4xl font-black tracking-tight uppercase truncate">
                    Cockpit <span className="text-primary italic">Directeur</span>
                 </h1>
              </div>
              <p className="text-[9px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                 <Clock className="size-3 text-primary" /> {todayStr}
              </p>
           </div>
           <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-white rounded-xl md:rounded-2xl h-11 md:h-14 px-4 md:px-6 flex-1 md:flex-none flex items-center justify-between md:justify-start gap-3 border border-muted/30 shadow-sm group hover:border-primary/30 transition-all cursor-pointer">
                 <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    <span className="font-black text-[10px] md:text-sm text-foreground uppercase tracking-tight">{activeYear}</span>
                 </div>
                 <ChevronRight className="size-3 text-muted-foreground rotate-90" />
              </div>
              <Avatar className="size-11 md:size-14 border-4 border-white shadow-xl shrink-0">
                 <AvatarFallback className="bg-primary text-white font-black text-sm md:text-xl uppercase">L</AvatarFallback>
              </Avatar>
           </div>
        </div>

        {/* Hero & Stats Grid - Smart Stack */}
        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
           {/* Hero Card Optimized for Mobile Reading */}
           <Card className="lg:col-span-8 relative h-[300px] md:h-[450px] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden border-none shadow-2xl group">
             <Image 
               src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-class/1200/800"}
               alt="Classroom"
               fill
               className="object-cover brightness-75 group-hover:scale-105 transition-transform duration-[8000ms]"
               priority
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
             
             <div className="absolute inset-0 p-6 md:p-14 flex flex-col justify-between">
               <div className="flex justify-between items-start">
                 <Badge className="bg-emerald-500/90 backdrop-blur-md text-white border-none font-black px-3 md:px-5 py-1.5 md:py-2 rounded-full shadow-xl text-[7px] md:text-[10px]">
                    <Activity className="mr-1.5 size-2.5 animate-pulse" /> SYSTÈME LIVE
                 </Badge>
                 <div className="size-10 md:size-14 bg-white/10 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center border border-white/20">
                    <Sparkles className="size-5 md:size-7 text-emerald-400 animate-pulse" />
                 </div>
               </div>

               <div className="space-y-4 md:space-y-6">
                 <h2 className="text-3xl md:text-7xl font-black text-white tracking-tight leading-[0.95]">
                   Pilotez l'<span className="text-emerald-400 italic">Excellence</span>
                 </h2>
                 <div className="flex flex-wrap items-center gap-3">
                    <Button asChild className="bg-primary hover:bg-primary/90 text-white h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-base shadow-2xl active:scale-95 transition-all">
                       <Link href="/statistiques">Vision Globale</Link>
                    </Button>
                    <div className="bg-white/10 backdrop-blur-md px-4 md:px-6 h-11 md:h-14 flex items-center rounded-xl md:rounded-2xl border border-white/10">
                       <p className="text-white text-[8px] md:text-xs font-bold uppercase tracking-[0.2em]">{schoolInfo.name} ELITE</p>
                    </div>
                 </div>
               </div>
             </div>
           </Card>

           {/* Quick Stats Grid - Compact 2 cols on mobile */}
           <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
              {[
                { label: "Effectif Actif", value: stats.totalStudents, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+2.4%" },
                { label: "Moyenne École", value: stats.avg, icon: GraduationCap, color: "text-primary", bg: "bg-primary/5", trend: "+0.15" },
                { label: "Trésorerie", value: `${(stats.revenue / 1000000).toFixed(1)}M`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50", trend: "64%" }
              ].map((stat, i) => (
                <Card key={i} className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden h-36 md:h-auto">
                   <div className="absolute -top-2 -right-2 size-12 md:size-24 bg-muted rounded-full opacity-[0.03] group-hover:scale-150 transition-transform" />
                   <div className="flex items-center justify-between mb-2 md:mb-4 relative z-10">
                      <div className={cn("size-9 md:size-12 rounded-lg md:rounded-xl flex items-center justify-center shadow-inner", stat.bg)}>
                        <stat.icon className={cn("size-4 md:size-6", stat.color)} />
                      </div>
                      <Badge variant="outline" className="border-emerald-100 text-emerald-700 bg-emerald-50 font-black text-[7px] md:text-[9px] px-1.5 md:px-2.5 h-4 md:h-6">{stat.trend}</Badge>
                   </div>
                   <div className="relative z-10">
                      <p className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{stat.label}</p>
                      <h3 className="text-xl md:text-4xl font-black text-foreground tabular-nums truncate">{stat.value}</h3>
                   </div>
                </Card>
              ))}
           </div>
        </div>

        {/* Charts Section - Re-oriented for mobile */}
        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
           {/* Chart 1: Performance par Promo */}
           <Card className="lg:col-span-7 p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border-none shadow-sm bg-white">
              <div className="flex items-center justify-between mb-8 md:mb-10">
                 <div className="space-y-1">
                    <h3 className="text-lg md:text-3xl font-black uppercase tracking-tight">Réussite <span className="text-primary italic">Promos</span></h3>
                    <p className="text-[8px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Moyennes {activeYear}</p>
                 </div>
                 <div className="size-10 md:size-12 bg-primary/5 rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <BarChart3 className="size-5 md:size-6" />
                 </div>
              </div>
              <div className="h-[200px] md:h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.promoData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: '900', fill: '#64748b'}} dy={10} />
                       <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: '700', fill: '#64748b'}} />
                       <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px'}} />
                       <Bar dataKey="avg" radius={[4, 4, 0, 0]} barSize={30}>
                          {stats.promoData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.avg >= 10 ? '#14532D' : '#ef4444'} fillOpacity={0.85} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           {/* Chart 2: Santé Financière - Simplified for mobile */}
           <Card className="lg:col-span-5 p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
              <div className="w-full flex items-center justify-between mb-6 md:mb-8">
                 <h3 className="text-base md:text-2xl font-black uppercase tracking-tight text-left">Santé <br />Financière</h3>
                 <Badge className="bg-amber-500 text-white font-black px-3 md:px-4 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] shadow-lg">LIVE</Badge>
              </div>
              
              <div className="h-[160px] md:h-[280px] w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={stats.financeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          <Cell fill="#14532D" />
                          <Cell fill="#f1f5f9" />
                       </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl md:text-5xl font-black text-foreground tabular-nums">
                       {((stats.revenue / Math.max(1, stats.expected)) * 100).toFixed(0)}%
                    </p>
                    <p className="text-[7px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">Recouvré</p>
                 </div>
              </div>

              <div className="w-full mt-4 md:mt-6 space-y-3 md:space-y-4">
                 <div className="flex justify-between items-center p-3 md:p-4 bg-muted/20 rounded-xl md:rounded-2xl border border-muted/30">
                    <div className="flex items-center gap-2 md:gap-3">
                       <div className="size-1.5 md:size-2 bg-primary rounded-full" />
                       <span className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase">Trésorerie</span>
                    </div>
                    <span className="font-black text-[10px] md:text-lg">{stats.revenue.toLocaleString()} F</span>
                 </div>
                 <Button asChild variant="outline" className="w-full h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-[10px] md:text-base hover:bg-primary hover:text-white transition-all">
                    <Link href="/paiements">Gérer les Flux <ChevronRight className="ml-1 size-3 md:size-4" /></Link>
                 </Button>
              </div>
           </Card>
        </div>

        {/* Audit Section - Responsive Rows */}
        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
           <Card className="lg:col-span-8 p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border-none shadow-sm bg-white">
              <div className="flex items-center justify-between mb-6 md:mb-12">
                 <div className="flex items-center gap-3 md:gap-4">
                    <div className="size-9 md:size-12 bg-muted rounded-xl flex items-center justify-center text-primary shadow-inner shrink-0">
                       <Clock className="size-4 md:size-6" />
                    </div>
                    <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight truncate">Audit de <span className="text-primary italic">Sécurité</span></h3>
                 </div>
                 <Badge variant="outline" className="font-black border-2 border-primary/20 text-primary text-[7px] md:text-xs h-6 md:h-8 px-2 md:px-4 hidden sm:flex">SCELLEMENT CERTIFIÉ</Badge>
              </div>
              
              <div className="space-y-2 md:space-y-3">
                 {recentAudit?.length === 0 ? (
                    <div className="py-10 text-center opacity-30 italic text-[10px] md:text-base">Aucune activité critique enregistrée.</div>
                 ) : recentAudit?.map((log: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 md:p-6 bg-muted/10 rounded-xl md:rounded-[2rem] border border-transparent hover:border-primary/10 transition-all group">
                       <div className="flex items-center gap-3 md:gap-8 min-w-0">
                          <div className={cn(
                             "size-8 md:size-12 rounded-lg md:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                             log.category === 'presence' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                          )}>
                             {log.category === 'presence' ? <UserCheck className="size-4 md:size-6" /> : <ShieldCheck className="size-4 md:size-6" />}
                          </div>
                          <div className="min-w-0">
                             <h4 className="font-black text-[10px] md:text-lg truncate uppercase tracking-tight">{log.motif}</h4>
                             <p className="text-[7px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">Par {log.authorName || "Système"}</p>
                          </div>
                       </div>
                       <div className="text-right shrink-0">
                          <Badge className="bg-white border-2 border-muted text-[6px] md:text-[10px] font-black h-5 md:h-8 px-2 md:px-3 rounded-full">{new Date(log.createdAt?.seconds * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Badge>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>

           <div className="lg:col-span-4 space-y-6 md:space-y-8">
              {stats.idsCount > 0 && (
                <Link href="/eleves/identifiants" className="block group">
                  <Card className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-red-600 text-white border-none shadow-2xl shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden">
                    <div className="relative z-10 space-y-4 md:space-y-6">
                      <div className="size-11 md:size-14 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center border border-white/20">
                         <AlertTriangle className="size-5 md:size-8 text-white animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg md:text-3xl leading-tight">Alerte Flux <br className="hidden sm:block" /> Identifiants</h4>
                        <p className="text-white/70 text-[8px] md:text-xs font-bold uppercase tracking-widest mt-1">Action immédiate requise</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-white/10">
                         <span className="text-xl md:text-2xl font-black">{stats.idsCount} en attente</span>
                         <div className="size-8 md:size-10 bg-white rounded-full flex items-center justify-center text-red-600 shadow-xl group-hover:translate-x-2 transition-transform">
                            <ChevronRight className="size-4 md:size-6" />
                         </div>
                      </div>
                    </div>
                    <LayoutGrid className="absolute -bottom-6 -left-6 size-32 md:size-48 text-white/5 pointer-events-none" />
                  </Card>
                </Link>
              )}

              <Card className="p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-foreground text-white border-none shadow-xl relative overflow-hidden flex flex-col justify-between group min-h-[250px] md:min-h-[300px]">
                 <div className="relative z-10 space-y-6 md:space-y-8">
                    <div className="flex items-center gap-3 md:gap-4">
                       <div className="size-10 md:size-16 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner">
                          <Sparkles className="size-5 md:size-8 text-primary animate-pulse" />
                       </div>
                       <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">Brain <span className="text-primary italic">Intelligence</span></h3>
                    </div>
                    <p className="text-white/60 text-[9px] md:text-sm font-medium leading-relaxed italic border-l-4 border-primary pl-4 md:pl-6">
                       "Analyse scellée : La performance globale est stable. L'audit financier est prioritaire."
                    </p>
                 </div>
                 <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white h-11 md:h-16 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm shadow-xl active:scale-95 transition-all mt-6 md:mt-8 relative z-10">
                    <Link href="/assistant">Lancer l'Audit Groq</Link>
                 </Button>
                 <Zap className="absolute -bottom-10 -right-10 size-32 md:size-48 text-white/[0.02] pointer-events-none" />
              </Card>
           </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
