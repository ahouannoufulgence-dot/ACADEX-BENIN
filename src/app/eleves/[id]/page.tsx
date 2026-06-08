
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
  Trash2,
  Archive,
  RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { generateAcademicFeedback, type GenerateAcademicFeedbackOutput } from "@/ai/flows/generate-academic-feedback"
import { useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
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
  
  const studentRef = useMemo(() => doc(db, "students", id as string), [db, id])
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
        fullName: student.fullName || `${student.lastName} ${student.firstName}`,
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

  const handleArchive = async () => {
    try {
      await updateDoc(studentRef, { status: "Archivé" })
      toast({ title: "Élève archivé", description: "Le profil a été déplacé vers le coffre-fort numérique." })
      router.push("/eleves")
    } catch (e) {
      toast({ title: "Erreur d'archivage", variant: "destructive" })
    }
  }

  const handleRestore = async () => {
    try {
      await updateDoc(studentRef, { status: "Actif" })
      toast({ title: "Profil restauré", description: "L'élève est de nouveau actif dans l'école." })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
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
        studentName: student.fullName || `${student.lastName} ${student.firstName}`,
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
      <div className="h-full flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary size-8 md:size-10" />
      </div>
    </DashboardLayout>
  )

  if (!student) return (
    <DashboardLayout>
      <div className="p-20 text-center space-y-4">
        <h3 className="text-2xl font-black">Élève non trouvé</h3>
        <p className="text-muted-foreground">Ce profil a été supprimé ou n'existe pas.</p>
        <Button asChild variant="outline" className="rounded-xl"><Link href="/eleves">Retour à la liste</Link></Button>
      </div>
    </DashboardLayout>
  )

  const isArchived = student.status === "Archivé"

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link href="/eleves" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold group text-xs md:text-sm">
            <ChevronLeft className="size-4 md:size-5 transition-transform group-hover:-translate-x-1" />
            Retour à la liste
          </Link>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {isDirector && (
              <>
                {isArchived ? (
                  <Button onClick={handleRestore} className="bg-emerald-500 text-white rounded-2xl h-10 md:h-12 px-4 md:px-8 font-black shadow-xl shadow-emerald-500/20 text-[10px] md:text-sm">
                    <RefreshCw className="mr-2 size-3 md:size-5" /> Restaurer
                  </Button>
                ) : (
                  <Button onClick={handleArchive} variant="outline" className="border-2 border-amber-200 text-amber-600 hover:bg-amber-50 rounded-2xl h-10 md:h-12 px-4 md:px-8 font-black text-[10px] md:text-sm">
                    <Archive className="mr-2 size-3 md:size-5" /> Archiver
                  </Button>
                )}
                
                <Button 
                  variant={isEditing ? "outline" : "default"} 
                  onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
                  className="rounded-2xl h-10 md:h-12 px-4 md:px-8 font-black text-[10px] md:text-sm"
                >
                  {isEditing ? <Save className="mr-2 size-3 md:size-5" /> : <Edit2 className="mr-2 size-3 md:size-5" />}
                  {isEditing ? "Sauvegarder" : "Modifier"}
                </Button>

                {isEditing && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="rounded-2xl h-10 md:h-12 px-4 md:px-6 font-black shadow-xl shadow-destructive/20">
                        <Trash2 className="size-3 md:size-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2.5rem] w-[95%]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black">Supprimer définitivement ?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-sm">
                          Cette action effacera toutes les données scolaires de l'élève {student.fullName || student.matricule}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black">
                          Confirmer
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
              className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-10 md:h-12 px-4 md:px-8 font-black text-[10px] md:text-sm"
            >
              {analyzing ? <Loader2 className="mr-2 size-3 md:size-5 animate-spin" /> : <Sparkles className="mr-2 size-3 md:size-5" />}
              Analyser (IA)
            </Button>
          </div>
        </div>

        {/* Hero Card */}
        <Card className={cn("border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]", isArchived && "grayscale")}>
          <div className={cn("h-24 md:h-32 relative", isArchived ? "bg-muted" : "bg-primary")} />
          <CardContent className="pt-12 md:pt-16 pb-8 md:pb-10 px-6 md:px-16">
            <div className="absolute -top-10 md:-top-12 left-6 md:left-16">
              <Avatar className="size-24 md:size-40 border-4 md:border-8 border-white shadow-2xl">
                <AvatarImage src={`https://picsum.photos/seed/${student.id}/400/400`} />
                <AvatarFallback className="bg-primary text-white text-3xl md:text-5xl font-black">{(student.lastName || "??").substring(0, 2)}</AvatarFallback>
              </Avatar>
              {isArchived && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Archive className="size-8 md:size-12 text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
              <div className="space-y-3 flex-1 w-full max-w-md">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="font-black text-[9px] uppercase text-muted-foreground">Nom complet</Label>
                      <Input 
                        value={editForm.fullName} 
                        onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                        className="h-10 md:h-12 rounded-xl font-bold"
                        placeholder="Ex: Koffi Djimon"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="font-black text-[9px] uppercase text-muted-foreground">Classe</Label>
                        <Input 
                          value={editForm.classId} 
                          onChange={e => setEditForm({...editForm, classId: e.target.value})} 
                          className="h-10 md:h-11 rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-black text-[9px] uppercase text-muted-foreground">Matricule</Label>
                        <Input 
                          value={editForm.matricule} 
                          onChange={e => setEditForm({...editForm, matricule: e.target.value})} 
                          className="h-10 md:h-11 rounded-xl font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <h1 className="text-xl md:text-4xl font-black text-foreground uppercase truncate max-w-[200px] md:max-w-none">{student.lastName} {student.firstName}</h1>
                      <Badge className={cn("px-3 md:px-5 py-0.5 md:py-1 rounded-full font-black text-[10px] md:text-sm", isArchived ? "bg-muted text-muted-foreground" : "bg-primary text-white")}>
                        {student.classId} {isArchived && "(ARCHIVÉ)"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2 md:gap-3 font-semibold text-[10px] md:text-base">
                      ID: {student.matricule} • {student.academicYear}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 md:gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none text-center px-4 md:px-6 py-2 md:py-3 bg-muted/50 rounded-2xl md:rounded-3xl border border-muted">
                  <p className="text-[8px] md:text-[10px] uppercase font-black text-muted-foreground mb-1">Moyenne</p>
                  <p className="text-lg md:text-2xl font-black text-primary">{student.average || "0.00"}</p>
                </div>
                <div className="flex-1 md:flex-none text-center px-4 md:px-6 py-2 md:py-3 bg-muted/50 rounded-2xl md:rounded-3xl border border-muted">
                  <p className="text-[8px] md:text-[10px] uppercase font-black text-muted-foreground mb-1">Rang</p>
                  <p className="text-lg md:text-2xl font-black text-foreground">---</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="informations" className="space-y-6 md:space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-12 md:h-14 p-1 flex w-full md:w-fit overflow-x-auto no-scrollbar scroll-smooth">
            <TabsTrigger value="informations" className="flex-1 md:flex-none rounded-xl md:rounded-2xl font-bold px-4 md:px-8 text-[10px] md:text-sm">Infos</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 md:flex-none rounded-xl md:rounded-2xl font-bold px-4 md:px-8 text-[10px] md:text-sm">Notes</TabsTrigger>
            <TabsTrigger value="absences" className="flex-1 md:flex-none rounded-xl md:rounded-2xl font-bold px-4 md:px-8 text-[10px] md:text-sm">Absences</TabsTrigger>
            <TabsTrigger value="finance" className="flex-1 md:flex-none rounded-xl md:rounded-2xl font-bold px-4 md:px-8 text-[10px] md:text-sm">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="informations" className="space-y-6 animate-in slide-in-from-right-4">
             <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <Card className="premium-card p-6 md:p-8 space-y-6">
                  <h3 className="text-lg md:text-xl font-black flex items-center gap-3"><Info className="text-primary size-4 md:size-5" /> Détails Officiels</h3>
                  <div className="grid grid-cols-2 gap-y-6 text-xs md:text-sm">
                    <div><p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1">Statut Compte</p><Badge variant="outline" className={cn("font-bold text-[9px] md:text-xs", isArchived ? "border-amber-200 text-amber-600" : "border-primary/20 text-primary")}>{student.status}</Badge></div>
                    <div><p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1">Nationalité</p><p className="font-bold">Béninoise</p></div>
                    <div><p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1">Genre</p><p className="font-bold">{student.gender || '---'}</p></div>
                    <div><p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1">Année</p><p className="font-bold">{student.academicYear}</p></div>
                  </div>
                </Card>
                <Card className="premium-card p-6 md:p-8 space-y-6">
                  <h3 className="text-lg md:text-xl font-black flex items-center gap-3"><ShieldCheck className="text-primary size-4 md:size-5" /> Sécurité</h3>
                  <div className="space-y-4">
                    <p className="text-[10px] md:text-sm font-medium text-muted-foreground leading-relaxed">
                      L'historique de cet élève est scellé. Toute modification est journalisée dans l'audit.
                    </p>
                    <div className="p-4 md:p-6 bg-muted/30 rounded-2xl md:rounded-3xl border-2 border-dashed border-muted-foreground/10 text-center">
                       <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-2">Code archives</p>
                       <div className="font-mono text-[8px] md:text-xs text-muted-foreground break-all">
                         ACADEX_VAULT_{student.matricule}
                       </div>
                    </div>
                  </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card className="premium-card p-12 md:p-20 text-center border-4 border-dashed bg-muted/10">
              <FileText className="size-12 md:size-16 text-muted-foreground mx-auto mb-6 opacity-30" />
              <h3 className="text-xl md:text-2xl font-black">Consulter les Archives</h3>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto text-xs md:text-base">Les relevés de notes scellés sont consultables par trimestre.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
