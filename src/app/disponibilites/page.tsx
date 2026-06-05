
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Trash2, 
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  UserCheck,
  ChevronRight,
  Timer,
  CalendarDays
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

interface PlannedCourse {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: string;
  durationMinutes: number;
}

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

export default function AvailabilityPage() {
  const [userRole, setUserRole] = useState("")
  const [teacherSubject, setTeacherSubject] = useState("")
  const [mounted, setMounted] = useState(false)

  // Teacher State for specific courses
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([])
  const [newCourse, setNewCourse] = useState({
    day: "Lundi",
    startTime: "08:00",
    endTime: "10:00"
  })

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role') || "Directeur")
    setTeacherSubject(localStorage.getItem('acadex_user_subject') || "Mathématiques")
    setMounted(true)
  }, [])

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    
    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM)
    
    if (diffMinutes <= 0) return { text: "Invalide", minutes: 0 }
    
    const h = Math.floor(diffMinutes / 60)
    const m = diffMinutes % 60
    
    return {
      text: `${h}h${m > 0 ? ` ${m}min` : ''}`,
      minutes: diffMinutes
    }
  }

  const handleAddCourse = () => {
    const duration = calculateDuration(newCourse.startTime, newCourse.endTime)
    if (duration.minutes === 0) {
      toast({ title: "Horaire invalide", description: "L'heure de fin doit être après l'heure de début.", variant: "destructive" })
      return
    }

    const course: PlannedCourse = {
      id: Math.random().toString(36).substr(2, 9),
      day: newCourse.day,
      startTime: newCourse.startTime,
      endTime: newCourse.endTime,
      duration: duration.text,
      durationMinutes: duration.minutes
    }

    setPlannedCourses([...plannedCourses, course])
    toast({ title: "Cours ajouté", description: `Session du ${course.day} enregistrée.` })
  }

  const removeCourse = (id: string) => {
    setPlannedCourses(plannedCourses.filter(c => c.id !== id))
  }

  const totalMinutes = plannedCourses.reduce((acc, curr) => acc + curr.durationMinutes, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMins = totalMinutes % 60

  const handleSave = () => {
    toast({
      title: "Planning enregistré",
      description: "Votre emploi du temps personnalisé a été soumis.",
    })
  }

  const isDirector = userRole.toLowerCase() === "directeur"

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              {isDirector ? "Pilotage des Emplois du Temps" : "Gestion de mes Heures"}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {isDirector 
                ? "Gérez les créneaux des enseignants et générez l'emploi du temps sans conflits." 
                : `Planification précise de vos cours de ${teacherSubject}.`}
            </p>
          </div>
          {!isDirector && (
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
              <Save className="mr-2 size-5" />
              Soumettre le planning
            </Button>
          )}
        </div>

        {isDirector ? (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black">Soumissions Enseignants</CardTitle>
                  <CardDescription>Flux de validation des disponibilités hebdomadaires</CardDescription>
                </CardHeader>
                <CardContent className="p-12 text-center space-y-4">
                  <div className="size-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <UserCheck className="size-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-black">Aucune soumission en attente</h3>
                  <p className="text-muted-foreground font-medium max-w-xs mx-auto">Les propositions de planning des professeurs apparaîtront ici pour validation.</p>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <CardTitle className="text-xl font-black mb-6 flex items-center gap-2">
                  <Zap className="size-5 text-amber-500" />
                  Génération IA
                </CardTitle>
                <Button className="w-full h-14 rounded-xl bg-primary font-black" disabled>
                  Calculer Emploi du Temps optimal
                </Button>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Form: Add Course */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="premium-card p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <Plus className="text-primary size-5" /> Ajouter un cours
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground">Saisissez les heures exactes de votre session.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Jour de la semaine</Label>
                    <Select value={newCourse.day} onValueChange={(v) => setNewCourse({...newCourse, day: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map(d => <SelectItem key={d} value={d} className="font-bold">{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Début</Label>
                      <Input 
                        type="time" 
                        value={newCourse.startTime} 
                        onChange={(e) => setNewCourse({...newCourse, startTime: e.target.value})}
                        className="h-12 rounded-xl font-black" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Fin</Label>
                      <Input 
                        type="time" 
                        value={newCourse.endTime} 
                        onChange={(e) => setNewCourse({...newCourse, endTime: e.target.value})}
                        className="h-12 rounded-xl font-black" 
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="size-4 text-primary" />
                      <span className="text-xs font-black text-primary uppercase">Durée calculée</span>
                    </div>
                    <span className="font-black text-lg text-primary">
                      {calculateDuration(newCourse.startTime, newCourse.endTime).text}
                    </span>
                  </div>

                  <Button onClick={handleAddCourse} className="w-full h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 font-black text-lg">
                    Enregistrer ce cours
                  </Button>
                </div>
              </Card>

              <Card className="premium-card p-8 bg-foreground text-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <CheckCircle2 className="size-6 text-primary" />
                  </div>
                  <Badge className="bg-primary text-white border-none">RÉCAPITULATIF</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Total Hebdomadaire</p>
                  <p className="text-4xl font-black">{totalHours}h {remainingMins > 0 ? `${remainingMins}min` : ''}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs font-medium text-white/60">
                    Ces heures seront utilisées par le Cerveau ACADEX pour détecter vos absences et retards automatiquement.
                  </p>
                </div>
              </Card>
            </div>

            {/* Right List: Planned Courses */}
            <div className="lg:col-span-8">
              <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden flex flex-col h-full min-h-[500px]">
                <CardHeader className="p-10 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black">Mon Emploi du Temps</CardTitle>
                      <CardDescription className="font-medium">Liste des sessions de cours planifiées pour la semaine.</CardDescription>
                    </div>
                    <Badge variant="outline" className="h-10 px-6 rounded-full border-2 font-black">
                      {plannedCourses.length} COURS
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 flex-1">
                  {plannedCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-40">
                      <div className="size-24 bg-muted rounded-[2rem] flex items-center justify-center">
                        <CalendarDays className="size-12 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-black text-muted-foreground">Aucun cours planifié pour le moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {days.map(day => {
                        const dayCourses = plannedCourses.filter(c => c.day === day)
                        if (dayCourses.length === 0) return null
                        
                        return (
                          <div key={day} className="space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-2">{day}</h4>
                            <div className="grid gap-3">
                              {dayCourses.map(course => (
                                <div key={course.id} className="flex items-center justify-between p-5 bg-muted/30 rounded-3xl group hover:bg-muted/50 transition-all border-2 border-transparent hover:border-primary/10">
                                  <div className="flex items-center gap-6">
                                    <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm font-black text-primary">
                                      {course.startTime.split(':')[0]}h
                                    </div>
                                    <div className="space-y-1">
                                      <p className="font-black text-foreground flex items-center gap-2">
                                        {course.startTime} <ArrowRight className="size-3 text-muted-foreground" /> {course.endTime}
                                      </p>
                                      <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                        <Timer className="size-3" /> Durée : {course.duration}
                                      </p>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeCourse(course.id)}
                                    className="size-12 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 className="size-5" />
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
                <CardFooter className="p-8 bg-muted/20 border-t flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Planification certifiée Acadex</span>
                  </div>
                  <Button onClick={handleSave} className="rounded-xl font-bold bg-foreground text-white">Confirmer le planning</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
