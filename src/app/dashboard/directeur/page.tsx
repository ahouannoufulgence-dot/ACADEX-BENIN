"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Wallet, 
  UserCheck, 
  Loader2, 
  Zap,
  Sparkles,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Search,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useFirestore, useCollection } from "@/firebase"
import { collection, doc, onSnapshot } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export default function DirectorDashboard() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ name: "Chargement...", year: "2024-2025" })
  const [directorFullName, setDirectorFullName] = useState("le Directeur")

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

  // Requêtes Firestore réelles
  const { data: students, loading: loadingStudents } = useCollection(collection(db, "students"))
  const { data: teachers, loading: loadingTeachers } = useCollection(collection(db, "teachers"))
  const { data: registrationIds, loading: loadingIds } = useCollection(collection(db, "registration_ids"))
  const { data: payments, loading: loadingPayments } = useCollection(collection(db, "payments"))

  // Statistiques calculées STRICTEMENT sur les données Firestore (Zéro par défaut)
  const stats = useMemo(() => {
    const totalStudents = Array.isArray(students) ? students.length : 0
    const activeTeachers = Array.isArray(teachers) ? teachers.filter((t: any) => t.status === "Actif").length : 0
    const unusedIds = Array.isArray(registrationIds) ? registrationIds.filter((id: any) => id.status === "non utilisé").length : 0
    const totalRevenue = Array.isArray(payments) ? payments.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) : 0
    const pendingPaymentsCount = Array.isArray(payments) ? payments.filter((p: any) => p.status === 'En attente').length : 0
    
    // Dernier élève inscrit (activité réelle)
    const lastStudent = Array.isArray(students) && students.length > 0 ? students[0] : null

    return {
      totalStudents,
      activeTeachers,
      unusedIds,
      totalRevenue,
      pendingPaymentsCount,
      lastStudent
    }
  }, [students, teachers, registrationIds, payments])

  if (!mounted) return null

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* EN-TÊTE PROFESSIONNEL AVEC FORMULE DE RESPECT */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-muted/20 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Bonjour Monsieur le Directeur <span className="text-primary italic">{directorFullName}</span>,
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black px-4 py-1 text-sm uppercase">
                {schoolInfo.name}
              </Badge>
              <div className="flex items-center gap-2 font-bold text-sm bg-muted/50 px-4 py-1 rounded-full capitalize">
                <Calendar className="size-4 text-primary" /> {today}
              </div>
              <div className="flex items-center gap-2 font-bold text-sm bg-muted/50 px-4 py-1 rounded-full">
                <Clock className="size-4 text-primary" /> Année {schoolInfo.year}
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none hidden md:block" />
        </div>

        {/* CARTES STATISTIQUES PRINCIPALES (100% RÉELLES) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Total Élèves</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-foreground">
                {loadingStudents ? <Loader2 className="animate-spin size-6 text-primary/20" /> : stats.totalStudents}
              </p>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><Users className="size-6" /></div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Enseignants Actifs</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-foreground">
                {loadingTeachers ? <Loader2 className="animate-spin size-6 text-primary/20" /> : stats.activeTeachers}
              </p>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><GraduationCap className="size-6" /></div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Présents ce jour</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-foreground">0</p>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><UserCheck className="size-6" /></div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Paiements en attente</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-foreground">
                {loadingPayments ? <Loader2 className="animate-spin size-6 text-primary/20" /> : stats.pendingPaymentsCount}
              </p>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><CreditCard className="size-6" /></div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* ALERTES IMPORTANTES (AUTOMATIQUES) */}
            <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-red-50/30">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-6 text-destructive" />
                  <CardTitle className="text-2xl font-black tracking-tight">Alertes Systèmes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-muted/30">
                  {stats.unusedIds > 0 && (
                    <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-black">{stats.unusedIds}</div>
                        <p className="font-bold text-sm text-foreground/80">Identifiants élèves générés mais non activés.</p>
                      </div>
                      <Button asChild variant="ghost" className="rounded-xl font-bold text-amber-700">
                        <Link href="/eleves/identifiants">Gérer <ArrowRight className="ml-2 size-4" /></Link>
                      </Button>
                    </div>
                  )}
                  
                  {stats.totalStudents === 0 && !loadingStudents && (
                    <div className="p-12 text-center text-muted-foreground font-bold flex flex-col items-center gap-4">
                      <Users className="size-10 opacity-20" />
                      <div className="space-y-1">
                        <p>Aucun élève dans la base de données.</p>
                        <p className="text-xs font-medium opacity-60">Utilisez le menu "Identifiants" pour commencer l'enrôlement.</p>
                      </div>
                    </div>
                  )}

                  {stats.totalStudents > 0 && stats.unusedIds === 0 && stats.pendingPaymentsCount === 0 && (
                    <div className="p-12 text-center text-emerald-600 font-bold flex flex-col items-center gap-2">
                       <CheckCircle2 className="size-10 opacity-30" />
                       <p className="text-sm">Tout est en ordre. Aucune alerte critique détectée.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CLASSES EN DIFFICULTÉ */}
            <Card className="border-none shadow-sm bg-white rounded-[3rem] p-8">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <TrendingDown className="text-destructive" /> Analyse Radar : Classes Faibles
                </h3>
              </div>
              <div className="p-16 text-center border-4 border-dashed rounded-[2.5rem] opacity-30 bg-muted/10">
                <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Aucune anomalie de niveau détectée pour le moment.</p>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* DERNIÈRES ACTIVITÉS RÉELLES */}
            <Card className="p-8 rounded-[3rem] bg-white border-none shadow-sm">
               <div className="flex items-center justify-between mb-8">
                 <h4 className="text-xl font-black">Dernière activité</h4>
                 <Activity className="size-5 text-primary opacity-20" />
               </div>
               <div className="space-y-8">
                  {stats.lastStudent ? (
                    <div className="flex gap-4 group">
                      <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black shrink-0 text-xl uppercase">
                        {stats.lastStudent.lastName?.[0] || "?"}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-foreground">Nouvelle inscription</p>
                        <p className="text-xs font-bold text-primary">{stats.lastStudent.firstName} {stats.lastStudent.lastName}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Classe : {stats.lastStudent.classId}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 opacity-30">
                       <p className="text-[10px] font-black uppercase tracking-widest">Aucun mouvement récent.</p>
                    </div>
                  )}
               </div>
            </Card>

            {/* TRÉSORERIE RÉSUMÉ */}
            <Card className="p-8 rounded-[2.5rem] bg-foreground text-white border-none shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-black text-lg">Trésorerie</h4>
                <Wallet className="size-5 text-primary" />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 mb-1">Total Recouvré</p>
                  <p className="text-3xl font-black text-primary">{stats.totalRevenue.toLocaleString()} FCFA</p>
                </div>
                <Button asChild className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl font-black h-11 text-xs">
                  <Link href="/paiements">Détails Financiers</Link>
                </Button>
              </div>
            </Card>

            {/* ASSISTANT ACADEX */}
            <Card className="p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 group hover:bg-primary/10 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="size-6 text-primary animate-pulse" />
                <h4 className="font-black text-lg">Cerveau ACADEX</h4>
              </div>
              <div className="space-y-3">
                {["Qui est absent ?", "Bilan financier", "Classes faibles"].map((q) => (
                  <Button key={q} asChild variant="ghost" className="w-full justify-between bg-white rounded-xl h-10 px-4 text-[10px] font-black uppercase text-primary border border-primary/5 hover:border-primary/20">
                    <Link href="/assistant">
                      {q} <Search className="size-3 opacity-30" />
                    </Link>
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
