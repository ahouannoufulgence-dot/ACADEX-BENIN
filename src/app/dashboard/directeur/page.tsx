
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
  Zap,
  Activity,
  Calendar,
  Wallet,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, limit, doc, onSnapshot } from "firebase/firestore"
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

  // Data Fetching
  const studentsRef = useMemo(() => collection(db, "students"), [db])
  const teachersRef = useMemo(() => collection(db, "teachers"), [db])
  const idsRef = useMemo(() => collection(db, "registration_ids"), [db])
  const paymentsRef = useMemo(() => collection(db, "payments"), [db])
  const gradesRef = useMemo(() => collection(db, "grades"), [db])
  
  const { data: students } = useCollection(studentsRef)
  const { data: teachers } = useCollection(teachersRef)
  const { data: registrationIds } = useCollection(idsRef)
  const { data: payments } = useCollection(paymentsRef)
  const { data: grades } = useCollection(gradesRef)

  // Computed Stats
  const stats = useMemo(() => {
    const activeTeachers = teachers?.filter((t: any) => t.status === "Actif").length || 0
    const unusedIds = registrationIds?.filter((id: any) => id.status === "non utilisé").length || 0
    const totalRevenue = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0

    return {
      totalStudents: students?.length || 0,
      activeTeachers,
      unusedIds,
      totalRevenue,
      presentTeachers: Math.round(activeTeachers * 0.9) // Simulation car module présence à lier
    }
  }, [students, teachers, registrationIds, payments])

  // Intelligence: Classes en difficulté (Moyenne < 10)
  const classesInDifficulty = useMemo(() => {
    if (!grades) return []
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
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Année Scolaire</p>
              <p className="text-lg font-black text-primary">{schoolInfo.year}</p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black">
              <Link href="/assistant">
                <Sparkles className="mr-2 size-5 fill-white" /> Cerveau ACADEX
              </Link>
            </Button>
          </div>
        </div>

        {/* CARTES STATISTIQUES PRINCIPALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Users className="size-7" />
              </div>
              <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px]">+12%</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Élèves</p>
            <p className="text-4xl font-black text-foreground mt-1">{stats.totalStudents}</p>
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
                <Clock className="size-7" />
              </div>
              <Badge variant="outline" className="border-amber-200 text-amber-700 font-black">LIVE</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Présents ce matin</p>
            <p className="text-4xl font-black text-foreground mt-1">{stats.presentTeachers} <span className="text-sm font-bold text-muted-foreground tracking-normal">profs</span></p>
          </Card>

          <Card className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                <CreditCard className="size-7" />
              </div>
              <Wallet className="size-5 text-purple-500 opacity-40" />
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Paiements en attente</p>
            <p className="text-4xl font-black text-foreground mt-1">27</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* COLONNE GAUCHE: ALERTES & ANALYSE */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* ALERTES IMPORTANTES */}
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-muted/5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-5 text-destructive animate-pulse" />
                  <CardTitle className="text-xl font-black tracking-tight">Alertes Prioritaires</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-muted/30">
                  <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center font-black">3</div>
                      <div>
                        <p className="font-bold text-sm">Enseignants n'ont pas rempli les notes</p>
                        <p className="text-[10px] uppercase font-black text-muted-foreground">Trimestre 1 • Retard de 48h</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight className="size-4" /></Button>
                  </div>
                  <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center font-black">{stats.unusedIds}</div>
                      <div>
                        <p className="font-bold text-sm">Identifiants élèves non utilisés</p>
                        <p className="text-[10px] uppercase font-black text-muted-foreground">Inscriptions à relancer</p>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Link href="/eleves/identifiants"><ArrowRight className="size-4" /></Link></Button>
                  </div>
                  <div className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center font-black">27</div>
                      <div>
                        <p className="font-bold text-sm">Paiements de scolarité non confirmés</p>
                        <p className="text-[10px] uppercase font-black text-muted-foreground">Trésorerie • En attente validation</p>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Link href="/paiements"><ArrowRight className="size-4" /></Link></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CLASSES EN DIFFICULTÉ */}
            <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight">Classes en Difficulté</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Radar de performance académique</p>
                </div>
                <TrendingDown className="size-8 text-destructive opacity-20" />
              </div>
              
              {classesInDifficulty.length === 0 ? (
                <div className="p-12 text-center bg-muted/10 rounded-3xl space-y-3">
                   <CheckCircle2 className="size-10 text-emerald-500 mx-auto" />
                   <p className="font-bold text-muted-foreground">Toutes les classes maintiennent une moyenne supérieure à 10/20.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {classesInDifficulty.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-6 bg-red-50/50 border border-red-100 rounded-[2rem] group hover:bg-red-50 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="size-14 bg-white rounded-2xl flex items-center justify-center font-black text-destructive shadow-sm border border-red-100">
                          {cls.id[0]}
                        </div>
                        <div>
                          <p className="font-black text-lg">{cls.id}</p>
                          <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Alerte : Moyenne {cls.avg.toFixed(2)}/20</p>
                        </div>
                      </div>
                      <Button asChild className="rounded-xl bg-white text-destructive border border-red-200 hover:bg-red-600 hover:text-white font-black h-11 px-6 shadow-sm">
                        <Link href="/statistiques">Voir analyse</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* COLONNE DROITE: ACTIVITÉ & FINANCES */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* ASSISTANT ACADEX - ZONE RAPIDE */}
            <Card className="premium-card p-8 bg-foreground text-white overflow-hidden relative group">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-primary rounded-xl flex items-center justify-center">
                    <Sparkles className="size-6 text-white" />
                  </div>
                  <h4 className="text-xl font-black italic">Posez une question à ACADEX</h4>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {["Qui est absent ?", "Qui n’a pas payé ?", "Classe la plus faible ?"].map((q, i) => (
                    <button key={i} className="text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[11px] font-bold uppercase tracking-wider flex justify-between items-center group/btn">
                      {q}
                      <ArrowRight className="size-3 opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
              <Activity className="absolute -bottom-10 -right-10 size-48 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            </Card>

            {/* PAIEMENTS - RÉSUMÉ */}
            <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-lg font-black tracking-tight">Aperçu Trésorerie</h4>
                <Button asChild variant="ghost" className="text-primary font-black text-xs hover:bg-primary/5 rounded-xl">
                   <Link href="/paiements">Voir paiements</Link>
                </Button>
              </div>
              <div className="space-y-6">
                <div className="flex items-end justify-between p-6 bg-muted/20 rounded-3xl border-2 border-transparent hover:border-primary/10 transition-all">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Montant Reçu</p>
                    <p className="text-2xl font-black text-foreground">{stats.totalRevenue.toLocaleString()} <span className="text-xs">FCFA</span></p>
                  </div>
                  <Badge className="bg-emerald-500 text-white font-black rounded-full h-6">+4%</Badge>
                </div>
                <div className="flex items-end justify-between p-6 bg-muted/20 rounded-3xl">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Reste à recouvrer</p>
                    <p className="text-2xl font-black text-amber-600">1.120.000 <span className="text-xs text-muted-foreground">FCFA</span></p>
                  </div>
                  <Badge variant="outline" className="border-amber-200 text-amber-700 font-black h-6">Alerte</Badge>
                </div>
              </div>
            </Card>

            {/* DERNIÈRES ACTIVITÉS */}
            <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm">
               <h4 className="text-lg font-black mb-6">Activités Récentes</h4>
               <div className="space-y-6">
                  <div className="flex gap-4 group">
                    <div className="size-2 bg-primary rounded-full mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">12 nouveaux élèves inscrits</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Il y a 10 minutes • Auto-Inscription</p>
                    </div>
                  </div>
                  <div className="flex gap-4 group">
                    <div className="size-2 bg-amber-500 rounded-full mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">David Kossi (Prof Maths) a ajouté des notes</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Il y a 45 minutes • Terminale D1</p>
                    </div>
                  </div>
                  <div className="flex gap-4 group">
                    <div className="size-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Paiement confirmé : Jean Mensah</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Hier, 18:30 • Frais de scolarité</p>
                    </div>
                  </div>
               </div>
               <Button variant="outline" className="w-full mt-8 rounded-xl font-bold h-11 border-2">Journal d'audit complet</Button>
            </Card>

          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
