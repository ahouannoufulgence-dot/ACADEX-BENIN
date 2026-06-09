
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
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
  UserCheck,
  Timer,
  CalendarDays,
  MapPin,
  Loader2,
  AlertTriangle,
  History
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
  const [userRole, setUserRole] = useState("")
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
    room: "Salle 12"
  })

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role') || "")
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
    return { text: `${h}h${m > 0 ? ` ${m}min` : ''}`, minutes: diffMinutes }
  }

  const handleAddCourse = async () => {
    if (!newCourse.classId) {
      toast({ title: "Champ requis", description: "Veuillez choisir une classe.", variant: "destructive" })
      return
    }

    const duration = calculateDuration(newCourse.startTime, newCourse.endTime)
    if (duration.minutes === 0) {
      toast({ title: "Horaire invalide", description: "L'heure de fin doit être après l'heure de début.", variant: "destructive" })
      return
    }

    // VÉRIFICATION DES CONFLITS (Même prof, même jour, chevauchement)
    const newStart = newCourse.startTime
    const newEnd = newCourse.endTime
    
    const conflict = mySchedules?.find((s: any) => {
      if (s.day !== newCourse.day) return false
      // Formule d'intersection : (StartA < EndB) AND (EndA > StartB)
      return (newStart < s.endTime) && (newEnd > s.startTime)
    })

    if (conflict) {
      toast({ 
        title: "Conflit Horaire Détecté", 
        description: `Vous avez déjà un cours (${conflict.subject}) en ${conflict.classId} sur ce créneau.`,
        variant: "destructive" 
      })
      return
    }

    setSaving(true)
    try {
      const scheduleData = {
        ...newCourse,
        teacherId,
        teacherName,
        subject: teacherSubject,
        duration: duration.text,
        academicYear: activeYear,
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, "schedules"), scheduleData)
      toast({ title: "Session enregistrée", description: `Le créneau a été scellé dans l'emploi du temps de la classe ${newCourse.classId}.` })
    } catch (e) {
      toast({ title: "Erreur de scellage", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const removeCourse = async (id: string) => {
    try {
      await deleteDoc(doc(db, "schedules", id))
      toast({ title: "Session supprimée" })
    } catch (e) {
      toast({ title: "Erreur de suppression", variant: "destructive" })
    }
  }

  const totalMinutes = mySchedules?.reduce((acc, curr: any) => acc + (calculateDuration(curr.startTime, curr.endTime).minutes || 0), 0) || 0
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMins = totalMinutes % 60

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">
              Mon Emploi <span className="text-primary italic">du Temps</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <Clock className="size-3.5 text-primary" />
              <span>Saisie Intelligente • Année {activeYear}</span>
            </div>
          </div>
          <Badge className="bg-primary text-white h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-[1.8rem] flex items-center gap-3 font-black text-[10px] md:text-lg shadow-xl shadow-primary/20">
             <ShieldCheck className="size-4 md:size-6" /> RÉSEAU SCELLÉ
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Saisie Planning */}
          <div className="lg:col-span-4 space-y-6 md:space-y-10">
            <Card className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-white border-none shadow-sm space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-black flex items-center gap-3">
                  <Plus className="text-primary size-5 md:size-7" /> Programmer un cours
                </h3>
                <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Les modifications impactent l'école entière.</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-black text-[9px] md:text-[10px] uppercase text-muted-foreground tracking-[0.2em] px-1">Choisir la classe</Label>
                  <Select value={newCourse.classId} onValueChange={(v) => setNewCourse({...newCourse, classId: v})}>
                    <SelectTrigger className="h-12 md:h-16 rounded-2xl md:rounded-3xl border-2 font-black text-xs md:text-lg shadow-inner">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl p-2 border-2">
                      {teacherClasses.map(c => <SelectItem key={c} value={c} className="font-bold p-3 rounded-xl">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-[9px] md:text-[10px] uppercase text-muted-foreground tracking-[0.2em] px-1">Jour de séance</Label>
                  <Select value={newCourse.day} onValueChange={(v) => setNewCourse({...newCourse, day: v})}>
                    <SelectTrigger className="h-12 md:h-16 rounded-2xl md:rounded-3xl border-2 font-black text-xs md:text-lg shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl p-2 border-2">
                      {days.map(d => <SelectItem key={d} value={d} className="font-bold p-3 rounded-xl">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label className="font-black text-[9px] md:text-[10px] uppercase text-muted-foreground tracking-[0.2em] px-1">Début</Label>
                    <Input type="time" value={newCourse.startTime} onChange={(e) => setNewCourse({...newCourse, startTime: e.target.value})} className="h-12 md:h-16 rounded-2xl md:rounded-3xl border-2 font-black text-center text-sm md:text-xl shadow-inner focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[9px] md:text-[10px] uppercase text-muted-foreground tracking-[0.2em] px-1">Fin</Label>
                    <Input type="time" value={newCourse.endTime} onChange={(e) => setNewCourse({...newCourse, endTime: e.target.value})} className="h-12 md:h-16 rounded-2xl md:rounded-3xl border-2 font-black text-center text-sm md:text-xl shadow-inner focus:ring-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-[9px] md:text-[10px] uppercase text-muted-foreground tracking-[0.2em] px-1">Localisation (Salle)</Label>
                  <Input value={newCourse.room} onChange={(e) => setNewCourse({...newCourse, room: e.target.value})} className="h-12 md:h-16 rounded-2xl md:rounded-3xl border-2 font-bold text-xs md:text-lg shadow-inner" placeholder="Ex: Salle 12, Amphi B..." />
                </div>

                <Button onClick={handleAddCourse} disabled={saving} className="w-full h-14 md:h-20 rounded-2xl md:rounded-[2.5rem] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-black text-xs md:text-xl active:scale-95 transition-all">
                  {saving ? <Loader2 className="animate-spin mr-3 size-5 md:size-8" /> : <Save className="mr-3 size-5 md:size-8" />}
                  Sceller au Planning
                </Button>
              </div>
            </Card>

            <Card className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-foreground text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 space-y-2">
                <p className="text-[9px] md:text-[11px] font-black uppercase text-white/40 tracking-[0.3em] mb-1">Volume Horaire Réel</p>
                <p className="text-3xl md:text-6xl font-black text-primary tabular-nums">{totalHours}h <span className="text-xs md:text-2xl opacity-40">{remainingMins > 0 ? `${remainingMins}m` : '00'}</span></p>
                <div className="mt-8 pt-8 border-t border-white/10 opacity-60 italic text-[10px] md:text-lg font-medium leading-relaxed uppercase tracking-tight">
                  "Chaque heure scellée ici est transmise spontanément aux élèves de vos classes."
                </div>
              </div>
              <Zap className="absolute -bottom-10 -right-10 size-40 md:size-64 text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[3000ms]" />
            </Card>
          </div>

          {/* Liste Planning */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[4rem] overflow-hidden flex flex-col min-h-[600px] md:min-h-[850px]">
              <CardHeader className="p-8 md:p-14 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <CardTitle className="text-xl md:text-4xl font-black tracking-tight uppercase">Agenda Officiel</CardTitle>
                  <CardDescription className="font-bold text-primary text-[10px] md:text-lg mt-1 uppercase tracking-widest">{teacherName} • {teacherSubject}</CardDescription>
                </div>
                <Badge variant="outline" className="h-10 md:h-14 px-6 md:px-10 rounded-full border-2 font-black uppercase text-[10px] md:text-lg flex items-center gap-3">
                  {mySchedules?.length || 0} SESSIONS
                </Badge>
              </CardHeader>
              
              <CardContent className="p-6 md:p-14 flex-1 overflow-y-auto no-scrollbar">
                {loadingSchedules ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30">
                    <Loader2 className="animate-spin text-primary size-10 md:size-16" />
                    <p className="font-black text-[10px] md:text-sm uppercase tracking-[0.4em] text-muted-foreground">Appel de vos créneaux...</p>
                  </div>
                ) : !mySchedules || mySchedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-8 opacity-40 py-20 text-center">
                    <div className="size-24 md:size-32 bg-muted rounded-[2.5rem] flex items-center justify-center shadow-inner">
                      <CalendarDays className="size-10 md:size-16 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-xl md:text-3xl font-black uppercase text-foreground">Agenda Vierge</h3>
                       <p className="text-[10px] md:text-xl font-medium text-muted-foreground max-sm mx-auto leading-relaxed">
                         Commencez à planifier vos cours pour l'année {activeYear}.
                       </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12 md:space-y-20">
                    {days.map(day => {
                      const dayCourses = mySchedules.filter((c: any) => c.day === day).sort((a:any, b:any) => a.startTime.localeCompare(b.startTime))
                      if (dayCourses.length === 0) return null
                      return (
                        <div key={day} className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
                          <div className="flex items-center gap-4">
                            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-primary bg-primary/5 px-6 py-2 rounded-full border border-primary/10 shadow-sm">{day}</h4>
                            <div className="h-px flex-1 bg-muted/30" />
                          </div>
                          <div className="grid gap-4 md:gap-8">
                            {dayCourses.map((course: any) => (
                              <div key={course.id} className="p-6 md:p-12 bg-white rounded-[2rem] md:rounded-[3.5rem] group hover:shadow-2xl transition-all border-2 border-muted/20 hover:border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.01] pointer-events-none group-hover:scale-110 transition-transform duration-700"><Zap className="size-32" /></div>
                                
                                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-14 relative z-10 w-full md:w-auto">
                                  <div className="size-16 md:size-28 bg-muted rounded-2xl md:rounded-[2.5rem] flex flex-col items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                    <Clock className="size-6 md:size-10 mb-1" />
                                    <span className="text-[10px] md:text-lg font-black uppercase tracking-tighter">{course.startTime.split(':')[0]}H</span>
                                  </div>
                                  <div className="space-y-2 md:space-y-4 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-6">
                                      <Badge className="bg-primary text-white font-black px-4 md:px-8 py-1 md:py-2 text-[10px] md:text-xl rounded-lg md:rounded-xl shadow-lg shadow-primary/20">{course.classId}</Badge>
                                      <p className="font-black text-foreground text-xl md:text-4xl tracking-tight uppercase">
                                        {course.startTime} <ArrowRight className="size-4 md:size-8 text-muted-foreground inline mx-1" /> {course.endTime}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-10 text-[9px] md:text-sm font-black uppercase text-muted-foreground tracking-widest">
                                      <span className="flex items-center gap-2"><MapPin className="size-3 md:size-5 text-primary" /> {course.room}</span>
                                      <span className="flex items-center gap-2"><Timer className="size-3 md:size-5 text-primary" /> {calculateDuration(course.startTime, course.endTime).text}</span>
                                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-50 font-black px-3">SÉANCE SCELLÉE</Badge>
                                    </div>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeCourse(course.id)}
                                  className="size-12 md:size-18 rounded-2xl md:rounded-3xl text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                                >
                                  <Trash2 className="size-6 md:size-10" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="p-8 md:p-14 bg-muted/5 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-10 md:size-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <ShieldCheck className="size-5 md:size-8 text-emerald-500" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[10px] md:text-sm font-black uppercase text-foreground tracking-tight">Certification Planning ACADEX</p>
                    <p className="text-[8px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Protocole d'Intégrité Temporelle V1.0</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full md:w-auto h-12 md:h-16 rounded-xl md:rounded-2xl border-2 border-primary/10 font-black text-[9px] md:text-sm px-8 md:px-14 hover:bg-primary hover:text-white transition-all shadow-sm">
                   <History className="mr-2 size-4 md:size-5" /> Télécharger mon PDF
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
