
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Loader2, Zap, ShieldCheck, Calculator, Lock, UserCheck, RefreshCw } from "lucide-react"
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
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, orderBy, where, doc, writeBatch, serverTimestamp, getDoc, getDocs } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

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
  
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedTrimestre, setSelectedTrimestre] = useState("T1")
  const [selectedEvalType, setSelectedEvalType] = useState("int1")
  const [saving, setSaving] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [gradesData, setGradesData] = useState<Record<string, string>>({})
  const [classCoefficient, setClassCoefficient] = useState<number>(1)

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role')
    const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")
    const subject = localStorage.getItem('acadex_user_subject') || ""
    const name = localStorage.getItem('acadex_user_name') || ""
    
    setUserRole(role)
    setUserClasses(classes)
    setUserSubject(subject)
    setUserName(name)
  }, [])

  // RÉCUPÉRATION SPONTANNÉE : Coef + Notes existantes dès changement de filtres
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass || !userSubject) return
      
      setLoadingExisting(true)
      try {
        // 1. Charger le Coef
        const configId = `${selectedClass}_${userSubject}`.replace(/\s/g, '_')
        const configSnap = await getDoc(doc(db, "subject_configs", configId))
        if (configSnap.exists()) {
          setClassCoefficient(Number(configSnap.data().coef) || 1)
        }

        // 2. Charger les notes existantes pour ce créneau
        const q = query(
          collection(db, "grades"),
          where("classId", "==", selectedClass),
          where("subject", "==", userSubject),
          where("term", "==", selectedTrimestre),
          where("type", "==", selectedEvalType)
        )
        const notesSnap = await getDocs(q)
        const existing: Record<string, string> = {}
        notesSnap.docs.forEach(d => {
          const data = d.data()
          // On lie par matricule pour retrouver l'input de l'élève
          existing[data.studentId] = data.value.toString()
        })
        setGradesData(existing)
      } catch (e) {
        console.warn("Erreur de pré-chargement", e)
      } finally {
        setLoadingExisting(false)
      }
    }
    fetchData()
  }, [selectedClass, selectedTrimestre, selectedEvalType, userSubject, db])

  // Filtrage STRICT des élèves ACTIFS pour cette classe
  const studentsQuery = useMemo(() => {
    if (!db || !selectedClass) return null
    return query(
      collection(db, 'students'), 
      where("classId", "==", selectedClass),
      where("status", "==", "Actif")
    )
  }, [db, selectedClass])

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
      // 1. Sauvegarder le coefficient
      const configId = `${selectedClass}_${userSubject}`.replace(/\s/g, '_')
      const configRef = doc(db, "subject_configs", configId)
      batch.set(configRef, { 
        level: selectedClass, 
        subject: userSubject, 
        coef: Number(classCoefficient) || 1 
      }, { merge: true })

      // 2. Sauvegarder les notes (Liaison par MATRICULE)
      students?.forEach((student: any) => {
        const val = parseFloat(gradesData[student.matricule] || "0")
        const gradeId = `${student.matricule}_${userSubject}_${selectedTrimestre}_${selectedEvalType}`.replace(/\s/g, '_')
        const gradeRef = doc(db, "grades", gradeId)
        
        batch.set(gradeRef, {
          studentId: student.matricule, // Pivot de liaison Cockpit Élève
          studentName: `${student.lastName} ${student.firstName}`,
          classId: selectedClass,
          subject: userSubject,
          term: selectedTrimestre,
          type: selectedEvalType,
          value: val,
          coefficient: Number(classCoefficient) || 1,
          teacherName: userName,
          updatedAt: serverTimestamp()
        }, { merge: true })
      })

      await batch.commit()
      toast({ title: "Notes scellées !", description: "Mise à jour instantanée des carnets élèves." })
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'grades', operation: 'write' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Saisie <span className="text-primary italic">Spontanée</span></h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Vos notes sont liées au matricule élève en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-3">
             {loadingExisting && <div className="flex items-center gap-2 text-xs font-black text-primary animate-pulse uppercase"><RefreshCw className="size-3 animate-spin" /> Synchro...</div>}
             <Button onClick={handleSaveGrades} disabled={saving || !selectedClass || students?.length === 0} className="bg-primary hover:bg-primary/90 shadow-2xl h-14 px-10 rounded-2xl font-black text-lg group">
              {saving ? <Loader2 className="mr-2 animate-spin" /> : <UserCheck className="mr-2 group-hover:scale-110 transition-transform" />} 
              {saving ? "Scellage..." : "Sceller & Publier"}
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8 border-l-[12px] border-primary">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Classe</label>
              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>{userClasses.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Trimestre</label>
              <Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue /></SelectTrigger>
                <SelectContent>{trimestres.map(t => <SelectItem key={t.id} value={t.id} className="font-bold">{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Évaluation</label>
              <Select value={selectedEvalType} onValueChange={setSelectedEvalType}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue /></SelectTrigger>
                <SelectContent>{evalTypes.map(t => <SelectItem key={t.id} value={t.id} className="font-bold">{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Coefficient</label>
              <Input type="number" min="1" max="10" value={classCoefficient} onChange={(e) => setClassCoefficient(Number(e.target.value))} className="h-14 rounded-2xl border-2 font-black text-center text-xl focus:ring-primary" />
            </div>
          </div>
        </Card>

        {selectedClass && (
          <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
            <div className="p-8 border-b bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <h3 className="text-xl font-black">Registre : {selectedClass}</h3>
                 <Badge className="bg-primary text-white font-black px-4 py-1 uppercase">{userSubject}</Badge>
                 <Badge variant="outline" className="border-primary text-primary font-black uppercase px-4">{selectedTrimestre}</Badge>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Saisie par {userName}</p>
            </div>
            <CardContent className="p-0">
              {loadingStudents ? (
                <div className="p-20 text-center animate-pulse font-bold text-muted-foreground flex flex-col items-center gap-4">
                  <Loader2 className="size-10 animate-spin text-primary" />
                  Appel de la classe en cours...
                </div>
              ) : !students || students.length === 0 ? (
                <div className="p-20 text-center italic text-muted-foreground">Aucun élève actif trouvé dans cette classe.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="px-10 py-6 text-left">Élève (Nom & Matricule)</th>
                        <th className="px-10 py-6 text-center">Note / 20</th>
                        <th className="px-10 py-6 text-right bg-primary text-white">Impact Coefficié</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/30">
                      {students.map((student: any) => {
                        const val = parseFloat(gradesData[student.matricule] || "0")
                        const impact = (val * (Number(classCoefficient) || 1)).toFixed(2)
                        return (
                          <tr key={student.id} className="hover:bg-muted/5 transition-colors group">
                            <td className="px-10 py-6">
                              <div className="flex flex-col">
                                <span className="font-black text-lg text-foreground group-hover:text-primary transition-colors">{student.lastName.toUpperCase()} {student.firstName}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{student.matricule}</span>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-center">
                              <Input 
                                type="number" 
                                step="0.25" 
                                placeholder="0.00" 
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
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
