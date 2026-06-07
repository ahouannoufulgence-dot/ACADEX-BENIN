
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
      <div className="h-full flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-primary size-12" />
        <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Accès au dossier...</p>
      </div>
    </DashboardLayout>
  )

  if (!teacher) return (
    <DashboardLayout>
      <div className="p-20 text-center space-y-4">
        <UserX className="size-20 text-muted-foreground mx-auto opacity-20" />
        <h3 className="text-2xl font-black">Enseignant introuvable</h3>
        <Button asChild variant="outline" className="rounded-xl"><Link href="/enseignants">Retour au répertoire</Link></Button>
      </div>
    </DashboardLayout>
  )

  const isArchived = teacher.status === "Archivé"

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <Link href="/enseignants" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold group">
            <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-1" />
            Retour à l'équipe
          </Link>
          <div className="flex gap-3">
             {isArchived ? (
                <Button onClick={handleRestore} className="bg-emerald-500 text-white rounded-2xl h-12 px-8 font-black shadow-xl shadow-emerald-500/20">
                   <RefreshCw className="mr-2 size-5" /> Restaurer l'accès
                </Button>
             ) : (
                <Button onClick={handleArchive} variant="outline" className="border-2 border-amber-200 text-amber-600 hover:bg-amber-50 rounded-2xl h-12 px-8 font-black">
                   <Archive className="mr-2 size-5" /> Archiver Dossier
                </Button>
             )}
             
             <Button 
               variant={isEditing ? "outline" : "default"} 
               onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
               className="rounded-2xl h-12 px-8 font-black"
             >
               {isEditing ? <Save className="mr-2 size-5" /> : <Edit2 className="mr-2 size-5" />}
               {isEditing ? "Sauvegarder" : "Modifier Profil"}
             </Button>
             
             {!isArchived && (
               <Button 
                 onClick={toggleStatus}
                 className={`rounded-2xl h-12 px-8 font-black ${editForm.status === 'Actif' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-emerald-500 text-white'}`}
               >
                 {editForm.status === 'Actif' ? <UserX className="mr-2 size-5" /> : <CheckCircle2 className="mr-2 size-5" />}
                 {editForm.status === 'Actif' ? "Suspendre" : "Activer"}
               </Button>
             )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Info */}
          <Card className={cn("lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] overflow-hidden", isArchived && "grayscale")}>
             <div className={cn("h-40 relative", isArchived ? "bg-muted" : "bg-primary")}>
               <div className="absolute -bottom-16 left-12">
                 <Avatar className="size-32 border-8 border-white shadow-2xl">
                   <AvatarFallback className="bg-primary text-white text-4xl font-black">
                     {(teacher.fullName || "??").substring(0, 2).toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
                 {isArchived && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                       <Archive className="size-10 text-white" />
                    </div>
                 )}
               </div>
             </div>
             <div className="pt-20 pb-12 px-12 space-y-8">
               <div className="space-y-2">
                 {isEditing ? (
                   <Input 
                     value={editForm.fullName} 
                     onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                     className="text-4xl font-black h-16 rounded-2xl border-2"
                   />
                 ) : (
                   <h1 className="text-4xl font-black text-foreground">{teacher.fullName} {isArchived && "(ARCHIVÉ)"}</h1>
                 )}
                 <div className="flex items-center gap-4">
                    <Badge className="bg-primary/10 text-primary border-none font-black text-sm px-4 py-1">{teacher.subject}</Badge>
                    <Badge variant="outline" className="font-bold border-2 border-primary/20">{teacher.officialId}</Badge>
                    <Badge className={teacher.status === 'Actif' ? 'bg-emerald-500' : 'bg-amber-500'}>{teacher.status}</Badge>
                 </div>
               </div>

               <div className="grid md:grid-cols-2 gap-8 border-t pt-8">
                  <div className="space-y-4">
                    <h3 className="font-black text-lg flex items-center gap-3"><ShieldCheck className="text-primary" /> Coordonnées</h3>
                    <div className="space-y-3">
                       <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl">
                          <Phone className="size-5 text-primary" />
                          <span className="font-bold">{teacher.phone || "Non renseigné"}</span>
                       </div>
                       <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl">
                          <Mail className="size-5 text-primary" />
                          <span className="font-bold text-muted-foreground italic">Email non configuré</span>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-black text-lg flex items-center gap-3"><BookOpen className="text-primary" /> Périmètre</h3>
                    <div className="space-y-2">
                       <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Classes assignées</p>
                       <div className="flex flex-wrap gap-2">
                          {(teacher.classes || []).map((cls: string) => (
                            <Badge key={cls} className="bg-foreground text-white font-black px-3 py-1 rounded-lg">{cls}</Badge>
                          ))}
                          {(!teacher.classes || teacher.classes.length === 0) && <p className="text-sm font-medium italic text-muted-foreground">Aucune classe</p>}
                       </div>
                    </div>
                  </div>
               </div>
             </div>
          </Card>

          <div className="lg:col-span-4 space-y-6">
             <Card className="premium-card p-8 bg-foreground text-white">
                <h3 className="text-xl font-black mb-6">Historique d'Activité</h3>
                <div className="space-y-4 text-sm font-medium">
                   <p className="opacity-60 italic">"Cet enseignant a scellé 142 notes lors de l'année scolaire 2024-2025."</p>
                   <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                      <span>Dernière connexion</span>
                      <span className="font-black text-xs text-primary">02/05/2025</span>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
