
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
  Loader2
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
import { collection, addDoc, query, where, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

export default function AvailabilityPage() {
  const db = useFirestore()
  const [userRole, setUserRole] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [teacherName, setTeacherName] = useState("")
  const [teacherSubject, setTeacherSubject] = useState("")
  const [teacherClasses, setTeacherClasses] = useState<string[]>([])
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
    setUserRole(localStorage.getItem('acadex_user_role') || "Directeur")
    setTeacherId(localStorage.getItem('acadex_user_id') || "")
    setTeacherName(localStorage.getItem('acadex_user_name') || "")
    setTeacherSubject(localStorage.getItem('acadex_user_subject') || "Matière")
    setTeacherClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setMounted(true)
  }, [])

  // Charger les cours déjà programmés par ce prof
  const schedulesQuery = useMemo(() => {
    if (!db || !teacherId) return null
    return query(collection(db, "schedules"), where("teacherId", "==", teacherId))
  }, [db, teacherId])

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

    setSaving(true)
    const scheduleData = {
      ...newCourse,
      teacherId,
      teacherName,
      subject: teacherSubject,
      duration: duration.text,
      createdAt: serverTimestamp()
    }

    addDoc(collection(db, "schedules"), scheduleData)
      .then(() => {
        toast({ title: "Session enregistrée", description: `Cours du ${newCourse.day} ajouté au programme.` })
      })
      .catch(async () => {
        const error = new FirestorePermissionError({
          path: 'schedules',
          operation: 'create',
          requestResourceData: scheduleData
        })
        errorEmitter.emit('permission-error', error)
      })
      .finally(() => setSaving(false))
  }

  const removeCourse = (id: string) => {
    const docRef = doc(db, "schedules", id)
    deleteDoc(docRef)
      .then(() => toast({ title: "Session supprimée" }))
      .catch(async () => {
        const error = new FirestorePermissionError({ path: docRef.path, operation: 'delete' })
        errorEmitter.emit('permission-error', error)
      })
  }

  const totalMinutes = mySchedules?.reduce((acc, curr: any) => acc + (calculateDuration(curr.startTime, curr.endTime).minutes || 0), 0) || 0
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMins = totalMinutes % 60

  const isDirector = userRole.toLowerCase() === "directeur"

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              {isDirector ? "Pilotage Emplois du Temps" : "Mon Programme de Cours"}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium italic">
              {isDirector 
                ? "Gérez les créneaux globaux et évitez les conflits de salles." 
                : `Planifiez vos sessions de ${teacherSubject} pour vos classes.`}
            </p>
          </div>
        </div>

        {isDirector ? (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black">Programmation Globale</CardTitle>
                  <CardDescription>Tous les cours programmés par l'équipe pédagogique.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 text-center space-y-4">
                  <div className="size-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <UserCheck className="size-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-black">Audit en temps réel</h3>
                  <p className="text-muted-foreground font-medium max-w-xs mx-auto">Le Directeur peut voir ici tous les cours saisis par les profs pour valider le planning de l'école.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-6">
              <Card className="premium-card p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <Plus className="text-primary size-5" /> Programmer un cours
                  </h3>
                  <Badge className="bg-primary/10 text-primary border-none">{teacherSubject}</Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase text-muted-foreground">Choisir une classe</Label>
                    <Select value={newCourse.classId} onValueChange={(v) => setNewCourse({...newCourse, classId: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherClasses.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase text-muted-foreground">Jour</Label>
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
                      <Label className="font-black text-xs uppercase text-muted-foreground">Début</Label>
                      <Input type="time" value={newCourse.startTime} onChange={(e) => setNewCourse({...newCourse, startTime: e.target.value})} className="h-12 rounded-xl font-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase text-muted-foreground">Fin</Label>
                      <Input type="time" value={newCourse.endTime} onChange={(e) => setNewCourse({...newCourse, endTime: e.target.value})} className="h-12 rounded-xl font-black" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase text-muted-foreground">Salle</Label>
                    <Input value={newCourse.room} onChange={(e) => setNewCourse({...newCourse, room: e.target.value})} className="h-12 rounded-xl font-bold" placeholder="Ex: Salle 12" />
                  </div>

                  <Button onClick={handleAddCourse} disabled={saving} className="w-full h-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-lg">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    Enregistrer au programme
                  </Button>
                </div>
              </Card>

              <Card className="premium-card p-8 bg-foreground text-white">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Volume Horaire Réel</p>
                <p className="text-4xl font-black">{totalHours}h {remainingMins > 0 ? `${remainingMins}min` : ''}</p>
                <div className="mt-6 pt-6 border-t border-white/10 opacity-60 italic text-xs">
                  "Votre programme est instantanément partagé avec vos élèves via leur cockpit ACADEX."
                </div>
              </Card>
            </div>

            <div className="lg:col-span-8">
              <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden flex flex-col min-h-[500px]">
                <CardHeader className="p-10 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black">Mon Emploi du Temps</CardTitle>
                      <CardDescription className="font-medium text-primary">Liste de vos sessions validées.</CardDescription>
                    </div>
                    <Badge variant="outline" className="h-10 px-6 rounded-full border-2 font-black uppercase">
                      {mySchedules?.length || 0} SESSIONS
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 flex-1">
                  {loadingSchedules ? (
                    <div className="p-20 text-center animate-pulse font-bold text-muted-foreground">Chargement de votre programme...</div>
                  ) : !mySchedules || mySchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-40">
                      <CalendarDays className="size-16 text-muted-foreground" />
                      <p className="text-lg font-black text-muted-foreground">Aucun cours programmé pour le moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {days.map(day => {
                        const dayCourses = mySchedules.filter((c: any) => c.day === day)
                        if (dayCourses.length === 0) return null
                        return (
                          <div key={day} className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-4 border-l-4 border-primary">{day}</h4>
                            <div className="grid gap-3">
                              {dayCourses.map((course: any) => (
                                <div key={course.id} className="flex items-center justify-between p-6 bg-muted/30 rounded-[2rem] group hover:bg-white hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/10">
                                  <div className="flex items-center gap-8">
                                    <div className="size-14 bg-white rounded-2xl flex items-center justify-center shadow-sm font-black text-primary text-xl">
                                      {course.startTime.split(':')[0]}h
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-3">
                                        <Badge className="bg-primary text-white font-black">{course.classId}</Badge>
                                        <p className="font-black text-foreground text-lg">
                                          {course.startTime} <ArrowRight className="size-3 text-muted-foreground inline" /> {course.endTime}
                                        </p>
                                      </div>
                                      <div className="flex gap-4 text-[10px] font-black uppercase text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="size-3 text-primary" /> {course.room}</span>
                                        <span className="flex items-center gap-1"><Timer className="size-3 text-primary" /> {calculateDuration(course.startTime, course.endTime).text}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeCourse(course.id)}
                                    className="size-12 rounded-2xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
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
                <CardFooter className="p-8 bg-muted/10 border-t flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Certification ACADEX Emploi du Temps</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
