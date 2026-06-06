
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Plus, 
  ChevronRight,
  Loader2,
  Users,
  Zap,
  CheckCircle2,
  Filter,
  FileDown,
  Trash2,
  MoreVertical,
  Edit2,
  Copy
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, orderBy, where, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const officialClasses = ["6ème A", "6ème B", "5ème A", "5ème B", "4ème A", "4ème B", "4ème C", "3D1", "3D2", "2nde C", "2nde D", "1ère D", "Terminale D1", "Terminale D2"]

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [batchCount, setBatchCount] = useState("30")
  const [selectedClass, setSelectedClass] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDirector, setIsDirector] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<any>(null)
  
  const db = useFirestore()

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role') || "Élève"
    const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")
    setUserRole(role)
    setIsDirector(role === "Directeur")
    setUserClasses(classes)
  }, [])

  // Stabilisation de la requête pour éviter les boucles de rendu
  const studentsQuery = useMemo(() => {
    if (!db || !userRole) return null
    const ref = collection(db, 'students')
    
    if (userRole === "Professeur" && userClasses.length > 0) {
      return query(ref, where("classId", "in", userClasses), orderBy("matricule", "asc"))
    }
    
    return query(ref, orderBy("matricule", "asc"))
  }, [db, userRole, userClasses])

  const { data: students, loading } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      (s.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.matricule?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  const handleBatchGenerate = () => {
    if (!selectedClass || !batchCount) {
      toast({ title: "Champs manquants", description: "Veuillez choisir une classe et un nombre.", variant: "destructive" })
      return
    }

    setIsGenerating(true)
    const count = parseInt(batchCount)
    const year = "2024-2025"
    const classTag = selectedClass.replace(/\s/g, '').toUpperCase() // Force uppercase for consistency

    const creations = Array.from({ length: count }).map((_, i) => {
      const randomNum = Math.floor(100 + Math.random() * 900)
      const matricule = `ELV-${classTag}-${randomNum}`
      
      const studentData = {
        fullName: "",
        matricule: matricule.toUpperCase(), // Toujours stocker en majuscules
        classId: selectedClass,
        status: "En attente d'activation",
        academicYear: year,
        createdAt: serverTimestamp()
      }

      return addDoc(collection(db, "students"), studentData).catch(async () => {
        const error = new FirestorePermissionError({
          path: 'students',
          operation: 'create',
          requestResourceData: studentData
        })
        errorEmitter.emit('permission-error', error)
      })
    })

    Promise.all(creations).then(() => {
      toast({ title: "Génération terminée", description: `${count} matricules créés pour la ${selectedClass}.` })
      setIsGenerating(false)
      setIsDialogOpen(false)
    })
  }

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text)
      toast({ title: "Copié !", description: `${text} est prêt à être partagé.` })
    } catch (err) {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast({ title: "Copié !", description: `${text} est prêt.` })
    }
  }

  const handleExportPDF = () => {
    if (filteredStudents.length === 0) return
    const docPdf = new jsPDF()
    docPdf.setFillColor(20, 83, 45)
    docPdf.rect(0, 0, 210, 30, 'F')
    docPdf.setTextColor(255, 255, 255)
    docPdf.setFontSize(16)
    docPdf.text(`ACADEX - LISTE DES MATRICULES OFFICIELS`, 105, 20, { align: "center" })

    autoTable(docPdf, {
      startY: 40,
      head: [['Élève', 'Classe', 'Matricule', 'Statut']],
      body: filteredStudents.map((s: any) => [s.fullName || "A COMPLÉTER", s.classId, s.matricule, s.status]),
      headStyles: { fillColor: [20, 83, 45] }
    })
    docPdf.save(`MATRICULES_ELV_${new Date().getTime()}.pdf`)
  }

  const confirmDelete = () => {
    if (!studentToDelete) return
    const studentRef = doc(db, "students", studentToDelete.id)
    deleteDoc(studentRef).catch(async () => {
      const error = new FirestorePermissionError({
        path: studentRef.path,
        operation: 'delete'
      })
      errorEmitter.emit('permission-error', error)
    })
    toast({ title: "Élève supprimé", description: `Le matricule ${studentToDelete.matricule} a été révoqué.` })
    setStudentToDelete(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              {isDirector ? "Pilotage des Élèves" : "Mes Classes"}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium italic">"Gérez les identifiants et les accès de vos élèves."</p>
          </div>
          {isDirector && (
            <div className="flex items-center gap-3">
              <Button onClick={handleExportPDF} variant="outline" className="border-2 rounded-2xl h-12 px-6 font-black bg-white">
                <FileDown className="mr-2 size-5" /> Exporter PDF
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-600/20 rounded-2xl h-12 px-6 font-black">
                    <Zap className="mr-2 size-5 fill-white" /> Génération Express
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] p-10 max-w-md border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-center">Génération de Matricules</DialogTitle>
                    <DialogDescription className="font-medium text-center">Créez massivement des comptes élèves pour une classe.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase text-muted-foreground">Classe cible</Label>
                      <Select onValueChange={setSelectedClass}>
                        <SelectTrigger className="h-12 rounded-xl font-bold border-2"><SelectValue placeholder="Choisir la classe" /></SelectTrigger>
                        <SelectContent>{officialClasses.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase text-muted-foreground">Nombre d'élèves</Label>
                      <Input type="number" value={batchCount} onChange={(e) => setBatchCount(e.target.value)} className="h-12 rounded-xl font-black text-lg border-2" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleBatchGenerate} disabled={isGenerating} className="w-full bg-primary h-14 rounded-2xl font-black text-lg shadow-xl">
                      {isGenerating ? <Loader2 className="mr-2 size-5 animate-spin" /> : <CheckCircle2 className="mr-2 size-5" />} Lancer la génération
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <div className="relative group max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Chercher par nom ou matricule..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
          />
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="size-10 animate-spin text-primary" /></div>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-16 text-center bg-white rounded-[3.5rem] border-none shadow-sm">
              <Users className="size-16 text-muted-foreground mx-auto mb-6 opacity-20" />
              <h3 className="text-xl font-black">Aucun élève trouvé</h3>
              <p className="text-muted-foreground font-medium">Utilisez la Génération Express pour cette classe.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredStudents.map((student: any) => (
                <div key={student.id}>
                  <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all group">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <Avatar className="size-14 border-4 border-muted group-hover:border-primary/20 transition-all">
                          <AvatarFallback className="bg-primary/5 text-primary font-black">{(student.fullName || "?").substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{student.fullName || "Compte à activer"}</h3>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-primary/10 text-primary border-none font-black text-[10px]">{student.classId}</Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{student.matricule}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-6 rounded-md hover:bg-primary/10 hover:text-primary"
                                onClick={() => copyToClipboard(student.matricule)}
                              >
                                <Copy className="size-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`font-black rounded-full px-4 border-2 ${student.status === "Actif" ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-amber-100 text-amber-600 bg-amber-50"}`}>
                          {student.status.toUpperCase()}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-10 rounded-xl"><MoreVertical className="size-5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-2 w-48 p-2">
                            <DropdownMenuItem asChild>
                              <Link href={`/eleves/${student.id}`} className="flex items-center gap-2 font-bold cursor-pointer w-full">
                                <Edit2 className="size-4" /> Gérer le profil
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive flex items-center gap-2 font-bold cursor-pointer"
                              onSelect={() => setStudentToDelete(student)}
                            >
                              <Trash2 className="size-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Supprimer cet identifiant ?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              Voulez-vous vraiment supprimer le matricule <span className="font-black text-foreground">{studentToDelete?.matricule}</span> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black px-6">
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
