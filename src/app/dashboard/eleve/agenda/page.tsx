"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, MapPin, User, BookOpen, ShieldCheck, History, Loader2, Star } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import Link from "next/link"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

export default function StudentAgendaPage() {
  const [selectedDay, setSelectedDay] = useState("Lundi")
  const [studentClass, setStudentClass] = useState("")
  const [activeYear, setActiveYear] = useState("")
  const [mounted, setMounted] = useState(false)
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const year = localStorage.getItem('acadex_active_year') || "2026-2027"
      const userId = localStorage.getItem('acadex_user_id') || ""
      setActiveYear(year)
      setMounted(true)

      // Charger la classe depuis Supabase (source de vérité)
      if (userId) {
        const { data } = await supabase
          .from('students')
          .select('class_id')
          .eq('matricule', userId)
          .single()
        if (data?.class_id) {
          setStudentClass(data.class_id)
        }
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!studentClass || !activeYear) return
    const fetchSchedules = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('class_id', studentClass)
        .eq('academic_year', activeYear)
      setSchedules(data || [])
      setLoading(false)
    }
    fetchSchedules()
  }, [studentClass, activeYear])

  const dayCourses = useMemo(() => {
    return schedules
      .filter(s => s.day === selectedDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [schedules, selectedDay])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-12 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-6xl font-black text-foreground tracking-tight uppercase leading-none">
              Mon <span className="text-primary italic">Planning</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[9px] md:text-sm uppercase tracking-widest">
              <Badge className="bg-primary text-white font-black px-3 py-1 rounded-full text-[8px] md:text-xs shadow-lg">
                {studentClass || "Classe non définie"}
              </Badge>
              <span>{activeYear}</span>
            </div>
          </div>
          <Badge className="bg-white border-2 border-primary/20 text-primary h-11 md:h-16 px-5 md:px-10 rounded-xl md:rounded-2xl flex items-center gap-2 font-black text-[9px] md:text-sm shadow-xl w-fit">
            <ShieldCheck className="size-4 animate-pulse" /> CERTIFIÉ ACADEX
          </Badge>
        </div>

        {/* Pas de classe définie */}
        {!studentClass && !loading && (
          <Card className="p-16 text-center border-4 border-dashed rounded-[2rem] opacity-40">
            <BookOpen className="size-10 mx-auto mb-4 text-muted-foreground" />
            <p className="font-black text-xs uppercase">Classe non définie</p>
            <p className="text-[9px] text-muted-foreground mt-1">Contactez la direction pour associer votre classe</p>
          </Card>
        )}

        {studentClass && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Sélecteur jour */}
            <div className="lg:col-span-3">
              <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[3rem] p-3 md:p-8 h-fit lg:sticky lg:top-24">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="size-8 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                    <Calendar className="size-4" />
                  </div>
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Jours</p>
                </div>
                <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar lg:overflow-visible">
                  {days.map(day => {
                    const count = schedules.filter(s => s.day === day).length
                    return (
                      <button key={day} onClick={() => setSelectedDay(day)}
                        className={cn("flex-1 lg:w-full text-left p-3 md:p-4 rounded-xl font-black text-[9px] md:text-sm transition-all border-2 whitespace-nowrap flex items-center justify-between gap-2",
                          selectedDay === day ? "bg-primary text-white border-primary shadow-lg" : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40")}>
                        <span>{day}</span>
                        {count > 0 && (
                          <Badge className={cn("text-[6px] font-black rounded-full px-1.5 border-none",
                            selectedDay === day ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                            {count}
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Cours du jour */}
            <div className="lg:col-span-9 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl md:text-3xl font-black uppercase">
                  Programme du <span className="text-primary italic">{selectedDay}</span>
                </h2>
                <Badge variant="outline" className="border-primary/20 text-primary font-black text-[8px]">
                  {dayCourses.length} cours
                </Badge>
              </div>

              {loading ? (
                <Card className="p-16 text-center border-none shadow-sm bg-white rounded-[2rem]">
                  <Loader2 className="animate-spin text-primary size-8 mx-auto" />
                </Card>
              ) : dayCourses.length === 0 ? (
                <Card className="p-16 md:p-24 text-center border-4 border-dashed rounded-[2rem] bg-white/50 opacity-40 space-y-4">
                  <BookOpen className="size-10 md:size-16 mx-auto text-muted-foreground" />
                  <h3 className="text-xl font-black uppercase">Temps Libre</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Aucun cours ce jour</p>
                </Card>
              ) : dayCourses.map((course, i) => (
                <Card key={i} className="border-none shadow-sm bg-white rounded-xl md:rounded-[3rem] overflow-hidden group hover:shadow-xl transition-all">
                  <div className="p-4 md:p-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 md:gap-10 min-w-0">
                      <div className="size-14 md:size-24 bg-muted rounded-xl md:rounded-[2.5rem] flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        <Clock className="size-4 md:size-8" />
                        <span className="text-[7px] md:text-sm font-black mt-0.5">{course.start_time?.split(':')[0]}H</span>
                      </div>
                      <div className="min-w-0 space-y-1 md:space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary border-none font-black text-[7px] md:text-[9px] rounded-full">SÉANCE</Badge>
                          {i === 0 && <Badge className="bg-amber-400 text-black border-none font-black text-[7px] md:text-[9px] rounded-full animate-pulse">EN COURS</Badge>}
                        </div>
                        <h3 className="text-base md:text-3xl font-black uppercase truncate group-hover:text-primary transition-colors">
                          {course.subject}
                        </h3>
                        <div className="flex flex-wrap gap-2 md:gap-6 text-[7px] md:text-xs font-bold text-muted-foreground uppercase">
                          <span className="flex items-center gap-1"><MapPin className="size-2.5 md:size-3.5 text-primary" /> {course.room || "---"}</span>
                          <span className="flex items-center gap-1"><User className="size-2.5 md:size-3.5 text-primary" /> {course.teacher_name || "---"}</span>
                          <span className="text-primary">{course.start_time} → {course.end_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Vue semaine résumée */}
              {schedules.length > 0 && (
                <Card className="border-none shadow-sm bg-white rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
                  <div className="p-4 md:p-6 border-b bg-muted/5">
                    <h3 className="font-black text-sm md:text-base uppercase">Résumé de la semaine</h3>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-muted/10">
                    {days.map(day => {
                      const count = schedules.filter(s => s.day === day).length
                      return (
                        <button key={day} onClick={() => setSelectedDay(day)}
                          className={cn("p-3 text-center transition-all", selectedDay === day && "bg-primary/5")}>
                          <p className={cn("text-[7px] font-black uppercase", selectedDay === day ? "text-primary" : "text-muted-foreground")}>{day.slice(0,3)}</p>
                          <p className={cn("text-lg font-black", count > 0 ? "text-primary" : "text-muted-foreground/30")}>{count}</p>
                          <p className="text-[6px] text-muted-foreground">cours</p>
                        </button>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Footer IA */}
        <Card className="p-6 md:p-14 bg-foreground text-white rounded-2xl md:rounded-[4rem] shadow-2xl relative overflow-hidden border-none">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-14 relative z-10">
            <div className="size-14 md:size-28 bg-primary/20 rounded-2xl md:rounded-[3rem] flex items-center justify-center">
              <Star className="size-7 md:size-14 text-primary fill-primary animate-pulse" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <h3 className="text-xl md:text-4xl font-black uppercase">Conseils <span className="text-primary italic">Personnalisés</span></h3>
              <p className="text-[10px] md:text-base text-white/60 italic">
                "Votre emploi du temps est certifié ACADEX. Consultez l'assistant IA pour optimiser votre organisation."
              </p>
              <Button asChild className="bg-primary h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm">
                <Link href="/assistant">Demander conseil IA</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}