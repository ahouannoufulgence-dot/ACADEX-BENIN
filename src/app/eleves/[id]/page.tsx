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
  UserCheck,
  ShieldAlert,
  RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { generateAcademicFeedback, type GenerateAcademicFeedbackOutput } from "@/ai/flows/generate-academic-feedback"
import { supabase } from "@/lib/supabase"
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

function FinanceTab({ studentMatricule, activeYear }: { studentMatricule: string, activeYear: string }) {
  const [payments, setPayments] = useState<any[]>([])
  const [expectedFee, setExpectedFee] = useState(150000)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFinance = async () => {
      setLoading(true)
      const { data: studentData } = await supabase.from('students').select('class_id').eq('matricule', studentMatricule).single()
      if (studentData?.class_id) {
        const { data: feeData } = await supabase.from('class_fees').select('amount').eq('class_id', studentData.class_id).eq('academic_year', activeYear).single()
        if (feeData) setExpectedFee(Number(feeData.amount))
      }
      const { data: payData } = await supabase.from('payments').select('*').eq('student_matricule', studentMatricule).eq('academic_year', activeYear).order('payment_date', { ascending: false })
      setPayments(payData || [])
      setLoading(false)
    }
    if (studentMatricule) fetchFinance()
  }, [studentMatricule, activeYear])

  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount_paid) || 0), 0)
  const remaining = expectedFee - totalPaid
  const percent = Math.min(100, (totalPaid / expectedFee) * 100)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6 rounded-[1.5rem] border-none shadow-sm bg-white">
          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Total Versé</p>
          <p className="text-2xl font-black text-emerald-600">{totalPaid.toLocaleString()} F</p>
        </Card>
        <Card className="p-6 rounded-[1.5rem] border-none shadow-sm bg-white border-l-4 border-amber-500">
          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Reste à payer</p>
          <p className="text-2xl font-black text-amber-600">{remaining.toLocaleString()} F</p>
        </Card>
        <Card className="p-6 rounded-[1.5rem] border-none shadow-sm bg-foreground text-white">
          <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-2">Progression</p>
          <p className="text-2xl font-black">{percent.toFixed(1)}%</p>
          <div className="w-full bg-white/10 h-2 rounded-full mt-2">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
        </Card>
      </div>
      <Card className="border-none shadow-sm bg-white rounded-[1.5rem] overflow-hidden">
        <div className="p-5 border-b bg-muted/5">
          <h3 className="font-black text-base uppercase">Historique des versements</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin text-primary size-6 mx-auto" /></div>
        ) : payments.length === 0 ? (
          <div className="p-16 text-center opacity-30">
            <p className="font-black text-xs uppercase">Aucun versement enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-muted/20">
            {payments.map((p, i) => (
              <div key={i} className="p-5 flex items-center justify-between hover:bg-muted/5">
                <div>
                  <p className="font-black text-sm">{Number(p.amount_paid).toLocaleString()} F</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">
                    {p.note || 'Scolarité'} • {p.payment_date ? new Date(p.payment_date).toLocaleDateString('fr-FR') : ''}
                  </p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[9px]">Validé</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default function StudentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [loadingStudent, setLoadingStudent] = useState(true)
  
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
  const [grades, setGrades] = useState<any[]>([])
  const [selectedTrimestre, setSelectedTrimestre] = useState("T1")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [presences, setPresences] = useState<any[]>([])
  const [sanctions, setSanctions] = useState<any[]>([])
  const [conductConfig, setConductConfig] = useState<any>({ note_depart: 20 })

  const fetchStudent = async () => {
    setLoadingStudent(true)
    const { data } = await supabase.from('students').select('*').eq('id', id).single()
    setStudent(data)
    if (data?.student_matricule || data?.matricule) {
      await fetchGrades(data.student_matricule || data.matricule)
    }
    setLoadingStudent(false)
  }

  const fetchGrades = async (studentMatricule: string) => {
    const year = localStorage.getItem('acadex_active_year') || "2026-2027"
    setActiveYear(year)
    const [gradesRes, presRes, sanctRes, configRes] = await Promise.all([
      supabase.from('grades').select('*').eq('student_matricule', studentMatricule).eq('academic_year', year),
      supabase.from('presences').select('*').eq('student_matricule', studentMatricule).eq('academic_year', year).order('date', { ascending: false }),
      supabase.from('sanctions').select('*').eq('student_matricule', studentMatricule).eq('academic_year', year).order('date', { ascending: false }),
      supabase.from('conduct_config').select('*').eq('id', 'main').single()
    ])
    setGrades(gradesRes.data || [])
    setPresences(presRes.data || [])
    setSanctions(sanctRes.data || [])
    if (configRes.data) setConductConfig(configRes.data)
  }

  useEffect(() => {
    setIsDirector(localStorage.getItem('acadex_user_role') === "Directeur")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    fetchStudent()
  }, [id])

  useEffect(() => {
    if (student) {
      setEditForm({
        fullName: `${student.last_name} ${student.first_name}`,
        matricule: student.matricule || "",
        classId: student.class_id || "",
        status: student.status || ""
      })
    }
  }, [student])

  const handleUpdate = async () => {
    const [firstName, ...rest] = editForm.fullName.split(' ')
    await supabase.from('students').update({
      first_name: firstName,
      last_name: rest.join(' '),
      matricule: editForm.matricule,
      class_id: editForm.classId,
      status: editForm.status
    }).eq('id', id)
    setIsEditing(false)
    toast({ title: "Profil mis à jour", description: "Les modifications ont été enregistrées." })
    fetchStudent()
  }

  const handleArchive = async () => {
    try {
      await supabase.from('students').update({ status: "Archivé" }).eq('id', id)
      toast({ title: "Élève archivé", description: "Le profil a été déplacé vers le coffre-fort numérique." })
      router.push("/eleves")
    } catch (e) {
      toast({ title: "Erreur d'archivage", variant: "destructive" })
    }
  }

  const handleRestore = async () => {
    try {
      await supabase.from('students').update({ status: "Actif" }).eq('id', id)
      toast({ title: "Profil restauré", description: "L'élève est de nouveau actif dans l'école." })
      fetchStudent()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    await supabase.from('students').delete().eq('id', id)
    toast({ title: "Élève supprimé" })
    router.push("/eleves")
  }

  const handleAnalyzeResults = async () => {
    if (!student) return
    setAnalyzing(true)
    try {
      const input = {
        studentName: `${student.last_name} ${student.first_name}`,
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
                          Cette action effacera toutes les données scolaires de l'élève {student.matricule}.
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

        <Card className={cn("border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]", isArchived && "grayscale")}>
          <div className={cn("h-24 md:h-32 relative", isArchived ? "bg-muted" : "bg-primary")} />
          <CardContent className="pt-12 md:pt-16 pb-8 md:pb-10 px-6 md:px-16">
            <div className="absolute -top-10 md:-top-12 left-6 md:left-16">
              <Avatar className="size-24 md:size-40 border-4 md:border-8 border-white shadow-2xl">
                <AvatarImage src={`https://picsum.photos/seed/${student.id}/400/400`} />
                <AvatarFallback className="bg-primary text-white text-3xl md:text-5xl font-black">{(student.last_name || "??").substring(0, 2)}</AvatarFallback>
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
                      <h1 className="text-xl md:text-4xl font-black text-foreground uppercase truncate max-w-[200px] md:max-w-none">{student.last_name} {student.first_name}</h1>
                      <Badge className={cn("px-3 md:px-5 py-0.5 md:py-1 rounded-full font-black text-[10px] md:text-sm", isArchived ? "bg-muted text-muted-foreground" : "bg-primary text-white")}>
                        {student.class_id} {isArchived && "(ARCHIVÉ)"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2 md:gap-3 font-semibold text-[10px] md:text-base">
                      ID: {student.matricule} • {student.academic_year}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 md:gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none text-center px-4 md:px-6 py-2 md:py-3 bg-muted/50 rounded-2xl md:rounded-3xl border border-muted">
                  <p className="text-[8px] md:text-[10px] uppercase font-black text-muted-foreground mb-1">Moyenne</p>
                  <p className="text-lg md:text-2xl font-black text-primary">
                    {grades.filter(g => g.term === selectedTrimestre).length > 0
                      ? (grades.filter(g => g.term === selectedTrimestre).reduce((acc: number, g: any) => acc + Number(g.value), 0) / grades.filter(g => g.term === selectedTrimestre).length).toFixed(2)
                      : "0.00"}
                  </p>
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
                  <div><p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1">Année</p><p className="font-bold">{student.academic_year}</p></div>
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
            <div className="flex gap-2">
              {["T1","T2","T3"].map(t => (
                <button key={t} onClick={() => setSelectedTrimestre(t)}
                  className={`h-10 px-6 rounded-xl font-black text-xs uppercase transition-all border-2 ${selectedTrimestre === t ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-muted hover:border-primary/30"}`}>
                  {t === "T1" ? "1er Trimestre" : t === "T2" ? "2ème Trimestre" : "3ème Trimestre"}
                </button>
              ))}
            </div>
            <Card className="border-none shadow-sm bg-white rounded-[1.5rem] overflow-hidden">
              {(() => {
                const trimGrades = grades.filter(g => g.term === selectedTrimestre)
                const subjects = [...new Set(trimGrades.map(g => g.subject))]
                if (subjects.length === 0) return (
                  <div className="p-16 text-center">
                    <FileText className="size-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="font-black text-muted-foreground uppercase text-xs">Aucune note pour ce trimestre</p>
                  </div>
                )
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead className="bg-primary text-white text-[9px] md:text-[10px] font-black uppercase">
                        <tr>
                          <th className="px-5 py-4 md:px-8 md:py-5">Matière</th>
                          <th className="px-4 py-4 md:px-6 md:py-5 text-center">INT 1</th>
                          <th className="px-4 py-4 md:px-6 md:py-5 text-center">INT 2</th>
                          <th className="px-4 py-4 md:px-6 md:py-5 text-center">INT 3</th>
                          <th className="px-4 py-4 md:px-6 md:py-5 text-center">DEV 1</th>
                          <th className="px-4 py-4 md:px-6 md:py-5 text-center">DEV 2</th>
                          <th className="px-4 py-4 md:px-6 md:py-5 text-center bg-white/20">Moyenne</th>
                          <th className="px-4 py-4 md:px-6 md:py-5 text-center bg-white/10">Coef</th>
                          <th className="px-4 py-4 md:px-6 md:py-5 text-center bg-white/20">Moy×Coef</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/10">
                        {subjects.map(subject => {
                          const sg = trimGrades.filter(g => g.subject === subject)
                          const get = (type: string) => sg.find(g => g.type === type)?.value ?? null
                          const i1 = get("int1"), i2 = get("int2"), i3 = get("int3")
                          const d1 = get("dev1"), d2 = get("dev2")
                          const coef = sg[0]?.coefficient || 1
                          const interros = [i1,i2,i3].filter(v => v !== null) as number[]
                          const avgInt = interros.length ? interros.reduce((a,b) => a+b,0)/interros.length : null
                          const blocks = [...(avgInt !== null ? [avgInt] : []), ...(d1 !== null ? [d1] : []), ...(d2 !== null ? [d2] : [])]
                          const moy = blocks.length ? blocks.reduce((a,b) => a+b,0)/blocks.length : null
                          const moyCoef = moy !== null ? moy * coef : null
                          const fmt = (v: number | null) => v !== null ? v.toFixed(2) : "--"
                          return (
                            <tr key={subject} className="hover:bg-muted/5 transition-all">
                              <td className="px-5 py-4 md:px-8 md:py-5 font-black text-xs md:text-sm uppercase">{subject}</td>
                              <td className="px-4 py-4 md:px-6 md:py-5 text-center font-bold tabular-nums text-sm">{fmt(i1)}</td>
                              <td className="px-4 py-4 md:px-6 md:py-5 text-center font-bold tabular-nums text-sm">{fmt(i2)}</td>
                              <td className="px-4 py-4 md:px-6 md:py-5 text-center font-bold tabular-nums text-sm">{fmt(i3)}</td>
                              <td className="px-4 py-4 md:px-6 md:py-5 text-center font-bold tabular-nums text-sm">{fmt(d1)}</td>
                              <td className="px-4 py-4 md:px-6 md:py-5 text-center font-bold tabular-nums text-sm">{fmt(d2)}</td>
                              <td className="px-4 py-4 md:px-6 md:py-5 text-center">
                                <span className={`px-3 py-1 rounded-lg font-black text-sm ${moy === null ? "text-muted-foreground" : moy >= 10 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{fmt(moy)}</span>
                              </td>
                              <td className="px-4 py-4 md:px-6 md:py-5 text-center font-bold text-sm text-muted-foreground">{coef}</td>
                              <td className="px-4 py-4 md:px-6 md:py-5 text-center">
                                <span className="px-3 py-1 rounded-lg font-black text-sm bg-primary/5 text-primary">{fmt(moyCoef)}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </Card>
          </TabsContent>

          <TabsContent value="absences" className="space-y-6 animate-in slide-in-from-right-4">
            <Card className="p-16 text-center border-none shadow-sm bg-white rounded-[1.5rem]">
              <p className="font-black text-muted-foreground uppercase text-xs opacity-30">Module absences à venir</p>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6 animate-in slide-in-from-right-4">
            <FinanceTab studentMatricule={student.matricule} activeYear={activeYear} />
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  )
}