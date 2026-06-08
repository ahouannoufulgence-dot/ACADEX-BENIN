
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  GraduationCap, 
  FileDown,
  Sparkles,
  Activity,
  UserCheck,
  ShieldCheck,
  Wallet,
  Shapes,
  Scale,
  History,
  ShieldAlert,
  Award,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react"
import {
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, doc, onSnapshot } from "firebase/firestore"
import { useMemo, useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export default function StatisticsModule() {
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("synthèse")
  const [directorName, setDirectorName] = useState("le Directeur")
  const [activeYear, setActiveYear] = useState("2026-2027")

  useEffect(() => {
    setDirectorName(localStorage.getItem('acadex_user_name') || "le Directeur")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    const updateYear = (e: any) => setActiveYear(e.detail)
    window.addEventListener('acadex_year_changed', updateYear as any)
    return () => window.removeEventListener('acadex_year_changed', updateYear as any)
  }, [])

  // DATA FETCHING REAL-TIME
  const studentsCol = useMemo(() => query(collection(db, "students"), where("academicYear", "==", activeYear), where("status", "==", "Actif")), [db, activeYear])
  const gradesCol = useMemo(() => query(collection(db, "grades"), where("academicYear", "==", activeYear)), [db, activeYear])
  const lifeEventsCol = useMemo(() => query(collection(db, "student_life"), where("academicYear", "==", activeYear)), [db, activeYear])
  const paymentsCol = useMemo(() => query(collection(db, "payments"), where("academicYear", "==", activeYear)), [db, activeYear])
  const expensesCol = useMemo(() => query(collection(db, "expenses"), where("academicYear", "==", activeYear)), [db, activeYear])

  const { data: students } = useCollection(studentsCol)
  const { data: grades } = useCollection(gradesCol)
  const { data: lifeEvents } = useCollection(lifeEventsCol)
  const { data: payments } = useCollection(paymentsCol)
  const { data: expenses } = useCollection(expensesCol)

  // CALCULS KPIs & ANALYSE
  const analysis = useMemo(() => {
    const totalStudents = students?.length || 0
    const totalTeachers = 42 // Mocké pour MVP
    
    // 1. PERFORMANCE ACADÉMIQUE
    const validGrades = grades?.filter(g => !isNaN(Number(g.value))) || []
    const globalGPA = validGrades.length > 0 
      ? (validGrades.reduce((acc, g) => acc + Number(g.value), 0) / validGrades.length).toFixed(2)
      : "0.00"

    // Moyenne par Promotion
    const promoGrades: Record<string, { total: number, count: number }> = {}
    validGrades.forEach(g => {
      const promo = g.classId.match(/^[0-9]+/)?.[0] || g.classId
      if (!promoGrades[promo]) promoGrades[promo] = { total: 0, count: 0 }
      promoGrades[promo].total += Number(g.value)
      promoGrades[promo].count += 1
    })
    const promoData = Object.entries(promoGrades).map(([name, d]) => ({
      name: `${name}EME`,
      avg: Number((d.total / d.count).toFixed(2))
    })).sort((a, b) => a.name.localeCompare(b.name))

    // 2. VIE SCOLAIRE (CONDUITE)
    const conductScores: Record<string, { total: number, count: number }> = {}
    students?.forEach(s => {
      const promo = s.classId.match(/^[0-9]+/)?.[0] || s.classId
      if (!conductScores[promo]) conductScores[promo] = { total: 20, count: 1 }
      else { conductScores[promo].total += 20; conductScores[promo].count += 1; }
    })
    lifeEvents?.forEach(e => {
      const s = students?.find(st => st.matricule === e.studentId)
      const promo = s?.classId.match(/^[0-9]+/)?.[0] || s?.classId || "Autre"
      if (conductScores[promo]) conductScores[promo].total += (e.pointsImpact || 0)
    })
    const conductData = Object.entries(conductScores).map(([name, d]) => ({
      name: name.includes('EME') ? name : `${name}EME`,
      avg: Math.max(0, Math.min(20, Number((d.total / d.count).toFixed(2))))
    })).sort((a, b) => a.name.localeCompare(b.name))

    // 3. FINANCE
    const revenue = payments?.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const outgo = expenses?.reduce((acc, e) => acc + (Number(e.amount) || 0), 0) || 0
    const expected = totalStudents * 150000 // Moyenne estimée
    const payRate = expected > 0 ? (revenue / expected) * 100 : 0

    return { 
      totalStudents, totalTeachers, globalGPA, revenue, outgo, payRate,
      promoData, conductData, expected
    }
  }, [students, grades, lifeEvents, payments, expenses])

  const handleExportStats = () => {
    const docPdf = new jsPDF()
    docPdf.setFillColor(20, 83, 45)
    docPdf.rect(0, 0, 210, 40, 'F')
    docPdf.setTextColor(255, 255, 255)
    docPdf.setFontSize(20)
    docPdf.text("ACADEX - AUDIT STRATÉGIQUE GLOBAL", 105, 25, { align: "center" })
    
    autoTable(docPdf, {
      startY: 50,
      head: [['Indicateur', 'Valeur', 'Année Scolaire']],
      body: [
        ['Effectifs Élèves', analysis.totalStudents, activeYear],
        ['Moyenne Générale École', analysis.globalGPA + '/20', activeYear],
        ['Recettes Totales', analysis.revenue.toLocaleString() + ' F', activeYear],
        ['Dépenses Globales', analysis.outgo.toLocaleString() + ' F', activeYear],
        ['Taux de Recouvrement', analysis.payRate.toFixed(1) + '%', activeYear],
      ],
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 45] }
    })
    docPdf.save(`AUDIT_ACADEX_${activeYear}.pdf`)
    toast({ title: "Audit Exporté", description: "Le rapport PDF a été généré avec succès." })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border-2 border-primary/5">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
              Tableau de Bord <span className="text-primary italic">Analytique</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground font-medium">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black">
                <ShieldCheck className="size-4" /> AUDIT SÉCURISÉ
              </div>
              <span>Session active : <Badge className="bg-primary text-white ml-1">{activeYear}</Badge></span>
            </div>
          </div>
          <Button onClick={handleExportStats} className="bg-primary hover:bg-primary/90 shadow-2xl h-14 md:h-16 px-10 rounded-2xl font-black text-lg group">
             <FileDown className="mr-3 size-6 group-hover:translate-y-1 transition-transform" /> 
             Exporter le Bilan
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2.5rem] h-20 p-2 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar">
            {[
              { id: "synthèse", label: "Synthèse", icon: Activity },
              { id: "académique", label: "Performance", icon: GraduationCap },
              { id: "vie-scolaire", label: "Discipline", icon: ShieldAlert },
              { id: "finance", label: "Finances", icon: Wallet },
              { id: "ia-insights", label: "IA ACADEX", icon: Sparkles },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-2xl font-black px-8 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex gap-2">
                <t.icon className="size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="synthèse" className="space-y-8 animate-in slide-in-from-bottom-4">
            {/* Quick KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Moyenne École", value: analysis.globalGPA, suffix: "/20", icon: GraduationCap, color: "text-primary", sub: "Performance stable" },
                { label: "Présence École", value: "92", suffix: "%", icon: UserCheck, color: "text-emerald-600", sub: "Taux hebdomadaire" },
                { label: "Recouvrement", value: analysis.payRate.toFixed(1), suffix: "%", icon: Wallet, color: "text-amber-600", sub: "Année en cours" },
                { label: "Discipline", value: "98", suffix: "%", icon: Scale, color: "text-blue-600", sub: "Indice de conduite" },
              ].map((kpi, i) => (
                <Card key={i} className="p-7 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn("p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all", kpi.color)}>
                      <kpi.icon className="size-7" />
                    </div>
                    <ArrowUpRight className="size-5 opacity-20 group-hover:opacity-100 transition-all text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{kpi.label}</p>
                    <h3 className="text-3xl font-black text-foreground">{kpi.value}<span className="text-sm opacity-40 ml-1">{kpi.suffix}</span></h3>
                    <p className="text-[10px] font-bold text-muted-foreground/60 mt-2">{kpi.sub}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] p-8 md:p-10">
                 <div className="flex items-center justify-between mb-10">
                   <h3 className="text-2xl font-black flex items-center gap-3">
                     <TrendingUp className="text-primary size-6" /> Évolution par Promotion
                   </h3>
                   <Badge variant="outline" className="font-black border-2">SESSIONS T1-T2</Badge>
                 </div>
                 <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analysis.promoData}>
                        <defs>
                          <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14532d" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#14532d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold'}} />
                        <YAxis domain={[0, 20]} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="avg" stroke="#14532d" strokeWidth={4} fillOpacity={1} fill="url(#colorAvg)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>

              <Card className="lg:col-span-4 border-none shadow-xl bg-foreground text-white rounded-[3rem] p-10 relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="size-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-8">
                    <Sparkles className="size-8 text-primary" />
                  </div>
                  <h3 className="text-3xl font-black mb-4">Moteur IA Actif</h3>
                  <p className="text-white/60 font-medium leading-relaxed italic">
                    "L'analyse des données de l'année scolaire {activeYear} montre une progression de 12% des résultats en classes scientifiques par rapport à l'année précédente."
                  </p>
                </div>
                <div className="relative z-10 pt-10 border-t border-white/10 flex justify-between items-end">
                   <div>
                     <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Calculs temps réel</p>
                     <p className="font-bold">Audit Automatisé</p>
                   </div>
                   <Button variant="ghost" className="rounded-xl font-black text-primary hover:bg-white/5">Détails</Button>
                </div>
                <BarChart3 className="absolute -bottom-10 -right-10 size-64 text-white/[0.03] pointer-events-none" />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="académique" className="space-y-8">
             <div className="grid lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-12 border-none shadow-sm bg-white rounded-[3rem] p-10">
                   <h3 className="text-2xl font-black mb-10">Performance Détaillée par Promotion</h3>
                   <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {analysis.promoData.map((promo) => (
                        <div key={promo.name} className="space-y-4 p-6 bg-muted/20 rounded-[2rem] border-2 border-transparent hover:border-primary/10 transition-all">
                           <div className="flex justify-between items-center">
                              <Badge className="bg-primary text-white font-black">{promo.name}</Badge>
                              <span className="font-black text-2xl">{promo.avg}</span>
                           </div>
                           <Progress value={(promo.avg / 20) * 100} className="h-2" />
                           <p className="text-[10px] font-bold text-muted-foreground uppercase text-center tracking-widest">Moyenne promotion</p>
                        </div>
                      ))}
                   </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="vie-scolaire" className="space-y-8">
             <div className="grid lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] p-10">
                   <h3 className="text-2xl font-black mb-10">Indice de Conduite par Niveau</h3>
                   <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.conductData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold'}} />
                          <YAxis domain={[0, 20]} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="avg" name="Moyenne Conduite" radius={[10, 10, 0, 0]} barSize={50}>
                             {analysis.conductData.map((entry, index) => (
                               <Cell key={index} fill={entry.avg >= 16 ? '#14532d' : entry.avg >= 10 ? '#fbbf24' : '#ef4444'} />
                             ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <div className="lg:col-span-4 space-y-6">
                   <Card className="p-8 rounded-[2.5rem] bg-amber-50 border-2 border-amber-100 flex flex-col gap-6">
                      <div className="flex items-center gap-3 text-amber-700">
                         <AlertTriangle className="size-6" />
                         <h4 className="font-black text-sm uppercase">Alertes Discipline</h4>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-start gap-3">
                            <div className="size-2 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                            <p className="text-xs font-bold text-amber-900 leading-tight">Hausse des retards en classe de 3EME B (+15% cette semaine).</p>
                         </div>
                         <div className="flex items-start gap-3">
                            <div className="size-2 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                            <p className="text-xs font-bold text-amber-900 leading-tight">Moyenne de conduite en baisse pour la promotion TERMINALE.</p>
                         </div>
                      </div>
                   </Card>

                   <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col justify-center text-center space-y-4">
                      <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto"><History className="size-8" /></div>
                      <h4 className="text-lg font-black">Audit Historique</h4>
                      <p className="text-xs text-muted-foreground font-medium">Consultez l'évolution comportementale sur les 3 dernières années.</p>
                      <Button variant="outline" className="rounded-xl border-2 font-bold h-11">Voir l'Archive</Button>
                   </Card>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-8">
             <div className="grid lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-7 border-none shadow-sm bg-white rounded-[3rem] p-10">
                   <h3 className="text-2xl font-black mb-10">Flux de Trésorerie</h3>
                   <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                               data={[
                                 { name: 'Encaissé', value: analysis.revenue },
                                 { name: 'Reste à percevoir', value: Math.max(0, analysis.expected - analysis.revenue) }
                               ]}
                               cx="50%"
                               cy="50%"
                               innerRadius={80}
                               outerRadius={120}
                               paddingAngle={5}
                               dataKey="value"
                            >
                               <Cell fill="#14532d" />
                               <Cell fill="#f1f5f9" />
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <div className="lg:col-span-5 space-y-6">
                   <Card className="p-10 rounded-[3rem] bg-foreground text-white border-none shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[250px]">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4">Solde Net Acadex</p>
                        <h3 className="text-4xl font-black text-primary">{(analysis.revenue - analysis.outgo).toLocaleString()} F</h3>
                        <div className="mt-8 flex gap-4">
                           <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/10">
                              <p className="text-[9px] font-black uppercase opacity-40">Recettes</p>
                              <p className="font-black text-emerald-400">+{analysis.revenue.toLocaleString()} F</p>
                           </div>
                           <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/10">
                              <p className="text-[9px] font-black uppercase opacity-40">Dépenses</p>
                              <p className="font-black text-red-400">-{analysis.outgo.toLocaleString()} F</p>
                           </div>
                        </div>
                      </div>
                      <ShieldCheck className="absolute -bottom-10 -right-10 size-48 text-white/5" />
                   </Card>

                   <Card className="p-10 rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-center space-y-6">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xl font-black">Santé Financière</h4>
                         <Badge className="bg-emerald-500 text-white">OPTIMALE</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                           <span>Recouvrement Global</span>
                           <span>{analysis.payRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={analysis.payRate} className="h-3 rounded-full" />
                      </div>
                   </Card>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="ia-insights" className="space-y-8">
             <div className="grid md:grid-cols-3 gap-8">
                <Card className="p-8 rounded-[3rem] border-none shadow-sm bg-white hover:shadow-xl transition-all border-t-[10px] border-primary">
                   <Sparkles className="size-8 text-primary mb-6" />
                   <h4 className="text-xl font-black mb-4 uppercase tracking-tight">Prédiction Réussite</h4>
                   <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                     L'IA estime à <span className="text-primary font-black">88%</span> le taux de réussite prévisionnel pour l'examen du BEPC, basé sur les notes scellées du 1er trimestre.
                   </p>
                </Card>

                <Card className="p-8 rounded-[3rem] border-none shadow-sm bg-white hover:shadow-xl transition-all border-t-[10px] border-amber-400">
                   <AlertTriangle className="size-8 text-amber-500 mb-6" />
                   <h4 className="text-xl font-black mb-4 uppercase tracking-tight">Alerte Décrochage</h4>
                   <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                     Un groupe de 14 élèves présente une corrélation forte entre absences répétées et baisse des notes. Un audit de vie scolaire est recommandé.
                   </p>
                </Card>

                <Card className="p-8 rounded-[3rem] border-none shadow-sm bg-white hover:shadow-xl transition-all border-t-[10px] border-blue-500">
                   <TrendingUp className="size-8 text-blue-600 mb-6" />
                   <h4 className="text-xl font-black mb-4 uppercase tracking-tight">Optimisation Staff</h4>
                   <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                     Les professeurs de Français ont scellé 100% de leurs notes. Une session de feedback pour l'Anglais pourrait accélérer la clôture du trimestre.
                   </p>
                </Card>
             </div>

             <Card className="p-20 text-center rounded-[3.5rem] border-4 border-dashed bg-primary/5 border-primary/20 group hover:bg-primary/10 transition-all">
                <div className="size-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl mb-8 group-hover:scale-110 transition-transform">
                   <Sparkles className="size-12 text-primary animate-pulse" />
                </div>
                <h3 className="text-3xl font-black mb-4">Lancer l'Audit de Comparaison Inter-Annuelle</h3>
                <p className="text-muted-foreground max-w-lg mx-auto font-medium text-lg leading-relaxed mb-10">
                   Comparez les performances de l'année scolaire <b>{activeYear}</b> avec les archives scellées des sessions précédentes pour mesurer l'évolution de l'établissement.
                </p>
                <Button className="h-16 px-12 rounded-2xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/20">
                   Générer le Comparateur Temporel
                </Button>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

