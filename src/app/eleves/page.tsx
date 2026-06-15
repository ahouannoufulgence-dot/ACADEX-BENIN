"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Loader2,
  Users,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  TrendingUp,
  Plus,
  Trophy,
  Calculator,
  User,
  Zap
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, where, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [userSubject, setUserSubject] = useState<string>("")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  
  const db = useFirestore()

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role'))
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setUserSubject(localStorage.getItem('acadex_user_subject') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  const isTeacher = userRole === "Enseignant"
  const isDirector = userRole === "Directeur"

  // 1. Requête des élèves
  const studentsQuery = useMemo(() => {
    if (!db || !userRole) return null
    const baseCol = collection(db, "students")
    
    if (isTeacher && selectedClass) {
      return query(baseCol, where("academicYear", "==", activeYear), where("classId", "==", selectedClass), orderBy("lastName", "asc"))
    }
    
    if (isTeacher && !selectedClass) {
      return query(baseCol, where("academicYear", "==", activeYear), where("classId", "in", userClasses))
    }

    if (isDirector) {
      return query(baseCol, where("academicYear", "==", activeYear), orderBy("lastName", "asc"))
    }

    return null
  }, [db, userRole, selectedClass, activeYear, isTeacher, isDirector, userClasses])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  // 2. Requête des notes
  const gradesQuery = useMemo(() => {
    if (!db || !isTeacher || !userSubject) return null
    return query(
      collection(db, "grades"), 
      where("academicYear", "==", activeYear),
      where("subject", "==", userSubject),
      where("classId", "in", userClasses)
    )
  }, [db, isTeacher, userSubject, activeYear, userClasses])

  const { data: grades } = useCollection(gradesQuery)

  // 3. Calcul analytique
  const analysis = useMemo(() => {
    if (!students || !isTeacher) return { classStats: {}, studentsProcessed: [] }

    const studentsProcessed = students.map((s: any) => {
      const sGrades = grades?.filter(g => g.studentId === s.matricule) || []
      
      const getNote = (type: string) => sGrades.find(g => g.type === type)?.value || 0
      const coef = sGrades[0]?.coefficient || 2

      const int1 = getNote('int1')
      const int2 = getNote('int2')
      const int3 = getNote('int3')
      const dev1 = getNote('dev1')
      const dev2 = getNote('dev2')

      const moySimple = (int1 + int2 + int3 + dev1 + dev2) / 5
      const moyCoef = moySimple * coef

      return {
        ...s,
        int1, int2, int3, dev1, dev2,
        coef,
        moySimple: Number(moySimple.toFixed(2)),
        moyCoef: Number(moyCoef.toFixed(2))
      }
    })

    const classStats: any = {}
    userClasses.forEach(cls => {
      const clsStudents = studentsProcessed.filter(s => s.classId === cls)
      if (clsStudents.length > 0) {
        const avgs = clsStudents.map(s => s.moySimple)
        classStats[cls] = {
          count: clsStudents.length,
          avg: (avgs.reduce((a, b) => a + b, 0) / clsStudents.length).toFixed(2),
          max: Math.max(...avgs).toFixed(2),
          min: Math.min(...avgs).toFixed(2)
        }
      }
    })

    return { classStats, studentsProcessed }
  }, [students, grades, isTeacher, userClasses])

  const displayStudents = useMemo(() => {
    let list = analysis.studentsProcessed
    if (selectedClass) list = list.filter(s => s.classId === selectedClass)
    
    return list
      .filter((s: any) => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.matricule && s.matricule.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => b.moySimple - a.moySimple)
  }, [analysis, selectedClass, searchTerm])

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Header Dynamique */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
              {isDirector ? "Répertoire Élèves" : (isTeacher && !selectedClass) ? "Mes Classes" : `Registre ${selectedClass}`}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[8px] md:text-sm">
              <ShieldCheck className={cn("size-3 md:size-4", isTeacher ? "text-primary" : "text-emerald-500")} />
              <span className="uppercase tracking-widest">
                {isTeacher ? `${userSubject}` : "Pilotage Stratégique"} • {activeYear}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {isDirector && (
              <Button asChild className="flex-1 md:flex-none bg-primary shadow-xl rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-8 font-black text-[10px] md:text-sm transition-all active:scale-95">
                <Link href="/eleves/identifiants"><Plus className="mr-1.5 md:mr-2 size-3 md:size-4" /> Codes</Link>
              </Button>
            )}
            {isTeacher && selectedClass && (
               <Button variant="outline" onClick={() => setSelectedClass(null)} className="flex-1 md:flex-none rounded-xl border-2 font-black h-11 md:h-14 px-4 md:px-6 hover:bg-primary hover:text-white transition-all text-[10px] md:text-sm">
                  <ChevronLeft className="mr-1 md:mr-2 size-3 md:size-4" /> RETOUR
               </Button>
            )}
          </div>
        </div>

        {/* LISTE DES CLASSES (VUE ENSEIGNANT) */}
        {isTeacher && !selectedClass && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 animate-in slide-in-from-bottom-6">
            {userClasses.sort().map(classId => {
              const stats = analysis.classStats[classId]
              return (
                <Card key={classId} className="group p-6 md:p-10 rounded-[2.2rem] md:rounded-[3rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all relative overflow-hidden border-t-[10px] border-primary">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <Users className="size-20 md:size-32" />
                  </div>
                  
                  <div className="space-y-6 md:space-y-8 relative z-10">
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="text-4xl md:text-6xl font-black text-foreground">{classId}</h3>
                          <p className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] mt-1">{userSubject}</p>
                       </div>
                       <Badge className="bg-primary/5 text-primary border-none font-black px-3 py-1 rounded-full text-[9px] md:text-xs uppercase">{stats?.count || 0} Élèves</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                       <div className="p-2 md:p-3 bg-emerald-50 rounded-xl md:rounded-2xl text-center">
                          <p className="text-[7px] font-black text-emerald-800 uppercase mb-1">Moy. Cls</p>
                          <p className="text-xs md:text-xl font-black text-emerald-700">{stats?.avg || "0.00"}</p>
                       </div>
                       <div className="p-2 md:p-3 bg-amber-50 rounded-xl md:rounded-2xl text-center">
                          <p className="text-[7px] font-black text-amber-800 uppercase mb-1">Major</p>
                          <p className="text-xs md:text-xl font-black text-amber-700">{stats?.max || "0.00"}</p>
                       </div>
                       <div className="p-2 md:p-3 bg-red-50 rounded-xl md:rounded-2xl text-center">
                          <p className="text-[7px] font-black text-red-800 uppercase mb-1">Faible</p>
                          <p className="text-xs md:text-xl font-black text-red-700">{stats?.min || "0.00"}</p>
                       </div>
                    </div>

                    <Button 
                      onClick={() => setSelectedClass(classId)} 
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl md:rounded-2xl h-11 md:h-14 font-black shadow-lg shadow-primary/10 transition-all active:scale-95 group-hover:gap-4 text-[10px] md:text-sm"
                    >
                      Voir les élèves <ChevronRight className="size-3 md:size-4 transition-all" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* DÉTAIL CLASSE / RÉPERTOIRE (TABLEAU PRÉCIS) */}
        {(isDirector || (isTeacher && selectedClass)) && (
          <div className="space-y-6 animate-in fade-in">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 md:size-5 text-muted-foreground" />
              <Input 
                placeholder="Nom ou Matricule..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl bg-white border-none shadow-sm font-bold text-xs md:text-base" 
              />
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[1.5rem] md:rounded-[3rem] overflow-hidden min-h-[400px]">
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-20">
                  <Loader2 className="animate-spin text-primary size-10 md:size-12" />
                  <p className="font-black text-[10px] uppercase tracking-widest">Appel des registres...</p>
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar scroll-smooth">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-muted/30 text-[8px] md:text-[11px] font-black uppercase text-muted-foreground border-b border-muted/20 sticky top-0 z-20">
                      <tr>
                        <th className="px-5 py-5 min-w-[180px] bg-muted/30">Élève</th>
                        <th className="px-4 py-5 text-center">Matricule</th>
                        <th className="px-4 py-5 text-center">Sexe</th>
                        <th className="px-4 py-5 text-center">Coef</th>
                        <th className="px-3 py-5 text-center bg-muted/10">Int 1</th>
                        <th className="px-3 py-5 text-center bg-muted/10">Int 2</th>
                        <th className="px-3 py-5 text-center bg-muted/10">Int 3</th>
                        <th className="px-3 py-5 text-center bg-primary/5">Dev 1</th>
                        <th className="px-3 py-5 text-center bg-primary/5">Dev 2</th>
                        <th className="px-5 py-5 text-center bg-emerald-50 text-emerald-800">Moy Simple</th>
                        <th className="px-6 py-5 text-right bg-primary text-white">Moy Coef</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/10">
                      {displayStudents.map((s: any, idx) => (
                        <tr key={s.id} className="hover:bg-muted/5 transition-all group">
                          <td className="px-5 py-4">
                             <div className="flex items-center gap-3">
                                <div className={cn("size-8 md:size-10 rounded-lg md:rounded-xl flex items-center justify-center font-black text-[10px] md:text-xs shadow-sm shrink-0", idx === 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-foreground")}>
                                   {idx + 1}
                                </div>
                                <div className="min-w-0">
                                   <p className="font-black text-xs md:text-lg uppercase leading-tight truncate group-hover:text-primary transition-colors">{s.lastName} {s.firstName}</p>
                                   <Badge variant="outline" className="text-[6px] md:text-[8px] font-black uppercase border-muted/50 mt-1 px-1 h-3.5 md:h-5">{s.classId}</Badge>
                                </div>
                             </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                             <span className="font-mono text-[9px] md:text-xs font-bold text-muted-foreground/60">{s.matricule}</span>
                          </td>
                          <td className="px-4 py-4 text-center font-bold text-muted-foreground text-[10px] md:text-xs">{s.gender?.[0]}</td>
                          <td className="px-4 py-4 text-center font-black text-primary text-[10px] md:text-xs">{s.coef}</td>
                          
                          <td className="px-3 py-4 text-center bg-muted/5 font-bold text-[10px] md:text-xs">{s.int1 || '--'}</td>
                          <td className="px-3 py-4 text-center bg-muted/5 font-bold text-[10px] md:text-xs">{s.int2 || '--'}</td>
                          <td className="px-3 py-4 text-center bg-muted/5 font-bold text-[10px] md:text-xs">{s.int3 || '--'}</td>
                          
                          <td className="px-3 py-4 text-center bg-primary/[0.02] font-black text-[10px] md:text-xs">{s.dev1 || '--'}</td>
                          <td className="px-3 py-4 text-center bg-primary/[0.02] font-black text-[10px] md:text-xs">{s.dev2 || '--'}</td>
                          
                          <td className="px-5 py-4 text-center bg-emerald-50/50">
                             <Badge className={cn("rounded-md md:rounded-lg font-black text-[10px] md:text-sm px-2 md:px-3 h-6 md:h-8", s.moySimple >= 10 ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                                {s.moySimple.toFixed(2)}
                             </Badge>
                          </td>
                          <td className="px-6 py-4 text-right bg-primary/5">
                             <span className="font-black text-sm md:text-2xl text-primary tabular-nums tracking-tighter">
                                {s.moyCoef.toFixed(1)}
                             </span>
                          </td>
                        </tr>
                      ))}
                      {displayStudents.length === 0 && (
                        <tr>
                          <td colSpan={11} className="p-32 text-center">
                             <div className="size-16 md:size-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-30 shadow-inner">
                                <Search className="size-8 md:size-10 text-muted-foreground" />
                             </div>
                             <p className="font-black text-foreground/30 uppercase tracking-widest text-[10px] md:text-sm">Aucun élève identifié.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="flex items-center gap-4 bg-foreground text-white p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
               <div className="size-10 md:size-20 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0"><Calculator className="size-5 md:size-10 text-primary animate-pulse" /></div>
               <div className="space-y-1 relative z-10">
                  <h4 className="text-sm md:text-2xl font-black uppercase tracking-tight">Audit de Performance <span className="text-primary italic">Live</span></h4>
                  <p className="text-[7px] md:text-sm font-medium text-white/50 leading-relaxed uppercase tracking-widest italic">
                    "Registre scellé selon le protocole (Int + Dev) / 5."
                  </p>
               </div>
               <Zap className="absolute -bottom-10 -right-10 size-24 md:size-40 text-white/[0.02] pointer-events-none group-hover:scale-125 transition-transform duration-[2000ms]" />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
