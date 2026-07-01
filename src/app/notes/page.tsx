
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Save, 
  Loader2, 
  ShieldCheck, 
  Calculator, 
  User, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  ChevronLeft,
  Users,
  Zap,
  Download,
  Layers,
  Lock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useState, useMemo, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const trimestres = [
  { id: "T1", label: "1er Trimestre" },
  { id: "T2", label: "2ème Trimestre" },
  { id: "T3", label: "3ème Trimestre" }
]

const evalTypes = [
  { id: "int1", label: "Interrogation 1" },
  { id: "int2", label: "Interrogation 2" },
  { id: "int3", label: "Interrogation 3" },
  { id: "dev1", label: "Devoir 1" },
  { id: "dev2", label: "Devoir 2" }
]

const OFFICIAL_CLASSES = [
  "6EME A", "6EME B", "5EME A", "5EME B", "4EME A", "4EME B", "3EME D1", "3EME D2",
  "2NDE A", "2NDE B", "2NDE C", "2NDE D",
  "1ERE A", "1ERE B", "1ERE C", "1ERE D",
  "TLE A", "TLE B", "TLE C", "TLE D"
]

const PROMOTIONS = ["6EME", "5EME", "4EME", "3EME", "2NDE", "1ERE", "TLE"]

const MATIERES = ["Mathématiques", "Français", "Anglais", "PCT", "SVT", "Histoire-Géo", "Philosophie", "Allemand", "Espagnol", "Économie", "Informatique", "EPS"]
const MATIERES_PREMIER_CYCLE = ["Communication", "Lecture"]
const PREMIER_CYCLE = ["6EME", "5EME", "4EME", "3EME"]

export default function GradesPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [userSubject, setUserSubject] = useState("")
  const [userSubjectSecondaire, setUserSubjectSecondaire] = useState("")
  const [activeSubject, setActiveSubject] = useState("")
  const [userName, setUserName] = useState("")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [mounted, setMounted] = useState(false)
  const [systemLocked, setSystemLocked] = useState(false)
  
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedTrimestre, setSelectedTrimestre] = useState("T1")
  const [selectedEvalType, setSelectedEvalType] = useState("int1")
  const [selectedPromotion, setSelectedPromotion] = useState<string | null>(null)
  const [selectedMatiere, setSelectedMatiere] = useState<string>("Mathématiques")
  
  const [saving, setSaving] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [gradesData, setGradesData] = useState<Record<string, string>>({})
  const [completionStats, setCompletionStats] = useState<Record<string, boolean>>({})
  const [classCoefficient, setClassCoefficient] = useState<string>("2")
  const [teacherStudents, setTeacherStudents] = useState<any[]>([])
  const [allGrades, setAllGrades] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    const role = localStorage.getItem('acadex_user_role')
    const userId = localStorage.getItem('acadex_user_id')
    const year = localStorage.getItem('acadex_active_year') || "2026-2027"
    
    setUserRole(role)
    setActiveYear(year)
    setUserName(localStorage.getItem('acadex_user_name') || "")

    const fetchConfig = async () => {
      const { data } = await supabase.from('school_settings').select('*').eq('id', 'main_config').single()
      if (data) setSystemLocked(data.term_locked || false)
    }
    fetchConfig()

    if (role === 'Enseignant' && userId) {
      const fetchTeacher = async () => {
        const { data } = await supabase.from('teachers').select('*').eq('official_id', userId).single()
        if (data) {
          setUserClasses(data.classes || [])
          setUserSubject(data.subject || "")
          setUserSubjectSecondaire(data.subject_secondaire || "")
          setActiveSubject(data.subject || "")
          setSelectedMatiere(data.subject || "Mathématiques")
        }
      }
      fetchTeacher()
    }
  }, [])

  const isDirector = userRole === "Directeur"

  useEffect(() => {
    if (!selectedClass || !mounted) return
    const fetchStudents = async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('status', 'Actif')
        .eq('academic_year', activeYear)
        .order('last_name', { ascending: true })
      setTeacherStudents(data || [])
    }
    fetchStudents()
  }, [selectedClass, activeYear, mounted])

  useEffect(() => {
    if (!activeYear) return
    const fetchGrades = async () => {
      const { data } = await supabase.from('grades').select('*').eq('academic_year', activeYear)
      setAllGrades(data || [])
    }
    fetchGrades()
  }, [activeYear])

  const registerData = useMemo(() => {
    if (!selectedClass || !allGrades || !isDirector) return { students: [] }
    
    const studentsInClass = teacherStudents || []
    const classGrades = allGrades.filter(g => g.class_id === selectedClass && g.subject === selectedMatiere && g.term === selectedTrimestre)

    const process = studentsInClass.map((s: any) => {
      const sGrades = classGrades.filter(g => g.student_matricule === s.matricule)
      const data: any = { ...s, i1: null, i2: null, i3: null, d1: null, d2: null, coef: 2 }
      
      sGrades.forEach((g: any) => {
        if (g.type === 'int1') data.i1 = g.value
        if (g.type === 'int2') data.i2 = g.value
        if (g.type === 'int3') data.i3 = g.value
        if (g.type === 'dev1') data.d1 = g.value
        if (g.type === 'dev2') data.d2 = g.value
        data.coef = g.coefficient || 2
      })

      const interros = [data.i1, data.i2, data.i3].filter(v => v !== null)
      const avgInt = interros.length > 0 ? interros.reduce((a:number,b:number) => a+b, 0) / interros.length : null
      const blocks = []
      if (avgInt !== null) blocks.push(avgInt)
      if (data.d1 !== null) blocks.push(data.d1)
      if (data.d2 !== null) blocks.push(data.d2)

      const subjectAvg = blocks.length > 0 ? blocks.reduce((a:number,b:number) => a+b, 0) / blocks.length : 0
      data.subjectAvg = subjectAvg
      data.weightedAvg = subjectAvg * data.coef
      return data
    })

    return { students: process }
  }, [selectedClass, selectedMatiere, selectedTrimestre, teacherStudents, allGrades, isDirector])

  useEffect(() => {
    const fetchCurrentGrades = async () => {
      if (!selectedClass || !userSubject || !mounted || isDirector) return
      setLoadingExisting(true)
      try {
        const { data } = await supabase
          .from('grades')
          .select('*')
          .eq('class_id', selectedClass)
          .eq('subject', activeSubject || userSubject)
          .eq('term', selectedTrimestre)
          .eq('academic_year', activeYear)

        const currentTypeGrades: Record<string, string> = {}
        const stats: Record<string, boolean> = {}
        
        ;(data || []).forEach((g: any) => {
          stats[g.type] = true
          if (g.type === selectedEvalType) currentTypeGrades[g.student_matricule] = g.value.toString()
        })
        setCompletionStats(stats)
        setGradesData(currentTypeGrades)
      } finally {
        setLoadingExisting(false)
      }
    }
    fetchCurrentGrades()
  }, [selectedClass, selectedTrimestre, selectedEvalType, userSubject, activeYear, mounted, isDirector])

  const handleGradeChange = (matricule: string, value: string) => {
    if (systemLocked && !isDirector) return
    const num = parseFloat(value)
    if (num > 20) return
    setGradesData(prev => ({ ...prev, [matricule]: value }))
  }

  const handleSaveGrades = async () => {
    if (systemLocked && !isDirector) {
      toast({ title: "Saisie impossible", description: "Le système est scellé par la direction.", variant: "destructive" })
      return
    }
    if (!selectedClass || !(activeSubject || userSubject) || saving) return
    setSaving(true)
    try {
      const rows = (teacherStudents || [])
        .filter((student: any) => {
          const valStr = gradesData[student.matricule]
          return valStr !== undefined && valStr !== ""
        })
        .map((student: any) => ({
          student_matricule: student.matricule,
          student_name: `${student.last_name} ${student.first_name}`,
          class_id: selectedClass,
          subject: activeSubject || userSubject,
          term: selectedTrimestre,
          type: selectedEvalType,
          value: parseFloat(gradesData[student.matricule]),
          coefficient: Number(classCoefficient) || 2,
          teacher_name: userName,
          academic_year: activeYear,
        }))

      if (rows.length > 0) {
        const { error } = await supabase.from('grades').upsert(rows, { onConflict: 'student_matricule,subject,term,type,academic_year' })
        if (error) throw error
      }
      toast({ title: "Registre scellé" })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null
  const classesToShow = isDirector ? OFFICIAL_CLASSES : userClasses

  if (isDirector && !selectedClass) {
    return (
      <DashboardLayout>
        <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">Registre <span className="text-primary italic">Global</span></h1>
              <p className="text-[9px] md:text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><ShieldCheck className="size-3.5 text-emerald-500" /> Vision Centrale • {activeYear}</p>
            </div>
            {systemLocked && (
              <Badge className="bg-destructive text-white h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl flex items-center gap-3 font-black text-sm shadow-xl shadow-destructive/20">
                 <Lock className="size-4 md:size-6" /> REGISTRES SCELLÉS
              </Badge>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
             <button onClick={() => setSelectedPromotion(null)} className={cn("px-6 h-10 md:h-12 rounded-full font-black text-[9px] md:text-xs uppercase transition-all border-2 shrink-0", !selectedPromotion ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-transparent hover:bg-muted")}>TOUT</button>
             {PROMOTIONS.map(p => (
               <button key={p} onClick={() => setSelectedPromotion(p)} className={cn("px-6 h-10 md:h-12 rounded-full font-black text-[9px] md:text-xs uppercase transition-all border-2 shrink-0", selectedPromotion === p ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-transparent hover:bg-muted")}>{p}</button>
             ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
             {OFFICIAL_CLASSES.filter(c => !selectedPromotion || c.startsWith(selectedPromotion)).map((classId) => (
               <Card key={classId} onClick={() => setSelectedClass(classId)} className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all cursor-pointer group active:scale-95 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform"><Layers className="size-20" /></div>
                  <h3 className="text-xl md:text-4xl font-black text-foreground group-hover:text-primary transition-colors relative z-10">{classId}</h3>
                  <p className="text-[9px] md:text-xs font-bold text-muted-foreground mt-4 uppercase tracking-widest relative z-10">Ouvrir le registre</p>
               </Card>
             ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isDirector && selectedClass) {
    const finalData = registerData.students
    return (
      <DashboardLayout>
        <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4 duration-500">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1">
                 <button onClick={() => setSelectedClass("")} className="flex items-center gap-2 text-muted-foreground hover:text-primary font-black text-[10px] md:text-sm uppercase tracking-widest mb-2 transition-all"><ChevronLeft className="size-4" /> Retour au registre</button>
                 <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">Registre <span className="text-primary italic">{selectedClass}</span></h1>
              </div>
              <div className="flex items-center gap-3">
                 {systemLocked && <Badge className="bg-destructive text-white px-5 h-12 rounded-xl font-black uppercase shadow-lg shadow-destructive/20"><Lock className="size-4 mr-2" /> Scellé</Badge>}
                 <Button variant="outline" className="h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl border-2 font-black bg-white"><Download className="mr-2 size-4" /> Export</Button>
              </div>
           </div>
           <Card className="p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col md:flex-row gap-4 md:gap-8 items-center border-l-[10px] border-primary">
              <div className="flex-1 w-full"><Label className="font-black text-[9px] uppercase text-muted-foreground px-2 mb-2 block">Matière</Label><Select value={selectedMatiere} onValueChange={setSelectedMatiere}><SelectTrigger className="h-11 md:h-14 rounded-xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-2 p-1 max-h-[300px]">{MATIERES.map(m => <SelectItem key={m} value={m} className="font-bold p-2.5 rounded-lg text-xs">{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="w-full md:w-64"><Label className="font-black text-[9px] uppercase text-muted-foreground px-2 mb-2 block">Trimestre</Label><Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}><SelectTrigger className="h-11 md:h-14 rounded-xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-2 p-1">{trimestres.map(t => <SelectItem key={t.id} value={t.id} className="font-bold p-2.5 rounded-lg text-xs">{t.label}</SelectItem>)}</SelectContent></Select></div>
           </Card>
           <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[4.5rem] overflow-hidden">
              <div className="overflow-x-auto no-scrollbar relative">
                 <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-muted/30 text-[8px] md:text-[10px] font-black uppercase text-muted-foreground sticky top-0 z-20">
                       <tr>
                          <th className="px-5 py-4 md:px-10 md:py-8 sticky left-0 z-30 bg-white border-b border-muted/30 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">ID & ÉLÈVE</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">INT 1</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">INT 2</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">INT 3</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">DEV 1</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">DEV 2</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30 bg-primary/5 text-primary">MOY/20</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/10">
                       {finalData.map((s: any) => (
                         <tr key={s.id} className="hover:bg-muted/5 transition-all group">
                            <td className="px-5 py-4 md:px-10 md:py-8 sticky left-0 z-10 bg-white group-hover:bg-[#F8FAFC] transition-colors border-r shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                               <div className="min-w-[150px] md:min-w-[220px]"><p className="font-black text-[10px] md:text-xl text-foreground uppercase truncate">{s.last_name} {s.first_name}</p><span className="text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase">{s.matricule}</span></div>
                            </td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.i1 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.i2 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.i3 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.d1 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.d2 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center"><Badge className={cn("h-8 md:h-12 w-14 md:w-20 justify-center rounded-lg md:rounded-xl font-black text-xs md:text-xl", s.subjectAvg >= 10 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{s.subjectAvg.toFixed(2)}</Badge></td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">Saisie <span className="text-primary italic">Notes</span></h1>
            <p className="text-[8px] md:text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><Clock className="size-3 md:size-4 text-amber-500" /> Mode Trimestriel • {activeYear}</p>
          </div>
          <div className="flex items-center gap-3">
             {systemLocked && (
               <Badge className="bg-destructive text-white h-12 md:h-16 px-6 rounded-xl md:rounded-2xl font-black shadow-xl shadow-destructive/20 flex items-center gap-3">
                  <Lock className="size-4 md:size-6" /> SYSTÈME SCELLÉ
               </Badge>
             )}
             <Button 
               onClick={handleSaveGrades} 
               disabled={saving || !selectedClass || systemLocked} 
               className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-xl h-12 md:h-16 px-8 md:px-12 rounded-xl md:rounded-2xl font-black text-xs md:text-lg transition-all active:scale-95"
             >
               {saving ? <Loader2 className="animate-spin size-4 md:size-5" /> : <ShieldCheck className="mr-2 size-4 md:size-5" />} 
               Sceller Évaluation
             </Button>
          </div>
        </div>

        <Card className="p-4 md:p-10 rounded-[1.8rem] md:rounded-[3rem] bg-white border-none shadow-sm border-l-[15px] border-primary">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              <div className="space-y-1.5"><label className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground px-1">Discipline</label>
                {userSubjectSecondaire ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {[userSubject, userSubjectSecondaire].map(sub => (
                        <button key={sub} onClick={() => { setActiveSubject(sub); setSelectedMatiere(sub) }}
                          className={`flex-1 px-3 py-2 rounded-xl font-black text-[8px] uppercase transition-all border-2 ${activeSubject === sub ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-muted"}`}>
                          {sub}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5"><span className="text-[7px] font-black text-primary">COEF:</span><Input type="number" value={classCoefficient} onChange={(e) => setClassCoefficient(e.target.value)} className="h-5 w-10 bg-white border-primary/20 text-center font-black text-[9px] rounded p-0 shadow-none focus-visible:ring-0" /></div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-muted/20 p-2 md:p-3 rounded-xl"><Calculator className="size-5 text-primary" /><div className="flex-1 min-w-0"><p className="font-black text-[9px] md:text-xs uppercase text-foreground truncate">{userSubject || "N/A"}</p><div className="flex items-center gap-1.5 mt-0.5"><span className="text-[7px] font-black text-primary">COEF:</span><Input type="number" value={classCoefficient} onChange={(e) => setClassCoefficient(e.target.value)} className="h-5 w-10 bg-white border-primary/20 text-center font-black text-[9px] rounded p-0 shadow-none focus-visible:ring-0" /></div></div></div>
                )}
              </div>
              <div className="space-y-1.5"><label className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground px-1">Classe</label><Select onValueChange={setSelectedClass} value={selectedClass}><SelectTrigger className="h-10 md:h-14 rounded-xl border-2 font-black text-xs md:text-base"><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent className="rounded-xl border-2 p-1">{classesToShow.map(c => <SelectItem key={c} value={c} className="font-bold p-2.5 rounded-lg text-xs">{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><label className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground px-1">Trimestre</label><Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}><SelectTrigger className="h-10 md:h-14 rounded-xl border-2 font-black text-xs md:text-base"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-2 p-1">{trimestres.map(t => <SelectItem key={t.id} value={t.id} className="font-bold p-2.5 rounded-lg text-xs">{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><label className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground px-1">Évaluation</label><Select value={selectedEvalType} onValueChange={setSelectedEvalType}><SelectTrigger className="h-10 md:h-14 rounded-xl border-2 font-black text-xs md:text-base"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-2 p-1">{evalTypes.map(t => (<SelectItem key={t.id} value={t.id} className="font-bold p-2.5 rounded-lg text-xs">{t.label} {completionStats[t.id] && "✓"}</SelectItem>))}</SelectContent></Select></div>
           </div>
        </Card>

        {selectedClass ? (
          <Card className={cn("border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3.5rem] overflow-hidden min-h-[400px] relative", systemLocked && "opacity-80")}>
            {systemLocked && (
              <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-6 p-10 text-center">
                 <div className="size-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive animate-pulse shadow-lg"><Lock className="size-10" /></div>
                 <div className="space-y-2">
                    <h3 className="text-xl md:text-3xl font-black uppercase">Saisie Verrouillée</h3>
                    <p className="text-[10px] md:text-lg font-medium text-muted-foreground max-w-md">La direction a scellé les registres pour ce trimestre. Aucune modification n'est autorisée.</p>
                 </div>
              </div>
            )}
            <div className="p-5 md:p-12 border-b bg-muted/5 flex items-center justify-between gap-4"><div className="flex items-center gap-3 md:gap-6"><div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0"><User className="size-5" /></div><div className="min-w-0"><h3 className="text-base md:text-2xl font-black text-foreground uppercase truncate">Registre {selectedClass}</h3><p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{evalTypes.find(e => e.id === selectedEvalType)?.label}</p></div></div>{loadingExisting && <div className="flex items-center gap-2 text-[9px] font-black text-primary animate-pulse uppercase tracking-widest"><RefreshCw className="size-3 animate-spin" /> Synchro...</div>}</div>
            <div className="overflow-x-auto no-scrollbar"><table className="w-full text-left border-separate border-spacing-0"><thead className="bg-muted/20 text-[8px] md:text-[10px] font-black uppercase text-muted-foreground border-b"><tr><th className="px-5 py-4 md:px-8 md:py-8 tracking-widest sticky left-0 z-10 bg-white">Élève</th><th className="px-5 py-4 md:px-8 md:py-8 text-center tracking-widest">Note / 20</th><th className="px-5 py-4 md:px-8 md:py-8 text-right bg-primary text-white tracking-widest">Note Saisie</th></tr></thead><tbody className="divide-y divide-muted/10">{teacherStudents?.map((student: any) => (<tr key={student.id} className="hover:bg-muted/5 transition-all group"><td className="px-5 py-4 md:px-8 md:py-8 sticky left-0 z-10 bg-white group-hover:bg-[#F8FAFC]"><div className="min-w-0"><p className="font-black text-xs md:text-xl text-foreground uppercase leading-tight truncate">{student.last_name} {student.first_name}</p><span className="font-bold text-[7px] md:text-[10px] text-muted-foreground uppercase">{student.matricule}</span></div></td><td className="px-5 py-4 md:px-8 md:py-8 text-center"><Input type="number" step="0.25" placeholder="--.--" value={gradesData[student.matricule] || ""} onChange={(e) => handleGradeChange(student.matricule, e.target.value)} disabled={systemLocked} className="w-20 md:w-32 h-10 md:h-14 mx-auto rounded-xl md:rounded-2xl text-center text-lg md:text-2xl font-black border-2 border-primary/10 focus:ring-primary shadow-inner bg-muted/10 group-hover:bg-white transition-all disabled:opacity-50" /></td><td className="px-5 py-4 md:px-8 md:py-8 text-right"><Badge className="h-8 md:h-12 w-20 md:w-32 justify-center rounded-lg md:rounded-xl bg-primary/5 text-primary border-2 border-primary/10 text-xs md:text-xl font-black">{Number(gradesData[student.matricule] || 0).toFixed(1)}</Badge></td></tr>))}</tbody></table></div>
          </Card>
        ) : (<Card className="p-16 md:p-40 text-center border-4 border-dashed rounded-[2rem] md:rounded-[4rem] bg-white/50 opacity-40 flex flex-col items-center justify-center space-y-6"><RefreshCw className="size-12 text-muted-foreground animate-spin opacity-20" /><div className="space-y-1"><h3 className="text-xl md:text-4xl font-black uppercase tracking-tight">Prêt pour la saisie ?</h3><p className="text-[10px] md:text-xl font-bold uppercase tracking-widest text-muted-foreground">Sélectionnez une classe autorisée</p></div></Card>)}
      </div>
    </DashboardLayout>
  )
}
