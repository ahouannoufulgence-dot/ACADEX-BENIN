
"use client"

import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft,
  ShieldCheck,
  UserSquare2,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  CheckCircle2,
  UserX,
  Loader2,
  Edit2,
  Trash2,
  Save,
  Zap,
  Archive,
  RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect, useMemo } from "react"
import { useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function TeacherDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const db = useFirestore()
  
  const teacherRef = useMemo(() => doc(db, "teachers", id as string), [db, id])
  const { data: teacher, loading } = useDoc(teacherRef)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: "",
    subject: "",
    phone: "",
    status: ""
  })

  useEffect(() => {
    if (teacher) {
      setEditForm({
        fullName: teacher.fullName || "",
        subject: teacher.subject || "",
        phone: teacher.phone || "",
        status: teacher.status || "En attente"
      })
    }
  }, [teacher])

  const handleUpdate = () => {
    updateDoc(teacherRef, editForm)
      .then(() => {
        setIsEditing(false)
        toast({ title: "Profil mis à jour", description: "Les modifications ont été enregistrées." })
      })
      .catch(async () => {
        const error = new FirestorePermissionError({
          path: teacherRef.path,
          operation: 'update',
          requestResourceData: editForm
        })
        errorEmitter.emit('permission-error', error)
      })
  }

  const handleArchive = async () => {
    try {
      await updateDoc(teacherRef, { status: "Archivé" })
      toast({ title: "Enseignant archivé", description: "Le profil a été déplacé vers les archives." })
      router.push("/enseignants")
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const handleRestore = async () => {
    try {
      await updateDoc(teacherRef, { status: "Actif" })
      toast({ title: "Accès restauré", description: "Le professeur est de nouveau actif." })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const toggleStatus = () => {
    const newStatus = editForm.status === "Actif" ? "Suspendu" : "Actif"
    updateDoc(teacherRef, { status: newStatus })
      .then(() => {
        setEditForm(prev => ({ ...prev, status: newStatus }))
        toast({ title: "Statut modifié", description: `Enseignant désormais : ${newStatus}` })
      })
  }

  if (loading) return (
    <DashboardLayout>
      <div className="h-full flex flex-col items-center justify-center p-20 gap-6 opacity-30">
        <Loader2 className="animate-spin text-primary size-12" />
        <p className="font-black text-muted-foreground uppercase tracking-[0.3em] text-[10px]">Accès au dossier...</p>
      </div>
    </DashboardLayout>
  )

  if (!teacher) return (
    <DashboardLayout>
      <div className="p-20 text-center space-y-6">
        <UserX className="size-20 text-muted-foreground mx-auto opacity-20" />
        <h3 className="text-3xl font-black uppercase text-foreground">Enseignant introuvable</h3>
        <Button asChild variant="outline" className="rounded-2xl h-14 px-10 border-2 font-black"><Link href="/enseignants">Retour au répertoire</Link></Button>
      </div>
    </DashboardLayout>
  )

  const isArchived = teacher.status === "Archivé"

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Detail Header - Mobile Responsive */}
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
               onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
               className="flex-1 md:flex-none rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-10 font-black text-[10px] md:text-sm shadow-xl"
             >
               {isEditing ? <Save className="mr-2 size-4 md:size-5" /> : <Edit2 className="mr-2 size-4 md:size-5" />}
               {isEditing ? "Sauvegarder" : "Modifier"}
             </Button>
             
             {!isArchived && (
               <Button 
                 onClick={toggleStatus}
                 className={cn(
                   "flex-1 md:flex-none rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-8 font-black text-[10px] md:text-sm transition-all shadow-sm",
                   editForm.status === 'Actif' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-emerald-500 text-white'
                 )}
               >
                 {editForm.status === 'Actif' ? <UserX className="mr-2 size-4 md:size-5" /> : <CheckCircle2 className="mr-2 size-4 md:size-5" />}
                 {editForm.status === 'Actif' ? "Suspendre" : "Activer"}
               </Button>
             )}
          </div>
        </div>

        <div className="grid gap-6 md:gap-10 lg:grid-cols-12">
          {/* Main Info Card */}
          <Card className={cn("lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[4rem] overflow-hidden", isArchived && "grayscale")}>
             <div className={cn("h-32 md:h-56 relative", isArchived ? "bg-muted" : "bg-primary")}>
               <div className="absolute -bottom-12 md:-bottom-20 left-6 md:left-16">
                 <Avatar className="size-24 md:size-48 border-[6px] md:border-[12px] border-white shadow-2xl">
                   <AvatarFallback className="bg-primary text-white text-2xl md:text-6xl font-black">
                     {(teacher.fullName || "??").substring(0, 2).toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
                 {isArchived && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                       <Archive className="size-8 md:size-16 text-white" />
                    </div>
                 )}
               </div>
             </div>
             
             <div className="pt-20 md:pt-32 pb-8 md:pb-16 px-6 md:px-16 space-y-8 md:space-y-12">
               <div className="space-y-3 md:space-y-4">
                 {isEditing ? (
                   <div className="space-y-2">
                     <Label className="font-black text-[9px] uppercase text-muted-foreground px-1">Nom Complet</Label>
                     <Input 
                       value={editForm.fullName} 
                       onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                       className="text-xl md:text-5xl font-black h-14 md:h-24 rounded-2xl md:rounded-[2rem] border-4 border-primary/10 px-6"
                     />
                   </div>
                 ) : (
                   <h1 className="text-2xl md:text-6xl font-black text-foreground tracking-tight uppercase">{teacher.fullName} {isArchived && "(ARCHIVÉ)"}</h1>
                 )}
                 <div className="flex flex-wrap items-center gap-3 md:gap-6">
                    <Badge className="bg-primary text-white border-none font-black text-[9px] md:text-sm px-4 md:px-8 py-1 md:py-2 rounded-full shadow-lg shadow-primary/20 uppercase tracking-widest">{teacher.subject}</Badge>
                    <div className="flex items-center gap-2 bg-muted/50 px-4 py-1.5 md:py-2.5 rounded-full border border-muted/50">
                      <span className="text-[8px] md:text-[11px] font-black text-muted-foreground uppercase tracking-widest">ID OFFICIEL:</span>
                      <span className="text-[10px] md:text-sm font-black text-foreground">{teacher.officialId}</span>
                    </div>
                    <Badge className={cn("font-black px-4 md:px-8 py-1 md:py-2 rounded-full uppercase tracking-tighter text-[9px] md:text-xs", teacher.status === 'Actif' ? 'bg-emerald-500' : 'bg-amber-500')}>
                      {teacher.status}
                    </Badge>
                 </div>
               </div>

               <div className="grid md:grid-cols-2 gap-8 md:gap-14 border-t border-muted/30 pt-8 md:pt-14">
                  <div className="space-y-6 md:space-y-10">
                    <h3 className="font-black text-lg md:text-2xl flex items-center gap-3 md:gap-5 tracking-tight uppercase"><ShieldCheck className="text-primary size-5 md:size-8" /> Coordonnées</h3>
                    <div className="space-y-3 md:space-y-6">
                       <div className="flex items-center gap-4 md:gap-8 p-5 md:p-8 bg-muted/20 rounded-2xl md:rounded-[2.5rem] border border-muted/50 group hover:border-primary/30 transition-all shadow-inner">
                          <div className="size-10 md:size-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-sm"><Phone className="size-5 md:size-7" /></div>
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1">Téléphone Direct</p>
                            <p className="font-black text-sm md:text-xl truncate">{teacher.phone || "Non renseigné"}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 md:gap-8 p-5 md:p-8 bg-muted/20 rounded-2xl md:rounded-[2.5rem] border border-muted/50 opacity-60">
                          <div className="size-10 md:size-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-sm"><Mail className="size-5 md:size-7" /></div>
                          <div>
                            <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1">Email Acadex</p>
                            <p className="font-black text-sm md:text-xl italic">Email non configuré</p>
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6 md:space-y-10">
                    <h3 className="font-black text-lg md:text-2xl flex items-center gap-3 md:gap-5 tracking-tight uppercase"><BookOpen className="text-primary size-5 md:size-8" /> Périmètre</h3>
                    <div className="space-y-4 md:space-y-8">
                       <div className="p-6 md:p-10 bg-primary/5 rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-primary/20">
                          <p className="text-[8px] md:text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-6">Classes sous responsabilité</p>
                          <div className="flex flex-wrap gap-2 md:gap-4">
                             {(teacher.classes || []).map((cls: string) => (
                               <Badge key={cls} className="bg-foreground text-white font-black px-3 md:px-6 py-1.5 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm hover:scale-105 transition-transform">{cls}</Badge>
                             ))}
                             {(!teacher.classes || teacher.classes.length === 0) && (
                               <p className="text-xs md:text-lg font-medium italic text-muted-foreground py-4">Aucune classe assignée pour l'instant.</p>
                             )}
                          </div>
                       </div>
                       <div className="flex items-center gap-4 text-muted-foreground">
                          <Calendar className="size-4 md:size-6 text-primary" />
                          <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Inscrit le {new Date(teacher.registeredAt).toLocaleDateString('fr-FR')}</span>
                       </div>
                    </div>
                  </div>
               </div>
             </div>
          </Card>

          <div className="lg:col-span-4 space-y-6 md:space-y-10">
             <Card className="p-8 md:p-14 bg-foreground text-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-none">
                <div className="relative z-10 space-y-8 md:space-y-12">
                   <h3 className="text-xl md:text-3xl font-black flex items-center gap-3 md:gap-5 tracking-tight uppercase">
                    <Zap className="text-primary size-5 md:size-8 fill-primary" /> Activité Live
                   </h3>
                   <div className="space-y-6 md:space-y-8 text-xs md:text-lg font-medium">
                      <div className="p-5 md:p-8 bg-white/5 rounded-2xl md:rounded-[2rem] border border-white/10 italic text-white/80 leading-relaxed shadow-inner">
                        "Cet enseignant a scellé 142 notes lors de l'année scolaire 2024-2025."
                      </div>
                      <div className="pt-6 md:pt-10 border-t border-white/10 flex justify-between items-center">
                         <span className="text-white/40 uppercase font-black text-[9px] md:text-sm tracking-widest">Dernière session</span>
                         <span className="font-black text-[10px] md:text-lg text-primary">02/05/2025</span>
                      </div>
                   </div>
                </div>
                <UserSquare2 className="absolute -bottom-10 -right-10 size-48 md:size-80 text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
             </Card>

             <Card className="p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] bg-white border-none shadow-sm flex flex-col items-center justify-center text-center space-y-6 md:space-y-10 border-2 border-primary/5">
                <div className="size-16 md:size-24 bg-muted rounded-2xl md:rounded-[2rem] flex items-center justify-center opacity-30 shadow-inner">
                   <ShieldCheck className="size-8 md:size-12 text-primary" />
                </div>
                <div className="space-y-2 md:space-y-4">
                  <h4 className="text-lg md:text-2xl font-black uppercase tracking-tight">Audit d'Intégrité</h4>
                  <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase leading-relaxed tracking-widest px-4">
                    Toute modification du dossier est journalisée dans le registre de sécurité d'Acadex.
                  </p>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
