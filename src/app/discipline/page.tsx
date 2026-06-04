
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  Filter, 
  History, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserX
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

const incidents = [
  { id: "1", name: "Dossou Marc", class: "4ème C", type: "Retard", description: "3ème retard cette semaine", date: "Aujourd'hui, 08:15", severity: "low", status: "Sanctionné" },
  { id: "2", name: "Koffi Djimon", class: "Terminale S1", type: "Excellent", description: "Félicitations du conseil pour son attitude", date: "Hier", severity: "positive", status: "Validé" },
  { id: "3", name: "Sossa Luc", class: "6ème B", type: "Bavardage", description: "Perturbation répétée en classe de SVT", date: "Il y a 2 jours", severity: "medium", status: "Averti" },
  { id: "4", name: "Tidjani Amadou", class: "Terminale S1", type: "Retard", description: "Retard 10min", date: "Il y a 3 jours", severity: "low", status: "Classé" },
  { id: "5", name: "Amoussou Marie", class: "3ème A", type: "Sanction", description: "Non-respect du règlement (uniforme)", date: "Il y a 1 semaine", severity: "high", status: "Exclusion temporaire" },
]

export default function DisciplinePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Carnet de Discipline</h1>
            <p className="text-muted-foreground mt-2 font-medium">Suivi comportemental et éthique des élèves Acadex.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6">
              <History className="mr-2 size-4" />
              Historique Sanctions
            </Button>
            <Button className="bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20 rounded-2xl h-12 px-8 font-bold">
              <Plus className="mr-2 size-5" />
              Signaler Incident
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Incidents", value: "24", icon: ShieldAlert, color: "text-primary" },
            { label: "Exclusions", value: "2", icon: UserX, color: "text-destructive" },
            { label: "Retards Mois", value: "48", icon: Clock, color: "text-amber-600" },
            { label: "Taux Conduite", value: "96.4%", icon: CheckCircle2, color: "text-primary" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-muted rounded-2xl group-hover:${stat.color.replace('text', 'bg')} group-hover:text-white transition-all`}>
                    <stat.icon className="size-6" />
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none font-bold">Hebdo</Badge>
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Incident List */}
        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-2xl font-black">Journal des Incidents</CardTitle>
                <CardDescription className="font-medium">Dernières observations comportementales enregistrées</CardDescription>
              </div>
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary" />
                <Input placeholder="Rechercher un élève..." className="pl-12 h-12 bg-muted/50 border-none rounded-2xl font-bold shadow-none" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-muted/30">
              {incidents.map((incident) => (
                <div key={incident.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 hover:bg-muted/10 transition-colors group">
                  <div className="flex items-center gap-6 mb-4 md:mb-0">
                    <Avatar className="size-14 border-4 border-white shadow-md group-hover:border-primary/20 transition-all">
                      <AvatarImage src={`https://picsum.photos/seed/${incident.id}/150/150`} />
                      <AvatarFallback>{incident.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{incident.name}</h4>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="rounded-full border-muted text-muted-foreground font-black text-[10px]">{incident.class}</Badge>
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {incident.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 md:mx-12 mb-4 md:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`font-black rounded-full px-4 ${
                        incident.severity === 'high' ? 'bg-destructive' : 
                        incident.severity === 'medium' ? 'bg-amber-500' : 
                        incident.severity === 'positive' ? 'bg-primary' : 'bg-foreground'
                      }`}>
                        {incident.type}
                      </Badge>
                      {incident.severity === 'high' && <AlertTriangle className="size-4 text-destructive animate-pulse" />}
                    </div>
                    <p className="text-sm font-medium text-foreground/80 italic">"{incident.description}"</p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Statut Dossier</p>
                      <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black bg-primary/5">{incident.status}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      <ChevronRight className="size-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-muted/20 border-t border-muted/30">
              <Button variant="ghost" className="w-full text-primary font-black h-12 rounded-2xl hover:bg-primary hover:text-white transition-all">
                Voir tous les records disciplinaires
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
