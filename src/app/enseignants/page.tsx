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
  Zap,
  FileDown,
  Users
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

// Mock data initialisé à zéro comme demandé précédemment
const teachers: any[] = []

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const handleAddNew = () => {
    toast({ title: "Module Inscription", description: "L'ajout manuel sera disponible après configuration des classes." })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Corps Enseignant</h1>
            <p className="text-muted-foreground mt-2 font-medium">Gestion et pilotage de l'équipe pédagogique.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6 bg-white">
              <FileDown className="mr-2 size-5" />
              Exporter Liste
            </Button>
            <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
              <Plus className="mr-2 size-5" />
              Nouvel Enseignant
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Professeurs", value: "0", icon: UserSquare2, color: "text-primary" },
            { label: "Matières Actives", value: "0", icon: BookOpen, color: "text-primary" },
            { label: "Heures / Semaine", value: "0h", icon: Zap, color: "text-amber-500" },
            { label: "Prof. Principaux", value: "0", icon: ShieldCheck, color: "text-emerald-500" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white group overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-6" />
                  </div>
                  <Badge variant="ghost" className="text-[10px] font-black uppercase">V1.0</Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Chercher un enseignant..." 
              className="pl-12 h-12 bg-white border-none shadow-sm rounded-2xl font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white">
            <Filter className="mr-2 size-4" /> Filtres Avancés
          </Button>
        </div>

        {/* Teachers List / Empty State */}
        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          {teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center space-y-6">
               <div className="size-24 bg-muted rounded-full flex items-center justify-center">
                 <Users className="size-12 text-muted-foreground" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black">Aucun enseignant enregistré</h3>
                 <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                   Commencez par ajouter les membres de votre équipe pédagogique pour piloter les classes et les notes.
                 </p>
               </div>
               <Button onClick={handleAddNew} className="bg-primary rounded-2xl h-12 px-10 font-bold">
                 Ajouter le premier enseignant
               </Button>
            </div>
          ) : (
            <div className="divide-y divide-muted/30">
              {/* Le rendu de la liste irait ici si teachers n'était pas vide */}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
