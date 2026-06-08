
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
  Clock,
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection } from "@/firebase"
import { collection, doc, onSnapshot, query, where } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import placeholderData from "@/app/lib/placeholder-images.json"

export default function DirectorDashboard() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX", year: "2026-2027" })
  const [directorFullName, setDirectorFullName] = useState("le Directeur")
  const [activeYear, setActiveYear] = useState("2026-2027")

  const heroImage = placeholderData.placeholderImages.find(img => img.id === "hero-students")

  useEffect(() => {
    setMounted(true)
    const name = localStorage.getItem('acadex_user_name')
    if (name) setDirectorFullName(name)

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

  // REQUÊTES FILTRÉES PAR ANNÉE ACTIVE
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
      <div className="space-y-6 md:space-y-10 animate-in">
        
        {/* Immersive Hero Section - Ultra Premium Mobile */}
        <div className="relative min-h-[300px] md:min-h-[350px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl group border-4 border-white">
          <Image 
            src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-director/1920/1080"}
            alt="Director Cockpit Background"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
            priority
            data-ai-hint={heroImage?.imageHint || "smiling students"}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/60 to-transparent" />
          
          <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end md:justify-center gap-4 md:gap-6">
            <div className="space-y-2 md:space-y-4 max-w-2xl">
              <p className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-[0.3em] drop-shadow-md">Espace Pilotage Stratégique</p>
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-tight">
                Bonjour <span className="text-emerald-400 italic">M. le Directeur</span>,
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 pt-2">
                <Badge className="bg-white/20 backdrop-blur-xl text-white border-white/10 font-black px-4 md:px-6 py-2 uppercase tracking-widest text-[9px] md:text-xs">
                  {schoolInfo.name}
                </Badge>
                <div className="flex items-center gap-2 font-bold text-[9px] md:text-sm bg-white/10 backdrop-blur-xl text-white/90 px-4 md:px-6 py-2 rounded-full border border-white/10">
                  <Calendar className="size-3 md:size-4 text-emerald-400" /> {today}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rapid Stats Grid - Card Design optimized for Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: "Élèves Actifs", value: stats.totalStudents, loading: loadingStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Enseignants", value: stats.totalTeachers, loading: loadingTeachers, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Moyenne École", value: stats.avg, loading: false, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Recouvrement", value: `${stats.revenue.toLocaleString()} F`, loading: false, icon: Wallet, color: "text-purple-600", bg: "bg-purple-50" }
          ].map((stat, i) => (
            <Card key={i} className="p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group overflow-hidden relative">
              <div className={cn("absolute -top-4 -right-4 size-20 md:size-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform", stat.bg.replace('bg-', 'bg-'))} />
              <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3 md:mb-5">{stat.label}</p>
              <div className="flex items-center justify-between">
                <div className="text-xl md:text-4xl font-black text-foreground truncate mr-2">
                  {stat.loading ? <Loader2 className="animate-spin size-5 md:size-7" /> : stat.value}
                </div>
                <div className={cn("p-2.5 md:p-4 rounded-xl md:rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm", stat.bg, stat.color)}>
                  <stat.icon className="size-5 md:size-7" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Detailed Insights & Actions */}
        <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
          <div className="lg:col-span-8 space-y-6 md:space-y-10">
            {stats.idsCount > 0 && (
              <Card className="border-none shadow-xl bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden border-t-8 border-destructive">
                <CardHeader className="p-6 md:p-10 border-b bg-red-50/20 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 md:size-12 bg-destructive text-white rounded-xl flex items-center justify-center shadow-lg shadow-destructive/20">
                      <AlertTriangle className="size-5 md:size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg md:text-2xl font-black">Alertes Flux</CardTitle>
                      <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Action Immédiate Requise</p>
                    </div>
                  </div>
                  <Badge className="bg-destructive text-white font-black px-4 py-1.5 rounded-full text-[9px] md:text-xs">{stats.idsCount} EN ATTENTE</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 md:p-10 flex items-center justify-between bg-muted/5 group cursor-pointer hover:bg-muted/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="size-12 md:size-14 bg-white rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-inner border border-muted/50 text-destructive">{stats.idsCount}</div>
                      <div className="space-y-0.5">
                        <p className="font-black text-sm md:text-lg text-foreground">Identifiants de connexion</p>
                        <p className="text-[10px] md:text-sm font-medium text-muted-foreground">Déployez les codes aux nouveaux élèves.</p>
                      </div>
                    </div>
                    <Button asChild variant="ghost" className="size-10 md:size-12 rounded-xl text-primary group-hover:translate-x-2 transition-transform">
                      <Link href="/eleves/identifiants"><ArrowRight className="size-5 md:size-6" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10">
              <div className="flex items-center justify-between mb-8 md:mb-10">
                <div className="space-y-1">
                  <h3 className="text-xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-primary size-6 md:size-8" /> Performance Académique
                  </h3>
                  <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{activeYear} • Analyse Live</p>
                </div>
                <Button variant="outline" className="rounded-xl font-bold text-[10px] md:text-xs h-10 border-2">Détails <ChevronRight className="ml-1 size-3" /></Button>
              </div>
              <div className="p-12 md:p-20 text-center border-4 border-dashed rounded-[2.5rem] bg-muted/10 opacity-40">
                <div className="size-16 md:size-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm mb-6">
                   <Zap className="size-8 md:size-10 text-primary" />
                </div>
                <p className="font-black text-muted-foreground uppercase tracking-widest text-[10px] md:text-xs">Synchronisation des notes en cours...</p>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <Card className="p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-foreground text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10">
                 <h4 className="text-lg md:text-xl font-black mb-6 md:mb-8 flex items-center gap-3">
                  <Activity className="size-5 text-primary" /> État des Services
                 </h4>
                 <div className="space-y-5 md:space-y-6">
                    {[
                      { label: "Base de Données", status: "OPÉRATIONNEL", color: "bg-emerald-500" },
                      { label: "Moteur IA Acadex", status: "ACTIF", color: "bg-primary" },
                      { label: "Passerelle SMS/Mail", status: "SYNC", color: "bg-blue-500" }
                    ].map((svc, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] md:text-sm font-bold p-3 md:p-4 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-white/60">{svc.label}</span>
                        <Badge className={cn(svc.color, "text-white border-none font-black text-[8px] md:text-[10px]")}>{svc.status}</Badge>
                      </div>
                    ))}
                 </div>
               </div>
               <ShieldCheck className="absolute -bottom-10 -right-10 size-40 md:size-48 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            </Card>

            <Card className="p-8 md:p-10 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 group hover:bg-primary/10 transition-all cursor-pointer">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 md:size-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 animate-bounce-slow">
                  <Sparkles className="size-6 md:size-8 text-primary fill-primary/10" />
                </div>
                <div>
                  <h4 className="font-black text-lg md:text-xl">Assistant IA</h4>
                  <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">Brain v1.0</p>
                </div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground italic leading-relaxed mb-6 md:mb-8">
                "Analysez les disparités de notes entre vos classes pour l'année {activeYear} en un clic."
              </p>
              <Button asChild className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl font-black h-12 md:h-14 shadow-xl shadow-primary/20 transition-all active:scale-95">
                <Link href="/assistant">Lancer l'Audit IA</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
