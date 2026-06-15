"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  MapPin, 
  User, 
  BookOpen,
  Zap,
  FileDown,
  ShieldCheck,
  Grid3X3,
  Loader2,
  Sparkles,
  ArrowRight,
  History,
  Timer
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
        question: `Analyse l'équilibre des cours pour le ${selectedDay} en ${activeYear}. Détecte les surcharges ou les classes sans cours.`,
        userRole: "Directeur",
        userId: "DIR-001",
        contextData: { 
          day: selectedDay,
          year: activeYear,
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
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-none">
              Matrice <span className="text-primary italic">Plannings</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[9px] md:text-sm uppercase tracking-widest">
              <History className="size-3 md:size-4 text-primary" />
              <span>Vision Centralisée • {activeYear}</span>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-11 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl border-2 font-black bg-white text-[10px] md:text-sm active:scale-95 transition-all shadow-sm">
              <FileDown className="mr-2 size-4" /> PDF
            </Button>
            <Badge className="bg-primary text-white h-11 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl flex items-center gap-2 font-black text-[9px] md:text-sm shadow-xl shadow-primary/20">
               <ShieldCheck className="size-4 md:size-5" /> SYSTÈME SCELLÉ
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-xl md:rounded-[2.5rem] h-11 md:h-20 p-1 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth shrink-0">
            {[
              { id: "global", label: "Général", icon: Grid3X3 },
              { id: "classe", label: "Classes", icon: BookOpen },
              { id: "professeur", label: "Profs", icon: User },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="flex-1 md:flex-none rounded-lg md:rounded-[2rem] font-black px-4 md:px-10 text-[8px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-1.5 md:gap-3 shrink-0">
                <t.icon className="size-3.5 md:size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Card className="p-3 md:p-8 rounded-2xl md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col gap-4 md:gap-10">
             <div className="w-full">
                <Label className="font-black text-[9px] uppercase text-muted-foreground px-2 mb-2 block">Jour de la Semaine</Label>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 snap-x snap-proximity">
                   {days.map(d => (
                     <button 
                       key={d} 
                       onClick={() => setSelectedDay(d)}
                       className={cn(
                         "px-4 md:px-6 py-2 md:py-3 rounded-xl font-black text-[9px] md:text-[11px] uppercase transition-all whitespace-nowrap border-2 snap-start",
                         selectedDay === d ? "bg-primary text-white border-primary shadow-lg scale-105" : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                       )}
                     >
                       {d}
                     </button>
                   ))}
                </div>
             </div>
             
             <div className="flex flex-col md:flex-row gap-4">
              {activeTab === 'classe' && (
                  <div className="w-full md:w-64">
                    <Label className="font-black text-[9px] uppercase text-muted-foreground px-2 mb-2 block">Sélecteur Classe</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-2 p-1.5 max-h-[300px]">
                          {OFFICIAL_CLASSES.map(c => <SelectItem key={c} value={c} className="font-bold p-2.5 rounded-lg text-xs">{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
              )}

              {activeTab === 'professeur' && (
                  <div className="w-full md:w-64">
                    <Label className="font-black text-[9px] uppercase text-muted-foreground px-2 mb-2 block">Sélecteur Enseignant</Label>
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                        <SelectTrigger className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-sm"><SelectValue placeholder="Choisir un prof" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-2 p-1.5 max-h-[300px]">
                          {teachers?.map((t:any) => <SelectItem key={t.id} value={t.officialId || t.id} className="font-bold p-2.5 rounded-lg text-xs">{t.fullName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
              )}
             </div>
          </Card>

          <TabsContent value="global" className="animate-in zoom-in-95">
             <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[3.5rem] overflow-hidden">
                <div className="p-4 md:p-12 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                   <div className="space-y-1">
                      <h3 className="text-lg md:text-3xl font-black uppercase tracking-tight">Omni-Vision <span className="text-primary italic">Directe</span></h3>
                      <p className="text-[7px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Flux temporel synchronisé</p>
                   </div>
                   <Badge variant="outline" className="h-7 md:h-11 rounded-full border-2 border-primary/20 text-primary font-black px-4 text-[7px] md:text-xs uppercase w-fit">MATRICE LIVE</Badge>
                </div>
                
                <div className="overflow-x-auto p-1 md:p-6 no-scrollbar">
                   <table className="w-full border-separate border-spacing-1 md:border-spacing-3">
                      <thead>
                         <tr>
                            <th className="p-2 md:px-6 md:py-6 bg-muted/30 rounded-lg md:rounded-2xl text-[6px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] min-w-[50px] md:min-w-[100px] sticky left-0 z-20">HORAIRE</th>
                            {OFFICIAL_CLASSES.map(c => (
                              <th key={c} className="p-2 md:px-6 md:py-6 bg-primary/5 rounded-lg md:rounded-2xl text-[7px] md:text-sm font-black uppercase text-primary border-2 border-primary/10 min-w-[80px] md:min-w-[180px]">{c}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody>
                         {timeSlots.map(time => (
                           <tr key={time}>
                              <td className="p-2 md:px-6 md:py-6 bg-muted/20 rounded-lg md:rounded-2xl text-center font-black text-[8px] md:text-2xl tabular-nums text-foreground/40 sticky left-0 z-20 backdrop-blur-md">{time}</td>
                              {OFFICIAL_CLASSES.map(cls => {
                                const course = allSchedules?.find((s:any) => s.day === selectedDay && s.classId === cls && s.startTime <= time && s.endTime > time)
                                return (
                                  <td key={`${cls}-${time}`} className={cn(
                                    "p-1 md:p-4 rounded-lg md:rounded-2xl transition-all border-2 h-10 md:h-28 text-center",
                                    course ? "bg-white border-primary/10 shadow-lg scale-[1.02] ring-4 ring-primary/5" : "bg-muted/5 border-transparent opacity-[0.15]"
                                  )}>
                                     {course ? (
                                       <div className="space-y-0.5 md:space-y-2 group cursor-help">
                                          <p className="text-[6px] md:text-base font-black text-foreground uppercase tracking-tight truncate group-hover:text-primary transition-colors">{course.subject}</p>
                                          <p className="text-[5px] md:text-[10px] font-bold text-muted-foreground uppercase truncate opacity-70 hidden md:block">{course.teacherName?.split(' ')[0]}</p>
                                          <Badge className="bg-primary/5 text-primary text-[5px] md:text-[8px] h-3 md:h-5 rounded-md border-none uppercase px-1 shadow-none hidden md:inline-flex">{course.room || '---'}</Badge>
                                       </div>
                                     ) : (
                                       <div className="flex items-center justify-center opacity-10"><ArrowRight className="size-2 md:size-5" /></div>
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
                <div className="lg:col-span-8 space-y-4">
                   <div className="flex items-center justify-between px-2">
                      <h2 className="text-base md:text-3xl font-black uppercase tracking-tight">{selectedClass} — <span className="text-primary italic">Programme</span></h2>
                      <Badge className="bg-primary text-white font-black px-3 py-1 rounded-full text-[7px] md:text-xs uppercase">{selectedDay}</Badge>
                   </div>
                   
                   <div className="grid gap-3 md:gap-6">
                      {loadingSchedules ? (
                        <div className="py-20 text-center animate-pulse"><Loader2 className="animate-spin mx-auto text-primary/10 size-10" /></div>
                      ) : filteredSchedules.filter((s:any) => s.day === selectedDay).length === 0 ? (
                        <Card className="py-16 md:py-24 text-center border-4 border-dashed rounded-2xl md:rounded-[3.5rem] bg-white/50 opacity-30 flex flex-col items-center justify-center gap-4">
                           <Zap className="size-10 md:size-16 text-muted-foreground" />
                           <p className="font-black text-[10px] md:text-xl uppercase tracking-widest">Aucun cours scellé.</p>
                        </Card>
                      ) : (
                        filteredSchedules.filter((s:any) => s.day === selectedDay).map((course: any, i: number) => (
                          <Card key={i} className="p-3 md:p-8 bg-white rounded-xl md:rounded-[3rem] border-none shadow-sm hover:shadow-xl transition-all group flex items-center justify-between gap-3">
                             <div className="flex items-center gap-3 md:gap-10 min-w-0">
                                <div className="size-10 md:size-24 bg-muted rounded-lg md:rounded-[2.5rem] flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0 shadow-inner">
                                   <Clock className="size-3.5 md:size-7" />
                                   <span className="text-[6px] md:text-sm font-black uppercase tracking-tighter">{course.startTime?.split(':')[0]}H</span>
                                </div>
                                <div className="space-y-0.5 md:space-y-1.5 truncate">
                                   <h4 className="text-xs md:text-3xl font-black text-foreground uppercase tracking-tight truncate group-hover:text-primary transition-colors">{course.subject}</h4>
                                   <div className="flex flex-wrap items-center gap-2 md:gap-6 text-[6px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                      <span className="flex items-center gap-1"><User className="size-2 md:size-4 text-primary" /> {course.teacherName}</span>
                                      <span className="flex items-center gap-1"><MapPin className="size-2 md:size-4 text-primary" /> {course.room || '---'}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right shrink-0">
                                <p className="text-[5px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Durée</p>
                                <p className="text-[10px] md:text-2xl font-black text-primary tabular-nums">{course.duration}</p>
                             </div>
                          </Card>
                        ))
                      )}
                   </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                   <Card className="p-6 md:p-10 bg-foreground text-white rounded-2xl md:rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-none">
                      <div className="relative z-10 space-y-6 md:space-y-10">
                         <div className="flex items-center gap-4">
                            <div className="size-10 md:size-16 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner"><Sparkles className="size-5 md:size-8 text-primary animate-pulse" /></div>
                            <h3 className="text-sm md:text-2xl font-black uppercase tracking-tight">Audit IA Brain</h3>
                         </div>
                         <div className="p-4 md:p-8 bg-white/5 rounded-xl md:rounded-[2rem] border border-white/10 italic text-[9px] md:text-base font-medium leading-relaxed text-white/80 min-h-[80px] flex items-center justify-center text-center">
                           {aiReport ? `"${aiReport}"` : `"Je peux analyser l'équilibre temporel de vos classes."`}
                         </div>
                         <Button onClick={handleAiAudit} disabled={analyzing} className="w-full h-11 md:h-16 rounded-xl md:rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[9px] md:text-lg transition-all active:scale-95 shadow-xl shadow-primary/20 uppercase">
                           {analyzing ? <Loader2 className="animate-spin size-4" /> : <Zap className="size-4 mr-2" />}
                           Audit IA
                         </Button>
                      </div>
                   </Card>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
