
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
  Legend
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
  const [activeYear, setActiveYear] = useState("2024-2025")
  
  // États pour le comparateur
  const [classA, setClassA] = useState("")
  const [classB, setClassB] = useState("")

  useEffect(() => {
    const name = localStorage.getItem('acadex_user_name')
    if (name) setDirectorName(name)
    
    const updateYear = () => {
      setActiveYear(localStorage.getItem('acadex_active_year') || "2024-2025")
    }
    updateYear()
    window.addEventListener('storage', updateYear)
    return () => window.removeEventListener('storage', updateYear)
  }, [])

  // DATA FETCHING - FILTRÉE PAR ANNÉE ACTIVE
  const studentsCol = useMemo(() => query(collection(db, "students"), where("academicYear", "==", activeYear), where("status", "==", "Actif")), [db, activeYear])
  const teachersCol = useMemo(() => query(collection(db, "teachers")), [db]) // Enseignants globaux
  const paymentsCol = useMemo(() => query(collection(db, "payments"), where("academicYear", "==", activeYear)), [db, activeYear])
  const gradesCol = useMemo(() => query(collection(db, "grades"), where("academicYear", "==", activeYear)), [db, activeYear])
  const absencesCol = useMemo(() => query(collection(db, "absences"), where("academicYear", "==", activeYear)), [db, activeYear])

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

  const promotionStats = useMemo(() => {
    const promos = Array.from(new Set(classStats.map(c => c.promotion)))
    return promos.map(p => {
      const pClasses = classStats.filter(c => c.promotion === p)
      const avg = pClasses.reduce((acc, c) => acc + c.avg, 0) / pClasses.length
      const count = pClasses.reduce((acc, c) => acc + c.count, 0)
      return { name: p, avg: Number(avg.toFixed(2)), count }
    }).sort((a, b) => b.avg - a.avg)
  }, [classStats])

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFillColor(20, 83, 45)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.text(`ACADEX - RAPPORT STRATÉGIQUE ${activeYear}`, 105, 25, { align: "center" })
    
    autoTable(doc, {
      startY: 50,
      head: [['Indicateur', 'Valeur Actuelle']],
      body: [
        ['Année Scolaire', activeYear],
        ['Effectif Total', kpis.totalStudents],
        ['Moyenne Établissement', kpis.avgSchool + '/20'],
        ['Taux de Présence', kpis.presenceRate + '%'],
        ['Recouvrement Financier', kpis.revenue.toLocaleString() + ' FCFA'],
        ['Taux de Paiement', kpis.recoveryRate + '%'],
      ],
      headStyles: { fillColor: [20, 83, 45] }
    })
    
    doc.save(`ACADEX_STRAT_STATS_${activeYear}.pdf`)
    toast({ title: "Rapport généré", description: `Le bilan de l'année ${activeYear} est prêt.` })
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-muted/20 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl font-black text-foreground tracking-tight">Bonjour Monsieur <span className="text-primary italic">{directorName}</span>,</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Pilotage analytique de l'année <Badge className="bg-primary">{activeYear}</Badge>
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
        </div>

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
                   <h3 className="text-2xl font-black mb-10 flex items-center gap-3"><Activity className="text-primary" /> Performance {activeYear}</h3>
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
                  <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10 flex flex-col items-center h-full">
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
        </Tabs>
        
        <div className="flex items-center justify-center gap-4 py-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">
           <ShieldCheck className="size-4" /> Toute note scellée en {activeYear} impacte les moyennes instantanément.
        </div>
      </div>
    </DashboardLayout>
  )
}
