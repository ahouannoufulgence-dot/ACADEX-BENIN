
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useState, useMemo } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"
import { useFirestore, useCollection } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

const officialClasses = [
  "6ème A", "6ème B", "5ème A", "5ème B", "4ème A", "4ème B", "4ème C", "3D1", "3D2", "2nde C", "2nde D", "1ère D", "Terminale D1", "Terminale D2"
]

export default function StudentsPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [isGeneratingIDs, setIsGeneratingIDs] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [batchClass, setBatchClass] = useState("")
  const [batchQuantity, setBatchQuantity] = useState("40")

  const db = useFirestore()
  const studentsRef = useMemo(() => db ? collection(db, 'students') : null, [db])
  const studentsQuery = useMemo(() => studentsRef ? query(studentsRef, orderBy("matricule", "asc")) : null, [studentsRef])
  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter(s => 
      (s.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.matricule?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.classId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  const handleGenerateBatchPDF = async () => {
    if (!batchClass || !db) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une classe.", variant: "destructive" });
      return;
    }
    
    setLoadingPdf(true);
    
    try {
      const doc = new jsPDF();
      const quantity = parseInt(batchQuantity);
      const classSlug = batchClass.replace(/[^a-zA-Z0-9]/g, "");
      const academicYear = "2025-2026";
      
      // Header
      doc.setFillColor(20, 83, 45); // ACADEX Green
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("ACADEX - LISTE OFFICIELLE DES IDENTIFIANTS", 105, 18, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Système de Gestion Scolaire Premium - Excellence & Rigueur", 105, 28, { align: "center" });

      // Document Info
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Classe : ${batchClass}`, 14, 50);
      doc.text(`Année Scolaire : ${academicYear}`, 14, 57);
      doc.text(`Nombre d'identifiants : ${quantity}`, 14, 64);
      doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 196, 50, { align: "right" });

      const rows = [];
      const studentsToSave = [];

      for (let i = 1; i <= quantity; i++) {
        const num = i.toString().padStart(3, '0');
        const matricule = `ELV-${classSlug}-${num}`;
        const validationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        rows.push([i, matricule, "..................................................", validationCode]);

        studentsToSave.push({
          matricule,
          classId: batchClass,
          status: "En attente d'activation",
          academicYear,
          createdAt: serverTimestamp(),
          validationCode // Pour vérification lors de l'activation
        });
      }

      // Sauvegarde dans Firestore
      const savePromises = studentsToSave.map(student => 
        addDoc(collection(db, "students"), student).catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: 'students',
            operation: 'create',
            requestResourceData: student,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
      );

      await Promise.all(savePromises);

      autoTable(doc, {
        startY: 75,
        head: [['#', 'Identifiant Unique', 'Nom & Prénoms de l\'élève', 'Code de Validation']],
        body: rows,
        headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 75 },
        styles: { fontSize: 9, cellPadding: 5 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(10);
      doc.text("Le Directeur de l'Établissement", 150, finalY + 20, { align: "center" });
      doc.text("(Signature et Cachet)", 150, finalY + 45, { align: "center" });

      doc.save(`ACADEX_IDs_${classSlug}.pdf`);
      
      toast({
        title: "PDF Généré et Sauvegardé",
        description: `La liste des identifiants pour ${batchClass} a été enregistrée dans la base et téléchargée.`
      });
      setIsGeneratingIDs(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: "Échec de la génération ou de la sauvegarde.", variant: "destructive" });
    } finally {
      setLoadingPdf(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Gestion des Élèves</h1>
            <p className="text-muted-foreground mt-2 font-medium">Répertoire complet et génération d'identifiants.</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isGeneratingIDs} onOpenChange={setIsGeneratingIDs}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white hover:bg-muted group">
                  <FileDown className="mr-2 size-5 text-primary group-hover:scale-110 transition-transform" />
                  Générer Identifiants par lot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none p-10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Identifiants par lot</DialogTitle>
                  <DialogDescription className="font-medium">Générez une liste d'identifiants vierges pour une classe entière et sauvegardez-les.</DialogDescription>
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
                  <div className="space-y-2">
                    <Label className="font-bold">Nombre d'identifiants à créer</Label>
                    <Input 
                      type="number" 
                      value={batchQuantity} 
                      onChange={(e) => setBatchQuantity(e.target.value)} 
                      className="h-12 rounded-xl" 
                    />
                  </div>
                </div>
                <DialogFooter className="gap-3">
                  <Button variant="ghost" onClick={() => setIsGeneratingIDs(false)} className="rounded-xl font-bold">Annuler</Button>
                  <Button 
                    onClick={handleGenerateBatchPDF} 
                    disabled={loadingPdf}
                    className="bg-primary rounded-xl font-black px-8 h-12 shadow-xl shadow-primary/20"
                  >
                    {loadingPdf ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Printer className="mr-2 size-5" />}
                    Générer & Sauvegarder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black text-lg">
                  <Plus className="mr-2 size-5" />
                  Nouvel Élève
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none p-10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Inscription Élève</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Nom Complet</Label>
                      <Input id="new-fullName" placeholder="Ex: Dossou Marc" className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Matricule</Label>
                      <Input id="new-matricule" placeholder="Ex: ELV-3D-001" className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Classe</Label>
                    <Select>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Sélectionner la classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {officialClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-bold">Annuler</Button>
                  <Button className="bg-primary rounded-xl font-black px-8">Enregistrer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Chercher un élève par nom, matricule ou classe..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary transition-all text-lg font-medium"
          />
        </div>

        {/* Students List */}
        <div className="grid gap-4">
          {loadingStudents ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-[2rem] text-muted-foreground italic">
              Aucun élève trouvé.
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-12 px-8 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                <div className="col-span-1">ID</div>
                <div className="col-span-4">Nom de l'élève</div>
                <div className="col-span-2 text-center">Classe</div>
                <div className="col-span-2 text-center">Statut</div>
                <div className="col-span-3 text-right">Action</div>
              </div>
              
              {filteredStudents.map((student: any) => (
                <Link key={student.id} href={`/eleves/${student.id}`}>
                  <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 md:p-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                        <div className="col-span-1">
                          <Badge variant="outline" className="rounded-full border-muted font-black text-[10px] text-muted-foreground">
                            {student.matricule?.split('-').pop() || "N/A"}
                          </Badge>
                        </div>
                        <div className="col-span-4 flex items-center gap-4">
                          <Avatar className="size-12 border-2 border-muted group-hover:border-primary/20 transition-all">
                            <AvatarImage src={`https://picsum.photos/seed/${student.id}/100/100`} />
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">
                              {(student.fullName || student.matricule || "??").substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-black text-foreground text-lg group-hover:text-primary transition-colors">
                            {student.fullName || student.matricule}
                          </span>
                        </div>
                        <div className="col-span-2 text-center">
                          <Badge className="bg-muted text-foreground font-black px-4 py-1 rounded-full border-none">
                            {student.classId}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-center">
                          <Badge variant="outline" className={`font-black rounded-full px-3 py-0.5 text-[10px] ${
                            student.status === "Actif" ? "border-primary text-primary" : "border-amber-500 text-amber-600"
                          }`}>
                            {student.status}
                          </Badge>
                        </div>
                        <div className="col-span-3 text-right flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="rounded-xl group-hover:text-primary">
                            <ChevronRight className="size-6" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
