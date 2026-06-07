
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
  Clock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, doc, updateDoc, deleteDoc } from "firebase/firestore"
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

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [directorName, setDirectorName] = useState("le Directeur")
  const db = useFirestore()
  
  useEffect(() => {
    const name = localStorage.getItem('acadex_user_name')
    if (name) setDirectorName(name)
  }, [])

  // Requête simplifiée sans orderBy pour éviter les erreurs d'index ou les docs masqués
  const teachersQuery = useMemo(() => query(collection(db, "teachers")), [db])
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
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Bonjour Monsieur <span className="text-primary italic">{directorName}</span>,
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">Pilotage et gestion du corps enseignant de l'établissement.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 bg-white font-black">
              <FileDown className="mr-2 size-5" /> Exporter Liste
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
              <Plus className="mr-2 size-5" /> Recruter
            </Button>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users className="size-6" /></div>
              <Badge variant="outline" className="font-black text-[10px]">TOTAL</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Professeurs</p>
            <p className="text-3xl font-black text-foreground mt-1">{loading ? "..." : stats.total}</p>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck className="size-6" /></div>
              <Badge variant="outline" className="font-black text-[10px] border-emerald-200 text-emerald-600">VÉRIFIÉS</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Accès Actifs</p>
            <p className="text-3xl font-black text-foreground mt-1">{loading ? "..." : stats.active}</p>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock className="size-6" /></div>
              <Badge variant="outline" className="font-black text-[10px] border-amber-200 text-amber-600">ALERTE</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">En attente</p>
            <p className="text-3xl font-black text-foreground mt-1">{loading ? "..." : stats.pending}</p>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><BookOpen className="size-6" /></div>
              <Badge variant="outline" className="font-black text-[10px]">PÉDAGOGIE</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Disciplines</p>
            <p className="text-3xl font-black text-foreground mt-1">{loading ? "..." : stats.subjects}</p>
          </Card>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Chercher un nom ou une matière..." 
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="animate-spin text-primary size-10" />
              <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Chargement de l'équipe...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center space-y-6 opacity-30">
               <UserSquare2 className="size-24 text-muted-foreground" />
               <div className="space-y-2">
                 <h3 className="text-2xl font-black">Aucun enseignant</h3>
                 <p className="text-muted-foreground max-w-sm mx-auto font-medium">La liste des professeurs apparaîtra dès la validation des premiers comptes.</p>
               </div>
            </div>
          ) : (
            <div className="divide-y divide-muted/30">
              {filteredTeachers.map((teacher: any) => (
                <div key={teacher.id} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                   <div className="flex items-center gap-6">
                     <Avatar className="size-16 border-4 border-muted group-hover:border-primary/20 transition-all shadow-sm">
                       <AvatarFallback className="font-black text-xl bg-primary/10 text-primary">
                        {(teacher.fullName || "??").substring(0, 2).toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                     <div>
                       <h4 className="font-black text-xl text-foreground group-hover:text-primary transition-colors">{teacher.fullName}</h4>
                       <div className="flex flex-wrap items-center gap-4 mt-1">
                         <Badge className="bg-primary text-white border-none font-black text-[10px] px-3">{teacher.subject}</Badge>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                           <Phone className="size-3 text-primary" /> {teacher.phone}
                         </span>
                         <span className="text-[10px] font-black text-muted-foreground uppercase">{teacher.officialId}</span>
                         <Badge variant="outline" className={`font-black text-[9px] border-2 uppercase ${
                           teacher.status === 'Actif' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 
                           teacher.status === 'En attente' ? 'border-amber-100 text-amber-600 bg-amber-50' : 
                           'border-red-100 text-red-600 bg-red-50'
                         }`}>
                           {teacher.status || 'Inconnu'}
                         </Badge>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-12 rounded-2xl hover:bg-muted transition-all">
                            <MoreVertical className="size-6 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-2 p-2 shadow-xl">
                          <DropdownMenuItem onClick={() => updateStatus(teacher.id, "Actif")} className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer">
                            <CheckCircle2 className="size-5 text-emerald-500" /> Valider l'accès
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(teacher.id, "Suspendu")} className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer">
                            <UserX className="size-5 text-amber-500" /> Suspendre
                          </DropdownMenuItem>
                          <div className="h-px bg-muted my-1" />
                          <DropdownMenuItem onClick={() => deleteTeacher(teacher.id)} className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer text-destructive focus:text-destructive">
                            <UserX className="size-5" /> Supprimer définitivement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" asChild className="size-12 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <Link href={`/enseignants/${teacher.id}`}><ChevronRight /></Link>
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
