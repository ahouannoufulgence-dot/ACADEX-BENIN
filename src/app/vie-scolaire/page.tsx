
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  UserCheck, 
  ShieldAlert, 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  History, 
  UserX, 
  CheckCircle2, 
  Loader2,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  Award,
  Zap,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  Star,
  Info
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export default function StudentLifePage() {
  const [userRole, setUserRole] = useState("")
  const [userId, setUserId] = useState("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [activeYear, setActiveYear] = useState("")
  const [activeTab, setActiveTab] = useState("presence")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [schoolConfig, setSchoolConfig] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  const [presenceForm, setPresenceForm] = useState({ status: "Présent", motif: "", time: "08:00" })
  const [disciplineForm, setDisciplineForm] = useState({ type: "Avertissement oral", motif: "" })
  const [bonusForm, setBonusForm] = useState({ points: 1, motif: "" })

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role') || "Élève"
    setUserRole(role)
    setUserId(localStorage.getItem('acadex_user_id') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))

    const fetchConfig = async () => {
      const { data } = await supabase.from('school_settings').select('*').eq('id', 'main_config').single()
      if (data) setSchoolConfig(data)
    }
    fetchConfig()
  }, [])

  useEffect(() => {
    if (!activeYear || userRole === "Élève" || !userRole) return

    const fetchStudents = async () => {
      setLoadingStudents(true)
      let queryBuilder = supabase.from('students').select('*').eq('academic_year', activeYear).order('last_name', { ascending: true })

      if (userRole === "Enseignant") {
        if (userClasses.length === 0) { setStudents([]); setLoadingStudents(false); return }
        queryBuilder = queryBuilder.in('class_id', userClasses)
      }

      const { data } = await queryBuilder
      setStudents(data || [])
      setLoadingStudents(false)
    }
    fetchStudents()
  }, [activeYear, userRole, userClasses])

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students
      .filter((s: any) => 
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.matricule.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => {
        const nameA = `${a.last_name} ${a.first_name}`.toLowerCase()
        const nameB = `${b.last_name} ${b.first_name}`.toLowerCase()
        return nameA.localeCompare(nameB)
      })
  }, [students, searchTerm])

  const currentTargetId = userRole === "Élève" ? userId : selectedStudent?.matricule
  const [events, setEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  const fetchEvents = async () => {
    if (!currentTargetId || !activeYear) { setEvents([]); return }
    setLoadingEvents(true)
    const { data } = await supabase
      .from('student_life')
      .select('*')
      .eq('student_matricule', currentTargetId)
      .eq('academic_year', activeYear)
      .order('date', { ascending: false })
    setEvents(data || [])
    setLoadingEvents(false)
  }

  useEffect(() => { fetchEvents() }, [currentTargetId, activeYear])

  const stats = useMemo(() => {
    if (!events) return { presence: 0, absence: 0, retards: 0, discipline: 0, conductGrade: 20 }
    let conductGrade = 20
    events.forEach((e: any) => {
      if (e.type === 'Absent') conductGrade -= 1
      if (e.type === 'Retard') conductGrade -= 0.5
      if (e.type?.includes('Avertissement')) conductGrade -= 2
      if (e.type?.includes('Punition')) conductGrade -= 1
      if (e.type === 'Bonus') {
        const pts = parseFloat((e.description || "").match(/[+-]?\d+\.?\d*/)?.[0] || "0")
        conductGrade += pts
      }
      if (e.type === 'Malus') {
        const pts = parseFloat((e.description || "").match(/[+-]?\d+\.?\d*/)?.[0] || "0")
        conductGrade += pts
      }
    })
    
    return {
      presence: events.filter((e: any) => e.type === 'Présent').length,
      absence: events.filter((e: any) => e.type === 'Absent').length,
      retards: events.filter((e: any) => e.type === 'Retard').length,
      discipline: events.filter((e: any) => e.type?.includes('Avertissement') || e.type?.includes('Punition')).length,
      conductGrade: Math.max(0, Math.min(20, conductGrade))
    }
  }, [events])

  const handleAddEvent = async (category: string) => {
    if (!currentTargetId) return
    setLoading(true)
    try {
      let typeLabel = ""
      let description = ""

      if (category === 'presence') {
        typeLabel = presenceForm.status
        description = `${presenceForm.status} à ${presenceForm.time}${presenceForm.motif ? " — " + presenceForm.motif : ""}`
      } else if (category === 'discipline') {
        typeLabel = disciplineForm.type
        description = disciplineForm.motif || disciplineForm.type
      } else if (category === 'conduite') {
        typeLabel = bonusForm.points > 0 ? 'Bonus' : 'Malus'
        description = `${bonusForm.points > 0 ? "+" : ""}${bonusForm.points} pts — ${bonusForm.motif || "Sans motif"}`
      }

      const data: any = {
        student_matricule: currentTargetId,
        student_name: userRole === "Élève" ? localStorage.getItem('acadex_user_name') : `${selectedStudent.last_name} ${selectedStudent.first_name}`,
        class_id: userRole === "Élève" ? "" : (selectedStudent.class_id || ""),
        type: typeLabel,
        description,
        date: new Date().toISOString(),
        academic_year: activeYear,
        created_by: localStorage.getItem('acadex_user_name') || ""
      }

      const { error } = await supabase.from('student_life').insert(data)
      if (error) throw error

      toast({ title: "Action scellée" })
      setPresenceForm({ status: "Présent", motif: "", time: "08:00" })
      setDisciplineForm({ type: "Avertissement oral", motif: "" })
      setBonusForm({ points: 1, motif: "" })
      fetchEvents()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const isStaff = userRole === "Directeur" || userRole === "Enseignant"

  return (
    <DashboardLayout>
      <div className="space-y-5 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">{userRole === "Élève" ? "Mon Cahier de" : "Vie"} <span className="text-primary italic">Scolaire</span></h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[8px] md:text-sm">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span>{activeYear} • Suivi de Conduite Certifié</span>
            </div>
          </div>
          <div className="bg-white border-2 border-primary/10 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-xl flex items-center justify-between md:justify-start gap-5 md:gap-8 group hover:border-primary/30 transition-all w-full md:w-auto">
             <div className="space-y-0.5">
               <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Note de Conduite</p>
               <h2 className="text-3xl md:text-5xl font-black text-primary tabular-nums">
                 {stats.conductGrade.toFixed(1)}<span className="text-[10px] md:text-lg opacity-40 ml-1">/20</span>
               </h2>
             </div>
             <div className="size-10 md:size-16 bg-primary/5 rounded-xl md:rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
               <Award className="size-5 md:size-8" />
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
          {isStaff && (
            <div className={cn("lg:col-span-4 space-y-4", selectedStudent && "hidden lg:block")}>
              <Card className="p-4 md:p-6 rounded-[1.8rem] md:rounded-[3rem] bg-white border-none shadow-sm h-fit">
                {/* Sélecteur classe */}
                {!selectedClass ? (
                  <div className="space-y-3">
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Choisir une classe</p>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {[...new Set(students.map((s: any) => s.class_id))].sort().map((cls: any) => (
                        <button key={cls} onClick={() => setSelectedClass(cls)}
                          className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-muted/30 hover:bg-primary hover:text-white font-black text-[9px] md:text-sm uppercase transition-all border-2 border-transparent hover:border-primary shadow-sm active:scale-95">
                          {cls}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={() => { setSelectedClass(null); setSelectedStudent(null) }}
                        className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                        <ChevronLeft className="size-3" /> Classes
                      </button>
                      <span className="text-[8px] md:text-[10px] font-black text-primary uppercase">{selectedClass}</span>
                    </div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                      <Input placeholder="Chercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-9 md:h-11 rounded-xl bg-muted/30 border-none font-bold text-xs shadow-inner" />
                    </div>
                    <ScrollArea className="h-[350px] md:h-[500px] pr-2 no-scrollbar">
                      <div className="space-y-2">
                        {loadingStudents ? (
                          <div className="flex justify-center py-10 opacity-30"><Loader2 className="animate-spin text-primary size-6" /></div>
                        ) : students.filter((s: any) => s.class_id === selectedClass && `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                          <div className="py-10 text-center opacity-40 text-[10px] font-black uppercase">Aucun élève</div>
                        ) : students.filter((s: any) => s.class_id === selectedClass && `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map((s: any) => (
                          <button key={s.id} onClick={() => setSelectedStudent(s)}
                            className={cn("w-full flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border-2",
                              selectedStudent?.id === s.id ? "bg-primary text-white border-primary shadow-lg" : "bg-white border-transparent hover:bg-muted/5"
                            )}>
                            <Avatar className="size-8 md:size-10 border-2 border-muted/20">
                              <AvatarFallback className={cn("font-black text-[9px]", selectedStudent?.id === s.id ? "bg-white/10 text-white" : "bg-primary/5 text-primary")}>
                                {s.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left min-w-0 flex-1">
                              <p className="font-black text-[10px] md:text-sm truncate uppercase">{s.last_name} {s.first_name}</p>
                              <span className={cn("text-[7px] font-bold uppercase", selectedStudent?.id === s.id ? "text-white/60" : "text-muted-foreground/40")}>{s.matricule}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Card>
            </div>
          )}

          <div className={cn(isStaff ? "lg:col-span-8" : "lg:col-span-12", "space-y-6 md:space-y-8")}>
            {(!selectedStudent && isStaff) ? (
              <Card className="p-16 md:p-32 text-center rounded-[2.2rem] md:rounded-[4rem] border-4 border-dashed border-muted/50 bg-white/50 flex flex-col items-center justify-center h-full space-y-6">
                <div className="size-16 md:size-28 bg-muted rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center opacity-30 shadow-inner"><ClipboardList className="size-8 md:size-14 text-muted-foreground" /></div>
                <div className="space-y-2">
                  <h3 className="text-xl md:text-4xl font-black tracking-tight text-foreground/40 uppercase">Espace de Pilotage</h3>
                  <p className="text-[10px] md:text-base font-bold text-muted-foreground/40 uppercase tracking-widest">Sélectionnez un élève pour sceller son journal</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4 duration-500">
                {isStaff && (
                  <div className="flex items-center gap-3 lg:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)} className="size-9 rounded-lg bg-white shadow-sm border border-muted/20"><ChevronLeft className="size-4" /></Button>
                    <Avatar className="size-9 border-2 border-primary/20"><AvatarFallback className="font-black text-[10px]">{selectedStudent.last_name[0]}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <h4 className="font-black text-[10px] uppercase truncate">{selectedStudent.last_name} {selectedStudent.first_name}</h4>
                    </div>
                  </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-white border-2 border-primary/5 rounded-[1.2rem] md:rounded-[2rem] h-11 md:h-18 p-1 flex w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth mb-6 md:mb-12">
                    {[
                      { id: "presence", label: "Présence", icon: UserCheck },
                      { id: "discipline", label: "Discipline", icon: ShieldAlert },
                      { id: "conduite", label: "Bonus/Malus", icon: Award },
                    ].map(t => (
                      <TabsTrigger key={t.id} value={t.id} className="rounded-lg md:rounded-[1.4rem] font-black px-4 md:px-10 text-[8px] md:text-xs uppercase tracking-widest flex items-center gap-1.5 md:gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all shrink-0">
                        <t.icon className="size-3.5 md:size-4.5" /> {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {isStaff && (
                    <Card className="p-5 md:p-10 rounded-[1.8rem] md:rounded-[3.5rem] bg-white border-none shadow-xl mb-6 md:mb-10 border-l-[8px] md:border-l-[12px] border-primary relative overflow-hidden group">
                      <div className="relative z-10">
                        <TabsContent value="presence" className="m-0 animate-in fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 items-end">
                            <div className="space-y-1.5">
                              <Label className="font-black text-[8px] md:text-[10px] uppercase text-muted-foreground tracking-widest px-1">Statut</Label>
                              <Select value={presenceForm.status} onValueChange={(v) => setPresenceForm({...presenceForm, status: v})}>
                                <SelectTrigger className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl border-2 p-1.5"><SelectItem value="Présent" className="font-bold p-2.5 rounded-lg text-xs">Présent</SelectItem><SelectItem value="Absent" className="font-bold p-2.5 rounded-lg text-xs text-red-600">Absent (-1.0)</SelectItem><SelectItem value="Retard" className="font-bold p-2.5 rounded-lg text-xs text-amber-600">Retard (-0.5)</SelectItem></SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="font-black text-[8px] md:text-[10px] uppercase text-muted-foreground tracking-widest px-1">Heure</Label>
                              <Input type="time" value={presenceForm.time} onChange={(e) => setPresenceForm({...presenceForm, time: e.target.value})} className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-sm" />
                            </div>
                            <div className="lg:col-span-1 space-y-1.5">
                              <Label className="font-black text-[8px] md:text-[10px] uppercase text-muted-foreground tracking-widest px-1">Motif</Label>
                              <Input placeholder="Détails..." value={presenceForm.motif} onChange={(e) => setPresenceForm({...presenceForm, motif: e.target.value})} className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-bold text-xs md:text-sm" />
                            </div>
                            <Button onClick={() => handleAddEvent('presence')} disabled={loading} className="w-full h-10 md:h-14 bg-primary rounded-xl md:rounded-2xl font-black text-[9px] md:text-sm shadow-lg active:scale-95 transition-all">
                              {loading ? <Loader2 className="animate-spin size-3 md:size-4" /> : <CheckCircle2 className="size-3.5 md:size-5 mr-1.5 md:mr-2" />} Sceller
                            </Button>
                          </div>
                        </TabsContent>
                        <TabsContent value="conduite" className="m-0 animate-in fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 items-end">
                            <div className="space-y-1.5">
                              <Label className="font-black text-[8px] md:text-[10px] uppercase text-muted-foreground tracking-widest px-1">Impact</Label>
                              <Input type="number" step="0.5" value={bonusForm.points} onChange={(e) => setBonusForm({...bonusForm, points: Number(e.target.value)})} className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-center text-base md:text-xl" />
                            </div>
                            <div className="lg:col-span-2 space-y-1.5">
                              <Label className="font-black text-[8px] md:text-[10px] uppercase text-muted-foreground tracking-widest px-1">Motivation</Label>
                              <Input placeholder="Ex: Participation..." value={bonusForm.motif} onChange={(e) => setBonusForm({...bonusForm, motif: e.target.value})} className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-bold text-xs md:text-sm" />
                            </div>
                            <Button onClick={() => handleAddEvent('conduite')} disabled={loading} className="w-full h-10 md:h-14 bg-emerald-500 hover:bg-emerald-600 rounded-xl md:rounded-2xl font-black text-[9px] md:text-sm text-white shadow-lg active:scale-95 transition-all">
                              <Star className="size-3.5 md:size-5 mr-1.5 md:mr-2" /> Appliquer
                            </Button>
                          </div>
                        </TabsContent>
                        <TabsContent value="discipline" className="m-0 animate-in fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 items-end">
                            <div className="space-y-1.5">
                              <Label className="font-black text-[8px] md:text-[10px] uppercase text-muted-foreground tracking-widest px-1">Sanction</Label>
                              <Select value={disciplineForm.type} onValueChange={(v) => setDisciplineForm({...disciplineForm, type: v})}>
                                <SelectTrigger className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl border-2 p-1.5"><SelectItem value="Avertissement oral" className="font-bold p-2.5 rounded-lg text-xs text-amber-600">Avertissement (-2)</SelectItem><SelectItem value="Punition scolaire" className="font-bold p-2.5 rounded-lg text-xs text-blue-600">Punition (-1)</SelectItem></SelectContent>
                              </Select>
                            </div>
                            <div className="lg:col-span-2 space-y-1.5">
                              <Label className="font-black text-[8px] md:text-[10px] uppercase text-muted-foreground tracking-widest px-1">Motif</Label>
                              <Input placeholder="Détails du manquement..." value={disciplineForm.motif} onChange={(e) => setDisciplineForm({...disciplineForm, motif: e.target.value})} className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-bold text-xs md:text-sm" />
                            </div>
                            <Button onClick={() => handleAddEvent('discipline')} disabled={loading} className="w-full h-10 md:h-14 bg-destructive hover:bg-destructive/90 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-sm shadow-lg active:scale-95 transition-all">
                              <ShieldAlert className="size-3.5 md:size-5 mr-1.5 md:mr-2" /> Sceller
                            </Button>
                          </div>
                        </TabsContent>
                      </div>
                    </Card>
                  )}

                  <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[4rem] overflow-hidden min-h-[450px] md:min-h-[700px] flex flex-col">
                    <div className="p-5 md:p-14 border-b bg-muted/5 flex items-center justify-between">
                      <div className="space-y-0.5 md:space-y-1.5">
                        <h3 className="text-base md:text-3xl font-black flex items-center gap-2 md:gap-5 tracking-tight uppercase">
                          <History className="text-primary size-4 md:size-8" /> Journal Live
                        </h3>
                        <p className="text-[7px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Registre scellé Acadex</p>
                      </div>
                      <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[7px] md:text-xs px-3 md:px-7 py-1 md:py-2 h-6 md:h-12">
                        {events?.length || 0} ENTRÉES
                      </Badge>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                      {loadingEvents ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
                          <Loader2 className="animate-spin text-primary size-8 md:size-14" />
                          <p className="font-black text-[8px] md:text-sm uppercase tracking-widest">Calcul des flux...</p>
                        </div>
                      ) : !events || events.length === 0 ? (
                        <div className="p-16 md:p-40 text-center space-y-6 md:space-y-8 opacity-30">
                          <div className="size-12 md:size-32 bg-muted rounded-xl md:rounded-[3rem] flex items-center justify-center mx-auto shadow-inner border border-muted/50"><Award className="size-6 md:size-16 text-muted-foreground" /></div>
                          <h4 className="text-sm md:text-3xl font-black uppercase text-foreground">Conduite Exemplaire</h4>
                        </div>
                      ) : (
                        <div className="divide-y divide-muted/10">
                          {events.map((event: any, i: number) => (
                            <div key={i} className="p-4 md:p-12 hover:bg-muted/5 transition-all group flex items-start gap-3 md:gap-10">
                              <div className={cn(
                                "size-9 md:size-16 rounded-lg md:rounded-[1.6rem] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                event.category === 'presence' ? (event.status === 'Présent' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600') : 
                                event.category === 'discipline' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                              )}>
                                {event.category === 'presence' ? <UserCheck className="size-4 md:size-8" /> : 
                                 event.category === 'discipline' ? <ShieldAlert className="size-4 md:size-8" /> : <Award className="size-4 md:size-8" />}
                              </div>
                              <div className="flex-1 space-y-2 md:space-y-5 min-w-0">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-1">
                                   <div className="space-y-0.5 w-full">
                                      <h4 className="font-black text-xs md:text-2xl text-foreground uppercase tracking-tight flex items-center gap-2">
                                        <span className="truncate">{event.type}</span>

                                      </h4>
                                      <div className="flex items-center gap-2 text-[7px] md:text-[11px] font-black text-muted-foreground uppercase tracking-widest truncate">
                                        <Calendar className="size-2.5 md:size-4 text-primary" /> {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        {event.time && <span className="flex items-center gap-1.5"><Clock className="size-2.5 md:size-4 text-primary" /> {event.time}</span>}
                                      </div>
                                   </div>
                                </div>
                                <div className="p-3 md:p-8 bg-muted/20 rounded-xl md:rounded-[2.5rem] border border-muted/30 text-[9px] md:text-lg font-medium italic leading-relaxed text-foreground/80 shadow-inner">
                                   "{event.motif || 'Aucun détail scellé.'}"
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-5 md:p-12 bg-muted/5 border-t border-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
                       <div className="flex items-center gap-3">
                          <div className="size-9 md:size-14 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0"><ShieldCheck className="size-5 md:size-7 text-emerald-500" /></div>
                          <div className="text-left">
                             <p className="text-[9px] md:text-sm font-black uppercase text-foreground">Certification d'Intégrité</p>
                             <p className="text-[7px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">ACADEX V1 • Journal {activeYear}</p>
                          </div>
                       </div>
                       <Button variant="outline" className="w-full md:w-auto h-10 md:h-14 rounded-xl md:rounded-2xl border-2 border-primary/10 font-black text-[9px] md:text-sm px-6 md:px-12 hover:bg-primary hover:text-white transition-all">Exporter Rapport</Button>
                    </div>
                  </Card>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
