"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Zap, Loader2, BookOpen } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

export default function StudentAgendaPage() {
  const db = useFirestore()
  const [selectedDay, setSelectedDay] = useState("Lundi")
  const [studentClass, setStudentClass] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const fetchStudentData = async () => {
      const matricule = localStorage.getItem('acadex_user_id')
      if (matricule) {
        // Dans ACADEX, le matricule contient la classe (ex: ELV-3EMEA-001)
        const parts = matricule.split('-')
        if (parts.length >= 2) setStudentClass(parts[1])
      }
      setMounted(true)
    }
    fetchStudentData()
  }, [])

  // Requête mémorisée pour éviter les boucles de rendu infinies
  const schedulesQuery = useMemo(() => {
    if (!db || !studentClass) return null
    return query(collection(db, "schedules"), where("classId", "==", studentClass))
  }, [db, studentClass])

  const { data: allSchedules, loading } = useCollection(schedulesQuery)

  const dayCourses = useMemo(() => {
    if (!allSchedules) return []
    return allSchedules
      .filter((s: any) => s.day === selectedDay)
      .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
  }, [allSchedules, selectedDay])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Mon <span className="text-primary italic">Emploi du Temps</span></h1>
            {/* Correction de l'erreur d'hydratation : Remplacement de <p> par <div> pour contenir le <Badge> */}
            <div className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
              Programme hebdomadaire officiel de la classe <Badge className="bg-primary">{studentClass}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
             <Badge className="bg-amber-100 text-amber-700 border-none font-bold px-4 py-2">
               <Zap className="size-3 mr-2 fill-amber-700" /> {allSchedules?.length || 0} Sessions programmées
             </Badge>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Menu des jours */}
          <Card className="lg:col-span-3 border-none shadow-sm bg-white rounded-[2.5rem] p-6 h-fit">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-6 px-4">Navigation Semaine</h3>
            <div className="space-y-2">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`w-full text-left p-4 rounded-2xl font-black transition-all ${selectedDay === day ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </Card>

          {/* Liste des cours du jour */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-foreground">Programme du {selectedDay}</h2>
              <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase tracking-widest px-4">
                {dayCourses.length} COURS
              </Badge>
            </div>

            <div className="grid gap-6">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2.5rem] animate-pulse">
                  <Loader2 className="size-12 text-primary animate-spin mb-4" />
                  <p className="font-black text-muted-foreground uppercase tracking-widest">Récupération du programme...</p>
                </div>
              ) : dayCourses.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center p-12 text-center border-4 border-dashed rounded-[3rem] bg-muted/20 opacity-40">
                  <BookOpen className="size-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-black">Aucun cours programmé</h3>
                  <p className="font-medium text-muted-foreground">Profite de ce temps libre pour tes devoirs personnels.</p>
                </div>
              ) : (
                dayCourses.map((course: any, i: number) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-8">
                         <div className="size-24 bg-muted rounded-[2rem] flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <Clock className="size-7 mb-1" />
                            <span className="text-[10px] font-black uppercase">{course.startTime}</span>
                         </div>
                         <div className="space-y-2">
                           <div className="flex items-center gap-3">
                             <h3 className="text-3xl font-black text-foreground">{course.subject}</h3>
                             <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20 text-primary">EN DIRECT</Badge>
                           </div>
                           <div className="flex flex-wrap gap-6 text-sm font-bold text-muted-foreground">
                              <span className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full"><MapPin className="size-4 text-primary" /> {course.room}</span>
                              <span className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full"><User className="size-4 text-primary" /> {course.teacherName}</span>
                           </div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Durée de session</p>
                          <p className="text-xl font-black text-primary">{course.duration || '2h 00min'}</p>
                        </div>
                        <Button variant="ghost" className="rounded-xl font-bold group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                          Détails cours
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
