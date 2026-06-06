
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Zap } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
const schedule = [
  { day: "Lundi", courses: [{ h: "08h-10h", s: "Mathématiques", r: "Salle 12", t: "M. Dossou" }, { h: "10h-12h", s: "Français", r: "Salle 05", t: "Mme Amoussou" }] },
  { day: "Mardi", courses: [{ h: "08h-10h", s: "Anglais", r: "Labo Langues", t: "M. Smith" }, { h: "10h-12h", s: "PCT", r: "Salle 12", t: "M. Koffi" }] },
  { day: "Mercredi", courses: [{ h: "08h-12h", s: "Éducation Physique", r: "Terrain", t: "M. Bio" }] },
  { day: "Jeudi", courses: [{ h: "08h-10h", s: "SVT", r: "Salle 08", t: "Dr. Mensah" }, { h: "14h-16h", s: "Histoire-Géo", r: "Salle 12", t: "Mme Houede" }] },
  { day: "Vendredi", courses: [{ h: "10h-12h", s: "Philosophie", r: "Salle A", t: "M. Kodjo" }] },
]

export default function StudentAgendaPage() {
  const [selectedDay, setSelectedDay] = useState("Lundi")

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Mon <span className="text-primary italic">Emploi du Temps</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Organisation hebdomadaire de tes cours.</p>
          </div>
          <div className="flex gap-2">
             <Badge className="bg-amber-100 text-amber-700 border-none font-bold px-4 py-2">
               <Zap className="size-3 mr-2 fill-amber-700" /> 2 Évaluations prévues cette semaine
             </Badge>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Menu des jours */}
          <Card className="lg:col-span-3 border-none shadow-sm bg-white rounded-[2.5rem] p-6 h-fit">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-6 px-4">Jours de la semaine</h3>
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
                Session {schedule.find(s => s.day === selectedDay)?.courses.length || 0}
              </Badge>
            </div>

            <div className="grid gap-6">
              {schedule.find(s => s.day === selectedDay)?.courses.map((course, i) => (
                <Card key={i} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                       <div className="size-20 bg-muted rounded-[2rem] flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <Clock className="size-6 mb-1" />
                          <span className="text-[10px] font-black uppercase">{course.h}</span>
                       </div>
                       <div className="space-y-2">
                         <h3 className="text-2xl font-black text-foreground">{course.s}</h3>
                         <div className="flex flex-wrap gap-6 text-xs font-bold text-muted-foreground">
                            <span className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> {course.r}</span>
                            <span className="flex items-center gap-2"><User className="size-4 text-primary" /> {course.t}</span>
                         </div>
                       </div>
                    </div>
                    <Button variant="ghost" className="rounded-xl font-bold group-hover:bg-primary/5 group-hover:text-primary">Détails cours</Button>
                  </div>
                </Card>
              )) || (
                <div className="h-64 flex flex-col items-center justify-center p-12 text-center border-4 border-dashed rounded-[3rem] bg-muted/20 opacity-40">
                  <Calendar className="size-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-black">Aucun cours</h3>
                  <p className="font-medium">Profite de ce temps libre pour tes devoirs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
