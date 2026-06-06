
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Activity,
  Calendar,
  Wallet,
  UserCheck,
  Loader2,
  Zap
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
  const [schoolInfo, setSchoolInfo] = useState({ name: "ACADEX ELITE", year: "2024-2025" })

  useEffect(() => {
    setMounted(true)
    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setSchoolInfo({ name: d.schoolName || "ACADEX ELITE", year: d.academicYear || "2024-2025" })
      }
    })
    return () => unsub()
  }, [db])

  // Data Fetching Réel
  const studentsRef = useMemo(() => collection(db, "students"), [db])
  const teachersRef = useMemo(() => collection(db, "teachers"), [db])
  const idsRef = useMemo(() => collection(db, "registration_ids"), [db])
  const paymentsRef = useMemo(() => collection(db, "payments"), [db])
  const gradesRef = useMemo(() => collection(db, "grades"), [db])
  
  const { data: students, loading: loadingStudents } = useCollection(studentsRef)
  const { data: teachers } = useCollection(teachersRef)
  const { data: registrationIds } = useCollection(idsRef)
  const { data: payments } = useCollection(paymentsRef)
  const { data: grades } = useCollection(gradesRef)

  // Statistiques calculées sur données réelles (Strictement 0 par défaut)
  const stats = useMemo(() => {
    const totalStudents = students?.length || 0
    const activeTeachers = teachers?.filter((t: any) => t.status === "Actif").length || 0
    const pendingTeachers = teachers?.filter((t: any) => t.status === "En attente").length || 0
    const unusedIds = registrationIds?.filter((id: any) => id.status === "non utilisé").length || 0
    const totalRevenue = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const lastStudent = students && students.length > 0 ? students[0] : null

    return {
      totalStudents,
      activeTeachers,
      pendingTeachers,
      unusedIds,
      totalRevenue,
      lastStudent
    }
  }, [students, teachers, registrationIds, payments])

  // Intelligence: Classes en difficulté réelle
  const classesInDifficulty = useMemo(() => {
    if (!grades || grades.length === 0) return []
    const classAverages: Record<string, { sum: number, count: number }> = {}
    grades.forEach((g: any) => {
      if (!classAverages[g.classId]) classAverages[g.classId] = { sum: 0, count: 0 }
      classAverages[g.classId].sum += g.average || 0
      classAverages[g.classId].count += 1
    })
    return Object.entries(classAverages)
      .map(([id, data]) => ({ id, avg: data.sum / data.count }))
      .filter(c => c.avg < 10)
      .slice(0, 3)
  }, [grades])

  if (!mounted) return null

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* EN-TÊTE BIENVENUE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-muted/20">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Bonjour Monsieur le Directeur
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-medium">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black px-3">
                {schoolInfo.name}
              </Badge>
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">•</span>
              <span className="text-sm font-bold flex items-center gap-2 capitalize">
                <Calendar className="size-4" /> {today}
              </span>
            </div>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black">
            <Link href="/assistant">
              <Sparkles className="mr-2 size-5 fill-white" /> Cerveau ACADEX
            </Link>
          </Button>
        </div>

        {/* CARTES STATISTIQUES PRINCIPALES - TOUTES À ZÉRO SI VIDE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Users className="size-7" />
              </div>
              <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px]">TOTAL</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Élèves Inscrits</p>
            <p className="text-4xl font-black text-foreground mt-1">
              {loadingStudents ? <Loader2 className="animate-spin size-6" /> : stats.totalStudents}
            </p>
          </Card>

          <Card className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <GraduationCap className="size-7" />
              </div>
              <UserCheck className="size-5 text-emerald-500 opacity-40" />
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Enseignants Actifs</p>
            <p className="text-4xl font-black text-foreground mt-1">{stats.activeTeachers}</p>
          </Card>

          <Card className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Zap className="size-7" />
              </div>
              <Badge variant="outline" className="border-amber-200 text-amber-700 font-black">STOCK</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Identifiants Libres</p>
            <p className="text-4xl font-black text-foreground mt-1">{stats.unusedIds}</p>
          </Card>

          <Card className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                <CreditCard className="size-7" />
              </div>
              <Wallet className="size-5 text-purple-500 opacity-40" />
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recettes (FCFA)</p>
            <p className="text-2xl font-black text-foreground mt-1">{stats.totalRevenue.toLocaleString()}</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* COLONNE GAUCHE: ALERTES & ANALYSE */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-muted/5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-5 text-destructive animate-pulse" />
                  <CardTitle className="text-xl font-black tracking-tight">Alertes Prioritaires</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-muted/30">
                  {stats.pendingTeachers > 0 && (
                    <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center font-black">{stats.pendingTeachers}</div>
                        <div>
                          <p className="font-bold text-sm">Enseignants en attente de validation</p>
                          <p className="text-[10px] uppercase font-black text-muted-foreground">Action requise</p>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="icon" className="rounded-xl"><Link href="/enseignants"><ArrowRight className="size-4" /></Link></Button>
                    </div>
                  )}
                  {stats.unusedIds > 0 && (
                    <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center font-black">{stats.unusedIds}</div>
                        <div>
                          <p className="font-bold text-sm">Identifiants élèves disponibles</p>
                          <p className="text-[10px] uppercase font-black text-muted-foreground">Prêts pour distribution</p>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="icon" className="rounded-xl"><Link href="/eleves/identifiants"><ArrowRight className="size-4" /></Link></Button>
                    </div>
                  )}
                  {stats.totalStudents === 0 && stats.pendingTeachers === 0 && stats.unusedIds === 0 && (
                    <div className="p-12 text-center text-muted-foreground italic font-medium">
                      Aucune alerte pour le moment.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight">Classes en Difficulté</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Moyennes inférieures à 10/20</p>
                </div>
                <TrendingDown className="size-8 text-destructive opacity-20" />
              </div>
              
              {classesInDifficulty.length === 0 ? (
                <div className="p-12 text-center bg-muted/10 rounded-3xl space-y-3">
                   <CheckCircle2 className="size-10 text-emerald-500 mx-auto" />
                   <p className="font-bold text-muted-foreground">Toutes les classes maintiennent un bon niveau.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {classesInDifficulty.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-6 bg-red-50/50 border border-red-100 rounded-[2rem] group hover:bg-red-50 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="size-14 bg-white rounded-2xl flex items-center justify-center font-black text-destructive shadow-sm">
                          {cls.id[0]}
                        </div>
                        <div>
                          <p className="font-black text-lg">{cls.id}</p>
                          <p className="text-xs font-bold text-red-600 uppercase">Moyenne : {cls.avg.toFixed(2)}</p>
                        </div>
                      </div>
                      <Button asChild className="rounded-xl bg-white text-destructive border border-red-200 hover:bg-red-600 hover:text-white font-black h-11 px-6 shadow-sm">
                        <Link href="/statistiques">Détails</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* COLONNE DROITE: ACTIVITÉ & FINANCES */}
          <div className="lg:col-span-5 space-y-8">
            <Card className="premium-card p-8 bg-foreground text-white overflow-hidden relative group">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-primary rounded-xl flex items-center justify-center">
                    <Sparkles className="size-6 text-white" />
                  </div>
                  <h4 className="text-xl font-black italic">Audit Intelligence IA</h4>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Questions suggérées :</p>
                  {["Qui n'a pas payé ?", "Moyenne de l'école ?", "Profs absents ?"].map((q, i) => (
                    <button key={i} className="text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-bold uppercase flex justify-between items-center group/btn">
                      {q}
                      <ArrowRight className="size-3" />
                    </button>
                  ))}
                </div>
              </div>
              <Activity className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none" />
            </Card>

            <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-lg font-black tracking-tight">Trésorerie Réelle</h4>
                <Button asChild variant="ghost" className="text-primary font-black text-xs rounded-xl">
                   <Link href="/paiements">Détails</Link>
                </Button>
              </div>
              <div className="p-6 bg-muted/20 rounded-3xl">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Encaissements Totaux</p>
                <p className="text-2xl font-black text-foreground">{stats.totalRevenue.toLocaleString()} <span className="text-xs">FCFA</span></p>
              </div>
            </Card>

            <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm">
               <h4 className="text-lg font-black mb-6">Dernière Inscription</h4>
               <div className="space-y-6">
                  {stats.lastStudent ? (
                    <div className="flex gap-4 group">
                      <div className="size-2 bg-primary rounded-full mt-2 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-foreground">{stats.lastStudent.firstName} {stats.lastStudent.lastName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{stats.lastStudent.classId}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-muted-foreground italic">Aucun élève inscrit dans la base.</p>
                  )}
               </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
