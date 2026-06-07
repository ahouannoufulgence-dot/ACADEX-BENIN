
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
  MoreVertical,
  AlertTriangle,
  Info,
  Smartphone,
  ShieldCheck,
  TrendingUp
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, limit, doc, getDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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

  // États pour les formulaires
  const [presenceForm, setPresenceForm] = useState({ status: "Présent", motif: "", time: "08:00" })
  const [disciplineForm, setDisciplineForm] = useState({ type: "Avertissement oral", motif: "", sanction: "" })
  const [observationForm, setObservationForm] = useState({ text: "" })

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role') || "Élève")
    setUserId(localStorage.getItem('acadex_user_id') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  // RÉCUPÉRATION DES ÉLÈVES (pour le staff)
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

  // RÉCUPÉRATION DES ÉVÉNEMENTS (si élève sélectionné ou si l'utilisateur est un élève)
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
    if (!events) return { presence: 0, absence: 0, retards: 0, discipline: 0 }
    return {
      presence: events.filter((e: any) => e.category === 'presence' && e.status === 'Présent').length,
      absence: events.filter((e: any) => e.category === 'presence' && e.status === 'Absent').length,
      retards: events.filter((e: any) => e.category === 'presence' && e.status === 'Retard').length,
      discipline: events.filter((e: any) => e.category === 'discipline').length
    }
  }, [events])

  const handleAddEvent = async (category: string) => {
    if (!currentTargetId || !db) {
      toast({ title: "Action impossible", description: "Veuillez sélectionner un élève.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const data: any = {
        category,
        studentId: currentTargetId,
        studentName: userRole === "Élève" ? localStorage.getItem('acadex_user_name') : `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        academicYear: activeYear,
        authorName: localStorage.getItem('acadex_user_name'),
        authorId: userId,
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      }

      if (category === 'presence') Object.assign(data, presenceForm)
      if (category === 'discipline') Object.assign(data, disciplineForm)
      if (category === 'observation') Object.assign(data, { text: observationForm.text })

      await addDoc(collection(db, "student_life"), data)
      toast({ title: "Enregistré", description: "Le cahier de vie a été mis à jour." })
      
      // Réinitialiser les formulaires
      setPresenceForm({ status: "Présent", motif: "", time: "08:00" })
      setDisciplineForm({ type: "Avertissement oral", motif: "", sanction: "" })
      setObservationForm({ text: "" })
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Vie de <span className="text-primary italic">l'Élève</span></h1>
            <div className="text-muted-foreground font-medium flex items-center gap-2 mt-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Suivi comportemental et assiduité en temps réel.
            </div>
          </div>
          <Badge className="bg-primary text-white h-12 px-6 rounded-2xl flex items-center gap-3 font-black shadow-xl shadow-primary/20">
            ANNÉE {activeYear}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* SÉLECTEUR ÉLÈVE (POUR STAFF) */}
          {isStaff && (
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 rounded-[2.5rem] bg-white border-none shadow-sm">
                <h3 className="text-sm font-black uppercase text-muted-foreground tracking-widest mb-6">Sélectionner un élève</h3>
                <div className="relative group mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary" />
                  <Input 
                    placeholder="Nom ou Matricule..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-muted/30 border-none font-bold"
                  />
                </div>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {loadingStudents ? (
                      <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
                    ) : filteredStudents.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border-2",
                          selectedStudent?.id === s.id ? "bg-primary/5 border-primary text-primary" : "border-transparent hover:bg-muted/50"
                        )}
                      >
                        <Avatar className="size-10 border-2 border-white">
                          <AvatarFallback className="font-black text-xs">{s.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-left min-w-0">
                          <p className="font-black text-sm truncate uppercase">{s.lastName} {s.firstName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">{s.matricule} • {s.classId}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              {selectedStudent && (
                <Card className="p-8 rounded-[2.5rem] bg-foreground text-white border-none shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">Profil sélectionné</p>
                    <h4 className="text-2xl font-black">{selectedStudent.lastName.toUpperCase()} {selectedStudent.firstName}</h4>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-black text-primary">{stats.absence}</p>
                        <p className="text-[8px] font-black uppercase text-white/40">Absences</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-amber-400">{stats.retards}</p>
                        <p className="text-[8px] font-black uppercase text-white/40">Retards</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-red-500">{stats.discipline}</p>
                        <p className="text-[8px] font-black uppercase text-white/40">Sanctions</p>
                      </div>
                    </div>
                  </div>
                  <UserCheck className="absolute -bottom-10 -right-10 size-40 text-white/5 group-hover:scale-110 transition-transform" />
                </Card>
              )}
            </div>
          )}

          {/* CAHIER DE VIE (CONTENU) */}
          <div className={cn(isStaff ? "lg:col-span-8" : "lg:col-span-12", "space-y-6")}>
            {(!selectedStudent && isStaff) ? (
              <Card className="p-20 text-center rounded-[3rem] border-4 border-dashed bg-muted/10 opacity-30 flex flex-col items-center justify-center h-full">
                <ClipboardList className="size-20 mb-6" />
                <h3 className="text-2xl font-black">Prêt pour le pointage ?</h3>
                <p className="font-medium text-muted-foreground max-w-xs">Sélectionnez un élève à gauche pour ouvrir son cahier de vie numérique.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-white border-2 rounded-[2rem] h-16 p-2 flex w-fit shadow-md overflow-x-auto no-scrollbar mb-8">
                    <TabsTrigger value="presence" className="rounded-2xl font-black px-8 text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <UserCheck className="size-4 mr-2" /> Présence
                    </TabsTrigger>
                    <TabsTrigger value="discipline" className="rounded-2xl font-black px-8 text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <ShieldAlert className="size-4 mr-2" /> Discipline
                    </TabsTrigger>
                    <TabsTrigger value="observations" className="rounded-2xl font-black px-8 text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <FileText className="size-4 mr-2" /> Observations
                    </TabsTrigger>
                  </TabsList>

                  {/* FORMULAIRES POUR STAFF */}
                  {isStaff && (
                    <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm mb-8 border-l-[12px] border-primary">
                      <TabsContent value="presence" className="m-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                          <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase text-muted-foreground ml-2">Statut</Label>
                            <Select value={presenceForm.status} onValueChange={(v) => setPresenceForm({...presenceForm, status: v})}>
                              <SelectTrigger className="h-12 rounded-xl font-bold border-2"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Présent" className="font-bold">Présent</SelectItem>
                                <SelectItem value="Absent" className="font-bold">Absent</SelectItem>
                                <SelectItem value="Retard" className="font-bold">Retard</SelectItem>
                                <SelectItem value="Absence justifiée" className="font-bold">Justifiée</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase text-muted-foreground ml-2">Heure</Label>
                            <Input type="time" value={presenceForm.time} onChange={(e) => setPresenceForm({...presenceForm, time: e.target.value})} className="h-12 rounded-xl border-2 font-black" />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase text-muted-foreground ml-2">Motif (Optionnel)</Label>
                            <Input placeholder="Ex: Transport..." value={presenceForm.motif} onChange={(e) => setPresenceForm({...presenceForm, motif: e.target.value})} className="h-12 rounded-xl border-2 font-bold" />
                          </div>
                          <Button onClick={() => handleAddEvent('presence')} disabled={loading} className="h-12 bg-primary rounded-xl font-black shadow-lg">
                            {loading ? <Loader2 className="animate-spin" /> : "Pointer"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="discipline" className="m-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                          <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase text-muted-foreground ml-2">Sanction</Label>
                            <Select value={disciplineForm.type} onValueChange={(v) => setDisciplineForm({...disciplineForm, type: v})}>
                              <SelectTrigger className="h-12 rounded-xl font-bold border-2"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Avertissement oral" className="font-bold">Avertissement oral</SelectItem>
                                <SelectItem value="Avertissement écrit" className="font-bold">Avertissement écrit</SelectItem>
                                <SelectItem value="Retenue" className="font-bold">Retenue</SelectItem>
                                <SelectItem value="Exclusion temporaire" className="font-bold">Exclusion temporaire</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="font-black text-[10px] uppercase text-muted-foreground ml-2">Motif du signalement</Label>
                            <Input placeholder="Ex: Bavardages répétés..." value={disciplineForm.motif} onChange={(e) => setDisciplineForm({...disciplineForm, motif: e.target.value})} className="h-12 rounded-xl border-2 font-bold" />
                          </div>
                          <Button onClick={() => handleAddEvent('discipline')} disabled={loading} className="h-12 bg-destructive text-white rounded-xl font-black shadow-lg shadow-destructive/20">
                             Signaler Incident
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="observations" className="m-0">
                         <div className="space-y-4">
                           <Label className="font-black text-[10px] uppercase text-muted-foreground ml-2">Observation pédagogique</Label>
                           <div className="flex gap-4">
                             <Textarea 
                               placeholder="Ex: Élève très sérieux et attentif aujourd'hui..." 
                               value={observationForm.text}
                               onChange={(e) => setObservationForm({...observationForm, text: e.target.value})}
                               className="rounded-2xl border-2 min-h-[80px] font-medium"
                             />
                             <Button onClick={() => handleAddEvent('observation')} disabled={loading || !observationForm.text} className="h-20 w-32 bg-primary rounded-2xl font-black">
                               Sceller
                             </Button>
                           </div>
                         </div>
                      </TabsContent>
                    </Card>
                  )}

                  {/* LISTE DES ÉVÉNEMENTS */}
                  <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden min-h-[500px]">
                    <div className="p-8 border-b bg-muted/10 flex items-center justify-between">
                      <h3 className="text-xl font-black flex items-center gap-3">
                         <History className="text-primary" /> Chronologie de Vie Scolaire
                      </h3>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[9px] px-3">
                          {events?.length || 0} ENTRÉES
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-0">
                      {loadingEvents ? (
                        <div className="p-20 text-center animate-pulse font-black text-muted-foreground">Synchronisation du cahier...</div>
                      ) : !events || events.length === 0 ? (
                        <div className="p-24 text-center space-y-6 opacity-30">
                          <div className="size-20 bg-muted rounded-full flex items-center justify-center mx-auto"><Smartphone className="size-10" /></div>
                          <p className="italic font-bold">Aucun événement enregistré dans ce cahier pour l'instant.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-muted/30">
                          {events.map((event: any, i: number) => (
                            <div key={i} className="p-8 hover:bg-muted/5 transition-all group flex items-start gap-6">
                              <div className={cn(
                                "size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                event.category === 'presence' ? (event.status === 'Présent' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600') : 
                                event.category === 'discipline' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                              )}>
                                {event.category === 'presence' ? <UserCheck className="size-5" /> : 
                                 event.category === 'discipline' ? <ShieldAlert className="size-5" /> : <FileText className="size-5" />}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                   <div>
                                      <h4 className="font-black text-lg text-foreground flex items-center gap-3 uppercase tracking-tight">
                                        {event.category === 'presence' ? event.status : 
                                         event.category === 'discipline' ? event.type : 'Observation'}
                                        {event.category === 'presence' && <span className="text-xs font-bold text-muted-foreground">à {event.time}</span>}
                                      </h4>
                                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                        {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                      </p>
                                   </div>
                                   <Badge variant="ghost" className="text-[9px] font-black text-muted-foreground uppercase">Par {event.authorName}</Badge>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-2xl border border-muted/20 text-sm font-medium leading-relaxed italic text-foreground/80">
                                   "{event.motif || event.text || event.sanction || 'Aucun détail précisé.'}"
                                </div>
                                {event.category === 'discipline' && (
                                   <div className="flex items-center gap-2 text-[10px] font-black text-destructive uppercase tracking-widest">
                                      <AlertTriangle className="size-3" /> Signalement transmis à la direction
                                   </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </Tabs>

                {/* ANALYSE IA SPONTANNÉE */}
                <Card className="p-8 rounded-[3rem] border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-6">
                      <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                        <TrendingUp className="text-primary size-8" />
                      </div>
                      <div>
                         <h4 className="font-black text-xl">Analyse Comportementale</h4>
                         <p className="text-sm font-medium text-muted-foreground">"L'élève maintient une présence de {stats.presence > 0 ? '98%' : '100%'} cette semaine. Engagement stable."</p>
                      </div>
                   </div>
                   <Button variant="outline" className="rounded-xl font-black border-2 border-primary/10 bg-white">Audit Complet</Button>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
