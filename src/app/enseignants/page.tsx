"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  UserSquare2, 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Phone, 
  BookOpen, 
  GraduationCap,
  ChevronRight,
  MoreVertical,
  ShieldCheck,
  Zap
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const teachers = [
  { id: "ENS-MATH-001", name: "M. Dossou Marc", subject: "Mathématiques", classes: ["3D1", "Tle D2", "4C"], phone: "+229 97 01 02 03", status: "Actif", isFormTeacher: true },
  { id: "ENS-FR-001", name: "Mme. Amoussou Julie", subject: "Français", classes: ["6A", "5B", "3D2"], phone: "+229 96 11 22 33", status: "Actif", isFormTeacher: false },
  { id: "ENS-PC-001", name: "M. Tidjani Amadou", subject: "Physique-Chimie", classes: ["Tle C", "1ère D1", "2nde C"], phone: "+229 95 44 55 66", status: "En Congé", isFormTeacher: true },
  { id: "ENS-SVT-001", name: "Mme. Sossa Marie", subject: "SVT", classes: ["3D1", "3D2", "4A"], phone: "+229 94 77 88 99", status: "Actif", isFormTeacher: false },
]

export default function TeachersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Corps Enseignant</h1>
            <p className="text-muted-foreground mt-2 font-medium">Gestion des professeurs et attribution des classes.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6">
              Emploi du temps Global
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
              <Plus className="mr-2 size-5" />
              Nouvel Enseignant
            </Button>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Profs", value: "48", icon: UserSquare2, color: "bg-primary" },
            { label: "Matières", value: "18", icon: BookOpen, color: "bg-primary" },
            { label: "Cours / Sem", value: "240h", icon: Zap, color: "bg-amber-500" },
            { label: "Pr. Principaux", value: "24", icon: ShieldCheck, color: "bg-emerald-500" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white group overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${stat.color} text-white rounded-2xl group-hover:scale-110 transition-transform`}>
                    <stat.icon className="size-6" />
                  </div>
                  <Badge variant="ghost" className="text-[10px] font-black">2025-2026</Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Teachers List */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative group flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input placeholder="Chercher par nom, matière ou ID..." className="pl-12 h-12 bg-white border-none shadow-sm rounded-2xl font-bold" />
            </div>
            <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6">
              <Filter className="mr-2 size-4" /> Filtres
            </Button>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <div className="divide-y divide-muted/30">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-8 hover:bg-muted/10 transition-all group">
                  <div className="flex items-center gap-6 mb-4 lg:mb-0">
                    <div className="relative">
                      <Avatar className="size-16 border-4 border-white shadow-md group-hover:border-primary/20 transition-all">
                        <AvatarImage src={`https://picsum.photos/seed/${teacher.id}/200/200`} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{teacher.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {teacher.isFormTeacher && (
                        <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1.5 rounded-full shadow-lg border-2 border-white" title="Professeur Principal">
                          <ShieldCheck className="size-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{teacher.name}</h4>
                        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black text-[10px] uppercase">{teacher.id}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="size-3" /> {teacher.subject}</span>
                        <span className="flex items-center gap-1"><Phone className="size-3" /> {teacher.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 lg:mx-12 mb-4 lg:mb-0">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Classes Assignées</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.classes.map((cls) => (
                        <Badge key={cls} className="bg-muted text-foreground hover:bg-primary hover:text-white rounded-xl font-bold px-3 py-1 cursor-default transition-colors">
                          {cls}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Status</p>
                      <Badge className={`rounded-full px-4 font-black ${teacher.status === 'Actif' ? 'bg-primary' : 'bg-destructive/10 text-destructive border-none'}`}>
                        {teacher.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <ChevronRight className="size-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <MoreVertical className="size-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-muted/20 border-t border-muted/30 text-center">
              <Button variant="ghost" className="text-primary font-black h-12 rounded-2xl hover:bg-transparent">
                Afficher tous les collaborateurs (48)
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}