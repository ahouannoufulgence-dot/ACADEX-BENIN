"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Archive, 
  Search, 
  History, 
  ShieldCheck, 
  Users, 
  UserSquare2, 
  Calendar, 
  FileText,
  CreditCard,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Filter,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  Zap
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useMemo } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"

export default function ArchivesPage() {
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("eleves")
  const [searchTerm, setSearchTerm] = useState("")

  // FETCHING ARCHIVED DATA
  const archivedStudentsQuery = useMemo(() => query(collection(db, "students"), where("status", "==", "Archivé")), [db])
  const archivedTeachersQuery = useMemo(() => query(collection(db, "teachers"), where("status", "==", "Archivé")), [db])
  
  const { data: students, loading: loadingStudents } = useCollection(archivedStudentsQuery)
  const { data: teachers, loading: loadingTeachers } = useCollection(archivedTeachersQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      (s.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (s.matricule?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  const filteredTeachers = useMemo(() => {
    if (!teachers) return []
    return teachers.filter((t: any) => 
      (t.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (t.officialId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [teachers, searchTerm])

  const handleRestore = async (id: string, type: 'student' | 'teacher') => {
    const colName = type === 'student' ? 'students' : 'teachers'
    try {
      await updateDoc(doc(db, colName, id), { status: 'Actif' })
      toast({ title: "Restauration réussie", description: "Le profil est de nouveau actif dans l'école." })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const handleDeletePermanent = async (id: string, type: 'student' | 'teacher') => {
    const colName = type === 'student' ? 'students' : 'teachers'
    try {
      await deleteDoc(doc(db, colName, id))
      toast({ title: "Suppression définitive", description: "Les données ont été effacées du coffre-fort." })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Archives <span className="text-primary italic">Sincères</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Coffre-fort numérique de l'établissement Acadex.</p>
          </div>
          <Badge className="bg-primary text-white h-12 px-8 rounded-2xl flex items-center gap-3 font-black text-lg shadow-xl shadow-primary/20">
             <ShieldCheck className="size-6" /> MÉMOIRE SÉCURISÉE
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
           {[
             { label: "Élèves Archivés", value: students?.length || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Enseignants", value: teachers?.length || 0, icon: UserSquare2, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Années Scellées", value: "0", icon: History, color: "text-amber-600", bg: "bg-amber-50" },
             { label: "Historique Financier", value: "Actif", icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" },
           ].map((stat, i) => (
             <Card key={i} className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-lg transition-all">
                <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}><stat.icon className="size-6" /></div>
                   </div>
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                   <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
                </CardContent>
             </Card>
           ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-20 p-2 flex w-fit shadow-md overflow-x-auto no-scrollbar">
            {[
              { id: "eleves", label: "Élèves Archivés", icon: Users },
              { id: "profs", label: "Enseignants Archivés", icon: UserSquare2 },
              { id: "annees", label: "Historique Années", icon: Calendar },
              { id: "logs", label: "Journaux Critiques", icon: FileText },
            ].map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-2xl font-black px-8 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex gap-2">
                <t.icon className="size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="eleves" className="space-y-6">
            <div className="relative group max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Chercher un élève historique..." 
                className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden min-h-[400px]">
              {loadingStudents ? (
                <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary size-10" /></div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 text-center opacity-30 italic">
                  <Archive className="size-20 mb-4" />
                  <p className="text-xl font-black">Aucun élève dans le coffre-fort</p>
                </div>
              ) : (
                <div className="divide-y divide-muted/30">
                  {filteredStudents.map((s: any) => (
                    <div key={s.id} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                       <div className="flex items-center gap-6">
                         <Avatar className="size-14 border-4 border-muted">
                           <AvatarFallback className="bg-muted text-muted-foreground font-black">{s.lastName?.[0]}{s.firstName?.[0]}</AvatarFallback>
                         </Avatar>
                         <div>
                            <h4 className="font-black text-lg">{s.lastName?.toUpperCase()} {s.firstName}</h4>
                            <div className="flex gap-4 items-center mt-1">
                               <Badge variant="outline" className="font-bold border-muted text-muted-foreground">{s.classId}</Badge>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.matricule}</span>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Clock className="size-3" /> Archivé en {s.academicYear || '---'}</span>
                            </div>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <Button onClick={() => handleRestore(s.id, 'student')} variant="outline" className="rounded-xl font-black h-11 px-6 border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50">
                            <RefreshCw className="size-4 mr-2" /> Restaurer
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-11 rounded-xl text-destructive hover:bg-destructive/10">
                                <Trash2 className="size-5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2.5rem]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-black">Supprimer Définitivement ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. L'élève sera totalement effacé de la base de données ACADEX, y compris ses notes et archives.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePermanent(s.id, 'student')} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black">Effacer du coffre-fort</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="profs" className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden min-h-[400px]">
              {loadingTeachers ? (
                <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary size-10" /></div>
              ) : filteredTeachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 text-center opacity-30 italic">
                  <Archive className="size-20 mb-4" />
                  <p className="text-xl font-black">Aucun enseignant archivé</p>
                </div>
              ) : (
                <div className="divide-y divide-muted/30">
                  {filteredTeachers.map((t: any) => (
                    <div key={t.id} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                       <div className="flex items-center gap-6">
                         <Avatar className="size-14 border-4 border-muted">
                           <AvatarFallback className="bg-muted text-muted-foreground font-black">{t.fullName?.[0]}</AvatarFallback>
                         </Avatar>
                         <div>
                            <h4 className="font-black text-lg">{t.fullName}</h4>
                            <div className="flex gap-4 items-center mt-1">
                               <Badge className="bg-primary/10 text-primary border-none font-bold px-3">{t.subject}</Badge>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">{t.officialId}</span>
                            </div>
                         </div>
                       </div>
                       <Button onClick={() => handleRestore(t.id, 'teacher')} variant="outline" className="rounded-xl font-black h-11 px-6 border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50">
                          <RefreshCw className="size-4 mr-2" /> Restaurer Profil
                       </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="annees" className="space-y-8">
             <Card className="p-10 rounded-[3rem] bg-white border-none shadow-sm">
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
                   <div className="size-24 bg-muted rounded-full flex items-center justify-center opacity-30">
                      <Zap className="size-12" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black">Clôture d'Année Scolaire</h3>
                      <p className="text-muted-foreground max-w-md mx-auto font-medium leading-relaxed">
                        À la fin de chaque cycle, vous pouvez figer l'ensemble des données (élèves, notes, paiements) pour créer une archive historique immuable.
                      </p>
                   </div>
                   <Button className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-10 font-black shadow-xl shadow-primary/20">
                      Sceller l'Année 2024-2025
                   </Button>
                </div>
             </Card>

             <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-8 rounded-[2.5rem] bg-muted/20 border-2 border-dashed border-muted-foreground/10">
                   <h4 className="font-black text-lg mb-4">Années Disponibles</h4>
                   <p className="text-sm font-medium text-muted-foreground italic">Aucune archive historique détectée. ACADEX est en cours d'utilisation sur son premier cycle.</p>
                </Card>
                <Card className="p-8 rounded-[2.5rem] bg-foreground text-white">
                   <h4 className="font-black text-lg mb-4 text-primary">Note de Sincérité</h4>
                   <p className="text-sm font-medium opacity-60 leading-relaxed">
                     L'archivage n'est pas une suppression. C'est une sécurisation. Une fois archivées, les notes et moyennes sont certifiées "Historiques" et ne peuvent plus être modifiées par les enseignants.
                   </p>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}