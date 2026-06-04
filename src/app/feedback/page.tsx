"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Sparkles, 
  Loader2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText,
  History,
  Info
} from "lucide-react"
import { generateAcademicFeedback, type GenerateAcademicFeedbackInput, type GenerateAcademicFeedbackOutput } from "@/ai/flows/generate-academic-feedback"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function FeedbackPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateAcademicFeedbackOutput | null>(null)
  
  const [studentName, setStudentName] = useState("")
  const [grades, setGrades] = useState([{ subject: "", grade: 10, maxGrade: 20 }])
  const [teacherComments, setTeacherComments] = useState("")
  const [evaluationContext, setEvaluationContext] = useState("Rapport trimestriel")

  const addGrade = () => {
    setGrades([...grades, { subject: "", grade: 10, maxGrade: 20 }])
  }

  const removeGrade = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index))
  }

  const updateGrade = (index: number, field: string, value: any) => {
    const newGrades = [...grades]
    newGrades[index] = { ...newGrades[index], [field]: value }
    setGrades(newGrades)
  }

  const handleGenerate = async () => {
    if (!studentName || grades.some(g => !g.subject)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le nom de l'élève et tous les sujets.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const input: GenerateAcademicFeedbackInput = {
        studentName,
        grades: grades.map(g => ({ ...g, grade: Number(g.grade), maxGrade: Number(g.maxGrade) })),
        evaluationContext,
        teacherComments,
      }
      const data = await generateAcademicFeedback(input)
      setResult(data)
      toast({
        title: "Succès",
        description: "Rapport généré avec succès."
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Erreur",
        description: "Échec de la génération du rapport.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Sparkles className="size-8 text-primary fill-primary/10" />
            Générateur d'Observations IA
          </h1>
          <p className="text-muted-foreground">Utilisez notre intelligence artificielle pour créer des feedbacks pédagogiques haut de gamme et personnalisés.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Données de l'élève</CardTitle>
                <CardDescription>Saisissez les informations académiques pour l'analyse IA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet de l'élève</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Koffi Djimon" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Notes & Matières</Label>
                    <Button variant="outline" size="sm" onClick={addGrade} className="h-8 border-primary text-primary hover:bg-primary hover:text-white">
                      <Plus className="size-4 mr-1" /> Ajouter une note
                    </Button>
                  </div>
                  
                  {grades.map((grade, index) => (
                    <div key={index} className="flex gap-3 items-end group animate-in slide-in-from-right-2 fade-in">
                      <div className="flex-1 space-y-2">
                        {index === 0 && <Label className="text-xs text-muted-foreground">Matière</Label>}
                        <Input 
                          placeholder="Ex: Mathématiques" 
                          value={grade.subject}
                          onChange={(e) => updateGrade(index, "subject", e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="w-20 space-y-2">
                        {index === 0 && <Label className="text-xs text-muted-foreground">Note</Label>}
                        <Input 
                          type="number" 
                          value={grade.grade}
                          onChange={(e) => updateGrade(index, "grade", e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="w-20 space-y-2">
                        {index === 0 && <Label className="text-xs text-muted-foreground">Max</Label>}
                        <Input 
                          type="number" 
                          value={grade.maxGrade}
                          onChange={(e) => updateGrade(index, "maxGrade", e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeGrade(index)}
                        disabled={grades.length === 1}
                        className="text-destructive h-10 w-10 hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4">
                  <Label htmlFor="comments">Commentaires Additionnels (Optionnel)</Label>
                  <Textarea 
                    id="comments" 
                    placeholder="Précisez des points particuliers (comportement, efforts...)" 
                    className="min-h-[100px] resize-none"
                    value={teacherComments}
                    onChange={(e) => setTeacherComments(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t flex justify-end p-4">
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 h-11 px-8 gap-2 font-bold shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
                  {loading ? "Analyse en cours..." : "Générer le rapport premium"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Result Side */}
          <div className="lg:col-span-5 space-y-6">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                <div className="size-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                  <Info className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">En attente de données</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Remplissez le formulaire à gauche pour voir l'IA ACADEX générer un rapport de synthèse professionnel.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <Card className="border-none shadow-xl border-l-4 border-l-primary bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-primary hover:bg-primary font-bold">RAPPORT IA GÉNÉRÉ</Badge>
                      <Button variant="ghost" size="icon" className="size-8 rounded-full">
                        <History className="size-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-2xl font-extrabold mt-4 text-primary">Rapport de {studentName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 font-bold text-foreground">
                        <CheckCircle2 className="size-5 text-primary" />
                        Observation Académique
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed bg-muted/50 p-4 rounded-2xl italic">
                        "{result.academicFeedback}"
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 font-bold text-foreground">
                        <FileText className="size-5 text-primary" />
                        Synthèse Globale
                      </h4>
                      <div className="text-sm text-foreground/80 leading-relaxed">
                        {result.summaryReport}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 font-bold text-foreground">
                        <Sparkles className="size-5 text-primary" />
                        Recommandations Actionnables
                      </h4>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <span className="size-5 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-foreground/90">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex gap-3">
                    <Button className="flex-1 bg-primary hover:bg-primary/90 font-bold h-11">
                      Télécharger PDF
                    </Button>
                    <Button variant="outline" className="flex-1 border-2 font-bold h-11">
                      Partager aux parents
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}