
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  GraduationCap,
  Award,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const students = [
  { id: "1", name: "Koffi Djimon", class: "Terminale S1", average: 16.5, rank: 2, status: "Actif", photo: "1" },
  { id: "2", name: "Amoussou Marie", class: "3ème A", average: 14.2, rank: 5, status: "Actif", photo: "2" },
  { id: "3", name: "Tidjani Amadou", class: "Terminale S1", average: 18.1, rank: 1, status: "Actif", photo: "3" },
  { id: "4", name: "Sossa Luc", class: "6ème B", average: 9.5, rank: 32, status: "Actif", photo: "4" },
  { id: "5", name: "Dossou Marc", class: "4ème C", average: 11.0, rank: 18, status: "Exclu", photo: "5" },
]

export default function StudentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestion des Élèves</h1>
            <p className="text-muted-foreground mt-1">Gérez les profils, les performances et le suivi disciplinaire.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 rounded-full border-2">
              <Filter className="mr-2 size-4" />
              Filtrer par classe
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full h-11 px-6">
              <Plus className="mr-2 size-4" />
              Nouvel Élève
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Rechercher un élève par nom, matricule ou classe..." 
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary transition-all text-lg"
          />
        </div>

        {/* Students Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map((student) => (
            <Link key={student.id} href={`/eleves/${student.id}`}>
              <Card className="card-hover-effect border-none shadow-sm bg-white overflow-hidden group cursor-pointer">
                <div className="h-2 bg-primary w-full" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <Avatar className="size-16 border-4 border-muted shadow-sm group-hover:border-primary/20 transition-all">
                      <AvatarImage src={`https://picsum.photos/seed/${student.id}/200/200`} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{student.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <Badge variant={student.status === 'Actif' ? 'default' : 'destructive'} className="rounded-full">
                      {student.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{student.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="size-3" />
                      {student.class}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-muted">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Moyenne</p>
                      <p className={`text-lg font-black ${student.average >= 12 ? 'text-primary' : student.average >= 10 ? 'text-foreground' : 'text-destructive'}`}>
                        {student.average}/20
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Rang</p>
                      <p className="text-lg font-black text-foreground">
                        {student.rank}<sup>{student.rank === 1 ? 'er' : 'ème'}</sup>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Voir le carnet de suivi
                    <ChevronRight className="size-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
