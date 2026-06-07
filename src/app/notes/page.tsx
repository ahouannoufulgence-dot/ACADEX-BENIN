
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Loader2, Zap, Info, ShieldCheck, Calculator } from "lucide-react"
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
import { collection, query, orderBy, where, setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore"

// Nomenclature Unifiée ACADEX
const officialClasses = ["6EME A", "6EME B", "5EME A", "5EME B", "4EME A", "4EME B", "4EME C", "3EME D1", "3EME D2", "2NDE C", "2NDE D", "1ERE D", "TLE D1", "TLE D2"]
const terms = ["1er Trimestre", "2ème Trimestre", "3ème Trimestre"]

export default function GradesPage() {
  const db = useFirestore()
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTerm, setSelectedTerm] = useState(terms[0])
  const [saving, setSaving] = useState(false)
  const [gradesData, setGradesData] = useState<Record<string, any>>({})
  const [coefficient, setCoefficient] = useState(2)

  // Récupérer les élèves réels de la classe sélectionnée
  const studentsQuery = useMemo(() => {
    if (!db || !selectedClass) return null
    return query(collection(db, 'students'), where("classId", "==", selectedClass), orderBy("matricule", "asc"))
  }, [db, selectedClass])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const handleGradeChange = (studentId: string, field: string, value: string) => {
    const num = parseFloat(value)
    if (num > 20) {
      toast({ title: "Valeur invalide", description: "La note maximale est 20/20", variant: "destructive" })
      return
    }
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
    if (!selectedClass || !selectedSubject) {
      toast({ title: "Champs manquants", description: "Veuillez sélectionner une classe et une matière.", variant: "destructive" })
      return
    }
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
          coefficient: coefficient,
          weightedAverage: parseFloat(avg) * coefficient,
          updatedAt: serverTimestamp()
        })
      }
      toast({ title: "Saisie enregistrée", description: `Les notes de ${selectedSubject} ont été validées.` })
    } catch (e) {
      toast({ title: "Erreur sauvegarde", variant: "destructive" })
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
            <p className="text-muted-foreground font-medium italic">Saisie des évaluations avec prise en compte des coefficients.</p>
          </div>
          <Button onClick={handleSaveGrades} disabled={saving || !selectedClass} className="bg-primary hover:bg-primary/90 shadow-xl h-14 px-10 rounded-2xl font-black">
            {saving ? <Loader2 className="mr-2 size-6 animate-spin" /> : <Save className="mr-2 size-6" />} Valider & Sceller les Notes
          </Button>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Classe</label>
              <Select onValueChange={setSelectedClass}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue placeholder="Choisir" /></SelectTrigger>
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
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Coefficient</label>
              <Input 
                type="number" 
                value={coefficient} 
                onChange={(e) => setCoefficient(Number(e.target.value))} 
                className="h-14 rounded-2xl border-2 font-black text-center text-xl text-primary"
              />
            </div>
          </div>
        </Card>

        {selectedClass && selectedSubject && (
          <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
            <div className="p-8 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <h3 className="text-xl font-black">Registre : {selectedClass}</h3>
                 <Badge className="bg-primary/10 text-primary border-none font-bold uppercase">{selectedSubject}</Badge>
              </div>
              <div className="flex items-center gap-3">
                 <Calculator className="size-4 text-muted-foreground" />
                 <span className="text-xs font-black uppercase text-muted-foreground">Coefficient appliqué : {coefficient}</span>
              </div>
            </div>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b">
                  <tr className="text-center">
                    <th className="px-8 py-6 text-left">Élève</th>
                    <th className="bg-muted/10">Int 1</th><th className="bg-muted/10">Int 2</th><th className="bg-muted/10">Int 3</th>
                    <th className="bg-primary/5 text-primary">Dev 1</th><th className="bg-primary/5 text-primary">Dev 2</th>
                    <th className="px-4 text-center">Moy/20</th>
                    <th className="px-8 text-right bg-primary text-white">Moy Pondérée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
                  {loadingStudents ? (
                    <tr><td colSpan={8} className="p-20 text-center"><Loader2 className="size-10 animate-spin mx-auto text-primary" /></td></tr>
                  ) : !students || students.length === 0 ? (
                    <tr><td colSpan={8} className="p-20 text-center font-bold text-muted-foreground">Aucun élève inscrit dans cette classe.</td></tr>
                  ) : (
                    students?.map((student: any) => {
                      const avg = calculateAverage(student.id)
                      const weighted = (parseFloat(avg) * coefficient).toFixed(2)
                      return (
                        <tr key={student.id} className="hover:bg-muted/5 transition-colors group text-center">
                          <td className="px-8 py-5 text-left">
                            <div className="flex flex-col">
                              <span className="font-black text-foreground group-hover:text-primary transition-colors">{student.lastName} {student.firstName}</span>
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
                          <td className="px-4 py-5 text-center font-black text-foreground">{avg}</td>
                          <td className="px-8 py-5 text-right">
                             <Badge className="bg-primary text-white h-12 w-28 justify-center rounded-2xl text-lg font-black shadow-lg">
                               {weighted}
                             </Badge>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
            <div className="p-10 bg-muted/10 border-t flex justify-between items-center">
               <div className="flex items-center gap-3 text-muted-foreground">
                 <ShieldCheck className="size-6 text-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Calcul automatique certifié ACADEX</span>
               </div>
               <Button onClick={handleSaveGrades} className="rounded-xl font-black h-12 px-10 bg-foreground">Valider le Registre</Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
