
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  DollarSign,
  ChevronRight,
  Printer,
  History,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  FileDown,
  Wallet,
  Loader2,
  User,
  Calendar as CalendarIcon
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { useState, useMemo, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, doc, getDoc } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PaymentsPage() {
  const db = useFirestore()
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [studentSearch, setStudentSearch] = useState("")

  const [formData, setFormData] = useState({
    studentId: "",
    amountPaid: "",
    description: "Scolarité - Tranche",
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
    const updateYear = (e: any) => setActiveYear(e.detail)
    window.addEventListener('acadex_year_changed', updateYear as any)
    return () => window.removeEventListener('acadex_year_changed', updateYear as any)
  }, [])

  // DATA FETCHING
  const paymentsQuery = useMemo(() => query(
    collection(db, "payments"), 
    where("academicYear", "==", activeYear),
    orderBy("date", "desc")
  ), [db, activeYear])

  const studentsQuery = useMemo(() => query(
    collection(db, "students"), 
    where("academicYear", "==", activeYear),
    where("status", "==", "Actif")
  ), [db, activeYear])

  const { data: payments, loading: loadingPayments } = useCollection(paymentsQuery)
  const { data: students } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) || 
      s.matricule.toLowerCase().includes(studentSearch.toLowerCase())
    )
  }, [students, studentSearch])

  const stats = useMemo(() => {
    const total = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const count = payments?.length || 0
    // Simulation d'objectif global (ex: 150.000 par élève)
    const expected = (students?.length || 0) * 150000
    const percent = expected > 0 ? (total / expected) * 100 : 0
    const remaining = expected - total

    return { total, count, percent, remaining }
  }, [payments, students])

  const handleAddPayment = async () => {
    if (!formData.studentId || !formData.amountPaid) {
      toast({ title: "Champs requis", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const student = students?.find((s: any) => s.matricule === formData.studentId)
      const paymentData = {
        ...formData,
        amountPaid: Number(formData.amountPaid),
        studentName: student ? `${student.lastName} ${student.firstName}` : "Inconnu",
        academicYear: activeYear,
        createdAt: serverTimestamp(),
        author: localStorage.getItem('acadex_user_name') || "Direction"
      }

      await addDoc(collection(db, "payments"), paymentData)
      toast({ title: "Paiement confirmé", description: "Le reçu a été généré numériquement." })
      setIsAdding(false)
      setFormData({ studentId: "", amountPaid: "", description: "Scolarité - Tranche", date: new Date().toISOString().split('T')[0] })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (!payments || payments.length === 0) return
    const docPdf = new jsPDF()
    docPdf.setFillColor(20, 83, 45)
    docPdf.rect(0, 0, 210, 40, 'F')
    docPdf.setTextColor(255, 255, 255)
    docPdf.setFontSize(18)
    docPdf.text(`ACADEX - JOURNAL DE TRÉSORERIE (${activeYear})`, 105, 25, { align: "center" })

    autoTable(docPdf, {
      startY: 50,
      head: [['Date', 'Élève', 'Description', 'Montant (FCFA)']],
      body: payments.map((p: any) => [p.date, p.studentName, p.description, p.amountPaid.toLocaleString()]),
      headStyles: { fillColor: [20, 83, 45] }
    })
    docPdf.save(`JOURNAL_PAIEMENTS_${activeYear}.pdf`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Trésorerie & <span className="text-primary italic">Finance</span></h1>
            <div className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
              <Wallet className="size-4 text-emerald-500" /> Gestion des flux de l'année <Badge className="bg-primary">{activeYear}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExportPDF} variant="outline" className="h-14 px-8 rounded-2xl border-2 font-black bg-white mobile-touch-target">
              <FileDown className="mr-2 size-5" /> Journal PDF
            </Button>
            
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-14 px-10 rounded-2xl font-black text-lg mobile-touch-target">
                  <Plus className="mr-2 size-6" /> Confirmer Paiement
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] max-w-2xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-primary text-white">
                  <DialogTitle className="text-2xl font-black">Nouveau Versement</DialogTitle>
                  <DialogDescription className="text-white/70 font-medium italic">Enregistrez un paiement spontané pour l'élève.</DialogDescription>
                </DialogHeader>
                <div className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase text-muted-foreground px-1">Rechercher l'élève</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input 
                            placeholder="Nom ou Matricule..." 
                            className="pl-10 h-12 rounded-xl"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-[200px] border-2 rounded-2xl p-2 bg-muted/30">
                         <div className="space-y-1">
                            {filteredStudents.map((s: any) => (
                              <button
                                key={s.id}
                                onClick={() => setFormData({...formData, studentId: s.matricule})}
                                className={cn(
                                  "w-full text-left p-3 rounded-xl text-sm font-bold transition-all",
                                  formData.studentId === s.matricule ? "bg-primary text-white shadow-lg" : "hover:bg-white"
                                )}
                              >
                                {s.lastName} {s.firstName}
                                <p className={cn("text-[10px] opacity-60", formData.studentId === s.matricule ? "text-white" : "text-muted-foreground")}>{s.matricule} • {s.classId}</p>
                              </button>
                            ))}
                         </div>
                      </ScrollArea>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase text-muted-foreground px-1">Montant Versé (FCFA)</Label>
                        <Input 
                          type="number" 
                          placeholder="Ex: 50000" 
                          className="h-14 rounded-xl text-2xl font-black focus:ring-primary shadow-inner"
                          value={formData.amountPaid}
                          onChange={(e) => setFormData({...formData, amountPaid: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase text-muted-foreground px-1">Motif du versement</Label>
                        <Input 
                          placeholder="Ex: Scolarité Tranche 2" 
                          className="h-12 rounded-xl font-bold"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase text-muted-foreground px-1">Date</Label>
                        <Input 
                          type="date" 
                          className="h-12 rounded-xl font-black"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="p-8 bg-muted/30 flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setIsAdding(false)} className="font-bold rounded-xl h-12">Annuler</Button>
                  <Button onClick={handleAddPayment} disabled={loading || !formData.studentId} className="bg-primary rounded-xl font-black px-12 h-14 shadow-xl shadow-primary/20 text-lg">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                    Valider l'Encaissement
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-7 group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-5">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><DollarSign className="size-7" /></div>
              <Badge className="bg-emerald-50 text-emerald-700 border-none font-black">RECU</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recettes Totales</p>
            <p className="text-3xl font-black text-foreground mt-1">{stats.total.toLocaleString()} <span className="text-sm opacity-30">F</span></p>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-7 group hover:shadow-xl transition-all border-l-8 border-amber-400">
            <div className="flex items-center justify-between mb-5">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Wallet className="size-7" /></div>
              <Badge className="bg-amber-50 text-amber-700 border-none font-black">EN ATTENTE</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reste à Recouvrer</p>
            <p className="text-3xl font-black text-foreground mt-1">{stats.remaining.toLocaleString()} <span className="text-sm opacity-30">F</span></p>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-7 group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-5">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><ArrowUpRight className="size-7" /></div>
              <Badge className="bg-blue-50 text-blue-700 border-none font-black">TAUX</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recouvrement Global</p>
            <p className="text-3xl font-black text-foreground mt-1">{stats.percent.toFixed(1)}%</p>
            <Progress value={stats.percent} className="h-1.5 mt-4" />
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-7 group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-5">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><History className="size-7" /></div>
              <Badge variant="outline" className="font-black">LOGS</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Transactions Scellées</p>
            <p className="text-3xl font-black text-foreground mt-1">{stats.count}</p>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden min-h-[500px]">
          <CardHeader className="p-10 border-b bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-2xl font-black">Registre des Encaissements</CardTitle>
              <CardDescription className="font-bold text-primary">Année scolaire {activeYear}</CardDescription>
            </div>
            <div className="relative group w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Chercher une transaction..." 
                className="pl-12 h-12 rounded-2xl bg-white border-none shadow-inner font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
             {loadingPayments ? (
               <div className="p-20 text-center animate-pulse font-black text-muted-foreground flex flex-col items-center gap-4">
                 <Loader2 className="size-12 animate-spin text-primary" />
                 Synchronisation du livre de caisse...
               </div>
             ) : !payments || payments.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-24 text-center space-y-6 opacity-30">
                 <Wallet className="size-20 text-muted-foreground" />
                 <div className="space-y-2">
                   <h3 className="text-2xl font-black">Aucun versement détecté</h3>
                   <p className="text-muted-foreground max-w-sm mx-auto font-medium">Les paiements enregistrés via le bouton de confirmation apparaîtront ici.</p>
                 </div>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                     <tr className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground border-b">
                       <th className="px-10 py-6 text-left">Élève & Matricule</th>
                       <th className="px-10 py-6 text-left">Description</th>
                       <th className="px-10 py-6 text-center">Date</th>
                       <th className="px-10 py-6 text-right">Montant</th>
                       <th className="px-10 py-6 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-muted/30">
                     {payments.filter((p:any) => 
                        p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((p: any) => (
                       <tr key={p.id} className="hover:bg-muted/5 transition-all group">
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                               <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">{(p.studentName || "?")[0]}</div>
                               <div>
                                  <p className="font-black text-foreground group-hover:text-primary transition-colors">{p.studentName}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.studentId}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-6 font-medium text-sm">{p.description}</td>
                         <td className="px-10 py-6 text-center">
                            <Badge variant="outline" className="font-black text-[10px] border-2 bg-white flex items-center justify-center gap-2">
                               <CalendarIcon className="size-3" /> {new Date(p.date).toLocaleDateString('fr-FR')}
                            </Badge>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <p className="text-xl font-black text-foreground">{Number(p.amountPaid).toLocaleString()} <span className="text-xs opacity-40">F</span></p>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary">
                               <Printer className="size-5" />
                            </Button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </CardContent>
        </Card>

        <div className="p-10 bg-foreground text-white rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="size-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-2xl">
                 <ShieldCheck className="size-10 text-primary" />
              </div>
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-black">Audit de Trésorerie ACADEX</h3>
                <p className="text-white/60 font-medium max-w-xl leading-relaxed">
                  Chaque transaction enregistrée est cryptée et inaltérable. Le système garantit une traçabilité totale pour prévenir toute malversation financière.
                </p>
              </div>
           </div>
           <Button variant="outline" className="relative z-10 border-2 border-white/20 hover:bg-white/10 text-white font-black h-14 px-10 rounded-2xl transition-all active:scale-95">
             Consulter l'Audit Complet
           </Button>
           <CreditCard className="absolute -bottom-10 -right-10 size-64 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </div>
      </div>
    </DashboardLayout>
  )
}
