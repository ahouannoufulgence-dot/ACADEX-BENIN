
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
    // Récupération de la classe de l'élève
    const role = localStorage.getItem('acadex_user_role')
    const userId = localStorage.getItem('acadex_user_id')
    
    if (role === "Élève" && userId) {
      // Dans ACADEX, le matricule élève contient souvent la classe, ex: ELV-6A-001
      const parts = userId.split('-')
      if (parts.length >= 2) {
        // Extraction de la classe du matricule si possible, ou depuis une autre source de données
        setStudentClass(parts[1])
      }
    }
    
    // Si la classe n'est pas dans le matricule, on peut la stocker à la connexion
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
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">Mon <span className="text-primary italic">Emploi du Temps</span></h1>
            <div className="text-muted-foreground mt-2 font-bold flex items-center gap-3 text-[9px] md:text-sm">
              <Badge className="bg-primary text-white font-black px-4 rounded-full uppercase">{studentClass || "Classe non définie"}</Badge>
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
            <h3 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em] px-2 text-center md:text-left">Navigation Semaine</h3>
            <div className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex-1 md:w-full text-center md:text-left p-3 md:p-6 rounded-[1.2rem] md:rounded-[1.8rem] font-black text-[10px] md:text-xl transition-all border-2 whitespace-nowrap",
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
          <div className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl md:text-4xl font-black text-foreground uppercase tracking-tight">Programme du {selectedDay}</h2>
              <div className="hidden sm:flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                 <History className="size-3.5" /> Dernière mise à jour : Live
              </div>
            </div>

            <div className="grid gap-4 md:gap-8">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2.5rem] animate-pulse">
                  <Loader2 className="size-10 text-primary animate-spin mb-4" />
                  <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px]">Appel du registre...</p>
                </div>
              ) : dayCourses.length === 0 ? (
                <div className="h-64 md:h-[400px] flex flex-col items-center justify-center p-12 text-center border-4 border-dashed rounded-[3rem] bg-white/50 opacity-40 space-y-6">
                  <BookOpen className="size-12 md:size-20 text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-3xl font-black uppercase">Temps Libre</h3>
                    <p className="font-medium text-muted-foreground text-sm md:text-xl">Aucune séance scellée. Profite de ce créneau pour tes devoirs personnels.</p>
                  </div>
                </div>
              ) : (
                dayCourses.map((course: any, i: number) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-[2.2rem] md:rounded-[4rem] overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <div className="p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 md:gap-10">
                         <div className="size-16 md:size-24 bg-muted rounded-2xl md:rounded-[2.5rem] flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                            <Clock className="size-4 md:size-7" />
                            <span className="text-[10px] md:text-lg font-black uppercase">{course.startTime.split(':')[0]}H</span>
                         </div>
                         <div className="space-y-1">
                           <h3 className="text-lg md:text-4xl font-black text-foreground uppercase group-hover:text-primary transition-colors">{course.subject}</h3>
                           <div className="flex flex-wrap gap-4 text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-2"><MapPin className="size-3 md:size-4 text-primary" /> {course.room || 'Salle libre'}</span>
                              <span className="flex items-center gap-2"><User className="size-3 md:size-4 text-primary" /> {course.teacherName}</span>
                              <Badge variant="outline" className="border-primary/20 text-primary font-black px-2 h-5 text-[8px] uppercase">Planifié</Badge>
                           </div>
                         </div>
                      </div>
                      <div className="text-right border-t md:border-none border-muted/20 pt-4 md:pt-0">
                         <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground mb-0.5 tracking-widest">Durée Scellée</p>
                         <p className="text-lg md:text-3xl font-black text-primary tabular-nums">{course.duration}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            <div className="p-6 md:p-10 bg-muted/10 rounded-[2.5rem] md:rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-dashed border-muted-foreground/10">
               <div className="flex items-center gap-5">
                  <div className="size-10 md:size-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <ShieldCheck className="text-emerald-500 size-5 md:size-7" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[10px] md:text-lg font-black uppercase text-foreground">Planning Officiel Certifié</p>
                    <p className="text-[8px] md:text-xs font-bold text-muted-foreground uppercase opacity-60">ACADEX V1 • Scellage Temporel {activeYear}</p>
                  </div>
               </div>
               <Button className="w-full md:w-auto h-11 md:h-14 rounded-xl md:rounded-2xl font-black bg-foreground text-white px-8 md:px-12 shadow-xl active:scale-95 transition-all text-[10px] md:text-sm">
                  TÉLÉCHARGER PLANNING PDF
               </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
