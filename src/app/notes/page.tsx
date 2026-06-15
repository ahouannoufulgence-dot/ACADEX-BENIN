
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
  FileText,
  Search,
  Plus,
  ChevronLeft,
  Star,
  Users,
  Award,
  Zap,
  Filter,
  ArrowUpRight,
  TrendingDown,
  Download,
  Layers
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

const MATIERES = [
  "Mathématiques", "Français", "Anglais", "PCT", "SVT", "Histoire-Géo", "Philosophie", "Allemand", "Espagnol", "Économie", "Informatique", "EPS"
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
  const [selectedPromotion, setSelectedPromotion] = useState<string | null>(null)
  const [selectedMatiere, setSelectedMatiere] = useState<string>("Mathématiques")
  
  const [saving, setSaving] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [gradesData, setGradesData] = useState<Record<string, string>>({})
  const [completionStats, setCompletionStats] = useState<Record<string, boolean>>({})
  const [classCoefficient, setClassCoefficient] = useState<string>("2")

  useEffect(() => {
    setMounted(true)
    const role = localStorage.getItem('acadex_user_role')
    setUserRole(role)
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setUserSubject(localStorage.getItem('acadex_user_subject') || "")
    setUserName(localStorage.getItem('acadex_user_name') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    
    if (role === 'Enseignant' && localStorage.getItem('acadex_user_subject')) {
      setSelectedMatiere(localStorage.getItem('acadex_user_subject')!)
    }
  }, [])

  const isDirector = userRole === "Directeur"

  const allStudentsQuery = useMemo(() => {
    if (!db || !isDirector || !activeYear) return null
    return query(collection(db, "students"), where("academicYear", "==", activeYear), where("status", "==", "Actif"))
  }, [db, isDirector, activeYear])

  const allGradesQuery = useMemo(() => {
    if (!db || !isDirector || !activeYear) return null
    return query(collection(db, "grades"), where("academicYear", "==", activeYear))
  }, [db, isDirector, activeYear])

  const { data: allStudents } = useCollection(allStudentsQuery)
  const { data: allGrades } = useCollection(allGradesQuery)

  const classCardsData = useMemo(() => {
    if (!isDirector || !allStudents) return []
    
    let filteredClasses = OFFICIAL_CLASSES
    if (selectedPromotion) {
      filteredClasses = OFFICIAL_CLASSES.filter(c => c.startsWith(selectedPromotion))
    }

    return filteredClasses.map(classId => {
      const classStudents = allStudents.filter((s: any) => s.classId === classId)
      const classGrades = allGrades?.filter((g: any) => g.classId === classId) || []
      
      const distinctSubjects = new Set(classGrades.map((g: any) => g.subject)).size
      const totalGrades = classGrades.length
      const expectedGrades = classStudents.length * 5 * 10 
      const completion = Math.min(100, Math.round((totalGrades / Math.max(1, expectedGrades)) * 100))

      const studentAvgs = classStudents.map((s: any) => {
        const sGrades = classGrades.filter((g: any) => g.studentId === s.matricule)
        const subjects: Record<string, any> = {}
        sGrades.forEach((g: any) => {
          if (!subjects[g.subject]) subjects[g.subject] = { ints: [], devs: [], coef: Number(g.coefficient) || 2 }
          if (g.type.startsWith('int')) subjects[g.subject].ints.push(Number(g.value))
          if (g.type.startsWith('dev')) subjects[g.subject].devs.push(Number(g.value))
        })
        let totalW = 0, totalC = 0
        Object.values(subjects).forEach((sub: any) => {
          const avgInt = sub.ints.length > 0 ? sub.ints.reduce((a:number, b:number) => a+b, 0) / sub.ints.length : null
          const blocks = []
          if (avgInt !== null) blocks.push(avgInt)
          sub.devs.forEach((d: number) => blocks.push(d))
          if (blocks.length > 0) {
            totalW += (blocks.reduce((a, b) => a + b, 0) / blocks.length) * sub.coef
            totalC += sub.coef
          }
        })
        return totalC > 0 ? totalW / totalC : 0
      }).filter(v => v > 0)

      const classAvg = studentAvgs.length > 0 
        ? (studentAvgs.reduce((a, b) => a + b, 0) / studentAvgs.length).toFixed(2)
        : "0.00"

      return {
        id: classId,
        studentCount: classStudents.length,
        avg: classAvg,
        completion,
        subjectsCount: distinctSubjects
      }
    })
  }, [allStudents, allGrades, isDirector, selectedPromotion])

  const registerData = useMemo(() => {
    if (!selectedClass || !allStudents) return { students: [], stats: null }
    
    const classStudents = allStudents.filter((s: any) => s.classId === selectedClass)
    const classGrades = allGrades?.filter((g: any) => g.classId === selectedClass && g.subject === selectedMatiere && g.term === selectedTrimestre) || []

    const processedStudents = classStudents.map((s: any) => {
      const sGrades = classGrades.filter((g: any) => g.studentId === s.matricule)
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
      const avgInt = interros.length > 0 ? interros.reduce((a,b) => a+b, 0) / interros.length : null
      
      const blocks = []
      if (avgInt !== null) blocks.push(avgInt)
      if (data.d1 !== null) blocks.push(data.d1)
      if (data.d2 !== null) blocks.push(data.d2)

      const subjectAvg = blocks.length > 0 ? blocks.reduce((a,b) => a+b, 0) / blocks.length : 0
      data.subjectAvg = subjectAvg
      data.weightedAvg = subjectAvg * data.coef
      data.isProvisional = blocks.length < 3

      return data
    }).sort((a, b) => a.lastName.localeCompare(b.lastName))

    const validAvgs = processedStudents.map(s => s.subjectAvg).filter(v => v > 0)
    const classAvg = validAvgs.length > 0 ? (validAvgs.reduce((a,b) => a+b, 0) / validAvgs.length).toFixed(2) : "0.00"
    const successCount = validAvgs.filter(v => v >= 10).length
    const failCount = validAvgs.length - successCount
    const successRate = validAvgs.length > 0 ? Math.round((successCount / validAvgs.length) * 100) : 0
    const major = validAvgs.length > 0 ? Math.max(...validAvgs).toFixed(2) : "0.00"
    const minor = validAvgs.length > 0 ? Math.min(...validAvgs).toFixed(2) : "0.00"

    return { 
      students: processedStudents, 
      stats: { classAvg, successCount, failCount, successRate, major, minor, completion: successRate } 
    }
  }, [selectedClass, selectedMatiere, selectedTrimestre, allStudents, allGrades])

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass || !userSubject || !mounted || isDirector) return
      
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
  }, [selectedClass, selectedTrimestre, selectedEvalType, userSubject, db, activeYear, mounted, isDirector])

  const teacherStudentsQuery = useMemo(() => {
    if (!db || !selectedClass || !mounted || isDirector) return null
    return query(
      collection(db, 'students'), 
      where("classId", "==", selectedClass),
      where("status", "==", "Actif"),
      where("academicYear", "==", activeYear),
      orderBy("lastName", "asc")
    )
  }, [db, selectedClass, activeYear, mounted, isDirector])

  const { data: teacherStudents } = useCollection(teacherStudentsQuery)

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

      teacherStudents?.forEach((student: any) => {
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
  const classesToShow = isDirector ? OFFICIAL_CLASSES : userClasses

  if (isDirector && !selectedClass) {
    return (
      <DashboardLayout>
        <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
                Registre <span className="text-primary italic">Global</span>
              </h1>
              <p className="text-[9px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck className="size-3.5 md:size-4 text-emerald-500" /> Vision Centrale • {activeYear}
              </p>
            </div>
            <div className="flex gap-2">
               <Badge className="bg-primary/5 text-primary border-none font-black h-11 md:h-14 px-5 rounded-xl md:rounded-2xl hidden sm:flex items-center">
                 {classCardsData.length} CLASSES SCELLÉES
               </Badge>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
             <button 
               onClick={() => setSelectedPromotion(null)}
               className={cn(
                 "px-6 h-10 md:h-12 rounded-full font-black text-[9px] md:text-xs uppercase transition-all border-2",
                 !selectedPromotion ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-transparent hover:bg-muted"
               )}
             >
               TOUT
             </button>
             {PROMOTIONS.map(p => (
               <button 
                 key={p}
                 onClick={() => setSelectedPromotion(p)}
                 className={cn(
                   "px-6 h-10 md:h-12 rounded-full font-black text-[9px] md:text-xs uppercase transition-all border-2 whitespace-nowrap",
                   selectedPromotion === p ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-transparent hover:bg-muted"
                 )}
               >
                 {p}
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
             {classCardsData.map((c) => (
               <Card 
                 key={c.id} 
                 onClick={() => setSelectedClass(c.id)}
                 className="p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden active:scale-95"
               >
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <Layers className="size-20 md:size-24" />
                  </div>
                  <div className="flex items-center justify-between mb-6 relative z-10">
                     <h3 className="text-xl md:text-3xl font-black text-foreground group-hover:text-primary transition-colors">{c.id}</h3>
                     <Badge className={cn("font-black text-[8px] md:text-xs", Number(c.avg) >= 10 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                       {c.avg}/20
                     </Badge>
                  </div>
                  <div className="space-y-4 relative z-10">
                     <div className="flex justify-between items-center text-[9px] md:text-xs font-bold text-muted-foreground uppercase">
                        <span className="flex items-center gap-1.5"><Users className="size-3" /> {c.studentCount} Élèves</span>
                        <span className="flex items-center gap-1.5"><Zap className="size-3 text-amber-500" /> {c.subjectsCount} Matières</span>
                     </div>
                     <div className="space-y-1.5">
                        <div className="flex justify-between text-[7px] font-black uppercase text-muted-foreground">
                           <span>Progression Saisie</span>
                           <span>{c.completion}%</span>
                        </div>
                        <div className="w-full bg-muted/30 h-1.5 rounded-full overflow-hidden">
                           <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${c.completion}%` }} />
                        </div>
                     </div>
                  </div>
               </Card>
             ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isDirector && selectedClass) {
    return (
      <DashboardLayout>
        <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4 duration-500">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
              <div className="space-y-1">
                 <button onClick={() => setSelectedClass("")} className="flex items-center gap-2 text-muted-foreground hover:text-primary font-black text-[10px] md:text-sm uppercase tracking-widest mb-2 transition-all">
                    <ChevronLeft className="size-4" /> Retour au registre
                 </button>
                 <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">Registre <span className="text-primary italic">{selectedClass}</span></h1>
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" className="flex-1 md:flex-none h-11 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl border-2 font-black bg-white text-[10px] md:text-sm">
                    <Download className="mr-2 size-4" /> Export Excel
                 </Button>
                 <Badge className="bg-foreground text-white border-none font-black h-11 md:h-14 px-6 rounded-xl md:rounded-2xl flex items-center text-[10px] md:text-sm shadow-xl">
                   ANALYSE SCELLÉE
                 </Badge>
              </div>
           </div>

           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {[
                { label: "Moyenne Classe", val: registerData.stats?.classAvg, icon: TrendingUp, color: "text-primary", bg: "bg-emerald-50" },
                { label: "Major", val: registerData.stats?.major, icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Taux Réussite", val: registerData.stats?.successRate + "%", icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Difficulté", val: registerData.stats?.failCount, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
              ].map((s, i) => (
                <Card key={i} className="p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-none shadow-sm bg-white flex flex-col justify-between h-24 md:h-40">
                   <div className={cn("p-2 rounded-lg w-fit", s.bg, s.color)}><s.icon className="size-4 md:size-6" /></div>
                   <div>
                      <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
                      <h4 className="text-sm md:text-2xl font-black tabular-nums">{s.val}</h4>
                   </div>
                </Card>
              ))}
           </div>

           <Card className="p-4 md:p-8 rounded-2xl md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col md:flex-row gap-4 md:gap-8 items-center border-l-[10px] border-primary">
              <div className="w-full md:w-auto flex-1">
                 <Label className="font-black text-[9px] uppercase text-muted-foreground px-2 mb-2 block">Matière</Label>
                 <Select value={selectedMatiere} onValueChange={setSelectedMatiere}>
                    <SelectTrigger className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1 max-h-[300px]">
                       {MATIERES.map(m => <SelectItem key={m} value={m} className="font-bold p-2.5 rounded-lg text-xs">{m}</SelectItem>)}
                    </SelectContent>
                 </Select>
              </div>
              <div className="w-full md:w-64">
                 <Label className="font-black text-[9px] uppercase text-muted-foreground px-2 mb-2 block">Trimestre</Label>
                 <Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}>
                    <SelectTrigger className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1">
                       {trimestres.map(t => <SelectItem key={t.id} value={t.id} className="font-bold p-2.5 rounded-lg text-xs">{t.label}</SelectItem>)}
                    </SelectContent>
                 </Select>
              </div>
           </Card>

           <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[4.5rem] overflow-hidden">
              <div className="overflow-x-auto no-scrollbar relative">
                 <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-muted/30 text-[8px] md:text-[10px] font-black uppercase text-muted-foreground sticky top-0 z-20">
                       <tr>
                          <th className="px-5 py-4 md:px-10 md:py-8 sticky left-0 z-30 bg-white border-b border-muted/30">ID & ÉLÈVE</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">SEXE</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">INT 1</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">INT 2</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">INT 3</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">DEV 1</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30">DEV 2</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-center border-b border-muted/30 bg-primary/5 text-primary">MOY/20</th>
                          <th className="px-5 py-4 md:px-10 md:py-8 text-right border-b border-muted/30 bg-primary text-white">COEF x {registerData.students[0]?.coef || 2}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/10">
                       {registerData.students.map((s: any) => (
                         <tr key={s.id} className="hover:bg-muted/5 transition-all group">
                            <td className="px-5 py-4 md:px-10 md:py-8 sticky left-0 z-10 bg-white group-hover:bg-[#F8FAFC] transition-colors border-r shadow-sm">
                               <div className="min-w-[150px] md:min-w-[220px]">
                                  <p className="font-black text-[10px] md:text-xl text-foreground uppercase truncate tracking-tight">{s.lastName} {s.firstName}</p>
                                  <span className="text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase">{s.matricule}</span>
                               </div>
                            </td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-bold text-muted-foreground/60">{s.gender === 'Masculin' ? 'M' : 'F'}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.i1 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.i2 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.i3 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.d1 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center font-black tabular-nums">{s.d2 ?? "--"}</td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-center">
                               <Badge className={cn("h-8 md:h-12 w-14 md:w-20 justify-center rounded-lg md:rounded-xl font-black text-xs md:text-xl", s.subjectAvg >= 10 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                                 {s.subjectAvg.toFixed(2)}
                               </Badge>
                            </td>
                            <td className="px-5 py-4 md:px-10 md:py-8 text-right">
                               <span className="font-black text-xs md:text-2xl text-primary tabular-nums">{s.weightedAvg.toFixed(2)}</span>
                            </td>
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
            disabled={saving || !selectedClass || (teacherStudents?.length || 0) === 0} 
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
                            className="h-5 w-10 bg-white border-primary/20 text-center font-black text-[9px] rounded p-0 shadow-none focus-visible:ring-0"
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
                      <th className="px-5 py-4 md:px-8 md:py-8 tracking-widest sticky left-0 z-10 bg-white">Élève</th>
                      <th className="px-5 py-4 md:px-8 md:py-8 text-center tracking-widest">Note / 20</th>
                      <th className="px-5 py-4 md:px-8 md:py-8 text-right bg-primary text-white tracking-widest">Note Saisie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {teacherStudents?.map((student: any) => (
                      <tr key={student.id} className="hover:bg-muted/5 transition-all group">
                        <td className="px-5 py-4 md:px-8 md:py-8 sticky left-0 z-10 bg-white group-hover:bg-[#F8FAFC]">
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
