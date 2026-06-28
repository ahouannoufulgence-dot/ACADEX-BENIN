"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  UserCheck, ShieldAlert, ChevronLeft, Loader2, Search,
  ShieldCheck, Award, Calendar, Clock, AlertTriangle,
  Users, CheckCircle2, X, History, Settings
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const TYPES_FAUTE = ["Bavardage", "Tenue incorrecte", "Absence répétée", "Fraude/Examen", "Violence", "Manque de respect", "Téléphone en classe", "Autre"]
const TYPES_SANCTION = ["Avertissement oral", "Avertissement écrit", "Retenue", "Exclusion temporaire", "Convocation parents"]
const MATIERES = ["Mathématiques", "Français", "Anglais", "PCT", "SVT", "Histoire-Géo", "Philosophie", "Allemand", "Espagnol", "Économie", "Informatique", "EPS"]

export default function VieScolairePage() {
  const [userRole, setUserRole] = useState("")
  const [userName, setUserName] = useState("")
  const [userSubject, setUserSubject] = useState("")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [trimestre, setTrimestre] = useState("T1")
  const [activeTab, setActiveTab] = useState("presence")
  const [mounted, setMounted] = useState(false)

  // Sélection classe → élève
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [collectiveMode, setCollectiveMode] = useState(false)

  // Données
  const [presences, setPresences] = useState<any[]>([])
  const [sanctions, setSanctions] = useState<any[]>([])
  const [conductConfig, setConductConfig] = useState<any>({ note_depart: 20, seuil_absences: 3, bareme: {} })
  const [loading, setLoading] = useState(false)

  // Formulaires
  const [presenceForm, setPresenceForm] = useState({ statut: "Absent", heure: "08:00", matiere: "", justifiee: false, motif: "" })
  const [sanctionForm, setSanctionForm] = useState({ type_faute: "Bavardage", sanction: "Avertissement oral", points_retranches: 2, motif: "" })
  const [configForm, setConfigForm] = useState({ note_depart: 20, seuil_absences: 3, bareme: {} as Record<string, number> })

  useEffect(() => {
    const role = localStorage.getItem("acadex_user_role") || ""
    const name = localStorage.getItem("acadex_user_name") || ""
    const subject = localStorage.getItem("acadex_user_subject") || ""
    const year = localStorage.getItem("acadex_active_year") || "2026-2027"
    setUserRole(role)
    setUserName(name)
    setUserSubject(subject)
    setActiveYear(year)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!activeYear || !mounted) return
    const fetchStudents = async () => {
      setLoadingStudents(true)
      const { data } = await supabase.from("students").select("*").eq("academic_year", activeYear).eq("status", "Actif").order("last_name")
      setStudents(data || [])
      setLoadingStudents(false)
    }
    const fetchConfig = async () => {
      const { data } = await supabase.from("conduct_config").select("*").eq("id", "main").single()
      if (data) {
        setConductConfig(data)
        setConfigForm({ note_depart: data.note_depart, seuil_absences: data.seuil_absences, bareme: data.bareme || {} })
      }
    }
    fetchStudents()
    fetchConfig()
  }, [activeYear, mounted])

  useEffect(() => {
    if (!activeYear || !trimestre || !mounted) return
    const fetchData = async () => {
      const [pRes, sRes] = await Promise.all([
        supabase.from("presences").select("*").eq("academic_year", activeYear).eq("trimestre", trimestre).order("created_at", { ascending: false }),
        supabase.from("sanctions").select("*").eq("academic_year", activeYear).eq("trimestre", trimestre).order("created_at", { ascending: false })
      ])
      setPresences(pRes.data || [])
      setSanctions(sRes.data || [])
    }
    fetchData()
  }, [activeYear, trimestre, mounted])

  const classes = useMemo(() => [...new Set(students.map(s => s.class_id))].sort(), [students])

  const classStudents = useMemo(() => {
    if (!selectedClass) return []
    return students.filter(s => s.class_id === selectedClass && `${s.last_name} ${s.first_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [students, selectedClass, searchTerm])

  const getStudentStats = (matricule: string) => {
    const sp = presences.filter(p => p.student_matricule === matricule)
    const ss = sanctions.filter(s => s.student_matricule === matricule)
    const absNonJust = sp.filter(p => p.statut === "Absent" && !p.justifiee).length
    const absJust = sp.filter(p => p.statut === "Absent" && p.justifiee).length
    const retards = sp.filter(p => p.statut === "Retard").length
    const totalPoints = ss.reduce((acc, s) => acc + Number(s.points_retranches || 0), 0)
    const noteConduite = Math.max(0, (conductConfig.note_depart || 20) - totalPoints)
    return { absNonJust, absJust, retards, sanctions: ss.length, noteConduite, atRisk: absNonJust >= (conductConfig.seuil_absences || 3) }
  }

  const handleAddPresence = async () => {
    if (!presenceForm.matiere) { toast({ title: "Choisir une matière", variant: "destructive" }); return }
    const targets = collectiveMode && selectedClass
      ? students.filter(s => s.class_id === selectedClass)
      : selectedStudent ? [selectedStudent] : []
    if (targets.length === 0) { toast({ title: "Sélectionner un élève ou activer le mode collectif", variant: "destructive" }); return }

    setLoading(true)
    try {
      const rows = targets.map(s => ({
        student_matricule: s.matricule,
        student_name: `${s.last_name} ${s.first_name}`,
        class_id: s.class_id,
        date: new Date().toISOString().split("T")[0],
        heure: presenceForm.heure,
        matiere: presenceForm.matiere,
        statut: presenceForm.statut,
        justifiee: presenceForm.justifiee,
        motif: presenceForm.motif,
        saisi_par: userName,
        academic_year: activeYear,
        trimestre
      }))
      const { error } = await supabase.from("presences").insert(rows)
      if (error) throw error
      toast({ title: `${targets.length} entrée(s) scellée(s)` })
      setPresenceForm({ statut: "Absent", heure: "08:00", matiere: "", justifiee: false, motif: "" })
      const { data } = await supabase.from("presences").select("*").eq("academic_year", activeYear).eq("trimestre", trimestre).order("created_at", { ascending: false })
      setPresences(data || [])
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally { setLoading(false) }
  }

  const handleAddSanction = async () => {
    const targets = collectiveMode && selectedClass
      ? students.filter(s => s.class_id === selectedClass)
      : selectedStudent ? [selectedStudent] : []
    if (targets.length === 0) { toast({ title: "Sélectionner un élève ou activer le mode collectif", variant: "destructive" }); return }

    setLoading(true)
    try {
      const rows = targets.map(s => ({
        student_matricule: s.matricule,
        student_name: `${s.last_name} ${s.first_name}`,
        class_id: s.class_id,
        date: new Date().toISOString().split("T")[0],
        type_faute: sanctionForm.type_faute,
        sanction: sanctionForm.sanction,
        points_retranches: Number(sanctionForm.points_retranches),
        motif: sanctionForm.motif,
        saisi_par: userName,
        collective: collectiveMode,
        academic_year: activeYear,
        trimestre
      }))
      const { error } = await supabase.from("sanctions").insert(rows)
      if (error) throw error
      toast({ title: `Sanction scellée pour ${targets.length} élève(s)` })
      setSanctionForm({ type_faute: "Bavardage", sanction: "Avertissement oral", points_retranches: 2, motif: "" })
      const { data } = await supabase.from("sanctions").select("*").eq("academic_year", activeYear).eq("trimestre", trimestre).order("created_at", { ascending: false })
      setSanctions(data || [])
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally { setLoading(false) }
  }

  const handleSaveConfig = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from("conduct_config").upsert({
        id: "main",
        note_depart: configForm.note_depart,
        seuil_absences: configForm.seuil_absences,
        bareme: configForm.bareme,
        academic_year: activeYear
      })
      if (error) throw error
      setConductConfig(configForm)
      toast({ title: "Configuration scellée" })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally { setLoading(false) }
  }

  if (!mounted) return null
  const isDirector = userRole === "Directeur"

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tight">Vie <span className="text-primary italic">Scolaire</span></h1>
            <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="size-3 text-emerald-500" /> {activeYear} • Registres Officiels
            </p>
          </div>
          <div className="flex items-center gap-3">
            {["T1","T2","T3"].map(t => (
              <button key={t} onClick={() => setTrimestre(t)}
                className={cn("h-10 md:h-12 px-5 md:px-8 rounded-xl font-black text-xs uppercase transition-all border-2",
                  trimestre === t ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-muted hover:border-primary/30"
                )}>{t}</button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">

          {/* Sidebar — Sélection classe/élève */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-4 md:p-6 rounded-[1.8rem] bg-white border-none shadow-sm">
              {!selectedClass ? (
                <div className="space-y-3">
                  <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Choisir une classe</p>
                  {loadingStudents ? (
                    <div className="flex justify-center py-8 opacity-30"><Loader2 className="animate-spin size-6 text-primary" /></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {classes.map(cls => {
                        const nb = students.filter(s => s.class_id === cls).length
                        const atRisk = students.filter(s => s.class_id === cls && getStudentStats(s.matricule).atRisk).length
                        return (
                          <button key={cls} onClick={() => setSelectedClass(cls)}
                            className="p-3 md:p-5 rounded-xl bg-muted/30 hover:bg-primary hover:text-white font-black text-[9px] md:text-sm uppercase transition-all border-2 border-transparent hover:border-primary shadow-sm active:scale-95 text-left relative">
                            <p>{cls}</p>
                            <p className="text-[7px] font-bold opacity-50 mt-1">{nb} élèves</p>
                            {atRisk > 0 && <span className="absolute top-2 right-2 size-4 bg-red-500 rounded-full text-[7px] text-white flex items-center justify-center font-black">{atRisk}</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => { setSelectedClass(null); setSelectedStudent(null); setCollectiveMode(false) }}
                      className="flex items-center gap-1 text-[8px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                      <ChevronLeft className="size-3" /> Classes
                    </button>
                    <Badge className="bg-primary text-white font-black text-[8px] px-3">{selectedClass}</Badge>
                  </div>

                  {/* Mode collectif */}
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2">
                      <Users className="size-3.5 text-amber-600" />
                      <span className="text-[8px] md:text-[10px] font-black uppercase text-amber-700">Mode Classe Entière</span>
                    </div>
                    <Switch checked={collectiveMode} onCheckedChange={v => { setCollectiveMode(v); if (v) setSelectedStudent(null) }} />
                  </div>

                  {!collectiveMode && (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                        <Input placeholder="Chercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-9 rounded-xl bg-muted/30 border-none font-bold text-xs shadow-inner" />
                      </div>
                      <ScrollArea className="h-[300px] md:h-[450px] pr-1 no-scrollbar">
                        <div className="space-y-1.5">
                          {classStudents.map(s => {
                            const stats = getStudentStats(s.matricule)
                            return (
                              <button key={s.id} onClick={() => setSelectedStudent(s)}
                                className={cn("w-full flex items-center gap-3 p-2.5 md:p-3 rounded-xl transition-all border-2",
                                  selectedStudent?.id === s.id ? "bg-primary text-white border-primary shadow-lg" : "bg-white border-transparent hover:bg-muted/5"
                                )}>
                                <Avatar className="size-8 border border-muted/20 shrink-0">
                                  <AvatarFallback className={cn("font-black text-[9px]", selectedStudent?.id === s.id ? "bg-white/10 text-white" : "bg-primary/5 text-primary")}>
                                    {s.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="text-left min-w-0 flex-1">
                                  <p className="font-black text-[9px] md:text-xs truncate uppercase">{s.last_name} {s.first_name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={cn("text-[7px] font-bold", selectedStudent?.id === s.id ? "text-white/60" : "text-muted-foreground/40")}>{s.matricule}</span>
                                    {stats.atRisk && <span className="text-[6px] font-black bg-red-500 text-white px-1 rounded">ALERTE</span>}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={cn("text-[8px] font-black", stats.noteConduite < 10 ? "text-red-500" : "text-emerald-600")}>{stats.noteConduite.toFixed(1)}</p>
                                  <p className="text-[6px] font-bold opacity-40">conduite</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </>
                  )}

                  {collectiveMode && (
                    <div className="p-4 bg-amber-50 rounded-xl text-center">
                      <Users className="size-6 text-amber-600 mx-auto mb-2" />
                      <p className="text-[9px] font-black uppercase text-amber-700">{classStudents.length} élèves sélectionnés</p>
                      <p className="text-[7px] font-medium text-amber-600 mt-1">L'action sera appliquée à toute la classe</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Stats élève sélectionné */}
            {selectedStudent && !collectiveMode && (() => {
              const stats = getStudentStats(selectedStudent.matricule)
              return (
                <Card className="p-4 md:p-6 rounded-[1.8rem] bg-white border-none shadow-sm space-y-4">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Bilan {selectedStudent.last_name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Abs. non just.", value: stats.absNonJust, color: stats.atRisk ? "text-red-600" : "text-foreground", bg: stats.atRisk ? "bg-red-50" : "bg-muted/30" },
                      { label: "Abs. justifiées", value: stats.absJust, color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Retards", value: stats.retards, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Sanctions", value: stats.sanctions, color: "text-red-600", bg: "bg-red-50" },
                    ].map(st => (
                      <div key={st.label} className={cn("p-3 rounded-xl text-center", st.bg)}>
                        <p className={cn("text-xl font-black", st.color)}>{st.value}</p>
                        <p className="text-[7px] font-black uppercase text-muted-foreground mt-0.5">{st.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className={cn("p-3 rounded-xl text-center border-2", stats.noteConduite >= 10 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200")}>
                    <p className={cn("text-2xl font-black", stats.noteConduite >= 10 ? "text-emerald-600" : "text-red-600")}>{stats.noteConduite.toFixed(1)}<span className="text-xs opacity-40">/20</span></p>
                    <p className="text-[7px] font-black uppercase text-muted-foreground mt-0.5">Note de conduite</p>
                  </div>
                  {stats.atRisk && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                      <AlertTriangle className="size-4 text-red-600 shrink-0" />
                      <p className="text-[8px] font-black text-red-700 uppercase">Seuil d'absences dépassé — action requise</p>
                    </div>
                  )}
                </Card>
              )
            })()}
          </div>

          {/* Zone principale */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedClass ? (
              <Card className="p-16 md:p-32 text-center rounded-[2rem] border-4 border-dashed bg-white/50 opacity-40 space-y-4">
                <UserCheck className="size-10 mx-auto text-muted-foreground" />
                <p className="font-black uppercase text-muted-foreground text-sm">Sélectionner une classe pour commencer</p>
              </Card>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white border-2 border-primary/5 rounded-2xl h-12 md:h-14 p-1 flex w-fit shadow-md mb-6">
                  <TabsTrigger value="presence" className="rounded-xl font-black px-5 md:px-8 text-[9px] md:text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2">
                    <UserCheck className="size-3.5" /> Présence
                  </TabsTrigger>
                  <TabsTrigger value="discipline" className="rounded-xl font-black px-5 md:px-8 text-[9px] md:text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2">
                    <ShieldAlert className="size-3.5" /> Discipline
                  </TabsTrigger>
                  {isDirector && (
                    <TabsTrigger value="config" className="rounded-xl font-black px-5 md:px-8 text-[9px] md:text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2">
                      <Settings className="size-3.5" /> Barème
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Onglet Présence */}
                <TabsContent value="presence" className="space-y-6 animate-in fade-in">
                  <Card className="p-5 md:p-8 rounded-[1.8rem] bg-white border-none shadow-sm border-l-[8px] border-primary">
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">
                      {collectiveMode ? `Saisie pour toute la classe ${selectedClass}` : selectedStudent ? `Saisie pour ${selectedStudent.last_name} ${selectedStudent.first_name}` : "Sélectionner un élève ou activer le mode classe"}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Statut</Label>
                        <Select value={presenceForm.statut} onValueChange={v => setPresenceForm({...presenceForm, statut: v})}>
                          <SelectTrigger className="h-10 md:h-12 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl border-2 p-1">
                            <SelectItem value="Absent" className="font-bold text-xs text-red-600 p-2.5 rounded-lg">Absent</SelectItem>
                            <SelectItem value="Retard" className="font-bold text-xs text-amber-600 p-2.5 rounded-lg">Retard</SelectItem>
                            <SelectItem value="Présent" className="font-bold text-xs text-emerald-600 p-2.5 rounded-lg">Présent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Matière</Label>
                        <Select value={presenceForm.matiere} onValueChange={v => setPresenceForm({...presenceForm, matiere: v})}>
                          <SelectTrigger className="h-10 md:h-12 rounded-xl border-2 font-black text-xs"><SelectValue placeholder="Choisir" /></SelectTrigger>
                          <SelectContent className="rounded-xl border-2 p-1 max-h-[200px]">
                            {MATIERES.map(m => <SelectItem key={m} value={m} className="font-bold text-xs p-2.5 rounded-lg">{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Heure</Label>
                        <Input type="time" value={presenceForm.heure} onChange={e => setPresenceForm({...presenceForm, heure: e.target.value})} className="h-10 md:h-12 rounded-xl border-2 font-black text-xs" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Motif</Label>
                        <Input placeholder="Détails..." value={presenceForm.motif} onChange={e => setPresenceForm({...presenceForm, motif: e.target.value})} className="h-10 md:h-12 rounded-xl border-2 font-bold text-xs" />
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                        <Switch checked={presenceForm.justifiee} onCheckedChange={v => setPresenceForm({...presenceForm, justifiee: v})} />
                        <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Justifiée</Label>
                      </div>
                    </div>
                    <Button onClick={handleAddPresence} disabled={loading || (!selectedStudent && !collectiveMode)} className="w-full mt-4 h-11 md:h-13 bg-primary rounded-xl font-black text-xs shadow-lg active:scale-95">
                      {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                      Sceller {collectiveMode ? `(${classStudents.length} élèves)` : ""}
                    </Button>
                  </Card>

                  {/* Journal présences */}
                  <Card className="border-none shadow-sm bg-white rounded-[1.8rem] overflow-hidden">
                    <div className="p-4 md:p-6 border-b bg-muted/5 flex items-center justify-between">
                      <h3 className="font-black text-sm md:text-lg flex items-center gap-2"><History className="size-4 text-primary" /> Journal Présences</h3>
                      <Badge className="bg-primary/10 text-primary font-black text-[8px]">{presences.filter(p => !selectedStudent || p.student_matricule === selectedStudent?.matricule).length} entrées</Badge>
                    </div>
                    <ScrollArea className="h-[350px]">
                      {presences.filter(p => !selectedStudent || p.student_matricule === selectedStudent?.matricule).filter(p => !selectedClass || p.class_id === selectedClass).map((p, i) => (
                        <div key={i} className="p-4 md:p-5 border-b border-muted/10 flex items-center gap-3 hover:bg-muted/5 transition-all">
                          <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", p.statut === "Absent" ? "bg-red-50 text-red-600" : p.statut === "Retard" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>
                            <UserCheck className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-[10px] md:text-sm uppercase truncate">{p.student_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge className={cn("text-[6px] font-black px-1.5 h-4 rounded-md", p.statut === "Absent" ? "bg-red-100 text-red-700" : p.statut === "Retard" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>{p.statut}</Badge>
                              <span className="text-[7px] font-bold text-muted-foreground">{p.matiere}</span>
                              <span className="text-[7px] font-bold text-muted-foreground">{p.heure}</span>
                              {p.justifiee && <Badge className="text-[6px] font-black px-1.5 h-4 rounded-md bg-blue-100 text-blue-700">Justifiée</Badge>}
                            </div>
                          </div>
                          <span className="text-[7px] font-bold text-muted-foreground shrink-0">{new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </Card>
                </TabsContent>

                {/* Onglet Discipline */}
                <TabsContent value="discipline" className="space-y-6 animate-in fade-in">
                  <Card className="p-5 md:p-8 rounded-[1.8rem] bg-white border-none shadow-sm border-l-[8px] border-red-500">
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">
                      {collectiveMode ? `Sanction collective — ${selectedClass}` : selectedStudent ? `Sanction pour ${selectedStudent.last_name} ${selectedStudent.first_name}` : "Sélectionner un élève"}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Type de faute</Label>
                        <Select value={sanctionForm.type_faute} onValueChange={v => setSanctionForm({...sanctionForm, type_faute: v})}>
                          <SelectTrigger className="h-10 md:h-12 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl border-2 p-1 max-h-[200px]">
                            {TYPES_FAUTE.map(t => <SelectItem key={t} value={t} className="font-bold text-xs p-2.5 rounded-lg">{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Sanction</Label>
                        <Select value={sanctionForm.sanction} onValueChange={v => setSanctionForm({...sanctionForm, sanction: v})}>
                          <SelectTrigger className="h-10 md:h-12 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl border-2 p-1">
                            {TYPES_SANCTION.map(t => <SelectItem key={t} value={t} className="font-bold text-xs p-2.5 rounded-lg">{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Points retranchés</Label>
                        <Input type="number" min="0" max="20" value={sanctionForm.points_retranches} onChange={e => setSanctionForm({...sanctionForm, points_retranches: Number(e.target.value)})} className="h-10 md:h-12 rounded-xl border-2 font-black text-center text-lg" />
                      </div>
                      <div className="col-span-2 md:col-span-3 space-y-1.5">
                        <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Motif</Label>
                        <Input placeholder="Description de la faute..." value={sanctionForm.motif} onChange={e => setSanctionForm({...sanctionForm, motif: e.target.value})} className="h-10 md:h-12 rounded-xl border-2 font-bold text-xs" />
                      </div>
                    </div>
                    <Button onClick={handleAddSanction} disabled={loading || (!selectedStudent && !collectiveMode)} className="w-full mt-4 h-11 bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black text-xs shadow-lg active:scale-95">
                      {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <ShieldAlert className="size-4 mr-2" />}
                      Sceller Sanction {collectiveMode ? `(${classStudents.length} élèves)` : ""}
                    </Button>
                  </Card>

                  {/* Journal sanctions */}
                  <Card className="border-none shadow-sm bg-white rounded-[1.8rem] overflow-hidden">
                    <div className="p-4 md:p-6 border-b bg-muted/5 flex items-center justify-between">
                      <h3 className="font-black text-sm md:text-lg flex items-center gap-2"><History className="size-4 text-red-500" /> Journal Sanctions</h3>
                      <Badge className="bg-red-50 text-red-600 font-black text-[8px]">{sanctions.filter(s => !selectedStudent || s.student_matricule === selectedStudent?.matricule).length} sanctions</Badge>
                    </div>
                    <ScrollArea className="h-[350px]">
                      {sanctions.filter(s => !selectedStudent || s.student_matricule === selectedStudent?.matricule).filter(s => !selectedClass || s.class_id === selectedClass).map((s, i) => (
                        <div key={i} className="p-4 md:p-5 border-b border-muted/10 flex items-center gap-3 hover:bg-muted/5 transition-all">
                          <div className="size-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <ShieldAlert className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-[10px] md:text-sm uppercase truncate">{s.student_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge className="text-[6px] font-black px-1.5 h-4 rounded-md bg-red-100 text-red-700">{s.sanction}</Badge>
                              <span className="text-[7px] font-bold text-muted-foreground">{s.type_faute}</span>
                              <Badge className="text-[6px] font-black px-1.5 h-4 rounded-md bg-foreground text-white">-{s.points_retranches} pts</Badge>
                              {s.collective && <Badge className="text-[6px] font-black px-1.5 h-4 rounded-md bg-amber-100 text-amber-700">Collective</Badge>}
                            </div>
                          </div>
                          <span className="text-[7px] font-bold text-muted-foreground shrink-0">{new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </Card>
                </TabsContent>

                {/* Onglet Config (Directeur uniquement) */}
                {isDirector && (
                  <TabsContent value="config" className="space-y-6 animate-in fade-in">
                    <Card className="p-5 md:p-8 rounded-[1.8rem] bg-white border-none shadow-sm space-y-6">
                      <h3 className="font-black text-sm md:text-lg uppercase flex items-center gap-2"><Settings className="size-4 text-primary" /> Configuration du Barème</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Note de conduite de départ</Label>
                          <Input type="number" min="0" max="20" value={configForm.note_depart} onChange={e => setConfigForm({...configForm, note_depart: Number(e.target.value)})} className="h-10 md:h-12 rounded-xl border-2 font-black text-center text-lg" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground">Seuil absences non justifiées</Label>
                          <Input type="number" min="1" max="20" value={configForm.seuil_absences} onChange={e => setConfigForm({...configForm, seuil_absences: Number(e.target.value)})} className="h-10 md:h-12 rounded-xl border-2 font-black text-center text-lg" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Barème par type de sanction</p>
                        {TYPES_SANCTION.map(type => (
                          <div key={type} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                            <span className="text-[9px] md:text-xs font-black uppercase">{type}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-bold text-muted-foreground">-</span>
                              <Input type="number" min="0" max="20" value={configForm.bareme[type] || 0} onChange={e => setConfigForm({...configForm, bareme: {...configForm.bareme, [type]: Number(e.target.value)}})} className="h-8 w-16 rounded-lg border-2 font-black text-center text-sm" />
                              <span className="text-[8px] font-bold text-muted-foreground">pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button onClick={handleSaveConfig} disabled={loading} className="w-full h-11 bg-primary rounded-xl font-black text-xs shadow-lg active:scale-95">
                        {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <ShieldCheck className="size-4 mr-2" />}
                        Sceller Configuration
                      </Button>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
