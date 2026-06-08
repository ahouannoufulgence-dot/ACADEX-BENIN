
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
  Calendar as CalendarIcon,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Shapes,
  UserSquare2,
  Calculator,
  HardDrive,
  Banknote,
  PiggyBank
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { useState, useMemo, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, doc, getDoc, setDoc } from "firebase/firestore"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function TreasuryModule() {
  const db = useFirestore()
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAdding, setIsAdding] = useState(false)
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [studentSearch, setStudentSearch] = useState("")

  const [formData, setFormData] = useState({
    studentId: "",
    amountPaid: "",
    description: "Scolarité - Tranche",
    date: new Date().toISOString().split('T')[0]
  })

  const [expenseForm, setExpenseForm] = useState({
    category: "Fournitures",
    amount: "",
    motif: "",
    responsible: "",
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

  const expensesQuery = useMemo(() => query(
    collection(db, "expenses"), 
    where("academicYear", "==", activeYear),
    orderBy("date", "desc")
  ), [db, activeYear])

  const studentsQuery = useMemo(() => query(
    collection(db, "students"), 
    where("academicYear", "==", activeYear),
    where("status", "==", "Actif")
  ), [db, activeYear])

  const { data: payments, loading: loadingPayments } = useCollection(paymentsQuery)
  const { data: expenses, loading: loadingExpenses } = useCollection(expensesQuery)
  const { data: students } = useCollection(studentsQuery)

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) || 
      s.matricule.toLowerCase().includes(studentSearch.toLowerCase())
    )
  }, [students, studentSearch])

  const stats = useMemo(() => {
    const totalReceived = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const totalExpenses = expenses?.reduce((acc, e: any) => acc + (Number(e.amount) || 0), 0) || 0
    
    // Simulation d'objectif global (ex: 150.000 par élève)
    const expected = (students?.length || 0) * 150000
    const percent = expected > 0 ? (totalReceived / expected) * 100 : 0
    const balance = totalReceived - totalExpenses

    return { totalReceived, totalExpenses, expected, percent, balance }
  }, [payments, expenses, students])

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
      toast({ title: "Encaissement scellé" })
      setIsAdding(false)
      setFormData({ studentId: "", amountPaid: "", description: "Scolarité - Tranche", date: new Date().toISOString().split('T')[0] })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.motif) {
      toast({ title: "Champs requis", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, "expenses"), {
        ...expenseForm,
        amount: Number(expenseForm.amount),
        academicYear: activeYear,
        createdAt: serverTimestamp(),
        author: localStorage.getItem('acadex_user_name') || "Direction"
      })
      toast({ title: "Dépense enregistrée" })
      setIsAddingExpense(false)
      setExpenseForm({ category: "Fournitures", amount: "", motif: "", responsible: "", date: new Date().toISOString().split('T')[0] })
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Trésorerie <span className="text-primary italic">& Finance</span></h1>
            <div className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Pilotage financier de l'année scolaire <Badge className="bg-primary">{activeYear}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-12 px-6 rounded-2xl border-2 font-black bg-white">
              <FileDown className="mr-2 size-5" /> Rapport Global PDF
            </Button>
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-xl rounded-2xl h-12 px-8 font-black">
                  <Plus className="mr-2 size-5" /> Encaisser
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] max-w-2xl">
                 <DialogHeader><DialogTitle className="text-2xl font-black">Nouveau Paiement Élève</DialogTitle></DialogHeader>
                 <div className="grid md:grid-cols-2 gap-6 p-4">
                    <div className="space-y-4">
                       <Label className="font-black text-xs uppercase text-muted-foreground">Rechercher l'élève</Label>
                       <Input placeholder="Nom ou Matricule..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="h-12 rounded-xl" />
                       <ScrollArea className="h-48 border-2 rounded-xl p-2 bg-muted/30">
                          {filteredStudents.map((s:any) => (
                            <button key={s.id} onClick={() => setFormData({...formData, studentId: s.matricule})} className={cn("w-full text-left p-3 rounded-lg text-sm font-bold", formData.studentId === s.matricule ? "bg-primary text-white" : "hover:bg-white")}>
                              {s.lastName} {s.firstName} <p className="text-[10px] opacity-60">{s.matricule}</p>
                            </button>
                          ))}
                       </ScrollArea>
                    </div>
                    <div className="space-y-4">
                       <Label className="font-black text-xs uppercase text-muted-foreground">Montant (FCFA)</Label>
                       <Input type="number" value={formData.amountPaid} onChange={e => setFormData({...formData, amountPaid: e.target.value})} className="h-14 rounded-xl text-2xl font-black" />
                       <Label className="font-black text-xs uppercase text-muted-foreground">Motif</Label>
                       <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-12 rounded-xl font-bold" />
                       <Button onClick={handleAddPayment} disabled={loading} className="w-full h-14 rounded-xl bg-primary font-black text-lg">Valider Encaissement</Button>
                    </div>
                 </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border-2 rounded-[2rem] h-16 p-2 flex w-fit shadow-md overflow-x-auto no-scrollbar">
            {[
              { id: "dashboard", label: "Tableau de Bord", icon: TrendingUp },
              { id: "encaissements", label: "Encaissements", icon: Banknote },
              { id: "depenses", label: "Dépenses École", icon: PiggyBank },
              { id: "salaires", label: "Salaires Profs", icon: UserSquare2 },
              { id: "config", label: "Configuration Frais", icon: Calculator },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-2xl font-black px-8 text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex gap-2">
                <t.icon className="size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Total Reçu</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-emerald-600">{stats.totalReceived.toLocaleString()} F</h3>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ArrowUpRight className="size-6" /></div>
                </div>
              </Card>
              <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all border-l-8 border-red-500">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Total Dépenses</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-red-600">{stats.totalExpenses.toLocaleString()} F</h3>
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><ArrowDownRight className="size-6" /></div>
                </div>
              </Card>
              <Card className="p-8 rounded-[2.5rem] bg-foreground text-white border-none shadow-xl flex flex-col justify-between">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4">Solde Actuel</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-primary">{stats.balance.toLocaleString()} F</h3>
                  <div className="p-3 bg-white/10 rounded-2xl"><Wallet className="size-6 text-primary" /></div>
                </div>
              </Card>
              <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col justify-between border-l-8 border-amber-500">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Taux Recouvrement</p>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{stats.percent.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.percent} className="h-1.5" />
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[3rem] p-10">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black flex items-center gap-3"><History className="text-primary" /> Dernières Transactions</h3>
                    <Button variant="ghost" className="font-bold text-primary">Voir grand livre <ChevronRight className="ml-1 size-4" /></Button>
                 </div>
                 <div className="divide-y divide-muted/30">
                    {payments?.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="py-4 flex items-center justify-between hover:bg-muted/5 transition-all px-4 rounded-xl">
                         <div className="flex items-center gap-4">
                            <div className="size-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Banknote className="size-5" /></div>
                            <div>
                               <p className="font-black text-sm">{p.studentName}</p>
                               <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.description}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-emerald-600">+{Number(p.amountPaid).toLocaleString()} F</p>
                            <p className="text-[10px] font-bold text-muted-foreground">{new Date(p.date).toLocaleDateString('fr-FR')}</p>
                         </div>
                      </div>
                    ))}
                    {expenses?.slice(0, 5).map((e: any) => (
                      <div key={e.id} className="py-4 flex items-center justify-between hover:bg-muted/5 transition-all px-4 rounded-xl">
                         <div className="flex items-center gap-4">
                            <div className="size-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><PiggyBank className="size-5" /></div>
                            <div>
                               <p className="font-black text-sm">{e.motif}</p>
                               <p className="text-[10px] font-bold text-muted-foreground uppercase">{e.category}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-red-600">-{Number(e.amount).toLocaleString()} F</p>
                            <p className="text-[10px] font-bold text-muted-foreground">{new Date(e.date).toLocaleDateString('fr-FR')}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </Card>

              <div className="lg:col-span-4 space-y-6">
                 <Card className="p-8 rounded-[2.5rem] bg-primary/5 border-2 border-dashed border-primary/20 group hover:bg-primary/10 transition-all">
                    <div className="flex items-center gap-4 mb-6">
                      <Sparkles className="size-6 text-primary animate-pulse" />
                      <h4 className="font-black text-lg">IA Financière ACADEX</h4>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground italic leading-relaxed mb-6">
                      "Analyse : Les classes de 3EME présentent un retard de paiement de 12%. Souhaitez-vous générer des lettres de relance ?"
                    </p>
                    <Button asChild className="w-full bg-white text-primary border border-primary/10 rounded-xl font-black h-12 shadow-sm">
                      <Link href="/assistant">Lancer l'Audit IA</Link>
                    </Button>
                 </Card>

                 <Card className="p-8 rounded-[2.5rem] bg-amber-50 border-2 border-amber-100 flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-amber-700">
                       <AlertTriangle className="size-5" />
                       <h4 className="font-black text-sm uppercase">Alerte Trésorerie</h4>
                    </div>
                    <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                       24 élèves de Terminale n'ont pas encore soldé la deuxième tranche de scolarité.
                    </p>
                 </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="depenses" className="space-y-8">
             <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm">
                <div>
                   <h3 className="text-2xl font-black">Gestion des Sorties</h3>
                   <p className="text-muted-foreground font-medium">Contrôlez chaque franc dépensé par l'école.</p>
                </div>
                <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
                   <DialogTrigger asChild><Button className="bg-red-600 hover:bg-red-700 rounded-xl font-black px-8 h-12"><Plus className="mr-2" /> Nouvelle Dépense</Button></DialogTrigger>
                   <DialogContent className="rounded-[2.5rem]">
                      <DialogHeader><DialogTitle className="text-2xl font-black">Sortie de Caisse</DialogTitle></DialogHeader>
                      <div className="space-y-6 p-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <Label className="font-bold">Catégorie</Label>
                               <Select value={expenseForm.category} onValueChange={v => setExpenseForm({...expenseForm, category: v})}>
                                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                     <SelectItem value="Fournitures">Fournitures</SelectItem>
                                     <SelectItem value="Maintenance">Maintenance</SelectItem>
                                     <SelectItem value="Factures">Factures (Eau/Elec)</SelectItem>
                                     <SelectItem value="Internet">Internet</SelectItem>
                                     <SelectItem value="Événement">Événement</SelectItem>
                                  </SelectContent>
                               </Select>
                            </div>
                            <div className="space-y-2">
                               <Label className="font-bold">Montant (F)</Label>
                               <Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="h-12 rounded-xl font-black" />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <Label className="font-bold">Motif précis</Label>
                            <Input value={expenseForm.motif} onChange={e => setExpenseForm({...expenseForm, motif: e.target.value})} className="h-12 rounded-xl" placeholder="Ex: Achat de 20 boites de craies" />
                         </div>
                         <Button onClick={handleAddExpense} disabled={loading} className="w-full h-14 bg-red-600 rounded-xl font-black text-lg">Sceller la Dépense</Button>
                      </div>
                   </DialogContent>
                </Dialog>
             </div>
          </TabsContent>
          
          <TabsContent value="salaires">
             <Card className="p-20 text-center rounded-[3rem] border-4 border-dashed bg-muted/10 opacity-30">
                <UserSquare2 className="size-20 mx-auto mb-6" />
                <h3 className="text-2xl font-black">Module Salaires Enseignants</h3>
                <p className="max-w-sm mx-auto font-medium">Ce module est en cours de scellage sécurisé pour garantir la confidentialité des paiements du corps professoral.</p>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
