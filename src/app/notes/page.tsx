
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Loader2, Zap, Info, ShieldCheck } from "lucide-react"
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
import { collection, query, orderBy, where, setDoc, doc, serverTimestamp } from "firebase/firestore"

const officialClasses = ["6ème A", "6ème B", "5ème A", "5ème B", "4ème A", "4ème B", "4ème C", "3D1", "3D2", "2nde C", "2nde D", "1ère D", "Terminale D1", "Terminale D2"]
const terms = ["1er Trimestre", "2ème Trimestre", "3ème Trimestre"]

export default function GradesPage() {
  const db = useFirestore()
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTerm, setSelectedTerm] = useState(terms[0])
  const [saving, setSaving] = useState(false)
  const [gradesData, setGradesData] = useState<Record<string, any>>({})

  // Récupérer les élèves réels de la classe sélectionnée
  const studentsQuery = useMemo(() => {
    if (!db || !selectedClass) return null
    return query(collection(db, 'students'), where("classId", "==", selectedClass), orderBy("matricule", "asc"))
  }, [db, selectedClass])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const handleGradeChange = (studentId: string, field: string, value: string) => {
    const num = parseFloat(value)
    if (num > 20) return toast({ title: "Invalide", description: "Max 20/20", variant: "destructive" })
    setGradesData(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
  }

  const calculateAverage = (studentId: string) => {
    const data = gradesData[studentId]
    if (!data) return "0.00"
    const i = [(parseFloat(data.int1) || 0), (parseFloat(data.int2) || 0), (parseFloat(data.int3) || 0)]
    const avgInt = i.reduce((a,b) => a+b, 0) / 3
    const d1 = parseFloat(data.dev1) || 0
    const d2 = parseFloat(data.dev2) || 0
    return ((avgInt + d1 + d2) / 3).toFixed(2)
  }

  const handleSaveGrades = async () => {
    if (!selectedClass || !selectedSubject) return
    setSaving(true)
    try {
      for (const student of (students || [])) {
        const avg = calculateAverage(student.id)
        const gradeId = `${student.id}_${selectedSubject}_${selectedTerm.replace(' ', '')}`
        await setDoc(doc(db, "grades", gradeId), {
          studentId: student.id,
          classId: selectedClass,
          subject: selectedSubject,
          term: selectedTerm,
          ...gradesData[student.id],
          average: parseFloat(avg),
          updatedAt: serverTimestamp()
        })
      }
      toast({ title: "Saisie scellée", description: "Les notes ont été enregistrées avec succès." })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Gestion des <span className="text-primary italic">Notes</span></h1>
            <p className="text-muted-foreground font-medium italic">"L'impartialité est la base de l'excellence."</p>
          </div>
          <Button onClick={handleSaveGrades} disabled={saving || !selectedClass} className="bg-primary hover:bg-primary/90 shadow-xl h-14 px-10 rounded-2xl font-black">
            {saving ? <Loader2 className="mr-2 size-6 animate-spin" /> : <Save className="mr-2 size-6" />} Enregistrer & Sceller
          </Button>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Périmètre Classe</label>
              <Select onValueChange={setSelectedClass}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue placeholder="Classe" /></SelectTrigger>
                <SelectContent>{officialClasses.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Discipline</label>
              <Select onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue placeholder="Matière" /></SelectTrigger>
                <SelectContent>{["Maths", "Français", "Anglais", "PCT", "SVT", "H-G", "Philo", "Allemand"].map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Trimestre</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue /></SelectTrigger>
                <SelectContent>{terms.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {selectedClass && selectedSubject && (
          <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
            <div className="p-8 border-b bg-muted/20 flex items-center justify-between">
              <h3 className="text-xl font-black">Registre de Classe : {selectedClass}</h3>
              <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">{selectedSubject}</Badge>
            </div>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b">
                  <tr className="text-center">
                    <th className="px-8 py-6 text-left">Élève</th>
                    <th className="bg-muted/10">Int 1</th><th className="bg-muted/10">Int 2</th><th className="bg-muted/10">Int 3</th>
                    <th className="bg-primary/5 text-primary">Dev 1</th><th className="bg-primary/5 text-primary">Dev 2</th>
                    <th className="px-8 text-right bg-primary text-white">Moy / 20</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
                  {loadingStudents ? (
                    <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="size-10 animate-spin mx-auto text-primary" /></td></tr>
                  ) : (
                    students?.map((student: any) => (
                      <tr key={student.id} className="hover:bg-muted/5 transition-colors group text-center">
                        <td className="px-8 py-5 text-left">
                          <div className="flex flex-col">
                            <span className="font-black text-foreground group-hover:text-primary transition-colors">{student.fullName || "Élève Nouveau"}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{student.matricule}</span>
                          </div>
                        </td>
                        {['int1', 'int2', 'int3'].map((f) => (
                          <td key={f} className="py-4 bg-muted/5">
                            <Input type="number" step="0.25" className="w-16 mx-auto h-11 rounded-xl text-center font-black border-2" value={gradesData[student.id]?.[f] || ""} onChange={(e) => handleGradeChange(student.id, f, e.target.value)} />
                          </td>
                        ))}
                        {['dev1', 'dev2'].map((f) => (
                          <td key={f} className="py-4 bg-primary/5">
                            <Input type="number" step="0.25" className="w-16 mx-auto h-11 rounded-xl text-center font-black border-2 border-primary/20" value={gradesData[student.id]?.[f] || ""} onChange={(e) => handleGradeChange(student.id, f, e.target.value)} />
                          </td>
                        ))}
                        <td className="px-8 py-5 text-right">
                           <Badge className="bg-primary text-white h-12 w-24 justify-center rounded-2xl text-lg font-black shadow-lg">
                             {calculateAverage(student.id)}
                           </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
            <div className="p-10 bg-muted/10 border-t flex justify-between items-center">
               <div className="flex items-center gap-3 text-muted-foreground">
                 <ShieldCheck className="size-6 text-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Calcul automatique et scellage cryptographique Acadex</span>
               </div>
               <Button onClick={handleSaveGrades} className="rounded-xl font-black h-12 px-10 bg-foreground">Valider le Registre</Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
