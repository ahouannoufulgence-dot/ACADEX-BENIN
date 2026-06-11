
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Layers, 
  ChevronRight, 
  Users, 
  Award, 
  Zap, 
  BookOpen, 
  ClipboardList, 
  Search, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  User, 
  Star, 
  Info, 
  ArrowRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Clock,
  FileText
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, onSnapshot } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { askAcadexBrain } from "@/ai/flows/acadex-brain"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

const levels = [
  { id: "6EME", label: "6EME", desc: "Premier Cycle" },
  { id: "5EME", label: "5EME", desc: "Premier Cycle" },
  { id: "4EME", label: "4EME", desc: "Premier Cycle" },
  { id: "3EME", label: "3EME", desc: "Premier Cycle" },
  { id: "2NDE", label: "2NDE", desc: "Second Cycle" },
  { id: "1ERE", label: "1ERE", desc: "Second Cycle" },
  { id: "TERMINALE", label: "TERMINALE", desc: "Second Cycle" }
]

export default function PromotionsPage() {
  const db = useFirestore()
  const [activeYear, setActiveYear] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>("Mathématiques")
  const [analyzing, setAnalyzing] = useState(false)
  const [aiReport, setAiReport] = useState<string | null>(null)

  useEffect(() => {
    const year = localStorage.getItem('acadex_active_year') || "2026-2027"
    setActiveYear(year)
  }, [])

  const studentsQuery = useMemo(() => {
    if (!db || !activeYear) return null
    return query(collection(db, "students"), where("academicYear", "==", activeYear), where("status", "==", "Actif"))
  }, [db, activeYear])

  const gradesQuery = useMemo(() => {
    if (!db || !activeYear) return null
    return query(collection(db, "grades"), where("academicYear", "==", activeYear))
  }, [db, activeYear])

  const lifeQuery = useMemo(() => {
    if (!db || !activeYear) return null
    return query(
      collection(db, "student_life"), 
      where("academicYear", "==", activeYear),
      where("category", "in", ["presence", "discipline", "conduite"])
    )
  }, [db, activeYear])

  const coefsQuery = useMemo(() => {
    if (!db) return null
    return collection(db, "subject_configs")
  }, [db])

  const { data: students } = useCollection(studentsQuery)
  const { data: grades } = useCollection(gradesQuery)
  const { data: lifeEvents } = useCollection(lifeQuery)
  const { data: coefs } = useCollection(coefsQuery)

  const academicData = useMemo(() => {
    const defaultData = { levelsMap: {}, classStats: {}, studentsProcessed: [] }
    if (!students || !grades) return defaultData

    const levelsMap: any = {}
    const classStats: any = {}
    
    levels.forEach(l => {
      levelsMap[l.id] = { students: [], classes: new Set(), totalAvg: 0, count: 0 }
    })

    const studentsProcessed = students.map((student: any) => {
      const studentGrades = grades.filter((g: any) => g.studentId === student.matricule)
      const studentLife = lifeEvents?.filter((e: any) => e.studentId === student.matricule) || []
      
      let conduct = 20
      studentLife.forEach((e: any) => { if (e.pointsImpact) conduct += Number(e.pointsImpact) })
      conduct = Math.max(0, Math.min(20, conduct))

      const subjects: Record<string, any> = {}
      studentGrades.forEach((g: any) => {
        if (!subjects[g.subject]) {
          const configId = `${student.classId}_${g.subject}`.replace(/\s/g, '_')
          const config = coefs?.find(c => c.id === configId)
          subjects[g.subject] = { vals: [], coef: config?.coef || Number(g.coefficient) || 1, details: {} }
        }
        subjects[g.subject].details[g.type] = Number(g.value)
      })

      let totalWeighted = 0
      let totalCoef = 0
      
      Object.entries(subjects).forEach(([name, s]: [string, any]) => {
        const d = s.details
        const interros = [d.int1, d.int2, d.int3].filter(v => v !== undefined)
        const avgInt = interros.length > 0 ? interros.reduce((a:number, b:number) => a+b, 0) / interros.length : null
        
        const pillars = []
        if (avgInt !== null) pillars.push(avgInt)
        if (d.dev1 !== undefined) pillars.push(d.dev1)
        if (d.dev2 !== undefined) pillars.push(d.dev2)

        const avg = pillars.length > 0 ? (pillars.reduce((a:number, b:number) => a+b, 0) / pillars.length) : 0
        s.avg = avg
        s.isProvisional = pillars.length < 3
        
        totalWeighted += avg * s.coef
        totalCoef += s.coef
      })

      totalWeighted += conduct * 1
      totalCoef += 1

      const generalAvg = totalCoef > 0 ? (totalWeighted / totalCoef) : 0

      return {
        ...student,
        conduct,
        subjects,
        generalAvg: Number(generalAvg.toFixed(2))
      }
    })

    const classGroups: Record<string, any[]> = {}
    studentsProcessed.forEach(s => {
      if (!classGroups[s.classId]) classGroups[s.classId] = []
      classGroups[s.classId].push(s)
    })

    Object.keys(classGroups).forEach(cid => {
      classGroups[cid].sort((a, b) => b.generalAvg - a.generalAvg)
      classGroups[cid].forEach((s, idx) => { s.rank = idx + 1 })
      
      const avgs = classGroups[cid].map(s => s.generalAvg)
      classStats[cid] = {
        avg: avgs.length > 0 ? Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2)) : 0,
        count: avgs.length,
        max: avgs.length > 0 ? Math.max(...avgs) : 0,
        min: avgs.length > 0 ? Math.min(...avgs) : 0,
        successRate: avgs.length > 0 ? (avgs.filter(v => v >= 10).length / avgs.length * 100).toFixed(0) : "0"
      }
    })

    studentsProcessed.forEach(s => {
      const levelId = levels.find(l => s.classId?.startsWith(l.id))?.id
      if (levelId && levelsMap[levelId]) {
        levelsMap[levelId].students.push(s)
        levelsMap[levelId].classes.add(s.classId)
        levelsMap[levelId].totalAvg += s.generalAvg
        levelsMap[levelId].count += 1
      }
    })

    return { levelsMap, classStats, studentsProcessed }
  }, [students, grades, lifeEvents, coefs])

  const currentClassStudents = useMemo(() => {
    if (!academicData.studentsProcessed || !selectedClass) return []
    return academicData.studentsProcessed
      .filter((s: any) => s.classId === selectedClass)
      .sort((a: any, b: any) => (a.lastName || "").localeCompare(b.lastName || ""))
  }, [academicData, selectedClass])

  const goBackToLevels = () => { setSelectedLevel(null); setSelectedClass(null); setAiReport(null); }
  const goBackToClasses = () => { setSelectedClass(null); setAiReport(null); }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">
              Centre <span className="text-primary italic">Promotions</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[9px] md:text-sm">
              <Clock className="size-3.5 md:size-4 text-amber-500" />
              <span>Analyse Progressive • Année {activeYear}</span>
            </div>
          </div>
          {selectedLevel && (
            <Button variant="outline" onClick={goBackToLevels} className="rounded-xl md:rounded-2xl border-2 font-black h-11 md:h-14 px-5 md:px-8 text-[10px] md:text-sm shadow-sm hover:bg-primary hover:text-white transition-all mobile-touch-target">
              <ChevronLeft className="mr-2 size-4" /> Retour Promotions
            </Button>
          )}
        </div>

        {!selectedLevel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {levels.map((level) => {
              const data = academicData.levelsMap[level.id]
              const levelAvg = data?.count > 0 ? (data.totalAvg / data.count).toFixed(2) : "0.00"
              return (
                <Card 
                  key={level.id} 
                  onClick={() => setSelectedLevel(level.id)}
                  className="p-6 md:p-10 rounded-[2.2rem] md:rounded-[3rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden active:scale-95"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <GraduationCap className="size-20 md:size-32" />
                  </div>
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="size-11 md:size-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <Award className="size-5 md:size-8" />
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] md:text-xs px-3">{data?.classes?.size || 0} CLASSES</Badge>
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-xl md:text-3xl font-black text-foreground uppercase tracking-tight">{level.label}</h3>
                    <p className="text-[10px] md:text-sm font-black text-primary/60 uppercase tracking-widest">MOY PROV : {levelAvg}/20</p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {selectedLevel && !selectedClass && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-right-4">
              {Array.from(academicData.levelsMap[selectedLevel]?.classes || []).sort().map((cid: any) => (
                <Card 
                  key={cid} 
                  onClick={() => setSelectedClass(cid)}
                  className="p-6 md:p-10 rounded-[2.2rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all cursor-pointer group border-l-[10px] border-primary active:scale-95"
                >
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl md:text-4xl font-black text-foreground">{cid}</h3>
                      <ChevronRight className="size-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] md:text-xs font-bold uppercase text-muted-foreground">
                         <span>Moyenne Classe</span>
                         <span className="text-primary font-black">{academicData.classStats[cid]?.avg}/20</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] md:text-xs font-bold uppercase text-muted-foreground">
                         <span>Taux Réussite</span>
                         <span className="text-emerald-600 font-black">{academicData.classStats[cid]?.successRate}%</span>
                      </div>
                   </div>
                </Card>
              ))}
           </div>
        )}

        {selectedClass && (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4">
            <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
               {[
                 { label: "Effectif", val: academicData.classStats[selectedClass]?.count || 0, icon: Users, color: "text-blue-600" },
                 { label: "Moyenne Prov.", val: (academicData.classStats[selectedClass]?.avg || "0.00") + "/20", icon: TrendingUp, color: "text-primary" },
                 { label: "Major", val: (academicData.classStats[selectedClass]?.max || "0.00") + "/20", icon: Star, color: "text-amber-500" },
                 { label: "Réussite Prov.", val: (academicData.classStats[selectedClass]?.successRate || "0") + "%", icon: CheckCircle2, color: "text-emerald-600" },
                 { label: "Année", val: activeYear, icon: Clock, color: "text-muted-foreground" },
               ].map((s, i) => (
                 <Card key={i} className="min-w-[130px] md:min-w-0 p-5 md:p-7 rounded-[1.8rem] border-none shadow-sm bg-white flex flex-col justify-between shrink-0 lg:shrink">
                    <div className={cn("p-2 rounded-xl bg-muted w-fit mb-4", s.color)}><s.icon className="size-4 md:size-6" /></div>
                    <div>
                       <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
                       <h4 className="text-sm md:text-2xl font-black">{s.val}</h4>
                    </div>
                 </Card>
               ))}
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden">
               <div className="p-8 md:p-12 border-b bg-muted/5 flex items-center justify-between">
                  <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight">Registre {selectedClass}</h3>
                  <Badge variant="outline" className="font-black border-primary/20 text-primary">SCELLEMENT PROGRESSIF</Badge>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 text-[9px] font-black uppercase text-muted-foreground border-b border-muted/30">
                      <tr>
                        <th className="px-8 py-6 text-left">Élève</th>
                        <th className="px-6 py-6 text-center">Rang</th>
                        <th className="px-6 py-6 text-center">Moy Prov.</th>
                        <th className="px-8 py-6 text-right">Bulletin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/20">
                      {currentClassStudents.map((s: any) => {
                        return (
                          <tr key={s.id} className="hover:bg-muted/5 transition-all group">
                            <td className="px-8 py-6">
                               <p className="font-black text-lg text-foreground uppercase tracking-tight group-hover:text-primary">{s.lastName} {s.firstName}</p>
                               <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.matricule}</p>
                            </td>
                            <td className="px-6 py-6 text-center">
                               <div className={cn("inline-flex size-10 rounded-xl items-center justify-center font-black shadow-sm", s.rank === 1 ? "bg-amber-100 text-amber-700" : "bg-muted text-foreground")}>{s.rank}e</div>
                            </td>
                            <td className="px-6 py-6 text-center">
                               <span className="font-black text-lg text-foreground tabular-nums">{s.generalAvg.toFixed(2)}</span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <Button variant="ghost" size="icon" asChild className="size-11 rounded-xl text-primary hover:bg-primary/5 active:scale-95 transition-all">
                                  <Link href={`/bulletin/${s.id}`}>
                                     <FileText className="size-5 md:size-6" />
                                  </Link>
                               </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
               </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
