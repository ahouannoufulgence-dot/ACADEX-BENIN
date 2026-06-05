
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
  Filter
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, orderBy, where, addDoc, serverTimestamp } from "firebase/firestore"
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

const officialClasses = ["6ème A", "6ème B", "5ème A", "5ème B", "4ème A", "4ème B", "4ème C", "3D1", "3D2", "2nde C", "2nde D", "1ère D", "Terminale D1", "Terminale D2"]

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [batchCount, setBatchCount] = useState("30")
  const [selectedClass, setSelectedClass] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const db = useFirestore()

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role') || "Directeur"
    const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || "[]")
    setUserRole(role)
    setUserClasses(classes)
  }, [])

  const isDirector = userRole.toLowerCase() === "directeur"

  const studentsQuery = useMemo(() => {
    if (!db || !userRole) return null
    const ref = collection(db, 'students')
    
    if (!isDirector && userClasses.length > 0) {
      return query(ref, where("classId", "in", userClasses), orderBy("matricule", "asc"))
    }
    
    return query(ref, orderBy("matricule", "asc"))
  }, [db, userRole, userClasses, isDirector])

  const { data: students, loading } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      (s.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.matricule?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  const handleBatchGenerate = async () => {
    if (!selectedClass || !batchCount) {
      toast({ title: "Champs manquants", description: "Veuillez choisir une classe et un nombre.", variant: "destructive" })
      return
    }

    setIsGenerating(true)
    const count = parseInt(batchCount)
    const year = "2024-2025"

    try {
      const promises = []
      const timestamp = new Date().getTime().toString().slice(-4)
      
      for (let i = 1; i <= count; i++) {
        const studentData = {
          fullName: "",
          matricule: `ELV-${selectedClass.replace(' ', '')}-${timestamp}-${i.toString().padStart(3, '0')}`,
          classId: selectedClass,
          status: "En attente d'activation",
          academicYear: year,
          createdAt: serverTimestamp()
        }
        promises.push(addDoc(collection(db, "students"), studentData))
      }

      await Promise.all(promises)
      toast({ 
        title: "Génération réussie", 
        description: `${count} identifiants créés pour la classe ${selectedClass}.` 
      })
      setIsDialogOpen(false)
    } catch (e) {
      toast({ title: "Erreur", description: "Échec de la génération des identifiants.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              {isDirector ? "Pilotage Élèves" : "Mes Classes"}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {isDirector 
                ? "Gestion centrale des effectifs et inscriptions." 
                : `Périmètre pédagogique : ${userClasses.join(', ')}.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDirector && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 font-black bg-white">
                    <Zap className="mr-2 size-5 text-amber-500 fill-amber-500" /> Génération Express
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] p-10 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Génération en Lot</DialogTitle>
                    <DialogDescription className="font-medium">
                      Créez massivement des comptes élèves vides à activer.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase text-muted-foreground">Classe de destination</Label>
                      <Select onValueChange={setSelectedClass}>
                        <SelectTrigger className="h-12 rounded-xl font-bold">
                          <SelectValue placeholder="Sélectionner une classe" />
                        </SelectTrigger>
                        <SelectContent>
                          {officialClasses.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase text-muted-foreground">Nombre d'élèves</Label>
                      <Input 
                        type="number" 
                        value={batchCount} 
                        onChange={(e) => setBatchCount(e.target.value)}
                        className="h-12 rounded-xl font-black text-lg"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleBatchGenerate} 
                      disabled={isGenerating}
                      className="w-full bg-primary h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                    >
                      {isGenerating ? <Loader2 className="mr-2 size-5 animate-spin" /> : <CheckCircle2 className="mr-2 size-5" />}
                      Lancer la création
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
              <Plus className="mr-2 size-5" /> Inscription Manuelle
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Chercher par nom ou matricule..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
            />
          </div>
          <Button variant="outline" className="h-14 w-14 rounded-2xl border-none bg-white shadow-sm shrink-0">
            <Filter className="size-5" />
          </Button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-16 text-center bg-white rounded-[3.5rem] border-none shadow-sm">
              <div className="size-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="size-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-black mb-2">Aucun élève trouvé</h3>
              <p className="text-muted-foreground italic font-medium max-w-xs mx-auto">
                Commencez par utiliser la **Génération Express** pour peupler votre établissement.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredStudents.map((student: any) => (
                <Link key={student.id} href={`/eleves/${student.id}`}>
                  <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <Avatar className="size-16 border-4 border-muted group-hover:border-primary/20 transition-all shadow-sm">
                            <AvatarImage src={`https://picsum.photos/seed/${student.id}/200/200`} />
                            <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">
                              {(student.fullName || "??").substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                              {student.fullName || "Compte à activer"}
                            </h3>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-primary/10 text-primary border-none font-black px-3 py-1 rounded-full text-[10px]">
                                {student.classId}
                              </Badge>
                              <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
                                {student.matricule}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="outline" 
                            className={`font-black rounded-full px-4 border-2 ${
                              student.status === "Actif" 
                                ? "border-emerald-200 text-emerald-600 bg-emerald-50" 
                                : student.status === "En attente d'activation"
                                ? "border-amber-200 text-amber-600 bg-amber-50"
                                : "border-muted text-muted-foreground"
                            }`}
                          >
                            {student.status.toUpperCase()}
                          </Badge>
                          <Button variant="ghost" size="icon" className="size-12 rounded-2xl group-hover:text-primary bg-muted/20">
                            <ChevronRight className="size-6" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
