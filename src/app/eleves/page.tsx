"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Loader2,
  Users,
  Filter,
  FileDown,
  Trash2,
  MoreVertical,
  Edit2,
  UserCircle2,
  Phone,
  Calendar,
  ChevronRight,
  ShieldCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, deleteDoc, doc, where, onSnapshot } from "firebase/firestore"
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

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [studentToDelete, setStudentToDelete] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [activeYear, setActiveYear] = useState("2026-2027")
  
  const db = useFirestore()

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role'))
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    
    // Initialisation depuis localStorage ou défaut
    const savedYear = localStorage.getItem('acadex_active_year') || "2026-2027"
    setActiveYear(savedYear)

    // Écouter les changements d'année en temps réel
    const updateYear = (e: any) => {
      if (e.detail) setActiveYear(e.detail)
    }
    
    window.addEventListener('acadex_year_changed', updateYear as any)
    
    // Synchronisation avec la config réelle de l'école pour plus de sécurité
    const unsub = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists() && !localStorage.getItem('acadex_active_year')) {
        setActiveYear(snap.data().academicYear || "2026-2027")
      }
    })

    return () => {
      window.removeEventListener('acadex_year_changed', updateYear as any)
      unsub()
    }
  }, [db])

  // REQUÊTE SÉCURISÉE : Filtrée par ANNÉE SCOLAIRE ACTIVE
  const studentsQuery = useMemo(() => {
    if (!db || !userRole) return null
    
    const baseCol = collection(db, "students")
    
    if (userRole === "Enseignant" && userClasses.length > 0) {
      return query(baseCol, where("academicYear", "==", activeYear), where("classId", "in", userClasses))
    }
    
    // Pour le Directeur, on affiche tous les élèves de l'année active
    return query(baseCol, where("academicYear", "==", activeYear))
  }, [db, userRole, userClasses, activeYear])

  const { data: students, loading } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      (s.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.matricule?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  const confirmDelete = () => {
    if (!studentToDelete) return
    deleteDoc(doc(db, "students", studentToDelete.id))
    toast({ title: "Élève supprimé" })
    setStudentToDelete(null)
  }

  const handleExportPDF = () => {
    if (filteredStudents.length === 0) return
    const docPdf = new jsPDF()
    docPdf.setFillColor(20, 83, 45)
    docPdf.rect(0, 0, 210, 30, 'F')
    docPdf.setTextColor(255, 255, 255)
    docPdf.setFontSize(16)
    docPdf.text(`ACADEX - RÉPERTOIRE DES ÉLÈVES (${activeYear})`, 105, 20, { align: "center" })

    autoTable(docPdf, {
      startY: 40,
      head: [['Matricule', 'Nom', 'Prénom', 'Classe', 'Sexe', 'Téléphone']],
      body: filteredStudents.map((s: any) => [s.matricule, s.lastName.toUpperCase(), s.firstName, s.classId, s.gender, s.phone]),
      headStyles: { fillColor: [20, 83, 45] }
    })
    docPdf.save(`REPERTOIRE_ELEVES_${activeYear}.pdf`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              {userRole === "Enseignant" ? "Mes Élèves" : "Gestion des Élèves"}
            </h1>
            <div className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Univers scolaire de l'année <Badge className="bg-primary">{activeYear}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExportPDF} variant="outline" className="border-2 rounded-2xl h-12 px-6 font-black bg-white">
              <FileDown className="mr-2 size-5" /> Exporter Liste PDF
            </Button>
            {userRole === "Directeur" && (
              <Button asChild className="bg-primary hover:bg-primary/90 shadow-xl rounded-2xl h-12 px-8 font-black">
                <Link href="/eleves/identifiants">Gérer Identifiants</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="relative group max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Chercher par nom, prénom ou matricule..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
          />
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Appel de la promotion {activeYear}...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-20 text-center bg-white rounded-[3.5rem] border-none shadow-sm flex flex-col items-center justify-center space-y-6">
              <div className="size-20 bg-muted rounded-full flex items-center justify-center opacity-20">
                <Users className="size-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Aucun élève trouvé</h3>
                <div className="text-muted-foreground font-medium max-w-sm flex items-center justify-center gap-2">
                  Vérifiez que l'année scolaire <Badge variant="outline" className="border-primary/20 text-primary">{activeYear}</Badge> est la bonne.
                </div>
              </div>
              <Button asChild variant="outline" className="rounded-xl border-2 font-bold">
                <Link href="/eleves/identifiants">Gérer les inscriptions</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredStudents.map((student: any) => (
                <Card key={student.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all group">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Avatar className="size-16 border-4 border-muted group-hover:border-primary/20 transition-all">
                        <AvatarFallback className="bg-primary text-white font-black text-xl">{student.lastName?.[0]}{student.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{student.lastName?.toUpperCase()} {student.firstName}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-1">
                          <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-3">{student.classId}</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{student.matricule}</span>
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><Phone className="size-3" /> {student.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-muted-foreground uppercase">Statut</p>
                        <Badge variant="outline" className="text-[10px] font-black uppercase border-emerald-200 text-emerald-600 bg-emerald-50">{student.status}</Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-10 rounded-xl"><MoreVertical className="size-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-2 w-48 p-2">
                          <DropdownMenuItem asChild>
                            <Link href={`/eleves/${student.id}`} className="flex items-center gap-2 font-bold cursor-pointer w-full">
                              <UserCircle2 className="size-4" /> Voir Profil
                            </Link>
                          </DropdownMenuItem>
                          {userRole === "Directeur" && (
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive flex items-center gap-2 font-bold cursor-pointer"
                              onSelect={() => setStudentToDelete(student)}
                            >
                              <Trash2 className="size-4" /> Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Supprimer définitivement ?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              Voulez-vous supprimer le profil de <span className="font-black text-foreground">{studentToDelete?.lastName} {studentToDelete?.firstName}</span> ?
              Cette action supprimera également toutes ses notes et paiements de l'année {activeYear}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black">
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
