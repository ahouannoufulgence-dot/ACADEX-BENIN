
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  GraduationCap,
  ChevronRight,
  MoreVertical,
  ArrowUpDown
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useState } from "react"

const students = [
  { id: "ELV-TLED-001", name: "Amoussou Marie", class: "3ème A", average: 14.2, rank: 5, status: "Actif" },
  { id: "ELV-TLED-042", name: "Dossou Marc", class: "4ème C", average: 11.0, rank: 18, status: "Actif" },
  { id: "ELV-TLED-003", name: "Koffi Djimon", class: "Terminale S1", average: 16.5, rank: 2, status: "Actif" },
  { id: "ELV-TLED-012", name: "Sossa Luc", class: "6ème B", average: 9.5, rank: 32, status: "Actif" },
  { id: "ELV-TLED-005", name: "Tidjani Amadou", class: "Terminale S1", average: 18.1, rank: 1, status: "Actif" },
].sort((a, b) => a.name.localeCompare(b.name))

export default function StudentsPage() {
  const [isAdding, setIsAdding] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Gestion des Élèves</h1>
            <p className="text-muted-foreground mt-2 font-medium">Répertoire complet des talents de l'établissement.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-12 rounded-2xl border-2 font-bold px-6 bg-white">
              <Filter className="mr-2 size-4" />
              Filtrer
            </Button>
            
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black text-lg">
                  <Plus className="mr-2 size-5" />
                  Nouvel Élève
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none p-10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Inscription Élève</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Nom</Label>
                      <Input placeholder="Ex: Dossou" className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Prénom</Label>
                      <Input placeholder="Ex: Marc" className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Classe</Label>
                    <Select>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Sélectionner la classe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6a">6ème A</SelectItem>
                        <SelectItem value="3d1">3ème D1</SelectItem>
                        <SelectItem value="tled1">Terminale D1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Téléphone Parent</Label>
                    <Input placeholder="+229 00 00 00 00" className="h-12 rounded-xl" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-bold">Annuler</Button>
                  <Button className="bg-primary rounded-xl font-black px-8">Enregistrer l'élève</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Chercher un élève par nom, matricule ou classe..." 
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary transition-all text-lg font-medium"
          />
        </div>

        {/* Students Table Style Grid */}
        <div className="grid gap-4">
          <div className="hidden md:grid grid-cols-12 px-8 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <div className="col-span-1">ID</div>
            <div className="col-span-4">Nom de l'élève</div>
            <div className="col-span-2 text-center">Classe</div>
            <div className="col-span-2 text-center">Moyenne</div>
            <div className="col-span-2 text-center">Rang</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          
          {students.map((student) => (
            <Link key={student.id} href={`/eleves/${student.id}`}>
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 md:p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                    <div className="col-span-1">
                      <Badge variant="outline" className="rounded-full border-muted font-black text-[10px] text-muted-foreground">
                        {student.id.split('-').pop()}
                      </Badge>
                    </div>
                    <div className="col-span-4 flex items-center gap-4">
                      <Avatar className="size-12 border-2 border-muted group-hover:border-primary/20 transition-all">
                        <AvatarImage src={`https://picsum.photos/seed/${student.id}/100/100`} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">{student.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-black text-foreground text-lg group-hover:text-primary transition-colors">{student.name}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <Badge className="bg-muted text-foreground font-black px-4 py-1 rounded-full border-none">
                        {student.class}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`text-xl font-black ${student.average >= 14 ? 'text-primary' : student.average >= 10 ? 'text-amber-600' : 'text-destructive'}`}>
                        {student.average}/20
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-lg font-black text-foreground">
                        {student.rank}<sup>{student.rank === 1 ? 'er' : 'ème'}</sup>
                      </span>
                    </div>
                    <div className="col-span-1 text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="rounded-xl group-hover:text-primary">
                        <ChevronRight className="size-6" />
                      </Button>
                    </div>
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
