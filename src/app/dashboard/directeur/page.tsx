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
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection } from "@/firebase"
import { collection, doc, onSnapshot, query, where } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import placeholderData from "@/app/lib/placeholder-images.json"

// Mini composant pour les courbes de tendance (Sparklines)
const Sparkline = ({ color = "#14532d" }) => (
  <svg width="60" height="25" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
    <path 
      d="M1 20C5 18 10 22 15 15C20 8 25 12 30 18C35 24 40 10 45 6C50 2 55 8 59 4" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

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

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)
  const { data: teachers, loading: loadingTeachers } = useCollection(teachersQuery)
  const { data: unusedIds } = useCollection(regIdsQuery)
  const { data: payments } = useCollection(paymentsQuery)
  const { data: grades } = useCollection(gradesQuery)

  const stats = useMemo(() => {
    const totalStudents = students?.length || 0
    const totalTeachers = teachers?.length || 0
    const idsCount = unusedIds?.length || 0
    const revenue = (payments || []).reduce((acc, p: any) => acc + (parseFloat(p.amountPaid) || 0), 0)
    
    const validValues = (grades || []).map((g: any) => parseFloat(g.value)).filter(v => !isNaN(v) && v >= 0)
    const avg = validValues.length > 0 
      ? (validValues.reduce((acc, v) => acc + v, 0) / validValues.length).toFixed(2)
      : "14.00"

    return { totalStudents, totalTeachers, idsCount, revenue, avg }
  }, [students, teachers, unusedIds, payments, grades])

  if (!mounted) return null
  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700">
        
        {/* Sub-Header style Maquette */}
        <div className="flex items-center justify-between px-1 mb-2">
           <div className="flex gap-2">
              <div className="bg-white rounded-2xl h-12 px-4 flex items-center justify-center border border-muted/30 shadow-sm">
                 <div className="flex flex-col items-center">
                    <span className="text-[7px] font-black text-muted-foreground uppercase leading-none mb-0.5">Établissement</span>
                    <Badge variant="outline" className="h-4 px-2 border-primary/20 text-primary text-[8px] font-black">DIR-001</Badge>
                 </div>
              </div>
           </div>
           <div className="bg-white rounded-2xl h-12 px-5 flex items-center gap-2 border border-muted/30 shadow-sm">
              <Calendar className="size-4 text-primary" />
              <span className="font-black text-xs text-foreground uppercase tracking-tight">{activeYear}</span>
              <ChevronRight className="size-3 text-muted-foreground rotate-90" />
           </div>
           <Avatar className="size-12 border-2 border-primary/20 shadow-sm">
              <AvatarFallback className="bg-primary h-full w-full flex items-center justify-center text-white font-black text-lg">L</AvatarFallback>
           </Avatar>
        </div>

        {/* Hero Card Magistral */}
        <Card className="relative h-[300px] md:h-[400px] rounded-[2.5rem] overflow-hidden border-none shadow-2xl group">
          <Image 
            src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-class/1200/800"}
            alt="Classroom"
            fill
            className="object-cover brightness-90 group-hover:scale-105 transition-transform duration-[5000ms]"
            priority
            data-ai-hint="bright classroom blurry background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute inset-0 p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#14532D]/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                <Zap className="size-3 fill-emerald-400 text-emerald-400" /> Pilotage Stratégique Acadex
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Bonjour <br className="md:hidden" /> <span className="text-emerald-400 italic">M. le Directeur</span>
              </h1>
              <div className="flex items-center gap-3">
                <div className="bg-[#14532D]/90 backdrop-blur-md px-6 py-2.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/5">
                  ACADEX
                </div>
                <div className="hidden sm:flex bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-2xl text-foreground text-[10px] font-black uppercase tracking-tight items-center gap-2">
                  <Calendar className="size-3.5 text-primary" /> {todayStr}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Élèves Actifs", value: stats.totalStudents, loading: loadingStudents, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", sparkColor: "#10b981" },
            { label: "Enseignants", value: stats.totalTeachers, loading: loadingTeachers, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50", sparkColor: "#3b82f6" },
            { label: "Moyenne École", value: stats.avg, loading: loadingGrades, icon: Zap, color: "text-amber-500", bg: "bg-amber-50", sparkColor: "#f59e0b" },
            { label: "Recouvrement", value: `${stats.revenue.toLocaleString()} F`, loading: false, icon: Wallet, color: "text-purple-600", bg: "bg-purple-50", sparkColor: "#8b5cf6" }
          ].map((stat, i) => (
            <Card key={i} className="p-6 rounded-[2rem] border-none shadow-sm bg-white relative overflow-hidden flex flex-col justify-between h-40">
              <div className="flex items-center justify-between relative z-10">
                 <div className={cn("size-12 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
                   <stat.icon className={cn("size-6", stat.color)} />
                 </div>
                 <div className="flex items-center gap-1">
                    <div className={cn("size-1.5 rounded-full animate-pulse", stat.color.replace('text-', 'bg-'))} />
                    <span className="text-[8px] font-black text-muted-foreground uppercase">LIVE</span>
                 </div>
              </div>
              <div className="relative z-10">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-end justify-between">
                   <h3 className="text-xl md:text-3xl font-black text-foreground tabular-nums">
                     {stat.loading ? <Loader2 className="animate-spin size-6" /> : stat.value}
                   </h3>
                   <div className="hidden sm:block">
                    <Sparkline color={stat.sparkColor} />
                   </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Alerte Flux Red Banner */}
        {stats.idsCount > 0 && (
          <Link href="/eleves/identifiants" className="block group">
            <Card className="p-5 rounded-[2.2rem] bg-[#FEF2F2] border-none shadow-sm flex items-center justify-between group-hover:shadow-md transition-all active:scale-[0.98]">
              <div className="flex items-center gap-5">
                <div className="size-16 bg-[#EF4444] rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="size-8 text-white" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-black text-lg text-[#111827]">Alertes Flux</h4>
                  <p className="text-[10px] font-black text-[#EF4444] uppercase tracking-widest">Action requise immédiate</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-[#EF4444] text-white h-12 px-6 rounded-3xl flex flex-col items-center justify-center min-w-[100px]">
                    <span className="text-sm font-black leading-none">{stats.idsCount}</span>
                    <span className="text-[7px] font-black uppercase tracking-tighter">Attente</span>
                 </div>
                 <ChevronRight className="size-5 text-muted-foreground opacity-30 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        )}

      </div>
    </DashboardLayout>
  )
}
