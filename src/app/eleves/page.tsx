
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Plus, 
  ChevronRight,
  FileDown,
  Printer,
  Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useState, useMemo, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, orderBy, where } from "firebase/firestore"

const officialClasses = [
  "6ème A", "6ème B", "5ème A", "5ème B", "4ème A", "4ème B", "4ème C", "3D1", "3D2", "2nde C", "2nde D", "1ère D", "Terminale D1", "Terminale D2"
]

export default function StudentsPage() {
  const [isGeneratingIDs, setIsGeneratingIDs] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState("")
  const [teacherClasses, setTeacherClasses] = useState<string[]>([])
  
  const [batchClass, setBatchClass] = useState("")
  const [batchQuantity, setBatchQuantity] = useState("40")

  const db = useFirestore()

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role') || ""
    const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")
    setUserRole(role)
    setTeacherClasses(classes)
  }, [])

  const studentsQuery = useMemo(() => {
    if (!db) return null
    const ref = collection(db, 'students')
    
    // Restriction : Si professeur, ne voir que ses classes
    if (userRole === "Professeur" && teacherClasses.length > 0) {
      return query(ref, where("classId", "in", teacherClasses), orderBy("matricule", "asc"))
    }
    
    // Si Directeur ou Admin, tout voir
    return query(ref, orderBy("matricule", "asc"))
  }, [db, userRole, teacherClasses])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      (s.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.matricule?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  const handleGenerateBatchPDF = async () => {
    if (!batchClass) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une classe.", variant: "destructive" });
      return;
    }
    
    setLoadingPdf(true);
    try {
      const doc = new jsPDF();
      const quantity = parseInt(batchQuantity);
      const classSlug = batchClass.replace(/[^a-zA-Z0-9]/g, "");
      
      doc.setFillColor(20, 83, 45);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("ACADEX - IDENTIFIANTS OFFICIELS", 105, 18, { align: "center" });
      doc.setFontSize(14);
      doc.text(`CLASSE : ${batchClass} | ANNÉE : 2025-2026`, 105, 28, { align: "center" });
      
      autoTable(doc, {
        startY: 50,
        head: [['#', 'Identifiant', 'Nom & Prénoms', 'Code Activation']],
        body: Array.from({ length: quantity }).map((_, i) => [
          i + 1, 
          `ELV-${classSlug}-${(i + 1).toString().padStart(3, '0')}`,
          "..................................................",
          Math.random().toString(36).substring(2, 8).toUpperCase()
        ]),
        headStyles: { fillColor: [20, 83, 45] }
      });

      doc.save(`ACADEX_IDs_${classSlug}.pdf`);
      toast({ title: "PDF Prêt", description: "Le lot d'identifiants a été généré." });
      setIsGeneratingIDs(false);
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de génération PDF.", variant: "destructive" });
    } finally {
      setLoadingPdf(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              {userRole === "Directeur" ? "Base de Données Élèves" : "Mes Classes assignées"}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {userRole === "Directeur" 
                ? "Pilotage global de tous les élèves de l'établissement." 
                : `Vous gérez actuellement ${teacherClasses.length} classes (${teacherClasses.join(', ')}).`}
            </p>
          </div>
          
          {userRole === "Directeur" && (
            <div className="flex items-center gap-3">
              <Dialog open={isGeneratingIDs} onOpenChange={setIsGeneratingIDs}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white">
                    <FileDown className="mr-2 size-5 text-primary" />
                    Générer Identifiants
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Identifiants par lot</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                      <Label className="font-bold">Classe concernée</Label>
                      <Select onValueChange={setBatchClass}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Choisir une classe" />
                        </SelectTrigger>
                        <SelectContent>
                          {officialClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleGenerateBatchPDF} disabled={loadingPdf} className="bg-primary rounded-xl font-black px-8 h-12 w-full">
                      {loadingPdf ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Printer className="mr-2 size-5" />}
                      Générer le PDF
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
                <Plus className="mr-2 size-5" /> Inscription Manuelle
              </Button>
            </div>
          )}
        </div>

        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Chercher par nom ou matricule..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
          />
        </div>

        <div className="grid gap-4">
          {loadingStudents ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-16 text-center bg-white rounded-[2rem] border-none shadow-sm">
              <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="size-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground italic font-bold">Aucun élève trouvé dans votre périmètre.</p>
            </Card>
          ) : (
            filteredStudents.map((student: any) => (
              <Link key={student.id} href={`/eleves/${student.id}`}>
                <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="size-14 border-4 border-muted group-hover:border-primary/20 transition-all">
                          <AvatarImage src={`https://picsum.photos/seed/${student.id}/150/150`} />
                          <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">{(student.fullName || "??").substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{student.fullName || student.matricule}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-muted text-foreground font-black px-3 py-0.5 rounded-full text-[10px]">{student.classId}</Badge>
                            <span className="text-xs font-bold text-muted-foreground">{student.matricule}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`font-black rounded-full px-4 py-1 border-2 ${student.status === "Actif" ? "border-primary text-primary" : "border-amber-500 text-amber-600"}`}>
                          {student.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="rounded-xl group-hover:text-primary bg-muted/20">
                          <ChevronRight className="size-6" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
