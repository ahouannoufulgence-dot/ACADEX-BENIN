"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { BookOpen, Plus, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SubjectsPage() {
  const subjects = [
    { name: "Mathématiques", code: "MATH", coef: 5, category: "Scientifique" },
    { name: "Français", code: "FRAN", coef: 3, category: "Littéraire" },
    { name: "Physique-Chimie", code: "PHYS", coef: 4, category: "Scientifique" },
    { name: "Anglais", code: "ANGL", coef: 2, category: "Langue" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground">Catalogue des <span className="text-primary italic">Matières</span></h1>
            <p className="text-muted-foreground font-medium">Définissez les coefficients et catégories d'enseignement.</p>
          </div>
          <Button className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
            <Plus className="mr-2 size-5" /> Ajouter une Matière
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((sub) => (
            <Card key={sub.code} className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="size-14 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <BookOpen className="size-7" />
                </div>
                <Badge className="bg-primary/5 text-primary border-none font-black px-4">COEF: {sub.coef}</Badge>
              </div>
              <h3 className="text-2xl font-black mb-1">{sub.name}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Zap className="size-3 text-amber-500 fill-amber-500" /> {sub.category}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
