"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  User, 
  School, 
  Bell, 
  Lock, 
  Save, 
  Camera, 
  Globe, 
  Mail, 
  Phone,
  ShieldCheck,
  CreditCard,
  Languages,
  BookOpen,
  Calculator,
  History,
  LockIcon
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const handleSave = () => {
    toast({
      title: "Configuration enregistrée",
      description: "Les paramètres du système ont été mis à jour avec succès.",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Pilotage Acadex</h1>
            <p className="text-muted-foreground mt-2 font-medium">Configuration globale du collège et du lycée.</p>
          </div>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
            <Save className="mr-2 size-5" />
            Sauvegarder
          </Button>
        </div>

        <Tabs defaultValue="ecole" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit overflow-x-auto">
            <TabsTrigger value="ecole" className="rounded-2xl font-bold px-8 flex gap-2">
              <School className="size-4" /> Établissement
            </TabsTrigger>
            <TabsTrigger value="coefficients" className="rounded-2xl font-bold px-8 flex gap-2">
              <Calculator className="size-4" /> Coefficients
            </TabsTrigger>
            <TabsTrigger value="periode" className="rounded-2xl font-bold px-8 flex gap-2">
              <History className="size-4" /> Trimestres
            </TabsTrigger>
            <TabsTrigger value="secu" className="rounded-2xl font-bold px-8 flex gap-2">
              <Lock className="size-4" /> Sécurité
            </TabsTrigger>
          </TabsList>

          {/* Établissement */}
          <TabsContent value="ecole" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black">Informations de l'École</CardTitle>
                  <CardDescription>Configuration officielle pour les documents et bulletins.</CardDescription>
                </CardHeader>
                <div className="space-y-6 pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold">Nom Officiel</Label>
                      <Input defaultValue="Collège Acadex Elite" className="h-12 rounded-xl bg-muted/50 border-none font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Année Scolaire Active</Label>
                      <Input defaultValue="2025-2026" className="h-12 rounded-xl bg-muted/50 border-none font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Adresse Complète (Cotonou, Bénin)</Label>
                    <Input defaultValue="Carrefour de l'Aéroport, Zone Résidentielle" className="h-12 rounded-xl bg-muted/50 border-none" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold">Téléphone Standard</Label>
                      <Input defaultValue="+229 21 30 00 00" className="h-12 rounded-xl bg-muted/50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Email Officiel</Label>
                      <Input defaultValue="contact@acadex-elite.bj" className="h-12 rounded-xl bg-muted/50 border-none" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-4 border-none shadow-sm bg-white rounded-[2.5rem] p-10 flex flex-col items-center text-center">
                <div className="relative group mb-8">
                  <div className="size-40 bg-muted rounded-3xl flex items-center justify-center text-primary font-black text-6xl shadow-inner group-hover:bg-primary/5 transition-colors">
                    A
                  </div>
                  <Button size="icon" className="absolute -bottom-2 -right-2 rounded-full size-12 shadow-xl border-4 border-white">
                    <Camera className="size-5" />
                  </Button>
                </div>
                <h3 className="text-xl font-black mb-1">Logo Établissement</h3>
                <p className="text-sm text-muted-foreground font-medium mb-8">Sera affiché sur tous les bulletins et reçus.</p>
                <div className="w-full pt-8 border-t space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-muted-foreground">Type</span>
                    <Badge className="bg-primary">LYCÉE & COLLÈGE</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-muted-foreground">ID National</span>
                    <span className="text-foreground">BJ-EDU-2024-042</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Coefficients */}
          <TabsContent value="coefficients" className="space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <CardTitle className="text-2xl font-black">Grille des Coefficients</CardTitle>
                  <CardDescription className="text-base">Paramétrage automatique par série et par matière.</CardDescription>
                </div>
                <Button className="bg-primary hover:bg-primary/90 h-12 rounded-2xl px-8 font-black">
                  Ajouter une Règle
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                      <th className="px-6 py-4 text-left">Matière</th>
                      <th className="px-6 py-4 text-center">Collège</th>
                      <th className="px-6 py-4 text-center">2nde/1ère C-D</th>
                      <th className="px-6 py-4 text-center">Terminale D</th>
                      <th className="px-6 py-4 text-center">Terminale A</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/30">
                    {[
                      { subject: "Mathématiques", college: 4, cd: 6, td: 6, ta: 2 },
                      { subject: "Français", college: 3, cd: 3, td: 2, ta: 4 },
                      { subject: "Physique-Chimie", college: 2, cd: 5, td: 5, ta: 1 },
                      { subject: "Philosophie", college: 0, cd: 2, td: 2, ta: 5 },
                      { subject: "Anglais", college: 2, cd: 2, td: 2, ta: 3 },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-5 font-black text-foreground">{row.subject}</td>
                        <td className="px-6 py-5 text-center"><Badge variant="outline" className="font-black h-8 w-12 justify-center rounded-xl">{row.college || '-'}</Badge></td>
                        <td className="px-6 py-5 text-center"><Badge variant="outline" className="font-black h-8 w-12 justify-center rounded-xl">{row.cd || '-'}</Badge></td>
                        <td className="px-6 py-5 text-center"><Badge variant="outline" className="font-black h-8 w-12 justify-center rounded-xl">{row.td || '-'}</Badge></td>
                        <td className="px-6 py-5 text-center"><Badge variant="outline" className="font-black h-8 w-12 justify-center rounded-xl">{row.ta || '-'}</Badge></td>
                        <td className="px-6 py-5 text-right">
                          <Button variant="ghost" size="sm" className="font-bold text-primary">Modifier</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Trimestres */}
          <TabsContent value="periode" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { name: "Trimestre 1 (T1)", status: "Fermé", date: "Sept - Déc", locked: true },
                { name: "Trimestre 2 (T2)", status: "Ouvert", date: "Jan - Mars", locked: false },
                { name: "Trimestre 3 (T3)", status: "Programmé", date: "Avril - Juin", locked: true },
              ].map((term, i) => (
                <Card key={i} className={`border-none shadow-sm rounded-[2rem] p-8 ${term.status === 'Ouvert' ? 'ring-4 ring-primary/20 bg-white' : 'bg-white opacity-80'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${term.status === 'Ouvert' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      <History className="size-6" />
                    </div>
                    <Badge className={term.status === 'Ouvert' ? 'bg-primary' : term.status === 'Fermé' ? 'bg-destructive' : 'bg-muted text-muted-foreground'}>
                      {term.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-black mb-1">{term.name}</h3>
                  <p className="text-sm font-bold text-muted-foreground mb-8">{term.date}</p>
                  
                  <div className="space-y-4 pt-6 border-t border-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LockIcon className={`size-4 ${term.locked ? 'text-destructive' : 'text-emerald-500'}`} />
                        <span className="text-xs font-bold">Verrouillage Notes</span>
                      </div>
                      <Switch defaultChecked={term.locked} />
                    </div>
                    <Button variant={term.status === 'Ouvert' ? 'destructive' : 'outline'} className="w-full rounded-xl font-black h-11">
                      {term.status === 'Ouvert' ? 'Clôturer la période' : term.status === 'Fermé' ? 'Réouvrir' : 'Initialiser'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <Card className="border-none shadow-xl bg-foreground text-white p-10 rounded-[3rem] relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="size-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                  <History className="size-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black mb-2">Cycle de Vie Académique</h3>
                  <p className="text-white/70 font-medium leading-relaxed max-w-2xl">
                    Le verrouillage d'un trimestre interdit toute modification de notes par les enseignants. Les bulletins définitifs ne sont générés qu'une fois la période clôturée.
                  </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl h-14 px-10">
                  Archiver l'Année 2024-2025
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Sécurité */}
          <TabsContent value="secu" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <CardTitle className="text-xl font-black mb-2">Journal d'Audit</CardTitle>
                <CardDescription className="mb-8">Historique des actions critiques sur la plateforme.</CardDescription>
                <div className="space-y-4">
                  {[
                    { user: "Admin", action: "Clôture T1", time: "Hier, 18:42", color: "bg-destructive" },
                    { user: "Ens. Dossou", action: "Saisie notes 3D1", time: "Hier, 14:10", color: "bg-primary" },
                    { user: "Admin", action: "Ajout nouvel enseignant", time: "22/05, 09:15", color: "bg-primary" },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-muted transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`size-2 rounded-full ${log.color}`} />
                        <div>
                          <p className="text-sm font-black text-foreground">{log.action}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{log.user}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground">{log.time}</span>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full h-11 font-black text-primary text-xs">Voir l'historique complet</Button>
                </div>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <CardTitle className="text-xl font-black mb-6">Contrôle d'Accès</CardTitle>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="size-6 text-primary" />
                      <div>
                        <p className="font-black text-foreground">Double Authentification</p>
                        <p className="text-xs text-muted-foreground font-medium">Code envoyé par SMS/Email au Bénin.</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/20">
                    <div className="flex items-center gap-4">
                      <History className="size-6 text-muted-foreground" />
                      <div>
                        <p className="font-black text-foreground">Auto-Déconnexion</p>
                        <p className="text-xs text-muted-foreground font-medium">Après 15 minutes d'inactivité.</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="pt-6 border-t border-muted/50">
                    <Button className="w-full h-12 rounded-xl bg-foreground text-white font-black">Réinitialiser tous les mots de passe</Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}