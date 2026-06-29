
"use client"

import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft,
  ShieldCheck,
  Loader2,
  Edit2,
  Save,
  Zap,
  Archive,
  RefreshCw,
  Layers,
  Info,
  X,
  UserCheck,
  CheckCircle2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { cn } from "@/lib/utils"

const OFFICIAL_CLASSES = [
  "6EME A", "6EME B", "5EME A", "5EME B", "4EME A", "4EME B", "3EME D1", "3EME D2",
  "2NDE A", "2NDE B", "2NDE C", "2NDE D",
  "1ERE A", "1ERE B", "1ERE C", "1ERE D",
  "TLE A", "TLE B", "TLE C", "TLE D"
]

const SUBJECTS = ["Mathématiques", "Français", "Anglais", "PCT", "SVT", "Histoire-Géo", "Philosophie", "Allemand", "Espagnol", "Économie", "Informatique", "EPS", "Communication", "Lecture"]

export default function TeacherDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [teacher, setTeacher] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [activeYear, setActiveYear] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [savingAssignments, setSavingAssignments] = useState(false)
  
  const [editForm, setEditForm] = useState({
    fullName: "",
    subject: "",
    phone: "",
    status: ""
  })

  const [currentAssignments, setCurrentAssignments] = useState({
    classes: [] as string[],
    subject: ""
  })

  const fetchTeacher = async () => {
    setLoading(true)
    const { data } = await supabase.from('teachers').select('*').eq('id', id).single()
    setTeacher(data)
    setLoading(false)
  }

  useEffect(() => {
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    fetchTeacher()
  }, [id])

  useEffect(() => {
    if (teacher) {
      setEditForm({
        fullName: teacher.full_name || "",
        subject: teacher.subject || "",
        phone: teacher.phone || "",
        status: teacher.status || "En attente"
      })

      const yearData = teacher.assignments?.[activeYear] || {
        classes: teacher.classes || [],
        subject: teacher.subject || ""
      }
      setCurrentAssignments(yearData)
    }
  }, [teacher, activeYear])

  const handleUpdateInfo = async () => {
    try {
      await supabase.from('teachers').update({
        full_name: editForm.fullName,
        subject: editForm.subject,
        phone: editForm.phone,
        status: editForm.status,
      }).eq('id', id)
      setIsEditing(false)
      toast({ title: "Profil mis à jour" })
      fetchTeacher()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const handleSaveAssignments = async () => {
    if (!activeYear) return
    setSavingAssignments(true)
    try {
      const assignments = teacher.assignments || {}
      assignments[activeYear] = currentAssignments

      await supabase.from('teachers').update({
        assignments,
        classes: currentAssignments.classes,
        subject: currentAssignments.subject,
      }).eq('id', id)

      toast({ 
        title: "Affectations scellées", 
        description: `Mise à jour terminée pour l'année ${activeYear}.` 
      })
      fetchTeacher()
    } catch (e) {
      toast({ title: "Erreur de scellage", variant: "destructive" })
    } finally {
      setSavingAssignments(false)
    }
  }

  const toggleClass = (cls: string) => {
    setCurrentAssignments(prev => ({
      ...prev,
      classes: prev.classes.includes(cls) 
        ? prev.classes.filter(c => c !== cls)
        : [...prev.classes, cls]
    }))
  }

  const handleArchive = async () => {
    try {
      await supabase.from('teachers').update({ status: "Archivé" }).eq('id', id)
      toast({ title: "Enseignant archivé" })
      router.push("/enseignants")
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const handleRestore = async () => {
    try {
      await supabase.from('teachers').update({ status: "Actif" }).eq('id', id)
      toast({ title: "Accès restauré" })
      fetchTeacher()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 opacity-30">
        <Loader2 className="animate-spin text-primary size-12" />
        <p className="font-black text-muted-foreground uppercase tracking-[0.3em] text-[10px]">Accès au dossier...</p>
      </div>
    </DashboardLayout>
  )

  if (!teacher) return (
    <DashboardLayout>
      <div className="p-20 text-center space-y-6">
        <h3 className="text-3xl font-black uppercase text-foreground">Enseignant introuvable</h3>
        <Button asChild variant="outline" className="rounded-2xl h-14 px-10 border-2 font-black"><Link href="/enseignants">Retour au répertoire</Link></Button>
      </div>
    </DashboardLayout>
  )

  const isArchived = teacher.status === "Archivé"

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Link href="/enseignants" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors font-black group text-[10px] md:text-sm uppercase tracking-widest">
            <ChevronLeft className="size-4 md:size-6 transition-transform group-hover:-translate-x-1" />
            Retour à l'équipe
          </Link>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
             {isArchived ? (
                <Button onClick={handleRestore} className="flex-1 md:flex-none bg-emerald-500 text-white rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-8 font-black shadow-xl shadow-emerald-500/20 text-[10px] md:text-sm">
                   <RefreshCw className="mr-2 size-4 md:size-5" /> Restaurer
                </Button>
             ) : (
                <Button onClick={handleArchive} variant="outline" className="flex-1 md:flex-none border-2 border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-8 font-black text-[10px] md:text-sm">
                   <Archive className="mr-2 size-4 md:size-5" /> Archiver
                </Button>
             )}
             
             <Button 
               variant={isEditing ? "outline" : "default"} 
               onClick={() => isEditing ? handleUpdateInfo() : setIsEditing(true)}
               className="flex-1 md:flex-none rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-10 font-black text-[10px] md:text-sm shadow-xl"
             >
               {isEditing ? <Save className="mr-2 size-4 md:size-5" /> : <Edit2 className="mr-2 size-4 md:size-5" />}
               {isEditing ? "Sauvegarder" : "Modifier Infos"}
             </Button>
          </div>
        </div>

        <Card className={cn("border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[4rem] overflow-hidden", isArchived && "grayscale")}>
          <div className={cn("h-32 md:h-48 relative transition-colors duration-500", isArchived ? "bg-muted" : "bg-primary")}>
            <div className="absolute -bottom-10 md:-bottom-16 left-6 md:left-16 flex items-end gap-6">
              <Avatar className="size-24 md:size-40 border-[6px] md:border-[10px] border-white shadow-2xl">
                <AvatarFallback className="bg-primary text-white text-2xl md:text-6xl font-black uppercase">
                  {(teacher.full_name || "??").substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="mb-4 md:mb-6 space-y-1 hidden md:block">
                 <h1 className="text-xl md:text-4xl font-black text-white drop-shadow-lg uppercase tracking-tight">{teacher.full_name}</h1>
                 <div className="flex items-center gap-3">
                    <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-bold px-4 py-1 rounded-full text-xs">{teacher.subject}</Badge>
                    <Badge variant="outline" className="border-white/40 text-white font-black text-[10px]">{teacher.official_id}</Badge>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="pt-14 md:pt-24 pb-8 md:pb-12 px-6 md:px-16">
            <Tabs defaultValue="affectations" className="space-y-8 md:space-y-12">
               <TabsList className="bg-muted/50 border-2 rounded-2xl h-12 md:h-16 p-1 flex w-full md:w-fit shadow-inner">
                 <TabsTrigger value="affectations" className="flex-1 md:flex-none rounded-xl font-black px-6 md:px-12 text-[9px] md:text-sm uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all flex items-center gap-2">
                    <Layers className="size-4" /> Affectations
                 </TabsTrigger>
                 <TabsTrigger value="informations" className="flex-1 md:flex-none rounded-xl font-black px-6 md:px-12 text-[9px] md:text-sm uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all flex items-center gap-2">
                    <Info className="size-4" /> Informations
                 </TabsTrigger>
               </TabsList>

               <TabsContent value="affectations" className="space-y-8 md:space-y-12 animate-in slide-in-from-right-4">
                  <div className="grid lg:grid-cols-12 gap-8 md:gap-14">
                     <div className="lg:col-span-5 space-y-6 md:space-y-10">
                        <div className="space-y-2">
                           <h3 className="text-xl md:text-3xl font-black flex items-center gap-3 tracking-tight uppercase"><Zap className="text-primary size-6 md:size-8 fill-primary" /> Pilotage {activeYear}</h3>
                           <p className="text-[10px] md:text-base font-medium text-muted-foreground leading-relaxed">
                             Définissez les classes et la matière sous la responsabilité de cet enseignant pour l'année scolaire active.
                           </p>
                        </div>

                        <div className="space-y-6 md:space-y-8 p-6 md:p-10 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20">
                           <div className="space-y-3">
                              <Label className="font-black text-[9px] md:text-[11px] uppercase text-primary tracking-[0.2em] px-1">Matière Spécifique</Label>
                              <select 
                                value={currentAssignments.subject} 
                                onChange={e => setCurrentAssignments({...currentAssignments, subject: e.target.value})}
                                className="w-full h-12 md:h-16 rounded-2xl border-2 border-primary/10 bg-white font-black text-sm md:text-xl px-4 focus:ring-primary focus:border-primary transition-all outline-none"
                              >
                                 <option value="">Choisir une matière</option>
                                 {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-center justify-between px-1">
                                 <Label className="font-black text-[9px] md:text-[11px] uppercase text-primary tracking-[0.2em]">Classes Assignées</Label>
                                 <Badge className="bg-primary text-white font-black text-[8px] md:text-[10px]">{currentAssignments.classes.length} CLASSES</Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 md:gap-3">
                                 {currentAssignments.classes.map(c => (
                                   <Badge key={c} onClick={() => toggleClass(c)} className="bg-foreground text-white font-black px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl text-[9px] md:text-sm cursor-pointer hover:bg-destructive hover:scale-95 transition-all group">
                                      {c} <X className="size-2.5 ml-2" />
                                   </Badge>
                                 ))}
                                 {currentAssignments.classes.length === 0 && (
                                    <div className="py-4 text-center w-full italic text-muted-foreground opacity-40 text-xs md:text-base">Aucune classe pour {activeYear}</div>
                                 )}
                              </div>
                           </div>

                           <Button 
                             onClick={handleSaveAssignments} 
                             disabled={savingAssignments}
                             className="w-full h-12 md:h-18 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs md:text-xl shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase"
                           >
                             {savingAssignments ? <Loader2 className="animate-spin mr-2 size-4 md:size-6" /> : <ShieldCheck className="mr-2 size-4 md:size-6" />}
                             Sceller Affectations
                           </Button>
                        </div>
                     </div>

                     <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between px-2">
                           <h4 className="font-black text-sm md:text-xl uppercase tracking-widest text-muted-foreground">Registre des Classes</h4>
                           <div className="flex items-center gap-2 text-[9px] md:text-xs font-bold text-primary italic">
                              <Info className="size-3" /> Cliquer pour affecter/retirer
                           </div>
                        </div>
                        <ScrollArea className="h-[400px] md:h-[600px] rounded-[2.5rem] border-2 bg-muted/5 p-4 md:p-8">
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                              {OFFICIAL_CLASSES.map(cls => (
                                <button 
                                  key={cls}
                                  onClick={() => toggleClass(cls)}
                                  className={cn(
                                    "p-4 md:p-8 rounded-2xl md:rounded-[2rem] border-2 font-black text-[10px] md:text-xl transition-all shadow-sm active:scale-90",
                                    currentAssignments.classes.includes(cls) 
                                      ? "bg-primary text-white border-primary shadow-xl scale-[1.02]" 
                                      : "bg-white text-muted-foreground border-transparent hover:border-primary/20 hover:bg-primary/5"
                                  )}
                                >
                                   {cls}
                                </button>
                              ))}
                           </div>
                        </ScrollArea>
                     </div>
                  </div>
               </TabsContent>

               <TabsContent value="informations" className="space-y-8 md:space-y-12 animate-in slide-in-from-left-4">
                  <div className="grid md:grid-cols-2 gap-8 md:gap-14">
                     <div className="space-y-6 md:space-y-10">
                        <h3 className="font-black text-lg md:text-2xl flex items-center gap-3 tracking-tight uppercase border-l-4 border-primary pl-4">Détails Personnels</h3>
                        <div className="space-y-4 md:space-y-6">
                           <div className="grid gap-1.5 md:gap-2">
                              <Label className="font-black text-[9px] md:text-[11px] uppercase text-muted-foreground px-1">Nom Complet</Label>
                              <Input disabled={!isEditing} value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="h-11 md:h-14 rounded-xl font-bold text-sm md:text-lg border-2" />
                           </div>
                           <div className="grid gap-1.5 md:gap-2">
                              <Label className="font-black text-[9px] md:text-[11px] uppercase text-muted-foreground px-1">Téléphone</Label>
                              <Input disabled={!isEditing} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="h-11 md:h-14 rounded-xl font-bold text-sm md:text-lg border-2" />
                           </div>
                           <div className="grid gap-1.5 md:gap-2">
                              <Label className="font-black text-[9px] md:text-[11px] uppercase text-muted-foreground px-1">Identifiant Système</Label>
                              <div className="h-11 md:h-14 rounded-xl bg-muted/30 flex items-center px-4 font-mono text-xs md:text-lg font-black border-2 border-transparent">{teacher.official_id}</div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6 md:space-y-10">
                        <h3 className="font-black text-lg md:text-2xl flex items-center gap-3 tracking-tight uppercase border-l-4 border-primary pl-4">Statut & Sécurité</h3>
                        <div className="space-y-4 md:space-y-8">
                           <Card className="p-6 md:p-10 bg-foreground text-white rounded-[2rem] md:rounded-[3rem] shadow-xl relative overflow-hidden group border-none">
                              <div className="relative z-10 space-y-4 md:space-y-6">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[9px] md:text-sm font-black uppercase text-white/40 tracking-widest">État du compte</span>
                                    <Badge className={cn("font-black px-4 py-1.5 rounded-full uppercase text-[8px] md:text-xs shadow-lg", teacher.status === 'Actif' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white')}>{teacher.status}</Badge>
                                 </div>
                                 <p className="text-xs md:text-lg font-medium leading-relaxed italic border-l-2 border-primary pl-4 opacity-80">
                                    "L'accès de cet enseignant est scellé. Toute connexion est journalisée."
                                 </p>
                              </div>
                              <ShieldCheck className="absolute -bottom-10 -right-10 size-40 md:size-64 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                           </Card>
                        </div>
                     </div>
                  </div>
               </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
