
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Save, 
  Trash2, 
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  Loader2,
  AlertTriangle,
  History,
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
import { useFirestore, useCollection } from "@/firebase"
import { collection, addDoc, query, where, deleteDoc, doc, serverTimestamp, getDocs } from "firebase/firestore"
import { cn } from "@/lib/utils"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

export default function AvailabilityPage() {
  const db = useFirestore()
  const [teacherId, setTeacherId] = useState("")
  const [teacherName, setTeacherName] = useState("")
  const [teacherSubject, setTeacherSubject] = useState("")
  const [teacherClasses, setTeacherClasses] = useState<string[]>([])
  const [activeYear, setActiveYear] = useState("")
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const schedulesQuery = useMemo(() => {
    if (!db || !teacherId) return null
    return query(
      collection(db, "schedules"), 
      where("teacherId", "==", teacherId),
      where("academicYear", "==", activeYear)
    )
  }, [db, teacherId, activeYear])

  const { data: mySchedules, loading: loadingSchedules } = useCollection(schedulesQuery)

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
      return (newCourse.startTime < s.endTime) && (newCourse.endTime > s.startTime)
    })

    if (conflict) {
      toast({ 
        title: "Conflit Horaire Détecté", 
        description: `Vous avez déjà une séance scellée en ${conflict.classId}.`,
        variant: "destructive" 
      })
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, "schedules"), {
        ...newCourse,
        teacherId,
        teacherName,
        subject: teacherSubject,
        duration: duration.text,
        academicYear: activeYear,
        createdAt: serverTimestamp()
      })
      toast({ title: "Séance scellée" })
      setNewCourse({ ...newCourse, classId: "", room: "" })
    } catch (e) {
      toast({ title: "Erreur de scellage", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const removeCourse = async (id: string) => {
    try {
      await deleteDoc(doc(db, "schedules", id))
      toast({ title: "Séance retirée" })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">
              Mon Emploi <span className="text-primary italic">du Temps</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[9px] md:text-sm">
              <Clock className="size-3.5 text-primary" />
              <span>Saisie Scellée • {activeYear}</span>
            </div>
          </div>
          <Badge className="bg-primary text-white h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-[1.8rem] flex items-center gap-3 font-black text-[9px] md:text-lg shadow-xl shadow-primary/20">
             <ShieldCheck className="size-4 md:size-6" /> RÉSEAU CONNECTÉ
          </Badge>
        </div>

        <div className="grid gap-6 md:gap-10 lg:grid-cols-12">
          {/* Formulaire de Saisie */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-white border-none shadow-sm space-y-6 md:space-y-8">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-lg md:text-2xl font-black flex items-center justify-center md:justify-start gap-2">
                  <Plus className="text-primary size-4 md:size-6" /> Sceller Séance
                </h3>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Relié aux classes & au directeur</p>
              </div>

              <div className="space-y-5 md:space-y-6">
                <div className="space-y-1.5">
                  <Label className="font-black text-[8px] md:text-[9px] uppercase text-muted-foreground px-1">Classe autorisée</Label>
                  <Select value={newCourse.classId} onValueChange={(v) => setNewCourse({...newCourse, classId: v})}>
                    <SelectTrigger className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-base"><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1">
                      {teacherClasses.map(c => <SelectItem key={c} value={c} className="font-bold p-2.5 rounded-lg cursor-pointer text-xs">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-black text-[8px] md:text-[9px] uppercase text-muted-foreground px-1">Jour de la semaine</Label>
                  <Select value={newCourse.day} onValueChange={(v) => setNewCourse({...newCourse, day: v})}>
                    <SelectTrigger className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-base"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-2 p-1">
                      {days.map(d => <SelectItem key={d} value={d} className="font-bold p-2.5 rounded-lg cursor-pointer text-xs">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                   <div className="space-y-1.5">
                      <Label className="font-black text-[8px] md:text-[9px] uppercase text-muted-foreground px-1">Début</Label>
                      <Input type="time" value={newCourse.startTime} onChange={e => setNewCourse({...newCourse, startTime: e.target.value})} className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-center text-xs md:text-lg" />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="font-black text-[8px] md:text-[9px] uppercase text-muted-foreground px-1">Fin</Label>
                      <Input type="time" value={newCourse.endTime} onChange={e => setNewCourse({...newCourse, endTime: e.target.value})} className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-center text-xs md:text-lg" />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <Label className="font-black text-[8px] md:text-[9px] uppercase text-muted-foreground px-1">Salle (Optionnel)</Label>
                   <div className="relative group">
                     <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary" />
                     <Input placeholder="Ex: Salle B102" value={newCourse.room} onChange={e => setNewCourse({...newCourse, room: e.target.value})} className="h-11 md:h-14 pl-10 rounded-xl md:rounded-2xl border-2 font-bold text-xs md:text-sm" />
                   </div>
                </div>

                <Button onClick={handleAddCourse} disabled={saving} className="w-full h-11 md:h-16 rounded-xl md:rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-black text-[10px] md:text-lg transition-all active:scale-95">
                  {saving ? <Loader2 className="animate-spin mr-2 size-3.5" /> : <Save className="mr-2 size-3.5" />}
                  Valider Scellage
                </Button>
              </div>
            </Card>

            <Card className="p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.2rem] bg-foreground text-white shadow-2xl relative overflow-hidden group border-none">
               <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="text-primary size-4 md:size-5 fill-primary" />
                    <p className="text-[7px] font-black uppercase text-white/40 tracking-widest">Direct-Link ACADEX</p>
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-primary tabular-nums">{mySchedules?.length || 0} séances</h3>
                  <p className="text-[9px] md:text-sm font-medium italic opacity-60 leading-relaxed">
                    "Toute heure scellée ici est synchronisée en temps réel."
                  </p>
               </div>
               <ShieldCheck className="absolute -bottom-10 -right-10 size-24 md:size-48 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform" />
            </Card>
          </div>

          {/* Liste des Créneaux */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden min-h-[400px] flex flex-col">
              <CardHeader className="p-6 md:p-12 border-b bg-muted/5 flex items-center justify-between">
                 <div className="space-y-0.5">
                   <CardTitle className="text-lg md:text-3xl font-black tracking-tight uppercase">Mon Agenda</CardTitle>
                   <p className="font-bold text-primary text-[8px] md:text-sm uppercase tracking-widest flex items-center gap-1.5">
                     <History className="size-3 md:size-3.5" /> Historique
                   </p>
                 </div>
                 <Badge variant="outline" className="rounded-full border-2 font-black px-3 h-8 md:h-11 text-[8px] md:text-xs">SESSIONS</Badge>
              </CardHeader>
              <CardContent className="p-4 md:p-10 flex-1">
                {loadingSchedules ? (
                  <div className="py-20 text-center animate-pulse"><Loader2 className="animate-spin mx-auto text-primary/20 size-8" /></div>
                ) : !mySchedules || mySchedules.length === 0 ? (
                  <div className="py-24 text-center space-y-6 opacity-30">
                    <Calendar className="size-12 md:size-20 mx-auto text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="font-black text-[10px] md:text-xl uppercase tracking-widest">Agenda Vierge</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 md:space-y-12">
                    {days.map(day => {
                      const dayCourses = mySchedules.filter((c: any) => c.day === day).sort((a:any, b:any) => a.startTime.localeCompare(b.startTime))
                      if (dayCourses.length === 0) return null
                      return (
                        <div key={day} className="space-y-3 md:space-y-6 animate-in slide-in-from-bottom-2">
                           <h4 className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-3 py-1 rounded-full w-fit">{day}</h4>
                           <div className="grid gap-3 md:gap-6">
                              {dayCourses.map((course: any) => (
                                <div key={course.id} className="p-3.5 md:p-8 bg-muted/5 rounded-xl md:rounded-[2.5rem] border border-muted/20 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between">
                                   <div className="flex items-center gap-3 md:gap-8 flex-1 min-w-0">
                                      <div className="size-10 md:size-20 bg-white rounded-xl md:rounded-2xl flex flex-col items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                         <Clock className="size-3.5 md:size-6" />
                                         <span className="text-[7px] md:text-sm font-black uppercase tracking-tighter">{course.startTime.split(':')[0]}H</span>
                                      </div>
                                      <div className="space-y-0.5 md:space-y-1 truncate">
                                         <div className="flex items-center gap-2 md:gap-3">
                                            <Badge className="bg-primary text-white font-black text-[9px] md:text-lg px-2 py-0.5 rounded-md">{course.classId}</Badge>
                                            <h4 className="text-xs md:text-2xl font-black uppercase tracking-tight truncate">{course.startTime} - {course.endTime}</h4>
                                         </div>
                                         <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[6px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><MapPin className="size-2.5 md:size-3 text-primary" /> {course.room || 'Salle libre'}</span>
                                            <span className="flex items-center gap-1"><Timer className="size-2.5 md:size-3 text-primary" /> {course.duration}</span>
                                         </div>
                                      </div>
                                   </div>
                                   <Button variant="ghost" size="icon" onClick={() => removeCourse(course.id)} className="size-9 md:size-14 rounded-xl md:rounded-2xl text-destructive hover:bg-destructive/10 active:scale-90 shrink-0"><Trash2 className="size-4 md:size-6" /></Button>
                                </div>
                              ))}
                           </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
