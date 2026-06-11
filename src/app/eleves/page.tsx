
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Loader2,
  Users,
  ChevronRight,
  ShieldCheck,
  Zap,
  Award,
  TrendingUp,
  FileText,
  ChevronLeft,
  ArrowRight,
  TrendingDown,
  Star,
  GraduationCap
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase/index"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [userSubject, setUserSubject] = useState("")
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  
  const db = useFirestore()

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role'))
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setUserSubject(localStorage.getItem('acadex_user_subject') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  // 1. Chargement global des élèves et des notes pour l'année active
  const studentsQuery = useMemo(() => {
    if (!db || !userRole) return null
    const baseCol = collection(db, "students")
    // Si enseignant, on limite aux classes assignées
    if (userRole === "Enseignant" && userClasses.length > 0) {
      return query(baseCol, where("academicYear", "==", activeYear), where("classId", "in", userClasses))
    }
    return query(baseCol, where("academicYear", "==", activeYear))
  }, [db, userRole, userClasses, activeYear])

  const gradesQuery = useMemo(() => {
    if (!db || !userSubject) return null
    return query(
      collection(db, "grades"), 
      where("academicYear", "==", activeYear), 
      where("subject", "==", userSubject)
    )
  }, [db, userSubject, activeYear])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)
  const { data: grades, loading: loadingGrades } = useCollection(gradesQuery)

  // 2. Calcul des statistiques par classe pour la vue "Cartes"
  const classStats = useMemo(() => {
    if (!students || !grades) return {}
    
    const stats: Record<string, any> = {}
    const classesToProcess = userRole === "Enseignant" ? userClasses : Array.from(new Set(students.map((s:any) => s.classId)))
    
    classesToProcess.forEach(classId => {
      const classStudents = students.filter((s: any) => s.classId === classId)
      if (classStudents.length === 0) return

      const studentAverages = classStudents.map((student: any) => {
        const sGrades = grades.filter((g: any) => g.studentId === student.matricule && g.classId === classId)
        
        const ints = sGrades.filter(g => g.type.startsWith('int')).map(g => Number(g.value))
        const devs = sGrades.filter(g => g.type.startsWith('dev')).map(g => Number(g.value))
        
        const avgInt = ints.length > 0 ? ints.reduce((a, b) => a + b, 0) / ints.length : null
        const pillars = []
        if (avgInt !== null) pillars.push(avgInt)
        devs.forEach(d => pillars.push(d))
        
        return pillars.length > 0 ? pillars.reduce((a, b) => a + b, 0) / pillars.length : 0
      })

      const totalAvg = studentAverages.length > 0 ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length : 0
      
      stats[classId] = {
        count: classStudents.length,
        avg: totalAvg.toFixed(2),
        max: studentAverages.length > 0 ? Math.max(...studentAverages).toFixed(2) : "0.00",
        min: studentAverages.length > 0 ? Math.min(...studentAverages).toFixed(2) : "0.00",
      }
    })
    
    return stats
  }, [students, grades, userClasses, userRole])

  // 3. Préparation des données pour le "Tableau des Moyennes" de la classe sélectionnée
  const currentClassData = useMemo(() => {
    if (!selectedClass || !students || !grades) return []
    
    return students
      .filter((s: any) => s.classId === selectedClass)
      .map((student: any) => {
        const sGrades = grades.filter((g: any) => g.studentId === student.matricule && g.classId === selectedClass)
        const d: any = { 
          int1: sGrades.find(g => g.type === 'int1')?.value,
          int2: sGrades.find(g => g.type === 'int2')?.value,
          int3: sGrades.find(g => g.type === 'int3')?.value,
          dev1: sGrades.find(g => g.type === 'dev1')?.value,
          dev2: sGrades.find(g => g.type === 'dev2')?.value,
          coef: sGrades[0]?.coefficient || 2
        }
        
        const ints = [d.int1, d.int2, d.int3].filter(v => v !== undefined && v !== null)
        const avgInt = ints.length > 0 ? ints.reduce((a:number, b:number) => a + b, 0) / ints.length : null
        
        const pillars = []
        if (avgInt !== null) pillars.push(avgInt)
        if (d.dev1 !== undefined && d.dev1 !== null) pillars.push(d.dev1)
        if (d.dev2 !== undefined && d.dev2 !== null) pillars.push(d.dev2)
        
        const avg = pillars.length > 0 ? pillars.reduce((a:number, b:number) => a + b, 0) / pillars.length : 0
        
        return {
          ...student,
          notes: d,
          average: avg.toFixed(2),
          weighted: (avg * d.coef).toFixed(2)
        }
      })
      .sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""))
  }, [selectedClass, students, grades])

  if (loadingStudents || loadingGrades) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6 opacity-30">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="font-black uppercase tracking-[0.3em] text-[10px]">Ouverture du coffre-fort des classes...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Entête Dynamique */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            {selectedClass && (
              <button 
                onClick={() => setSelectedClass(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black text-[10px] md:text-xs uppercase tracking-widest group"
              >
                <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Retour Mes Classes
              </button>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
              {selectedClass ? (
                <>Classe de <span className="text-primary italic">{selectedClass}</span></>
              ) : (
                <>Mes <span className="text-primary italic">Classes</span></>
              )}
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[9px] md:text-sm">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span className="uppercase tracking-widest">Registre Officiel • {activeYear}</span>
            </div>
          </div>

          {!selectedClass && (
             <div className="bg-white border-2 border-primary/10 px-6 py-3 rounded-2xl md:rounded-[2rem] shadow-xl flex items-center gap-4">
                <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary"><GraduationCap className="size-6" /></div>
                <div>
                  <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Enseignement</p>
                  <p className="text-sm md:text-lg font-black">{userSubject}</p>
                </div>
             </div>
          )}
        </div>

        {/* 1. VUE DES CARTES CLASSES */}
        {!selectedClass && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {(userRole === "Enseignant" ? userClasses : Array.from(new Set(students?.map((s:any) => s.classId) || []))).sort().map((classId) => {
              const stats = classStats[classId] || { avg: "0.00", count: 0, max: "0.00", min: "0.00" }
              return (
                <Card 
                  key={classId} 
                  onClick={() => setSelectedClass(classId)}
                  className="p-6 md:p-10 rounded-[2.2rem] md:rounded-[3.5rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden border-l-[12px] border-primary active:scale-95"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Zap className="size-24 md:size-40" />
                  </div>
                  
                  <div className="flex justify-between items-start mb-8 md:mb-12 relative z-10">
                    <div className="space-y-1">
                      <h3 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tighter">{classId}</h3>
                      <p className="text-[9px] md:text-sm font-black text-primary uppercase tracking-[0.2em]">Moyenne : {stats.avg}/20</p>
                    </div>
                    <div className="size-12 md:size-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <TrendingUp className="size-6 md:size-8" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10">
                    <div className="p-4 md:p-5 bg-muted/30 rounded-2xl border border-muted/50">
                       <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1">Premier</p>
                       <p className="text-xl md:text-3xl font-black text-emerald-600 tabular-nums">{stats.max}</p>
                    </div>
                    <div className="p-4 md:p-5 bg-muted/30 rounded-2xl border border-muted/50">
                       <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1">Dernier</p>
                       <p className="text-xl md:text-3xl font-black text-red-600 tabular-nums">{stats.min}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-muted/50 flex justify-between items-center relative z-10">
                     <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground">{stats.count} Élèves scellés</span>
                     </div>
                     <span className="text-[8px] md:text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        Ouvrir Registre <ChevronRight className="size-3 md:size-4" />
                     </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* 2. VUE DU REGISTRE DÉTAILLÉ (TABLEAU) */}
        {selectedClass && (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right-6 duration-500">
            <div className="relative group w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Chercher un élève dans ce registre..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 md:h-16 bg-white border-none shadow-sm rounded-2xl md:rounded-3xl font-bold text-sm md:text-lg placeholder:text-muted-foreground/30"
              />
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden">
              <div className="p-6 md:p-14 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="space-y-1">
                    <h3 className="text-xl md:text-4xl font-black uppercase tracking-tight">Tableau des Moyennes</h3>
                    <p className="text-[8px] md:text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileText className="size-3 md:size-4" /> Registre Officiel • {selectedClass}
                    </p>
                 </div>
                 <Badge className="bg-primary text-white font-black px-6 py-2 rounded-full text-[9px] md:text-xs h-fit uppercase tracking-widest">
                   COEF : {currentClassData[0]?.notes?.coef || 2}
                 </Badge>
              </div>
              
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="bg-muted/30 text-[8px] md:text-[11px] font-black uppercase text-muted-foreground border-b-2">
                    <tr>
                      <th className="px-6 py-6 md:py-10 text-left sticky left-0 bg-white z-10 border-b">Nom</th>
                      <th className="px-6 py-6 md:py-10 text-left border-b">Prénom</th>
                      <th className="px-4 py-6 md:py-10 text-center border-b">Sexe</th>
                      <th className="px-4 py-6 md:py-10 text-center border-b bg-primary/5">I1</th>
                      <th className="px-4 py-6 md:py-10 text-center border-b bg-primary/5">I2</th>
                      <th className="px-4 py-6 md:py-10 text-center border-b bg-primary/5">I3</th>
                      <th className="px-4 py-6 md:py-10 text-center border-b bg-emerald-50/50">D1</th>
                      <th className="px-4 py-6 md:py-10 text-center border-b bg-emerald-50/50">D2</th>
                      <th className="px-6 py-6 md:py-10 text-center border-b font-black text-primary">Moy/20</th>
                      <th className="px-8 py-6 md:py-10 text-right border-b font-black bg-primary text-white">Moy Coef.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {currentClassData.filter((s:any) => 
                      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      s.matricule.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((student: any) => (
                      <tr key={student.id} className="hover:bg-muted/5 transition-all group cursor-pointer" onClick={() => window.location.href = `/eleves/${student.id}`}>
                        <td className="px-6 py-5 md:py-8 sticky left-0 bg-white z-10 group-hover:bg-muted/5">
                           <p className="font-black text-[10px] md:text-lg text-foreground uppercase truncate leading-tight">{student.lastName}</p>
                           <p className="text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase">{student.matricule}</p>
                        </td>
                        <td className="px-6 py-5 md:py-8">
                           <p className="font-bold text-[10px] md:text-lg text-foreground truncate leading-tight">{student.firstName}</p>
                        </td>
                        <td className="px-4 py-5 md:py-8 text-center font-bold text-muted-foreground text-[9px] md:text-sm">{student.gender?.[0] || 'M'}</td>
                        <td className="px-4 py-5 md:py-8 text-center font-black text-[10px] md:text-lg tabular-nums text-muted-foreground/60">{student.notes.int1 ?? '--'}</td>
                        <td className="px-4 py-5 md:py-8 text-center font-black text-[10px] md:text-lg tabular-nums text-muted-foreground/60">{student.notes.int2 ?? '--'}</td>
                        <td className="px-4 py-5 md:py-8 text-center font-black text-[10px] md:text-lg tabular-nums text-muted-foreground/60">{student.notes.int3 ?? '--'}</td>
                        <td className="px-4 py-5 md:py-8 text-center font-black text-[10px] md:text-lg tabular-nums text-muted-foreground/60">{student.notes.dev1 ?? '--'}</td>
                        <td className="px-4 py-5 md:py-8 text-center font-black text-[10px] md:text-lg tabular-nums text-muted-foreground/60">{student.notes.dev2 ?? '--'}</td>
                        <td className="px-6 py-5 md:py-8 text-center">
                          <Badge className={cn(
                            "h-8 md:h-12 w-12 md:w-20 justify-center rounded-lg md:rounded-xl text-[10px] md:text-xl font-black shadow-sm",
                            Number(student.average) >= 10 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                          )}>
                            {student.average}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 md:py-8 text-right">
                           <span className="font-black text-xs md:text-2xl text-primary tabular-nums">{student.weighted}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-8 md:p-14 bg-muted/5 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-4">
                    <div className="size-10 md:size-14 bg-white rounded-xl flex items-center justify-center shadow-sm"><ShieldCheck className="size-5 md:size-8 text-emerald-500" /></div>
                    <div className="text-left">
                       <p className="text-[10px] md:text-sm font-black uppercase text-foreground tracking-tight">Certification d'Intégrité</p>
                       <p className="text-[8px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Calcul automatisé par l'IA ACADEX v1.0</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button asChild variant="outline" className="flex-1 md:flex-none h-11 md:h-16 rounded-xl md:rounded-2xl border-2 font-black px-8 md:px-12 text-xs md:text-lg hover:bg-primary hover:text-white transition-all shadow-sm">
                       <Link href="/notes">Saisir de nouvelles notes</Link>
                    </Button>
                    <Button className="flex-1 md:flex-none h-11 md:h-16 rounded-xl md:rounded-2xl bg-primary font-black px-8 md:px-12 text-xs md:text-lg shadow-xl shadow-primary/20 transition-all active:scale-95">
                       Exporter Registre PDF
                    </Button>
                 </div>
              </div>
            </Card>
          </div>
        )}

        {/* 3. VUE VIDE (SÉCURITÉ) */}
        {!selectedClass && (userRole === "Enseignant" ? userClasses.length === 0 : !students || students.length === 0) && (
          <Card className="p-20 md:p-40 text-center border-4 border-dashed rounded-[3rem] md:rounded-[5rem] bg-white/50 opacity-40 flex flex-col items-center justify-center space-y-8">
             <div className="size-20 md:size-32 bg-muted rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center shadow-inner">
               <GraduationCap className="size-10 md:size-16 text-muted-foreground" />
             </div>
             <div className="space-y-2">
               <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Aucune classe assignée</h3>
               <p className="text-sm md:text-xl font-medium max-w-sm mx-auto">Veuillez contacter le Directeur pour sceller vos classes.</p>
             </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
