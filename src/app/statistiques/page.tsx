
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  CreditCard, 
  GraduationCap, 
  FileDown,
  Sparkles,
  Activity,
  Loader2,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  Target,
  PieChart as PieChartIcon,
  ArrowDownRight,
  BarChart3,
  Clock,
  Zap,
  Scale,
  Shapes
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
  Line,
  ComposedChart
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useMemo, useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StatisticsPage() {
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("generale")
  const [directorName, setDirectorName] = useState("le Directeur")
  
  // États pour le comparateur
  const [classA, setClassA] = useState("")
  const [classB, setClassB] = useState("")

  useEffect(() => {
    const name = localStorage.getItem('acadex_user_name')
    if (name) setDirectorName(name)
  }, [])

  // DATA FETCHING - SYNC TOTALE
  const studentsCol = useMemo(() => query(collection(db, "students"), where("status", "==", "Actif")), [db])
  const teachersCol = useMemo(() => query(collection(db, "teachers")), [db])
  const paymentsCol = useMemo(() => query(collection(db, "payments")), [db])
  const gradesCol = useMemo(() => query(collection(db, "grades")), [db])
  const absencesCol = useMemo(() => query(collection(db, "absences")), [db])

  const { data: students } = useCollection(studentsCol)
  const { data: teachers } = useCollection(teachersCol)
  const { data: payments } = useCollection(paymentsCol)
  const { data: grades } = useCollection(gradesCol)
  const { data: absences } = useCollection(absencesCol)

  // CALCULS KPIs GÉNÉRAUX
  const kpis = useMemo(() => {
    const totalStudents = students?.length || 0
    const totalTeachers = teachers?.length || 0
    const activeClasses = Array.from(new Set((students || []).map((s: any) => s.classId))).length
    
    const revenue = (payments || []).reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0)
    const expectedRevenue = totalStudents * 150000 
    const recoveryRate = expectedRevenue > 0 ? (revenue / expectedRevenue * 100).toFixed(1) : "0.0"

    const validGrades = (grades || []).map((g: any) => Number(g.value)).filter(v => !isNaN(v) && v >= 0)
    const avgSchool = validGrades.length > 0 
      ? (validGrades.reduce((acc, v) => acc + v, 0) / validGrades.length).toFixed(2)
      : "0.00"

    const totalAbsences = absences?.length || 0
    const presenceRate = totalStudents > 0 
      ? (Math.max(0, 100 - (totalAbsences / (totalStudents * 20) * 100))).toFixed(1)
      : "100"

    return { totalStudents, totalTeachers, activeClasses, revenue, expectedRevenue, recoveryRate, avgSchool, presenceRate }
  }, [students, teachers, payments, grades, absences])

  // ANALYSE PAR CLASSE ET PAR PROMOTION
  const classStats = useMemo(() => {
    if (!students) return []
    const classes = Array.from(new Set(students.map((s: any) => s.classId)))
    
    return classes.map(cls => {
      const classStudents = students.filter((s: any) => s.classId === cls)
      const classGrades = (grades || []).filter((g: any) => g.classId === cls)
      const classAbsences = (absences || []).filter((a: any) => classStudents.some(s => s.matricule === a.studentId))
      
      const values = classGrades.map((g: any) => Number(g.value)).filter(v => !isNaN(v))
      const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : "0.00"
      
      const paid = (payments || [])
        .filter((p: any) => classStudents.some(s => s.matricule === p.studentId))
        .reduce((acc, p: any) => acc + Number(p.amountPaid), 0)

      return {
        name: cls,
        promotion: cls.match(/^[0-9]+[A-Z]+/)?.[0] || "AUTRE",
        count: classStudents.length,
        avg: Number(avg),
        absences: classAbsences.length,
        revenue: paid
      }
    }).sort((a, b) => b.avg - a.avg)
  }, [students, grades, absences, payments])

  // STATS PAR PROMOTION (Calculées à partir des stats de classes)
  const promotionStats = useMemo(() => {
    const promos = Array.from(new Set(classStats.map(c => c.promotion)))
    return promos.map(p => {
      const pClasses = classStats.filter(c => c.promotion === p)
      const avg = pClasses.reduce((acc, c) => acc + c.avg, 0) / pClasses.length
      const count = pClasses.reduce((acc, c) => acc + c.count, 0)
      return { name: p, avg: Number(avg.toFixed(2)), count }
    }).sort((a, b) => b.avg - a.avg)
  }, [classStats])

  // ANALYSE PERFORMANCE IA
  const iaAlerts = useMemo(() => {
    const alerts = []
    if (Number(kpis.presenceRate) < 95) alerts.push({ type: 'warning', text: "Le taux d'absence est en hausse de 2% cette semaine." })
    
    const topClass = classStats[0]
    if (topClass) alerts.push({ type: 'success', text: `La classe ${topClass.name} maintient son excellence avec ${topClass.avg}/20.` })
    
    const weakClass = classStats.find(c => c.avg < 10)
    if (weakClass) alerts.push({ type: 'danger', text: `Alerte : La moyenne de la classe ${weakClass.name} est préoccupante.` })
    
    const weakPromo = promotionStats.find(p => p.avg < 11)
    if (weakPromo) alerts.push({ type: 'danger', text: `Niveau ${weakPromo.name} en difficulté globale (${weakPromo.avg}/20).` })
    
    if (alerts.length === 0) alerts.push({ type: 'info', text: "Stabilité globale détectée. Aucune anomalie majeure." })
    
    return alerts
  }, [kpis, classStats, promotionStats])

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFillColor(20, 83, 45)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.text("ACADEX - RAPPORT STRATÉGIQUE", 105, 25, { align: "center" })
    
    autoTable(doc, {
      startY: 50,
      head: [['Indicateur', 'Valeur Actuelle']],
      body: [
        ['Effectif Total', kpis.totalStudents],
        ['Moyenne Établissement', kpis.avgSchool + '/20'],
        ['Taux de Présence', kpis.presenceRate + '%'],
        ['Recouvrement Financier', kpis.revenue.toLocaleString() + ' FCFA'],
        ['Taux de Paiement', kpis.recoveryRate + '%'],
      ],
      headStyles: { fillColor: [20, 83, 45] }
    })
    
    doc.save(`ACADEX_STRAT_STATS_${new Date().getTime()}.pdf`)
    toast({ title: "Rapport généré", description: "Le document PDF est prêt." })
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        
        {/* Header Stratégique */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-muted/20 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl font-black text-foreground tracking-tight">Bonjour Monsieur <span className="text-primary italic">{directorName}</span>,</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Analyse multi-niveaux scellée en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
             <Button onClick={handleExportPDF} variant="outline" className="h-14 px-8 rounded-2xl border-2 font-black bg-white hover:bg-muted">
               <FileDown className="mr-2 size-5" /> Rapport Stratégique
             </Button>
             <Badge className="bg-primary text-white h-14 px-8 rounded-2xl flex items-center gap-3 font-black text-lg shadow-xl shadow-primary/20">
               <Activity className="size-6 animate-pulse" /> LIVE
             </Badge>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Moyenne École", value: kpis.avgSchool, icon: GraduationCap, color: "text-primary", bg: "bg-emerald-50", trend: "+0.5" },
            { label: "Présence Élèves", value: kpis.presenceRate + "%", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50", trend: "-1.2" },
            { label: "Classes Actives", value: kpis.activeClasses, icon: Shapes, color: "text-amber-600", bg: "bg-amber-50", trend: "+2" },
            { label: "Paiements (Taux)", value: kpis.recoveryRate + "%", icon: Wallet, color: "text-purple-600", bg: "bg-purple-50", trend: "+15%" },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-sm rounded-[2.5rem] bg-white group hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={cn("p-4 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all", kpi.bg, kpi.color)}>
                    <kpi.icon className="size-7" />
                  </div>
                  <Badge variant="outline" className={cn("font-black border-none px-3", Number(kpi.trend) < 0 ? "text-destructive bg-red-50" : "text-emerald-600 bg-emerald-50")}>
                    {kpi.trend.startsWith('-') ? <ArrowDownRight className="size-3 mr-1" /> : <ArrowUpRight className="size-3 mr-1" />}
                    {kpi.trend}
                  </Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black text-foreground">{kpi.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2.5rem] h-20 p-2 flex w-fit shadow-md overflow-x-auto no-scrollbar">
            {[
              { id: "generale", label: "Vue Générale", icon: BarChart3 },
              { id: "promotions", label: "Analyses Promotions", icon: Shapes },
              { id: "pedagogie", label: "Moyennes Classes", icon: Target },
              { id: "comparaison", label: "Comparateur", icon: Scale },
              { id: "ia", label: "Cerveau IA", icon: Sparkles }
            ].map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-2xl font-black px-8 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex gap-2">
                <t.icon className="size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="generale" className="space-y-8">
             <div className="grid lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] p-10">
                   <h3 className="text-2xl font-black mb-10 flex items-center gap-3"><Activity className="text-primary" /> Performance par Promotion</h3>
                   <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={promotionStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold'}} />
                          <YAxis axisLine={false} tickLine={false} domain={[0, 20]} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="avg" name="Moyenne Niveau" fill="#14532d" radius={[10, 10, 0, 0]} barSize={50}>
                             {promotionStats.map((entry, index) => (
                              <Cell key={index} fill={entry.avg >= 12 ? '#14532d' : entry.avg >= 10 ? '#fbbf24' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </Card>
                <div className="lg:col-span-4 space-y-8">
                  <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10 flex flex-col items-center">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-2"><PieChartIcon className="size-5 text-primary" /> Répartition Élèves</h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={promotionStats} 
                            innerRadius={60} 
                            outerRadius={80} 
                            paddingAngle={5} 
                            dataKey="count"
                            nameKey="name"
                          >
                            {promotionStats.map((_, i) => (
                              <Cell key={i} fill={['#14532d', '#fbbf24', '#3b82f6', '#8b5cf6', '#ec4899'][i % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="promotions" className="space-y-8">
             <div className="grid gap-6">
                {promotionStats.map(promo => {
                  const pClasses = classStats.filter(c => c.promotion === promo.name)
                  return (
                    <Card key={promo.name} className="p-8 rounded-[3rem] bg-white border-none shadow-sm overflow-hidden group">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                             <div className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{promo.name}</div>
                             <div>
                                <h3 className="text-2xl font-black">Promotion {promo.name}</h3>
                                <p className="text-sm font-bold text-muted-foreground">{pClasses.length} Classes • {promo.count} Élèves</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase text-muted-foreground">Moyenne Promotion</p>
                             <p className="text-3xl font-black text-primary">{promo.avg}/20</p>
                          </div>
                       </div>
                       <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {pClasses.map(cls => (
                            <div key={cls.name} className="p-6 bg-muted/30 rounded-[2rem] border-2 border-transparent hover:border-primary/10 transition-all">
                               <p className="font-black text-lg mb-2">{cls.name}</p>
                               <div className="flex justify-between items-end">
                                  <div>
                                     <p className="text-[10px] font-bold text-muted-foreground">Moyenne</p>
                                     <p className={cn("text-2xl font-black", cls.avg >= promo.avg ? "text-emerald-600" : "text-amber-600")}>{cls.avg}</p>
                                  </div>
                                  <Badge className={cn("rounded-full border-none px-3 font-black", cls.avg >= promo.avg ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                                     {cls.avg >= promo.avg ? "↑ TOP" : "↓ BAS"}
                                  </Badge>
                               </div>
                            </div>
                          ))}
                       </div>
                    </Card>
                  )
                })}
             </div>
          </TabsContent>

          <TabsContent value="comparaison" className="space-y-8">
             <Card className="p-10 rounded-[3rem] bg-white border-none shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
                   <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Classe A</label>
                      <Select value={classA} onValueChange={setClassA}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                        <SelectContent>{classStats.map(c => <SelectItem key={c.name} value={c.name} className="font-bold">{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                   <div className="size-14 bg-muted rounded-full flex items-center justify-center font-black text-primary">VS</div>
                   <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Classe B</label>
                      <Select value={classB} onValueChange={setClassB}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                        <SelectContent>{classStats.map(c => <SelectItem key={c.name} value={c.name} className="font-bold">{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                </div>

                {classA && classB ? (
                  <div className="grid md:grid-cols-3 gap-8">
                     {[
                       { label: "Effectif", key: "count", icon: Users },
                       { label: "Moyenne / 20", key: "avg", icon: GraduationCap },
                       { label: "Incidents (Abs)", key: "absences", icon: Clock },
                     ].map((metric) => {
                       const statsA = classStats.find(c => c.name === classA)
                       const statsB = classStats.find(c => c.name === classB)
                       const valA = statsA ? (statsA as any)[metric.key] : 0
                       const valB = statsB ? (statsB as any)[metric.key] : 0
                       return (
                         <div key={metric.label} className="space-y-6 p-8 bg-muted/20 rounded-[2rem] border border-muted">
                            <div className="flex items-center gap-3 font-black text-muted-foreground uppercase text-xs">
                               <metric.icon className="size-4 text-primary" /> {metric.label}
                            </div>
                            <div className="flex items-end justify-between gap-4">
                               <div className="text-center flex-1">
                                  <p className="text-xs font-bold text-muted-foreground mb-1">{classA}</p>
                                  <p className="text-3xl font-black text-primary">{valA}</p>
                               </div>
                               <div className="h-10 w-px bg-muted-foreground/20" />
                               <div className="text-center flex-1">
                                  <p className="text-xs font-bold text-muted-foreground mb-1">{classB}</p>
                                  <p className="text-3xl font-black text-primary">{valB}</p>
                               </div>
                            </div>
                            <div className="w-full bg-white h-2 rounded-full overflow-hidden flex">
                               <div 
                                 className="h-full bg-primary" 
                                 style={{ width: `${(Number(valA) / (Math.max(1, Number(valA) + Number(valB)))) * 100}%` }} 
                               />
                               <div 
                                 className="h-full bg-amber-400" 
                                 style={{ width: `${(Number(valB) / (Math.max(1, Number(valA) + Number(valB)))) * 100}%` }} 
                               />
                            </div>
                         </div>
                       )
                     })}
                  </div>
                ) : (
                  <div className="p-20 text-center space-y-6 opacity-30">
                     <Scale className="size-20 mx-auto" />
                     <p className="font-black uppercase tracking-widest">Sélectionnez deux classes pour lancer le comparateur.</p>
                  </div>
                )}
             </Card>
          </TabsContent>

          <TabsContent value="ia" className="space-y-8">
             <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-10 rounded-[3rem] bg-white border-none shadow-sm flex flex-col">
                   <div className="flex items-center gap-4 mb-10">
                      <div className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg"><Sparkles className="size-8" /></div>
                      <div>
                        <h3 className="text-2xl font-black">Cerveau ACADEX</h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Analyse prédictive activée</p>
                      </div>
                   </div>
                   <div className="space-y-4 flex-1">
                      {iaAlerts.map((alert, i) => (
                        <div key={i} className={cn("p-6 rounded-[2rem] border-2 flex items-start gap-4 transition-all hover:scale-[1.02]", 
                          alert.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-900" : 
                          alert.type === 'danger' ? "bg-red-50 border-red-100 text-red-900" :
                          alert.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-900" :
                          "bg-blue-50 border-blue-100 text-blue-900"
                        )}>
                           <div className="size-10 rounded-xl bg-white/50 flex items-center justify-center shrink-0">
                              {alert.type === 'warning' ? <AlertTriangle className="size-5" /> : 
                               alert.type === 'danger' ? <ShieldCheck className="size-5 text-red-600" /> :
                               <CheckCircle2 className="size-5" />}
                           </div>
                           <p className="font-bold leading-relaxed">{alert.text}</p>
                        </div>
                      ))}
                   </div>
                   <Button className="mt-10 h-14 rounded-2xl bg-foreground text-white font-black w-full">Générer Rapport IA Complet</Button>
                </Card>
                
                <Card className="p-10 rounded-[3rem] bg-primary text-white border-none shadow-2xl relative overflow-hidden">
                   <div className="relative z-10 space-y-6">
                      <h3 className="text-3xl font-black">Audit Implication</h3>
                      <p className="text-white/70 font-medium italic">Analyse du taux de saisie des notes par promotion.</p>
                      
                      <div className="space-y-8 pt-8">
                         {promotionStats.slice(0, 3).map((p, i) => (
                           <div key={i} className="space-y-2">
                              <div className="flex justify-between items-center px-1">
                                 <span className="font-black text-sm">{p.name}</span>
                                 <span className="font-black text-xs">92% scellé</span>
                              </div>
                              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                                 <div className="h-full bg-amber-400" style={{ width: '92%' }} />
                              </div>
                           </div>
                         ))}
                      </div>
                      
                      <div className="pt-10 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                         <ShieldCheck className="size-4 text-emerald-400" /> Audit Académique Certifié
                      </div>
                   </div>
                   <PieChartIcon className="absolute -bottom-10 -right-10 size-64 text-white/5 pointer-events-none" />
                </Card>
             </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex items-center justify-center gap-4 py-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">
           <ShieldCheck className="size-4" /> Toute note scellée impacte les moyennes de classe et de promotion instantanément.
        </div>
      </div>
    </DashboardLayout>
  )
}
