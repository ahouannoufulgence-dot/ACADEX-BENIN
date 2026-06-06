
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  UserSquare2, 
  Search, 
  Plus, 
  Filter, 
  BookOpen, 
  ChevronRight,
  ShieldCheck,
  Zap,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useMemo } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore"
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
  const db = useFirestore()
  
  const teachersQuery = useMemo(() => query(collection(db, "teachers"), orderBy("registeredAt", "desc")), [db])
  const { data: teachers, loading } = useCollection(teachersQuery)

  const filteredTeachers = useMemo(() => {
    if (!teachers) return []
    return teachers.filter((t: any) => 
      (t.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (t.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [teachers, searchTerm])

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
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Corps Enseignant</h1>
            <p className="text-muted-foreground mt-2 font-medium">Pilotage de votre équipe pédagogique réelle.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 bg-white font-black">
              <FileDown className="mr-2 size-5" /> Exporter Liste
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
              <Plus className="mr-2 size-5" /> Nouvel Enseignant
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Professeurs", value: teachers?.length || 0, icon: UserSquare2, color: "text-primary" },
            { label: "Matières Actives", value: teachers ? new Set(teachers.map((t: any) => t.subject)).size : 0, icon: BookOpen, color: "text-blue-600" },
            { label: "En attente", value: teachers?.filter((t: any) => t.status === 'En attente').length || 0, icon: Clock, color: "text-amber-600" },
            { label: "Vérifiés", value: teachers?.filter((t: any) => t.status === 'Actif').length || 0, icon: ShieldCheck, color: "text-emerald-600" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-muted rounded-2xl ${stat.color}`}><stat.icon className="size-6" /></div>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary" />
          <Input 
            placeholder="Chercher un enseignant..." 
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary size-10" /></div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center space-y-6">
               <div className="size-24 bg-muted rounded-full flex items-center justify-center">
                 <Users className="size-12 text-muted-foreground" />
               </div>
               <h3 className="text-2xl font-black">Aucun enseignant inscrit</h3>
               <p className="text-muted-foreground max-w-sm mx-auto">Les comptes apparaîtront ici dès que les professeurs auront validé leur inscription.</p>
            </div>
          ) : (
            <div className="divide-y divide-muted/30">
              {filteredTeachers.map((teacher: any) => (
                <div key={teacher.id} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-all group">
                   <div className="flex items-center gap-5">
                     <Avatar className="size-16 border-4 border-muted group-hover:border-primary/20 transition-all">
                       <AvatarFallback className="font-black text-xl">{(teacher.fullName || "??").substring(0, 2).toUpperCase()}</AvatarFallback>
                     </Avatar>
                     <div>
                       <h4 className="font-black text-xl">{teacher.fullName}</h4>
                       <div className="flex flex-wrap items-center gap-4 mt-1">
                         <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-3">{teacher.subject}</Badge>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                           <Phone className="size-3" /> {teacher.phone}
                         </span>
                         <Badge variant="outline" className={`font-black text-[10px] border-2 ${
                           teacher.status === 'Actif' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 
                           teacher.status === 'En attente' ? 'border-amber-100 text-amber-600 bg-amber-50' : 
                           'border-red-100 text-red-600 bg-red-50'
                         }`}>
                           {teacher.status?.toUpperCase()}
                         </Badge>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-12 rounded-2xl hover:bg-muted transition-all">
                            <MoreVertical className="size-6" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-2 p-2 shadow-xl">
                          <DropdownMenuItem onClick={() => updateStatus(teacher.id, "Actif")} className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer">
                            <CheckCircle2 className="size-5 text-emerald-500" /> Valider l'accès
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(teacher.id, "Suspendu")} className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer">
                            <UserX className="size-5 text-amber-500" /> Suspendre
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteTeacher(teacher.id)} className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer text-destructive focus:text-destructive">
                            <UserX className="size-5" /> Supprimer définitivement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" asChild className="size-12 rounded-2xl">
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
