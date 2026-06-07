
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, Save, ShieldCheck, Zap, BookOpen, AlertCircle, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase"
import { doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore"

const BENIN_SUBJECTS = ["Mathématiques", "Français", "Anglais", "PCT", "SVT", "Histoire-Géo", "Philosophie", "EPS", "Informatique"]
const LEVELS = ["6EME", "5EME", "4EME", "3EME", "2NDE", "1ERE", "TLE"]

export default function SubjectsAndCoefficientsPage() {
  const db = useFirestore()
  const [selectedLevel, setSelectedLevel] = useState("TLE")
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, "subject_configs"))
      setConfigs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchConfigs() }, [db])

  const handleAddOrUpdate = async (name: string, coef: number) => {
    const configId = `${selectedLevel}_${name}`
    try {
      await setDoc(doc(db, "subject_configs", configId), { level: selectedLevel, subject: name, coef })
      toast({ title: "Configurée !", description: `${name} en ${selectedLevel} : Coef ${coef}` })
      fetchConfigs()
    } catch (e) { toast({ title: "Erreur", variant: "destructive" }) }
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "subject_configs", id))
    fetchConfigs()
  }

  const currentLevelConfigs = configs.filter(c => c.level === selectedLevel)

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Matières & <span className="text-primary italic">Coefficients</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Architecture scolaire intelligente par niveau.</p>
          </div>
          <Badge className="bg-primary text-white px-8 py-2 rounded-full font-black text-lg shadow-xl shadow-primary/20">
            SYSTÈME BÉNINOIS
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm">
               <h3 className="text-xl font-black mb-6">Configuration Niveau</h3>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground px-2">Choisir le niveau</label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue /></SelectTrigger>
                      <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l} className="font-bold">{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-6 bg-muted/30 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-primary"><AlertCircle className="size-5" /><p className="text-xs font-black uppercase">Note Directoriale</p></div>
                    <p className="text-xs font-medium leading-relaxed italic">"Ces coefficients seront appliqués automatiquement à toutes les notes saisies par les enseignants pour ce niveau."</p>
                  </div>
               </div>
            </Card>

            <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm h-fit">
               <h3 className="text-lg font-black mb-4">Assigner Coef.</h3>
               <div className="grid gap-2">
                 {BENIN_SUBJECTS.map(sub => (
                   <div key={sub} className="flex gap-2">
                      <Button variant="outline" className="flex-1 justify-start font-bold rounded-xl h-12" onClick={() => handleAddOrUpdate(sub, 2)}>{sub}</Button>
                   </div>
                 ))}
               </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
               <CardHeader className="p-10 border-b bg-muted/10">
                 <CardTitle className="text-2xl font-black">Grille de Pondération : {selectedLevel}</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                 {currentLevelConfigs.length === 0 ? (
                   <div className="p-20 text-center opacity-30 italic font-medium">Aucune matière configurée pour ce niveau.</div>
                 ) : (
                   <div className="divide-y divide-muted/30">
                     {currentLevelConfigs.map(c => (
                       <div key={c.id} className="p-8 flex items-center justify-between group hover:bg-muted/5 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20"><Calculator className="size-6" /></div>
                             <h4 className="text-xl font-black text-foreground">{c.subject}</h4>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className="text-center">
                               <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Coefficient</p>
                               <Input 
                                 type="number" 
                                 value={c.coef} 
                                 onChange={(e) => handleAddOrUpdate(c.subject, Number(e.target.value))}
                                 className="w-20 h-12 rounded-xl text-center text-xl font-black border-2" 
                               />
                             </div>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="size-12 rounded-xl text-destructive hover:bg-destructive/10"><Trash2 /></Button>
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
