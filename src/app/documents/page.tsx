"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  FileText, Search, Plus, Download, Trash2, Loader2,
  FileCheck, ShieldCheck, Upload, File, Image as ImageIcon,
  FileType, X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

const OFFICIAL_CLASSES = [
  "6EME A","6EME B","5EME A","5EME B","4EME A","4EME B","3EME D1","3EME D2",
  "2NDE A","2NDE B","2NDE C","2NDE D","1ERE A","1ERE B","1ERE C","1ERE D",
  "TLE A","TLE B","TLE C","TLE D"
]

const TYPES_EPREUVE = ["Devoir", "Interrogation", "Composition", "Examen Blanc", "Fiche de Cours", "Correction", "Autre"]
const TERMS = ["T1", "T2", "T3"]

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return { icon: FileText, color: "text-red-600", bg: "bg-red-50" }
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return { icon: ImageIcon, color: "text-blue-600", bg: "bg-blue-50" }
  if (['doc', 'docx'].includes(ext || '')) return { icon: FileType, color: "text-indigo-600", bg: "bg-indigo-50" }
  return { icon: File, color: "text-muted-foreground", bg: "bg-muted" }
}

export default function DocumentsPage() {
  const [userRole, setUserRole] = useState("")
  const [userName, setUserName] = useState("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [userSubject, setUserSubject] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [epreuves, setEpreuves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState("all")
  const [filterSubject, setFilterSubject] = useState("all")
  const [filterTerm, setFilterTerm] = useState("all")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    title: "",
    subject: "",
    class_id: "",
    term: "T1",
    type_epreuve: "Devoir"
  })

  const isStaff = userRole === "Directeur" || userRole === "Enseignant"

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role') || ""
    setUserRole(role)
    setUserName(localStorage.getItem('acadex_user_name') || "")
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setUserSubject(localStorage.getItem('acadex_user_subject') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")

    if (role === 'Enseignant') {
      setForm(f => ({ ...f, subject: localStorage.getItem('acadex_user_subject') || "" }))
    }

    if (role === 'Élève') {
      const userId = localStorage.getItem('acadex_user_id') || ""
      supabase.from('students').select('class_id').eq('matricule', userId).single().then(({ data }) => {
        if (data?.class_id) setStudentClass(data.class_id)
      })
    }
  }, [])

  const fetchEpreuves = async () => {
    setLoading(true)
    let q = supabase.from('epreuves').select('*').eq('academic_year', activeYear).order('created_at', { ascending: false })

    if (userRole === 'Élève' && studentClass) {
      q = q.eq('class_id', studentClass)
    } else if (userRole === 'Enseignant' && userClasses.length > 0) {
      q = q.in('class_id', userClasses)
    }

    const { data } = await q
    setEpreuves(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (userRole === 'Élève' && !studentClass) return
    fetchEpreuves()
  }, [userRole, studentClass, userClasses, activeYear])

  const filteredEpreuves = useMemo(() => {
    return epreuves.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.subject.toLowerCase().includes(searchTerm.toLowerCase())
      const matchClass = filterClass === 'all' || e.class_id === filterClass
      const matchSubject = filterSubject === 'all' || e.subject === filterSubject
      const matchTerm = filterTerm === 'all' || e.term === filterTerm
      return matchSearch && matchClass && matchSubject && matchTerm
    })
  }, [epreuves, searchTerm, filterClass, filterSubject, filterTerm])

  const availableSubjects = useMemo(() => [...new Set(epreuves.map(e => e.subject))].sort(), [epreuves])
  const availableClasses = useMemo(() => {
    if (userRole === 'Enseignant') return userClasses
    return OFFICIAL_CLASSES
  }, [userRole, userClasses])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Maximum 10 Mo", variant: "destructive" })
      return
    }
    setSelectedFile(file)
    if (!form.title) {
      setForm(f => ({ ...f, title: file.name.replace(/\.[^/.]+$/, "") }))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !form.title || !form.subject || !form.class_id) {
      toast({ title: "Champs requis", description: "Fichier, titre, matière et classe sont obligatoires", variant: "destructive" })
      return
    }
    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${activeYear}/${form.class_id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('epreuves').upload(filePath, selectedFile)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('epreuves').getPublicUrl(filePath)

      const { error: insertError } = await supabase.from('epreuves').insert({
        title: form.title,
        subject: form.subject,
        class_id: form.class_id,
        term: form.term,
        type_epreuve: form.type_epreuve,
        file_url: urlData.publicUrl,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        uploaded_by: userName,
        uploaded_by_role: userRole,
        academic_year: activeYear
      })
      if (insertError) throw insertError

      toast({ title: "Document publié", description: `Visible par les élèves de ${form.class_id}` })
      setIsAdding(false)
      setSelectedFile(null)
      setForm({ title: "", subject: userRole === 'Enseignant' ? userSubject : "", class_id: "", term: "T1", type_epreuve: "Devoir" })
      fetchEpreuves()
    } catch (e: any) {
      toast({ title: "Erreur d'envoi", description: e.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: any) => {
    try {
      const urlParts = doc.file_url.split('/epreuves/')
      const filePath = urlParts[1]
      if (filePath) {
        await supabase.storage.from('epreuves').remove([filePath])
      }
      await supabase.from('epreuves').delete().eq('id', doc.id)
      toast({ title: "Document supprimé" })
      fetchEpreuves()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return "--"
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${Math.round(bytes / 1024)} Ko` : `${mb.toFixed(1)} Mo`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">
              Documents <span className="text-primary italic">& Épreuves</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[9px] md:text-sm uppercase tracking-widest">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span>
                {userRole === 'Élève' ? `Documents de ${studentClass || "votre classe"}` : "Bibliothèque Pédagogique"} • {activeYear}
              </span>
            </div>
          </div>

          {isStaff && (
            <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setSelectedFile(null) }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-xl h-12 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm active:scale-95 transition-all">
                  <Plus className="mr-2 size-4" /> Publier un document
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem] w-[95%] max-w-lg p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 bg-primary text-white sticky top-0 z-10">
                  <DialogTitle className="text-xl font-black uppercase">Nouveau Document</DialogTitle>
                  <p className="text-white/60 text-[9px] font-bold uppercase mt-1">PDF, Image ou Word — Max 10 Mo</p>
                </div>
                <div className="p-6 space-y-4 bg-[#F8FAFC]">

                  {/* Zone de dépôt */}
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={handleFileSelect} className="hidden" />
                  {!selectedFile ? (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 rounded-2xl border-4 border-dashed border-primary/20 bg-white flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all">
                      <Upload className="size-8 text-primary/40" />
                      <p className="text-xs font-black text-muted-foreground uppercase">Cliquer pour choisir un fichier</p>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-primary/20">
                      {(() => {
                        const { icon: Icon, color, bg } = getFileIcon(selectedFile.name)
                        return <div className={cn("size-12 rounded-xl flex items-center justify-center shrink-0", bg, color)}><Icon className="size-6" /></div>
                      })()}
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-xs truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatSize(selectedFile.size)}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="size-8 rounded-lg text-muted-foreground shrink-0">
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="font-black text-[8px] uppercase text-muted-foreground">Titre du document</Label>
                    <Input placeholder="Ex: Devoir 1 - Fonctions" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="h-11 rounded-xl border-2 font-bold text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">Type</Label>
                      <Select value={form.type_epreuve} onValueChange={v => setForm({...form, type_epreuve: v})}>
                        <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {TYPES_EPREUVE.map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">Trimestre</Label>
                      <Select value={form.term} onValueChange={v => setForm({...form, term: v})}>
                        <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {TERMS.map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-black text-[8px] uppercase text-muted-foreground">Matière</Label>
                    {userRole === 'Enseignant' ? (
                      <Input disabled value={form.subject} className="h-11 rounded-xl border-2 font-bold text-sm bg-muted/30" />
                    ) : (
                      <Input placeholder="Ex: Mathématiques" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="h-11 rounded-xl border-2 font-bold text-sm" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-black text-[8px] uppercase text-muted-foreground">Classe destinataire</Label>
                    <Select value={form.class_id} onValueChange={v => setForm({...form, class_id: v})}>
                      <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                      <SelectContent className="rounded-xl max-h-[200px]">
                        {availableClasses.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleUpload} disabled={uploading} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase">
                    {uploading ? <Loader2 className="animate-spin size-4" /> : <Upload className="size-4 mr-2" />} Publier
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Rechercher un document..." className="pl-12 h-12 bg-white border-none shadow-sm rounded-2xl font-bold text-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {isStaff && (
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="h-12 rounded-xl border-none shadow-sm bg-white font-bold text-xs w-36 shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl max-h-[250px]">
                  <SelectItem value="all" className="font-bold text-xs">Toutes classes</SelectItem>
                  {availableClasses.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="h-12 rounded-xl border-none shadow-sm bg-white font-bold text-xs w-40 shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl max-h-[250px]">
                <SelectItem value="all" className="font-bold text-xs">Toutes matières</SelectItem>
                {availableSubjects.map(s => <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger className="h-12 rounded-xl border-none shadow-sm bg-white font-bold text-xs w-32 shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-bold text-xs">Tous trimestres</SelectItem>
                {TERMS.map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des documents */}
        <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-30">
              <Loader2 className="animate-spin text-primary size-10" />
              <p className="font-black text-[10px] uppercase tracking-widest">Chargement...</p>
            </div>
          ) : filteredEpreuves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
              <div className="size-20 bg-muted rounded-[2rem] flex items-center justify-center shadow-inner">
                <FileText className="size-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase">Aucun document</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isStaff ? "Cliquez sur \"Publier un document\" pour commencer" : "Aucune épreuve disponible pour le moment"}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-muted/20">
              {filteredEpreuves.map((doc) => {
                const { icon: Icon, color, bg } = getFileIcon(doc.file_name)
                return (
                  <div key={doc.id} className="p-5 md:p-8 flex items-center justify-between hover:bg-muted/5 transition-all group">
                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                      <div className={cn("size-12 md:size-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform", bg, color)}>
                        <Icon className="size-5 md:size-7" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm md:text-xl text-foreground group-hover:text-primary transition-colors truncate">{doc.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <Badge className="bg-primary text-white border-none font-black text-[7px] md:text-[9px] px-2 uppercase">{doc.subject}</Badge>
                          <Badge variant="outline" className="font-black text-[7px] md:text-[9px] border-primary/20 text-primary">{doc.class_id}</Badge>
                          <Badge variant="outline" className="font-black text-[7px] md:text-[9px]">{doc.type_epreuve} • {doc.term}</Badge>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase hidden sm:inline">{formatSize(doc.file_size)}</span>
                        </div>
                        <p className="text-[8px] font-bold text-muted-foreground/60 uppercase mt-1">
                          Par {doc.uploaded_by} • {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                      <Button variant="ghost" size="icon" asChild className="size-10 md:size-12 rounded-xl hover:bg-primary hover:text-white transition-all">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="size-4 md:size-5" />
                        </a>
                      </Button>
                      {isStaff && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-10 md:size-12 rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all">
                              <Trash2 className="size-4 md:size-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] w-[95%]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black">Supprimer ce document ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{doc.title}" ne sera plus accessible aux élèves de {doc.class_id}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(doc)} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                     
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}