
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
import { collection, query, deleteDoc, doc, where, onSnapshot, orderBy } from "firebase/firestore"
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
    
    const savedYear = localStorage.getItem('acadex_active_year') || "2026-2027"
    setActiveYear(savedYear)

    const updateYear = (e: any) => {
      if (e.detail) setActiveYear(e.detail)
    }
    
    window.addEventListener('acadex_year_changed', updateYear as any)
    
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

  const studentsQuery = useMemo(() => {
    if (!db || !userRole) return null
    const baseCol = collection(db, "students")
    // CLASSEMENT ALPHABÉTIQUE AUTOMATIQUE PAR NOM
    if (userRole === "Enseignant" && userClasses.length > 0) {
      return query(
        baseCol, 
        where("academicYear", "==", activeYear), 
        where("classId", "in", userClasses),
        orderBy("lastName", "asc")
      )
    }
    return query(baseCol, where("academicYear", "==", activeYear), orderBy("lastName", "asc"))
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
      <div className="space-y-6 md:space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              {userRole === "Enseignant" ? "Mes Élèves" : "Gestion des Élèves"}
            </h1>
            <div className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> <span className="text-xs md:text-sm">Année <Badge className="bg-primary text-[10px] md:text-xs">{activeYear}</Badge></span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button onClick={handleExportPDF} variant="outline" className="flex-1 md:flex-none border-2 rounded-2xl h-12 px-4 md:px-6 font-black bg-white text-xs md:text-sm">
              <FileDown className="mr-2 size-4 md:size-5" /> Exporter
            </Button>
            {userRole === "Directeur" && (
              <Button asChild className="flex-1 md:flex-none bg-primary hover:bg-primary/90 shadow-xl rounded-2xl h-12 px-4 md:px-8 font-black text-xs md:text-sm">
                <Link href="/eleves/identifiants">Identifiants</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Rechercher un élève..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium text-sm md:text-base"
          />
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Récupération de la classe...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-12 md:p-20 text-center bg-white rounded-[2.5rem] border-none shadow-sm flex flex-col items-center justify-center space-y-6">
              <div className="size-16 md:size-20 bg-muted rounded-full flex items-center justify-center opacity-20">
                <Users className="size-8 md:size-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-black">Aucun élève trouvé</h3>
                <p className="text-muted-foreground text-sm font-medium max-w-xs mx-auto">Vérifiez l'orthographe ou l'année active.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student: any) => (
                <Card key={student.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="size-14 border-4 border-muted group-hover:border-primary/20 transition-all">
                        <AvatarFallback className="bg-primary text-white font-black text-lg">{student.lastName?.[0]}{student.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors truncate uppercase">{student.lastName} {student.firstName}</h3>
                        <div className="flex items-center gap-2">
                           <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-2">{student.classId}</Badge>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase">{student.matricule}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-10 rounded-xl mobile-touch-target"><MoreVertical className="size-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-2 w-48 p-2">
                          <DropdownMenuItem asChild>
                            <Link href={`/eleves/${student.id}`} className="flex items-center gap-2 font-bold cursor-pointer w-full p-2">
                              <UserCircle2 className="size-4" /> Voir Profil
                            </Link>
                          </DropdownMenuItem>
                          {userRole === "Directeur" && (
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive flex items-center gap-2 font-bold cursor-pointer p-2"
                              onSelect={() => setStudentToDelete(student)}
                            >
                              <Trash2 className="size-4" /> Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-muted/30">
                       <div className="flex items-center gap-2">
                          <div className="size-8 bg-muted rounded-lg flex items-center justify-center"><Phone className="size-3 text-muted-foreground" /></div>
                          <span className="text-[10px] font-bold text-foreground">{student.phone || "---"}</span>
                       </div>
                       <Button variant="ghost" size="sm" asChild className="text-primary font-black text-[10px] rounded-lg h-8 px-3 hover:bg-primary/5">
                          <Link href={`/eleves/${student.id}`}>Profil <ChevronRight className="ml-1 size-3" /></Link>
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem] w-[90%] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Supprimer ?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-sm">
              Confirmez-vous la suppression de <span className="font-black text-foreground">{studentToDelete?.lastName}</span> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold flex-1">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black flex-1">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
