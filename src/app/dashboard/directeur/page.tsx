
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
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX", year: "2024-2025" })
  const [directorFullName, setDirectorFullName] = useState("le Directeur")

  const heroImage = placeholderData.placeholderImages.find(img => img.id === "hero-students")

  useEffect(() => {
    setMounted(true)
    const name = localStorage.getItem('acadex_user_name')
    if (name) setDirectorFullName(name)

    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setSchoolInfo({ name: d.schoolName || "ACADEX ELITE", year: d.academicYear || "2024-2025" })
      }
    })
    return () => unsub()
  }, [db])

  const studentsQuery = useMemo(() => query(collection(db, "students"), where("status", "==", "Actif")), [db])
  const teachersQuery = useMemo(() => query(collection(db, "teachers")), [db])
  const regIdsQuery = useMemo(() => query(collection(db, "registration_ids"), where("status", "==", "non utilisé")), [db])
  const paymentsQuery = useMemo(() => query(collection(db, "payments")), [db])
  const gradesQuery = useMemo(() => query(collection(db, "grades")), [db])

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
      <div className="space-y-8 animate-in">
        
        {/* Immersive Header Banner */}
        <div className="relative min-h-[320px] rounded-[3.5rem] overflow-hidden shadow-2xl group">
          <Image 
            src={heroImage?.imageUrl || "https://picsum.photos/seed/acadex-director/1920/1080"}
            alt="Director Cockpit Background"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-1000"
            priority
            data-ai-hint={heroImage?.imageHint || "smiling students"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-transparent" />
          
          <div className="absolute inset-0 p-12 flex flex-col justify-center gap-6">
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                Bonjour Monsieur <span className="text-emerald-400 italic">le Directeur {directorFullName}</span>,
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black px-6 py-2 uppercase tracking-widest text-xs">
                  {schoolInfo.name}
                </Badge>
                <div className="flex items-center gap-2 font-bold text-sm bg-white/10 backdrop-blur-md text-white/90 px-6 py-2 rounded-full border border-white/10">
                  <Calendar className="size-4 text-emerald-400" /> {today}
                </div>
                <div className="flex items-center gap-2 font-bold text-sm bg-emerald-500 text-white px-6 py-2 rounded-full shadow-lg shadow-emerald-500/30">
                  <ShieldCheck className="size-4" /> Cockpit Certifié
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Élèves Actifs</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-foreground">{loadingStudents ? <Loader2 className="animate-spin" /> : stats.totalStudents}</p>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><Users className="size-6" /></div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Enseignants</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-foreground">{loadingTeachers ? <Loader2 className="animate-spin" /> : stats.totalTeachers}</p>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><GraduationCap className="size-6" /></div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Moyenne École</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-foreground">{stats.avg}</p>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><Zap className="size-6" /></div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Recouvrement</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-foreground">{stats.revenue.toLocaleString()} <span className="text-xs font-bold opacity-50">F</span></p>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><Wallet className="size-6" /></div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-red-50/30 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-6 text-destructive" />
                  <CardTitle className="text-2xl font-black">Alertes Flux</CardTitle>
                </div>
                {stats.idsCount > 0 && <Badge className="bg-destructive text-white font-black">{stats.idsCount} À ACTIVER</Badge>}
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-muted/30">
                  {stats.idsCount > 0 && (
                    <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-black">{stats.idsCount}</div>
                        <p className="font-bold text-sm text-foreground/80">Identifiants en attente de déploiement élèves.</p>
                      </div>
                      <Button asChild variant="ghost" className="rounded-xl font-bold text-primary">
                        <Link href="/eleves/identifiants">Gérer <ArrowRight className="ml-2 size-4" /></Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-[3rem] p-8">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><TrendingUp className="text-primary" /> Performance Académique</h3>
              <div className="p-16 text-center border-4 border-dashed rounded-[2.5rem] opacity-30 bg-muted/10">
                <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Comparatif des classes en temps réel.</p>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="p-8 rounded-[3rem] bg-white border-none shadow-sm">
               <h4 className="text-xl font-black mb-8 flex items-center gap-2"><Activity className="size-5 text-primary" /> État des Services</h4>
               <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-muted-foreground">Synchronisation</span>
                    <Badge className="bg-emerald-500">ACTIVE</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-muted-foreground">Moteur IA</span>
                    <Badge className="bg-primary">PRÊT</Badge>
                  </div>
               </div>
            </Card>

            <Card className="p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 group hover:bg-primary/10 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="size-6 text-primary animate-pulse" />
                <h4 className="font-black text-lg">Cerveau ACADEX</h4>
              </div>
              <p className="text-sm font-medium text-muted-foreground italic leading-relaxed mb-6">"Analysez les disparités de notes entre vos {stats.totalTeachers} enseignants."</p>
              <Button asChild className="w-full bg-white text-primary hover:bg-white/90 rounded-xl font-black h-11 border border-primary/10">
                <Link href="/assistant">Ouvrir l'Assistant</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
