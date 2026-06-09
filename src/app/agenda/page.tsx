
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
  Star,
  Layers,
  FileDown,
  ShieldCheck,
  Search,
  Filter,
  Users,
  Grid3X3,
  Loader2,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, onSnapshot, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

const OFFICIAL_CLASSES = [
  "6EME A", "6EME B", "5EME A", "5EME B", "4EME A", "4EME B", "3EME D1", "3EME D2",
  "2NDE A", "2NDE B", "2NDE C", "2NDE D",
  "1ERE A", "1ERE B", "1ERE C", "1ERE D",
  "TLE A", "TLE B", "TLE C", "TLE D"
]

export default function GlobalSchedulePage() {
  const db = useFirestore()
  const [activeYear, setActiveYear] = useState("")
  const [selectedDay, setSelectedDay] = useState("Lundi")
  const [activeTab, setActiveTab] = useState("classe")
  const [selectedClass, setSelectedClass] = useState("6EME A")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  const schedulesQuery = useMemo(() => {
    if (!db || !activeYear) return null
    return query(collection(db, "schedules"), where("academicYear", "==", activeYear))
  }, [db, activeYear])

  const teachersQuery = useMemo(() => query(collection(db, "teachers")), [db])

  const { data: allSchedules, loading: loadingSchedules } = useCollection(schedulesQuery)
  const { data: teachers } = useCollection(teachersQuery)

  const filteredSchedules = useMemo(() => {
    if (!allSchedules) return []
    if (activeTab === "classe") {
      return allSchedules.filter((s: any) => s.classId === selectedClass).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
    }
    if (activeTab === "professeur") {
      return allSchedules.filter((s: any) => s.teacherId === selectedTeacher).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
    }
    return allSchedules
  }, [allSchedules, activeTab, selectedClass, selectedTeacher])

  const detectConflicts = useMemo(() => {
    if (!allSchedules) return []
    const conflicts: any[] = []
    const sorted = [...allSchedules].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
    
    sorted.forEach((s1, i) => {
      sorted.slice(i + 1).forEach(s2 => {
        if (s1.day === s2.day && s1.teacherId === s2.teacherId) {
          if (s1.startTime < s2.endTime && s1.endTime > s2.startTime) {
            conflicts.push({ t1: s1, t2: s2, type: 'Enseignant' })
          }
        }
        if (s1.day === s2.day && s1.classId === s2.classId) {
          if (s1.startTime < s2.endTime && s1.endTime > s2.startTime) {
            conflicts.push({ t1: s1, t2: s2, type: 'Classe' })
          }
        }
      })
    })
    return conflicts
  }, [allSchedules])

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">
              Pilotage <span className="text-primary italic">Emplois du Temps</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <Layers className="size-3.5 md:size-4 text-primary" />
              <span>Tableau Centralisé • Année {activeYear}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-11 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl border-2 font-black bg-white text-[10px] md:text-sm transition-all active:scale-95">
              <FileDown className="mr-2 size-4 md:size-5" /> Imprimer Tout
            </Button>
            <Badge className="bg-primary text-white h-11 md:h-14 px-6 md:px-8 rounded-xl md:rounded-[1.8rem] flex items-center justify-center font-black text-[10px] md:text-lg shadow-xl shadow-primary/20">
               <ShieldCheck className="size-4 md:size-6 mr-2" /> AUDIT LIVE
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-[1.8rem] md:rounded-[2.5rem] h-13 md:h-20 p-1.5 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "classe", label: "Par Classe", icon: BookOpen },
              { id: "professeur", label: "Par Enseignant", icon: User },
              { id: "global", label: "Tableau Global", icon: Grid3X3 },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-xl md:rounded-[2rem] font-black px-6 md:px-10 text-[9px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2 shrink-0">
                <t.icon className="size-3.5 md:size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Filtres contextuels */}
          <Card className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col md:flex-row items-center gap-6">
             <div className="flex-1 w-full space-y-2">
                <Label className="font-black text-[9px] uppercase text-muted-foreground px-1">Navigation Semaine</Label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                   {days.map(d => (
                     <button 
                       key={d} 
                       onClick={() => setSelectedDay(d)}
                       className={cn(
                         "px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap border-2",
                         selectedDay === d ? "bg-primary text-white border-primary shadow-lg" : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                       )}
                     >
                       {d}
                     </button>
                   ))}
                </div>
             </div>
             
             {activeTab === 'classe' && (
                <div className="w-full md:w-72 space-y-2">
                   <Label className="font-black text-[9px] uppercase text-muted-foreground px-1">Sélectionner une classe</Label>
                   <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="h-12 md:h-14 rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-2 p-1.5">
                         {OFFICIAL_CLASSES.map(c => <SelectItem key={c} value={c} className="font-bold p-3 rounded-xl">{c}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
             )}

             {activeTab === 'professeur' && (
                <div className="w-full md:w-72 space-y-2">
                   <Label className="font-black text-[9px] uppercase text-muted-foreground px-1">Sélectionner un professeur</Label>
                   <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                      <SelectTrigger className="h-12 md:h-14 rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue placeholder="Choisir prof..." /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-2 p-1.5">
                         {teachers?.map((t:any) => <SelectItem key={t.id} value={t.officialId} className="font-bold p-3 rounded-xl">{t.fullName}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
             )}
          </Card>

          <TabsContent value="classe" className="space-y-6 md:space-y-10 animate-in slide-in-from-right-4">
             <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
                <div className="lg:col-span-8">
                   <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[4rem] overflow-hidden min-h-[500px]">
                      <div className="p-8 md:p-12 border-b bg-muted/5 flex items-center justify-between">
                         <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight">Planning {selectedClass}</h3>
                         <Badge className="bg-primary/10 text-primary border-none font-black px-4 h-10 rounded-full">{selectedDay.toUpperCase()}</Badge>
                      </div>
                      <div className="p-8 md:p-14">
                         {loadingSchedules ? (
                           <div className="py-20 text-center animate-pulse"><Loader2 className="animate-spin mx-auto text-primary/10 size-12" /></div>
                         ) : filteredSchedules.filter((s:any) => s.day === selectedDay).length === 0 ? (
                           <div className="py-20 text-center space-y-6 opacity-30">
                             <CalendarIcon className="size-16 mx-auto" />
                             <p className="font-black text-sm md:text-xl uppercase tracking-widest">Aucun cours ce jour</p>
                           </div>
                         ) : (
                           <div className="space-y-6">
                              {filteredSchedules.filter((s:any) => s.day === selectedDay).map((course: any) => (
                                <div key={course.id} className="p-6 md:p-10 bg-muted/10 rounded-[2rem] md:rounded-[3rem] border border-muted/30 flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-white hover:shadow-xl transition-all">
                                   <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-left">
                                      <div className="size-16 md:size-24 bg-white rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                         <span className="text-[10px] md:text-sm font-black text-muted-foreground group-hover:text-white/40 uppercase">Début</span>
                                         <span className="text-xl md:text-3xl font-black tabular-nums">{course.startTime}</span>
                                      </div>
                                      <div className="space-y-1">
                                         <h4 className="text-2xl md:text-4xl font-black text-foreground group-hover:text-primary transition-colors tracking-tight uppercase">{course.subject}</h4>
                                         <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                            <span className="flex items-center gap-2"><User className="size-3 md:size-4 text-primary" /> {course.teacherName}</span>
                                            <span className="flex items-center gap-2"><MapPin className="size-3 md:size-4 text-primary" /> {course.room}</span>
                                            <span className="flex items-center gap-2"><Clock className="size-3 md:size-4 text-primary" /> {course.duration}</span>
                                         </div>
                                      </div>
                                   </div>
                                   <Badge variant="outline" className="rounded-xl font-black px-6 h-10 border-2 border-primary/20 text-primary text-[10px] md:text-sm uppercase">SÉANCE SCELLÉE</Badge>
                                </div>
                              ))}
                           </div>
                         )}
                      </div>
                   </Card>
                </div>

                <div className="lg:col-span-4 space-y-6 md:space-y-10">
                   <Card className="p-8 md:p-14 bg-foreground text-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-none">
                      <div className="relative z-10 space-y-8">
                         <div className="flex items-center gap-4">
                            <div className="size-12 md:size-16 bg-primary/20 rounded-2xl flex items-center justify-center shadow-inner"><Sparkles className="size-6 md:size-8 text-primary animate-pulse" /></div>
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Audit IA Brain</h3>
                         </div>
                         <div className="p-5 md:p-8 bg-white/5 rounded-2xl md:rounded-[2rem] border border-white/10 italic text-[10px] md:text-lg font-medium leading-relaxed text-white/80">
                           {detectConflicts.length > 0 
                             ? `"Attention : ${detectConflicts.length} conflits horaires détectés dans la planification actuelle. Cliquez pour auditer."` 
                             : `"Analyse : Le planning de la classe ${selectedClass} est équilibré. Aucun créneau vide détecté sur le tronc commun."`}
                         </div>
                         <Button className="w-full h-12 md:h-16 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] md:text-sm transition-all shadow-xl shadow-primary/20 active:scale-95">Lancer Diagnostic Global</Button>
                      </div>
                      <Zap className="absolute -bottom-10 -right-10 size-40 md:size-64 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[3000ms]" />
                   </Card>

                   {detectConflicts.length > 0 && (
                      <Card className="p-7 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-red-50 border-2 border-red-100 flex flex-col gap-6 group">
                         <div className="flex items-center gap-4 text-red-700">
                            <div className="size-10 md:size-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform"><AlertTriangle className="size-5 md:size-7" /></div>
                            <h4 className="font-black text-[10px] md:text-sm uppercase tracking-[0.2em]">Conflits Critique</h4>
                         </div>
                         <div className="space-y-3">
                            {detectConflicts.slice(0, 3).map((c, i) => (
                              <div key={i} className="text-[10px] md:text-sm font-bold text-red-800 leading-tight border-l-4 border-red-300 pl-4 py-1">
                                {c.type === 'Enseignant' 
                                  ? `${c.t1.teacherName} a deux cours en même temps en ${c.t1.classId} et ${c.t2.classId}.` 
                                  : `La salle/classe ${c.t1.classId} est occupée par deux professeurs simultanément.`}
                              </div>
                            ))}
                         </div>
                      </Card>
                   )}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="global" className="animate-in zoom-in-95">
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[5rem] overflow-hidden">
                <div className="p-8 md:p-20 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-10">
                   <div className="space-y-2">
                      <h3 className="text-2xl md:text-5xl font-black tracking-tighter uppercase">Matrice <span className="text-primary italic">Omni-Vision</span></h3>
                      <p className="text-[10px] md:text-lg font-medium text-muted-foreground uppercase tracking-widest italic">Interconnexion totale des flux horaires</p>
                   </div>
                   <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-[2rem] border-2 border-primary/10">
                      <div className="size-12 md:size-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg"><Grid3X3 className="size-6 md:size-8" /></div>
                      <div className="text-[10px] md:text-xl font-black uppercase text-primary leading-tight">Tableau <br />Général</div>
                   </div>
                </div>
                
                <div className="overflow-x-auto p-4 md:p-14">
                   <table className="w-full border-separate border-spacing-2">
                      <thead>
                         <tr>
                            <th className="p-6 md:p-10 bg-muted/30 rounded-3xl text-[9px] md:text-xs font-black uppercase text-muted-foreground tracking-widest">Heure \ Classe</th>
                            {OFFICIAL_CLASSES.slice(0, 6).map(c => (
                              <th key={c} className="p-6 md:p-10 bg-primary/5 rounded-3xl text-[10px] md:text-lg font-black uppercase text-primary border-2 border-primary/10">{c}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody>
                         {timeSlots.map(time => (
                           <tr key={time}>
                              <td className="p-6 md:p-10 bg-muted/20 rounded-3xl text-center font-black text-xs md:text-2xl tabular-nums">{time}</td>
                              {OFFICIAL_CLASSES.slice(0, 6).map(cls => {
                                const course = allSchedules?.find((s:any) => s.day === selectedDay && s.classId === cls && s.startTime <= time && s.endTime > time)
                                return (
                                  <td key={`${cls}-${time}`} className={cn(
                                    "p-4 md:p-8 rounded-3xl transition-all border-2",
                                    course ? "bg-white border-primary/20 shadow-xl scale-[1.02]" : "bg-[#F8FAFC]/50 border-transparent opacity-20"
                                  )}>
                                     {course ? (
                                       <div className="text-center space-y-1 md:space-y-3">
                                          <p className="text-[9px] md:text-xl font-black text-foreground uppercase tracking-tight truncate">{course.subject}</p>
                                          <div className="h-0.5 w-10 bg-primary/20 mx-auto" />
                                          <p className="text-[7px] md:text-xs font-bold text-muted-foreground uppercase truncate">{course.teacherName.split(' ')[0]}</p>
                                       </div>
                                     ) : (
                                       <div className="flex items-center justify-center"><Plus className="size-3 md:size-6 text-muted-foreground/10" /></div>
                                     )}
                                  </td>
                                )
                              })}
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                
                <div className="p-8 md:p-14 bg-muted/5 border-t flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="flex items-center gap-5">
                      <div className="size-12 md:size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                         <ShieldCheck className="size-6 md:size-8 text-emerald-500" />
                      </div>
                      <p className="text-[9px] md:text-sm font-medium text-muted-foreground max-w-xl italic">
                        "La matrice omni-vision garantit qu'aucun élève n'est laissé sans surveillance et qu'aucune salle n'est surchargée. Audit en temps réel basé sur les scellements professeurs."
                      </p>
                   </div>
                   <Button className="w-full md:w-auto h-12 md:h-18 rounded-xl md:rounded-[1.5rem] font-black bg-foreground text-white px-10 md:px-16 shadow-2xl active:scale-95 transition-all text-xs md:text-lg">
                      TÉLÉCHARGER MATRICE COMPLÈTE
                   </Button>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
