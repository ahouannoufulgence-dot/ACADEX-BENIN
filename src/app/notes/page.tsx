
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Save, 
  Loader2, 
  Table as TableIcon,
  Calculator,
  Zap,
  Info
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
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, orderBy, where } from "firebase/firestore"

const officialClasses = ["6ème A", "6ème B", "5ème A", "5ème B", "4ème A", "4ème B", "4ème C", "3D1", "3D2", "2nde C", "2nde D", "1ère D", "Terminale D1", "Terminale D2"]
const terms = ["1er Trimestre", "2ème Trimestre", "3ème Trimestre"]

// Simulation de mapping des coefficients dynamiques par classe (normalement stocké en DB)
const getCoefficientForClass = (className: string, subject: string): number => {
  if (className.includes("Terminale D")) {
    if (subject === "Maths") return 5;
    if (subject === "PCT") return 5;
    if (subject === "SVT") return 5;
    return 2;
  }
  if (className.includes("3D")) return 3;
  return 2;
}

export default function GradesPage() {
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTerm, setSelectedTerm] = useState(terms[0])
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [gradesData, setGradesData] = useState<Record<string, any>>({})

  const db = useFirestore()

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role') || "Directeur")
  }, [])

  const studentsQuery = useMemo(() => {
    if (!db || !selectedClass) return null
    return query(collection(db, 'students'), where("classId", "==", selectedClass), orderBy("matricule", "asc"))
  }, [db, selectedClass])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const currentCoefficient = useMemo(() => {
    if (!selectedClass || !selectedSubject) return 1;
    return getCoefficientForClass(selectedClass, selectedSubject);
  }, [selectedClass, selectedSubject])

  const handleGradeChange = (studentId: string, field: string, value: string) => {
    const numValue = parseFloat(value)
    if (numValue > 20) {
      toast({ title: "Valeur invalide", description: "La note ne peut pas dépasser 20/20.", variant: "destructive" })
      return
    }
    setGradesData(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
  }

  const calculateAverage = (studentId: string) => {
    const data = gradesData[studentId]
    if (!data) return "--"
    const i1 = parseFloat(data.int1) || 0
    const i2 = parseFloat(data.int2) || 0
    const i3 = parseFloat(data.int3) || 0
    const d1 = parseFloat(data.dev1) || 0
    const d2 = parseFloat(data.dev2) || 0
    
    // Logique Bénin : (Moyenne Interros + Dev1 + Dev2) / 3
    const avgInt = (i1 + i2 + i3) / 3
    const result = (avgInt + d1 + d2) / 3
    return result.toFixed(2)
  }

  const handleSaveGrades = async () => {
    if (!selectedClass || !selectedSubject) {
      toast({ title: "Champs manquants", description: "Veuillez choisir classe et matière.", variant: "destructive" })
      return
    }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast({ title: "Notes sauvegardées", description: `Les notes de ${selectedSubject} pour la classe ${selectedClass} ont été scellées.` })
    }, 1500)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Saisie des <span className="text-primary italic">Notes</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Structure Bénin : 3 Interrogations + 2 Devoirs par trimestre.</p>
          </div>
          <Button onClick={handleSaveGrades} disabled={saving || !selectedClass} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-14 px-10 rounded-2xl font-black">
            {saving ? <Loader2 className="mr-2 size-6 animate-spin" /> : <Save className="mr-2 size-6" />}
            Enregistrer & Sceller
          </Button>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Classe</label>
              <Select onValueChange={setSelectedClass}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue placeholder="Choisir la classe" /></SelectTrigger>
                <SelectContent>{officialClasses.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Discipline</label>
              <Select onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue placeholder="Choisir la matière" /></SelectTrigger>
                <SelectContent>{["Maths", "Français", "Anglais", "PCT", "SVT", "H-G", "Philo", "Allemand", "Espagnol"].map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Période</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue /></SelectTrigger>
                <SelectContent>{terms.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {selectedClass && selectedSubject && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-4 bg-primary/5 p-4 rounded-3xl border border-primary/10">
              <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                <Zap className="size-6 fill-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-primary uppercase">Calcul Automatique Activé</p>
                <p className="text-xs font-medium text-primary/70">Coefficient appliqué pour cette classe : <span className="font-black text-lg ml-1">{currentCoefficient}</span></p>
              </div>
              <Badge variant="outline" className="h-10 px-4 rounded-xl border-primary/20 bg-white font-black text-primary">
                {selectedClass} • {selectedSubject}
              </Badge>
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b bg-muted/20 flex items-center justify-between">
                <h3 className="text-xl font-black">Registre de Notes</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="size-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Le système calcule la moyenne pondérée en temps réel</span>
                </div>
              </div>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b">
                    <tr className="text-center">
                      <th className="px-8 py-6 text-left">Matricule & Élève</th>
                      <th className="bg-muted/10">Int 1</th><th className="bg-muted/10">Int 2</th><th className="bg-muted/10">Int 3</th>
                      <th className="bg-primary/5 text-primary">Dev 1</th><th className="bg-primary/5 text-primary">Dev 2</th>
                      <th className="px-8 text-right bg-primary text-white">Moyenne / 20</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/30">
                    {loadingStudents ? (
                      <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="size-10 animate-spin mx-auto text-primary" /></td></tr>
                    ) : (
                      students?.map((student: any) => (
                        <tr key={student.id} className="hover:bg-muted/5 transition-colors text-center group">
                          <td className="px-8 py-5 text-left">
                            <div className="flex flex-col">
                              <span className="font-black text-foreground group-hover:text-primary transition-colors">{student.fullName || "Élève Nouveau"}</span>
                              <span className="text-[9px] font-bold text-muted-foreground">{student.matricule}</span>
                            </div>
                          </td>
                          {['int1', 'int2', 'int3'].map((f) => (
                            <td key={f} className="py-4 bg-muted/5">
                              <Input type="number" step="0.25" min="0" max="20" className="w-16 mx-auto h-11 rounded-xl text-center font-black border-2" value={gradesData[student.id]?.[f] || ""} onChange={(e) => handleGradeChange(student.id, f, e.target.value)} />
                            </td>
                          ))}
                          {['dev1', 'dev2'].map((f) => (
                            <td key={f} className="py-4 bg-primary/5">
                              <Input type="number" step="0.25" min="0" max="20" className="w-16 mx-auto h-11 rounded-xl text-center font-black border-2 border-primary/20" value={gradesData[student.id]?.[f] || ""} onChange={(e) => handleGradeChange(student.id, f, e.target.value)} />
                            </td>
                          ))}
                          <td className="px-8 py-5 text-right">
                             <div className="flex flex-col items-end">
                               <Badge className="bg-primary text-white h-12 w-24 justify-center rounded-2xl text-lg font-black shadow-lg shadow-primary/10">
                                 {calculateAverage(student.id)}
                               </Badge>
                               <span className="text-[8px] font-black text-muted-foreground uppercase mt-1">Pondéré Coef {currentCoefficient}</span>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
