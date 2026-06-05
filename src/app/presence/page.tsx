
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  UserX, 
  History, 
  MapPin, 
  Smartphone,
  ShieldCheck,
  Calendar as CalendarIcon,
  ChevronRight,
  Loader2,
  FileText
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

const mockPresenceToday = [
  { id: "1", name: "M. Dossou Marc", subject: "Maths", expected: "08:00", actual: "07:54", status: "Présent", lateness: 0 },
  { id: "2", name: "Mme. Amoussou Julie", subject: "Français", expected: "08:00", actual: "08:14", status: "Retard", lateness: 14 },
  { id: "3", name: "M. Tidjani Amadou", subject: "Physique", expected: "10:00", actual: "--:--", status: "Absent", lateness: 0 },
  { id: "4", name: "Mme. Sossa Marie", subject: "SVT", expected: "08:00", actual: "07:45", status: "Présent", lateness: 0 },
]

export default function PresencePage() {
  const [userRole, setUserRole] = useState("")
  const [userName, setUserName] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [hasClockedIn, setHasClockedIn] = useState(false)

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role') || "Directeur")
    setUserName(localStorage.getItem('acadex_user_name') || "Utilisateur")
    setMounted(true)
  }, [])

  const handleClockIn = () => {
    setIsClockingIn(true)
    setTimeout(() => {
      setIsClockingIn(false)
      setHasClockedIn(true)
      toast({
        title: "Pointage réussi",
        description: `Arrivée enregistrée à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
      })
    }, 1500)
  }

  const isDirector = userRole.toLowerCase() === "directeur"

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              {isDirector ? "Pilotage de Présence" : "Mon Émargement"}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {isDirector 
                ? "Suivi de ponctualité et d'assiduité du corps enseignant." 
                : "Enregistrez votre arrivée sur le campus en un clic."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6">
              <History className="mr-2 size-5" />
              Historique
            </Button>
            {isDirector && (
              <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
                Rapport Mensuel
              </Button>
            )}
          </div>
        </div>

        {isDirector ? (
          /* DIRECTOR DASHBOARD */
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { label: "Présents", value: "24", sub: "Sur 29", icon: UserCheck, color: "text-primary" },
                { label: "En Retard", value: "3", sub: "Aujourd'hui", icon: Clock, color: "text-amber-500" },
                { label: "Absents", value: "2", sub: "Non justifiés", icon: UserX, color: "text-destructive" },
                { label: "Taux Ponctualité", value: "92%", sub: "Mois en cours", icon: ShieldCheck, color: "text-primary" },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                        <stat.icon className="size-6" />
                      </div>
                      <Badge variant="ghost" className="text-[10px] font-black">LIVE</Badge>
                    </div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-foreground">{stat.value}</span>
                      <span className="text-xs font-bold text-muted-foreground">{stat.sub}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b">
                <CardTitle className="text-2xl font-black">Émargement du {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</CardTitle>
                <CardDescription>Flux de présence des enseignants en temps réel</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-muted/30">
                  {mockPresenceToday.map((p) => (
                    <div key={p.id} className="p-7 hover:bg-muted/5 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className={`size-14 rounded-2xl flex items-center justify-center font-black text-xl ${
                          p.status === 'Présent' ? 'bg-primary/10 text-primary' : 
                          p.status === 'Retard' ? 'bg-amber-50 text-amber-600' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {p.name[0]}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{p.name}</h4>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="rounded-full border-muted text-muted-foreground text-[10px] font-black uppercase">{p.subject}</Badge>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <Clock className="size-3" /> Prévu : {p.expected}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Pointage</p>
                          <p className="text-sm font-black text-foreground">{p.actual}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Statut</p>
                          <Badge className={`rounded-full px-4 font-black ${
                            p.status === 'Présent' ? 'bg-primary' : 
                            p.status === 'Retard' ? 'bg-amber-500' : 'bg-destructive'
                          }`}>
                            {p.status} {p.lateness > 0 && `(${p.lateness} min)`}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/5 group-hover:text-primary">
                          <ChevronRight className="size-6" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-foreground text-white p-10 rounded-[3rem] relative overflow-hidden group">
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="size-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                  <UserCheck className="size-10 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-black italic">"Tous les cours de 08h ont été assurés."</h3>
                  <p className="text-white/70 font-medium leading-relaxed">
                    L'intelligence ACADEX a vérifié le pointage de tous les enseignants du premier créneau. Aucune alerte d'absence majeure détectée.
                  </p>
                </div>
                <Button variant="secondary" className="rounded-2xl h-14 px-10 font-black">Voir Analyse de Session</Button>
              </div>
              <ShieldCheck className="absolute -bottom-12 -right-12 size-64 text-white/5 pointer-events-none" />
            </Card>
          </div>
        ) : (
          /* TEACHER VIEW */
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-8">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden p-1">
                <div className={`p-12 text-center space-y-8 ${hasClockedIn ? 'bg-primary/5' : 'bg-muted/20'}`}>
                  <div className={`size-28 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl transition-all duration-500 ${hasClockedIn ? 'bg-primary text-white scale-110' : 'bg-white text-muted-foreground'}`}>
                    {hasClockedIn ? <CheckCircle2 className="size-14" /> : <Clock className="size-14" />}
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-foreground">
                      {hasClockedIn ? "Vous êtes bien arrivé !" : "Prêt pour votre journée ?"}
                    </h2>
                    <p className="text-muted-foreground font-medium text-lg">
                      {hasClockedIn 
                        ? `Pointage validé à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.` 
                        : "Enregistrez votre présence dès votre arrivée dans l'enceinte de l'école."}
                    </p>
                  </div>

                  <Button 
                    onClick={handleClockIn}
                    disabled={hasClockedIn || isClockingIn}
                    className={`w-full max-w-sm h-20 rounded-[2rem] text-xl font-black shadow-2xl transition-all active:scale-95 ${
                      hasClockedIn 
                        ? 'bg-emerald-500 text-white cursor-default' 
                        : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                    }`}
                  >
                    {isClockingIn ? <Loader2 className="size-8 animate-spin mr-3" /> : hasClockedIn ? <CheckCircle2 className="size-8 mr-3" /> : null}
                    {isClockingIn ? "Validation..." : hasClockedIn ? "PRÉSENCE VALIDÉE" : "JE SUIS ARRIVÉ"}
                  </Button>

                  <div className="flex items-center justify-center gap-6 pt-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-2"><MapPin className="size-3" /> Campus Principal</div>
                    <div className="size-1 bg-muted-foreground/30 rounded-full" />
                    <div className="flex items-center gap-2"><Smartphone className="size-3" /> Appareil Vérifié</div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="premium-card p-8">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3"><FileText className="text-primary" /> Justifier une absence</h3>
                  <p className="text-sm text-muted-foreground font-medium mb-6 leading-relaxed">
                    Un imprévu ? Déposez votre justificatif ou demandez une permission d'absence en quelques secondes.
                  </p>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-2 font-bold">Soumettre Justificatif</Button>
                </Card>
                <Card className="premium-card p-8">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3"><History className="text-primary" /> Mon Assiduité</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted-foreground">Taux de présence (Mai)</span>
                      <span className="text-primary">96%</span>
                    </div>
                    <Progress value={96} className="h-2 rounded-full" />
                    <p className="text-[10px] text-muted-foreground font-medium italic">Objectif institutionnel : 95%</p>
                  </div>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <CardTitle className="text-xl font-black mb-6 flex items-center gap-2">
                  <CalendarIcon className="size-5 text-primary" />
                  Prochains Cours
                </CardTitle>
                <div className="space-y-4">
                  {[
                    { class: "Terminale D1", time: "08:00 - 10:00", subject: "Mathématiques", room: "Salle 12" },
                    { class: "3ème D2", time: "10:15 - 12:15", subject: "Mathématiques", room: "Amphi B" },
                  ].map((course, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <Badge className="bg-primary font-black px-3">{course.class}</Badge>
                        <span className="text-xs font-black text-primary flex items-center gap-1">
                          <Clock className="size-3" /> {course.time}
                        </span>
                      </div>
                      <h4 className="font-black text-lg">{course.subject}</h4>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">{course.room}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-none shadow-sm bg-amber-50 rounded-[2.5rem] p-8 border-l-8 border-amber-500">
                <div className="flex gap-4">
                  <div className="p-3 bg-amber-500 rounded-2xl text-white h-fit shadow-lg shadow-amber-500/20">
                    <AlertCircle className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-amber-900 leading-tight">Rappel Ponctualité</h4>
                    <p className="text-sm text-amber-800/80 font-medium leading-relaxed">
                      L'administration vous rappelle que le pointage doit être effectué au plus tard 5 minutes avant le début de votre séance pour éviter le statut "Retard".
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
