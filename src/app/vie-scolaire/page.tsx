
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
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, doc, onSnapshot } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export default function StudentLifePage() {
  const db = useFirestore()
  const [userRole, setUserRole] = useState("")
  const [userId, setUserId] = useState("")
  const [activeYear, setActiveYear] = useState("")
  const [activeTab, setActiveTab] = useState("presence")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [schoolConfig, setSchoolConfig] = useState<any>(null)

  const [presenceForm, setPresenceForm] = useState({ status: "Présent", motif: "", time: "08:00" })
  const [disciplineForm, setDisciplineForm] = useState({ type: "Avertissement oral", motif: "" })
  const [bonusForm, setBonusForm] = useState({ points: 1, motif: "" })

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role') || "Élève")
    setUserId(localStorage.getItem('acadex_user_id') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")

    const unsubConfig = onSnapshot(doc(db, "school_settings", "main_config"), (snap) => {
      if (snap.exists()) setSchoolConfig(snap.data())
    })
    return () => unsubConfig()
  }, [db])

  const studentsQuery = useMemo(() => {
    if (!db || !activeYear || userRole === "Élève") return null
    return query(collection(db, "students"), where("academicYear", "==", activeYear), orderBy("lastName", "asc"))
  }, [db, activeYear, userRole])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [students, searchTerm])

  const currentTargetId = userRole === "Élève" ? userId : selectedStudent?.matricule

  const lifeEventsQuery = useMemo(() => {
    if (!db || !currentTargetId || !activeYear) return null
    return query(
      collection(db, "student_life"), 
      where("studentId", "==", currentTargetId),
      where("academicYear", "==", activeYear),
      orderBy("createdAt", "desc")
    )
  }, [db, currentTargetId, activeYear])

  const { data: events, loading: loadingEvents } = useCollection(lifeEventsQuery)

  const stats = useMemo(() => {
    if (!events) return { presence: 0, absence: 0, retards: 0, discipline: 0, conductGrade: 20 }
    let conductGrade = 20
    events.forEach((e: any) => { if (e.pointsImpact) conductGrade += Number(e.pointsImpact) })
    
    return {
      presence: events.filter((e: any) => e.category === 'presence' && e.status === 'Présent').length,
      absence: events.filter((e: any) => e.category === 'presence' && e.status === 'Absent').length,
      retards: events.filter((e: any) => e.category === 'presence' && e.status === 'Retard').length,
      discipline: events.filter((e: any) => e.category === 'discipline').length,
      conductGrade: Math.max(0, Math.min(20, conductGrade))
    }
  }, [events])

  const handleAddEvent = async (category: string) => {
    if (!currentTargetId || !db) return
    setLoading(true)
    try {
      let pointsImpact = 0
      const data: any = {
        category,
        studentId: currentTargetId,
        studentName: userRole === "Élève" ? localStorage.getItem('acadex_user_name') : `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        academicYear: activeYear,
        authorName: localStorage.getItem('acadex_user_name'),
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      }

      const rules = schoolConfig?.conductRules || { tardy: -0.5, absence: -1, warning: -2, exclusion: -5 }

      if (category === 'presence') {
        Object.assign(data, presenceForm)
        if (presenceForm.status === 'Retard') pointsImpact = rules.tardy
        if (presenceForm.status === 'Absent') pointsImpact = rules.absence
      } else if (category === 'discipline') {
        Object.assign(data, disciplineForm)
        pointsImpact = disciplineForm.type.includes('Exclusion') ? rules.exclusion : rules.warning
      } else if (category === 'conduite') {
        Object.assign(data, { pointsImpact: bonusForm.points, motif: bonusForm.motif, status: bonusForm.points > 0 ? 'Bonus' : 'Malus' })
        pointsImpact = bonusForm.points
      }

      data.pointsImpact = pointsImpact
      await addDoc(collection(db, "student_life"), data)
      toast({ title: "Action scellée" })
      setPresenceForm({ status: "Présent", motif: "", time: "08:00" })
      setDisciplineForm({ type: "Avertissement oral", motif: "" })
      setBonusForm({ points: 1, motif: "" })
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
            <div className={cn("lg:col-span-4 space-y-6", selectedStudent && "hidden lg:block")}>
              <Card className="p-4 md:p-8 rounded-[1.8rem] md:rounded-[3rem] bg-white border-none shadow-sm h-fit">
                <div className="relative group mb-4 md:mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input placeholder="Chercher un élève..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-11 h-11 md:h-14 rounded-2xl bg-muted/30 border-none font-bold text-xs md:text-sm shadow-inner" />
                </div>
                <ScrollArea className="h-[350px] md:h-[500px] pr-2 no-scrollbar">
                  <div className="space-y-2 md:space-y-3">
                    {loadingStudents ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                        <Loader2 className="animate-spin text-primary size-7" />
                        <p className="text-[8px] font-black text-muted-foreground uppercase">Chargement...</p>
                      </div>
                    ) : filteredStudents.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border-2 group",
                          selectedStudent?.id === s.id ? "bg-primary text-white border-primary shadow-lg scale-[1.02]" : "bg-white border-transparent hover:bg-muted/5"
                        )}
                      >
                        <Avatar className={cn("size-9 md:size-12 border-2 transition-all", selectedStudent?.id === s.id ? "border-white/20" : "border-muted/20")}>
                          <AvatarFallback className={cn("font-black text-[10px] md:text-sm", selectedStudent?.id === s.id ? "bg-white/10 text-white" : "bg-primary/5 text-primary")}>
                            {s.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left min-w-0">
                          <p className="font-black text-xs md:text-base truncate uppercase tracking-tight">{s.lastName} {s.firstName}</p>
                          <p className={cn("text-[7px] md:text-[10px] font-bold uppercase", selectedStudent?.id === s.id ? "text-white/60" : "text-muted-foreground")}>{s.matricule}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          )}

          <div className={cn(isStaff ? "lg:col-span-8" : "lg:col-span-12", "space-y-6 md:space-y-8")}>
            {(!selectedStudent && isStaff) ? (
              <Card className="p-16 md:p-32 text-center rounded-[2.2rem] md:rounded-[4rem] border-4 border-dashed border-muted/50 bg-white/50 flex flex-col items-center justify-center h-full space-y-6">
                <div className="size-16 md:size-28 bg-muted rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center opacity-30 shadow-inner"><ClipboardList className="size-8 md:size-14 text-muted-foreground" /></div>
                <h3 className="text-xl md:text-4xl font-black tracking-tight text-foreground/40 uppercase">Espace de Pilotage</h3>
              </Card>
            ) : (
              <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4 duration-500">
                {isStaff && (
                  <div className="flex items-center gap-3 lg:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)} className="size-9 rounded-lg bg-white shadow-sm border border-muted/20"><ChevronLeft className="size-4" /></Button>
                    <Avatar className="size-9 border-2 border-primary/20"><AvatarFallback className="font-black text-[10px]">{selectedStudent.lastName[0]}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <h4 className="font-black text-[10px] uppercase truncate">{selectedStudent.lastName} {selectedStudent.firstName}</h4>
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
                                        <span className="truncate">{event.status || event.type}</span>
                                        {event.pointsImpact !== undefined && (
                                          <Badge className={cn("rounded-md md:rounded-xl font-black h-5 md:h-10 px-1.5 md:px-5 text-[7px] md:text-sm shadow-sm shrink-0", event.pointsImpact > 0 ? "bg-emerald-500 text-white" : "bg-destructive text-white")}>
                                            {event.pointsImpact > 0 ? `+${event.pointsImpact}` : event.pointsImpact} PTS
                                          </Badge>
                                        )}
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
