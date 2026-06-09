"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Loader2, Zap, ShieldCheck, Calculator, Lock, UserCheck, RefreshCw, Info, ArrowRight, User } from "lucide-react"
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

const BENIN_SUBJECTS = [
  "Mathématiques", "Français", "Anglais", "PCT", "SVT", "Histoire-Géo", "Philosophie", 
  "Allemand", "Espagnol", "Économie", "Informatique", "EPS"
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

  const isDirector = userRole === "Directeur"

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
        } else {
          // Default coefficients if not set
          setClassCoefficient(userSubject === 'Mathématiques' || userSubject === 'Français' ? 4 : 2)
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
    if (!selectedClass || !selectedTrimestre || !selectedEvalType || !userSubject) {
      toast({ title: "Données manquantes", description: "Veuillez choisir une classe et une matière.", variant: "destructive" })
      return
    }
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
      toast({ title: "Notes scellées !", description: `Registre ${selectedClass} publié pour ${userSubject}.` })
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'grades', operation: 'write' }))
    } finally {
      setSaving(false)
    }
  }

  const classesToShow = isDirector ? OFFICIAL_CLASSES : userClasses

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
              Saisie <span className="text-primary italic">Notes</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span>Année Scolaire {activeYear} • {isDirector ? "Accès Direction" : "Accès Enseignant"}</span>
            </div>
          </div>
          <Button 
            onClick={handleSaveGrades} 
            disabled={saving || !selectedClass || students?.length === 0} 
            className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-13 md:h-16 px-8 md:px-12 rounded-2xl font-black text-xs md:text-lg transition-all active:scale-95 mobile-touch-target"
          >
            {saving ? <Loader2 className="animate-spin size-4 md:size-5" /> : <UserCheck className="mr-2 size-4 md:size-5" />} 
            {saving ? "Scellage..." : "Sceller & Publier"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
          <div className="lg:col-span-9 space-y-6 md:space-y-10">
            <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 border-l-[8px] md:border-l-[15px] border-primary group">
              <div className={cn("grid gap-4 md:gap-8", isDirector ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-4")}>
                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Classe</label>
                  <Select onValueChange={setSelectedClass} value={selectedClass}>
                    <SelectTrigger className="h-11 md:h-14 rounded-[1rem] md:rounded-2xl border-2 border-primary/5 font-black text-xs md:text-base focus:ring-primary shadow-sm"><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 p-1">
                      {classesToShow.map(c => <SelectItem key={c} value={c} className="font-bold p-3 rounded-xl">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {isDirector && (
                  <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Matière</label>
                    <Select value={userSubject} onValueChange={setUserSubject}>
                       <SelectTrigger className="h-11 md:h-14 rounded-[1rem] md:rounded-2xl border-2 border-primary/5 font-black text-xs md:text-base focus:ring-primary shadow-sm"><SelectValue placeholder="Sujet" /></SelectTrigger>
                       <SelectContent className="rounded-2xl border-2 p-1">
                          {BENIN_SUBJECTS.map(s => <SelectItem key={s} value={s} className="font-bold p-3 rounded-xl">{s}</SelectItem>)}
                       </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Trimestre</label>
                  <Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}>
                    <SelectTrigger className="h-11 md:h-14 rounded-[1rem] md:rounded-2xl border-2 border-primary/5 font-black text-xs md:text-base focus:ring-primary shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 p-1">
                      {trimestres.map(t => <SelectItem key={t.id} value={t.id} className="font-bold p-3 rounded-xl">{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Évaluation</label>
                  <Select value={selectedEvalType} onValueChange={setSelectedEvalType}>
                    <SelectTrigger className="h-11 md:h-14 rounded-[1rem] md:rounded-2xl border-2 border-primary/5 font-black text-xs md:text-base focus:ring-primary shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 p-1">
                      {evalTypes.map(t => <SelectItem key={t.id} value={t.id} className="font-bold p-3 rounded-xl">{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Coef</label>
                  <div className="relative">
                    <Input type="number" min="1" max="10" value={classCoefficient} onChange={(e) => setClassCoefficient(Number(e.target.value))} className="h-11 md:h-14 rounded-[1rem] md:rounded-2xl border-2 border-primary/5 font-black text-center text-sm md:text-xl shadow-inner focus-visible:ring-primary" />
                    <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 size-3 md:size-4 text-primary/30" />
                  </div>
                </div>
              </div>
            </Card>

            {selectedClass && (
              <Card className="border-none shadow-sm bg-white rounded-[2.2rem] md:rounded-[3.5rem] overflow-hidden">
                <div className="p-6 md:p-12 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-6">
                     <div className="size-10 md:size-14 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-sm transition-transform hover:rotate-3">
                        <User className="size-5 md:size-7" />
                     </div>
                     <div>
                       <h3 className="text-lg md:text-2xl font-black text-foreground uppercase tracking-tight">Promotion {selectedClass}</h3>
                       <Badge className="bg-primary text-white font-black px-3 py-0.5 uppercase text-[7px] md:text-[10px] rounded-sm mt-1">{userSubject || "Choisir matière"}</Badge>
                     </div>
                  </div>
                  {loadingExisting && <div className="flex items-center gap-2 text-[9px] md:text-[11px] font-black text-primary animate-pulse uppercase tracking-widest"><RefreshCw className="size-2.5 md:size-4 animate-spin" /> Synchro...</div>}
                </div>
                
                <div className="block md:hidden p-4 space-y-3 bg-[#F8FAFC]/50">
                   {loadingStudents ? (
                     <div className="p-20 text-center animate-pulse"><Loader2 className="size-10 animate-spin mx-auto text-primary/20" /></div>
                   ) : students?.map((student: any) => {
                     const impact = (parseFloat(gradesData[student.matricule] || "0") * classCoefficient).toFixed(2)
                     return (
                        <div key={student.id} className="p-5 bg-white rounded-[1.8rem] border border-muted/50 shadow-sm flex flex-col gap-4 animate-in slide-in-from-bottom-2 transition-all active:scale-[0.98]">
                           <div className="flex justify-between items-start">
                              <div className="min-w-0">
                                 <p className="font-black text-sm uppercase truncate">{student.lastName} {student.firstName}</p>
                                 <p className="text-[9px] font-bold text-muted-foreground uppercase">{student.matricule}</p>
                              </div>
                              <Badge className="bg-primary/5 text-primary border-primary/20 font-black text-[9px] h-6 px-2.5 rounded-full">IMPACT: {impact}</Badge>
                           </div>
                           <div className="relative group">
                              <Input 
                                type="number" 
                                step="0.25" 
                                placeholder="0.00" 
                                value={gradesData[student.matricule] || ""} 
                                onChange={(e) => handleGradeChange(student.matricule, e.target.value)} 
                                className="h-14 rounded-[1.2rem] text-center text-3xl font-black border-2 border-primary/10 bg-[#F8FAFC] focus:bg-white focus:ring-primary shadow-inner" 
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground uppercase opacity-40">Note/20</span>
                           </div>
                        </div>
                     )
                   })}
                   {students?.length === 0 && !loadingStudents && <div className="p-10 text-center text-[10px] font-black text-muted-foreground uppercase italic opacity-40">Aucun élève actif détecté.</div>}
                </div>

                <CardContent className="hidden md:block p-0">
                  {loadingStudents ? (
                    <div className="p-32 text-center animate-pulse"><Loader2 className="size-14 animate-spin mx-auto text-primary/10" /></div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-muted/20 text-[10px] font-black uppercase text-muted-foreground border-b border-muted/30">
                        <tr>
                          <th className="px-12 py-8 text-left tracking-widest">Élève & Identifiant</th>
                          <th className="px-12 py-8 text-center tracking-widest">Note / 20</th>
                          <th className="px-12 py-8 text-right bg-primary text-white tracking-widest">Impact Coefficié</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/20">
                        {students?.map((student: any) => {
                          const val = parseFloat(gradesData[student.matricule] || "0")
                          const impact = (val * (Number(classCoefficient) || 1)).toFixed(2)
                          return (
                            <tr key={student.id} className="hover:bg-muted/5 transition-all group">
                              <td className="px-12 py-8">
                                <p className="font-black text-xl text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{student.lastName} {student.firstName}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{student.matricule}</p>
                              </td>
                              <td className="px-12 py-8 text-center">
                                <Input 
                                  type="number" 
                                  step="0.25" 
                                  value={gradesData[student.matricule] || ""} 
                                  onChange={(e) => handleGradeChange(student.matricule, e.target.value)} 
                                  className="w-40 h-16 mx-auto rounded-3xl text-center text-3xl font-black border-2 border-primary/10 focus:ring-primary shadow-inner bg-[#F8FAFC] group-hover:bg-white transition-all" 
                                />
                              </td>
                              <td className="px-12 py-8 text-right">
                                 <Badge className="h-14 w-40 justify-center rounded-[1.5rem] bg-primary/5 text-primary border-2 border-primary/10 text-2xl font-black shadow-sm group-hover:scale-105 transition-transform">
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

          <div className="lg:col-span-3 space-y-6 md:space-y-10">
            <Card className="p-7 md:p-9 rounded-[2rem] md:rounded-[2.5rem] bg-amber-50 border-2 border-amber-100 flex flex-col gap-6 relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 p-10 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform">
                <ShieldCheck className="size-24 text-amber-700" />
              </div>
              <div className="flex items-center gap-3 text-amber-700 relative z-10">
                <div className="size-8 md:size-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Info className="size-4 md:size-5" /></div>
                <h4 className="font-black text-[10px] md:text-sm uppercase tracking-widest">Note de Conduite</h4>
              </div>
              <p className="text-[10px] md:text-xs font-medium leading-relaxed text-amber-800 relative z-10">
                L'excellence ACADEX repose sur la discipline. La note de <b>Conduite</b> est gérée dans le module <b>Vie Scolaire</b> et impacte automatiquement la moyenne générale scellée.
              </p>
              <Button asChild variant="outline" className="w-full rounded-xl border-amber-200 text-amber-700 font-black text-[9px] md:text-xs bg-white hover:bg-amber-100 h-11 md:h-13 transition-all relative z-10 mobile-touch-target">
                <Link href="/vie-scolaire">Gérer la discipline <ArrowRight className="ml-2 size-3" /></Link>
              </Button>
            </Card>

            <Card className="p-8 rounded-[2.5rem] bg-foreground text-white border-none shadow-2xl relative overflow-hidden flex flex-col items-center text-center gap-4">
               <Zap className="text-primary size-8 fill-primary/20" />
               <div>
                  <h4 className="font-black text-sm uppercase tracking-widest">Scellement Live</h4>
                  <p className="text-[9px] font-medium text-white/40 mt-1 uppercase">Certification Acadex V1.0</p>
               </div>
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
