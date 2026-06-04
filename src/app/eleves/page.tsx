
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
  Loader2,
  Users,
  Files
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
import { collection, query, orderBy, where, addDoc, serverTimestamp } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { generateBulletinPDF, type BulletinData } from "@/lib/bulletin-generator"

const officialClasses = [
  "6ème A", "6ème B", "5ème A", "5ème B", "4ème A", "4ème B", "4ème C", "3D1", "3D2", "2nde C", "2nde D", "1ère D", "Terminale D1", "Terminale D2"
]

export default function StudentsPage() {
  const [isGeneratingIDs, setIsGeneratingIDs] = useState(false)
  const [isBulkBulletins, setIsBulkBulletins] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [batchClass, setBatchClass] = useState("")
  const [bulkClass, setBulkClass] = useState("")

  const db = useFirestore()

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role') || "Directeur"
    setUserRole(role)
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
  }, [])

  const studentsQuery = useMemo(() => {
    if (!db || !userRole) return null
    const ref = collection(db, 'students')
    const role = userRole.toLowerCase()

    if ((role === "enseignant" || role === "professeur") && userClasses.length > 0) {
      return query(ref, where("classId", "in", userClasses), orderBy("matricule", "asc"))
    }
    
    if (role === "directeur" || role === "super administrateur") {
      return query(ref, orderBy("matricule", "asc"))
    }

    return null
  }, [db, userRole, userClasses])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      (s.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.matricule?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  const isDirector = userRole.toLowerCase() === "directeur" || userRole.toLowerCase() === "super administrateur"

  const handleGenerateBatchPDF = async () => {
    if (!batchClass) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une classe.", variant: "destructive" });
      return;
    }
    
    setLoadingPdf(true);
    try {
      const doc = new jsPDF();
      const quantity = 40;
      const classSlug = batchClass.replace(/[^a-zA-Z0-9]/g, "");
      
      const newStudentsData = []
      
      for (let i = 0; i < quantity; i++) {
        const matricule = `ELV-${classSlug}-${(i + 1).toString().padStart(3, '0')}`
        const validationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        
        const studentData = {
          matricule,
          classId: batchClass,
          status: "En attente d'activation",
          validationCode,
          academicYear: "2024-2025",
          createdAt: serverTimestamp()
        }

        addDoc(collection(db, "students"), studentData)
          .catch(async () => {
            const error = new FirestorePermissionError({
              path: 'students',
              operation: 'create',
              requestResourceData: studentData
            })
            errorEmitter.emit('permission-error', error)
          })

        newStudentsData.push([i + 1, matricule, "..................................", validationCode])
      }

      doc.setFillColor(20, 83, 45);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("ACADEX - IDENTIFIANTS OFFICIELS", 105, 18, { align: "center" });
      doc.text(`CLASSE : ${batchClass}`, 105, 28, { align: "center" });
      
      autoTable(doc, {
        startY: 50,
        head: [['#', 'Matricule', 'Nom & Prénoms', 'Code Activation']],
        body: newStudentsData,
        headStyles: { fillColor: [20, 83, 45] }
      });

      doc.save(`ACADEX_IDs_${classSlug}.pdf`);
      toast({ title: "Succès", description: "Les identifiants ont été générés." });
      setIsGeneratingIDs(false);
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de génération.", variant: "destructive" });
    } finally {
      setLoadingPdf(false);
    }
  }

  const handleBulkBulletins = async () => {
    if (!bulkClass) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une classe.", variant: "destructive" });
      return;
    }

    setLoadingPdf(true)
    toast({ title: "Génération en série", description: `Préparation des bulletins pour la classe ${bulkClass}...` })
    
    try {
      // Simulate multiple generation
      for (let i = 0; i < 3; i++) {
        const mockData: BulletinData = {
          schoolInfo: {
            name: "Collège Acadex Elite",
            motto: "Discipline - Travail - Succès",
            address: "Cotonou, Bénin",
            phone: "+229 97 00 00 00",
            academicYear: "2024-2025"
          },
          student: {
            id: `ELV-${i}`,
            fullName: i === 0 ? "Koffi Djimon" : i === 1 ? "Amoussou Marie" : "Tidjani Amadou",
            matricule: `AC-2024-0${42 + i}`,
            classId: bulkClass,
            dob: "12/04/2006",
            sex: "M",
            rank: i + 1,
            effectif: 42,
            principalTeacher: "M. Dossou Marc"
          },
          term: "1er Trimestre",
          grades: [
            { subject: "Mathématiques", coef: 5, quiz: 18, exam: 17, avg: 17.5, weighted: 87.5, rank: i + 1, appreciation: "Excellent." },
            { subject: "Français", coef: 3, quiz: 14, exam: 13, avg: 13.5, weighted: 40.5, rank: i + 5, appreciation: "Satisfaisant." },
          ],
          discipline: { absencesJustified: 0, absencesUnjustified: 0, delays: 0, behavior: "Excellent" },
          councilDecision: "Félicitations du jury"
        }
        await generateBulletinPDF(mockData)
      }
      toast({ title: "Succès", description: "Bulletins de classe générés avec succès." })
      setIsBulkBulletins(false)
    } catch (e) {
      toast({ title: "Erreur", description: "Échec lors de la génération groupée.", variant: "destructive" })
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              {isDirector ? "Base de Données Élèves" : "Mes Classes assignées"}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {isDirector 
                ? "Pilotage global et édition des bulletins officiels." 
                : `Gestion pédagogique de vos classes (${userClasses.join(', ')}).`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isDirector && (
              <>
                <Dialog open={isGeneratingIDs} onOpenChange={setIsGeneratingIDs}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white">
                      <FileDown className="mr-2 size-5 text-primary" />
                      IDs par Lot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
                    <DialogHeader><DialogTitle className="text-2xl font-black">Générer Identifiants</DialogTitle></DialogHeader>
                    <div className="py-6"><Select onValueChange={setBatchClass}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Choisir une classe" /></SelectTrigger><SelectContent>{officialClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <DialogFooter><Button onClick={handleGenerateBatchPDF} disabled={loadingPdf} className="bg-primary rounded-xl font-black px-8 h-12 w-full">{loadingPdf ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Printer className="mr-2 size-5" />} Générer & PDF</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isBulkBulletins} onOpenChange={setIsBulkBulletins}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white border-primary text-primary hover:bg-primary/5">
                      <Files className="mr-2 size-5" />
                      Bulletins de Classe
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
                    <DialogHeader><DialogTitle className="text-2xl font-black">Bulletins Massifs</DialogTitle></DialogHeader>
                    <div className="py-6"><Select onValueChange={setBulkClass}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Choisir la classe entière" /></SelectTrigger><SelectContent>{officialClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <DialogFooter><Button onClick={handleBulkBulletins} disabled={loadingPdf} className="bg-primary rounded-xl font-black px-8 h-12 w-full">{loadingPdf ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Download className="mr-2 size-5" />} Générer Série PDF</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <Button className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
              <Plus className="mr-2 size-5" /> Inscription
            </Button>
          </div>
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
            <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-16 text-center bg-white rounded-[2rem] border-none shadow-sm">
              <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4"><Users className="size-8 text-muted-foreground" /></div>
              <p className="text-muted-foreground italic font-bold">Aucun élève trouvé.</p>
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
