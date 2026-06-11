
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Zap, Loader2, BookOpen, ShieldCheck, History } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

export default function StudentAgendaPage() {
  const db = useFirestore()
  const [selectedDay, setSelectedDay] = useState("Lundi")
  const [studentClass, setStudentClass] = useState("")
  const [activeYear, setActiveYear] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role')
    const userId = localStorage.getItem('acadex_user_id')
    
    if (role === "Élève" && userId) {
      const parts = userId.split('-')
      if (parts.length >= 2) {
        setStudentClass(parts[1])
      }
    }
    
    const storedClass = localStorage.getItem('acadex_user_class')
    if (storedClass) setStudentClass(storedClass)

    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    setMounted(true)
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
      <div className="space-y-5 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase">Mon <span className="text-primary italic">Emploi du Temps</span></h1>
            <div className="text-muted-foreground font-bold flex items-center gap-2 text-[8px] md:text-sm">
              <Badge className="bg-primary text-white font-black px-3 rounded-full uppercase h-5 md:h-7">{studentClass || "N/A"}</Badge>
              <span>Planning Officiel • {activeYear}</span>
            </div>
          </div>
          <Badge className="bg-white border-2 border-primary/20 text-primary h-10 md:h-14 px-5 md:px-10 rounded-xl md:rounded-[1.8rem] flex items-center gap-2 md:gap-3 font-black text-[9px] md:text-lg shadow-xl shadow-primary/10 w-fit">
             <ShieldCheck className="size-3.5 md:size-6" /> CERTIFIÉ ACADEX
          </Badge>
        </div>

        <div className="grid gap-6 md:gap-10 lg:grid-cols-12">
          {/* Navigation Semaine - Horizontal Scroll on Mobile */}
          <div className="lg:col-span-3">
            <Card className="border-none shadow-sm bg-white rounded-[1.5rem] md:rounded-[3rem] p-3 md:p-10 h-fit">
              <h3 className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em] px-2 mb-3 md:mb-6">Navigation Semaine</h3>
              <div className="flex md:flex-col gap-1.5 md:gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 md:pb-0 snap-x snap-proximity">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "flex-1 md:w-full text-center md:text-left p-2 md:p-6 rounded-lg md:rounded-[1.8rem] font-black text-[9px] md:text-xl transition-all border-2 whitespace-nowrap min-w-[75px] md:min-w-0 snap-start",
                      selectedDay === day 
                        ? "bg-primary text-white border-primary shadow-lg scale-[1.02]" 
                        : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Liste des cours du jour - Vertical Stack */}
          <div className="lg:col-span-9 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg md:text-4xl font-black text-foreground uppercase tracking-tight">Programme du {selectedDay}</h2>
              <div className="hidden sm:flex items-center gap-2 text-muted-foreground font-black text-[9px] uppercase tracking-widest">
                 <History className="size-3" /> Live Update
              </div>
            </div>

            <div className="grid gap-3 md:gap-8">
              {loading ? (
                <div className="h-40 md:h-64 flex flex-col items-center justify-center p-8 text-center bg-white rounded-[1.5rem] md:rounded-[2.5rem] animate-pulse">
                  <Loader2 className="size-6 md:size-10 text-primary animate-spin mb-3" />
                  <p className="font-black text-muted-foreground uppercase tracking-widest text-[7px] md:text-[9px]">Chargement des flux...</p>
                </div>
              ) : dayCourses.length === 0 ? (
                <div className="h-40 md:h-[400px] flex flex-col items-center justify-center p-8 md:p-12 text-center border-4 border-dashed rounded-[1.5rem] md:rounded-[3rem] bg-white/50 opacity-40 space-y-3 md:space-y-6">
                  <BookOpen className="size-6 md:size-20 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <h3 className="text-base md:text-3xl font-black uppercase">Temps Libre</h3>
                    <p className="font-medium text-muted-foreground text-[8px] md:text-xl">Aucune séance scellée.</p>
                  </div>
                </div>
              ) : (
                dayCourses.map((course: any, i: number) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-[1.2rem] md:rounded-[4rem] overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className="p-3 md:p-10 flex flex-row items-center justify-between gap-3 md:gap-6">
                      <div className="flex items-center gap-3 md:gap-10 min-w-0">
                         <div className="size-11 md:size-24 bg-muted rounded-lg md:rounded-[2.5rem] flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                            <Clock className="size-3.5 md:size-7" />
                            <span className="text-[7px] md:text-lg font-black uppercase">{course.startTime.split(':')[0]}H</span>
                         </div>
                         <div className="space-y-0.5 md:space-y-1 truncate">
                           <h3 className="text-xs md:text-4xl font-black text-foreground uppercase group-hover:text-primary transition-colors truncate">{course.subject}</h3>
                           <div className="flex flex-wrap gap-2 md:gap-4 text-[6px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-1"><MapPin className="size-2.5 md:size-4 text-primary" /> {course.room || 'Salle...'}</span>
                              <span className="flex items-center gap-1"><User className="size-2.5 md:size-4 text-primary" /> {course.teacherName?.split(' ')[0]}</span>
                           </div>
                         </div>
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-[5px] md:text-[10px] font-black uppercase text-muted-foreground mb-0.5 tracking-widest">Durée</p>
                         <p className="text-[10px] md:text-3xl font-black text-primary tabular-nums">{course.duration}</p>
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
