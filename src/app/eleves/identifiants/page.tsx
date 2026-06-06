
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Zap, 
  Copy, 
  Trash2, 
  FileDown, 
  Loader2, 
  CheckCircle2, 
  Search,
  Printer,
  Edit2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const officialClasses = ["6EME A", "6EME B", "5EME A", "5EME B", "4EME A", "4EME B", "3EME A", "3EME B", "2NDE C", "2NDE D", "1ERE D", "TLE D1"]

export default function GenIdentifiersPage() {
  const db = useFirestore()
  const [selectedClass, setSelectedClass] = useState("")
  const [count, setCount] = useState("50")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const idsQuery = useMemo(() => query(collection(db, "registration_ids"), orderBy("matricule", "asc")), [db])
  const { data: identifiers, loading: loadingIds } = useCollection(idsQuery)

  const filteredIds = useMemo(() => {
    if (!identifiers) return []
    return identifiers.filter((id: any) => 
      id.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.classId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [identifiers, searchTerm])

  const handleGenerate = async () => {
    if (!selectedClass || !count) {
      toast({ title: "Champs requis", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const batchSize = parseInt(count)
      const classTag = selectedClass.replace(/\s/g, '').toUpperCase()
      
      // Utilisation d'un batch pour la performance
      for (let i = 1; i <= batchSize; i++) {
        const num = i.toString().padStart(3, '0')
        const matricule = `ELV-${classTag}-${num}`
        
        await addDoc(collection(db, "registration_ids"), {
          matricule,
          classId: selectedClass,
          status: "non utilisé",
          createdAt: serverTimestamp()
        })
      }
      
      toast({ title: "Génération réussie", description: `${batchSize} identifiants créés pour la ${selectedClass}.` })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    deleteDoc(doc(db, "registration_ids", id))
    toast({ title: "Identifiant supprimé" })
  }

  const handleExportPDF = () => {
    if (filteredIds.length === 0) return
    const docPdf = new jsPDF()
    docPdf.setFillColor(20, 83, 45)
    docPdf.rect(0, 0, 210, 30, 'F')
    docPdf.setTextColor(255, 255, 255)
    docPdf.setFontSize(16)
    docPdf.text(`LISTE DES IDENTIFIANTS D'INSCRIPTION - ${selectedClass || 'TOUTES CLASSES'}`, 105, 20, { align: "center" })

    autoTable(docPdf, {
      startY: 40,
      head: [['Identifiant', 'Classe', 'Statut']],
      body: filteredIds.map((id: any) => [id.matricule, id.classId, id.status.toUpperCase()]),
      headStyles: { fillColor: [20, 83, 45] }
    })
    docPdf.save(`IDENTIFIANTS_ACADEX_${new Date().getTime()}.pdf`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copié !", description: text })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Générer Identifiants <span className="text-primary italic">Élèves</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Créez les clés d'accès que les élèves utiliseront pour s'inscrire eux-mêmes.</p>
          </div>
          <Button onClick={handleExportPDF} variant="outline" className="border-2 rounded-2xl h-12 px-6 font-black bg-white">
            <FileDown className="mr-2 size-5" /> Télécharger PDF
          </Button>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <Label className="font-black text-xs uppercase text-muted-foreground px-2">Classe</Label>
              <Select onValueChange={setSelectedClass}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-black"><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>{officialClasses.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-black text-xs uppercase text-muted-foreground px-2">Nombre d'identifiants</Label>
              <Input type="number" value={count} onChange={(e) => setCount(e.target.value)} className="h-14 rounded-2xl border-2 font-black text-lg" />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleGenerate} disabled={loading || !selectedClass} className="w-full h-14 bg-primary hover:bg-primary/90 shadow-xl rounded-2xl font-black text-lg">
                {loading ? <Loader2 className="mr-2 size-6 animate-spin" /> : <Zap className="mr-2 size-6 fill-white" />}
                Générer les Identifiants
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Rechercher un identifiant..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
            />
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <div className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b">
                    <th className="px-8 py-5 text-left">Identifiant</th>
                    <th className="px-8 py-5 text-left">Classe</th>
                    <th className="px-8 py-5 text-center">Statut</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
                  {loadingIds ? (
                    <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="size-10 animate-spin mx-auto text-primary" /></td></tr>
                  ) : filteredIds.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center font-bold text-muted-foreground">Aucun identifiant trouvé.</td></tr>
                  ) : (
                    filteredIds.map((id: any) => (
                      <tr key={id.id} className="hover:bg-muted/5 transition-colors group">
                        <td className="px-8 py-4">
                          <span className="font-black text-lg tracking-wider">{id.matricule}</span>
                        </td>
                        <td className="px-8 py-4 font-bold text-muted-foreground">{id.classId}</td>
                        <td className="px-8 py-4 text-center">
                          <Badge variant="outline" className={`font-black rounded-full px-4 border-2 ${id.status === 'utilisé' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 'border-amber-100 text-amber-600 bg-amber-50'}`}>
                            {id.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button onClick={() => copyToClipboard(id.matricule)} variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-primary/10 hover:text-primary">
                              <Copy className="size-4" />
                            </Button>
                            <Button onClick={() => handleDelete(id.id)} variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
