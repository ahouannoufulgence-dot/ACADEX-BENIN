
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Trash2, 
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  UserCheck
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
const hours = ["07h-08h", "08h-09h", "09h-10h", "10h-11h", "11h-12h", "14h-15h", "15h-16h", "16h-17h"]

export default function AvailabilityPage() {
  const [userRole, setUserRole] = useState("")
  const [userName, setUserName] = useState("")
  const [teacherSubject, setTeacherSubject] = useState("")
  const [mounted, setMounted] = useState(false)

  // Teacher State
  const [weeklyVolume, setWeeklyVolume] = useState(18)
  const [slots, setSlots] = useState<Record<string, boolean>>({})
  const [options, setOptions] = useState({
    noSaturday: false,
    morningOnly: false,
    afternoonOnly: false,
    partTime: false
  })

  // Director State (Mock)
  const [teacherSubmissions, setTeacherSubmissions] = useState([
    { id: "1", name: "M. Dossou Marc", subject: "Mathématiques", volume: 18, status: "En attente", date: "Aujourd'hui" },
    { id: "2", name: "Mme. Amoussou Julie", subject: "Français", volume: 15, status: "Approuvé", date: "Hier" },
    { id: "3", name: "M. Tidjani Amadou", subject: "Physique", volume: 20, status: "Modification demandée", date: "Il y a 2 jours" },
  ])

  useEffect(() => {
    setUserRole(localStorage.getItem('acadex_user_role') || "Enseignant")
    setUserName(localStorage.getItem('acadex_user_name') || "Professeur")
    setTeacherSubject(localStorage.getItem('acadex_user_subject') || "Mathématiques")
    setMounted(true)
  }, [])

  const toggleSlot = (day: string, hour: string) => {
    const key = `${day}-${hour}`
    setSlots(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    toast({
      title: "Disponibilités enregistrées",
      description: "Votre planning a été envoyé pour validation à la direction.",
    })
  }

  const isDirector = userRole.toLowerCase() === "directeur"

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              {isDirector ? "Pilotage des Emplois du Temps" : "Mes Disponibilités"}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {isDirector 
                ? "Gérez les créneaux des enseignants et évitez les conflits horaires." 
                : `Définissez vos heures de présence pour la matière : ${teacherSubject}.`}
            </p>
          </div>
          {!isDirector && (
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
              <Save className="mr-2 size-5" />
              Soumettre au Directeur
            </Button>
          )}
        </div>

        {isDirector ? (
          /* DIRECTOR VIEW */
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black">Soumissions Enseignants</CardTitle>
                  <CardDescription>Flux de validation des disponibilités hebdomadaires</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-muted/30">
                    {teacherSubmissions.map((sub) => (
                      <div key={sub.id} className="p-8 hover:bg-muted/5 transition-all group flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl">
                            {sub.name[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-lg">{sub.name}</h4>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                              {sub.subject} • {sub.volume}H / Semaine
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={`rounded-full px-4 font-black ${
                            sub.status === 'Approuvé' ? 'bg-primary' : 
                            sub.status === 'En attente' ? 'bg-amber-500' : 'bg-destructive'
                          }`}>
                            {sub.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/10 group-hover:text-primary">
                            <ChevronRight className="size-5" />
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
                    <Zap className="size-10 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-black">Algorithme Anti-Conflit</h3>
                    <p className="text-white/70 font-medium leading-relaxed">
                      L'intelligence ACADEX vérifie en temps réel les chevauchements de salles et d'enseignants. 
                      L'emploi du temps généré respecte 100% des contraintes de disponibilité.
                    </p>
                  </div>
                </div>
                <Clock className="absolute -bottom-12 -right-12 size-64 text-white/5 pointer-events-none" />
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <CardTitle className="text-xl font-black mb-6 flex items-center gap-2">
                  <AlertCircle className="size-5 text-amber-500" />
                  Alertes Planning
                </CardTitle>
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                    <p className="text-xs font-bold text-amber-800">3 enseignants n'ont pas encore rempli leurs disponibilités.</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-xs font-bold text-primary">Conflit détecté : Salle 12 (Maths vs Français) le Lundi à 08h.</p>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <CardTitle className="text-xl font-black mb-6">Contraintes Globales</CardTitle>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-sm">Verrouiller après Publication</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-sm">Priorité Professeurs Principaux</Label>
                    <Switch defaultChecked />
                  </div>
                  <Button className="w-full h-12 rounded-xl bg-primary font-black shadow-lg shadow-primary/20">
                    Générer Emploi du Temps IA
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* TEACHER VIEW */
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <CardTitle className="text-xl font-black mb-6">Charge Hebdomadaire</CardTitle>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs">Matière</Label>
                    <Input readOnly value={teacherSubject} className="h-12 rounded-xl bg-muted font-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs">Volume Horaire (Heures/Sem)</Label>
                    <Input 
                      type="number" 
                      value={weeklyVolume} 
                      onChange={(e) => setWeeklyVolume(Number(e.target.value))}
                      className="h-12 rounded-xl font-black" 
                    />
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <CardTitle className="text-xl font-black mb-6">Options Spéciales</CardTitle>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-black text-sm">Pas le Samedi</Label>
                      <p className="text-[10px] text-muted-foreground font-bold">Libérer le weekend</p>
                    </div>
                    <Switch checked={options.noSaturday} onCheckedChange={(v) => setOptions({...options, noSaturday: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-black text-sm">Matin Uniquement</Label>
                      <p className="text-[10px] text-muted-foreground font-bold">Cessation à 12h</p>
                    </div>
                    <Switch checked={options.morningOnly} onCheckedChange={(v) => setOptions({...options, morningOnly: v})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-black text-sm">Temps Partiel</Label>
                      <p className="text-[10px] text-muted-foreground font-bold">Volume réduit</p>
                    </div>
                    <Switch checked={options.partTime} onCheckedChange={(v) => setOptions({...options, partTime: v})} />
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-8">
              <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
                <CardHeader className="p-10 border-b">
                  <CardTitle className="text-2xl font-black">Grille de Disponibilité</CardTitle>
                  <CardDescription className="font-medium">Sélectionnez les créneaux où vous pouvez assurer vos cours.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-24 px-6 h-14 font-black text-[10px] uppercase tracking-widest">Heure</TableHead>
                          {days.map(day => (
                            <TableHead key={day} className="px-6 h-14 font-black text-[10px] uppercase tracking-widest text-center">{day}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hours.map(hour => (
                          <TableRow key={hour} className="hover:bg-transparent">
                            <TableCell className="px-6 h-20 font-black text-xs border-r bg-muted/10">{hour}</TableCell>
                            {days.map(day => {
                              const isSelected = slots[`${day}-${hour}`]
                              const isSat = day === "Samedi" && options.noSaturday
                              const isAfternoon = hour.startsWith("1") && options.morningOnly
                              const isDisabled = isSat || isAfternoon

                              return (
                                <TableCell 
                                  key={`${day}-${hour}`} 
                                  className="p-1 h-20 border-r last:border-r-0"
                                >
                                  <button
                                    disabled={isDisabled}
                                    onClick={() => toggleSlot(day, hour)}
                                    className={`w-full h-full rounded-2xl transition-all flex items-center justify-center border-2 border-transparent ${
                                      isDisabled ? 'bg-muted/30 cursor-not-allowed' :
                                      isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-95 border-primary/20' : 
                                      'bg-muted/50 hover:bg-muted hover:border-primary/20'
                                    }`}
                                  >
                                    {isSelected ? <CheckCircle2 className="size-5" /> : isDisabled ? <Clock className="size-4 opacity-20" /> : <Plus className="size-4 opacity-20" />}
                                  </button>
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-8 flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="size-3 bg-primary rounded-full" />
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-3 bg-muted rounded-full" />
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Indisponible</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-primary font-black px-4 py-1 rounded-full">
                    {Object.values(slots).filter(Boolean).length} Créneaux Sélectionnés
                  </Badge>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
