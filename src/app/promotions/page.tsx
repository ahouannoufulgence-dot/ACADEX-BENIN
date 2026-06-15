"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Layers, 
  ChevronRight, 
  Users, 
  Award, 
  Zap, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  ChevronLeft,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Clock,
  FileText,
  AlertTriangle,
  Star
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, onSnapshot, orderBy } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
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

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)
  const { data: grades, loading: loadingGrades } = useCollection(gradesQuery)

  const academicData = useMemo(() => {
    const defaultData = { levelsMap: {}, classStats: {}, studentsProcessed: [] }
    if (!students) return defaultData

    const levelsMap: any = {}
    const classStats: any = {}
    
    levels.forEach(l => {
      levelsMap[l.id] = { students: [], classes: new Set(), totalAvg: 0, count: 0, isProvisional: true }
    })

    const studentsProcessed = students.map((student: any) => {
      const studentGrades = grades?.filter((g: any) => g.studentId === student.matricule) || []
      const subjects: Record<string, any> = {}
      
      studentGrades.forEach((g: any) => {
        if (!subjects[g.subject]) {
          subjects[g.subject] = { ints: [], devs: [], coef: Number(g.coefficient) || 2 }
        }
        if (g.type.startsWith('int')) subjects[g.subject].ints.push(Number(g.value))
        if (g.type.startsWith('dev')) subjects[g.subject].devs.push(Number(g.value))
      })

      let totalWeighted = 0, totalCoef = 0, gradesCount = 0
      
      Object.values(subjects).forEach((s: any) => {
        const avgInt = s.ints.length > 0 ? s.ints.reduce((a:number, b:number) => a+b, 0) / s.ints.length : null
        const blocks = []
        if (avgInt !== null) blocks.push(avgInt)
        s.devs.forEach((d: number) => blocks.push(d))

        if (blocks.length > 0) {
          const avg = blocks.reduce((a, b) => a + b, 0) / blocks.length
          totalWeighted += avg * s.coef
          totalCoef += s.coef
          gradesCount += (s.ints.length + s.devs.length)
        }
      })

      const generalAvg = totalCoef > 0 ? (totalWeighted / totalCoef) : 0
      return { ...student, generalAvg: Number(generalAvg.toFixed(2)), gradesCount }
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
      const totalGrades = classGroups[cid].reduce((acc, s) => acc + s.gradesCount, 0)
      const expectedGrades = classGroups[cid].length * 50 // Estimation 10 sujets * 5 notes

      classStats[cid] = {
        avg: avgs.length > 0 ? Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2)) : 0,
        count: avgs.length,
        max: avgs.length > 0 ? Math.max(...avgs).toFixed(2) : "0.00",
        min: avgs.length > 0 ? Math.min(...avgs).toFixed(2) : "0.00",
        completion: Math.min(100, Math.round((totalGrades / expectedGrades) * 100)),
        successRate: avgs.length > 0 ? (avgs.filter(v => v >= 10).length / avgs.length * 100).toFixed(0) : "0"
      }
    })

    studentsProcessed.forEach(s => {
      const levelId = levels.find(l => s.classId?.toUpperCase().includes(l.id))?.id
      if (levelId && levelsMap[levelId]) {
        levelsMap[levelId].students.push(s)
        levelsMap[levelId].classes.add(s.classId)
        levelsMap[levelId].totalAvg += s.generalAvg
        levelsMap[levelId].count += 1
      }
    })

    return { levelsMap, classStats, studentsProcessed }
  }, [students, grades])

  const currentClassStudents = useMemo(() => {
    if (!academicData.studentsProcessed || !selectedClass) return []
    return academicData.studentsProcessed
      .filter((s: any) => s.classId === selectedClass)
      .sort((a: any, b: any) => (a.lastName || "").localeCompare(b.lastName || ""))
  }, [academicData, selectedClass])

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">
                Centre <span className="text-primary italic">Promotions</span>
              </h1>
              {selectedClass && academicData.classStats[selectedClass]?.completion < 95 && (
                <Badge className="bg-amber-500 text-white animate-pulse hidden md:flex">PROVISOIRE</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[9px] md:text-sm">
              <Clock className="size-3.5 md:size-4 text-amber-500" />
              <span>Analyse ACADEX Haute Fidélité • {activeYear}</span>
            </div>
          </div>
          {selectedLevel && (
            <Button variant="outline" onClick={() => { setSelectedLevel(null); setSelectedClass(null); }} className="rounded-xl md:rounded-2xl border-2 font-black h-11 md:h-14 px-5 md:px-8 text-[10px] md:text-sm shadow-sm hover:bg-primary hover:text-white transition-all">
              <ChevronLeft className="mr-2 size-4" /> Retour Promotions
            </Button>
          )}
        </div>

        {loadingStudents ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-20">
            <Loader2 className="animate-spin text-primary size-10 md:size-12" />
            <p className="font-black text-[10px] uppercase tracking-widest">Calcul des promotions...</p>
          </div>
        ) : !students || students.length === 0 ? (
          <Card className="p-16 md:p-32 text-center rounded-[2.2rem] md:rounded-[4rem] border-4 border-dashed border-muted/50 bg-white/50 flex flex-col items-center justify-center h-full space-y-6">
            <div className="size-16 md:size-28 bg-muted rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center opacity-30 shadow-inner"><Users className="size-8 md:size-14 text-muted-foreground" /></div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-4xl font-black tracking-tight text-foreground/40 uppercase">Aucun élève actif</h3>
              <p className="text-[10px] md:text-base font-bold text-muted-foreground/40 uppercase tracking-widest">Inscrivez des élèves pour voir les promotions s'initialiser.</p>
            </div>
          </Card>
        ) : !selectedLevel ? (
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
                    <p className="text-[10px] md:text-sm font-black text-primary/60 uppercase tracking-widest">MOY : {levelAvg}/20</p>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : null}

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
                      <div className="w-full bg-muted/30 h-1.5 rounded-full overflow-hidden">
                         <div className="bg-primary h-full transition-all" style={{ width: `${academicData.classStats[cid]?.completion}%` }} />
                      </div>
                   </div>
                </Card>
              ))}
           </div>
        )}

        {selectedClass && (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4 duration-500">
            <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
               {[
                 { label: "Effectif", val: academicData.classStats[selectedClass]?.count || 0, icon: Users, color: "text-blue-600" },
                 { label: "Moyenne", val: (academicData.classStats[selectedClass]?.avg || "0.00") + "/20", icon: TrendingUp, color: "text-primary" },
                 { label: "Major", val: academicData.classStats[selectedClass]?.max + "/20", icon: Star, color: "text-amber-500" },
                 { label: "Audit Saisie", val: academicData.classStats[selectedClass]?.completion + "%", icon: Clock, color: "text-blue-600" },
                 { label: "Réussite", val: academicData.classStats[selectedClass]?.successRate + "%", icon: CheckCircle2, color: "text-emerald-600" },
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
                  <div className="space-y-1">
                    <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight">Registre {selectedClass}</h3>
                    <p className="text-[8px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">Classement par mérite scolaire</p>
                  </div>
                  <Badge variant="outline" className="font-black border-primary/20 text-primary">ALGORITHME ACADEX</Badge>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 text-[9px] font-black uppercase text-muted-foreground border-b border-muted/30">
                      <tr>
                        <th className="px-8 py-6 text-left">Rang & Élève</th>
                        <th className="px-6 py-6 text-center">Matricule</th>
                        <th className="px-6 py-6 text-center">Moyenne Générale</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/20">
                      {currentClassStudents.map((s: any) => {
                        return (
                          <tr key={s.id} className="hover:bg-muted/5 transition-all group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className={cn("size-9 md:size-11 rounded-xl items-center justify-center font-black shadow-sm flex shrink-0", s.rank === 1 ? "bg-amber-100 text-amber-700" : "bg-muted text-foreground")}>{s.rank}</div>
                                  <div>
                                     <p className="font-black text-base md:text-xl text-foreground uppercase tracking-tight group-hover:text-primary">{s.lastName} {s.firstName}</p>
                                     <Badge variant="outline" className="text-[6px] md:text-[8px] font-black uppercase mt-1 h-4">ID: {s.matricule}</Badge>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-6 text-center font-mono text-[10px] text-muted-foreground/60">{s.matricule}</td>
                            <td className="px-6 py-6 text-center">
                               <span className={cn("font-black text-sm md:text-2xl tabular-nums", s.generalAvg >= 10 ? "text-primary" : "text-red-600")}>{s.generalAvg.toFixed(2)}</span>
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
