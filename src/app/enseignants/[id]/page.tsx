"use client"

import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, ShieldCheck, Loader2, Edit2, Save, Zap,
  Trash2, Layers, Info, X, CheckCircle2, Star, Phone, Lock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { cn } from "@/lib/utils"

const OFFICIAL_CLASSES = [
  "6EME A","6EME B","5EME A","5EME B","4EME A","4EME B","3EME D1","3EME D2",
  "2NDE A","2NDE B","2NDE C","2NDE D","1ERE A","1ERE B","1ERE C","1ERE D",
  "TLE A","TLE B","TLE C","TLE D"
]

const SUBJECTS = ["Mathématiques","Français","Anglais","Physique-Chimie","SVT","Histoire-Géographie","Philosophie","Allemand","Espagnol","Économie","Informatique","EPS","Autre"]

export default function TeacherDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [teacher, setTeacher] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingClasses, setSavingClasses] = useState(false)

  const [editForm, setEditForm] = useState({
    full_name: "",
    subject: "",
    phone: "",
    official_id: ""
  })

  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [newPassword, setNewPassword] = useState("")

  const fetchTeacher = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('teachers').select('*').eq('id', id).single()
    if (error) {
      toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" })
    }
    setTeacher(data)
    setLoading(false)
  }

  useEffect(() => { fetchTeacher() }, [id])

  useEffect(() => {
    if (teacher) {
      setEditForm({
        full_name: teacher.full_name || "",
        subject: teacher.subject || "",
        phone: teacher.phone || "",
        official_id: teacher.official_id || ""
      })
      setSelectedClasses(teacher.classes || [])
    }
  }, [teacher])

  const handleUpdateInfo = async () => {
    if (!editForm.full_name || !editForm.subject) {
      toast({ title: "Champs requis", description: "Nom et matière sont obligatoires", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('teachers').update({
        full_name: editForm.full_name,
        subject: editForm.subject,
        phone: editForm.phone,
        official_id: editForm.official_id.toUpperCase()
      }).eq('id', id)
      if (error) throw error
      setIsEditing(false)
      toast({ title: "Profil mis à jour avec succès" })
      fetchTeacher()
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls])
  }

  const handleSaveClasses = async () => {
    setSavingClasses(true)
    try {
      const { error } = await supabase.from('teachers').update({
        classes: selectedClasses
      }).eq('id', id)
      if (error) throw error
      toast({ title: "Classes mises à jour", description: `${selectedClasses.length} classe(s) assignée(s)` })
      fetchTeacher()
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" })
    } finally {
      setSavingClasses(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      toast({ title: "Mot de passe trop court", description: "Minimum 4 caractères", variant: "destructive" })
      return
    }
    try {
      const { error } = await supabase.from('teachers').update({ password: newPassword }).eq('id', id)
      if (error) throw error
      toast({ title: "Mot de passe modifié" })
      setNewPassword("")
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" })
    }
  }

  const handleToggleMainTeacher = async (classId: string) => {
    try {
      const isCurrentlyMain = teacher.is_main_teacher && teacher.main_teacher_class === classId
      const { error } = await supabase.from('teachers').update({
        is_main_teacher: !isCurrentlyMain,
        main_teacher_class: !isCurrentlyMain ? classId : null
      }).eq('id', id)
      if (error) throw error
      toast({ title: isCurrentlyMain ? "Statut retiré" : "Professeur principal désigné", description: !isCurrentlyMain ? `Pour la classe ${classId}` : undefined })
      fetchTeacher()
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message.includes('unique') ? "Cette classe a déjà un professeur principal" : e.message, variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', id)
      if (error) throw error
      toast({ title: "Enseignant supprimé" })
      router.push("/enseignants")
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" })
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 opacity-30">
        <Loader2 className="animate-spin text-primary size-12" />
        <p className="font-black text-muted-foreground uppercase tracking-[0.3em] text-[10px]">Chargement du dossier...</p>
      </div>
    </DashboardLayout>
  )

  if (!teacher) return (
    <DashboardLayout>
      <div className="p-20 text-center space-y-6">
        <h3 className="text-3xl font-black uppercase">Enseignant introuvable</h3>
        <Button asChild variant="outline" className="rounded-2xl h-14 px-10 border-2 font-black">
          <Link href="/enseignants">Retour au répertoire</Link>
        </Button>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">

        {/* Header navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Link href="/enseignants" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors font-black text-[10px] md:text-sm uppercase tracking-widest group">
            <ChevronLeft className="size-4 md:size-6 group-hover:-translate-x-1 transition-transform" />
            Retour à l'équipe
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => isEditing ? handleUpdateInfo() : setIsEditing(true)}
              disabled={saving}
              className="rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-10 font-black text-[10px] md:text-sm shadow-xl"
            >
              {saving ? <Loader2 className="animate-spin mr-2 size-4" /> : isEditing ? <Save className="mr-2 size-4" /> : <Edit2 className="mr-2 size-4" />}
              {isEditing ? "Sauvegarder" : "Modifier"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="rounded-xl md:rounded-2xl h-11 md:h-14 px-5 border-2 border-red-200 text-red-600 hover:bg-red-50 font-black text-[10px] md:text-sm">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem] w-[95%]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-black">Supprimer cet enseignant ?</AlertDialogTitle>
                  <AlertDialogDescription className="font-medium">
                    Cette action supprimera définitivement {teacher.full_name} ({teacher.official_id}) de la base de données.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black">
                    Confirmer la suppression
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Carte hero */}
        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[4rem] overflow-hidden">
          <div className="h-32 md:h-40 bg-primary relative">
            <div className="absolute -bottom-10 md:-bottom-14 left-6 md:left-16 flex items-end gap-6">
              <Avatar className="size-24 md:size-32 border-[6px] border-white shadow-2xl">
                <AvatarFallback className="bg-primary text-white text-2xl md:text-4xl font-black uppercase">
                  {(teacher.full_name || "??").substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="mb-3 hidden md:block">
                <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg uppercase">{teacher.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-white/20 backdrop-blur text-white border-none font-bold px-3 py-1 rounded-full text-xs">{teacher.subject}</Badge>
                  <Badge variant="outline" className="border-white/40 text-white font-black text-[10px]">{teacher.official_id}</Badge>
                  {teacher.is_main_teacher && (
                    <Badge className="bg-amber-400 text-black border-none font-black text-[10px]">
                      <Star className="size-2.5 mr-1 fill-black" /> PP {teacher.main_teacher_class}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Nom mobile */}
          <div className="md:hidden pt-14 px-6 pb-2">
            <h1 className="text-xl font-black uppercase">{teacher.full_name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-none font-bold px-3 py-1 rounded-full text-[10px]">{teacher.subject}</Badge>
              <Badge variant="outline" className="border-primary/20 text-primary font-black text-[9px]">{teacher.official_id}</Badge>
            </div>
          </div>

          <div className="pt-8 md:pt-24 pb-8 md:pb-12 px-6 md:px-16">
            <Tabs defaultValue="affectations" className="space-y-8">
              <TabsList className="bg-muted/50 border-2 rounded-2xl h-12 md:h-14 p-1 flex w-full md:w-fit">
                <TabsTrigger value="affectations" className="flex-1 md:flex-none rounded-xl font-black px-6 text-[9px] md:text-sm uppercase data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center gap-2">
                  <Layers className="size-4" /> Classes
                </TabsTrigger>
                <TabsTrigger value="informations" className="flex-1 md:flex-none rounded-xl font-black px-6 text-[9px] md:text-sm uppercase data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center gap-2">
                  <Info className="size-4" /> Informations
                </TabsTrigger>
                <TabsTrigger value="securite" className="flex-1 md:flex-none rounded-xl font-black px-6 text-[9px] md:text-sm uppercase data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center gap-2">
                  <Lock className="size-4" /> Sécurité
                </TabsTrigger>
              </TabsList>

              {/* ── CLASSES ── */}
              <TabsContent value="affectations" className="space-y-8 animate-in fade-in">
                <div className="grid lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-[10px] uppercase text-primary tracking-widest">Classes sélectionnées</p>
                        <Badge className="bg-primary text-white font-black text-[9px]">{selectedClasses.length}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedClasses.length === 0 ? (
                          <p className="text-[10px] italic text-muted-foreground opacity-50">Aucune classe assignée</p>
                        ) : selectedClasses.map(c => (
                          <Badge key={c} onClick={() => toggleClass(c)} className="bg-foreground text-white font-black px-3 py-1.5 rounded-xl text-[9px] cursor-pointer hover:bg-red-600 transition-all">
                            {c} <X className="size-2.5 ml-1.5 inline" />
                          </Badge>
                        ))}
                      </div>
                      <Button onClick={handleSaveClasses} disabled={savingClasses} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase text-xs">
                        {savingClasses ? <Loader2 className="animate-spin mr-2 size-4" /> : <ShieldCheck className="mr-2 size-4" />}
                        Sauvegarder les classes
                      </Button>
                    </div>

                    {/* Professeur principal */}
                    {selectedClasses.length > 0 && (
                      <div className="p-6 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-200 space-y-3">
                        <p className="font-black text-[10px] uppercase text-amber-700 tracking-widest flex items-center gap-2">
                          <Star className="size-3.5 fill-amber-600 text-amber-600" /> Professeur Principal
                        </p>
                        <p className="text-[9px] text-amber-700/70 font-medium">Désignez une classe où cet enseignant est PP</p>
                        <div className="space-y-1.5">
                          {selectedClasses.map(c => (
                            <button key={c} onClick={() => handleToggleMainTeacher(c)}
                              className={cn("w-full p-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between",
                                teacher.is_main_teacher && teacher.main_teacher_class === c
                                  ? "bg-amber-500 text-white shadow-md"
                                  : "bg-white text-amber-700 hover:bg-amber-100")}>
                              {c}
                              {teacher.is_main_teacher && teacher.main_teacher_class === c && <CheckCircle2 className="size-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-8 space-y-4">
                    <p className="font-black text-[10px] uppercase text-muted-foreground tracking-widest px-2">Cliquez pour assigner / retirer</p>
                    <ScrollArea className="h-[400px] rounded-[2rem] border-2 bg-muted/5 p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {OFFICIAL_CLASSES.map(cls => (
                          <button key={cls} onClick={() => toggleClass(cls)}
                            className={cn("p-4 rounded-2xl border-2 font-black text-[11px] md:text-sm transition-all",
                              selectedClasses.includes(cls)
                                ? "bg-primary text-white border-primary shadow-lg"
                                : "bg-white text-muted-foreground border-transparent hover:border-primary/20")}>
                            {cls}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

              {/* ── INFOS ── */}
              <TabsContent value="informations" className="space-y-8 animate-in fade-in">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <h3 className="font-black text-lg uppercase border-l-4 border-primary pl-4">Identité</h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="font-black text-[9px] uppercase text-muted-foreground">Nom complet</Label>
                        <Input disabled={!isEditing} value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="h-12 rounded-xl font-bold border-2" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-black text-[9px] uppercase text-muted-foreground">ID Officiel</Label>
                        <Input disabled={!isEditing} value={editForm.official_id} onChange={e => setEditForm({...editForm, official_id: e.target.value})} className="h-12 rounded-xl font-bold border-2 uppercase" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-black text-[9px] uppercase text-muted-foreground">Téléphone</Label>
                        <Input disabled={!isEditing} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="h-12 rounded-xl font-bold border-2" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h3 className="font-black text-lg uppercase border-l-4 border-primary pl-4">Matière Principale</h3>
                    {isEditing ? (
                      <Select value={editForm.subject} onValueChange={v => setEditForm({...editForm, subject: v})}>
                        <SelectTrigger className="h-12 rounded-xl border-2 font-black"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[250px]">
                          {SUBJECTS.map(s => <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-12 rounded-xl bg-muted/30 flex items-center px-4 font-black border-2 border-transparent">
                        {teacher.subject || "---"}
                      </div>
                    )}

                    <Card className="p-6 bg-foreground text-white rounded-2xl shadow-xl relative overflow-hidden">
                      <div className="relative z-10 space-y-3">
                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Statistiques</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white/70">Classes assignées</span>
                          <span className="text-xl font-black text-primary">{teacher.classes?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white/70">Professeur principal</span>
                          <span className="text-xs font-black text-amber-400">{teacher.is_main_teacher ? teacher.main_teacher_class : "Non"}</span>
                        </div>
                      </div>
                      <ShieldCheck className="absolute -bottom-8 -right-8 size-32 text-white/[0.03]" />
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* ── SÉCURITÉ ── */}
              <TabsContent value="securite" className="space-y-6 animate-in fade-in">
                <Card className="p-8 rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 max-w-md space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Lock className="size-5" />
                    </div>
                    <h3 className="font-black text-base uppercase">Réinitialiser le mot de passe</h3>
                  </div>
                  <Input type="text" placeholder="Nouveau mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-12 rounded-xl border-2 font-bold" />
                  <Button onClick={handleChangePassword} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase text-xs">
                    Mettre à jour le mot de passe
                  </Button>
                  <p className="text-[9px] text-muted-foreground italic">L'enseignant devra utiliser ce nouveau mot de passe pour se connecter.</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}