
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Layers, 
  ChevronRight, 
  Users, 
  FileText, 
  ShieldCheck, 
  ChevronLeft, 
  Loader2, 
  GraduationCap,
  Award,
  Zap,
  BookOpen,
  ClipboardList,
  Search,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Sparkles,
  User,
  Star,
  Info,
  ArrowRight
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

const BENIN_SUBJECTS = [
  "Mathématiques", "Français", "Anglais", "PCT", "SVT", "Histoire-Géo", "Philosophie", 
  "Allemand", "Espagnol", "Économie", "Informatique", "EPS"
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
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    const updateYear = (e: any) => setActiveYear(e.detail)
    window.addEventListener('acadex_year_changed', updateYear as any)
    return () => window.removeEventListener('acadex_year_changed', updateYear as any)
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
    return query(collection(db, "student_life"), where("academicYear", "==", activeYear))
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
        subjects[g.subject].vals.push(Number(g.value))
        subjects[g.subject].details[g.type] = Number(g.value)
      })

      let totalWeighted = 0
      let totalCoef = 0
      
      Object.entries(subjects).forEach(([name, s]: [string, any]) => {
        const avg = s.vals.reduce((a:number, b:number) => a+b, 0) / s.vals.length
        s.avg = avg
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
        avg: Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2)),
        count: avgs.length,
        max: Math.max(...avgs),
        min: Math.min(...avgs),
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
    if (!academicData.studentsProcessed || academicData.studentsProcessed.length === 0) return []
    return academicData.studentsProcessed
      .filter((s: any) => s.classId === selectedClass)
      .sort((a: any, b: any) => a.rank - b.rank)
  }, [academicData, selectedClass])

  const handleAnalyzeClass = async () => {
    if (!selectedClass || currentClassStudents.length === 0) return
    setAnalyzing(true)
    try {
      const prompt = `Analysez la performance de la classe ${selectedClass}. 
      Statistiques : Moyenne ${academicData.classStats[selectedClass]?.avg}, Taux réussite ${academicData.classStats[selectedClass]?.successRate}%.
      Données élèves : ${JSON.stringify(currentClassStudents.map((s: any) => ({ nom: s.lastName, moy: s.generalAvg })))}`
      
      const res = await askAcadexBrain({
        question: prompt,
        userRole: "Directeur",
        userId: "DIR-001",
        contextData: { schoolName: "ACADEX", year: activeYear, stats: academicData.classStats[selectedClass] }
      })
      setAiReport(res.answer)
      toast({ title: "Analyse Scellée" })
    } catch (e) {
      toast({ title: "Erreur IA", variant: "destructive" })
    } finally {
      setAnalyzing(false)
    }
  }

  const goBackToLevels = () => { setSelectedLevel(null); setSelectedClass(null); setAiReport(null); }
  const goBackToClasses = () => { setSelectedClass(null); setAiReport(null); }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Responsive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">
              Centre <span className="text-primary italic">Promotions</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[9px] md:text-sm">
              <Layers className="size-3 md:size-4 text-primary" />
              <span>Pilotage Académique • {activeYear}</span>
            </div>
          </div>
          {selectedLevel && (
            <Button variant="outline" onClick={goBackToLevels} className="rounded-xl md:rounded-2xl border-2 font-black h-11 md:h-14 px-5 md:px-8 text-[10px] md:text-sm shadow-sm hover:bg-primary hover:text-white transition-all mobile-touch-target">
              <ChevronLeft className="mr-2 size-4" /> Retour Promotions
            </Button>
          )}
        </div>

        {/* 1. VUE DES PROMOTIONS */}
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
                    <GraduationCap className="size-24 md:size-32" />
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
                  <div className="mt-8 pt-6 border-t border-muted/30 flex justify-between items-center relative z-10">
                    <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase">{data?.count || 0} Élèves</span>
                    <ChevronRight className="size-4 md:size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* 2. VUE DES CLASSES */}
        {selectedLevel && !selectedClass && (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4">
            <div className="flex items-center gap-4">
               <Badge className="bg-primary text-white text-base md:text-2xl font-black px-6 py-2 rounded-full uppercase shadow-lg shadow-primary/20">{selectedLevel}</Badge>
               <div className="h-0.5 flex-1 bg-muted/30" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
              {Array.from(academicData.levelsMap[selectedLevel]?.classes || []).sort().map((cls: any) => {
                const stats = academicData.classStats[cls]
                return (
                  <Card 
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className="p-8 md:p-12 rounded-[2.5rem] bg-white border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden active:scale-95"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02]"><Zap className="size-20" /></div>
                    <div className="size-16 md:size-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                      <BookOpen className="size-8 md:size-10" />
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black mb-4 uppercase text-center">{cls}</h3>
                    <div className="space-y-3 pt-4 border-t border-muted/30">
                       <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase">
                          <span className="text-muted-foreground">Moyenne</span>
                          <span className="text-primary">{stats?.avg || "0.00"}/20</span>
                       </div>
                       <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase">
                          <span className="text-muted-foreground">Réussite</span>
                          <span className="text-emerald-600">{stats?.successRate || "0"}%</span>
                       </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. TABLEAU SCOLAIRE INTELLIGENT */}
        {selectedClass && (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4">
            
            {/* Stats de tête - Responsive Scroll on Mobile */}
            <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
               {[
                 { label: "Effectif", val: academicData.classStats[selectedClass]?.count || 0, icon: Users, color: "text-blue-600" },
                 { label: "Moyenne", val: (academicData.classStats[selectedClass]?.avg || "0.00") + "/20", icon: TrendingUp, color: "text-primary" },
                 { label: "Major", val: (academicData.classStats[selectedClass]?.max || "0.00") + "/20", icon: Star, color: "text-amber-500" },
                 { label: "Faible", val: (academicData.classStats[selectedClass]?.min || "0.00") + "/20", icon: TrendingDown, color: "text-red-500" },
                 { label: "Réussite", val: (academicData.classStats[selectedClass]?.successRate || "0") + "%", icon: CheckCircle2, color: "text-emerald-600" },
               ].map((s, i) => (
                 <Card key={i} className="min-w-[140px] md:min-w-0 p-5 md:p-7 rounded-[1.8rem] border-none shadow-sm bg-white flex flex-col justify-between shrink-0 lg:shrink">
                    <div className={cn("p-2 rounded-xl bg-muted w-fit mb-4", s.color)}><s.icon className="size-4 md:size-5" /></div>
                    <div>
                       <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
                       <h4 className="text-base md:text-2xl font-black">{s.val}</h4>
                    </div>
                 </Card>
               ))}
            </div>

            {/* Outils & Filtres */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border-2 border-primary/5">
               <div className="flex items-center justify-between w-full md:w-auto">
                 <Button variant="ghost" onClick={goBackToClasses} className="rounded-xl font-black text-[10px] md:text-xs uppercase mobile-touch-target"><ChevronLeft className="size-4 mr-1 md:mr-2" /> Retour</Button>
                 <Badge className="bg-primary text-white text-sm md:text-lg font-black px-4 md:px-6 h-10 md:h-12 rounded-2xl">{selectedClass}</Badge>
               </div>
               
               <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                  <div className="flex-1 md:w-64">
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                       <SelectTrigger className="h-12 rounded-xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger>
                       <SelectContent className="rounded-xl border-2 p-1.5">
                          {BENIN_SUBJECTS.map(s => <SelectItem key={s} value={s} className="font-bold p-3 rounded-lg">{s}</SelectItem>)}
                       </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAnalyzeClass} disabled={analyzing} className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-5 md:px-8 font-black shadow-xl shadow-primary/20 text-[10px] md:text-sm mobile-touch-target">
                     {analyzing ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4 mr-2" />}
                     <span className="hidden sm:inline">Analyser Classe</span>
                     <span className="sm:hidden">IA</span>
                  </Button>
               </div>
            </div>

            {aiReport && (
              <Card className="p-8 rounded-[2.5rem] bg-foreground text-white shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                 <div className="relative z-10 space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-3 uppercase"><Zap className="text-primary fill-primary size-5 md:size-6" /> Diagnostic Brain v1</h3>
                    <p className="text-white/80 italic font-medium leading-relaxed border-l-4 border-primary pl-6 text-sm md:text-base">{aiReport}</p>
                 </div>
                 <Sparkles className="absolute -bottom-10 -right-10 size-48 text-white/[0.03]" />
              </Card>
            )}

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden">
               {/* Mobile Cards View - Ultra Premium */}
               <div className="md:hidden p-4 space-y-4 bg-muted/5">
                  {currentClassStudents.map((s: any) => (
                    <div key={s.id} className="p-5 bg-white rounded-[2rem] border border-muted/50 shadow-sm flex flex-col gap-4 active:scale-[0.98] transition-all">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                             <div className={cn("size-10 rounded-xl flex items-center justify-center font-black shadow-sm", s.rank === 1 ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary")}>
                               {s.rank}e
                             </div>
                             <div>
                                <p className="font-black text-sm uppercase truncate max-w-[150px]">{s.lastName} {s.firstName}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.matricule}</p>
                             </div>
                          </div>
                          <Badge className="bg-primary h-8 px-3 rounded-lg font-black text-sm shadow-sm">{s.generalAvg.toFixed(2)}</Badge>
                       </div>
                       <div className="grid grid-cols-2 gap-2 pt-2 border-t border-muted/30">
                          <div className="p-3 bg-muted/30 rounded-xl">
                             <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">{selectedSubject}</p>
                             <p className="font-black text-xs">{s.subjects[selectedSubject]?.avg?.toFixed(2) || "---"}</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-xl">
                             <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">Conduite</p>
                             <p className="font-black text-xs">{s.conduct.toFixed(1)}/20</p>
                          </div>
                       </div>
                       <Button variant="ghost" asChild className="w-full font-black text-primary text-[10px] uppercase h-10 hover:bg-primary/5 rounded-xl mobile-touch-target">
                         <Link href={`/eleves/${s.id}`}>Détails Dossier <ArrowRight className="ml-2 size-3" /></Link>
                       </Button>
                    </div>
                  ))}
               </div>

               {/* Desktop Table View */}
               <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground border-b border-muted/30">
                      <tr>
                        <th className="px-8 py-6 text-left">Rang</th>
                        <th className="px-8 py-6 text-left">Élève</th>
                        <th className="px-4 py-6 text-center">Int 1</th>
                        <th className="px-4 py-6 text-center">Int 2</th>
                        <th className="px-4 py-6 text-center">Int 3</th>
                        <th className="px-4 py-6 text-center">Dev 1</th>
                        <th className="px-4 py-6 text-center">Dev 2</th>
                        <th className="px-6 py-6 text-center bg-primary/5 text-primary">Moy Mat.</th>
                        <th className="px-4 py-6 text-center">Coef</th>
                        <th className="px-6 py-6 text-center">Conduite</th>
                        <th className="px-8 py-6 text-right bg-primary text-white">Moy Générale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/20">
                      {currentClassStudents.map((s: any) => {
                        const sub = s.subjects[selectedSubject]
                        return (
                          <tr key={s.id} className="hover:bg-muted/5 transition-all group">
                            <td className="px-8 py-6">
                               <div className={cn("size-10 rounded-xl flex items-center justify-center font-black shadow-sm", s.rank === 1 ? "bg-amber-100 text-amber-700" : "bg-muted text-foreground")}>{s.rank}e</div>
                            </td>
                            <td className="px-8 py-6">
                               <Link href={`/eleves/${s.id}`} className="block hover:translate-x-1 transition-transform">
                                  <p className="font-black text-lg text-foreground uppercase tracking-tight group-hover:text-primary">{s.lastName} {s.firstName}</p>
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.matricule}</p>
                               </Link>
                            </td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.int1 ?? "---"}</td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.int2 ?? "---"}</td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.int3 ?? "---"}</td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.dev1 ?? "---"}</td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.dev2 ?? "---"}</td>
                            <td className="px-6 py-6 text-center font-black text-primary bg-primary/5">{sub?.avg?.toFixed(2) ?? "0.00"}</td>
                            <td className="px-4 py-6 text-center font-bold">{sub?.coef || 1}</td>
                            <td className="px-6 py-6 text-center font-black text-emerald-600">{s.conduct.toFixed(1)}</td>
                            <td className="px-8 py-6 text-right">
                               <span className="font-black text-2xl text-foreground tabular-nums">{s.generalAvg.toFixed(2)}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
               </div>
            </Card>

            <div className="p-6 md:p-8 bg-muted/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-dashed border-muted-foreground/10">
               <div className="flex items-center gap-4 text-center md:text-left">
                  <div className="size-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <ShieldCheck className="text-primary size-6" />
                  </div>
                  <p className="text-[11px] md:text-sm font-medium text-muted-foreground max-w-xl italic">
                    "Toutes les moyennes et les rangs affichés sont scellés et synchronisés avec le module de Vie Scolaire (Note de Conduite) et les Coefficients Officiels."
                  </p>
               </div>
               <Button className="w-full md:w-auto rounded-xl font-black bg-foreground text-white h-12 md:h-14 px-8 shadow-lg active:scale-95 transition-all text-xs md:text-sm mobile-touch-target">
                 <Download className="mr-2 size-4" /> EXPORTER CLASSEMENT
               </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
