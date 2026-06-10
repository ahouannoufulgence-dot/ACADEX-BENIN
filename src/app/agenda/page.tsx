
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  BookOpen,
  Zap,
  Star,
  Layers,
  FileDown,
  ShieldCheck,
  Grid3X3,
  Loader2,
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  ChevronRight,
  ArrowRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { askAcadexBrain } from "@/ai/flows/acadex-brain"
import { toast } from "@/hooks/use-toast"

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
  const [activeTab, setActiveTab] = useState("global")
  const [selectedClass, setSelectedClass] = useState("6EME A")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [aiReport, setAiReport] = useState<string | null>(null)

  useEffect(() => {
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  const schedulesQuery = useMemo(() => {
    if (!db || !activeYear) return null
    return query(collection(db, "schedules"), where("academicYear", "==", activeYear))
  }, [db, activeYear])

  const teachersQuery = useMemo(() => query(collection(db, "teachers"), orderBy("fullName", "asc")), [db])

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

  const handleAiAudit = async () => {
    setAnalyzing(true)
    try {
      const res = await askAcadexBrain({
        question: `Analyse l'emploi du temps de l'établissement pour ${activeYear}. Détecte les classes qui n'ont pas de cours le ${selectedDay}, les surcharges profs ou les trous horaires.`,
        userRole: "Directeur",
        userId: "DIR-001",
        contextData: { 
          schoolName: "ACADEX", 
          year: activeYear, 
          day: selectedDay,
          schedulesCount: allSchedules?.length 
        }
      })
      setAiReport(res.answer)
      toast({ title: "Audit IA Terminé" })
    } catch (e) {
      toast({ title: "Erreur IA", variant: "destructive" })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase">
              Emploi du temps <span className="text-primary italic">Établissement</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <Layers className="size-3.5 text-primary" />
              <span>Vision Centralisée • Année {activeYear}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-11 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl border-2 font-black bg-white text-[10px] md:text-sm transition-all active:scale-95">
              <FileDown className="mr-2 size-4" /> Exporter PDF
            </Button>
            <Badge className="bg-primary text-white h-11 md:h-14 px-6 md:px-10 rounded-xl md:rounded-[1.8rem] flex items-center gap-3 font-black text-[10px] md:text-lg shadow-xl shadow-primary/20">
               <ShieldCheck className="size-4 md:size-6" /> SYSTÈME RELIÉ
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-[1.8rem] md:rounded-[2.5rem] h-13 md:h-20 p-1.5 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "global", label: "Matrice École", icon: Grid3X3 },
              { id: "classe", label: "Par Classe", icon: BookOpen },
              { id: "professeur", label: "Par Enseignant", icon: User },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-xl md:rounded-[2rem] font-black px-6 md:px-10 text-[9px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2 shrink-0">
                <t.icon className="size-3.5 md:size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Card className="p-4 md:p-10 rounded-[1.8rem] md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col md:flex-row items-center gap-6">
             <div className="flex-1 w-full space-y-2">
                <Label className="font-black text-[9px] uppercase text-muted-foreground px-1">Jour de la Semaine</Label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                   {days.map(d => (
                     <button 
                       key={d} 
                       onClick={() => setSelectedDay(d)}
                       className={cn(
                         "px-5 py-2.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase transition-all whitespace-nowrap border-2",
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
                   <Label className="font-black text-[9px] uppercase text-muted-foreground px-1">Choisir Classe</Label>
                   <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="h-12 md:h-14 rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-2 p-1.5">
                         {OFFICIAL_CLASSES.map(c => <SelectItem key={c} value={c} className="font-bold p-3 rounded-xl cursor-pointer">{c}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
             )}

             {activeTab === 'professeur' && (
                <div className="w-full md:w-72 space-y-2">
                   <Label className="font-black text-[9px] uppercase text-muted-foreground px-1">Choisir Enseignant</Label>
                   <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                      <SelectTrigger className="h-12 md:h-14 rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue placeholder="Choisir un professeur" /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-2 p-1.5">
                         {teachers?.map((t:any) => <SelectItem key={t.id} value={t.officialId} className="font-bold p-3 rounded-xl cursor-pointer">{t.fullName}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
             )}
          </Card>

          <TabsContent value="global" className="animate-in zoom-in-95">
             <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden">
                <div className="p-6 md:p-14 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10">
                   <div className="space-y-1">
                      <h3 className="text-xl md:text-4xl font-black tracking-tight uppercase">Matrice <span className="text-primary italic">Omni-Vision</span></h3>
                      <p className="text-[7px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Interconnexion totale des flux horaires</p>
                   </div>
                   <div className="flex items-center gap-4 bg-primary/5 p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 border-primary/10 w-fit">
                      <div className="size-8 md:size-14 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg"><Grid3X3 className="size-4 md:size-7" /></div>
                      <div className="text-[8px] md:text-lg font-black uppercase text-primary leading-tight">Tableau <br />Général</div>
                   </div>
                </div>
                
                <div className="overflow-x-auto p-2 md:p-10 no-scrollbar">
                   <table className="w-full border-separate border-spacing-1 md:border-spacing-2">
                      <thead>
                         <tr>
                            <th className="p-2 md:p-8 bg-muted/30 rounded-lg md:rounded-2xl text-[7px] md:text-xs font-black uppercase text-muted-foreground tracking-widest">Heure \ Classe</th>
                            {OFFICIAL_CLASSES.map(c => (
                              <th key={c} className="p-2 md:p-8 bg-primary/5 rounded-lg md:rounded-2xl text-[8px] md:text-lg font-black uppercase text-primary border-2 border-primary/10 min-w-[100px] md:min-w-[140px]">{c}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody>
                         {timeSlots.map(time => (
                           <tr key={time}>
                              <td className="p-2 md:p-8 bg-muted/20 rounded-lg md:rounded-2xl text-center font-black text-[9px] md:text-2xl tabular-nums">{time}</td>
                              {OFFICIAL_CLASSES.map(cls => {
                                const course = allSchedules?.find((s:any) => s.day === selectedDay && s.classId === cls && s.startTime <= time && s.endTime > time)
                                return (
                                  <td key={`${cls}-${time}`} className={cn(
                                    "p-1.5 md:p-6 rounded-lg md:rounded-2xl transition-all border-2 h-16 md:h-24",
                                    course ? "bg-white border-primary/20 shadow-xl scale-[1.02]" : "bg-[#F8FAFC]/50 border-transparent opacity-20"
                                  )}>
                                     {course ? (
                                       <div className="text-center space-y-0.5 md:space-y-2">
                                          <p className="text-[7px] md:text-lg font-black text-foreground uppercase tracking-tight truncate">{course.subject}</p>
                                          <p className="text-[5px] md:text-xs font-bold text-muted-foreground uppercase truncate opacity-60">{course.teacherName.split(' ')[0]}</p>
                                          <Badge className="bg-primary/5 text-primary text-[5px] md:text-[8px] h-3 md:h-4 rounded-sm border-none uppercase px-1">{course.room || '---'}</Badge>
                                       </div>
                                     ) : (
                                       <div className="flex items-center justify-center opacity-5"><ArrowRight className="size-2.5 md:size-5" /></div>
                                     )}
                                  </td>
                                )
                              })}
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="classe" className="animate-in slide-in-from-right-4">
             <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
                <div className="lg:col-span-8">
                   <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden min-h-[400px]">
                      <div className="p-6 md:p-12 border-b bg-muted/5 flex items-center justify-between">
                         <h3 className="text-lg md:text-3xl font-black uppercase tracking-tight">{selectedClass} — Planning</h3>
                         <Badge className="bg-primary text-white font-black px-3 py-1 rounded-full text-[9px] md:text-xs">{selectedDay.toUpperCase()}</Badge>
                      </div>
                      <div className="p-4 md:p-10 space-y-4">
                         {loadingSchedules ? (
                           <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary/10 size-10" /></div>
                         ) : filteredSchedules.filter((s:any) => s.day === selectedDay).length === 0 ? (
                           <div className="py-24 text-center opacity-30 italic font-medium flex flex-col items-center gap-4 text-xs md:text-xl">
                              <Zap className="size-8 md:size-12" />
                              Aucun cours scellé.
                           </div>
                         ) : (
                           filteredSchedules.filter((s:any) => s.day === selectedDay).map((course: any) => (
                             <div key={course.id} className="p-4 md:p-8 bg-muted/5 rounded-2xl md:rounded-[2.5rem] border border-muted/20 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 md:gap-8 flex-1 min-w-0">
                                   <div className="size-11 md:size-20 bg-white rounded-xl md:rounded-2xl flex flex-col items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                      <Clock className="size-3.5 md:size-6" />
                                      <span className="text-[7px] md:text-sm font-black uppercase">{course.startTime.split(':')[0]}H</span>
                                   </div>
                                   <div className="space-y-0.5 md:space-y-1 truncate">
                                      <h4 className="text-sm md:text-3xl font-black text-foreground uppercase tracking-tight truncate">{course.subject}</h4>
                                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                         <span className="flex items-center gap-1"><User className="size-2.5 md:size-3.5 text-primary" /> {course.teacherName}</span>
                                         <span className="flex items-center gap-1"><MapPin className="size-2.5 md:size-3.5 text-primary" /> {course.room || 'Salle libre'}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="text-right shrink-0">
                                   <p className="text-[6px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Durée</p>
                                   <p className="text-xs md:text-2xl font-black text-primary tabular-nums">{course.duration}</p>
                                </div>
                             </div>
                           ))
                         )}
                      </div>
                   </Card>
                </div>

                <div className="lg:col-span-4 space-y-6 md:space-y-10">
                   <Card className="p-6 md:p-12 bg-foreground text-white rounded-[2rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-none">
                      <div className="relative z-10 space-y-6 md:space-y-8">
                         <div className="flex items-center gap-4">
                            <div className="size-10 md:size-16 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner"><Sparkles className="size-5 md:size-8 text-primary animate-pulse" /></div>
                            <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">Audit IA Brain</h3>
                         </div>
                         <div className="p-4 md:p-8 bg-white/5 rounded-xl md:rounded-[2rem] border border-white/10 italic text-[9px] md:text-lg font-medium leading-relaxed text-white/80">
                           {aiReport ? `"${aiReport}"` : `"Je peux analyser l'équilibre des cours et détecter les classes sans professeurs."`}
                         </div>
                         <Button onClick={handleAiAudit} disabled={analyzing} className="w-full h-11 md:h-16 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] md:text-sm transition-all shadow-xl shadow-primary/20 active:scale-95">
                           {analyzing ? <Loader2 className="animate-spin size-3.5" /> : <Zap className="size-3.5 mr-2" />}
                           Lancer Diagnostic IA
                         </Button>
                      </div>
                      <Zap className="absolute -bottom-10 -right-10 size-32 md:size-64 text-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[3000ms]" />
                   </Card>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
