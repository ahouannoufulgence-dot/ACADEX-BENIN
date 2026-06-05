"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Shapes, Plus, Search, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ClassesPage() {
  const classes = [
    { id: "6A", name: "6ème A", level: "Premier Cycle", count: 32 },
    { id: "3D1", name: "3ème D1", level: "Premier Cycle", count: 45 },
    { id: "TD1", name: "Terminale D1", level: "Second Cycle", count: 38 },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground">Gestion des <span className="text-primary italic">Classes</span></h1>
            <p className="text-muted-foreground font-medium">Configurez les divisions et effectifs par niveau.</p>
          </div>
          <Button className="bg-primary shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
            <Plus className="mr-2 size-5" /> Nouvelle Classe
          </Button>
        </div>

        <div className="grid gap-4">
          {classes.map((cls) => (
            <Card key={cls.id} className="p-6 rounded-[2rem] border-none shadow-sm flex items-center justify-between bg-white hover:shadow-xl transition-all group">
              <div className="flex items-center gap-6">
                <div className="size-16 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Shapes className="size-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black">{cls.name}</h3>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20">{cls.level}</Badge>
                    <span className="text-xs font-bold text-muted-foreground">{cls.count} Élèves inscrits</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-12 rounded-2xl"><ChevronRight /></Button>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
