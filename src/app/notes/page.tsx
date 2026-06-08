"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Loader2, Zap, ShieldCheck, Calculator, Lock, UserCheck, RefreshCw, Info, ArrowRight } from "lucide-react"
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
import { collection, query, where, doc, writeBatch, serverTimestamp, getDoc, getDocs } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import Link from "next/link"

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

export default function GradesPage() {
  const db = useFirestore()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [userSubject, setUserSubject] = useState("")
  const [userName, setUserName] = useState("")
  const [activeYear, setActiveYear] = useState("2026-2027")
  
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedTrimestre, setSelectedTrimestre] = useState("T1")
  const [selectedEvalType, setSelectedEvalType] = useState("int1")
  const [saving, setSaving] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [gradesData, setGradesData] = useState<Record<string, string>>({})
  const [classCoefficient, setClassCoefficient] = useState<number>(1)

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role'))
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setUserSubject(localStorage.getItem('acadex_user_subject') || "")
    setUserName(localStorage.getItem('acadex_user_name') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass || !userSubject) return
      
      setLoadingExisting(true)
      try {
        const configId = `${selectedClass}_${userSubject}`.replace(/\s/g, '_')
        const configSnap = await getDoc(doc(db, "subject_configs", configId))
        if (configSnap.exists()) {
          setClassCoefficient(Number(configSnap.data().coef) || 1)
        }

        const q = query(
          collection(db, "grades"),
          where("classId", "==", selectedClass),
          where("subject", "==", userSubject),
          where("term", "==", selectedTrimestre),
          where("type", "==", selectedEvalType),
          where("academicYear", "==", activeYear)
        )
        const notesSnap = await getDocs(q)
        const existing: Record<string, string> = {}
        notesSnap.docs.forEach(d => {
          const data = d.data()
          existing[data.studentId] = data.value.toString()
        })
        setGradesData(existing)
      } catch (e) {
        console.warn("Erreur synchro", e)
      } finally {
        setLoadingExisting(false)
      }
    }
    fetchData()
  }, [selectedClass, selectedTrimestre, selectedEvalType, userSubject, db, activeYear])

  const studentsQuery = useMemo(() => {
    if (!db || !selectedClass) return null
    return query(
      collection(db, 'students'), 
      where("classId", "==", selectedClass),
      where("status", "==", "Actif"),
      where("academicYear", "==", activeYear)
    )
  }, [db, selectedClass, activeYear])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const handleGradeChange = (matricule: string, value: string) => {
    const num = parseFloat(value)
    if (num > 20) return
    setGradesData(prev => ({ ...prev, [matricule]: value }))
  }

  const handleSaveGrades = async () => {
    if (!selectedClass || !selectedTrimestre || !selectedEvalType) return
    setSaving(true)
    const batch = writeBatch(db)

    try {
      students?.forEach((student: any) => {
        const val = parseFloat(gradesData[student.matricule] || "0")
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
          coefficient: Number(classCoefficient) || 1,
          teacherName: userName,
          academicYear: activeYear,
          updatedAt: serverTimestamp()
        }, { merge: true })
      })

      await batch.commit()
      toast({ title: "Notes scellées !", description: `Registre ${selectedClass} publié.` })
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'grades', operation: 'write' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Saisie <span className="text-primary italic">Notes</span></h1>
            <div className="text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> <span className="text-xs md:text-sm">Année Scolaire <b>{activeYear}</b></span>
            </div>
          </div>
          <Button onClick={handleSaveGrades} disabled={saving || !selectedClass || students?.length === 0} className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-2xl h-14 md:h-16 px-8 rounded-2xl font-black text-base md:text-lg transition-all active:scale-95">
            {saving ? <Loader2 className="mr-2 size-5 animate-spin" /> : <UserCheck className="mr-2 size-5" />} 
            {saving ? "Scellage..." : "Sceller & Publier"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-9 space-y-6 md:space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 border-l-[8px] md:border-l-[12px] border-primary">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground px-1">Classe</label>
                  <Select onValueChange={setSelectedClass} value={selectedClass}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-black"><SelectValue placeholder="Classe" /></SelectTrigger>
                    <SelectContent>{userClasses.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground px-1">Trimestre</label>
                  <Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-black"><SelectValue /></SelectTrigger>
                    <SelectContent>{trimestres.map(t => <SelectItem key={t.id} value={t.id} className="font-bold">{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground px-1">Évaluation</label>
                  <Select value={selectedEvalType} onValueChange={setSelectedEvalType}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-black"><SelectValue /></SelectTrigger>
                    <SelectContent>{evalTypes.map(t => <SelectItem key={t.id} value={t.id} className="font-bold">{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground px-1">Coef</label>
                  <Input type="number" min="1" max="10" value={classCoefficient} onChange={(e) => setClassCoefficient(Number(e.target.value))} className="h-12 rounded-xl border-2 font-black text-center text-lg" />
                </div>
              </div>
            </Card>

            {selectedClass && (
              <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden">
                <div className="p-6 md:p-10 border-b bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                     <h3 className="text-lg md:text-xl font-black">Promotion {selectedClass}</h3>
                     <Badge className="bg-primary text-white font-black px-3 py-0.5 uppercase text-[9px] md:text-[10px]">{userSubject}</Badge>
                  </div>
                  {loadingExisting && <div className="flex items-center gap-2 text-[10px] font-black text-primary animate-pulse"><RefreshCw className="size-3 animate-spin" /> Synchro en cours...</div>}
                </div>
                
                {/* Mobile: View List as Cards | Desktop: View List as Table */}
                <div className="block md:hidden p-4 space-y-4">
                   {loadingStudents ? (
                     <div className="p-10 text-center animate-pulse"><Loader2 className="size-8 animate-spin mx-auto text-primary" /></div>
                   ) : students?.map((student: any) => {
                     const impact = (parseFloat(gradesData[student.matricule] || "0") * classCoefficient).toFixed(2)
                     return (
                        <div key={student.id} className="p-5 bg-muted/30 rounded-[1.5rem] border border-muted/50 flex flex-col gap-4">
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="font-black text-sm uppercase">{student.lastName} {student.firstName}</p>
                                 <p className="text-[9px] font-bold text-muted-foreground">{student.matricule}</p>
                              </div>
                              <Badge className="bg-primary/10 text-primary font-black text-xs border-primary/20">Impact: {impact}</Badge>
                           </div>
                           <div className="relative">
                              <Input 
                                type="number" 
                                step="0.25" 
                                placeholder="0.00" 
                                value={gradesData[student.matricule] || ""} 
                                onChange={(e) => handleGradeChange(student.matricule, e.target.value)} 
                                className="h-14 rounded-xl text-center text-2xl font-black border-2 bg-white" 
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase">Note/20</span>
                           </div>
                        </div>
                     )
                   })}
                </div>

                <CardContent className="hidden md:block p-0">
                  {loadingStudents ? (
                    <div className="p-20 text-center animate-pulse font-bold text-muted-foreground">Appel de la classe...</div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground border-b">
                        <tr>
                          <th className="px-10 py-6 text-left">Élève</th>
                          <th className="px-10 py-6 text-center">Note / 20</th>
                          <th className="px-10 py-6 text-right bg-primary text-white">Impact Coefficié</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/30">
                        {students?.map((student: any) => {
                          const val = parseFloat(gradesData[student.matricule] || "0")
                          const impact = (val * (Number(classCoefficient) || 1)).toFixed(2)
                          return (
                            <tr key={student.id} className="hover:bg-muted/5 transition-colors group">
                              <td className="px-10 py-6 font-black text-lg text-foreground uppercase">{student.lastName} {student.firstName}</td>
                              <td className="px-10 py-6 text-center">
                                <Input 
                                  type="number" 
                                  step="0.25" 
                                  value={gradesData[student.matricule] || ""} 
                                  onChange={(e) => handleGradeChange(student.matricule, e.target.value)} 
                                  className="w-32 h-14 mx-auto rounded-2xl text-center text-2xl font-black border-2 focus:ring-primary shadow-inner" 
                                />
                              </td>
                              <td className="px-10 py-6 text-right">
                                 <Badge className="h-12 w-32 justify-center rounded-2xl bg-primary/10 text-primary border-2 border-primary/20 text-xl font-black">
                                   {impact}
                                 </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 md:p-8 rounded-[2rem] bg-amber-50 border-2 border-amber-100 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-amber-700">
                <Info className="size-5" />
                <h4 className="font-black text-xs md:text-sm uppercase">Note de Conduite</h4>
              </div>
              <p className="text-[10px] md:text-xs font-medium leading-relaxed text-amber-800">
                La note de <b>Conduite</b> est gérée dans le module <b>Vie Scolaire</b>. Elle impacte automatiquement la moyenne.
              </p>
              <Button asChild variant="outline" className="w-full rounded-xl border-amber-200 text-amber-700 font-bold text-[10px] md:text-xs bg-white mobile-touch-target">
                <Link href="/vie-scolaire">Gérer discipline <ArrowRight className="ml-2 size-3" /></Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}