
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  CreditCard, 
  GraduationCap, 
  FileDown,
  PieChart as PieChartIcon,
  Sparkles,
  Activity,
  BookOpen,
  Loader2,
  TrendingUp
} from "lucide-react"
import { 
  ResponsiveContainer, 
  Tooltip,
  Cell,
  Pie,
  PieChart,
  Legend
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useMemo, useState } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"

export default function StatisticsPage() {
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("generale")

  // REQUÊTES FILTRÉES POUR SINCÉRITÉ TOTALE
  const studentsCol = useMemo(() => query(collection(db, "students"), where("status", "==", "Actif")), [db])
  const teachersCol = useMemo(() => query(collection(db, "teachers")), [db])
  const paymentsCol = useMemo(() => query(collection(db, "payments")), [db])
  const gradesCol = useMemo(() => query(collection(db, "grades")), [db])

  const { data: students, loading: loadingStudents } = useCollection(studentsCol)
  const { data: teachers, loading: loadingTeachers } = useCollection(teachersCol)
  const { data: payments, loading: loadingPayments } = useCollection(paymentsCol)
  const { data: grades } = useCollection(gradesCol)

  // CALCUL DES INDICATEURS RÉELS
  const kpis = useMemo(() => {
    const totalStudents = students?.length || 0
    const totalTeachers = teachers?.length || 0
    const totalRevenue = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    
    // Moyenne école basée sur les valeurs brutes scellées
    const validGrades = grades?.filter((g: any) => g.value !== undefined) || []
    const avgSchool = validGrades.length > 0 
      ? (validGrades.reduce((acc, g: any) => acc + (Number(g.value) || 0), 0) / validGrades.length).toFixed(2)
      : "0.00"
    
    return { totalStudents, totalTeachers, totalRevenue, avgSchool }
  }, [students, teachers, payments, grades])

  // RÉPARTITION PAR GENRE (DATA RÉELLE)
  const genderStats = useMemo(() => {
    if (!students || students.length === 0) return []
    const m = students.filter((s: any) => s.gender === 'Masculin').length
    const f = students.filter((s: any) => s.gender === 'Féminin').length
    return [
      { name: 'Garçons', value: m },
      { name: 'Filles', value: f },
    ]
  }, [students])

  const COLORS = ['#14532d', '#fbbf24']

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFillColor(20, 83, 45)
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.text("ACADEX - RAPPORT STATISTIQUE DÉCISIONNEL", 105, 20, { align: "center" })
      doc.setFontSize(10)
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - Document Officiel`, 105, 30, { align: "center" })
      
      autoTable(doc, {
        startY: 50,
        head: [['Indicateur Périodique', 'Valeur Réelle']],
        body: [
          ['Effectif Global Élèves Actifs', kpis.totalStudents],
          ['Corps Enseignant Enregistré', kpis.totalTeachers],
          ['Moyenne Générale Établissement', `${kpis.avgSchool} / 20`],
          ['Total Recouvrement Trésorerie', `${kpis.totalRevenue.toLocaleString()} FCFA`],
        ],
        headStyles: { fillColor: [20, 83, 45] },
        theme: 'striped'
      })

      doc.save(`ACADEX_STATS_OFFICIEL.pdf`)
      toast({ title: "Rapport exporté avec succès" })
    } catch (e) {
      toast({ title: "Erreur Export", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in duration-700">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-muted/20 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Intelligence <span className="text-primary italic">Scolaire</span></h1>
            <p className="text-muted-foreground font-medium">Analyse certifiée basée sur les données vivantes d'ACADEX.</p>
          </div>
          <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 rounded-2xl h-14 px-10 font-black text-lg relative z-10 group">
            <FileDown className="mr-2 size-6 group-hover:scale-110 transition-transform" /> Rapport Décisionnel
          </Button>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Élèves Actifs", value: kpis.totalStudents, icon: Users, color: "text-blue-600", loading: loadingStudents },
            { label: "Moyenne École", value: kpis.avgSchool, icon: GraduationCap, color: "text-primary", loading: false },
            { label: "Enseignants", value: kpis.totalTeachers, icon: BookOpen, color: "text-emerald-600", loading: loadingTeachers },
            { label: "Trésorerie", value: kpis.totalRevenue.toLocaleString() + " F", icon: CreditCard, color: "text-amber-600", loading: loadingPayments },
          ].map((kpi, i) => (
            <Card key={i} className="border-none shadow-sm rounded-[2.5rem] bg-white group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <kpi.icon className="size-7" />
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black text-foreground">
                  {kpi.loading ? <Loader2 className="size-6 animate-spin text-muted-foreground" /> : kpi.value}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2.5rem] h-20 p-2 flex w-fit shadow-sm">
            <TabsTrigger value="generale" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Vue Générale</TabsTrigger>
            <TabsTrigger value="ia" className="rounded-2xl font-black px-10 text-xs uppercase tracking-widest flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Sparkles className="size-4" /> Prédictions IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generale" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] p-10 min-h-[450px] flex flex-col">
                 <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <TrendingUp className="text-primary" /> Courbe de Performance
                 </h3>
                 <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic">
                  <Activity className="size-20 mb-4 text-muted-foreground" />
                  <p className="font-bold text-center max-w-sm">La visualisation graphique des tendances s'activera après la clôture du Trimestre 1.</p>
                </div>
              </Card>

              <div className="lg:col-span-4 space-y-8">
                <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10 flex flex-col items-center justify-center text-center min-h-[450px]">
                  <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                    <PieChartIcon className="text-primary" /> Démographie École
                  </h3>
                  {genderStats.length > 0 && students && students.length > 0 ? (
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genderStats}
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                          >
                            {genderStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 opacity-30">
                       <Users className="size-16" />
                       <p className="text-xs font-black uppercase">En attente d'inscriptions actives</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ia" className="animate-in zoom-in-95 duration-500">
             <Card className="border-none shadow-2xl bg-foreground text-white p-20 rounded-[4rem] text-center relative overflow-hidden group">
                <Sparkles className="absolute -top-10 -right-10 size-64 text-primary opacity-5 group-hover:scale-125 transition-transform duration-1000" />
                <div className="size-24 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-10 relative z-10">
                   <Sparkles className="size-12 text-primary animate-pulse" />
                </div>
                <h3 className="text-4xl font-black mb-6 relative z-10">Analyse Intelligence ACADEX</h3>
                <p className="text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed italic relative z-10">
                  "Le Cerveau ACADEX nécessite un volume critique de données pour projeter des tendances de réussite fiables. Continuez la saisie des notes pour débloquer l'analyse prédictive."
                </p>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
