
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  UserSquare2, 
  Search, 
  Plus, 
  BookOpen, 
  ChevronRight,
  ShieldCheck,
  FileDown,
  Users,
  Loader2,
  Phone,
  CheckCircle2,
  UserX,
  MoreVertical,
  Clock,
  Mail,
  Zap
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { cn } from "@/lib/utils"

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [directorName, setDirectorName] = useState("le Directeur")
  const db = useFirestore()
  
  useEffect(() => {
    const name = localStorage.getItem('acadex_user_name')
    if (name) setDirectorName(name)
  }, [])

  // CLASSEMENT ALPHABÉTIQUE AUTOMATIQUE PAR NOM COMPLET (A-Z)
  const teachersQuery = useMemo(() => query(collection(db, "teachers"), orderBy("fullName", "asc")), [db])
  const { data: teachers, loading } = useCollection(teachersQuery)

  const filteredTeachers = useMemo(() => {
    if (!teachers) return []
    return teachers.filter((t: any) => 
      (t.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (t.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (t.officialId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [teachers, searchTerm])

  const stats = useMemo(() => {
    const total = teachers?.length || 0
    const active = teachers?.filter((t: any) => t.status === 'Actif').length || 0
    const pending = teachers?.filter((t: any) => t.status === 'En attente').length || 0
    const subjects = teachers ? new Set(teachers.map((t: any) => t.subject).filter(Boolean)).size : 0
    return { total, active, pending, subjects }
  }, [teachers])

  const updateStatus = (teacherId: string, newStatus: string) => {
    const teacherRef = doc(db, "teachers", teacherId)
    updateDoc(teacherRef, { status: newStatus })
      .then(() => toast({ title: "Statut mis à jour", description: `L'enseignant est désormais : ${newStatus}` }))
      .catch(async () => {
        const error = new FirestorePermissionError({
          path: teacherRef.path,
          operation: 'update',
          requestResourceData: { status: newStatus }
        })
        errorEmitter.emit('permission-error', error)
      })
  }

  const deleteTeacher = (teacherId: string) => {
    const teacherRef = doc(db, "teachers", teacherId)
    deleteDoc(teacherRef)
      .then(() => toast({ title: "Enseignant supprimé" }))
      .catch(async () => {
        const error = new FirestorePermissionError({ path: teacherRef.path, operation: 'delete' })
        errorEmitter.emit('permission-error', error)
      })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight uppercase">
              Équipe <span className="text-primary italic">Pédagogique</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span className="uppercase tracking-widest">Pilotage Stratégique • {directorName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-12 md:h-14 px-5 md:px-8 rounded-xl md:rounded-2xl border-2 font-black bg-white text-[10px] md:text-sm transition-all active:scale-95">
              <FileDown className="mr-2 size-3.5 md:size-5" /> Exporter
            </Button>
            <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 md:h-14 px-5 md:px-10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm transition-all active:scale-95">
              <Plus className="mr-2 size-4 md:size-5" /> Recruter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: "Total", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Actifs", value: stats.active, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Alerte", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Matières", value: stats.subjects, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((stat, i) => (
            <Card key={i} className="p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] border-none shadow-sm bg-white group hover:shadow-lg transition-all relative overflow-hidden">
               <div className={cn("absolute -top-4 -right-4 size-16 md:size-24 rounded-full opacity-[0.04]", stat.bg)} />
               <div className="flex items-center justify-between mb-4 md:mb-8 relative z-10">
                  <div className={cn("p-2.5 md:p-3.5 rounded-xl md:rounded-2xl shadow-sm transition-all group-hover:bg-primary group-hover:text-white", stat.bg, stat.color)}>
                    <stat.icon className="size-3.5 md:size-5" />
                  </div>
                  <Badge variant="outline" className="border-none text-[7px] md:text-[9px] font-black uppercase bg-muted/50 px-2">LIVE</Badge>
               </div>
               <div className="relative z-10">
                 <p className="text-[7px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{stat.label}</p>
                 <h3 className="text-xl md:text-4xl font-black text-foreground">{loading ? "..." : stat.value}</h3>
               </div>
            </Card>
          ))}
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Chercher un nom ou une matière..." 
            className="pl-12 h-13 md:h-16 bg-white border-none shadow-sm rounded-[1.2rem] md:rounded-[1.5rem] font-bold text-sm md:text-base placeholder:text-muted-foreground/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.2rem] md:rounded-[3rem] overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-30">
              <Loader2 className="animate-spin text-primary size-10 md:size-14" />
              <p className="font-black text-[10px] md:text-sm uppercase tracking-[0.3em] text-muted-foreground">Appel de l'équipe...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 opacity-40">
               <div className="size-20 md:size-32 bg-muted rounded-[2rem] md:rounded-[3rem] flex items-center justify-center shadow-inner border border-muted/50">
                  <UserSquare2 className="size-10 md:size-16 text-muted-foreground" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl md:text-3xl font-black uppercase text-foreground">Aucun enseignant</h3>
                 <p className="text-xs md:text-lg font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed">
                   La liste apparaîtra dès la validation des premiers comptes professeurs.
                 </p>
               </div>
            </div>
          ) : (
            <div className="divide-y divide-muted/30">
              {filteredTeachers.map((teacher: any) => (
                <div key={teacher.id} className="p-6 md:p-10 flex items-center justify-between hover:bg-muted/5 transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.01] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                      <Zap className="size-20 md:size-32" />
                   </div>
                   
                   <div className="flex items-center gap-4 md:gap-8 relative z-10">
                     <Avatar className="size-12 md:size-20 border-4 border-muted group-hover:border-primary/20 transition-all shadow-sm">
                       <AvatarFallback className="font-black text-sm md:text-2xl bg-primary/10 text-primary uppercase">
                        {(teacher.fullName || "??").substring(0, 2)}
                       </AvatarFallback>
                     </Avatar>
                     <div className="min-w-0">
                       <h4 className="font-black text-sm md:text-2xl text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate">{teacher.fullName}</h4>
                       <div className="flex flex-wrap items-center gap-2 md:gap-5 mt-1.5 md:mt-3">
                         <Badge className="bg-primary text-white border-none font-black text-[7px] md:text-[10px] px-2 md:px-4 py-0.5 md:py-1 uppercase shadow-sm">{teacher.subject}</Badge>
                         <div className="hidden sm:flex items-center gap-2 text-[9px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                           <Phone className="size-2.5 md:size-4 text-primary" /> {teacher.phone}
                         </div>
                         <div className="hidden sm:flex items-center gap-2 text-[9px] md:text-[11px] font-black text-muted-foreground/60 uppercase">
                           ID: {teacher.officialId}
                         </div>
                         <Badge variant="outline" className={cn(
                           "font-black text-[7px] md:text-[10px] border-2 uppercase px-2 md:px-4 rounded-full",
                           teacher.status === 'Actif' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 
                           teacher.status === 'En attente' ? 'border-amber-100 text-amber-600 bg-amber-50' : 
                           'border-red-100 text-red-600 bg-red-50'
                         )}>
                           {teacher.status || 'Inconnu'}
                         </Badge>
                       </div>
                     </div>
                   </div>

                   <div className="flex items-center gap-2 md:gap-4 relative z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-10 md:size-14 rounded-[0.8rem] md:rounded-[1.2rem] hover:bg-muted transition-all mobile-touch-target">
                            <MoreVertical className="size-5 md:size-7 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 md:w-64 rounded-2xl md:rounded-[1.8rem] border-2 p-2 shadow-2xl">
                          <DropdownMenuItem onClick={() => updateStatus(teacher.id, "Actif")} className="flex items-center gap-3 font-bold p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer">
                            <CheckCircle2 className="size-4 md:size-5 text-emerald-500" /> Valider l'accès
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(teacher.id, "Suspendu")} className="flex items-center gap-3 font-bold p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer">
                            <UserX className="size-4 md:size-5 text-amber-500" /> Suspendre
                          </DropdownMenuItem>
                          <div className="h-px bg-muted my-2" />
                          <DropdownMenuItem onClick={() => deleteTeacher(teacher.id)} className="flex items-center gap-3 font-bold p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer text-destructive focus:text-destructive">
                            <UserX className="size-4 md:size-5" /> Supprimer Dossier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" asChild className="size-10 md:size-14 rounded-[0.8rem] md:rounded-[1.2rem] group-hover:bg-primary group-hover:text-white transition-all shadow-sm mobile-touch-target">
                        <Link href={`/enseignants/${teacher.id}`}><ChevronRight className="size-5 md:size-7" /></Link>
                      </Button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
