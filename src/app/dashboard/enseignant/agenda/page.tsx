"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Clock, MapPin, BookOpen, ShieldCheck, History,
  Plus, Trash2, Loader2, Calendar
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
const timeSlots = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"]
const SALLES = ["Salle 01","Salle 02","Salle 03","Salle 04","Salle 05","Salle 06","Salle 07","Salle 08","Labo","Gymnase","Amphi","Autre"]

export default function TeacherAgendaPage() {
  const [selectedDay, setSelectedDay] = useState("Lundi")
  const [activeYear, setActiveYear] = useState("")
  const [teacherName, setTeacherName] = useState("")
  const [teacherClasses, setTeacherClasses] = useState<string[]>([])
  const [teacherSubject, setTeacherSubject] = useState("")
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    class_id: "",
    day: "Lundi",
    start_time: "08:00",
    end_time: "10:00",
    room: ""
  })

  useEffect(() => {
    const year = localStorage.getItem('acadex_active_year') || "2026-2027"
    const name = localStorage.getItem('acadex_user_name') || ""
    const classes = JSON.parse(localStorage.getItem('acadex_user_classes') || '[]')
    const subject = localStorage.getItem('acadex_user_subject') || ""
    setActiveYear(year)
    setTeacherName(name)
    setTeacherClasses(classes)
    setTeacherSubject(subject)
    if (classes.length > 0) setForm(f => ({ ...f, class_id: classes[0] }))
  }, [])

  const fetchSchedules = async () => {
    if (!activeYear || !teacherName) return
    setLoading(true)
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('teacher_name', teacherName)
      .eq('academic_year', activeYear)
      .order('start_time')
    setSchedules(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchSchedules() }, [activeYear, teacherName])

  const handleAdd = async () => {
    if (!form.class_id || !form.start_time || !form.end_time) {
      toast({ title: "Champs requis", variant: "destructive" })
      return
    }
    if (form.start_time >= form.end_time) {
      toast({ title: "Heure de fin doit être après l'heure de début", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('schedules').insert({
        class_id: form.class_id,
        day: form.day,
        subject: teacherSubject,
        teacher_name: teacherName,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room,
        academic_year: activeYear
      })
      if (error) throw error
      toast({ title: "Cours ajouté au planning" })
      setIsAdding(false)
      fetchSchedules()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id)
      if (error) throw error
      toast({ title: "Cours supprimé" })
      fetchSchedules()
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const dayCourses = useMemo(() => {
    return schedules
      .filter(s => s.day === selectedDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [schedules, selectedDay])

  const weekStats = useMemo(() => {
    const total = schedules.length
    const classes = [...new Set(schedules.map(s => s.class_id))].length
    return { total, classes }
  }, [schedules])

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-none">
              Mon <span className="text-primary italic">Planning</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[9px] md:text-sm uppercase tracking-widest">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span>{teacherSubject} • {activeYear}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex gap-2">
              <Badge className="bg-primary/10 text-primary font-black text-[8px] md:text-xs px-3 py-1.5 rounded-xl">
                {weekStats.total} cours / semaine
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-700 font-black text-[8px] md:text-xs px-3 py-1.5 rounded-xl">
                {weekStats.classes} classes
              </Badge>
            </div>
            {/* Bouton ajouter */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white h-11 md:h-14 px-5 md:px-8 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm shadow-xl active:scale-95">
                  <Plus className="mr-2 size-4" /> Ajouter un cours
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem] w-[95%] max-w-md p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-6 bg-primary text-white">
                  <DialogTitle className="text-xl font-black uppercase">Nouveau Cours</DialogTitle>
                  <p className="text-white/60 text-[9px] font-bold uppercase mt-1">{teacherSubject} • {teacherName}</p>
                </div>
                <div className="p-6 space-y-4 bg-[#F8FAFC]">
                  <div className="space-y-1.5">
                    <Label className="font-black text-[8px] uppercase text-muted-foreground">Classe</Label>
                    <Select value={form.class_id} onValueChange={v => setForm({...form, class_id: v})}>
                      <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs"><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {teacherClasses.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}
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
                  {/* Résumé */}
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Récapitulatif</p>
                    <p className="text-xs font-black text-primary">{teacherSubject} • {form.class_id} • {form.day} • {form.start_time}→{form.end_time}</p>
                  </div>
                  <Button onClick={handleAdd} disabled={saving} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase">
                    {saving ? <Loader2 className="animate-spin size-4" /> : <Plus className="size-4 mr-2" />} Ajouter au Planning
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Sélecteur jour */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {days.map(d => (
            <button key={d} onClick={() => setSelectedDay(d)}
              className={cn("px-4 md:px-6 py-2.5 rounded-xl font-black text-[9px] md:text-xs uppercase transition-all whitespace-nowrap border-2",
                selectedDay === d ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-muted hover:border-primary/30")}>
              {d}
              <span className="ml-1.5 opacity-60">
                ({schedules.filter(s => s.day === d).length})
              </span>
            </button>
          ))}
        </div>

        {/* Planning du jour */}
        <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] overflow-hidden">
          <div className="p-5 md:p-8 border-b bg-muted/5 flex items-center justify-between">
            <div>
              <h3 className="font-black text-base md:text-xl uppercase">
                Programme du <span className="text-primary">{selectedDay}</span>
              </h3>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                {dayCourses.length} cours • {teacherSubject}
              </p>
            </div>
            <Badge className={cn("font-black text-[8px] rounded-full px-3",
              dayCourses.length === 0 ? "bg-muted text-muted-foreground" : "bg-emerald-50 text-emerald-700")}>
              {dayCourses.length === 0 ? "Libre" : `${dayCourses.length} séances`}
            </Badge>
          </div>

          <div className="divide-y divide-muted/10">
            {loading ? (
              <div className="p-16 text-center">
                <Loader2 className="animate-spin text-primary size-6 mx-auto" />
              </div>
            ) : dayCourses.length === 0 ? (
              <div className="p-16 text-center opacity-30 space-y-3">
                <Calendar className="size-10 mx-auto text-muted-foreground" />
                <p className="font-black text-xs uppercase">Aucun cours ce jour</p>
                <p className="text-[9px] text-muted-foreground">Cliquez sur "Ajouter un cours" pour remplir votre planning</p>
              </div>
            ) : dayCourses.map((course, i) => (
              <div key={i} className="p-4 md:p-6 hover:bg-muted/5 transition-all group flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-6 min-w-0">
                  <div className="size-12 md:size-16 bg-primary/5 rounded-xl md:rounded-2xl flex flex-col items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <Clock className="size-3.5 md:size-5" />
                    <span className="text-[7px] md:text-[9px] font-black">{course.start_time}</span>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h4 className="font-black text-sm md:text-xl uppercase truncate group-hover:text-primary transition-colors">
                      {course.subject}
                    </h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className="bg-primary/10 text-primary border-none font-black text-[7px] md:text-[9px] rounded-full">
                        {course.class_id}
                      </Badge>
                      <span className="text-[7px] md:text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <MapPin className="size-2.5" /> {course.room || "---"}
                      </span>
                      <span className="text-[7px] md:text-[9px] font-bold text-primary uppercase">
                        {course.start_time} → {course.end_time}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)}
                  className="size-9 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Vue semaine complète */}
        <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] overflow-hidden">
          <div className="p-5 md:p-8 border-b bg-muted/5">
            <h3 className="font-black text-base md:text-xl uppercase">Vue Semaine Complète</h3>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Tous mes cours • {activeYear}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-muted/10">
            {days.map(day => {
              const dayCoursesList = schedules.filter(s => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
              return (
                <div key={day} className={cn("p-3 md:p-4 space-y-2 min-h-[120px]", selectedDay === day && "bg-primary/5")}>
                  <p className={cn("text-[8px] font-black uppercase tracking-widest", selectedDay === day ? "text-primary" : "text-muted-foreground")}>
                    {day}
                  </p>
                  {dayCoursesList.length === 0 ? (
                    <p className="text-[7px] text-muted-foreground/40 italic">Libre</p>
                  ) : dayCoursesList.map((c, i) => (
                    <div key={i} className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-[7px] font-black uppercase truncate text-primary">{c.class_id}</p>
                      <p className="text-[6px] font-bold text-muted-foreground">{c.start_time}→{c.end_time}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}