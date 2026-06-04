
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  BookOpen,
  Zap,
  Star
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

const events = [
  { id: 1, title: "Examen Blanc - Physique", time: "08:00 - 12:00", type: "Examen", room: "Amphi A", teacher: "M. Dossou", color: "bg-destructive" },
  { id: 2, title: "Réunion Parents-Professeurs", time: "15:00 - 18:00", type: "Réunion", room: "Salle des Fêtes", teacher: "Direction", color: "bg-primary" },
  { id: 3, title: "Conférence IA & Éducation", time: "10:30 - 12:00", type: "Événement", room: "Médiathèque", teacher: "Dr. Mensah", color: "bg-foreground" },
  { id: 4, title: "Interrogation - Mathématiques", time: "14:00 - 15:30", type: "Devoir", room: "Salle 12", teacher: "Mme. Amoussou", color: "bg-amber-500" },
]

export default function AgendaPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Agenda Académique</h1>
            <p className="text-muted-foreground mt-2 font-medium">Planification des examens, réunions et événements.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6">
              Vue Semaine
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
              <Plus className="mr-2 size-5" />
              Nouvel Événement
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Calendar Side */}
          <Card className="lg:col-span-5 border-none shadow-sm bg-white rounded-[2.5rem] p-8">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-3xl border-none p-0 w-full"
              classNames={{
                months: "w-full",
                month: "w-full space-y-8",
                caption: "flex justify-between pt-1 relative items-center mb-8",
                caption_label: "text-xl font-black text-foreground",
                nav: "flex items-center gap-2",
                nav_button: "size-10 flex items-center justify-center rounded-2xl bg-muted/50 hover:bg-primary hover:text-white transition-all",
                table: "w-full border-collapse",
                head_row: "flex justify-between mb-4",
                head_cell: "text-muted-foreground font-black text-xs uppercase tracking-widest w-full text-center",
                row: "flex justify-between w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-full",
                day: "size-12 p-0 font-bold aria-selected:opacity-100 hover:bg-muted rounded-2xl transition-all mx-auto flex items-center justify-center",
                day_selected: "bg-primary text-white hover:bg-primary/90 hover:text-white focus:bg-primary focus:text-white shadow-lg shadow-primary/20",
                day_today: "bg-muted/50 text-primary border-2 border-primary/20",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
              }}
            />
            <div className="mt-12 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground border-b pb-2">Rappels Rapides</h3>
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <Zap className="size-6 text-primary fill-primary/20" />
                <p className="text-xs font-bold text-foreground">3 Examens programmés cette semaine.</p>
              </div>
              <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <Star className="size-6 text-amber-500 fill-amber-200" />
                <p className="text-xs font-bold text-foreground">Conseil de classe du 1er trimestre demain.</p>
              </div>
            </div>
          </Card>

          {/* Events Side */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-foreground">
                Événements du {date?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </h2>
              <Badge className="bg-primary px-4 py-1 rounded-full font-black">
                {events.length} ÉVÉNEMENTS
              </Badge>
            </div>
            
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div className={`h-2 w-full ${event.color}`} />
                  <CardContent className="p-7">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`font-black rounded-full text-[10px] uppercase border-none ${event.color.replace('bg-', 'text-')} ${event.color.replace('bg-', 'bg-')}/10`}>
                            {event.type}
                          </Badge>
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {event.time}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="size-3" /> {event.room}</span>
                          <span className="flex items-center gap-1"><User className="size-3" /> {event.teacher}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" className="rounded-xl font-bold h-11 hover:bg-muted">Modifier</Button>
                        <Button className="bg-foreground text-white rounded-xl font-bold h-11 px-6">Détails</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {events.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center p-12 text-center border-4 border-dashed rounded-[2.5rem] bg-muted/20">
                <CalendarIcon className="size-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold">Aucun événement prévu</h3>
                <p className="text-sm text-muted-foreground">Profitez de cette journée pour planifier la suite.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
