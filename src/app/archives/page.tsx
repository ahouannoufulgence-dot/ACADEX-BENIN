
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Archive, 
  Search, 
  Filter, 
  Download, 
  Database, 
  Calendar, 
  Users, 
  UserSquare2, 
  CreditCard, 
  FileText,
  ShieldCheck,
  ChevronRight,
  Printer,
  History,
  AlertCircle,
  FolderOpen
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ArchivesPage() {
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState("2024-2025")

  const handleArchiveYear = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Année archivée",
        description: `Les données de l'année ${selectedYear} ont été sécurisées.`,
      })
    }, 2000)
  }

  const archiveStats = [
    { label: "Années Archivées", value: "8", icon: Calendar, color: "text-primary" },
    { label: "Élèves Historiques", value: "2,450", icon: Users, color: "text-primary" },
    { label: "Bulletins Scellés", value: "12,840", icon: FileText, color: "text-amber-600" },
    { label: "Recettes Archivées", value: "482M", sub: "FCFA", icon: CreditCard, color: "text-primary" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Archives Institutionnelles</h1>
            <p className="text-muted-foreground mt-2 font-medium">Mémoire numérique et traçabilité historique de l'établissement.</p>
          </div>
          <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
                  <Archive className="mr-2 size-5" />
                  Archiver Année Actuelle
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2.5rem] p-10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black">Action Irréversible</AlertDialogTitle>
                  <AlertDialogDescription className="text-base font-medium">
                    Vous allez geler toutes les données de l'année 2024-2025. Cette action clôture l'exercice pédagogique et financier. Êtes-vous certain ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-4">
                  <AlertDialogCancel className="rounded-xl font-bold h-12">Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchiveYear} className="bg-primary rounded-xl font-black h-12 px-8">Confirmer l'Archivage</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {archiveStats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="size-6" />
                  </div>
                  <ShieldCheck className="size-4 text-emerald-500" />
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-foreground">{stat.value}</span>
                  {stat.sub && <span className="text-xs font-bold text-muted-foreground">{stat.sub}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="eleves" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit overflow-x-auto">
            <TabsTrigger value="eleves" className="rounded-2xl font-bold px-8 flex gap-2">
              <Users className="size-4" /> Élèves
            </TabsTrigger>
            <TabsTrigger value="enseignants" className="rounded-2xl font-bold px-8 flex gap-2">
              <UserSquare2 className="size-4" /> Enseignants
            </TabsTrigger>
            <TabsTrigger value="bulletins" className="rounded-2xl font-bold px-8 flex gap-2">
              <FileText className="size-4" /> Bulletins
            </TabsTrigger>
            <TabsTrigger value="finances" className="rounded-2xl font-bold px-8 flex gap-2">
              <CreditCard className="size-4" /> Finances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="eleves" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Rechercher dans l'historique (Nom, Matricule, Année)..." className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold" />
              </div>
              <Button variant="outline" className="h-14 rounded-2xl border-2 px-8 font-bold flex gap-2">
                <Filter className="size-5" /> Année Scolaire
              </Button>
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b">
                <CardTitle className="text-xl font-black">Répertoire Historique des Élèves</CardTitle>
                <CardDescription>Liste exhaustive de tous les élèves passés par l'établissement.</CardDescription>
              </div>
              <div className="divide-y divide-muted/30">
                {[
                  { id: "ELV-001", name: "David Mensah", years: ["2023-2024", "2024-2025"], status: "Actif", lastClass: "Terminale D1" },
                  { id: "ELV-082", name: "Marie Amoussou", years: ["2020-2024"], status: "Diplômé", lastClass: "Terminale C" },
                  { id: "ELV-145", name: "Koffi Djimon", years: ["2022-2023"], status: "Transféré", lastClass: "4ème C" },
                ].map((item) => (
                  <div key={item.id} className="p-7 hover:bg-muted/10 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="size-14 bg-muted rounded-2xl flex items-center justify-center font-black text-primary text-xl">
                        {item.name[0]}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="rounded-full border-muted text-muted-foreground text-[10px] font-black">{item.id}</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Dernière classe : {item.lastClass}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Parcours</p>
                        <div className="flex gap-1">
                          {item.years.map(y => <Badge key={y} variant="secondary" className="text-[9px] font-black">{y}</Badge>)}
                        </div>
                      </div>
                      <Badge className={`rounded-full px-4 font-black ${item.status === 'Diplômé' ? 'bg-primary' : item.status === 'Transféré' ? 'bg-amber-500' : 'bg-foreground'}`}>
                        {item.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/5 group-hover:text-primary">
                        <ChevronRight className="size-6" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="bulletins" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {["2023-2024", "2022-2023", "2021-2022"].map((year) => (
                <Card key={year} className="premium-card p-8 group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <FolderOpen className="size-8" />
                    </div>
                    <Badge variant="outline" className="rounded-full font-black border-primary/20 text-primary">SCÉLLÉ</Badge>
                  </div>
                  <h4 className="text-2xl font-black mb-1">Archives {year}</h4>
                  <p className="text-xs text-muted-foreground font-medium mb-6">1,245 Bulletins • 12 Classes</p>
                  <div className="space-y-3">
                    <Button className="w-full h-11 rounded-xl bg-foreground text-white font-black">Ouvrir le Répertoire</Button>
                    <Button variant="ghost" className="w-full h-11 rounded-xl font-bold text-primary hover:bg-primary/5 flex gap-2">
                      <Download className="size-4" /> Rapport Global PDF
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Global Archive Maintenance */}
        <Card className="border-none shadow-xl bg-foreground text-white p-12 rounded-[3.5rem] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="size-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-xl border border-white/10">
              <Database className="size-12 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-3xl font-black">Maintenance & Sauvegarde</h3>
              <p className="text-lg text-white/70 font-medium leading-relaxed max-w-2xl">
                Toutes les archives sont dupliquées sur des serveurs sécurisés. Vous pouvez exporter l'intégralité de la base de données au format chiffré pour une conservation hors-ligne.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-emerald-400 font-black">
                  <ShieldCheck className="size-5" />
                  Protection Cloud Activée
                </div>
                <div className="h-4 w-px bg-white/20" />
                <div className="text-sm font-bold text-white/50 italic">Dernière sauvegarde : Aujourd'hui, 04:00</div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl h-16 px-12 text-lg shadow-xl shadow-primary/20">
                Export Total (.JSON)
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 font-black">
                Historique des Restaurations
              </Button>
            </div>
          </div>
          <History className="absolute -bottom-16 -right-16 size-80 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>
      </div>
    </DashboardLayout>
  )
}
