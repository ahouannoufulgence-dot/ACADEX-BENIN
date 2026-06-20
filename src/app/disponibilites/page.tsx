"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Calendar, 
  Trash2, 
  Plus,
  ShieldCheck,
  Zap,
  MapPin,
  Loader2,
  Timer
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

export default function AvailabilityPage() {
  const [teacherId, setTeacherId] = useState("")
  const [teacherName, setTeacherName] = useState("")
  const [teacherSubject, setTeacherSubject] = useState("")
  const [teacherClasses, setTeacherClasses] = useState<string[]>([])
  const [activeYear, setActiveYear] = useState("")
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mySchedules, setMySchedules] = useState<any[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(true)

  const [newCourse, setNewCourse] = useState({
    classId: "",
    day: "Lundi",
    startTime: "08:00",
    endTime: "10:00",
    room: ""
  })

  useEffect(() => {
    setTeacherId(localStorage.getItem('acadex_user_id') || "")
    setTeacherName(localStorage.getItem('acadex_user_name') || "")
    setTeacherSubject(localStorage.getItem('acadex_user_subject') || "Matière")
    setTeacherClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    setMounted(true)
  }, [])

  const fetchSchedules = async () => {
    if (!teacherId) return
    setLoadingSchedules(true)
    const { data } = await supabase.from('schedules').select('*').eq('teacher_id', teacherId).eq('academic_year', activeYear)
    setMySchedules(data || [])
    setLoadingSchedules(false)
  }

  useEffect(() => { fetchSchedules() }, [teacherId, activeYear])

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM)
    if (diffMinutes <= 0) return { text: "Invalide", minutes: 0 }
    const h = Math.floor(diffMinutes / 60)
    const m = diffMinutes % 60
    return { text: `${h}h${m > 0 ? ` ${m}m` : ''}`, minutes: diffMinutes }
  }

  const handleAddCourse = async () => {
    if (!newCourse.classId) {
      toast({ title: "Champ requis", description: "Veuillez choisir une classe.", variant: "destructive" })
      return
    }

    const duration = calculateDuration(newCourse.startTime, newCourse.endTime)
    if (duration.minutes === 0) {
      toast({ title: "Horaire invalide", description: "L'heure de fin doit être après le début.", variant: "destructive" })
      return
    }

    const conflict = mySchedules?.find((s: any) => {
      if (s.day !== newCourse.day) return false
      return (newCourse.startTime < s.end_time) && (newCourse.endTime > s.start_time)
    })

    if (conflict) {
      toast({ 
        title: "Conflit Horaire Détecté", 
        description: `Vous avez déjà une séance scellée en ${conflict.class_id} sur ce créneau.`,
        variant: "destructive" 
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('schedules').insert({
        class_id: newCourse.classId,
        day: newCourse.day,
        start_time: newCourse.startTime,
        end_time: newCourse.endTime,
        room: newCourse.room,
        teacher_id: teacherId,
        teacher_name: teacherName,
        subject: teacherSubject,
        duration: duration.text,
        academic_year: activeYear,
      })
      if (error) throw error
      toast({ title: "Séance scellée" })
      setNewCourse({ ...newCourse, classId: "", room: "" })
      fetchSchedules()
    } catch (e) {
      toast({ title: "Erreur de scellage", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const removeCourse = async (id: string) => {
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id)
      if (error) throw error
      toast({ title: "Séance retirée" })
      fetchSchedules()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
              Mon Emploi <span className="text-primary italic">du Temps</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[9px] md:text-sm uppercase tracking-widest">
              <Clock className="size-3.5 md:size-4 text-amber-500" />
              <span>Saisie Scellée • {activeYear}</span>
            </div>
          </div>
          <Badge className="bg-primary text-white h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-[1.8rem] flex items-center gap-3 font-black text-[9px] md:text-lg shadow-xl shadow-primary/20 w-fit">
             <ShieldCheck className="size-4 md:size-6" /> RÉSEAU CONNECTÉ
          </Badge>
        </div>

        <div className="grid gap-6 md:gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5 md:p-10 rounded-2xl md:rounded-[3rem] bg-white border-none shadow-sm space-y-6 md:space-y-8 border-t-[8px] border-primary">
              <div className="space-y-1">
                <h3 className="text-lg md:text-2xl font-black flex items-center gap-2 uppercase tracking-tight">
                  <Plus className="text-primary size-5 md:size-6" /> Sceller Séance
                </h3>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Synchronisation directe</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="font-black text-[9px] uppercase text-muted-foreground px-2">Classe</Label>
                  <Select value={newCourse.classId} onValueChange={(v) => setNewCourse({...newCourse, classId: v})}>
                    <SelectTrigger className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-base"><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1">
                      {teacherClasses.map(c => <SelectItem key={c} value={c} className="font-bold p-2.5 rounded-lg text-xs">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-black text-[9px] uppercase text-muted-foreground px-2">Jour</Label>
                  <Select value={newCourse.day} onValueChange={(v) => setNewCourse({...newCourse, day: v})}>
                    <SelectTrigger className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-base"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1">
                      {days.map(d => <SelectItem key={d} value={d} className="font-bold p-2.5 rounded-lg text-xs">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                      <Label className="font-black text-[9px] uppercase text-muted-foreground px-2">Début</Label>
                      <Input type="time" value={newCourse.startTime} onChange={e => setNewCourse({...newCourse, startTime: e.target.value})} className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-center text-xs md:text-lg" />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="font-black text-[9px] uppercase text-muted-foreground px-2">Fin</Label>
                      <Input type="time" value={newCourse.endTime} onChange={e => setNewCourse({...newCourse, endTime: e.target.value})} className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-center text-xs md:text-lg" />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <Label className="font-black text-[9px] uppercase text-muted-foreground px-2">Salle (Optionnel)</Label>
                   <Input placeholder="Ex: Salle B102" value={newCourse.room} onChange={e => setNewCourse({...newCourse, room: e.target.value})} className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-bold text-xs md:text-sm" />
                </div>

                <Button onClick={handleAddCourse} disabled={saving} className="w-full h-11 md:h-16 rounded-xl md:rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-black text-[10px] md:text-lg transition-all active:scale-95 uppercase">
                  {saving ? <Loader2 className="animate-spin mr-2 size-3.5" /> : "Valider Scellage"}
                </Button>
              </div>
            </Card>

            <Card className="p-6 md:p-8 rounded-2xl md:rounded-[2.2rem] bg-foreground text-white shadow-2xl relative overflow-hidden group border-none">
               <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="text-primary size-4 fill-primary animate-pulse" />
                    <p className="text-[7px] font-black uppercase text-white/40 tracking-widest">Temps Réel</p>
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-primary tabular-nums">{mySchedules?.length || 0} séances scellées</h3>
               </div>
               <ShieldCheck className="absolute -bottom-10 -right-10 size-32 md:size-48 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[4rem] overflow-hidden min-h-[400px] flex flex-col">
              <div className="p-5 md:p-12 border-b bg-muted/5 flex items-center justify-between">
                 <div className="space-y-1">
                   <h3 className="text-lg md:text-3xl font-black tracking-tight uppercase leading-none">Mon Agenda <span className="text-primary italic">Live</span></h3>
                   <p className="font-bold text-muted-foreground text-[8px] md:text-sm uppercase tracking-[0.3em]">Journal des flux</p>
                 </div>
                 <Badge variant="outline" className="rounded-full border-2 border-primary/10 font-black px-3 h-8 md:h-11 text-[7px] md:text-xs uppercase shrink-0">CHRONO</Badge>
              </div>
              <div className="p-3 md:p-10 flex-1">
                {loadingSchedules ? (
                  <div className="py-20 text-center animate-pulse flex flex-col items-center gap-4 opacity-20">
                    <Loader2 className="animate-spin text-primary size-10" />
                    <p className="font-black text-[9px] uppercase tracking-widest">Accès aux registres...</p>
                  </div>
                ) : !mySchedules || mySchedules.length === 0 ? (
                  <div className="py-24 text-center space-y-6 opacity-30">
                    <Calendar className="size-10 md:size-16 text-muted-foreground mx-auto" />
                    <p className="font-black text-xs md:text-xl uppercase tracking-widest">Emploi du temps vide</p>
                  </div>
                ) : (
                  <div className="space-y-8 md:space-y-16">
                    {days.map(day => {
                      const dayCourses = mySchedules.filter((c: any) => c.day === day).sort((a:any, b:any) => a.start_time.localeCompare(b.start_time))
                      if (dayCourses.length === 0) return null
                      return (
                        <div key={day} className="space-y-4 md:space-y-8 animate-in slide-in-from-bottom-4">
                           <div className="flex items-center gap-4">
                              <h4 className="text-[9px] md:text-sm font-black uppercase tracking-[0.3em] text-primary bg-primary/5 px-4 md:px-6 py-1.5 md:py-2 rounded-full w-fit border border-primary/10">{day}</h4>
                              <div className="flex-1 h-px bg-muted/30" />
                           </div>
                           <div className="grid gap-3 md:gap-8">
                              {dayCourses.map((course: any, idx: number) => (
                                <div key={course.id || idx} className="p-3 md:p-10 bg-muted/5 rounded-xl md:rounded-[3.5rem] border border-muted/20 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between gap-3">
                                   <div className="flex items-center gap-3 md:gap-12 flex-1 min-w-0">
                                      <div className="size-10 md:size-28 bg-white rounded-lg md:rounded-[2.5rem] flex flex-col items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all shrink-0 border-2 border-transparent group-hover:border-primary">
                                         <Clock className="size-4 md:size-8" />
                                         <span className="text-[7px] md:text-xl font-black uppercase tracking-tighter mt-0.5 md:mt-2">{course.start_time?.split(':')[0]}H</span>
                                      </div>
                                      <div className="space-y-0.5 md:space-y-3 truncate">
                                         <div className="flex items-center gap-2 md:gap-4 truncate">
                                            <Badge className="bg-primary text-white font-black text-[8px] md:text-xl px-1.5 md:px-4 py-0.5 rounded-md shadow-sm shrink-0">{course.class_id}</Badge>
                                            <h4 className="text-[10px] md:text-4xl font-black uppercase tracking-tight truncate group-hover:text-primary">{course.start_time} — {course.end_time}</h4>
                                         </div>
                                         <div className="flex flex-wrap items-center gap-2 md:gap-8 text-[6px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><MapPin className="size-2.5 md:size-5 text-primary" /> {course.room || '---'}</span>
                                            <span className="flex items-center gap-1"><Timer className="size-2.5 md:size-5 text-primary" /> {course.duration}</span>
                                         </div>
                                      </div>
                                   </div>
                                   <Button variant="ghost" size="icon" onClick={() => removeCourse(course.id)} className="size-8 md:size-20 rounded-lg md:rounded-[2rem] text-destructive hover:bg-destructive/10 shrink-0 transition-all active:scale-90">
                                      <Trash2 className="size-4 md:size-10" />
                                   </Button>
                                </div>
                              ))}
                           </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
