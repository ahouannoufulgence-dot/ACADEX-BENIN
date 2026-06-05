"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { FileText, Clock, ShieldAlert, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AbsencesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground">Suivi des <span className="text-primary italic">Absences</span></h1>
            <p className="text-muted-foreground font-medium">Journal de ponctualité et justifications élèves.</p>
          </div>
          <Button className="bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20 rounded-2xl h-12 px-8 font-black">
            Signaler Absence
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-8 rounded-[2.5rem] bg-white text-center space-y-2">
            <div className="size-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto"><ShieldAlert className="size-8" /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Absences</p>
            <p className="text-4xl font-black">0</p>
          </Card>
          <Card className="p-8 rounded-[2.5rem] bg-white text-center space-y-2">
            <div className="size-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto"><CheckCircle2 className="size-8" /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Justifiées</p>
            <p className="text-4xl font-black">0</p>
          </Card>
          <Card className="p-8 rounded-[2.5rem] bg-white text-center space-y-2">
            <div className="size-16 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center mx-auto"><Clock className="size-8" /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Retards</p>
            <p className="text-4xl font-black">0</p>
          </Card>
        </div>

        <Card className="p-20 text-center rounded-[3rem] border-2 border-dashed border-muted bg-white/50">
          <FileText className="size-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-2xl font-black mb-2">Aucun incident enregistré</h3>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto">La liste des absences et retards de la journée s'affichera ici en temps réel.</p>
        </Card>
      </div>
    </DashboardLayout>
  )
}
