
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

  // Requêtes Firestore réelles (Sans données simulées)
  const studentsRef = useMemo(() => collection(db, "students"), [db])
  const teachersRef = useMemo(() => collection(db, "teachers"), [db])
  const idsRef = useMemo(() => collection(db, "registration_ids"), [db])
  const paymentsRef = useMemo(() => collection(db, "payments"), [db])
  const gradesRef = useMemo(() => collection(db, "grades"), [db])
  
  const { data: students, loading: loadingStudents } = useCollection(studentsRef)
  const { data: teachers, loading: loadingTeachers } = useCollection(teachersRef)
  const { data: registrationIds, loading: loadingIds } = useCollection(idsRef)
  const { data: payments, loading: loadingPayments } = useCollection(paymentsRef)
  const { data: grades } = useCollection(gradesRef)

  // Statistiques calculées uniquement sur les données présentes dans Firestore
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

  if (!mounted) return null

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* EN-TÊTE BIENVENUE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-muted/20">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Tableau de Bord de Pilotage
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-medium">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black px-3 uppercase">
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

        {/* CARTES STATISTIQUES RÉELLES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Users className="size-7" />
              </div>
              <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px]">RÉEL</Badge>
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
            <p className="text-4xl font-black text-foreground mt-1">
              {loadingTeachers ? <Loader2 className="animate-spin size-6" /> : stats.activeTeachers}
            </p>
          </Card>

          <Card className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Zap className="size-7" />
              </div>
              <Badge variant="outline" className="border-amber-200 text-amber-700 font-black">STOCK</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Identifiants Libres</p>
            <p className="text-4xl font-black text-foreground mt-1">
              {loadingIds ? <Loader2 className="animate-spin size-6" /> : stats.unusedIds}
            </p>
          </Card>

          <Card className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                <CreditCard className="size-7" />
              </div>
              <Wallet className="size-5 text-purple-500 opacity-40" />
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recettes (FCFA)</p>
            <p className="text-2xl font-black text-foreground mt-1">
              {loadingPayments ? <Loader2 className="animate-spin size-6" /> : stats.totalRevenue.toLocaleString()}
            </p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* COLONNE GAUCHE: ALERTES & ANALYSE */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-muted/5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-5 text-destructive" />
                  <CardTitle className="text-xl font-black tracking-tight">Alertes Systèmes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-muted/30">
                  {stats.pendingTeachers > 0 && (
                    <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center font-black">{stats.pendingTeachers}</div>
                        <div>
                          <p className="font-bold text-sm">Enseignants en attente de validation</p>
                          <p className="text-[10px] uppercase font-black text-muted-foreground">Action Requise</p>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="icon" className="rounded-xl"><Link href="/enseignants"><ArrowRight className="size-4" /></Link></Button>
                    </div>
                  )}
                  
                  {stats.totalStudents === 0 && (
                    <div className="p-12 text-center text-muted-foreground italic font-medium">
                      Aucun élève n'est encore inscrit dans la base de données.
                    </div>
                  )}
                  
                  {stats.unusedIds > 0 && (
                    <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center font-black">{stats.unusedIds}</div>
                        <div>
                          <p className="font-bold text-sm">Identifiants élèves prêts à la distribution</p>
                          <p className="text-[10px] uppercase font-black text-muted-foreground">Stock Actuel</p>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="icon" className="rounded-xl"><Link href="/eleves/identifiants"><ArrowRight className="size-4" /></Link></Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLONNE DROITE: ACTIVITÉ RÉCENTE */}
          <div className="lg:col-span-5 space-y-8">
            <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm">
               <h4 className="text-lg font-black mb-6">Dernière Inscription Firestore</h4>
               <div className="space-y-6">
                  {stats.lastStudent ? (
                    <div className="flex gap-4 group">
                      <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black shrink-0">
                        {stats.lastStudent.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{stats.lastStudent.firstName} {stats.lastStudent.lastName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{stats.lastStudent.classId} • {stats.lastStudent.matricule}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 opacity-30">
                       <Users className="size-10 mx-auto mb-2" />
                       <p className="text-xs font-black uppercase">Base de données vide</p>
                    </div>
                  )}
               </div>
            </Card>

            <Card className="p-8 rounded-[2.5rem] bg-foreground text-white border-none shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-lg font-black mb-4">Note de l'Éditeur</h4>
                <p className="text-xs text-white/60 leading-relaxed italic">
                  "Si le nombre d'élèves affiche 7 alors que vous n'en voyez aucun, veuillez vérifier les filtres de la collection 'students' dans votre console Firebase ou supprimer les anciens profils dans le module de gestion."
                </p>
              </div>
              <Activity className="absolute -bottom-10 -right-10 size-32 text-white/5" />
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
