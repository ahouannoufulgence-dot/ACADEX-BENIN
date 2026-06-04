
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
  RefreshCw,
  Clock
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
import { useState, useEffect } from "react"

export default function SettingsPage() {
  const [termLocked, setTermLocked] = useState(false)
  const [logs, setLogs] = useState([
    { author: "DIR-001", action: "Verrouillage Trimestre", details: "Le trimestre 1 a été gelé pour tous les enseignants.", time: "Aujourd'hui, 14:32", severity: "high" },
    { author: "ENS-MATH-042", action: "Modification Note", details: "Koffi Djimon (Maths: 12 -> 15)", time: "Aujourd'hui, 11:20", severity: "medium" },
    { author: "DIR-001", action: "Suppression Élève", details: "ELV-3D-012 (Placé en corbeille)", time: "Hier, 18:45", severity: "high" },
  ])

  const handleSave = () => {
    toast({
      title: "Configuration enregistrée",
      description: "Les paramètres RBAC et système ont été mis à jour.",
    })
  }

  const handleToggleLock = () => {
    setTermLocked(!termLocked)
    const newLog = {
      author: "DIR-001",
      action: termLocked ? "Déverrouillage Trimestre" : "Verrouillage Trimestre",
      details: termLocked ? "L'édition des notes est à nouveau libre." : "Toute modification de note est désormais impossible pour les profs.",
      time: "Maintenant",
      severity: "high"
    }
    setLogs([newLog, ...logs])
    toast({
      title: termLocked ? "Système débloqué" : "Système verrouillé",
      description: "L'action a été journalisée avec succès.",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Cockpit de Sécurité</h1>
            <p className="text-muted-foreground mt-2 font-medium">Contrôle strict des accès et intégrité des données Acadex.</p>
          </div>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
            <Save className="mr-2 size-5" />
            Sauvegarder RBAC
          </Button>
        </div>

        <Tabs defaultValue="secu" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit">
            <TabsTrigger value="secu" className="rounded-2xl font-bold px-8 flex gap-2">
              <Lock className="size-4" /> Sécurité & Audit
            </TabsTrigger>
            <TabsTrigger value="ecole" className="rounded-2xl font-bold px-8 flex gap-2">
              <School className="size-4" /> Établissement
            </TabsTrigger>
            <TabsTrigger value="coefficients" className="rounded-2xl font-bold px-8 flex gap-2">
              <Calculator className="size-4" /> Coefficients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="secu" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <CardTitle className="text-2xl font-black">Journal d'Audit Systématique</CardTitle>
                    <CardDescription>Traçabilité totale de toutes les modifications critiques (Loi sur l'intégrité).</CardDescription>
                  </div>
                  <Button variant="outline" className="rounded-xl font-bold border-2 h-10">
                    <RefreshCw className="size-4 mr-2" /> Actualiser
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {logs.map((log, i) => (
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
                        Audit complet
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="lg:col-span-4 space-y-8">
                <Card className={`border-none shadow-xl rounded-[2.5rem] p-10 transition-all duration-500 ${termLocked ? 'bg-destructive text-white' : 'bg-white text-foreground'}`}>
                  <CardTitle className="text-xl font-black mb-6 flex items-center gap-2">
                    <LockIcon className="size-5" />
                    Contrôle Trimestre
                  </CardTitle>
                  <p className="text-sm font-medium mb-8 leading-relaxed opacity-80">
                    {termLocked 
                      ? "Le trimestre est actuellement verrouillé. Aucun enseignant ne peut modifier ou ajouter des notes." 
                      : "Le trimestre est ouvert. Les enseignants peuvent saisir les notes de leurs classes respectives."}
                  </p>
                  <Button 
                    onClick={handleToggleLock}
                    className={`w-full h-14 rounded-2xl font-black text-lg shadow-xl ${termLocked ? 'bg-white text-destructive hover:bg-white/90 shadow-white/10' : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'}`}
                  >
                    {termLocked ? "Déverrouiller le Système" : "Verrouiller le Trimestre"}
                  </Button>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                  <CardTitle className="text-xl font-black mb-6">Restrictions par Rôle</CardTitle>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-4">
                        <Smartphone className="size-5 text-primary" />
                        <div>
                          <p className="text-xs font-black text-foreground">Double Auth (2FA)</p>
                          <p className="text-[10px] text-muted-foreground font-bold">Obligatoire Directeur</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20">
                      <div className="flex items-center gap-4">
                        <Clock className="size-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-black text-foreground">Auto-Déconnexion</p>
                          <p className="text-[10px] text-muted-foreground font-bold">Inactivité 15 min</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ecole" className="space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-black">Informations Institutionnelles</CardTitle>
              </CardHeader>
              <div className="grid md:grid-cols-2 gap-8 pt-6">
                <div className="space-y-4">
                  <Label className="font-bold">Nom de l'école</Label>
                  <Input defaultValue="Collège Acadex Elite" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-4">
                  <Label className="font-bold">Année Scolaire</Label>
                  <Input defaultValue="2025-2026" className="h-12 rounded-xl" />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
