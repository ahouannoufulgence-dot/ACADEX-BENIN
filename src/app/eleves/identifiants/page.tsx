
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Zap, 
  Copy, 
  Trash2, 
  FileDown, 
  Loader2, 
  Search,
  ChevronLeft,
  ShieldCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { cn } from "@/lib/utils"

const officialClasses = [
  "6EME A", "6EME B", "5EME A", "5EME B", "4EME A", "4EME B", "3EME D1", "3EME D2",
  "2NDE A", "2NDE B", "2NDE C", "2NDE D",
  "1ERE A", "1ERE B", "1ERE C", "1ERE D",
  "TLE A", "TLE B", "TLE C", "TLE D"
]

export default function GenIdentifiersPage() {
  const [selectedClass, setSelectedClass] = useState("")
  const [count, setCount] = useState("50")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [mounted, setMounted] = useState(false)
  const [identifiers, setIdentifiers] = useState<any[]>([])
  const [loadingIds, setLoadingIds] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchIds = async () => {
    setLoadingIds(true)
    const { data } = await supabase.from('registration_ids').select('*').order('matricule', { ascending: true })
    setIdentifiers(data || [])
    setLoadingIds(false)
  }

  useEffect(() => { fetchIds() }, [])

  const filteredIds = useMemo(() => {
    if (!identifiers) return []
    return identifiers.filter((id: any) => 
      (id.matricule?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (id.class_id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  }, [identifiers, searchTerm])

  const handleGenerate = async () => {
    if (!selectedClass || !count) {
      toast({ title: "Champs requis", variant: "destructive" })
      return
    }

    const batchSize = parseInt(count)
    if (isNaN(batchSize) || batchSize <= 0) {
      toast({ title: "Quantité invalide", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const classTag = selectedClass.replace(/\s/g, '').toUpperCase()
      const newIds = []
      
      for (let i = 1; i <= batchSize; i++) {
        const num = Math.floor(10000 + Math.random() * 90000).toString()
        const matricule = `ELV-${classTag}-${num}`
        newIds.push({
          matricule,
          class_id: selectedClass,
          status: "non utilisé"
        })
      }
      
      const { error } = await supabase.from('registration_ids').insert(newIds)
      if (error) throw error

      toast({ title: "Génération terminée", description: `${batchSize} identifiants créés pour la classe ${selectedClass}.` })
      fetchIds()
    } catch (err) {
      toast({ title: "Erreur de génération", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('registration_ids').delete().eq('id', id)
    if (!error) {
      toast({ title: "Identifiant supprimé" })
      fetchIds()
    }
  }

  const copyToClipboard = (text: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text)
      toast({ title: "Copié !", description: text })
    }
  }

  const handleExportPDF = () => {
    if (filteredIds.length === 0) {
      toast({ title: "Aucune donnée à exporter" })
      return
    }

    const docPdf = new jsPDF()
    
    const grouped = filteredIds.reduce((acc: Record<string, any[]>, curr: any) => {
      if (!acc[curr.class_id]) acc[curr.class_id] = []
      acc[curr.class_id].push(curr)
      return acc
    }, {})

    const sortedClasses = Object.keys(grouped).sort()

    sortedClasses.forEach((classId, index) => {
      if (index > 0) docPdf.addPage()

      docPdf.setFillColor(20, 83, 45)
      docPdf.rect(0, 0, 210, 30, 'F')
      docPdf.setTextColor(255, 255, 255)
      docPdf.setFontSize(16)
      docPdf.text(`ACADEX - LISTE D'INSCRIPTION`, 105, 15, { align: "center" })
      docPdf.setFontSize(12)
      docPdf.text(`CLASSE : ${classId.toUpperCase()}`, 105, 24, { align: "center" })

      const classData = grouped[classId]

      autoTable(docPdf, {
        startY: 40,
        head: [['Identifiant Unique', 'Classe', 'Statut Activation']],
        body: classData.map((id: any) => [id.matricule, id.class_id, id.status === 'utilisé' ? 'UTILISÉ' : 'À DISTRIBUER']),
        headStyles: { fillColor: [20, 83, 45], halign: 'center' },
        bodyStyles: { fontStyle: 'bold', halign: 'center' },
        columnStyles: { 
          0: { cellWidth: 100, fontStyle: 'bold' }
        },
        theme: 'grid'
      })

      docPdf.setTextColor(150, 150, 150)
      docPdf.setFontSize(8)
      docPdf.text(`Document certifié ACADEX - Classe ${classId}`, 105, 285, { align: "center" })
    })

    docPdf.save(`IDENTIFIANTS_PAR_CLASSE_ACADEX.pdf`)
    toast({ title: "Exportation Réussie", description: "Le PDF est organisé avec 1 page par classe." })
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
              Gestion <span className="text-primary italic">Identifiants</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[9px] md:text-sm uppercase tracking-widest">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" /> Pilotage Administratif
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="flex-1 md:flex-none border-2 rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-8 font-black bg-white text-[10px] md:text-sm active:scale-95 transition-all">
              <FileDown className="mr-2 size-4" /> PDF Par Classe
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] p-5 md:p-10 border-l-[8px] md:border-l-[15px] border-primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 items-end">
            <div className="space-y-1.5">
              <Label className="font-black text-[9px] md:text-[10px] uppercase text-muted-foreground px-2">Classe Cible</Label>
              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-xs md:text-base"><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent className="rounded-xl border-2 p-1">
                  {officialClasses.map(c => <SelectItem key={c} value={c} className="font-bold p-2.5 rounded-lg text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-black text-[9px] md:text-[10px] uppercase text-muted-foreground px-2">Quantité</Label>
              <Input type="number" min="1" max="500" value={count} onChange={(e) => setCount(e.target.value)} className="h-11 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-base md:text-xl text-center" />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={handleGenerate} disabled={loading || !selectedClass} className="w-full h-11 md:h-14 bg-primary hover:bg-primary/90 shadow-xl rounded-xl md:rounded-2xl font-black text-[10px] md:text-lg transition-all active:scale-95 uppercase">
                {loading ? <Loader2 className="mr-2 size-4 md:size-6 animate-spin" /> : <Zap className="mr-2 size-4 md:size-6 fill-white" />}
                Générer les Codes Live
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4 md:space-y-6">
          <div className="relative group max-w-md px-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 md:size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Chercher un matricule..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 md:h-16 bg-white border-none shadow-sm rounded-xl md:rounded-2xl font-bold text-xs md:text-base"
            />
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-muted/30 text-[8px] md:text-[10px] font-black uppercase text-muted-foreground border-b tracking-widest">
                  <tr>
                    <th className="px-5 py-5 md:px-10 md:py-8">Identifiant</th>
                    <th className="px-5 py-5 md:px-10 md:py-8">Classe</th>
                    <th className="px-5 py-5 md:px-10 md:py-8 text-center">Statut</th>
                    <th className="px-5 py-5 md:px-10 md:py-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/10">
                  {loadingIds ? (
                    <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="size-10 animate-spin mx-auto text-primary/20" /></td></tr>
                  ) : filteredIds.length === 0 ? (
                    <tr><td colSpan={4} className="p-24 text-center">
                      <div className="size-16 md:size-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-20"><Zap className="size-8 md:size-10 text-muted-foreground" /></div>
                      <p className="font-black text-muted-foreground/40 uppercase tracking-widest text-[10px] md:text-sm">Aucun code en circulation.</p>
                    </td></tr>
                  ) : (
                    filteredIds.map((id: any) => (
                      <tr key={id.id} className="hover:bg-muted/5 transition-colors group">
                        <td className="px-5 py-4 md:px-10 md:py-8">
                          <span className="font-black text-sm md:text-2xl tracking-tighter tabular-nums text-foreground">{id.matricule}</span>
                        </td>
                        <td className="px-5 py-4 md:px-10 md:py-8">
                           <Badge variant="outline" className="font-black text-[8px] md:text-xs border-primary/20 text-primary px-3">{id.class_id}</Badge>
                        </td>
                        <td className="px-5 py-4 md:px-10 md:py-8 text-center">
                          <Badge className={cn(
                            "font-black rounded-full px-3 md:px-5 py-1 text-[7px] md:text-[10px] uppercase shadow-sm",
                            id.status === 'utilisé' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                          )}>
                            {id.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 md:px-10 md:py-8 text-right">
                          <div className="flex justify-end gap-2 md:gap-3">
                            <Button onClick={() => copyToClipboard(id.matricule)} variant="ghost" size="icon" className="size-9 md:size-12 rounded-lg md:rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                              <Copy className="size-4 md:size-5" />
                            </Button>
                            <Button onClick={() => handleDelete(id.id)} variant="ghost" size="icon" className="size-9 md:size-12 rounded-lg md:rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all">
                              <Trash2 className="size-4 md:size-5" />
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
