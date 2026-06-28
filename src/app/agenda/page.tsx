"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Clock, MapPin, User, BookOpen, Zap, FileDown,
  ShieldCheck, Grid3X3, Loader2, Sparkles, ArrowRight,
  History, Plus, Trash2, Edit2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
const timeSlots = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"]

const OFFICIAL_CLASSES = [
  "6EME A","6EME B","5EME A","5EME B","4EME A","4EME B","3EME D1","3EME D2",
  "2NDE A","2NDE B","2NDE C","2NDE D",
  "1ERE A","1ERE B","1ERE C","1ERE D",
  "TLE A","TLE B","TLE C","TLE D"
]

const MATIERES = [
  "Mathématiques","Français","Anglais","Physique-Chimie","SVT",
  "Histoire-Géographie","Philosophie","Informatique","EPS","Économie","Autre"
]

const SALLES = ["Salle 01","Salle 02","Salle 03","Salle 04","Salle 05",
  "Salle 06","Salle 07","Salle 08","Labo","Gymnase","Amphi","Autre"]

export default function GlobalSchedulePage() {
  const [activeYear, setActiveYear] = useState("")
  const [userRole, setUserRole] = useState("")
  const [selectedDay, setSelectedDay] = useState("Lundi")
  const [activeTab, setActiveTab] = useState("classe")
  const [selectedClass, setSelectedClass] = useState("6EME A")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [allSchedules, setAllSchedules] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    class_id: "6EME A",
    day: "Lundi",
    subject: "Mathématiques",
    teacher_name: "",
    start_time: "08:00",
    end_time: "10:00",
    room: ""
  })

  useEffect(() => {
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    setUserRole(localStorage.getItem('acadex_user_role') || "")
  }, [])

  const fetchData = async () => {
    if (!activeYear) return
    setLoadingSchedules(true)
    const [sRes, tRes] = await Promise.all([
      supabase.from('schedules').select('*').eq('academic_year', activeYear),
      supabase.from('teachers').select('*').order('full_name', { ascending: true })
    ])
    setAllSchedules(sRes.data || [])
    setTeachers(tRes.data || [])
    setLoadingSchedules(false)
  }

  useEffect(() => { fetchData() }, [activeYear])

  const handleAdd = async () => {
    if (!form.class_id || !form.day || !form.subject || !form.start_time || !form.end_time) {
      toast({ title: "Champs requis", variant: "destructive" })
      return
    }
    if (form.start_time >= form.end_time) {
      toast({ title: "Heure de fin doit être après l'heure de début", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('schedules').insert({
        class_id: form.class_id,
        day: form.day,
        subject: form.subject,
        teacher_name: form.teacher_name,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room,
        academic_year: activeYear
      })
      if (error) throw error
      toast({ title: "Cours ajouté au planning" })
      setIsAdding(false)
      setForm({ class_id: "6EME A", day: "Lundi", subject: "Mathématiques", teacher_name: "", start_time: "08:00", end_time: "10:00", room: "" })
      fetchData()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id)
      if (error) throw error
      toast({ title: "Cours supprimé" })
      fetchData()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const filteredByClass = useMemo(() => {
    return allSchedules
      .filter(s => s.class_id === selectedClass && s.day === selectedDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [allSchedules, selectedClass, selectedDay])

  const filteredByTeacher = useMemo(() => {
    return allSchedules
      .filter(s => s.teacher_name === selectedTeacher && s.day === selectedDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [allSchedules, selectedTeacher, selectedDay])

  const isStaff = userRole === "Directeur" || userRole === "Enseignant"

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-none">
              Matrice <span className="text-primary italic">Plannings</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[9px] md:text-sm uppercase tracking-widest">
              <History className="size-3 md:size-4 text-primary" />
              <span>Vision Centralisée • {activeYear}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isStaff && (
              <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white h-11 md:h-14 px-5 md:px-8 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm shadow-xl active:scale-95 transition-all">
                    <Plus className="mr-2 size-4" /> Ajouter un cours
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem] w-[95%] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
                  <div className="p-6 bg-primary text-white">
                    <DialogTitle className="text-xl font-black uppercase">Nouveau Cours</DialogTitle>
                    <p className="text-white/60 text-[9px] font-bold uppercase mt-1">{activeYear}</p>
                  </div>
                  <div className="p-6 space-y-4 bg-[#F8FAFC]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-black text-[8px] uppercase text-muted-foreground">Classe</Label>
                        <Select value={form.class_id} onValueChange={v => setForm({...form, class_id: v})}>
                          <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl max-h-[200px]">
                            {OFFICIAL_CLASSES.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-black text-[8px] uppercase text-muted-foreground">Jour</Label>
                        <Select value={form.day} onValueChange={v => setForm({...form, day: v})}>
                          <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {days.map(d => <SelectItem key={d} value={d} className="font-bold text-xs">{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">Matière</Label>
                      <Select value={form.subject} onValueChange={v => setForm({...form, subject: v})}>
                        <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[200px]">
                          {MATIERES.map(m => <SelectItem key={m} value={m} className="font-bold text-xs">{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">Enseignant</Label>
                      <Select value={form.teacher_name} onValueChange={v => setForm({...form, teacher_name: v})}>
                        <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue placeholder="Choisir un enseignant" /></SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[200px]">
                          {teachers.map(t => <SelectItem key={t.id} value={t.full_name} className="font-bold text-xs">{t.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-black text-[8px] uppercase text-muted-foreground">Heure début</Label>
                        <Select value={form.start_time} onValueChange={v => setForm({...form, start_time: v})}>
                          <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl max-h-[200px]">
                            {timeSlots.map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-black text-[8px] uppercase text-muted-foreground">Heure fin</Label>
                        <Select value={form.end_time} onValueChange={v => setForm({...form, end_time: v})}>
                          <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl max-h-[200px]">
                            {timeSlots.map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-[8px] uppercase text-muted-foreground">Salle</Label>
                      <Select value={form.room} onValueChange={v => setForm({...form, room: v})}>
                        <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue placeholder="Choisir une salle" /></SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[200px]">
                          {SALLES.map(s => <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAdd} disabled={loading} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase">
                      {loading ? <Loader2 className="animate-spin size-4" /> : <Plus className="size-4 mr-2" />} Ajouter au Planning
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Badge className="bg-primary/10 text-primary h-11 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl flex items-center gap-2 font-black text-[9px] md:text-sm">
              <ShieldCheck className="size-4" /> {allSchedules.length} COURS
            </Badge>
          </div>
        </div>

        {/* Sélecteur jour */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {days.map(d => (
            <button key={d} onClick={() => setSelectedDay(d)}
              className={cn("px-4 md:px-6 py-2 md:py-3 rounded-xl font-black text-[9px] md:text-xs uppercase transition-all whitespace-nowrap border-2",
                selectedDay === d ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-muted hover:border-primary/30")}>
              {d}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border-2 rounded-xl md:rounded-2xl h-12 md:h-14 p-1 flex w-full md:w-fit shadow-md">
            <TabsTrigger value="classe" className="flex-1 md:flex-none rounded-lg font-black px-4 md:px-8 text-[8px] md:text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <BookOpen className="size-3.5" /> Par Classe
            </TabsTrigger>
            <TabsTrigger value="professeur" className="flex-1 md:flex-none rounded-lg font-black px-4 md:px-8 text-[8px] md:text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <User className="size-3.5" /> Par Professeur
            </TabsTrigger>
            <TabsTrigger value="global" className="flex-1 md:flex-none rounded-lg font-black px-4 md:px-8 text-[8px] md:text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <Grid3X3 className="size-3.5" /> Vue Globale
            </TabsTrigger>
          </TabsList>

          {/* ── PAR CLASSE ── */}
          <TabsContent value="classe" className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-sm w-48 md:w-64 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[300px]">
                  {OFFICIAL_CLASSES.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Badge className="bg-primary text-white font-black text-[9px] px-3 py-1 rounded-full">
                {filteredByClass.length} cours ce jour
              </Badge>
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] overflow-hidden">
              <div className="p-5 md:p-8 border-b bg-muted/5 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base md:text-xl uppercase">{selectedClass} — {selectedDay}</h3>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{activeYear}</p>
                </div>
              </div>
              <div className="divide-y divide-muted/10">
                {loadingSchedules ? (
                  <div className="p-16 text-center"><Loader2 className="animate-spin text-primary size-6 mx-auto" /></div>
                ) : filteredByClass.length === 0 ? (
                  <div className="p-16 text-center opacity-30 space-y-3">
                    <BookOpen className="size-10 mx-auto text-muted-foreground" />
                    <p className="font-black text-xs uppercase">Aucun cours ce jour</p>
                    {isStaff && <p className="text-[9px] text-muted-foreground">Cliquez sur "Ajouter un cours" pour commencer</p>}
                  </div>
                ) : filteredByClass.map((course, i) => (
                  <div key={i} className="p-4 md:p-6 hover:bg-muted/5 transition-all group flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                      <div className="size-12 md:size-16 bg-primary/5 rounded-xl md:rounded-2xl flex flex-col items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                        <Clock className="size-3.5 md:size-5" />
                        <span className="text-[7px] font-black">{course.start_time}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm md:text-xl uppercase truncate group-hover:text-primary transition-colors">{course.subject}</h4>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <User className="size-2.5" /> {course.teacher_name || "---"}
                          </span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <MapPin className="size-2.5" /> {course.room || "---"}
                          </span>
                          <span className="text-[8px] font-bold text-primary uppercase">
                            {course.start_time} → {course.end_time}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isStaff && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)}
                        className="size-9 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ── PAR PROFESSEUR ── */}
          <TabsContent value="professeur" className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-4">
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-sm w-48 md:w-64 bg-white">
                  <SelectValue placeholder="Choisir un enseignant" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[300px]">
                  {teachers.map(t => <SelectItem key={t.id} value={t.full_name} className="font-bold text-xs">{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedTeacher && (
                <Badge className="bg-primary text-white font-black text-[9px] px-3 py-1 rounded-full">
                  {filteredByTeacher.length} cours ce jour
                </Badge>
              )}
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] overflow-hidden">
              <div className="p-5 md:p-8 border-b bg-muted/5">
                <h3 className="font-black text-base md:text-xl uppercase">{selectedTeacher || "Aucun enseignant sélectionné"} — {selectedDay}</h3>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{activeYear}</p>
              </div>
              <div className="divide-y divide-muted/10">
                {!selectedTeacher ? (
                  <div className="p-16 text-center opacity-30">
                    <User className="size-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-black text-xs uppercase">Sélectionnez un enseignant</p>
                  </div>
                ) : filteredByTeacher.length === 0 ? (
                  <div className="p-16 text-center opacity-30">
                    <p className="font-black text-xs uppercase">Aucun cours ce jour</p>
                  </div>
                ) : filteredByTeacher.map((course, i) => (
                  <div key={i} className="p-4 md:p-6 hover:bg-muted/5 transition-all group flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                      <div className="size-12 md:size-16 bg-primary/5 rounded-xl flex flex-col items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                        <Clock className="size-3.5 md:size-5" />
                        <span className="text-[7px] font-black">{course.start_time}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm md:text-xl uppercase truncate group-hover:text-primary">{course.subject}</h4>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[8px] font-bold text-primary uppercase">{course.class_id}</span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <MapPin className="size-2.5" /> {course.room || "---"}
                          </span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">
                            {course.start_time} → {course.end_time}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isStaff && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)}
                        className="size-9 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ── VUE GLOBALE ── */}
          <TabsContent value="global" className="animate-in zoom-in-95">
            <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[3.5rem] overflow-hidden">
              <div className="p-4 md:p-10 border-b bg-muted/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg md:text-2xl font-black uppercase">Vue Globale — {selectedDay}</h3>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Toutes les classes</p>
                </div>
                <Badge variant="outline" className="border-primary/20 text-primary font-black text-[8px] uppercase px-3">
                  {allSchedules.filter(s => s.day === selectedDay).length} cours
                </Badge>
              </div>
              <div className="overflow-x-auto p-2 md:p-6 no-scrollbar">
                <table className="w-full border-separate border-spacing-1 md:border-spacing-2">
                  <thead>
                    <tr>
                      <th className="p-2 md:p-4 bg-muted/30 rounded-lg text-[6px] md:text-[9px] font-black uppercase text-muted-foreground min-w-[50px] sticky left-0 z-20">HEURE</th>
                      {OFFICIAL_CLASSES.map(c => (
                        <th key={c} className="p-2 md:p-3 bg-primary/5 rounded-lg text-[6px] md:text-[9px] font-black uppercase text-primary min-w-[70px] md:min-w-[120px]">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(time => (
                      <tr key={time}>
                        <td className="p-2 md:p-4 bg-muted/20 rounded-lg text-center font-black text-[7px] md:text-sm tabular-nums text-foreground/40 sticky left-0 z-20 backdrop-blur-md">{time}</td>
                        {OFFICIAL_CLASSES.map(cls => {
                          const course = allSchedules.find(s => s.day === selectedDay && s.class_id === cls && s.start_time <= time && s.end_time > time)
                          return (
                            <td key={`${cls}-${time}`} className={cn(
                              "p-1 md:p-2 rounded-lg transition-all h-10 md:h-20 text-center border",
                              course ? "bg-white border-primary/20 shadow-sm" : "bg-muted/5 border-transparent opacity-20")}>
                              {course ? (
                                <div className="space-y-0.5">
                                  <p className="text-[5px] md:text-[9px] font-black uppercase truncate">{course.subject}</p>
                                  <p className="text-[4px] md:text-[7px] font-bold text-muted-foreground truncate hidden md:block">{course.teacher_name?.split(' ')[0]}</p>
                                </div>
                              ) : null}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}