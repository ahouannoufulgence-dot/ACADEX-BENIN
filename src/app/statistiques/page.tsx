
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Award
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
import { collection, query, where, orderBy } from "firebase/firestore"
import { useMemo, useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function StatisticsPage() {
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("generale")
  const [directorName, setDirectorName] = useState("le Directeur")
  const [activeYear, setActiveYear] = useState("2026-2027")

  useEffect(() => {
    setDirectorName(localStorage.getItem('acadex_user_name') || "le Directeur")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  // DATA FETCHING
  const studentsCol = useMemo(() => query(collection(db, "students"), where("academicYear", "==", activeYear), where("status", "==", "Actif")), [db, activeYear])
  const gradesCol = useMemo(() => query(collection(db, "grades"), where("academicYear", "==", activeYear)), [db, activeYear])
  const lifeEventsCol = useMemo(() => query(collection(db, "student_life"), where("academicYear", "==", activeYear)), [db, activeYear])

  const { data: students } = useCollection(studentsCol)
  const { data: grades } = useCollection(gradesCol)
  const { data: lifeEvents } = useCollection(lifeEventsCol)

  // CALCULS KPIs GÉNÉRAUX & DISCIPLINE
  const stats = useMemo(() => {
    const totalStudents = students?.length || 0
    
    // Analyse Conduite par promotion
    const promotions: Record<string, { total: number, count: number }> = {}
    const sanctionsByClass: Record<string, number> = {}
    
    students?.forEach(s => {
      const promo = s.classId.match(/^[0-9]+[A-Z]+/)?.[0] || s.classId
      if (!promotions[promo]) promotions[promo] = { total: 20 * 1, count: 1 } // Base 20
      else { promotions[promo].total += 20; promotions[promo].count += 1; }
    })

    lifeEvents?.forEach(e => {
      const student = students?.find(s => s.matricule === e.studentId)
      if (student) {
        const promo = student.classId.match(/^[0-9]+[A-Z]+/)?.[0] || student.classId
        if (promotions[promo] && e.pointsImpact) promotions[promo].total += e.pointsImpact
        
        if (e.category === 'discipline') {
          sanctionsByClass[student.classId] = (sanctionsByClass[student.classId] || 0) + 1
        }
      }
    })

    const promoConduct = Object.entries(promotions).map(([name, data]) => ({
      name,
      avg: Number((data.total / data.count).toFixed(2))
    })).sort((a, b) => b.avg - a.avg)

    const classSanctions = Object.entries(sanctionsByClass).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 5)

    return { totalStudents, promoConduct, classSanctions }
  }, [students, lifeEvents])

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFillColor(20, 83, 45)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(`ACADEX - BILAN DISCIPLINAIRE ${activeYear}`, 105, 25, { align: "center" })
    autoTable(doc, {
      startY: 50,
      head: [['Promotion', 'Moyenne Conduite']],
      body: stats.promoConduct.map(p => [p.name, p.avg + '/20']),
      headStyles: { fillColor: [20, 83, 45] }
    })
    doc.save(`ACADEX_DISCIPLINE_${activeYear}.pdf`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-muted/20">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-foreground tracking-tight">Bonjour Monsieur <span className="text-primary italic">{directorName}</span>,</h1>
            <div className="text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Analyse de l'intégrité et de la discipline pour {activeYear}.
            </div>
          </div>
          <Button onClick={handleExportPDF} variant="outline" className="h-14 px-8 rounded-2xl border-2 font-black">
             <FileDown className="mr-2 size-5" /> Rapport de Conduite
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2.5rem] h-20 p-2 flex w-fit shadow-md">
            <TabsTrigger value="generale" className="rounded-2xl font-black px-8 text-xs uppercase tracking-widest">
               Vue Générale
            </TabsTrigger>
            <TabsTrigger value="discipline" className="rounded-2xl font-black px-8 text-xs uppercase tracking-widest flex gap-2">
               <ShieldAlert className="size-4" /> Audit Disciplinaire
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generale" className="space-y-8">
             <div className="grid lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] p-10">
                   <h3 className="text-2xl font-black mb-10">Moyenne de Conduite par Promotion</h3>
                   <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.promoConduct}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold'}} />
                          <YAxis domain={[0, 20]} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="avg" name="Moyenne Conduite" radius={[10, 10, 0, 0]} barSize={50}>
                             {stats.promoConduct.map((entry, index) => (
                              <Cell key={index} fill={entry.avg >= 16 ? '#14532d' : entry.avg >= 10 ? '#fbbf24' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </Card>
                <Card className="lg:col-span-4 border-none shadow-sm bg-white rounded-[3rem] p-10">
                   <h3 className="text-xl font-black mb-8">Top Sanctions par Classe</h3>
                   <div className="space-y-4">
                      {stats.classSanctions.map(c => (
                        <div key={c.name} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                           <span className="font-black">{c.name}</span>
                           <Badge className="bg-red-50 text-red-700 border-red-100">{c.count} Incidents</Badge>
                        </div>
                      ))}
                      {stats.classSanctions.length === 0 && <p className="text-center italic text-muted-foreground opacity-40">Aucun incident scellé.</p>}
                   </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="discipline">
             <Card className="p-20 text-center rounded-[3rem] border-4 border-dashed bg-muted/10 opacity-30">
                <ShieldAlert className="size-20 mx-auto mb-6" />
                <h3 className="text-2xl font-black">Audit de Comportement Avancé</h3>
                <p className="max-w-sm mx-auto font-medium">Analyse des corrélations entre absentéisme et baisse des résultats académiques en cours de développement.</p>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
