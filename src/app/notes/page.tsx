"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
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
  ChevronRight,
  TrendingUp,
  FileText
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
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, writeBatch, serverTimestamp, getDoc, getDocs, orderBy, setDoc } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { cn } from "@/lib/utils"

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

export default function GradesPage() {
  const db = useFirestore()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [userSubject, setUserSubject] = useState("")
  const [userName, setUserName] = useState("")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [mounted, setMounted] = useState(false)
  
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedTrimestre, setSelectedTrimestre] = useState("T1")
  const [selectedEvalType, setSelectedEvalType] = useState("int1")
  const [saving, setSaving] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [gradesData, setGradesData] = useState<Record<string, string>>({})
  const [completionStats, setCompletionStats] = useState<Record<string, boolean>>({})
  const [classCoefficient, setClassCoefficient] = useState<string>("2")

  useEffect(() => {
    setMounted(true)
    setUserRole(localStorage.getItem('acadex_user_role'))
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setUserSubject(localStorage.getItem('acadex_user_subject') || "")
    setUserName(localStorage.getItem('acadex_user_name') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass || !userSubject || !mounted) return
      
      setLoadingExisting(true)
      try {
        const configId = `${selectedClass}_${userSubject}`.replace(/\s/g, '_')
        let configSnap = await getDoc(doc(db, "subject_configs", configId))
        
        if (!configSnap.exists()) {
          const level = selectedClass.split(' ')[0]
          const levelConfigId = `${level}_${userSubject}`.replace(/\s/g, '_')
          configSnap = await getDoc(doc(db, "subject_configs", levelConfigId))
        }

        if (configSnap.exists()) {
          setClassCoefficient(configSnap.data().coef.toString())
        } else {
          setClassCoefficient("2")
        }

        const q = query(
          collection(db, "grades"),
          where("classId", "==", selectedClass),
          where("subject", "==", userSubject),
          where("term", "==", selectedTrimestre),
          where("academicYear", "==", activeYear)
        )
        const snap = await getDocs(q)
        const allGrades = snap.docs.map(d => d.data())
        
        const stats: Record<string, boolean> = {}
        evalTypes.forEach(type => {
          stats[type.id] = allGrades.some(g => g.type === type.id)
        })
        setCompletionStats(stats)

        const currentTypeGrades: Record<string, string> = {}
        allGrades.filter(g => g.type === selectedEvalType).forEach(g => {
          currentTypeGrades[g.studentId] = g.value.toString()
        })
        setGradesData(currentTypeGrades)
      } catch (e) {
        console.warn("Erreur synchro", e)
      } finally {
        setLoadingExisting(false)
      }
    }
    fetchData()
  }, [selectedClass, selectedTrimestre, selectedEvalType, userSubject, db, activeYear, mounted])

  const studentsQuery = useMemo(() => {
    if (!db || !selectedClass || !mounted) return null
    return query(
      collection(db, 'students'), 
      where("classId", "==", selectedClass),
      where("status", "==", "Actif"),
      where("academicYear", "==", activeYear),
      orderBy("lastName", "asc")
    )
  }, [db, selectedClass, activeYear, mounted])

  const { data: students } = useCollection(studentsQuery)

  const handleGradeChange = (matricule: string, value: string) => {
    const num = parseFloat(value)
    if (num > 20) return
    setGradesData(prev => ({ ...prev, [matricule]: value }))
  }

  const handleSaveGrades = async () => {
    if (!selectedClass || !selectedTrimestre || !selectedEvalType || !userSubject) {
      toast({ title: "Données manquantes", variant: "destructive" })
      return
    }
    setSaving(true)
    const batch = writeBatch(db)

    try {
      const configId = `${selectedClass}_${userSubject}`.replace(/\s/g, '_')
      const configRef = doc(db, "subject_configs", configId)
      batch.set(configRef, {
        level: selectedClass.split(' ')[0],
        classId: selectedClass,
        subject: userSubject,
        coef: Number(classCoefficient) || 2,
        updatedAt: serverTimestamp()
      }, { merge: true })

      students?.forEach((student: any) => {
        const valStr = gradesData[student.matricule]
        if (valStr === undefined || valStr === "") return 

        const val = parseFloat(valStr)
        const gradeId = `${student.matricule}_${userSubject}_${selectedTrimestre}_${selectedEvalType}_${activeYear}`.replace(/\s/g, '_')
        const gradeRef = doc(db, "grades", gradeId)
        
        batch.set(gradeRef, {
          studentId: student.matricule, 
          studentName: `${student.lastName} ${student.firstName}`,
          classId: selectedClass,
          subject: userSubject,
          term: selectedTrimestre,
          type: selectedEvalType,
          value: val,
          coefficient: Number(classCoefficient) || 2,
          teacherName: userName,
          academicYear: activeYear,
          updatedAt: serverTimestamp()
        }, { merge: true })
      })

      await batch.commit()
      toast({ title: "Registre scellé", description: `Les notes de ${selectedClass} sont à jour.` })
      setCompletionStats(prev => ({ ...prev, [selectedEvalType]: true }))
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'grades', operation: 'write' }))
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null
  const isDirector = userRole === "Directeur"
  const classesToShow = isDirector ? OFFICIAL_CLASSES : userClasses

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
              Saisie <span className="text-primary italic">Progressive</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[8px] md:text-sm">
              <Clock className="size-3 md:size-4 text-amber-500" />
              <span className="uppercase tracking-widest">Mode Trimestriel • {activeYear}</span>
            </div>
          </div>
          <Button 
            onClick={handleSaveGrades} 
            disabled={saving || !selectedClass || (students?.length || 0) === 0} 
            className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 md:h-16 px-8 md:px-12 rounded-xl md:rounded-2xl font-black text-xs md:text-lg transition-all active:scale-95"
          >
            {saving ? <Loader2 className="animate-spin size-4 md:size-5" /> : <ShieldCheck className="mr-2 size-4 md:size-5" />} 
            {saving ? "Scellage..." : "Sceller Évaluation"}
          </Button>
        </div>

        <Card className="p-4 md:p-10 rounded-[1.8rem] md:rounded-[3rem] bg-white border-none shadow-sm border-l-[6px] md:border-l-[15px] border-primary">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              <div className="space-y-1.5">
                 <label className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Matière & Coef</label>
                 <div className="flex items-center gap-3 bg-muted/20 p-2 md:p-3 rounded-xl">
                    <div className="size-8 md:size-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm shrink-0"><Calculator className="size-4 md:size-5" /></div>
                    <div className="flex-1 min-w-0">
                       <p className="font-black text-[9px] md:text-xs uppercase text-foreground truncate">{userSubject || "N/A"}</p>
                       <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[7px] font-black text-primary">COEF:</span>
                          <Input 
                            type="number" 
                            value={classCoefficient} 
                            onChange={(e) => setClassCoefficient(e.target.value)}
                            className="h-5 w-10 bg-white border-primary/20 text-center font-black text-[9px] rounded p-0"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Classe</label>
                 <Select onValueChange={setSelectedClass} value={selectedClass}>
                    <SelectTrigger className="h-10 md:h-14 rounded-xl border-2 font-black text-xs md:text-base"><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1">
                      {classesToShow.map(c => <SelectItem key={c} value={c} className="font-bold p-2.5 rounded-lg text-xs">{c}</SelectItem>)}
                    </SelectContent>
                 </Select>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Trimestre</label>
                 <Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}>
                    <SelectTrigger className="h-10 md:h-14 rounded-xl border-2 font-black text-xs md:text-base"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1">
                      {trimestres.map(t => <SelectItem key={t.id} value={t.id} className="font-bold p-2.5 rounded-lg text-xs">{t.label}</SelectItem>)}
                    </SelectContent>
                 </Select>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Évaluation</label>
                 <Select value={selectedEvalType} onValueChange={setSelectedEvalType}>
                    <SelectTrigger className="h-10 md:h-14 rounded-xl border-2 font-black text-xs md:text-base"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1">
                      {evalTypes.map(t => (
                        <SelectItem key={t.id} value={t.id} className="font-bold p-2.5 rounded-lg text-xs flex items-center justify-between">
                          {t.label} {completionStats[t.id] && "✓"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
              </div>
           </div>
        </Card>

        {selectedClass ? (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
               {evalTypes.map(t => (
                 <div key={t.id} className={cn(
                   "min-w-[100px] p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all shrink-0",
                   completionStats[t.id] ? "bg-emerald-50 border-emerald-100" : "bg-muted/10 border-transparent opacity-40",
                   selectedEvalType === t.id && "border-primary ring-2 ring-primary/10 opacity-100 scale-105"
                 )}>
                    <span className="text-[7px] font-black uppercase truncate">{t.label}</span>
                    {completionStats[t.id] ? <CheckCircle2 className="size-2.5 text-emerald-600" /> : <Clock className="size-2.5 text-muted-foreground" />}
                 </div>
               ))}
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3.5rem] overflow-hidden min-h-[400px]">
              <div className="p-5 md:p-12 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-6">
                   <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
                      <User className="size-5" />
                   </div>
                   <div className="min-w-0">
                     <h3 className="text-base md:text-2xl font-black text-foreground uppercase tracking-tight truncate">Registre {selectedClass}</h3>
                     <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{evalTypes.find(e => e.id === selectedEvalType)?.label}</p>
                   </div>
                </div>
                {loadingExisting && <div className="flex items-center gap-2 text-[9px] font-black text-primary animate-pulse uppercase tracking-widest"><RefreshCw className="size-3 animate-spin" /> Synchro...</div>}
              </div>
              
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="bg-muted/20 text-[8px] md:text-[10px] font-black uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="px-5 py-4 md:px-8 md:py-8 tracking-widest">Élève</th>
                      <th className="px-5 py-4 md:px-8 md:py-8 text-center tracking-widest">Note / 20</th>
                      <th className="px-5 py-4 md:px-8 md:py-8 text-right bg-primary text-white tracking-widest">Moyenne Prov.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {students?.map((student: any) => (
                      <tr key={student.id} className="hover:bg-muted/5 transition-all group">
                        <td className="px-5 py-4 md:px-8 md:py-8">
                           <div className="min-w-0">
                              <p className="font-black text-xs md:text-xl text-foreground uppercase leading-tight truncate">{student.lastName} {student.firstName}</p>
                              <span className="font-bold text-[7px] md:text-[10px] text-muted-foreground uppercase">{student.matricule}</span>
                           </div>
                        </td>
                        <td className="px-5 py-4 md:px-8 md:py-8 text-center">
                          <Input 
                            type="number" 
                            step="0.25" 
                            placeholder="--.--"
                            value={gradesData[student.matricule] || ""} 
                            onChange={(e) => handleGradeChange(student.matricule, e.target.value)} 
                            className="w-20 md:w-32 h-10 md:h-14 mx-auto rounded-xl md:rounded-2xl text-center text-lg md:text-2xl font-black border-2 border-primary/10 focus:ring-primary shadow-inner bg-muted/10 group-hover:bg-white transition-all" 
                          />
                        </td>
                        <td className="px-5 py-4 md:px-8 md:py-8 text-right">
                           <Badge className="h-8 md:h-12 w-20 md:w-32 justify-center rounded-lg md:rounded-xl bg-primary/5 text-primary border-2 border-primary/10 text-xs md:text-xl font-black">
                              {Number(gradesData[student.matricule] || 0).toFixed(1)}
                           </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
           <Card className="p-16 md:p-40 text-center border-4 border-dashed rounded-[2rem] md:rounded-[4rem] bg-white/50 opacity-40 flex flex-col items-center justify-center space-y-6">
              <div className="size-16 md:size-32 bg-muted rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center shadow-inner">
                <RefreshCw className="size-8 md:size-16 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl md:text-4xl font-black uppercase tracking-tight">Prêt pour la saisie ?</h3>
                <p className="text-[10px] md:text-xl font-bold uppercase tracking-widest text-muted-foreground">Sélectionnez une classe autorisée</p>
              </div>
           </Card>
        )}
      </div>
    </DashboardLayout>
  )
}