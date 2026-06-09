
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Zap, Loader2, BookOpen, ShieldCheck, History } from "lucide-react"
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
  const [activeYear, setActiveYear] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const fetchStudentData = async () => {
      const matricule = localStorage.getItem('acadex_user_id')
      if (matricule) {
        const parts = matricule.split('-')
        if (parts.length >= 2) setStudentClass(parts[1])
      }
      setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
      setMounted(true)
    }
    fetchStudentData()
  }, [])

  const schedulesQuery = useMemo(() => {
    if (!db || !studentClass || !activeYear) return null
    return query(
      collection(db, "schedules"), 
      where("classId", "==", studentClass),
      where("academicYear", "==", activeYear)
    )
  }, [db, studentClass, activeYear])

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
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">Mon <span className="text-primary italic">Emploi du Temps</span></h1>
            <div className="text-muted-foreground mt-2 font-bold flex items-center gap-3 text-[10px] md:text-sm">
              <Badge className="bg-primary text-white font-black px-4 rounded-full">{studentClass}</Badge>
              <span>Planning Officiel • Année {activeYear}</span>
            </div>
          </div>
          <Badge className="bg-white border-2 border-primary/20 text-primary h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-[1.8rem] flex items-center gap-3 font-black text-[10px] md:text-lg shadow-xl shadow-primary/10">
             <ShieldCheck className="size-4 md:size-6" /> CERTIFIÉ ACADEX
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Menu des jours */}
          <Card className="lg:col-span-3 border-none shadow-sm bg-white rounded-[2.2rem] md:rounded-[3rem] p-6 md:p-10 h-fit space-y-6">
            <h3 className="text-[9px] md:text-[11px] font-black uppercase text-muted-foreground tracking-[0.25em] px-2">Navigation Semaine</h3>
            <div className="space-y-2 md:space-y-3">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "w-full text-left p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.8rem] font-black text-xs md:text-xl transition-all border-2",
                    selectedDay === day 
                      ? "bg-primary text-white border-primary shadow-xl scale-[1.02]" 
                      : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </Card>

          {/* Liste des cours du jour */}
          <div className="lg:col-span-9 space-y-6 md:space-y-10">
            <div className="flex items-center justify-between px-2 md:px-4">
              <h2 className="text-xl md:text-4xl font-black text-foreground uppercase tracking-tight">Programme du {selectedDay}</h2>
              <Badge variant="outline" className="hidden sm:flex rounded-full border-primary/20 text-primary font-black uppercase tracking-widest px-6 h-10 md:h-12 text-[10px] md:text-sm">
                {dayCourses.length} SÉANCES SCELLÉES
              </Badge>
            </div>

            <div className="grid gap-4 md:gap-8">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2.5rem] animate-pulse">
                  <Loader2 className="size-12 text-primary animate-spin mb-4" />
                  <p className="font-black text-muted-foreground uppercase tracking-widest text-[10px]">Synchronisation avec le registre école...</p>
                </div>
              ) : dayCourses.length === 0 ? (
                <div className="h-64 md:h-[400px] flex flex-col items-center justify-center p-12 text-center border-4 border-dashed rounded-[3rem] bg-white/50 opacity-40 space-y-6">
                  <BookOpen className="size-12 md:size-20 text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-3xl font-black uppercase">Temps Libre</h3>
                    <p className="font-medium text-muted-foreground text-sm md:text-xl">Profite de ce créneau pour tes devoirs personnels.</p>
                  </div>
                </div>
              ) : (
                dayCourses.map((course: any, i: number) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-[2.2rem] md:rounded-[4rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 active:scale-[0.98] md:active:scale-100">
                    <div className="p-6 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-14">
                      <div className="flex items-center gap-6 md:gap-14">
                         <div className="size-20 md:size-32 bg-muted rounded-[1.8rem] md:rounded-[2.5rem] flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner shrink-0">
                            <Clock className="size-6 md:size-10 mb-1" />
                            <span className="text-[10px] md:text-xl font-black uppercase tracking-tighter">{course.startTime.split(':')[0]}H</span>
                         </div>
                         <div className="space-y-2 md:space-y-4">
                           <div className="flex items-center gap-3 md:gap-6">
                             <h3 className="text-2xl md:text-5xl font-black text-foreground tracking-tighter uppercase group-hover:text-primary transition-colors">{course.subject}</h3>
                             <Badge variant="outline" className="text-[7px] md:text-[10px] font-black uppercase border-primary/20 text-primary px-3 rounded-full">EN DIRECT</Badge>
                           </div>
                           <div className="flex flex-wrap gap-4 md:gap-10 text-[9px] md:text-sm font-bold text-muted-foreground uppercase tracking-[0.15em]">
                              <span className="flex items-center gap-2"><MapPin className="size-3 md:size-5 text-primary" /> {course.room}</span>
                              <span className="flex items-center gap-2"><User className="size-3 md:size-5 text-primary" /> {course.teacherName}</span>
                           </div>
                         </div>
                      </div>
                      <div className="flex flex-col items-center md:items-end gap-3 md:gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-muted/30">
                        <div className="text-center md:text-right">
                          <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Durée scellée</p>
                          <p className="text-lg md:text-3xl font-black text-primary tabular-nums">{course.duration || '2h 00min'}</p>
                        </div>
                        <Button variant="outline" className="w-full md:w-auto rounded-xl md:rounded-2xl font-black h-11 md:h-14 px-8 border-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all active:scale-95 text-[10px] md:text-sm">
                          Détails Séance
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            <div className="p-8 md:p-14 bg-muted/20 rounded-[2.5rem] md:rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-8 border-2 border-dashed border-muted-foreground/10">
               <div className="flex items-center gap-5">
                  <div className="size-12 md:size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <History className="text-primary size-6 md:size-8" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[10px] md:text-lg font-black uppercase text-foreground tracking-tight">Historique des Cours</p>
                    <p className="text-[8px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Consulte tes sessions passées et futures.</p>
                  </div>
               </div>
               <Button className="w-full md:w-auto h-12 md:h-16 rounded-xl md:rounded-2xl font-black bg-foreground text-white px-10 md:px-14 shadow-xl active:scale-95 transition-all text-xs md:text-lg">
                  TÉLÉCHARGER MON PLANNING PDF
               </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
