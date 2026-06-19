
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
  ShieldCheck,
  Plus,
  User,
  Zap,
  Filter
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userClasses, setUserClasses] = useState<string[]>([])
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role'))
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  const isTeacher = userRole === "Enseignant"
  const isDirector = userRole === "Directeur"

  useEffect(() => {
    if (!userRole) return

    const fetchStudents = async () => {
      setLoadingStudents(true)
      let queryBuilder = supabase.from('students').select('*').eq('academic_year', activeYear).order('last_name', { ascending: true })

      if (isTeacher) {
        if (userClasses.length === 0) { setStudents([]); setLoadingStudents(false); return }
        queryBuilder = queryBuilder.in('class_id', userClasses)
      } else if (!isDirector) {
        setStudents([])
        setLoadingStudents(false)
        return
      }

      const { data } = await queryBuilder
      setStudents(data || [])
      setLoadingStudents(false)
    }
    fetchStudents()
  }, [userRole, activeYear, isTeacher, isDirector, userClasses])

  const filteredStudents = useMemo(() => {
    if (!students) return []
    let list = students
    if (selectedClass) list = list.filter((s: any) => s.class_id === selectedClass)
    
    return list.filter((s: any) => 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.matricule && s.matricule.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [students, searchTerm, selectedClass])

  const stats = useMemo(() => {
    if (!students) return { total: 0, boys: 0, girls: 0 }
    return {
      total: students.length,
      boys: students.filter((s: any) => s.gender === "Masculin").length,
      girls: students.filter((s: any) => s.gender === "Féminin").length
    }
  }, [students])

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
              Répertoire <span className="text-primary italic">Élèves</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[9px] md:text-sm">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span className="uppercase tracking-widest">Base de Données Certifiée • {activeYear}</span>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {isDirector && (
              <Button asChild className="flex-1 md:flex-none bg-primary shadow-xl rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-8 font-black text-[10px] md:text-sm active:scale-95 transition-all">
                <Link href="/eleves/identifiants"><Plus className="mr-2 size-3.5 md:size-4" /> Nouveaux Codes</Link>
              </Button>
            )}
            <Button variant="outline" className="flex-1 md:flex-none rounded-xl md:rounded-2xl border-2 font-black h-11 md:h-14 px-4 md:px-6 hover:bg-muted transition-all text-[10px] md:text-sm">
              <Filter className="mr-2 size-3.5 md:size-4" /> Filtres
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
           {[
             { label: "Total Élèves", val: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Garçons", val: stats.boys, icon: User, color: "text-primary", bg: "bg-emerald-50" },
             { label: "Filles", val: stats.girls, icon: User, color: "text-pink-600", bg: "bg-pink-50" },
             { label: "Actifs", val: "100%", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" }
           ].map((s, i) => (
             <Card key={i} className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col justify-between group h-24 md:h-44 relative overflow-hidden">
                <div className={cn("absolute -top-4 -right-4 size-14 md:size-24 rounded-full opacity-[0.05]", s.bg)} />
                <div className={cn("p-2 md:p-4 rounded-lg md:rounded-2xl w-fit mb-2 md:mb-6 shadow-sm", s.bg, s.color)}>
                  <s.icon className="size-4 md:size-7" />
                </div>
                <div>
                   <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
                   <h4 className="text-sm md:text-3xl font-black tabular-nums">{loadingStudents ? "..." : s.val}</h4>
                </div>
             </Card>
           ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 md:size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Chercher un nom, un prénom ou un matricule..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-12 h-12 md:h-16 rounded-xl md:rounded-[1.8rem] bg-white border-none shadow-sm font-bold text-xs md:text-base placeholder:text-muted-foreground/30" 
            />
          </div>
          {isTeacher && userClasses.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {userClasses.sort().map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(selectedClass === c ? null : c)}
                  className={cn(
                    "px-5 py-2 rounded-full font-black text-[9px] md:text-xs uppercase tracking-widest whitespace-nowrap transition-all border-2",
                    selectedClass === c ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-transparent hover:border-muted"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] overflow-hidden min-h-[400px]">
          {loadingStudents ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-20">
              <Loader2 className="animate-spin text-primary size-10 md:size-12" />
              <p className="font-black text-[10px] uppercase tracking-widest">Ouverture des dossiers...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-30">
               <div className="size-20 md:size-28 bg-muted rounded-full flex items-center justify-center shadow-inner"><Users className="size-10 md:size-14 text-muted-foreground" /></div>
               <div className="space-y-1">
                 <h3 className="text-xl md:text-3xl font-black uppercase text-foreground">Aucun profil identifié</h3>
                 <p className="text-[10px] md:text-lg font-medium text-muted-foreground">Vérifiez l'orthographe ou le filtre de classe.</p>
               </div>
            </div>
          ) : (
            <div className="divide-y divide-muted/10">
              {filteredStudents.map((s: any) => (
                <Link key={s.id} href={`/eleves/${s.id}`} className="block group">
                  <div className="p-4 md:p-10 flex items-center justify-between hover:bg-muted/5 transition-all relative overflow-hidden">
                    <div className="flex items-center gap-4 md:gap-10 relative z-10">
                      <Avatar className="size-12 md:size-24 border-4 border-muted group-hover:border-primary/20 transition-all shadow-sm">
                        <AvatarImage src={`https://picsum.photos/seed/${s.id}/400/400`} />
                        <AvatarFallback className="font-black text-sm md:text-3xl bg-primary/5 text-primary">
                          {s.last_name[0]}{s.first_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                           <h4 className="font-black text-sm md:text-3xl text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate">{s.last_name} {s.first_name}</h4>
                           <Badge className="bg-primary text-white font-black text-[7px] md:text-[10px] px-2 md:px-4 py-0.5 rounded-full shadow-sm">{s.class_id}</Badge>
                        </div>
                        <div className="flex items-center gap-3 md:gap-6 mt-1.5 md:mt-3">
                           <div className="flex items-center gap-1.5 text-[8px] md:text-sm font-bold text-muted-foreground/60 uppercase">
                              <span className="font-black text-primary/40">ID:</span> {s.matricule}
                           </div>
                           <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                              <span className="font-black text-primary/40">GENRE:</span> {s.gender}
                           </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-12 relative z-10">
                       <div className="hidden md:block text-right">
                          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Statut</p>
                          <Badge variant="outline" className="font-black text-[10px] border-emerald-100 text-emerald-600 bg-emerald-50 px-3">ACTIF</Badge>
                       </div>
                       <Button variant="ghost" size="icon" className="size-10 md:size-16 rounded-[1rem] md:rounded-3xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0">
                         <ChevronRight className="size-5 md:size-8 transition-transform group-hover:translate-x-1" />
                       </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Footer Discret Certification */}
        <div className="flex items-center justify-center gap-6 py-4 opacity-30">
           <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest"><ShieldCheck className="size-3 text-emerald-500" /> Profils Scellés</div>
           <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest"><Users className="size-3 text-blue-500" /> Registre Live</div>
        </div>
      </div>
    </DashboardLayout>
  )
}
