"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  UserX, 
  History, 
  Loader2,
  Smartphone,
  ShieldCheck
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"

const mockPresence = [
  { id: "1", name: "M. Dossou Marc", subject: "Maths", expected: "08:00", actual: "07:54", status: "Présent", lateness: 0 },
  { id: "2", name: "Mme. Amoussou Julie", subject: "Français", expected: "08:00", actual: "08:14", status: "Retard", lateness: 14 },
  { id: "3", name: "M. Tidjani Amadou", subject: "Physique", expected: "10:00", actual: "--:--", status: "Absent", lateness: 0 },
]

export default function PresencePage() {
  const [userRole, setUserRole] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [hasClockedIn, setHasClockedIn] = useState(false)

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role') || "Directeur")
    setMounted(true)
  }, [])

  const handleClockIn = () => {
    setIsClockingIn(true)
    setTimeout(() => {
      setIsClockingIn(false)
      setHasClockedIn(true)
      toast({ title: "Pointage réussi", description: "Arrivée enregistrée avec succès." })
    }, 1500)
  }

  if (!mounted) return null
  const isDirector = userRole.toLowerCase() === "directeur"

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-4xl font-black tracking-tight text-foreground">{isDirector ? "Pilotage Présence" : "Mon Émargement"}</h1>
          <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6"><History className="mr-2 size-5" /> Historique</Button>
        </div>

        {isDirector ? (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { label: "Présents", value: "24", icon: UserCheck, color: "text-primary" },
                { label: "En Retard", value: "3", icon: Clock, color: "text-amber-500" },
                { label: "Absents", value: "2", icon: UserX, color: "text-destructive" },
                { label: "Taux Ponctualité", value: "92%", icon: ShieldCheck, color: "text-primary" },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm rounded-3xl bg-white p-6">
                  <div className={`p-3 bg-muted rounded-2xl w-fit mb-4 ${stat.color}`}><stat.icon className="size-6" /></div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{stat.value}</p>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b">
                <CardTitle className="text-2xl font-black">Émargement du Jour</CardTitle>
                <CardDescription>Flux de présence temps réel</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-muted/30">
                  {mockPresence.map((p) => (
                    <div key={p.id} className="p-7 flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className={`size-14 rounded-2xl flex items-center justify-center font-black text-xl ${p.status === 'Présent' ? 'bg-primary/10 text-primary' : p.status === 'Retard' ? 'bg-amber-50 text-amber-600' : 'bg-destructive/10 text-destructive'}`}>{p.name[0]}</div>
                        <div>
                          <h4 className="text-lg font-black text-foreground">{p.name}</h4>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.subject} • Prévu : {p.expected}</span>
                        </div>
                      </div>
                      <Badge className={`rounded-full px-4 font-black ${p.status === 'Présent' ? 'bg-primary' : p.status === 'Retard' ? 'bg-amber-500' : 'bg-destructive'}`}>{p.status} {p.lateness > 0 && `(${p.lateness} min)`}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-xl mx-auto py-10">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden p-1">
              <div className={`p-12 text-center space-y-8 ${hasClockedIn ? 'bg-primary/5' : 'bg-muted/20'}`}>
                <div className={`size-28 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl transition-all ${hasClockedIn ? 'bg-primary text-white scale-110' : 'bg-white text-muted-foreground'}`}>
                  {hasClockedIn ? <CheckCircle2 className="size-14" /> : <Clock className="size-14" />}
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black">{hasClockedIn ? "Pointage validé !" : "Prêt pour vos cours ?"}</h2>
                  <p className="text-muted-foreground font-medium">{hasClockedIn ? `Enregistré à ${new Date().toLocaleTimeString()}` : "Signalez votre présence dès votre arrivée."}</p>
                </div>
                <Button onClick={handleClockIn} disabled={hasClockedIn || isClockingIn} className={`w-full h-20 rounded-[2rem] text-xl font-black shadow-2xl transition-all ${hasClockedIn ? 'bg-emerald-500 text-white' : 'bg-primary shadow-primary/20'}`}>
                  {isClockingIn ? <Loader2 className="size-8 animate-spin mr-3" /> : hasClockedIn ? <CheckCircle2 className="size-8 mr-3" /> : null}
                  {isClockingIn ? "Validation..." : hasClockedIn ? "PRÉSENCE VALIDÉE" : "JE SUIS ARRIVÉ"}
                </Button>
                <div className="flex items-center justify-center gap-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Smartphone className="size-3" /> Appareil Vérifié</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
