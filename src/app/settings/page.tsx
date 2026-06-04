
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
  Languages
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const handleSave = () => {
    toast({
      title: "Paramètres enregistrés",
      description: "Vos modifications ont été appliquées avec succès.",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Paramètres de l'Espace</h1>
            <p className="text-muted-foreground mt-2 font-medium">Configurez votre compte et les options de l'établissement.</p>
          </div>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-bold">
            <Save className="mr-2 size-5" />
            Enregistrer les modifications
          </Button>
        </div>

        <Tabs defaultValue="profil" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit overflow-x-auto">
            <TabsTrigger value="profil" className="rounded-2xl font-bold px-8 flex gap-2">
              <User className="size-4" /> Profil
            </TabsTrigger>
            <TabsTrigger value="ecole" className="rounded-2xl font-bold px-8 flex gap-2">
              <School className="size-4" /> Établissement
            </TabsTrigger>
            <TabsTrigger value="notifs" className="rounded-2xl font-bold px-8 flex gap-2">
              <Bell className="size-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="secu" className="rounded-2xl font-bold px-8 flex gap-2">
              <Lock className="size-4" /> Sécurité
            </TabsTrigger>
          </TabsList>

          {/* Profil Personnel */}
          <TabsContent value="profil" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <Card className="lg:col-span-4 border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="relative group">
                    <Avatar className="size-40 border-8 border-muted shadow-2xl">
                      <AvatarImage src="https://picsum.photos/seed/acadex-avatar/400/400" />
                      <AvatarFallback className="text-3xl font-black">KM</AvatarFallback>
                    </Avatar>
                    <Button size="icon" className="absolute bottom-2 right-2 rounded-full size-12 shadow-xl border-4 border-white group-hover:scale-110 transition-transform">
                      <Camera className="size-5" />
                    </Button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Dr. Koffi Mensah</h2>
                    <p className="text-muted-foreground font-bold">Directeur Académique</p>
                    <Badge className="mt-3 bg-primary/10 text-primary border-none rounded-full font-black px-4">ADMINISTRATEUR</Badge>
                  </div>
                </div>
                <div className="mt-12 space-y-4 pt-8 border-t border-muted">
                  <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                    <Mail className="size-4" /> koffi.mensah@acadex.bj
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                    <Phone className="size-4" /> +229 97 00 00 00
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem]">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-bold">Informations Personnelles</CardTitle>
                  <CardDescription>Mettez à jour vos informations de contact et votre biographie.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstname" className="font-bold">Prénom</Label>
                      <Input id="firstname" defaultValue="Koffi" className="h-12 rounded-xl bg-muted/50 border-none font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname" className="font-bold">Nom</Label>
                      <Input id="lastname" defaultValue="Mensah" className="h-12 rounded-xl bg-muted/50 border-none font-medium" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold">Adresse Email</Label>
                    <Input id="email" type="email" defaultValue="koffi.mensah@acadex.bj" className="h-12 rounded-xl bg-muted/50 border-none font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="font-bold">Biographie Professionnelle</Label>
                    <textarea 
                      id="bio" 
                      className="w-full min-h-[120px] p-4 rounded-xl bg-muted/50 border-none font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Décrivez brièvement votre rôle..."
                    ></textarea>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Établissement */}
          <TabsContent value="ecole" className="space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem]">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-bold">Configuration de l'École</CardTitle>
                <CardDescription>Informations officielles de l'établissement scolaire.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-bold">Nom de l'établissement</Label>
                      <Input defaultValue="Collège Acadex Elite" className="h-12 rounded-xl bg-muted/50 border-none font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Année Académique Courante</Label>
                      <Input defaultValue="2024-2025" className="h-12 rounded-xl bg-muted/50 border-none font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Devise du Bénin (Monnaie)</Label>
                      <Input defaultValue="FCFA" className="h-12 rounded-xl bg-muted/50 border-none font-medium" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-bold">Adresse Complète</Label>
                      <Input defaultValue="Rue de l'Aéroport, Cotonou" className="h-12 rounded-xl bg-muted/50 border-none font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Téléphone Standard</Label>
                      <Input defaultValue="+229 21 30 00 00" className="h-12 rounded-xl bg-muted/50 border-none font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Langue du Système</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold border-2 border-primary bg-primary/5 text-primary">Français</Button>
                        <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold border-2 opacity-50">English</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifs" className="space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem]">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-bold">Préférences de Notification</CardTitle>
                <CardDescription>Choisissez comment vous souhaitez être alerté des activités importantes.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                {[
                  { title: "Alertes de Performance IA", desc: "Recevoir des notifications lors de baisses de moyennes critiques détectées par l'IA.", icon: Bell },
                  { title: "Rapports Financiers Hebdomadaires", desc: "Rapport de synthèse de l'état du recouvrement chaque lundi matin.", icon: CreditCard },
                  { title: "Messages Parents & Profs", desc: "Alertes immédiates pour les nouveaux messages internes.", icon: Mail },
                  { title: "Alertes de Sécurité", desc: "Notification lors d'une connexion depuis un nouvel appareil.", icon: ShieldCheck },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 border border-transparent hover:border-border transition-all">
                    <div className="flex gap-4">
                      <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                        <item.icon className="size-6" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground max-w-md">{item.desc}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={i % 2 === 0} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sécurité */}
          <TabsContent value="secu" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem]">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-bold">Changer le Mot de Passe</CardTitle>
                  <CardDescription>Assurez-vous d'utiliser un mot de passe robuste.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Mot de passe actuel</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-muted/50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Nouveau mot de passe</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-muted/50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Confirmer le mot de passe</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-muted/50 border-none" />
                  </div>
                  <Button className="w-full h-12 rounded-xl font-bold bg-foreground text-white mt-4">Mettre à jour le mot de passe</Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-[2.5rem]">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-bold">Double Authentification (2FA)</CardTitle>
                  <CardDescription>Ajoutez une couche de sécurité supplémentaire à votre compte.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
                    <div className="flex items-center gap-3 text-primary font-black">
                      <ShieldCheck className="size-6" />
                      Sécurité Recommandée
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      La double authentification protège votre compte en demandant un code envoyé sur votre téléphone lors de la connexion.
                    </p>
                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                      Activer la 2FA
                    </Button>
                  </div>
                  <div className="space-y-2 pt-4">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Sessions Actives</p>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                      <div className="flex gap-3">
                        <Globe className="size-4 text-muted-foreground" />
                        <span className="text-xs font-bold">Chrome sur macOS - Cotonou, BJ</span>
                      </div>
                      <Badge className="bg-emerald-500 text-white font-black text-[10px]">ACTUELLE</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
