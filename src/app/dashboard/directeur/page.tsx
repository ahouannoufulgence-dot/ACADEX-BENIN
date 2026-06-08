"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  Loader2, 
  Zap,
  Calendar,
  Activity,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection } from "@/firebase"
import { collection, doc, onSnapshot, query, where } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import placeholderData from "@/app/lib/placeholder-images.json"

export default function DirectorDashboard() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX", year: "2026-2027" })
  const [activeYear, setActiveYear] = useState("2026-2027")

  const heroImage = placeholderData.placeholderImages.find(img => img.id === "hero-students")

  useEffect(() => {
    setMounted(true)
    const updateYear = (e?: any) => {
      const year = e?.detail || localStorage.getItem('acadex_active_year') || "2026-2027"
      setActiveYear(year)
    }
    
    updateYear()
    window.addEventListener('acadex_year_changed', updateYear as any)

    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setSchoolInfo({ 
          name: d.schoolName || "ACADEX ELITE", 
          year: d.academicYear || "2026-2027" 
        })
        if (!localStorage.getItem('acadex_active_year')) {
          setActiveYear(d.academicYear || "2026-2027")
        }
      }
    })
    return () => {
      unsub()
      window.removeEventListener('acadex_year_changed', updateYear as any)
    }
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
      : "0.00"

    return { totalStudents, totalTeachers, idsCount, revenue, avg }
  }, [students, teachers, unusedIds, payments, grades])

  if (!mounted) return null
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <DashboardLayout>
      {/* Background Image with Professional Overlay - Only for Dashboard */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image 
          src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-students/1920/1080"}
          alt="ACADEX Background"
          fill
          className="object-cover opacity-10 grayscale-[0.3]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="relative z-10 space-y-6 md:space-y-10 animate-in">
        
        {/* Hero Section */}
        <div className="relative min-h-[250px] md:min-h-[350px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl group">
          <Image 
            src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-director/1920/1080"}
            alt="Director Cockpit"
            fill
            className="object-cover brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          <div className="absolute inset-0 p-8 md:p-14 flex flex-col justify-end gap-4">
            <div className="space-y-2 md:space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[9px] md:text-[11px] font-black uppercase tracking-widest">
                <Zap className="size-3 fill-emerald-400" /> Pilotage Stratégique Acadex
              </div>
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl">
                Bonjour <span className="text-emerald-400 italic">M. le Directeur</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-white/20 backdrop-blur-xl text-white border-white/10 font-black px-5 md:px-7 py-2 uppercase tracking-widest text-[9px] md:text-xs">
                  {schoolInfo.name}
                </Badge>
                <div className="flex items-center gap-2 font-bold text-[9px] md:text-sm bg-white/10 backdrop-blur-xl text-white/90 px-5 md:px-7 py-2 rounded-full border border-white/10">
                  <Calendar className="size-3 md:size-4 text-emerald-400" /> {today}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rapid Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: "Élèves Actifs", value: stats.totalStudents, loading: loadingStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Enseignants", value: stats.totalTeachers, loading: loadingTeachers, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Moyenne École", value: stats.avg, loading: false, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Recouvrement", value: `${stats.revenue.toLocaleString()} F`, loading: false, icon: Wallet, color: "text-purple-600", bg: "bg-purple-50" }
          ].map((stat, i) => (
            <Card key={i} className="p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-none shadow-sm bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className={cn("absolute -top-4 -right-4 size-16 md:size-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform", stat.bg)} />
              <div className="flex items-center justify-between mb-4">
                 <div className={cn("p-2.5 md:p-3 rounded-xl md:rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm", stat.bg, stat.color)}>
                   <stat.icon className="size-4 md:size-5" />
                 </div>
                 <Badge variant="outline" className="border-none text-[7px] md:text-[9px] font-black uppercase bg-muted/50 px-2">LIVE</Badge>
              </div>
              <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{stat.label}</p>
              <div className="text-xl md:text-3xl font-black text-foreground truncate">
                {stat.loading ? <Loader2 className="animate-spin size-5 md:size-8" /> : stat.value}
              </div>
            </Card>
          ))}
        </div>

        {/* Detailed Insights */}
        <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
          <div className="lg:col-span-8 space-y-6 md:space-y-10">
            {stats.idsCount > 0 && (
              <Card className="border-none shadow-xl bg-white/95 rounded-[2rem] md:rounded-[3rem] overflow-hidden border-t-8 border-destructive">
                <CardHeader className="p-6 md:p-10 border-b bg-red-50/20 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-10 md:size-12 bg-destructive text-white rounded-xl flex items-center justify-center shadow-lg">
                      <AlertTriangle className="size-4 md:size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg md:text-2xl font-black">Alertes Flux</CardTitle>
                      <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Action Requise Immédiate</p>
                    </div>
                  </div>
                  <Badge className="bg-destructive text-white font-black px-4 py-1.5 rounded-full text-[9px] md:text-xs">{stats.idsCount} ATTENTE</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 md:p-10 flex items-center justify-between group cursor-pointer hover:bg-muted/10 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="size-12 md:size-16 bg-white rounded-2xl flex items-center justify-center font-black text-xl md:text-3xl shadow-inner border border-muted/50 text-destructive">{stats.idsCount}</div>
                      <div className="space-y-1">
                        <p className="font-black text-sm md:text-xl text-foreground">Identifiants de connexion</p>
                        <p className="text-[10px] md:text-base font-medium text-muted-foreground">Distribuez les codes pour activer les cockpits élèves.</p>
                      </div>
                    </div>
                    <Button asChild variant="ghost" className="size-11 md:size-14 rounded-xl text-primary group-hover:translate-x-2 transition-transform mobile-touch-target">
                      <Link href="/eleves/identifiants"><ArrowRight className="size-5 md:size-6" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-none shadow-sm bg-white/95 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12">
              <div className="flex items-center justify-between mb-8 md:mb-12">
                <div className="space-y-1">
                  <h3 className="text-xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-primary size-5 md:size-7" /> Performance Live
                  </h3>
                  <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{activeYear} • Analyse en temps réel</p>
                </div>
                <Button variant="outline" className="rounded-xl font-black text-[10px] md:text-xs h-10 md:h-12 border-2 px-5 mobile-touch-target">Détails <ChevronRight className="ml-1 size-3" /></Button>
              </div>
              <div className="p-12 md:p-24 text-center border-4 border-dashed rounded-[2.5rem] md:rounded-[3.5rem] bg-muted/10 opacity-40">
                <div className="size-16 md:size-24 bg-white rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-sm mb-8">
                   <Zap className="size-7 md:size-10 text-primary" />
                </div>
                <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px] md:text-sm">Synchronisation des moyennes...</p>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6 md:space-y-10">
            <Card className="p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] bg-foreground text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10">
                 <h4 className="text-lg md:text-2xl font-black mb-8 md:mb-10 flex items-center gap-4">
                  <Activity className="size-4 md:size-5 text-primary" /> État des Services
                 </h4>
                 <div className="space-y-4 md:space-y-6">
                    {[
                      { label: "Base de Données", status: "OK", color: "bg-emerald-500" },
                      { label: "IA Acadex", status: "ACTIF", color: "bg-primary" },
                      { label: "Passerelle SMS", status: "SYNC", color: "bg-blue-500" }
                    ].map((svc, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] md:text-base font-bold p-4 md:p-5 bg-white/5 rounded-xl md:rounded-2xl border border-white/10">
                        <span className="text-white/60">{svc.label}</span>
                        <Badge className={cn(svc.color, "text-white border-none font-black text-[8px] md:text-[11px]")}>{svc.status}</Badge>
                      </div>
                    ))}
                 </div>
               </div>
               <ShieldCheck className="absolute -bottom-10 -right-10 size-40 md:size-64 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            </Card>

            <Card className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border-2 border-dashed border-primary/20 bg-primary/5 group hover:bg-primary/10 transition-all cursor-pointer">
              <div className="flex items-center gap-5 mb-6 md:mb-8">
                <div className="size-11 md:size-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10">
                  <Sparkles className="size-5 md:size-7 text-primary fill-primary/10" />
                </div>
                <div>
                  <h4 className="font-black text-lg md:text-2xl">Assistant IA</h4>
                  <p className="text-[9px] md:text-[11px] font-black text-primary uppercase tracking-widest">Brain v1.0</p>
                </div>
              </div>
              <p className="text-[11px] md:text-base font-medium text-muted-foreground italic leading-relaxed mb-8 md:mb-10">
                "Analysez les disparités de notes pour l'année {activeYear} en un clic."
              </p>
              <Button asChild className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl font-black h-12 md:h-16 shadow-xl shadow-primary/20 transition-all active:scale-95 mobile-touch-target">
                <Link href="/assistant">Lancer l'Audit IA</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}