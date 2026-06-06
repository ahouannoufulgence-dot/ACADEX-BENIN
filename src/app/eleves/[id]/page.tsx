
"use client"

import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  Download,
  Info,
  Loader2,
  CheckCircle2,
  FileText,
  Zap,
  Edit2,
  Save,
  Trash2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { generateAcademicFeedback, type GenerateAcademicFeedbackOutput } from "@/ai/flows/generate-academic-feedback"
import { useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function StudentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const db = useFirestore()
  const studentRef = doc(db, "students", id as string)
  const { data: student, loading: loadingStudent } = useDoc(studentRef)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: "",
    matricule: "",
    classId: "",
    status: ""
  })

  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<GenerateAcademicFeedbackOutput | null>(null)
  const [isDirector, setIsDirector] = useState(false)

  useEffect(() => {
    setIsDirector(localStorage.getItem('acadex_user_role') === "Directeur")
    if (student) {
      setEditForm({
        fullName: student.fullName || "",
        matricule: student.matricule || "",
        classId: student.classId || "",
        status: student.status || ""
      })
    }
  }, [student])

  const handleUpdate = () => {
    updateDoc(studentRef, editForm).catch(async () => {
      const error = new FirestorePermissionError({
        path: studentRef.path,
        operation: 'update',
        requestResourceData: editForm
      })
      errorEmitter.emit('permission-error', error)
    })
    setIsEditing(false)
    toast({ title: "Profil mis à jour", description: "Les modifications ont été enregistrées." })
  }

  const handleDelete = () => {
    deleteDoc(studentRef).catch(async () => {
      const error = new FirestorePermissionError({
        path: studentRef.path,
        operation: 'delete'
      })
      errorEmitter.emit('permission-error', error)
    })
    toast({ title: "Élève supprimé" })
    router.push("/eleves")
  }

  const handleAnalyzeResults = async () => {
    if (!student) return
    setAnalyzing(true)
    try {
      const input = {
        studentName: student.fullName || "L'élève",
        grades: [
          { subject: "Mathématiques", grade: 18, maxGrade: 20 },
          { subject: "Français", grade: 12, maxGrade: 20 },
          { subject: "Physique", grade: 16, maxGrade: 20 },
          { subject: "SVT", grade: 15, maxGrade: 20 },
        ],
        evaluationContext: "Bilan académique actuel",
        teacherComments: "Élève assidu. Continuez ainsi."
      }
      const result = await generateAcademicFeedback(input)
      setAiAnalysis(result)
      toast({ title: "Analyse terminée" })
    } catch (e) {
      toast({ title: "Erreur IA", variant: "destructive" })
    } finally {
      setAnalyzing(false)
    }
  }

  if (loadingStudent) return (
    <DashboardLayout>
      <div className="h-full flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary size-10" /></div>
    </DashboardLayout>
  )

  if (!student) return (
    <DashboardLayout>
      <div className="p-20 text-center">Élève non trouvé.</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link href="/eleves" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold group">
            <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-1" />
            Retour à la liste
          </Link>
          <div className="flex items-center gap-3">
            {isDirector && (
              <>
                <Button 
                  variant={isEditing ? "outline" : "default"} 
                  onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
                  className="rounded-2xl h-12 px-8 font-black"
                >
                  {isEditing ? <Save className="mr-2 size-5" /> : <Edit2 className="mr-2 size-5" />}
                  {isEditing ? "Sauvegarder" : "Modifier le Profil"}
                </Button>
                {isEditing && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="rounded-2xl h-12 px-6 font-black shadow-xl shadow-destructive/20">
                        <Trash2 className="size-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2.5rem]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black">Supprimer définitivement ?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium">
                          Cette action effacera toutes les données scolaires de l'élève {student.fullName || student.matricule}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black">
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
            <Button 
              onClick={handleAnalyzeResults} 
              disabled={analyzing}
              className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black"
            >
              {analyzing ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Sparkles className="mr-2 size-5" />}
              Analyser (IA)
            </Button>
          </div>
        </div>

        {/* Hero Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
          <div className="h-32 bg-primary relative" />
          <CardContent className="pt-16 pb-10 px-8 md:px-16">
            <div className="absolute -top-12 left-8 md:left-16">
              <Avatar className="size-32 md:size-40 border-8 border-white shadow-2xl">
                <AvatarImage src={`https://picsum.photos/seed/${student.id}/400/400`} />
                <AvatarFallback className="bg-primary text-white text-5xl font-black">{(student.fullName || "??").substring(0, 2)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="space-y-3 flex-1 w-full max-w-md">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="font-black text-[10px] uppercase text-muted-foreground">Nom complet</Label>
                      <Input 
                        value={editForm.fullName} 
                        onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                        className="h-12 rounded-xl font-bold"
                        placeholder="Ex: Koffi Djimon"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="font-black text-[10px] uppercase text-muted-foreground">Classe</Label>
                        <Input 
                          value={editForm.classId} 
                          onChange={e => setEditForm({...editForm, classId: e.target.value})} 
                          className="h-11 rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-black text-[10px] uppercase text-muted-foreground">Matricule</Label>
                        <Input 
                          value={editForm.matricule} 
                          onChange={e => setEditForm({...editForm, matricule: e.target.value})} 
                          className="h-11 rounded-xl font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <h1 className="text-3xl md:text-4xl font-black text-foreground">{student.fullName || "Compte à activer"}</h1>
                      <Badge className="bg-primary px-5 py-1 rounded-full font-black text-sm">{student.classId}</Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-3 font-semibold">
                      Matricule: {student.matricule} • Année: {student.academicYear}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="text-center px-6 py-3 bg-muted/50 rounded-3xl border border-muted">
                  <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Moyenne</p>
                  <p className="text-2xl font-black text-primary">0.00</p>
                </div>
                <div className="text-center px-6 py-3 bg-muted/50 rounded-3xl border border-muted">
                  <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Rang</p>
                  <p className="text-2xl font-black text-foreground">---</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="informations" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit overflow-x-auto no-scrollbar">
            <TabsTrigger value="informations" className="rounded-2xl font-bold px-8">Informations</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-2xl font-bold px-8">Notes</TabsTrigger>
            <TabsTrigger value="absences" className="rounded-2xl font-bold px-8">Absences</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-2xl font-bold px-8">Paiements</TabsTrigger>
            <TabsTrigger value="analyse" className="rounded-2xl font-bold px-8 flex gap-2">
              <Sparkles className="size-4" /> Analyse IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="informations" className="space-y-6">
             <div className="grid md:grid-cols-2 gap-8">
                <Card className="premium-card p-8 space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3"><Info className="text-primary" /> Détails Officiels</h3>
                  <div className="grid grid-cols-2 gap-y-6">
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase">Statut Compte</p><Badge variant="outline" className="font-bold border-primary/20 text-primary">{student.status}</Badge></div>
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase">Nationalité</p><p className="font-bold">Béninoise</p></div>
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase">Genre</p><p className="font-bold">---</p></div>
                  </div>
                </Card>
                <Card className="premium-card p-8 space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3"><ShieldCheck className="text-primary" /> Sécurité des Données</h3>
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                      L'identifiant matricule permet à l'élève d'activer son espace personnel sécurisé.
                    </p>
                    <div className="p-6 bg-muted/30 rounded-3xl border-2 border-dashed border-muted-foreground/10 text-center">
                       <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">QR Code de profil</p>
                       <div className="size-32 bg-white rounded-xl mx-auto flex items-center justify-center opacity-30">
                         <Zap className="size-10 text-muted-foreground" />
                       </div>
                    </div>
                  </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card className="premium-card p-20 text-center border-4 border-dashed bg-muted/10">
              <FileText className="size-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-black">Aucune note enregistrée</h3>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto">Les relevés de notes s'afficheront ici après la saisie par les professeurs.</p>
            </Card>
          </TabsContent>

          <TabsContent value="analyse" className="space-y-8">
            {!aiAnalysis ? (
              <Card className="premium-card p-12 text-center border-4 border-dashed bg-muted/20">
                <div className="size-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><Sparkles className="size-10 text-muted-foreground" /></div>
                <h3 className="text-2xl font-black mb-4">Prêt pour une analyse ?</h3>
                <Button onClick={handleAnalyzeResults} disabled={analyzing} className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-12 font-black shadow-xl shadow-primary/20">
                  {analyzing ? <Loader2 className="mr-2 size-6 animate-spin" /> : <Zap className="mr-2 size-6" />}
                  Lancer l'Analyse Maintenant
                </Button>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-12 animate-in fade-in zoom-in-95 duration-500">
                <Card className="md:col-span-8 premium-card p-10 border-l-[12px] border-primary">
                  <div className="flex justify-between items-start mb-8"><Badge className="bg-primary px-4 py-1.5 font-black text-xs">SYNTHÈSE IA</Badge></div>
                  <div className="space-y-10">
                    <section className="space-y-4">
                      <h4 className="flex items-center gap-3 font-black text-lg text-foreground"><CheckCircle2 className="size-6 text-primary" /> Observation Académique</h4>
                      <p className="text-lg text-foreground/80 leading-relaxed font-medium italic bg-muted/30 p-6 rounded-3xl">"{aiAnalysis.academicFeedback}"</p>
                    </section>
                    <section className="space-y-4">
                      <h4 className="flex items-center gap-3 font-black text-lg text-foreground"><FileText className="size-6 text-primary" /> Synthèse Globale</h4>
                      <div className="text-base text-foreground/80 font-medium">{aiAnalysis.summaryReport}</div>
                    </section>
                  </div>
                </Card>
                <div className="md:col-span-4 space-y-6">
                  <Card className="premium-card p-8 bg-foreground text-white">
                    <h4 className="text-xl font-black mb-6 flex items-center gap-3"><Zap className="size-6 text-primary fill-primary" /> Plan d'Action</h4>
                    <div className="space-y-4">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                          <span className="size-6 flex items-center justify-center bg-primary text-white text-[10px] font-black rounded-full shrink-0">{i + 1}</span>
                          <p className="text-sm font-bold text-white/90 leading-tight">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
