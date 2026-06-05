"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calculator, 
  Plus, 
  Zap, 
  ChevronRight, 
  BookOpen, 
  ArrowRight,
  Filter,
  Save,
  Trash2,
  AlertCircle,
  ShieldCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

// Structure des matières officielles au Bénin
const BENIN_SUBJECTS = [
  "Mathématiques",
  "Français",
  "Anglais",
  "PCT (Physique-Chimie-Technologie)",
  "SVT (Sc. de la Vie et de la Terre)",
  "Histoire-Géographie",
  "Philosophie",
  "Allemand",
  "Espagnol",
  "Économie",
  "Comptabilité",
  "Informatique",
  "EPS",
  "Citoyenneté",
  "Éducation Artistique"
]

const LEVELS = [
  { id: "6eme", name: "6ème", series: ["Général"] },
  { id: "5eme", name: "5ème", series: ["Général"] },
  { id: "4eme", name: "4ème", series: ["Général"] },
  { id: "3eme", name: "3ème", series: ["Général"] },
  { id: "2nde", name: "2nde", series: ["C", "D", "A1", "A2"] },
  { id: "1ere", name: "1ère", series: ["C", "D", "A1", "A2", "G2", "G3"] },
  { id: "Tle", name: "Terminale", series: ["C", "D", "A1", "A2", "G2", "G3"] },
]

interface SubjectConfig {
  id: string;
  name: string;
  coef: number;
}

export default function SubjectsAndCoefficientsPage() {
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[6].id) // Terminale par défaut
  const [selectedSeries, setSelectedSeries] = useState(LEVELS[6].series[1]) // Série D par défaut
  const [configs, setConfigs] = useState<Record<string, SubjectConfig[]>>({})

  // Simulation de données initiales réalistes pour Terminale D
  useEffect(() => {
    const initialTleD = [
      { id: "1", name: "Mathématiques", coef: 5 },
      { id: "2", name: "PCT (Physique-Chimie-Technologie)", coef: 5 },
      { id: "3", name: "SVT (Sc. de la Vie et de la Terre)", coef: 5 },
      { id: "4", name: "Français", coef: 2 },
      { id: "5", name: "Anglais", coef: 2 },
      { id: "6", name: "Histoire-Géographie", coef: 2 },
      { id: "7", name: "Philosophie", coef: 2 },
      { id: "8", name: "EPS", coef: 1 },
    ]
    setConfigs({ "Tle-D": initialTleD })
  }, [])

  const currentKey = `${selectedLevel}-${selectedSeries}`
  const currentSubjects = configs[currentKey] || []

  const handleUpdateCoef = (id: string, value: string) => {
    const num = parseInt(value) || 1
    setConfigs(prev => ({
      ...prev,
      [currentKey]: prev[currentKey].map(s => s.id === id ? { ...s, coef: num } : s)
    }))
  }

  const handleAddSubject = (name: string) => {
    if (currentSubjects.find(s => s.name === name)) {
      toast({ title: "Déjà présent", description: "Cette matière est déjà dans la liste de cette classe.", variant: "destructive" })
      return
    }
    const newSub = { id: Math.random().toString(36).substr(2, 9), name, coef: 2 }
    setConfigs(prev => ({
      ...prev,
      [currentKey]: [...(prev[currentKey] || []), newSub]
    }))
  }

  const handleRemoveSubject = (id: string) => {
    setConfigs(prev => ({
      ...prev,
      [currentKey]: prev[currentKey].filter(s => s.id !== id)
    }))
  }

  const handleSave = () => {
    toast({ title: "Configuration enregistrée", description: `Les coefficients pour ${selectedLevel} ${selectedSeries} ont été mis à jour.` })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Gestion Matières & <span className="text-primary italic">Coefficients</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Architecture scolaire intelligente adaptée au système du Bénin.</p>
          </div>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black">
            <Save className="mr-2 size-5" />
            Enregistrer les Coefficients
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* SÉLECTEUR DE CLASSE / SÉRIE */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="premium-card p-8 border-l-[10px] border-primary">
              <h3 className="text-xl font-black mb-6">Périmètre de Classe</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Niveau Scolaire</label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="h-14 rounded-2xl font-black border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map(l => <SelectItem key={l.id} value={l.id} className="font-bold">{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Série / Branche</label>
                  <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                    <SelectTrigger className="h-14 rounded-2xl font-black border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.find(l => l.id === selectedLevel)?.series.map(s => (
                        <SelectItem key={s} value={s} className="font-bold">Série {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-8 p-6 bg-muted/30 rounded-3xl space-y-4">
                 <div className="flex items-center gap-3 text-primary">
                   <AlertCircle className="size-5" />
                   <p className="text-xs font-black uppercase">Note Importante</p>
                 </div>
                 <p className="text-xs font-medium leading-relaxed">
                   Les coefficients définis ici seront automatiquement appliqués à chaque note saisie par les enseignants de cette classe.
                 </p>
              </div>
            </Card>

            <Card className="premium-card p-8">
              <h3 className="text-lg font-black mb-4">Ajouter une Matière</h3>
              <div className="grid grid-cols-1 gap-2">
                {BENIN_SUBJECTS.map(sub => (
                  <Button 
                    key={sub}
                    variant="ghost"
                    onClick={() => handleAddSubject(sub)}
                    className="justify-between h-11 rounded-xl hover:bg-primary/10 hover:text-primary font-bold group"
                  >
                    {sub}
                    <Plus className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          {/* TABLEAU DES COEFFICIENTS */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
              <CardHeader className="p-10 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="size-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                      <Calculator className="size-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black">{selectedLevel} {selectedSeries}</CardTitle>
                      <CardDescription className="font-bold">Grille de pondération officielle des matières</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none px-6 py-2 rounded-full font-black text-lg">
                    {currentSubjects.length} MATIÈRES
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {currentSubjects.length === 0 ? (
                  <div className="p-20 text-center space-y-4">
                    <BookOpen className="size-16 text-muted-foreground mx-auto opacity-20" />
                    <p className="text-xl font-black text-muted-foreground">Aucune matière configurée</p>
                    <p className="text-sm font-medium text-muted-foreground/60">Ajoutez des matières depuis la liste latérale.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-muted/30">
                    {currentSubjects.map((sub) => (
                      <div key={sub.id} className="p-8 flex items-center justify-between group hover:bg-muted/5 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="size-12 bg-muted rounded-2xl flex items-center justify-center font-black text-primary">
                            {sub.name[0]}
                          </div>
                          <div>
                            <h4 className="text-lg font-black">{sub.name}</h4>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Matière Principale</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-10">
                           <div className="text-center space-y-2">
                             <p className="text-[10px] font-black uppercase text-muted-foreground">Coefficient</p>
                             <div className="flex items-center gap-3">
                               <Input 
                                 type="number" 
                                 value={sub.coef}
                                 onChange={(e) => handleUpdateCoef(sub.id, e.target.value)}
                                 className="w-20 h-12 text-center text-xl font-black rounded-xl border-2 focus-visible:ring-primary" 
                               />
                               <Zap className={`size-5 ${sub.coef >= 4 ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                             </div>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => handleRemoveSubject(sub.id)}
                             className="size-12 rounded-2xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                           >
                             <Trash2 className="size-5" />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="p-10 bg-muted/10 border-t flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <ShieldCheck className="size-6 text-emerald-500" />
                   <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Données d'évaluation sécurisées</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-black mr-4">Total Coefficients: <span className="text-primary text-xl ml-2">{currentSubjects.reduce((acc, s) => acc + s.coef, 0)}</span></p>
                    <Button onClick={handleSave} className="rounded-xl font-black h-12 px-8 bg-foreground">Appliquer à l'école</Button>
                 </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
