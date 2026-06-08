
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
  ArrowRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, doc, onSnapshot } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
    return query(collection(db, "students"), where("academicYear", "==", activeYear))
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
      toast({ title: "Action scellée", description: "La note de conduite a été mise à jour." })
      
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
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Vie Scolaire & <span className="text-primary italic">Conduite</span></h1>
            <div className="text-muted-foreground font-medium flex items-center gap-2 mt-2">
              <ShieldCheck className="size-4 md:size-5 text-emerald-500" /> Année Scolaire <Badge className="bg-primary">{activeYear}</Badge>
            </div>
          </div>
          <Badge className="bg-primary text-white h-14 md:h-16 px-8 md:px-12 rounded-2xl flex items-center gap-3 md:gap-4 font-black text-xl md:text-2xl shadow-xl shadow-primary/20">
             NOTE CONDUITE : {stats.conductGrade.toFixed(1)}/20
          </Badge>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {isStaff && (
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 rounded-[2.5rem] bg-white border-none shadow-sm">
                <div className="relative group mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Chercher un élève..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-muted/30 border-none font-bold"
                  />
                </div>
                <ScrollArea className="h-[300px] md:h-[400px] pr-4">
                  <div className="space-y-2">
                    {loadingStudents ? (
                      <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary size-8" /></div>
                    ) : filteredStudents.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border-2",
                          selectedStudent?.id === s.id ? "bg-primary/5 border-primary text-primary" : "border-transparent hover:bg-muted/50"
                        )}
                      >
                        <Avatar className="size-10 md:size-12 border-2 border-white shadow-sm">
                          <AvatarFallback className="font-black text-xs md:text-sm">{s.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-left min-w-0">
                          <p className="font-black text-sm md:text-base truncate uppercase">{s.lastName} {s.firstName}</p>
                          <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground">{s.matricule}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              {selectedStudent && (
                <Card className="p-8 rounded-[2.5rem] bg-foreground text-white border-none shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                         <p className="text-[10px] font-black uppercase text-primary tracking-widest">Performance Comportementale</p>
                         <h4 className="text-3xl md:text-4xl font-black">{stats.conductGrade.toFixed(1)}<span className="text-sm opacity-40">/20</span></h4>
                       </div>
                       <Award className="size-8 md:size-10 text-primary animate-pulse" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                      <div className="text-center"><p className="text-lg md:text-xl font-black text-red-500">{stats.absence}</p><p className="text-[7px] font-black uppercase opacity-40">Absences</p></div>
                      <div className="text-center"><p className="text-lg md:text-xl font-black text-amber-400">{stats.retards}</p><p className="text-[7px] font-black uppercase opacity-40">Retards</p></div>
                      <div className="text-center"><p className="text-lg md:text-xl font-black text-blue-400">{stats.discipline}</p><p className="text-[7px] font-black uppercase opacity-40">Sanctions</p></div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          <div className={cn(isStaff ? "lg:col-span-8" : "lg:col-span-12", "space-y-6")}>
            {(!selectedStudent && isStaff) ? (
              <Card className="p-16 md:p-20 text-center rounded-[3rem] border-4 border-dashed bg-muted/10 opacity-30 flex flex-col items-center justify-center h-full">
                <ClipboardList className="size-16 md:size-20 mb-6" />
                <h3 className="text-xl md:text-2xl font-black">Sélectionnez un élève</h3>
                <p className="text-sm md:text-base font-medium text-muted-foreground">Pour ajuster sa note de conduite ou pointer ses absences.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-white border-2 rounded-[2rem] h-14 md:h-16 p-2 flex w-fit shadow-md overflow-x-auto no-scrollbar mb-8">
                    <TabsTrigger value="presence" className="rounded-2xl font-black px-6 md:px-8 text-[9px] md:text-[10px] uppercase tracking-widest flex gap-2"><UserCheck className="size-3 md:size-4" /> Présence</TabsTrigger>
                    <TabsTrigger value="discipline" className="rounded-2xl font-black px-6 md:px-8 text-[9px] md:text-[10px] uppercase tracking-widest flex gap-2"><ShieldAlert className="size-3 md:size-4" /> Discipline</TabsTrigger>
                    <TabsTrigger value="conduite" className="rounded-2xl font-black px-6 md:px-8 text-[9px] md:text-[10px] uppercase tracking-widest flex gap-2"><Award className="size-3 md:size-4" /> Bonus/Malus</TabsTrigger>
                  </TabsList>

                  {isStaff && (
                    <Card className="p-6 md:p-8 rounded-[2.5rem] bg-white border-none shadow-sm mb-8 border-l-[12px] border-primary animate-in slide-in-from-right-4">
                      <TabsContent value="presence" className="m-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Statut</Label>
                            <Select value={presenceForm.status} onValueChange={(v) => setPresenceForm({...presenceForm, status: v})}>
                              <SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Présent" className="font-bold">Présent</SelectItem>
                                <SelectItem value="Absent" className="font-bold text-red-600">Absent (-1.0)</SelectItem>
                                <SelectItem value="Retard" className="font-bold text-amber-600">Retard (-0.5)</SelectItem>
                                <SelectItem value="Absence justifiée" className="font-bold text-emerald-600">Justifiée (0.0)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Heure</Label>
                            <Input type="time" value={presenceForm.time} onChange={(e) => setPresenceForm({...presenceForm, time: e.target.value})} className="h-12 rounded-xl border-2 font-black" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Motif</Label>
                            <Input placeholder="Détails..." value={presenceForm.motif} onChange={(e) => setPresenceForm({...presenceForm, motif: e.target.value})} className="h-12 rounded-xl border-2 font-bold" />
                          </div>
                          <Button onClick={() => handleAddEvent('presence')} disabled={loading} className="h-12 bg-primary rounded-xl font-black mobile-touch-target">
                            {loading ? <Loader2 className="animate-spin size-5" /> : "Pointer"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="conduite" className="m-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Impact Points</Label>
                            <Input type="number" step="0.5" value={bonusForm.points} onChange={(e) => setBonusForm({...bonusForm, points: Number(e.target.value)})} className="h-12 rounded-xl border-2 font-black text-center" />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Justification</Label>
                            <Input placeholder="Encouragement ou Malus..." value={bonusForm.motif} onChange={(e) => setBonusForm({...bonusForm, motif: e.target.value})} className="h-12 rounded-xl border-2 font-bold" />
                          </div>
                          <Button onClick={() => handleAddEvent('conduite')} disabled={loading} className="h-12 bg-emerald-500 rounded-xl font-black text-white mobile-touch-target">Appliquer</Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="discipline" className="m-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Sanction</Label>
                            <Select value={disciplineForm.type} onValueChange={(v) => setDisciplineForm({...disciplineForm, type: v})}>
                              <SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Avertissement oral" className="font-bold text-amber-600">Avertissement (-2)</SelectItem>
                                <SelectItem value="Exclusion temporaire" className="font-bold text-red-600">Exclusion (-5)</SelectItem>
                                <SelectItem value="Punition scolaire" className="font-bold text-blue-600">Punition (-1)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Motif</Label>
                            <Input placeholder="Raison disciplinaire..." value={disciplineForm.motif} onChange={(e) => setDisciplineForm({...disciplineForm, motif: e.target.value})} className="h-12 rounded-xl border-2 font-bold" />
                          </div>
                          <Button onClick={() => handleAddEvent('discipline')} disabled={loading} className="h-12 bg-destructive text-white rounded-xl font-black mobile-touch-target">Sanctionner</Button>
                        </div>
                      </TabsContent>
                    </Card>
                  )}

                  <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden min-h-[500px]">
                    <div className="p-6 md:p-8 border-b bg-muted/10 flex items-center justify-between">
                      <h3 className="text-lg md:text-xl font-black flex items-center gap-3"><History className="text-primary size-5 md:size-6" /> Chronologie Conduite</h3>
                      <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[9px] px-3">{events?.length || 0} ENTRÉES</Badge>
                    </div>
                    
                    <div className="p-0">
                      {loadingEvents ? (
                        <div className="p-20 text-center animate-pulse font-black text-muted-foreground">Calcul des impacts...</div>
                      ) : !events || events.length === 0 ? (
                        <div className="p-24 text-center space-y-6 opacity-30">
                          <Award className="size-16 md:size-20 mx-auto" />
                          <p className="italic font-bold">L'élève commence avec 20/20. Aucune modification.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-muted/30">
                          {events.map((event: any, i: number) => (
                            <div key={i} className="p-6 md:p-8 hover:bg-muted/5 transition-all group flex items-start gap-4 md:gap-6">
                              <div className={cn(
                                "size-10 md:size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                event.category === 'presence' ? (event.status === 'Présent' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600') : 
                                event.category === 'discipline' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                              )}>
                                {event.category === 'presence' ? <UserCheck className="size-4 md:size-5" /> : 
                                 event.category === 'discipline' ? <ShieldAlert className="size-4 md:size-5" /> : <Award className="size-4 md:size-5" />}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                   <h4 className="font-black text-sm md:text-lg text-foreground uppercase tracking-tight">
                                     {event.status || event.type}
                                     {event.pointsImpact !== undefined && (
                                       <Badge className={cn("rounded-lg font-black ml-2 text-[8px] md:text-[10px]", event.pointsImpact > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                                         {event.pointsImpact > 0 ? `+${event.pointsImpact}` : event.pointsImpact} pts
                                       </Badge>
                                     )}
                                   </h4>
                                   <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase">{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="p-3 md:p-4 bg-muted/30 rounded-2xl border border-muted/20 text-xs md:text-sm font-medium italic leading-relaxed">
                                   "{event.motif || 'Aucun détail.'}"
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
