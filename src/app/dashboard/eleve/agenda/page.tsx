"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, MapPin, User, BookOpen, ShieldCheck, History, Timer, Star, Loader2 } from "lucide-react"
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
  const [allSchedules, setAllSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    if (!studentClass || !activeYear) return
    const fetchSchedules = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('class_id', studentClass)
        .eq('academic_year', activeYear)
      setAllSchedules(data || [])
      setLoading(false)
    }
    fetchSchedules()
  }, [studentClass, activeYear])

  const dayCourses = useMemo(() => {
    if (!allSchedules) return []
    return allSchedules
      .filter((s: any) => s.day === selectedDay)
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
  }, [allSchedules, selectedDay])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-12 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-6xl font-black text-foreground tracking-tight uppercase leading-none">
              Mon <span className="text-primary italic">Planning</span>
            </h1>
            <div className="text-muted-foreground font-bold flex items-center gap-2 text-[9px] md:text-sm uppercase tracking-widest">
              <Badge className="bg-primary text-white font-black px-3 py-1 rounded-full uppercase shadow-lg text-[8px] md:text-xs">{studentClass || "N/A"}</Badge>
              <span>{activeYear}</span>
            </div>
          </div>
          <Badge className="bg-white border-2 border-primary/20 text-primary h-11 md:h-20 px-5 md:px-12 rounded-xl md:rounded-[3rem] flex items-center gap-2 md:gap-5 font-black text-[9px] md:text-2xl shadow-xl shadow-primary/10 w-fit">
             <ShieldCheck className="size-4 md:size-10 animate-pulse" /> CERTIFIÉ
          </Badge>
        </div>

        <div className="grid gap-6 md:gap-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[4rem] p-3 md:p-10 h-fit lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-4 md:mb-10 px-2">
                 <div className="size-8 md:size-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary shadow-inner">
                    <Calendar className="size-4 md:size-6" />
                 </div>
                 <h3 className="text-[9px] md:text-xs font-black uppercase text-muted-foreground tracking-[0.25em]">SÉLECTEUR</h3>
              </div>
              <div className="flex lg:flex-col gap-2 md:gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 lg:pb-0 snap-x snap-proximity">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "flex-1 md:w-full text-center lg:text-left p-3 md:p-8 rounded-xl md:rounded-[2.5rem] font-black text-[10px] md:text-2xl transition-all border-2 whitespace-nowrap min-w-[90px] md:min-w-0 snap-start active:scale-95",
                      selectedDay === day 
                        ? "bg-primary text-white border-primary shadow-xl scale-[1.05]" 
                        : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-9 space-y-6 md:space-y-10">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl md:text-5xl font-black text-foreground uppercase tracking-tight">Programme du <span className="text-primary italic">{selectedDay}</span></h2>
              <div className="hidden sm:flex items-center gap-3 text-muted-foreground font-black text-[10px] md:text-sm uppercase tracking-widest">
                 <History className="size-4 text-emerald-500 animate-pulse" /> LIVE
              </div>
            </div>

            <div className="grid gap-3 md:gap-10">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl md:rounded-[4rem] animate-pulse border-4 border-dashed border-muted/50">
                  <Loader2 className="size-10 md:size-20 text-primary animate-spin mb-6" />
                  <p className="font-black text-muted-foreground uppercase text-[8px] md:text-lg">Interconnexion...</p>
                </div>
              ) : dayCourses.length === 0 ? (
                <div className="h-64 md:h-[600px] flex flex-col items-center justify-center p-10 text-center border-4 border-dashed rounded-2xl md:rounded-[5rem] bg-white/50 opacity-40 space-y-6">
                  <div className="size-16 md:size-40 bg-muted rounded-full flex items-center justify-center shadow-inner">
                    <BookOpen className="size-8 md:size-20 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-5xl font-black uppercase tracking-tight">Temps Libre</h3>
                    <p className="font-bold text-muted-foreground text-[10px] md:text-2xl uppercase tracking-widest">Aucune séance scellée.</p>
                  </div>
                </div>
              ) : (
                dayCourses.map((course: any, i: number) => (
                  <Card key={i} className="border-none shadow-sm bg-white rounded-xl md:rounded-[5rem] overflow-hidden group hover:shadow-2xl transition-all duration-700 relative">
                    <div className="p-3 md:p-14 flex flex-row items-center justify-between gap-3 md:gap-12 relative z-10">
                      <div className="flex items-center gap-3 md:gap-14 min-w-0">
                         <div className="size-12 md:size-32 bg-muted rounded-lg md:rounded-[3rem] flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0 shadow-inner group-hover:shadow-primary/20">
                            <Clock className="size-4 md:size-10" />
                            <span className="text-[7px] md:text-2xl font-black uppercase tracking-tighter mt-0.5 md:mt-3">{course.start_time?.split(':')[0]}H</span>
                         </div>
                         <div className="space-y-0.5 md:space-y-3 truncate">
                           <div className="flex items-center gap-2 md:gap-4 mb-0.5">
                              <Badge className="bg-primary/10 text-primary border-none font-black px-2 md:px-5 py-0.5 rounded-full text-[6px] md:text-sm uppercase tracking-widest shadow-none">SÉANCE</Badge>
                              {i === 0 && <Badge className="bg-amber-400 text-black border-none font-black px-2 md:px-4 py-0.5 rounded-full text-[6px] md:text-xs animate-pulse shadow-none">EN COURS</Badge>}
                           </div>
                           <h3 className="text-[11px] md:text-6xl font-black text-foreground uppercase group-hover:text-primary transition-colors truncate tracking-tighter">{course.subject}</h3>
                           <div className="flex flex-wrap gap-2 md:gap-10 text-[6px] md:text-lg font-bold text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-1 md:gap-3"><MapPin className="size-2.5 md:size-6 text-primary" /> {course.room || '---'}</span>
                              <span className="flex items-center gap-1 md:gap-3"><User className="size-2.5 md:size-6 text-primary" /> {course.teacher_name?.split(' ')[0]}</span>
                           </div>
                         </div>
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-[5px] md:text-[12px] font-black uppercase text-muted-foreground mb-0.5 md:mb-2 tracking-[0.3em]">Durée</p>
                         <p className="text-[10px] md:text-5xl font-black text-primary tabular-nums">{course.duration}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <Card className="p-6 md:p-20 bg-foreground text-white rounded-2xl md:rounded-[5rem] shadow-2xl relative overflow-hidden group border-none">
           <div className="flex flex-col md:flex-row items-center gap-6 md:gap-20 relative z-10">
              <div className="size-16 md:size-40 bg-primary/20 rounded-2xl md:rounded-[3.5rem] flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                 <Star className="size-8 md:size-20 text-primary animate-pulse fill-primary" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-4 md:space-y-8">
                 <h3 className="text-xl md:text-6xl font-black uppercase tracking-tight leading-none">Intelligence <span className="text-primary italic">Plannings</span></h3>
                 <p className="text-[10px] md:text-2xl text-white/60 font-medium leading-relaxed italic max-w-3xl">
                    "Votre emploi du temps est scellé. Toute modification sera signalée par notification."
                 </p>
                 <Button asChild className="bg-primary hover:bg-primary/90 h-11 md:h-20 px-6 md:px-16 rounded-xl md:rounded-[2.5rem] font-black text-[10px] md:text-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all w-full md:w-auto">
                    <Link href="/assistant">Aménagement IA</Link>
                 </Button>
              </div>
           </div>
           <History className="absolute -bottom-20 -right-20 size-40 md:size-[500px] text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[5000ms]" />
        </Card>
      </div>
    </DashboardLayout>
  )
}
