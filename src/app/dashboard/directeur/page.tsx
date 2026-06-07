
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
  Loader2, 
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useFirestore, useCollection } from "@/firebase"
import { collection, doc, onSnapshot, query, where } from "firebase/firestore"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export default function DirectorDashboard() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX", year: "2024-2025" })
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

  // REQUÊTES STRICTES POUR COMPTEURS RÉELS
  // Un élève est "réel" s'il a un matricule et un nom (évite de compter les codes non activés)
  const studentsQuery = useMemo(() => query(collection(db, "students"), where("status", "==", "Actif")), [db])
  const teachersQuery = useMemo(() => query(collection(db, "teachers")), [db])
  const regIdsQuery = useMemo(() => query(collection(db, "registration_ids"), where("status", "==", "non utilisé")), [db])
  const paymentsQuery = useMemo(() => query(collection(db, "payments")), [db])
  const gradesQuery = useMemo(() => query(collection(db, "grades")), [db])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)
  const { data: teachers, loading: loadingTeachers } = useCollection(teachersQuery)
  const { data: unusedIds, loading: loadingIds } = useCollection(regIdsQuery)
  const { data: payments } = useCollection(paymentsQuery)
  const { data: grades } = useCollection(gradesQuery)

  const stats = useMemo(() => {
    // Filtrage supplémentaire côté client pour être sûr du "Zéro Absolu"
    const realStudents = students?.filter((s: any) => s.matricule && s.lastName) || []
    const totalStudents = realStudents.length
    
    const realTeachers = teachers?.filter((t: any) => t.fullName) || []
    const totalTeachers = realTeachers.length

    const idsCount = unusedIds?.length || 0
    const revenue = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    
    // Calcul de la moyenne de l'école (moyenne des moyennes enregistrées)
    const validGrades = grades?.filter((g: any) => g.value !== undefined) || []
    const avg = validGrades.length 
      ? (validGrades.reduce((acc, g: any) => acc + (Number(g.value) || 0), 0) / validGrades.length).toFixed(2)
      : "0.00"

    const lastStudent = realStudents.length ? realStudents[0] : null

    return { totalStudents, totalTeachers, idsCount, revenue, avg, lastStudent }
  }, [students, teachers, unusedIds, payments, grades])

  if (!mounted) return null

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-muted/20 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              Bonjour Monsieur le Directeur <span className="text-primary italic">{directorFullName}</span>,
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black px-4 py-1 text-sm uppercase">
                {schoolInfo.name}
              </Badge>
              <div className="flex items-center gap-2 font-bold text-sm bg-muted/50 px-4 py-1 rounded-full">
                <Calendar className="size-4 text-primary" /> {today}
              </div>
              <div className="flex items-center gap-2 font-bold text-sm bg-muted/50 px-4 py-1 rounded-full">
                <Clock className="size-4 text-primary" /> Année {schoolInfo.year}
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none hidden md:block" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Élèves Actifs</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-foreground">{loadingStudents ? "..." : stats.totalStudents}</p>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><Users className="size-6" /></div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Corps Enseignant</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-foreground">{loadingTeachers ? "..." : stats.totalTeachers}</p>
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
              <p className="text-2xl font-black text-foreground">{stats.revenue.toLocaleString()} <span className="text-xs">FCFA</span></p>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><CreditCard className="size-6" /></div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-red-50/30 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-6 text-destructive" />
                  <CardTitle className="text-2xl font-black tracking-tight">Alertes Systèmes</CardTitle>
                </div>
                {stats.idsCount > 0 && <Badge className="bg-destructive text-white font-black">{stats.idsCount} EN ATTENTE</Badge>}
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-muted/30">
                  {stats.idsCount > 0 && (
                    <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-black">{stats.idsCount}</div>
                        <p className="font-bold text-sm text-foreground/80">Identifiants élèves non encore activés.</p>
                      </div>
                      <Button asChild variant="ghost" className="rounded-xl font-bold text-primary">
                        <Link href="/eleves/identifiants">Gérer <ArrowRight className="ml-2 size-4" /></Link>
                      </Button>
                    </div>
                  )}
                  {stats.totalStudents === 0 && !loadingStudents && (
                    <div className="p-12 text-center text-muted-foreground font-bold flex flex-col items-center gap-2">
                       <CheckCircle2 className="size-10 opacity-10" />
                       <p className="text-sm italic">Aucun élève n'a encore activé son compte Cockpit.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-[3rem] p-8">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <TrendingUp className="text-primary" /> Performance Académique
                </h3>
              </div>
              <div className="p-16 text-center border-4 border-dashed rounded-[2.5rem] opacity-30 bg-muted/10">
                <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Les courbes de progression s'afficheront après le 1er trimestre.</p>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="p-8 rounded-[3rem] bg-white border-none shadow-sm">
               <h4 className="text-xl font-black mb-8">Dernière activité</h4>
               <div className="space-y-8">
                  {stats.lastStudent ? (
                    <div className="flex gap-4 group">
                      <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black shrink-0 text-xl uppercase shadow-sm">
                        {(stats.lastStudent?.lastName || "?").charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-foreground">Nouvelle inscription</p>
                        <p className="text-xs font-bold text-primary">{stats.lastStudent?.firstName} {stats.lastStudent?.lastName}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Classe : {stats.lastStudent?.classId}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 opacity-30 italic font-medium">Aucun mouvement récent.</div>
                  )}
               </div>
            </Card>

            <Card className="p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 group hover:bg-primary/10 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="size-6 text-primary animate-pulse" />
                <h4 className="font-black text-lg">Cerveau ACADEX</h4>
              </div>
              <div className="space-y-3">
                {["Points sur les notes", "Bilan financier", "Classes à suivre"].map((q) => (
                  <Button key={q} asChild variant="ghost" className="w-full justify-between bg-white rounded-xl h-10 px-4 text-[10px] font-black uppercase text-primary border border-primary/5 hover:border-primary/20">
                    <Link href="/assistant">{q} <ArrowRight className="size-3 opacity-30" /></Link>
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
