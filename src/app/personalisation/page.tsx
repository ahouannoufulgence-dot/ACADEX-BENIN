
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  ShieldCheck,
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
    address: "Cotonou, Bénin",
    phone: "+229 00 00 00 00",
    academicYear: "2024-2025",
    logoUrl: "",
    primaryColor: "#14532D"
  })

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, "school_settings", "main_config"))
        if (snap.exists()) setSettings(snap.data() as any)
      } catch (e) { console.warn(e) }
    }
    fetch()
  }, [db])

  const handleSave = async () => {
    setLoading(true)
    try {
      await setDoc(doc(db, "school_settings", "main_config"), settings)
      localStorage.setItem('acadex_school_name', settings.schoolName)
      toast({ title: "Identité mise à jour", description: "Votre établissement a été rebrandé avec succès." })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Personnalisation École</h1>
            <p className="text-muted-foreground font-medium italic">"Faites d'ACADEX le miroir de votre excellence."</p>
          </div>
          <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 shadow-xl rounded-2xl h-14 px-10 font-black">
            <Save className="mr-2 size-5" /> Sauvegarder l'Identité
          </Button>
        </div>

        <Tabs defaultValue="infos" className="space-y-8">
          <TabsList className="bg-white border-2 rounded-2xl h-14 p-1">
            <TabsTrigger value="infos" className="rounded-xl font-bold px-8">Informations</TabsTrigger>
            <TabsTrigger value="design" className="rounded-xl font-bold px-8">Branding</TabsTrigger>
          </TabsList>

          <TabsContent value="infos" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="p-10 rounded-[3rem] border-none shadow-sm bg-white">
                <CardHeader className="p-0 mb-8"><CardTitle className="text-2xl font-black">Identité Institutionnelle</CardTitle></CardHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase text-muted-foreground">Nom officiel de l'école</Label>
                    <Input value={settings.schoolName} onChange={e => setSettings({...settings, schoolName: e.target.value})} className="h-12 rounded-xl font-bold border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase text-muted-foreground">Devise de l'établissement</Label>
                    <Input value={settings.motto} onChange={e => setSettings({...settings, motto: e.target.value})} className="h-12 rounded-xl italic font-medium border-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase text-muted-foreground">Téléphone</Label>
                      <Input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="h-12 rounded-xl font-bold border-2" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase text-muted-foreground">Année Scolaire</Label>
                      <Input value={settings.academicYear} onChange={e => setSettings({...settings, academicYear: e.target.value})} className="h-12 rounded-xl font-bold border-2" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-10 rounded-[3rem] border-none shadow-xl bg-foreground text-white">
                 <div className="size-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-8"><Sparkles className="size-8 text-primary" /></div>
                 <h3 className="text-2xl font-black mb-4 uppercase">{settings.schoolName}</h3>
                 <p className="text-white/60 italic font-medium mb-8">"{settings.motto}"</p>
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-xs font-bold space-y-2">
                    <p className="opacity-40 uppercase">Aperçu Documents Officiels</p>
                    <div className="h-1 w-20 bg-primary" />
                    <p>Année : {settings.academicYear}</p>
                    <p>Tél : {settings.phone}</p>
                 </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-8">
            <Card className="p-10 rounded-[3rem] border-none shadow-sm bg-white">
              <h3 className="text-2xl font-black mb-10">Charte Graphique & Logo</h3>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="font-black">Couleur Thématique</Label>
                    <div className="flex items-center gap-4">
                      <input type="color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} className="size-14 rounded-xl border-4 border-white shadow-lg cursor-pointer" />
                      <Input value={settings.primaryColor} readOnly className="h-12 w-32 text-center font-mono font-bold rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="font-black">Logo Officiel (PNG/SVG)</Label>
                    <div className="h-48 rounded-[2rem] border-4 border-dashed border-muted flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-primary/20 transition-all">
                      <ImageIcon className="size-12 text-muted-foreground opacity-20" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cliquer pour uploader</p>
                    </div>
                  </div>
                </div>
                <div className="p-10 bg-muted/20 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="size-32 bg-white rounded-3xl shadow-xl flex items-center justify-center font-black text-5xl text-primary">{settings.schoolName[0]}</div>
                  <p className="text-sm font-bold text-muted-foreground max-w-xs">Ce logo apparaîtra sur tous les bulletins, reçus de paiement et dans la barre latérale.</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
