
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
  Info
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
  "Mathématiques", "Français", "Anglais", "PCT", "SVT", "Histoire-Géo", "Philosophie"
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

  // REQUÊTES RÉELLES
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

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)
  const { data: grades, loading: loadingGrades } = useCollection(gradesQuery)
  const { data: lifeEvents } = useCollection(lifeQuery)

  // LOGIQUE DE CALCUL DES MOYENNES ET RANGS
  const academicData = useMemo(() => {
    if (!students || !grades) return { levelsMap: {}, classStats: {}, studentsRanked: [] }

    const levelsMap: any = {}
    const classStats: any = {}
    
    // Initialisation
    levels.forEach(l => {
      levelsMap[l.id] = { students: [], classes: new Set(), totalAvg: 0, count: 0 }
    })

    // Calcul par élève
    const studentsProcessed = students.map((student: any) => {
      const studentGrades = grades.filter((g: any) => g.studentId === student.matricule)
      const studentLife = lifeEvents?.filter((e: any) => e.studentId === student.matricule) || []
      
      // Note de conduite
      let conduct = 20
      studentLife.forEach((e: any) => { if (e.pointsImpact) conduct += Number(e.pointsImpact) })
      conduct = Math.max(0, Math.min(20, conduct))

      // Moyennes par matière
      const subjects: Record<string, any> = {}
      studentGrades.forEach((g: any) => {
        if (!subjects[g.subject]) subjects[g.subject] = { vals: [], coef: Number(g.coefficient) || 1, details: {} }
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

      // Ajout Conduite (Coef 1)
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

    // Calcul des Rangs par classe
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
        successRate: (avgs.filter(v => v >= 10).length / avgs.length * 100).toFixed(0)
      }
    })

    // Mise à jour de la carte des niveaux
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
  }, [students, grades, lifeEvents, activeYear])

  const handleAnalyzeClass = async () => {
    if (!selectedClass || academicData.studentsProcessed.length === 0) return
    setAnalyzing(true)
    try {
      const classStudents = academicData.studentsProcessed.filter(s => s.classId === selectedClass)
      const prompt = `Analysez la performance de la classe ${selectedClass}. 
      Statistiques : Moyenne ${academicData.classStats[selectedClass]?.avg}, Taux réussite ${academicData.classStats[selectedClass]?.successRate}%.
      Données élèves : ${JSON.stringify(classStudents.map(s => ({ nom: s.lastName, moy: s.generalAvg })))}`
      
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

  const currentClassStudents = useMemo(() => {
    return academicData.studentsProcessed
      .filter(s => s.classId === selectedClass)
      .sort((a, b) => a.rank - b.rank)
  }, [academicData, selectedClass])

  const goBackToLevels = () => { setSelectedLevel(null); setSelectedClass(null); setAiReport(null); }
  const goBackToClasses = () => { setSelectedClass(null); setAiReport(null); }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Header Dynamique */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
              Centre <span className="text-primary italic">Promotions</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <Layers className="size-3 md:size-4 text-primary" />
              <span>Pilotage Académique • {activeYear}</span>
            </div>
          </div>
          {selectedLevel && (
            <Button variant="outline" onClick={goBackToLevels} className="rounded-xl md:rounded-2xl border-2 font-black h-11 md:h-14 px-5 md:px-8 text-[10px] md:text-sm shadow-sm hover:bg-primary hover:text-white transition-all">
              <ChevronLeft className="mr-2 size-4" /> Retour Promotions
            </Button>
          )}
        </div>

        {/* 1. VUE DES PROMOTIONS (Niveaux) */}
        {!selectedLevel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {levels.map((level) => {
              const data = academicData.levelsMap[level.id]
              const levelAvg = data?.count > 0 ? (data.totalAvg / data.count).toFixed(2) : "0.00"
              return (
                <Card 
                  key={level.id} 
                  onClick={() => setSelectedLevel(level.id)}
                  className="p-6 md:p-10 rounded-[2.2rem] md:rounded-[3rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <GraduationCap className="size-24 md:size-32" />
                  </div>
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="size-12 md:size-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <Award className="size-6 md:size-8" />
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] md:text-xs px-3">{data?.classes.size || 0} CLASSES</Badge>
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-xl md:text-3xl font-black text-foreground uppercase tracking-tight">{level.label}</h3>
                    <p className="text-[10px] md:text-sm font-black text-primary/60 uppercase tracking-widest">MOY : {levelAvg}/20</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-muted/30 flex justify-between items-center relative z-10">
                    <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase">{data?.count || 0} Élèves inscrits</span>
                    <ChevronRight className="size-4 md:size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* 2. VUE DES CLASSES D'UN NIVEAU */}
        {selectedLevel && !selectedClass && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="flex items-center gap-4">
               <Badge className="bg-primary text-white text-lg md:text-2xl font-black px-6 py-2 rounded-full uppercase shadow-lg shadow-primary/20">{selectedLevel}</Badge>
               <div className="h-0.5 flex-1 bg-muted/30" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from(academicData.levelsMap[selectedLevel]?.classes || []).sort().map((cls: any) => {
                const stats = academicData.classStats[cls]
                return (
                  <Card 
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className="p-8 md:p-12 rounded-[2.5rem] bg-white border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02]"><Zap className="size-20" /></div>
                    <div className="size-16 md:size-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                      <BookOpen className="size-8 md:size-10" />
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black mb-4 uppercase text-center">{cls}</h3>
                    <div className="space-y-3 pt-4 border-t border-muted/30">
                       <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className="text-muted-foreground">Moyenne</span>
                          <span className="text-primary">{stats?.avg || "0.00"}/20</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className="text-muted-foreground">Réussite</span>
                          <span className="text-emerald-600">{stats?.successRate || "0"}%</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className="text-muted-foreground">Effectif</span>
                          <span className="text-foreground">{stats?.count || 0} Élèves</span>
                       </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. VUE DÉTAILLÉE DE LA CLASSE (TABLEAU INTELLIGENT) */}
        {selectedClass && (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4">
            
            {/* Statistiques de tête */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
               {[
                 { label: "Effectif", val: academicData.classStats[selectedClass]?.count, icon: Users, color: "text-blue-600" },
                 { label: "Moyenne", val: academicData.classStats[selectedClass]?.avg + "/20", icon: TrendingUp, color: "text-primary" },
                 { label: "Major", val: academicData.classStats[selectedClass]?.max + "/20", icon: Star, color: "text-amber-500" },
                 { label: "Plus faible", val: academicData.classStats[selectedClass]?.min + "/20", icon: TrendingDown, color: "text-red-500" },
                 { label: "Réussite", val: academicData.classStats[selectedClass]?.successRate + "%", icon: CheckCircle2, color: "text-emerald-600" },
               ].map((s, i) => (
                 <Card key={i} className="p-5 md:p-7 rounded-[1.8rem] border-none shadow-sm bg-white flex flex-col justify-between">
                    <div className={cn("p-2 rounded-xl bg-muted w-fit mb-4", s.color)}><s.icon className="size-4 md:size-5" /></div>
                    <div>
                       <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
                       <h4 className="text-base md:text-2xl font-black">{s.val}</h4>
                    </div>
                 </Card>
               ))}
            </div>

            {/* Barre d'outils et Filtre */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border-2 border-primary/5">
               <div className="flex items-center gap-4 w-full md:w-auto">
                 <Button variant="ghost" onClick={goBackToClasses} className="rounded-xl font-black text-xs uppercase"><ChevronLeft className="size-4 mr-2" /> Retour</Button>
                 <Badge className="bg-primary text-white text-lg font-black px-6 h-12 rounded-2xl">{selectedClass}</Badge>
               </div>
               
               <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex-1 md:w-64">
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                       <SelectTrigger className="h-12 rounded-xl border-2 font-black"><SelectValue /></SelectTrigger>
                       <SelectContent className="rounded-xl border-2 p-1">
                          {BENIN_SUBJECTS.map(s => <SelectItem key={s} value={s} className="font-bold p-3 rounded-lg">{s}</SelectItem>)}
                       </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAnalyzeClass} disabled={analyzing} className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-6 font-black shadow-xl shadow-primary/20">
                     {analyzing ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4 mr-2" />}
                     Analyser Classe
                  </Button>
               </div>
            </div>

            {aiReport && (
              <Card className="p-8 rounded-[2.5rem] bg-foreground text-white shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                 <div className="relative z-10 space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-3 uppercase"><Zap className="text-primary fill-primary" /> Diagnostic Brain v1</h3>
                    <p className="text-white/80 italic font-medium leading-relaxed border-l-4 border-primary pl-6">{aiReport}</p>
                    <Button variant="ghost" size="sm" onClick={() => setAiReport(null)} className="text-white/40 font-bold uppercase text-[9px] hover:text-white">Masquer l'analyse</Button>
                 </div>
                 <Sparkles className="absolute -bottom-10 -right-10 size-48 text-white/[0.03]" />
              </Card>
            )}

            {/* TABLEAU DES NOTES (Desktop) / CARTES (Mobile) */}
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden">
               {/* Mobile Cards */}
               <div className="md:hidden p-4 space-y-4 bg-muted/5">
                  {currentClassStudents.map((s: any) => (
                    <div key={s.id} className="p-5 bg-white rounded-[2rem] border border-muted/50 shadow-sm flex flex-col gap-4">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                             <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">{s.rank}e</div>
                             <div>
                                <p className="font-black text-sm uppercase truncate max-w-[150px]">{s.lastName} {s.firstName}</p>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase">{s.matricule}</p>
                             </div>
                          </div>
                          <Badge className="bg-primary h-8 px-3 rounded-lg font-black text-sm">{s.generalAvg}</Badge>
                       </div>
                       <div className="grid grid-cols-2 gap-2 pt-2 border-t border-muted/30">
                          <div className="p-3 bg-muted/30 rounded-xl">
                             <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">{selectedSubject}</p>
                             <p className="font-black text-sm">{s.subjects[selectedSubject]?.avg?.toFixed(2) || "---"}</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-xl">
                             <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">Conduite</p>
                             <p className="font-black text-sm">{s.conduct.toFixed(1)}/20</p>
                          </div>
                       </div>
                       <Button variant="ghost" className="w-full font-black text-primary text-[10px] uppercase h-10 hover:bg-primary/5">Détails Dossier <ArrowRight className="ml-2 size-3" /></Button>
                    </div>
                  ))}
               </div>

               {/* Desktop Table */}
               <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground border-b border-muted/30">
                      <tr>
                        <th className="px-8 py-6 text-left">Rang</th>
                        <th className="px-8 py-6 text-left">Identifiant / Nom & Prénoms</th>
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
                               <div>
                                  <p className="font-black text-lg text-foreground uppercase tracking-tight truncate max-w-[200px] group-hover:text-primary transition-colors">{s.lastName} {s.firstName}</p>
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.matricule}</p>
                               </div>
                            </td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.int1 || "---"}</td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.int2 || "---"}</td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.int3 || "---"}</td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.dev1 || "---"}</td>
                            <td className="px-4 py-6 text-center font-bold text-muted-foreground">{sub?.details?.dev2 || "---"}</td>
                            <td className="px-6 py-6 text-center font-black text-primary bg-primary/5">{sub?.avg?.toFixed(2) || "0.00"}</td>
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

            <div className="p-8 bg-muted/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-dashed border-muted-foreground/10">
               <div className="flex items-center gap-4">
                  <div className="size-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <ShieldCheck className="text-primary size-6" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground max-w-xl italic">
                    "Toutes les moyennes et les rangs affichés dans ce tableau sont scellés et basés sur les coefficients officiels de l'établissement Acadex pour l'année {activeYear}."
                  </p>
               </div>
               <Button className="rounded-xl font-black bg-foreground text-white h-12 px-8"><Download className="mr-2 size-4" /> EXPORTER CLASSEMENT</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
