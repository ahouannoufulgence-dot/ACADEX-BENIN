
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Palette, 
  School, 
  Upload, 
  Save, 
  FileCheck, 
  Image as ImageIcon,
  PenTool,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Eye
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useFirestore } from "@/firebase"

export default function PersonalizationPage() {
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    schoolName: "ACADEX ELITE",
    motto: "Discipline - Travail - Excellence",
    address: "Cotonou, Fidjrossè",
    phone: "+229 97 00 00 00",
    email: "contact@acadex.bj",
    academicYear: "2024-2025",
    logoUrl: "",
    signatureUrl: "",
    stampUrl: "",
    primaryColor: "#14532D",
    secondaryColor: "#F8FAFC",
    accentColor: "#F59E0B"
  })

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, "school_settings", "main_config")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any)
      }
    }
    fetchSettings()
  }, [db])

  const handleSave = async () => {
    setLoading(true)
    try {
      await setDoc(doc(db, "school_settings", "main_config"), settings)
      localStorage.setItem('acadex_school_name', settings.schoolName)
      toast({ title: "Modifications enregistrées", description: "L'identité de votre école a été mise à jour." })
    } catch (e) {
      toast({ title: "Erreur", description: "Échec de l'enregistrement.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Personnalisation École</h1>
            <p className="text-muted-foreground mt-2 font-medium">Définissez l'identité visuelle et institutionnelle de votre établissement.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 rounded-2xl h-12 font-bold px-6">
              <Eye className="mr-2 size-4" /> Prévisualiser
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
              <Save className="mr-2 size-5" />
              Sauvegarder l'identité
            </Button>
          </div>
        </div>

        <Tabs defaultValue="infos" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[1.5rem] h-14 p-1 flex w-fit">
            <TabsTrigger value="infos" className="rounded-2xl font-bold px-8 flex gap-2">
              <School className="size-4" /> Informations
            </TabsTrigger>
            <TabsTrigger value="design" className="rounded-2xl font-bold px-8 flex gap-2">
              <Palette className="size-4" /> Design & Couleurs
            </TabsTrigger>
            <TabsTrigger value="docs" className="rounded-2xl font-bold px-8 flex gap-2">
              <FileCheck className="size-4" /> Documents Officiels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infos" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="premium-card p-10">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black">Coordonnées de l'École</CardTitle>
                </CardHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Nom de l'établissement</Label>
                    <Input 
                      value={settings.schoolName} 
                      onChange={(e) => setSettings({...settings, schoolName: e.target.value})}
                      placeholder="Ex: Collège Acadex Elite"
                      className="h-12 rounded-xl bg-muted/30 border-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Devise / Slogan</Label>
                    <Input 
                      value={settings.motto} 
                      onChange={(e) => setSettings({...settings, motto: e.target.value})}
                      placeholder="Ex: Discipline - Travail - Excellence"
                      className="h-12 rounded-xl bg-muted/30 border-none italic font-medium" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Téléphone</Label>
                      <Input 
                        value={settings.phone} 
                        onChange={(e) => setSettings({...settings, phone: e.target.value})}
                        className="h-12 rounded-xl bg-muted/30 border-none font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Année Scolaire Active</Label>
                      <Input 
                        value={settings.academicYear} 
                        onChange={(e) => setSettings({...settings, academicYear: e.target.value})}
                        className="h-12 rounded-xl bg-muted/30 border-none font-bold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Adresse Physique</Label>
                    <Input 
                      value={settings.address} 
                      onChange={(e) => setSettings({...settings, address: e.target.value})}
                      className="h-12 rounded-xl bg-muted/30 border-none font-medium" 
                    />
                  </div>
                </div>
              </Card>

              <Card className="premium-card p-10 bg-foreground text-white">
                <CardHeader className="px-0 pt-0">
                  <div className="size-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles className="size-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-black">Aperçu Institutionnel</CardTitle>
                </CardHeader>
                <div className="space-y-8 pt-4">
                   <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="size-14 bg-white rounded-xl flex items-center justify-center text-foreground font-black text-2xl">
                           {settings.schoolName[0]}
                         </div>
                         <div>
                           <h3 className="text-xl font-black uppercase">{settings.schoolName}</h3>
                           <p className="text-xs text-white/60 font-medium italic">"{settings.motto}"</p>
                         </div>
                      </div>
                      <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                         <div>Année: <span className="text-white">{settings.academicYear}</span></div>
                         <div>Ville: <span className="text-white">Cotonou</span></div>
                      </div>
                   </div>
                   <p className="text-sm text-white/50 leading-relaxed font-medium">
                     Ces informations apparaîtront sur tous les documents officiels, y compris les bulletins de notes et les reçus de paiement générés par le système.
                   </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-12">
               <Card className="lg:col-span-8 premium-card p-10">
                  <CardTitle className="text-2xl font-black mb-10">Charte Graphique</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="space-y-4">
                        <Label className="font-bold block">Couleur Principale</Label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="color" 
                            value={settings.primaryColor} 
                            onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                            className="size-14 rounded-xl cursor-pointer border-4 border-white shadow-sm"
                          />
                          <Input value={settings.primaryColor} readOnly className="h-10 text-center font-mono font-bold rounded-lg bg-muted/50" />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <Label className="font-bold block">Couleur Accent</Label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="color" 
                            value={settings.accentColor} 
                            onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                            className="size-14 rounded-xl cursor-pointer border-4 border-white shadow-sm"
                          />
                          <Input value={settings.accentColor} readOnly className="h-10 text-center font-mono font-bold rounded-lg bg-muted/50" />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <Label className="font-bold block">Arrière-plan</Label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="color" 
                            value={settings.secondaryColor} 
                            onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                            className="size-14 rounded-xl cursor-pointer border-4 border-white shadow-sm"
                          />
                          <Input value={settings.secondaryColor} readOnly className="h-10 text-center font-mono font-bold rounded-lg bg-muted/50" />
                        </div>
                     </div>
                  </div>

                  <div className="mt-16 space-y-6">
                    <Label className="font-black text-sm uppercase tracking-widest text-muted-foreground">Logo de l'établissement</Label>
                    <div className="flex flex-col md:flex-row items-center gap-10">
                       <div className="size-40 bg-muted/30 rounded-3xl flex items-center justify-center border-4 border-dashed border-muted-foreground/20 overflow-hidden group relative">
                          {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="size-12 text-muted-foreground" />
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                            <Upload className="size-8 text-white" />
                          </div>
                       </div>
                       <div className="flex-1 space-y-4">
                          <h4 className="font-black text-lg">Format Recommandé</h4>
                          <p className="text-sm text-muted-foreground font-medium">PNG ou SVG transparent. Minimum 512x512 pixels pour une qualité optimale sur les impressions PDF.</p>
                          <Button variant="outline" className="rounded-xl border-2 font-bold">Remplacer le logo</Button>
                       </div>
                    </div>
                  </div>
               </Card>

               <div className="lg:col-span-4 space-y-8">
                  <Card className="premium-card p-10 overflow-hidden relative group">
                     <div className="relative z-10 space-y-6">
                        <div 
                          className="h-40 w-full rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                           <div className="size-14 bg-white/20 rounded-xl backdrop-blur-md border border-white/20" />
                           <div className="w-24 h-2 bg-white/20 rounded-full" />
                           <div className="w-16 h-2 bg-white/10 rounded-full" />
                        </div>
                        <div className="space-y-2">
                           <div className="h-12 w-full rounded-xl" style={{ backgroundColor: settings.accentColor }} />
                           <div className="h-12 w-full rounded-xl bg-muted/50 border-2 border-dashed border-muted-foreground/10" />
                        </div>
                        <p className="text-[10px] font-black text-center uppercase tracking-widest text-muted-foreground">Aperçu dynamique du thème</p>
                     </div>
                  </Card>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="docs" className="space-y-8">
             <div className="grid gap-8 md:grid-cols-2">
                <Card className="premium-card p-10">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <PenTool className="size-6" />
                      </div>
                      <CardTitle className="text-xl font-black">Signature Directeur</CardTitle>
                   </div>
                   <div className="h-48 bg-muted/20 rounded-3xl border-4 border-dashed border-muted-foreground/10 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-primary/20 transition-all">
                      <Upload className="size-10 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-xs font-bold text-muted-foreground">Cliquer pour uploader la signature (.png)</p>
                   </div>
                   <p className="mt-6 text-xs text-muted-foreground italic">Sera utilisée pour sceller les bulletins et les certificats de scolarité.</p>
                </Card>

                <Card className="premium-card p-10">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="size-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="size-6" />
                      </div>
                      <CardTitle className="text-xl font-black">Cachet de l'École</CardTitle>
                   </div>
                   <div className="h-48 bg-muted/20 rounded-3xl border-4 border-dashed border-muted-foreground/10 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-amber-600/20 transition-all">
                      <Upload className="size-10 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                      <p className="text-xs font-bold text-muted-foreground">Cliquer pour uploader le cachet (.png)</p>
                   </div>
                   <p className="mt-6 text-xs text-muted-foreground italic">Apparaîtra sur tous les documents financiers et administratifs.</p>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
