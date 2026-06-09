
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Layers, 
  ChevronRight, 
  Users, 
  FileText, 
  ShieldCheck, 
  ChevronLeft, 
  Loader2, 
  GraduationCap,
  Award,
  Zap,
  BookOpen,
  ClipboardList,
  Search,
  Download
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

const levels = [
  { id: "6EME", label: "6ème", desc: "Premier Cycle - Entrée" },
  { id: "5EME", label: "5ème", desc: "Premier Cycle - Observation" },
  { id: "4EME", label: "4ème", desc: "Premier Cycle - Orientation" },
  { id: "3EME", label: "3ème", desc: "Premier Cycle - Brevet" },
  { id: "2NDE", label: "Seconde", desc: "Second Cycle - Séries A, B, C, D" },
  { id: "1ERE", label: "Première", desc: "Second Cycle - Séries A, B, C, D" },
  { id: "TERMINALE", label: "Terminale", desc: "Second Cycle - Séries A, B, C, D" }
]

export default function PromotionsPage() {
  const db = useFirestore()
  const [activeYear, setActiveYear] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    const updateYear = (e: any) => setActiveYear(e.detail)
    window.addEventListener('acadex_year_changed', updateYear as any)
    return () => window.removeEventListener('acadex_year_changed', updateYear as any)
  }, [])

  const studentsQuery = useMemo(() => {
    if (!db || !activeYear) return null
    return query(collection(db, "students"), where("academicYear", "==", activeYear), where("status", "==", "Actif"))
  }, [db, activeYear])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const dataMap = useMemo(() => {
    if (!students) return {}
    const map: any = {}
    students.forEach((s: any) => {
      const level = levels.find(l => s.classId?.startsWith(l.id))?.id || "AUTRE"
      if (!map[level]) map[level] = { students: [], classes: new Set() }
      map[level].students.push(s)
      map[level].classes.add(s.classId)
    })
    return map
  }, [students])

  const filteredStudents = useMemo(() => {
    if (!selectedClass || !students) return []
    return students.filter((s: any) => 
      s.classId === selectedClass && 
      (`${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
       s.matricule.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [students, selectedClass, searchTerm])

  const goBackToLevels = () => { setSelectedLevel(null); setSelectedClass(null); setSelectedStudent(null); }
  const goBackToClasses = () => { setSelectedClass(null); setSelectedStudent(null); }
  const goBackToClassList = () => { setSelectedStudent(null); }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
              Gestion des <span className="text-primary italic">Promotions</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <Layers className="size-3 md:size-4 text-primary" />
              <span>Année {activeYear} • Dossiers Scolaires</span>
            </div>
          </div>
          {selectedLevel && (
            <Button variant="outline" onClick={goBackToLevels} className="rounded-xl md:rounded-2xl border-2 font-black h-11 md:h-14 px-5 md:px-8 text-[10px] md:text-sm">
              <ChevronLeft className="mr-2 size-4" /> Retour aux Promotions
            </Button>
          )}
        </div>

        {!selectedLevel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {levels.map((level) => {
              const count = dataMap[level.id]?.students?.length || 0
              const classCount = dataMap[level.id]?.classes?.size || 0
              return (
                <Card 
                  key={level.id} 
                  onClick={() => setSelectedLevel(level.id)}
                  className="p-6 md:p-10 rounded-[2.2rem] md:rounded-[3rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <GraduationCap className="size-24 md:size-32" />
                  </div>
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="size-12 md:size-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <Award className="size-6 md:size-8" />
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] md:text-xs px-3">{classCount} CLASSES</Badge>
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-xl md:text-3xl font-black text-foreground uppercase tracking-tight">{level.label}</h3>
                    <p className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-widest">{level.desc}</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-muted/30 flex justify-between items-center relative z-10">
                    <span className="text-[10px] md:text-xs font-black text-primary/60 uppercase">{count} Élèves</span>
                    <ChevronRight className="size-4 md:size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {selectedLevel && !selectedClass && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="flex items-center gap-4">
               <Badge className="bg-primary text-white text-lg md:text-2xl font-black px-6 py-2 rounded-full uppercase">{selectedLevel}</Badge>
               <div className="h-0.5 flex-1 bg-muted/30" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from(dataMap[selectedLevel]?.classes || []).sort().map((cls: any) => {
                const count = students?.filter((s: any) => s.classId === cls).length || 0
                return (
                  <Card 
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className="p-8 md:p-12 rounded-[2.5rem] bg-white border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group text-center"
                  >
                    <div className="size-16 md:size-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                      <BookOpen className="size-8 md:size-10" />
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black mb-2 uppercase">{cls}</h3>
                    <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">{count} DOSSIERS</p>
                  </Card>
                )
              })}
              {(!dataMap[selectedLevel]?.classes || dataMap[selectedLevel]?.classes.size === 0) && (
                <div className="col-span-full py-20 text-center opacity-30 italic font-medium">Aucune classe pour ce niveau.</div>
              )}
            </div>
          </div>
        )}

        {selectedClass && (
          <div className="grid lg:grid-cols-12 gap-8 animate-in slide-in-from-right-4">
            <div className={cn("lg:col-span-4 space-y-6", selectedStudent && "hidden lg:block")}>
              <Card className="p-6 md:p-8 rounded-[2.5rem] bg-white border-none shadow-sm h-fit">
                <div className="flex items-center justify-between mb-8">
                  <Button variant="ghost" onClick={goBackToClasses} className="p-0 font-black text-[10px] md:text-xs uppercase text-primary hover:bg-transparent group">
                    <ChevronLeft className="size-3 md:size-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour classes
                  </Button>
                  <Badge className="bg-primary text-white font-black">{selectedClass}</Badge>
                </div>
                <div className="relative group mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Chercher élève..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 md:h-14 rounded-2xl bg-muted/30 border-none font-bold"
                  />
                </div>
                <ScrollArea className="h-[500px] md:h-[600px] pr-4 no-scrollbar">
                  <div className="space-y-3">
                    {filteredStudents.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group",
                          selectedStudent?.id === s.id ? "bg-primary text-white border-primary shadow-xl" : "bg-white border-transparent hover:bg-muted/5"
                        )}
                      >
                        <Avatar className={cn("size-10 md:size-12 border-2", selectedStudent?.id === s.id ? "border-white/20" : "border-muted/20")}>
                          <AvatarFallback className={cn("font-black text-xs md:text-sm", selectedStudent?.id === s.id ? "bg-white/10" : "bg-primary/5 text-primary")}>
                            {s.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left min-w-0">
                          <p className="font-black text-sm md:text-base truncate uppercase tracking-tight">{s.lastName} {s.firstName}</p>
                          <p className={cn("text-[9px] font-bold uppercase", selectedStudent?.id === s.id ? "text-white/60" : "text-muted-foreground")}>{s.matricule}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            <div className={cn("lg:col-span-8", !selectedStudent && "hidden lg:flex")}>
               {!selectedStudent ? (
                 <Card className="flex-1 p-20 md:p-40 text-center rounded-[3rem] md:rounded-[4rem] border-4 border-dashed border-muted/50 bg-white/50 flex flex-col items-center justify-center space-y-8">
                    <div className="size-20 md:size-28 bg-muted rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center opacity-30 shadow-inner">
                      <FileText className="size-10 md:size-14 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl md:text-4xl font-black text-foreground/40 uppercase">Dossier Académique</h3>
                      <p className="text-sm md:text-xl font-medium text-muted-foreground/60 max-w-sm mx-auto">Sélectionnez un élève pour visualiser son historique.</p>
                    </div>
                 </Card>
               ) : (
                 <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-6 w-full">
                    <div className="flex items-center gap-4 lg:hidden">
                       <Button variant="ghost" size="icon" onClick={goBackToClassList} className="size-10 rounded-xl bg-white shadow-sm border border-muted/20"><ChevronLeft className="size-6" /></Button>
                       <h4 className="font-black uppercase text-xs">Fiche Élève</h4>
                    </div>

                    <Card className="p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-white border-none shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000"><ShieldCheck className="size-64" /></div>
                       <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
                          <Avatar className="size-24 md:size-40 border-8 border-muted shadow-2xl group-hover:border-primary/20 transition-all">
                             <AvatarFallback className="text-4xl md:text-6xl font-black bg-primary text-white">{(selectedStudent.lastName || "?")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="text-center md:text-left space-y-4 md:space-y-6 flex-1">
                             <div>
                               <h2 className="text-2xl md:text-5xl font-black text-foreground uppercase tracking-tight leading-tight">{selectedStudent.lastName} <br className="hidden md:block" /> {selectedStudent.firstName}</h2>
                               <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                                  <Badge className="bg-primary text-white font-black text-[10px] md:text-sm px-4 md:px-6 py-1 md:py-2 rounded-full shadow-lg shadow-primary/20">{selectedStudent.classId}</Badge>
                                  <Badge variant="outline" className="border-muted font-black text-[10px] md:text-sm px-4 md:px-6 py-1 md:py-2 rounded-full uppercase">{selectedStudent.matricule}</Badge>
                               </div>
                             </div>
                             <div className="flex items-center justify-center md:justify-start gap-8 border-t pt-6 border-muted/30">
                                <div className="text-center md:text-left">
                                   <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Moyenne G.</p>
                                   <p className="text-xl md:text-3xl font-black text-primary">{selectedStudent.average || "0.00"}</p>
                                </div>
                                <div className="text-center md:text-left">
                                   <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Conduite</p>
                                   <p className="text-xl md:text-3xl font-black text-foreground">18.5/20</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </Card>

                    <div className="grid md:grid-cols-3 gap-4 md:gap-8">
                       {["Trimestre 1", "Trimestre 2", "Trimestre 3"].map((term) => (
                         <Card key={term} className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col items-center text-center space-y-6 group hover:shadow-xl transition-all">
                            <div className="size-14 md:size-16 bg-muted/40 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                               <ClipboardList className="size-6 md:size-8" />
                            </div>
                            <div>
                               <h4 className="font-black text-sm md:text-lg uppercase tracking-tight">{term}</h4>
                               <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase opacity-60">Année {activeYear}</p>
                            </div>
                            <Button className="w-full h-11 md:h-14 rounded-xl md:rounded-2xl bg-primary shadow-xl shadow-primary/10 font-black text-[10px] md:text-xs">
                               <Download className="mr-2 size-3 md:size-4" /> GÉNÉRER BULLETIN
                            </Button>
                         </Card>
                       ))}
                    </div>

                    <Card className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-foreground text-white border-none shadow-2xl relative overflow-hidden group">
                       <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                          <div className="space-y-6 flex-1">
                             <h3 className="text-xl md:text-3xl font-black flex items-center gap-3 uppercase tracking-tight">
                                <Zap className="text-primary fill-primary size-5 md:size-7" /> Intelligence Dossier
                             </h3>
                             <p className="text-xs md:text-lg font-medium text-white/70 italic leading-relaxed border-l-4 border-primary pl-6">
                                "L'analyse du dossier montre une progression constante. L'élève excelle dans les matières scientifiques et maintient une conduite exemplaire."
                             </p>
                          </div>
                          <div className="flex flex-col justify-end">
                             <Button variant="outline" className="rounded-xl border-white/10 text-white font-black text-[9px] md:text-xs hover:bg-white/5 h-11 md:h-14 px-8">
                                ANALYSE IA COMPLÈTE
                             </Button>
                          </div>
                       </div>
                       <FileText className="absolute -bottom-10 -right-10 size-48 md:size-72 text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                    </Card>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
