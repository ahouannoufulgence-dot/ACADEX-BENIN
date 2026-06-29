"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  UserSquare2, Search, Plus, BookOpen, ChevronRight,
  ShieldCheck, FileDown, Users, Loader2, Phone,
  CheckCircle2, UserX, MoreVertical, Clock, Zap,
  Save, Trash2, Award, GraduationCap, Mail
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { jsPDF } from "jspdf"

const OFFICIAL_CLASSES = [
  "6EME A","6EME B","5EME A","5EME B","4EME A","4EME B","3EME D1","3EME D2",
  "2NDE A","2NDE B","2NDE C","2NDE D","1ERE A","1ERE B","1ERE C","1ERE D",
  "TLE A","TLE B","TLE C","TLE D"
]

const MATIERES = [
  "Mathématiques","Français","Anglais","Physique-Chimie","SVT",
  "Histoire-Géographie","Philosophie","Informatique","EPS","Économie","Autre"
]

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [schoolConfig, setSchoolConfig] = useState<any>(null)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])

  const [form, setForm] = useState({
    full_name: "",
    official_id: "",
    subject: "",
    phone: "",
    password: "",
    status: "Actif"
  })

  const fetchTeachers = async () => {
    setLoading(true)
    const [tRes, cRes] = await Promise.all([
      supabase.from('teachers').select('*').order('full_name', { ascending: true }),
      supabase.from('school_settings').select('*').eq('id', 'main_config').single()
    ])
    setTeachers(tRes.data || [])
    if (cRes.data) setSchoolConfig(cRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchTeachers() }, [])

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t =>
      (t.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (t.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (t.official_id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [teachers, searchTerm])

  const stats = useMemo(() => ({
    total: teachers.length,
    active: teachers.filter(t => t.status === 'Actif').length,
    pending: teachers.filter(t => t.status === 'En attente' || !t.status).length,
    subjects: new Set(teachers.map(t => t.subject).filter(Boolean)).size
  }), [teachers])

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls])
  }

  const handleAdd = async () => {
    if (!form.full_name || !form.official_id || !form.subject || !form.password) {
      toast({ title: "Champs requis", description: "Remplissez tous les champs obligatoires", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('teachers').insert({
        full_name: form.full_name,
        official_id: form.official_id.toUpperCase(),
        subject: form.subject,
        phone: form.phone,
        password: form.password,
        classes: selectedClasses,
        status: form.status
      })
      if (error) throw error
      toast({ title: "Enseignant recruté", description: `${form.full_name} a rejoint l'équipe pédagogique` })
      setIsAdding(false)
      setForm({ full_name: "", official_id: "", subject: "", phone: "", password: "", status: "Actif" })
      setSelectedClasses([])
      fetchTeachers()
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (teacherId: string, newStatus: string) => {
    const { error } = await supabase.from('teachers').update({ status: newStatus }).eq('id', teacherId)
    if (!error) {
      toast({ title: "Statut mis à jour" })
      fetchTeachers()
    }
  }

  const deleteTeacher = async (teacherId: string) => {
    const { error } = await supabase.from('teachers').delete().eq('id', teacherId)
    if (!error) {
      toast({ title: "Enseignant supprimé" })
      fetchTeachers()
    }
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    const schoolName = schoolConfig?.school_name || "ACADEX"
    const primaryColor: [number, number, number] = [20, 83, 45]
    const W = 210

    // Header
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, W, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), 14, 20)
    doc.setFontSize(12)
    doc.text('LISTE DES ENSEIGNANTS', 14, 30)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, W - 14, 30, { align: 'right' })

    // Stats
    doc.setFillColor(240, 253, 244)
    doc.rect(14, 48, W - 28, 16, 'F')
    doc.setTextColor(20, 83, 45)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total : ${stats.total} enseignants`, 20, 58)
    doc.text(`Actifs : ${stats.active}`, 80, 58)
    doc.text(`Matières : ${stats.subjects}`, 130, 58)

    // Tableau
    doc.setFillColor(...primaryColor)
    doc.rect(14, 72, W - 28, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text('NOM COMPLET', 18, 79)
    doc.text('ID OFFICIEL', 75, 79)
    doc.text('MATIÈRE', 110, 79)
    doc.text('CLASSES', 145, 79)
    doc.text('STATUT', 182, 79)

    teachers.forEach((t, i) => {
      const y = 88 + i * 10
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(14, y - 6, W - 28, 10, 'F')
      }
      doc.setTextColor(50, 50, 50)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text((t.full_name || '---').substring(0, 22), 18, y)
      doc.text(t.official_id || '---', 75, y)
      doc.text((t.subject || '---').substring(0, 16), 110, y)
      doc.text((t.classes || []).length + ' classe(s)', 145, y)
      doc.setTextColor(t.status === 'Actif' ? 20 : 185, t.status === 'Actif' ? 83 : 28, t.status === 'Actif' ? 45 : 28)
      doc.setFont('helvetica', 'bold')
      doc.text(t.status || 'Inconnu', 182, y)
    })

    doc.save(`equipe-pedagogique-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">
              Équipe <span className="text-primary italic">Pédagogique</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[9px] md:text-sm uppercase tracking-widest">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span>Pilotage Stratégique • {schoolConfig?.school_name || "ACADEX"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="outline" onClick={exportPDF} className="h-12 md:h-14 px-5 md:px-8 rounded-xl md:rounded-2xl border-2 font-black bg-white text-[10px] md:text-sm active:scale-95 transition-all shadow-sm">
              <FileDown className="mr-2 size-4" /> Exporter PDF
            </Button>
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-xl h-12 md:h-14 px-5 md:px-10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm active:scale-95 transition-all">
                  <Plus className="mr-2 size-4" /> Recruter
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem] w-[95%] max-w-lg p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 bg-primary text-white sticky top-0 z-10">
                  <DialogTitle className="text-xl font-black uppercase">Nouveau Recrutement</DialogTitle>
                  <p className="text-white/60 text-[9px] font-bold uppercase mt-1">Équipe Pédagogique ACADEX</p>
                </div>
                <div className="p-6 space-y-4 bg-[#F8FAFC]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">Nom complet *</Label>
                      <Input placeholder="Ex: Michel Ahouannou" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="h-11 rounded-xl border-2 font-bold text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">ID Officiel *</Label>
                      <Input placeholder="Ex: ENS-MAT-001" value={form.official_id} onChange={e => setForm({...form, official_id: e.target.value})} className="h-11 rounded-xl border-2 font-bold text-sm uppercase" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">Téléphone</Label>
                      <Input placeholder="+229 00 00 00 00" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-11 rounded-xl border-2 font-bold text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">Matière *</Label>
                      <Select value={form.subject} onValueChange={v => setForm({...form, subject: v})}>
                        <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[200px]">
                          {MATIERES.map(m => <SelectItem key={m} value={m} className="font-bold text-xs">{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">Mot de passe *</Label>
                      <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="h-11 rounded-xl border-2 font-bold text-sm" />
                    </div>
                  </div>

                  {/* Classes */}
                  <div className="space-y-2">
                    <Label className="font-black text-[8px] uppercase text-muted-foreground">
                      Classes assignées ({selectedClasses.length} sélectionnée{selectedClasses.length > 1 ? 's' : ''})
                    </Label>
                    <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border-2">
                      {OFFICIAL_CLASSES.map(cls => (
                        <button key={cls} onClick={() => toggleClass(cls)}
                          className={cn("p-2 rounded-lg text-[8px] font-black uppercase transition-all border-2",
                            selectedClasses.includes(cls) ? "bg-primary text-white border-primary" : "bg-muted/20 text-muted-foreground border-transparent hover:border-primary/30")}>
                          {cls}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleAdd} disabled={saving} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase">
                    {saving ? <Loader2 className="animate-spin size-4" /> : <Plus className="size-4 mr-2" />} Recruter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Total", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Actifs", value: stats.active, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "En attente", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Matières", value: stats.subjects, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((stat, i) => (
            <Card key={i} className="p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] border-none shadow-sm bg-white group hover:shadow-lg transition-all relative overflow-hidden">
              <div className={cn("absolute -top-4 -right-4 size-16 rounded-full opacity-[0.04]", stat.bg)} />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={cn("p-2.5 rounded-xl shadow-sm group-hover:bg-primary group-hover:text-white transition-all", stat.bg, stat.color)}>
                  <stat.icon className="size-4" />
                </div>
                <Badge variant="outline" className="border-none text-[7px] font-black uppercase bg-muted/50 px-2">LIVE</Badge>
              </div>
              <div className="relative z-10">
                <p className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{stat.label}</p>
                <h3 className="text-2xl md:text-4xl font-black">{loading ? "..." : stat.value}</h3>
              </div>
            </Card>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Chercher un nom, matière ou ID..." className="pl-12 h-12 md:h-14 bg-white border-none shadow-sm rounded-[1.5rem] font-bold text-sm"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {/* Liste */}
        <Card className="border-none shadow-sm bg-white rounded-[2.2rem] md:rounded-[3rem] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-30">
              <Loader2 className="animate-spin text-primary size-10" />
              <p className="font-black text-[10px] uppercase tracking-widest">Chargement...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
              <div className="size-20 bg-muted rounded-[2rem] flex items-center justify-center shadow-inner">
                <UserSquare2 className="size-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase">Aucun enseignant</h3>
                <p className="text-xs text-muted-foreground mt-1">Cliquez sur "Recruter" pour ajouter</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-muted/20">
              {filteredTeachers.map((teacher: any) => (
                <div key={teacher.id} className="p-5 md:p-8 flex items-center justify-between hover:bg-muted/5 transition-all group">
                  <div className="flex items-center gap-4 md:gap-6 min-w-0">
                    <Avatar className="size-12 md:size-16 border-4 border-muted group-hover:border-primary/20 transition-all shadow-sm shrink-0">
                      <AvatarFallback className="font-black text-sm bg-primary/10 text-primary uppercase">
                        {(teacher.full_name || "??").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-black text-sm md:text-xl uppercase truncate group-hover:text-primary transition-colors">
                        {teacher.full_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <Badge className="bg-primary text-white border-none font-black text-[7px] md:text-[9px] px-2 uppercase">
                          {teacher.subject || "---"}
                        </Badge>
                        {teacher.phone && (
                          <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1 hidden sm:flex">
                            <Phone className="size-2.5 text-primary" /> {teacher.phone}
                          </span>
                        )}
                        <span className="text-[8px] font-black text-muted-foreground/60 uppercase hidden sm:block">
                          {teacher.official_id}
                        </span>
                        <Badge className={cn("font-black text-[7px] border-2 uppercase px-2 rounded-full",
                          teacher.status === 'Actif' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' :
                          'border-amber-100 text-amber-600 bg-amber-50')}>
                          {teacher.status || 'En attente'}
                        </Badge>
                        {teacher.classes && teacher.classes.length > 0 && (
                          <Badge variant="outline" className="font-black text-[7px] border-primary/20 text-primary hidden md:flex">
                            <GraduationCap className="size-2.5 mr-1" /> {teacher.classes.length} classe{teacher.classes.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-10 md:size-12 rounded-xl hover:bg-muted transition-all">
                          <MoreVertical className="size-4 md:size-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-2xl border-2 p-2 shadow-2xl">
                        <DropdownMenuItem onClick={() => updateStatus(teacher.id, "Actif")} className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer">
                          <CheckCircle2 className="size-4 text-emerald-500" /> Valider l'accès
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(teacher.id, "Suspendu")} className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer">
                          <UserX className="size-4 text-amber-500" /> Suspendre
                        </DropdownMenuItem>
                        <div className="h-px bg-muted my-1" />
                        <DropdownMenuItem onClick={() => deleteTeacher(teacher.id)} className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer text-destructive">
                          <Trash2 className="size-4" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" asChild className="size-10 md:size-12 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                      <Link href={`/enseignants/${teacher.id}`}>
                        <ChevronRight className="size-4 md:size-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}