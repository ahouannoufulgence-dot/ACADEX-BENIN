
'use client';

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  School, 
  Lock, 
  Save, 
  Camera, 
  ShieldCheck,
  Calculator,
  History,
  LockIcon,
  ShieldAlert,
  Eye,
  Smartphone,
  Globe,
  Trash2,
  RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

export default function SettingsPage() {
  const handleSave = () => {
    toast({
      title: "Configuration enregistrée",
      description: "Les paramètres du système ont été mis à jour avec succès.",
    })
  }

  const handleCriticalAction = () => {
    toast({
      title: "Action exécutée",
      description: "L'action critique a été journalisée dans l'audit.",
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
              <Lock className="size-4" /> Sécurité & Audit
            </TabsTrigger>
          </TabsList>

          {/* Établissement (Previous content preserved) */}
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
                <p className="text-sm text-muted-foreground font-medium">Affiché sur bulletins et reçus.</p>
              </Card>
            </div>
          </TabsContent>

          {/* Sécurité & Audit Renforcé */}
          <TabsContent value="secu" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <CardTitle className="text-2xl font-black">Journal d'Audit Complet</CardTitle>
                    <CardDescription>Traçabilité totale de toutes les modifications critiques.</CardDescription>
                  </div>
                  <Button variant="outline" className="rounded-xl font-bold border-2 h-10">
                    <RefreshCw className="size-4 mr-2" /> Actualiser
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { author: "Dr. Koffi Mensah", action: "Modification de note", details: "Élève ID: ELV-3D-042 (Maths: 12 -> 16)", time: "Aujourd'hui, 14:32", severity: "medium" },
                    { author: "M. Dossou Marc", action: "Saisie de notes", details: "Classe 3ème A (Terminé)", time: "Aujourd'hui, 11:20", severity: "low" },
                    { author: "Admin", action: "Clôture Trimestre 1", details: "Verrouillage global des notes", time: "Hier, 18:45", severity: "high" },
                    { author: "Admin", action: "Suppression Élève", details: "ID: ELV-6A-012 (Placé en Corbeille)", time: "22 Mai, 09:15", severity: "high" },
                  ].map((log, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-muted/20 rounded-3xl border border-transparent hover:border-primary/10 transition-all group">
                      <div className="flex items-start gap-4 mb-4 md:mb-0">
                        <div className={`p-3 rounded-2xl ${log.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {log.severity === 'high' ? <ShieldAlert className="size-5" /> : <Eye className="size-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black text-foreground">{log.action}</p>
                            <Badge className={`text-[8px] h-4 ${log.severity === 'high' ? 'bg-destructive' : 'bg-primary'}`}>
                              {log.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-muted-foreground">{log.details}</p>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">{log.author} • {log.time}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-xl font-bold text-primary group-hover:bg-primary/5">
                        Détails JSON
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-8 border-t border-muted text-center">
                  <Button variant="link" className="font-black text-primary">Télécharger l'historique complet (PDF/CSV)</Button>
                </div>
              </Card>

              <div className="lg:col-span-4 space-y-8">
                <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                  <CardTitle className="text-xl font-black mb-6">Contrôle d'Accès</CardTitle>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-4">
                        <Smartphone className="size-5 text-primary" />
                        <div>
                          <p className="text-xs font-black text-foreground">Double Auth (2FA)</p>
                          <p className="text-[10px] text-muted-foreground font-bold">SMS/Email Bénin</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20">
                      <div className="flex items-center gap-4">
                        <History className="size-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-black text-foreground">Auto-Déconnexion</p>
                          <p className="text-[10px] text-muted-foreground font-bold">Inactivité 30 min</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="mt-10 pt-10 border-t border-muted space-y-4">
                    <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-2 block">Actions Sensibles</Label>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white font-black transition-all">
                          <Trash2 className="size-4 mr-2" /> Vider la Corbeille (30j)
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2.5rem] border-none p-10">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black">Confirmation de Suppression</AlertDialogTitle>
                          <AlertDialogDescription className="text-base font-medium leading-relaxed">
                            Cette action supprimera définitivement tous les élèves et données placés en corbeille depuis plus de 30 jours. Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 gap-4">
                          <AlertDialogCancel className="rounded-xl font-bold h-12">Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCriticalAction} className="rounded-xl bg-destructive font-black h-12 px-8">
                            Confirmer la suppression
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button variant="ghost" className="w-full h-12 rounded-xl font-black text-foreground/70">
                      Réinitialiser tous les mots de passe
                    </Button>
                  </div>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                  <CardTitle className="text-xl font-black mb-6">Connexions Récentes</CardTitle>
                  <div className="space-y-4">
                    {[
                      { device: "MacBook Pro", browser: "Chrome", ip: "197.234.xx.xx (Cotonou)", status: "Active" },
                      { device: "iPhone 15", browser: "Safari", ip: "41.85.xx.xx (Abomey)", status: "Il y a 2h" },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <Globe className="size-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-black text-foreground">{session.device}</p>
                            <p className="text-[10px] font-bold text-muted-foreground">{session.ip}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[8px] font-black ${session.status === 'Active' ? 'text-primary bg-primary/5 border-primary/20' : ''}`}>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
