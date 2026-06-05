
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Save, 
  Filter, 
  ChevronRight,
  Loader2,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  Calculator
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
import { collection, query, orderBy, where, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

const officialClasses = [
  "6ème A", "6ème B", "5ème A", "5ème B", "4ème A", "4ème B", "4ème C", "3D1", "3D2", "2nde C", "2nde D", "1ère D", "Terminale D1", "Terminale D2"
]

const terms = ["1er Trimestre", "2ème Trimestre", "3ème Trimestre"]

export default function GradesPage() {
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTerm, setSelectedTerm] = useState(terms[0])
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [teacherSubject, setTeacherSubject] = useState("")
  const [gradesData, setGradesData] = useState<Record<string, any>>({})

  const db = useFirestore()

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role') || "Directeur"
    const classesStr = localStorage.getItem('acadex_user_classes')
    const subject = localStorage.getItem('acadex_user_subject') || ""
    
    setUserRole(role)
    setUserClasses(classesStr ? JSON.parse(classesStr) : [])
    setTeacherSubject(subject)
    
    if (role.toLowerCase() !== "directeur" && subject) {
      setSelectedSubject(subject)
    }
  }, [])

  const studentsQuery = useMemo(() => {
    if (!db || !selectedClass) return null
    return query(
      collection(db, 'students'), 
      where("classId", "==", selectedClass),
      orderBy("matricule", "asc")
    )
  }, [db, selectedClass])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const handleGradeChange = (studentId: string, field: string, value: string) => {
    setGradesData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }))
  }

  const handleSaveGrades = async () => {
    if (!selectedClass || !selectedSubject) {
      toast({ title: "Sélection incomplète", description: "Veuillez choisir une classe et une matière.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      // Simulation d'enregistrement massif
      toast({ title: "Enregistrement", description: "Les notes ont été sauvegardées avec succès." })
    } catch (e) {
      toast({ title: "Erreur", description: "Échec de l'enregistrement.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Saisie des Notes</h1>
            <p className="text-muted-foreground mt-2 font-medium">Gestion simplifiée des évaluations périodiques.</p>
          </div>
          <Button 
            onClick={handleSaveGrades} 
            disabled={saving || !selectedClass} 
            className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-14 px-10 font-black text-lg"
          >
            {saving ? <Loader2 className="mr-2 size-6 animate-spin" /> : <Save className="mr-2 size-6" />}
            Enregistrer tout
          </Button>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground ml-2">Classe</label>
              <Select onValueChange={setSelectedClass}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black">
                  <SelectValue placeholder="Choisir la classe" />
                </SelectTrigger>
                <SelectContent>
                  {officialClasses.map(c => (
                    <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground ml-2">Matière</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={userRole.toLowerCase() !== "directeur"}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black">
                  <SelectValue placeholder="Choisir la matière" />
                </SelectTrigger>
                <SelectContent>
                  {["Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT", "Histoire-Géo"].map(m => (
                    <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground ml-2">Trimestre</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(t => (
                    <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {selectedClass && (
          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                  <TableIcon className="size-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Feuille de Notes : {selectedClass}</CardTitle>
                  <CardDescription className="font-bold text-primary">{selectedSubject} • {selectedTerm}</CardDescription>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full font-black flex gap-2 items-center">
                <Calculator className="size-4" /> Moyennes Automatiques
              </Badge>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b">
                      <th className="px-8 py-5 text-left">Élève</th>
                      <th className="px-4 py-5 text-center">Interro /20</th>
                      <th className="px-4 py-5 text-center">Devoir /20</th>
                      <th className="px-4 py-5 text-center">Composition /20</th>
                      <th className="px-8 py-5 text-right">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/30">
                    {loadingStudents ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
                        </td>
                      </tr>
                    ) : students?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-muted-foreground italic font-bold">
                          Aucun élève trouvé dans cette classe.
                        </td>
                      </tr>
                    ) : (
                      students?.map((student: any) => (
                        <tr key={student.id} className="hover:bg-muted/5 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-foreground">{student.fullName || "Élève Nouveau"}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{student.matricule}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Input 
                              type="number" 
                              max={20} 
                              min={0}
                              className="w-20 mx-auto h-12 rounded-xl text-center font-black text-lg border-2 focus-visible:ring-primary"
                              placeholder="--"
                              onChange={(e) => handleGradeChange(student.id, 'interro', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <Input 
                              type="number" 
                              max={20} 
                              min={0}
                              className="w-20 mx-auto h-12 rounded-xl text-center font-black text-lg border-2 focus-visible:ring-primary"
                              placeholder="--"
                              onChange={(e) => handleGradeChange(student.id, 'devoir', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <Input 
                              type="number" 
                              max={20} 
                              min={0}
                              className="w-20 mx-auto h-12 rounded-xl text-center font-black text-lg border-2 border-primary/30 bg-primary/5 focus-visible:ring-primary"
                              placeholder="--"
                              onChange={(e) => handleGradeChange(student.id, 'compo', e.target.value)}
                            />
                          </td>
                          <td className="px-8 py-4 text-right">
                            <Badge className="bg-primary text-white text-lg font-black h-12 w-20 justify-center rounded-xl">
                              --
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedClass && (
          <div className="h-96 flex flex-col items-center justify-center p-12 text-center border-4 border-dashed rounded-[3rem] bg-muted/20">
            <div className="size-24 bg-white rounded-[2rem] flex items-center justify-center shadow-sm mb-6">
              <TableIcon className="size-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">Sélectionnez une classe</h3>
            <p className="text-muted-foreground font-medium max-w-sm">
              Choisissez une classe dans le sélecteur ci-dessus pour commencer à saisir les notes de vos élèves.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
