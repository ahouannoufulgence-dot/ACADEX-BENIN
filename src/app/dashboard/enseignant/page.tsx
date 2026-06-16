
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { 
  Users, 
  PenTool, 
  UserCheck, 
  Sparkles,
  BookOpen,
  Loader2,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Zap,
  BookMarked
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, onSnapshot } from "firebase/firestore"
import { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function TeacherDashboard() {
  const db = useFirestore()
  const [teacherName, setTeacherName] = useState("Monsieur")
  const [teacherClasses, setTeacherClasses] = useState<string[]>([])
  const [teacherSubject, setTeacherSubject] = useState("")
  const [mounted, setMounted] = useState(false)
  const [activeYear, setActiveYear] = useState("2026-2027")

  useEffect(() => {
    const year = localStorage.getItem('acadex_active_year') || "2026-2027"
    const userId = localStorage.getItem('acadex_user_id')
    setActiveYear(year)
    setMounted(true)

    if (userId && db) {
      // ÉCOUTE TEMPS RÉEL DES AFFECTATIONS DU DIRECTEUR
      const unsub = onSnapshot(doc(db, "teachers", userId), (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          const yearData = data.assignments?.[year] || {
            classes: data.classes || [],
            subject: data.subject || ""
          }
          setTeacherClasses(yearData.classes)
          setTeacherSubject(yearData.subject)
          setTeacherName(data.fullName || "Monsieur")
          
          // Mise à jour du cache local pour la navigation fluide
          localStorage.setItem('acadex_user_name', data.fullName || "Monsieur")
          localStorage.setItem('acadex_user_classes', JSON.stringify(yearData.classes))
          localStorage.setItem('acadex_user_subject', yearData.subject)
        }
      })
      return () => unsub()
    }
  }, [db])

  // On écoute aussi les changements d'année globale via l'event custom
  useEffect(() => {
    const handleYearChange = (e: any) => {
      const newYear = e.detail
      setActiveYear(newYear)
    }
    window.addEventListener('acadex_year_changed', handleYearChange)
    return () => window.removeEventListener('acadex_year_changed', handleYearChange)
  }, [])

  const studentsQuery = useMemo(() => {
    if (!db || teacherClasses.length === 0) return null
    return query(collection(db, "students"), where("classId", "in", teacherClasses), where("academicYear", "==", activeYear))
  }, [db, teacherClasses, activeYear])

  const { data: students, loading: loadingStudents } = useCollection(studentsQuery)

  const stats = useMemo(() => {
    if (!mounted) return []
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

    return [
      { title: "Mes Classes", value: teacherClasses.length.toString(), label: "Assignées", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
      { title: "Mes Élèves", value: (students?.length || 0).toString(), label: "Effectif Total", icon: BookOpen, color: "text-primary", bg: "bg-emerald-50" },
      { title: "Saisie Notes", value: "---", label: "Trimestre en cours", icon: PenTool, color: "text-amber-500", bg: "bg-amber-50" },
      { title: "Statut Présence", value: "OK", label: today, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    ]
  }, [students, teacherClasses, mounted])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="relative z-10 space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="relative min-h-[250px] md:min-h-[350px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl group">
          <Image 
            src="/images/bg-dashboard-enseignant.jpg"
            alt="Teacher Cockpit"
            fill
            className="object-cover brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          <div className="absolute inset-0 p-6 md:p-14 flex flex-col justify-end gap-4">
            <div className="space-y-2 md:space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-white text-[9px] md:text-xs font-black uppercase tracking-[0.2em]">
                <Zap className="size-3 text-primary fill-primary" /> Espace Pédagogique Acadex
              </div>
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl">
                Bonjour <br className="md:hidden" /> <span className="text-primary italic">M. {teacherName.split(' ')[0]}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary text-white border-none font-black px-4 md:px-6 py-2 rounded-full shadow-lg shadow-primary/30 uppercase tracking-widest text-[8px] md:text-xs">
                  {teacherSubject || "Chargement..."}
                </Badge>
                <div className="flex items-center gap-2 font-bold text-[9px] md:text-sm bg-white/10 backdrop-blur-md text-white/90 px-4 md:px-6 py-2 rounded-full border border-white/10">
                  <ShieldCheck className="size-3 md:size-4 text-emerald-400" /> Année {activeYear}
                </div>
              </div>
            </div>
            <div className="md:absolute md:right-12 md:bottom-12 mt-4 md:mt-0">
               <Button asChild className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-2xl rounded-2xl h-14 md:h-18 px-8 md:px-12 font-black text-base transition-all active:scale-95">
                 <Link href="/notes">
                   <PenTool className="mr-3 size-4 md:size-5" /> Saisir les Notes
                 </Link>
               </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, i) => (
            <Card key={stat.title} className="p-5 md:p-9 rounded-[2rem] md:rounded-[2.5rem] border-none shadow-sm flex flex-col justify-between bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all group relative overflow-hidden h-full">
              <div className={cn("absolute -top-4 -right-4 size-16 md:size-24 rounded-full opacity-[0.04]", stat.bg)} />
              <div className="flex items-center justify-between mb-4 md:mb-8">
                <div className={cn("p-2.5 md:p-4 rounded-xl md:rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm", stat.bg, stat.color)}>
                  <stat.icon className="size-3.5 md:size-6" />
                </div>
                <Badge variant="outline" className="border-none text-[7px] md:text-[9px] font-black uppercase bg-muted/50 px-2">LIVE</Badge>
              </div>
              <div>
                <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{stat.title}</p>
                <div className="text-lg md:text-3xl font-black text-foreground">
                  {loadingStudents && stat.title === "Mes Élèves" ? <Loader2 className="animate-spin size-4 md:size-6" /> : stat.value}
                </div>
                <p className="text-[7px] md:text-[9px] font-bold text-muted-foreground/40 mt-1 uppercase truncate">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
           <div className="lg:col-span-8 space-y-6 md:space-y-10">
              <Card className="border-none shadow-sm bg-white/95 rounded-[2rem] md:rounded-[3.5rem] overflow-hidden p-8 md:p-20 flex flex-col items-center justify-center text-center space-y-6 md:space-y-10">
                 <div className="size-20 md:size-32 bg-muted/40 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center shadow-inner group">
                    <Calendar className="size-10 md:size-16 text-muted-foreground opacity-30 group-hover:scale-110 transition-transform group-hover:text-primary group-hover:opacity-100" />
                 </div>
                 <div className="space-y-3 md:space-y-5">
                    <h3 className="text-xl md:text-4xl font-black tracking-tight text-foreground">Mon Emploi du Temps</h3>
                    <p className="text-sm md:text-xl font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">Consultez votre programme officiel scellé pour l'année {activeYear}.</p>
                 </div>
                 <Button asChild variant="outline" className="rounded-xl md:rounded-2xl font-black h-12 md:h-16 px-8 md:px-16 border-2 text-xs md:text-base hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95">
                    <Link href="/disponibilites">Ouvrir le Planning</Link>
                 </Button>
              </Card>
           </div>

           <div className="lg:col-span-4 space-y-6 md:space-y-10">
              <Link href="/eleves" className="block group">
                <Card className="p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-white/95 border-none shadow-sm hover:shadow-2xl transition-all relative overflow-hidden h-full border-2 border-transparent hover:border-primary/10">
                   <div className="flex items-center justify-between mb-8 md:mb-14">
                      <div className="size-12 md:size-16 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Users className="size-6 md:size-8" />
                      </div>
                      <div className="size-9 md:size-12 rounded-xl flex items-center justify-center bg-muted/30 opacity-40 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <ChevronRight className="size-5 md:size-6" />
                      </div>
                   </div>
                   <h3 className="text-xl md:text-3xl font-black mb-2 text-foreground tracking-tight">Répertoire Élèves</h3>
                   <p className="text-xs md:text-lg font-medium text-muted-foreground">Accès rapide aux fiches pédagogiques de vos classes.</p>
                </Card>
              </Link>

              <Card className="p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-primary/20 bg-primary/5 group hover:bg-primary/10 transition-all relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8 md:mb-10 relative z-10">
                  <div className="size-10 md:size-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5 animate-pulse">
                    <Sparkles className="size-5 md:size-8 text-primary fill-primary/10" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg md:text-2xl text-foreground">Assistant IA</h4>
                    <p className="text-[8px] md:text-[11px] font-black text-primary uppercase tracking-widest">Soutien Pédagogique</p>
                  </div>
                </div>
                <p className="text-xs md:text-base font-medium text-muted-foreground italic leading-relaxed mb-8 md:mb-12 relative z-10">
                  "Générez automatiquement les observations de fin de trimestre en analysant la progression réelle de vos élèves."
                </p>
                <Button asChild className="w-full bg-white text-primary hover:bg-white/90 border border-primary/10 rounded-xl md:rounded-2xl font-black h-11 md:h-16 shadow-sm active:scale-95 transition-all relative z-10">
                  <Link href="/assistant">Lancer l'Analyse IA</Link>
                </Button>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
