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
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Shapes,
  UserSquare2,
  Calculator,
  HardDrive,
  Banknote,
  PiggyBank,
  Sparkles,
  Zap
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
import Link from "next/link"

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
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        {/* Header - Optimized for Mobile First */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
              Trésorerie <span className="text-primary italic">& Finance</span>
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground font-bold text-[10px] md:text-sm">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span>Année Scolaire <Badge className="bg-primary text-[10px] ml-1">{activeYear}</Badge></span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-12 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl border-2 font-black bg-white text-[10px] md:text-sm transition-all active:scale-95">
              <FileDown className="mr-2 size-3.5 md:size-5" /> Rapport
            </Button>
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm transition-all active:scale-95">
                  <Plus className="mr-2 size-4 md:size-5" /> Encaisser
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.2rem] md:rounded-[3rem] w-[95%] max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                 <div className="p-6 md:p-10 bg-primary text-white">
                   <DialogTitle className="text-xl md:text-3xl font-black">Nouveau Paiement</DialogTitle>
                   <DialogDescription className="text-white/60 font-medium text-[10px] md:text-sm uppercase tracking-widest mt-1">Scolarité • {activeYear}</DialogDescription>
                 </div>
                 <div className="p-6 md:p-10 space-y-8 bg-[#F8FAFC]">
                    <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                       <div className="space-y-4">
                          <Label className="font-black text-[9px] uppercase text-muted-foreground tracking-widest px-1">Rechercher l'élève</Label>
                          <Input placeholder="Nom ou Matricule..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="h-12 rounded-xl bg-white border-none shadow-inner" />
                          <ScrollArea className="h-40 md:h-56 border-2 rounded-2xl p-2 bg-white/50">
                             {filteredStudents.map((s:any) => (
                               <button 
                                 key={s.id} 
                                 onClick={() => setFormData({...formData, studentId: s.matricule})} 
                                 className={cn(
                                   "w-full text-left p-3 rounded-xl text-xs md:text-sm font-bold transition-all mb-1", 
                                   formData.studentId === s.matricule ? "bg-primary text-white shadow-lg" : "hover:bg-muted/50"
                                 )}
                               >
                                 <p className="truncate uppercase">{s.lastName} {s.firstName}</p>
                                 <p className={cn("text-[9px] font-black opacity-60", formData.studentId === s.matricule ? "text-white" : "")}>{s.matricule}</p>
                               </button>
                             ))}
                          </ScrollArea>
                       </div>
                       <div className="space-y-4 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="space-y-2">
                               <Label className="font-black text-[9px] uppercase text-muted-foreground tracking-widest px-1">Montant (FCFA)</Label>
                               <Input type="number" value={formData.amountPaid} onChange={e => setFormData({...formData, amountPaid: e.target.value})} className="h-14 rounded-2xl text-center text-2xl font-black border-2 border-primary/10 shadow-sm focus:ring-primary" />
                            </div>
                            <div className="space-y-2">
                               <Label className="font-black text-[9px] uppercase text-muted-foreground tracking-widest px-1">Motif du versement</Label>
                               <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-12 rounded-xl font-bold border-2" />
                            </div>
                          </div>
                          <Button onClick={handleAddPayment} disabled={loading || !formData.studentId} className="w-full h-14 md:h-18 rounded-2xl bg-primary font-black text-sm md:text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin size-5 mr-2" /> : <ShieldCheck className="size-5 mr-2" />}
                            Valider l'Encaissement
                          </Button>
                       </div>
                    </div>
                 </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-[1.8rem] md:rounded-[2.5rem] h-14 md:h-20 p-1.5 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "dashboard", label: "Cockpit", icon: TrendingUp },
              { id: "encaissements", label: "Recettes", icon: Banknote },
              { id: "depenses", label: "Dépenses", icon: PiggyBank },
              { id: "salaires", label: "Salaires", icon: UserSquare2 },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-xl md:rounded-[2rem] font-black px-6 md:px-10 text-[9px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2 shrink-0">
                <t.icon className="size-3.5 md:size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
            {/* KPI Grid - Mobile Optimized (2x2) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { label: "Total Reçu", value: stats.totalReceived, icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50", suffix: "F" },
                { label: "Sorties", value: stats.totalExpenses, icon: PiggyBank, color: "text-red-600", bg: "bg-red-50", suffix: "F" },
                { label: "Solde", value: stats.balance, icon: Wallet, color: "text-primary", bg: "bg-primary/5", suffix: "F", premium: true },
                { label: "Taux", value: stats.percent.toFixed(1), icon: Calculator, color: "text-amber-600", bg: "bg-amber-50", suffix: "%" },
              ].map((kpi, i) => (
                <Card key={i} className={cn("p-5 md:p-9 rounded-[2rem] md:rounded-[3rem] border-none shadow-sm transition-all group overflow-hidden relative", kpi.premium ? "bg-foreground text-white shadow-xl" : "bg-white")}>
                  <div className={cn("absolute -top-4 -right-4 size-16 md:size-24 rounded-full opacity-[0.04] transition-transform group-hover:scale-150", kpi.premium ? "bg-primary/40" : kpi.bg)} />
                  <div className="flex items-center justify-between mb-4 md:mb-10 relative z-10">
                    <div className={cn("p-2.5 md:p-4 rounded-xl md:rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm", kpi.premium ? "bg-white/10 text-primary" : cn(kpi.bg, kpi.color))}>
                      <kpi.icon className="size-4 md:size-7" />
                    </div>
                    {kpi.label === 'Solde' ? <ShieldCheck className="size-3 md:size-4 text-primary/40" /> : <ArrowUpRight className="size-3 md:size-4 opacity-20" />}
                  </div>
                  <div className="relative z-10">
                    <p className={cn("text-[7px] md:text-[10px] font-black uppercase tracking-widest mb-1", kpi.premium ? "text-white/40" : "text-muted-foreground")}>{kpi.label}</p>
                    <h3 className="text-base md:text-3xl font-black truncate tabular-nums">
                      {Number(kpi.value).toLocaleString()}<span className="text-[10px] md:text-sm opacity-40 ml-1 font-bold">{kpi.suffix}</span>
                    </h3>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12">
                 <div className="flex items-center justify-between mb-8 md:mb-14">
                    <div className="space-y-1">
                      <h3 className="text-xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <History className="text-primary size-5 md:size-8" /> Flux Réel Live
                      </h3>
                      <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">Audit des transactions scellées</p>
                    </div>
                    <Button variant="ghost" className="font-black text-primary text-[10px] md:text-sm rounded-xl h-10 md:h-12 hover:bg-primary/5 transition-all">VOIR TOUT <ChevronRight className="ml-1 size-3.5" /></Button>
                 </div>
                 
                 <div className="space-y-2 md:space-y-3">
                    {loadingPayments ? (
                      <div className="py-20 text-center animate-pulse"><Loader2 className="animate-spin mx-auto text-primary/10 size-10" /></div>
                    ) : (payments?.length === 0 && expenses?.length === 0) ? (
                      <div className="py-20 text-center space-y-6 opacity-30">
                        <HardDrive className="size-16 mx-auto text-muted-foreground" />
                        <p className="italic font-medium text-sm md:text-xl">Aucune donnée certifiée pour l'instant.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {[...(payments || []), ...(expenses || [])]
                          .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
                          .slice(0, 6)
                          .map((tx: any, idx) => {
                            const isExpense = !!tx.category
                            return (
                              <div key={tx.id} className="p-4 md:p-7 bg-muted/5 rounded-[1.5rem] md:rounded-[2.5rem] border border-muted/20 hover:border-primary/10 hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between">
                                <div className="flex items-center gap-4 md:gap-8">
                                   <div className={cn("size-10 md:size-14 rounded-xl md:rounded-[1.2rem] flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", isExpense ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                                     {isExpense ? <PiggyBank className="size-5 md:size-7" /> : <Banknote className="size-5 md:size-7" />}
                                   </div>
                                   <div className="min-w-0">
                                      <h4 className="font-black text-sm md:text-xl truncate uppercase tracking-tight">{isExpense ? tx.motif : tx.studentName}</h4>
                                      <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={cn("text-[7px] md:text-[10px] font-black uppercase px-2 md:px-4 py-0.5 border-2 rounded-full", isExpense ? "border-red-100 text-red-600" : "border-emerald-100 text-emerald-600")}>
                                          {isExpense ? tx.category : tx.description}
                                        </Badge>
                                        <span className="text-[7px] md:text-[9px] font-bold text-muted-foreground uppercase hidden sm:inline-block">Scellé le {new Date(tx.date).toLocaleDateString('fr-FR')}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className={cn("font-black text-base md:text-2xl tabular-nums", isExpense ? "text-red-600" : "text-emerald-600")}>
                                     {isExpense ? '-' : '+'}{Number(isExpense ? tx.amount : tx.amountPaid).toLocaleString()} F
                                   </p>
                                   <span className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase opacity-40 sm:hidden">{new Date(tx.date).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>
                            )
                          })
                        }
                      </div>
                    )}
                 </div>
              </Card>

              <div className="lg:col-span-4 space-y-6 md:gap-10">
                <Card className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-primary/5 border-2 border-dashed border-primary/20 group hover:bg-primary/10 transition-all relative overflow-hidden">
                   <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-8 md:mb-10">
                       <div className="size-11 md:size-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5 animate-pulse">
                         <Sparkles className="size-5 md:size-7 text-primary fill-primary/10" />
                       </div>
                       <h4 className="font-black text-lg md:text-2xl">Audit IA Financier</h4>
                     </div>
                     <p className="text-[11px] md:text-base font-medium text-muted-foreground italic leading-relaxed mb-8 md:mb-12">
                       "Analyse : Les classes de 3EME présentent un retard de paiement de 12%. Souhaitez-vous générer des lettres de relance certifiées ?"
                     </p>
                     <Button asChild className="w-full bg-white text-primary border border-primary/10 rounded-xl md:rounded-2xl font-black h-12 md:h-16 shadow-sm active:scale-95 transition-all mobile-touch-target">
                       <Link href="/assistant">Lancer l'Audit Brain</Link>
                     </Button>
                   </div>
                   <Zap className="absolute -bottom-10 -left-10 size-40 text-primary/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                </Card>

                <Card className="p-7 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] bg-amber-50 border-2 border-amber-100 flex flex-col gap-5 md:gap-8 group">
                   <div className="flex items-center gap-4 text-amber-700">
                      <div className="size-9 md:size-11 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform"><AlertTriangle className="size-4 md:size-5" /></div>
                      <h4 className="font-black text-[10px] md:text-sm uppercase tracking-widest">Alerte Trésorerie</h4>
                   </div>
                   <p className="text-[10px] md:text-sm font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                      24 élèves de Terminale n'ont pas encore soldé la deuxième tranche de scolarité pour l'année {activeYear}.
                   </p>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="encaissements" className="animate-in fade-in">
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[4rem] overflow-hidden min-h-[500px]">
                <div className="p-6 md:p-12 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="space-y-1">
                      <h3 className="text-xl md:text-3xl font-black tracking-tight">Journal des Recettes</h3>
                      <Badge className="bg-primary text-white font-black px-4 py-1 rounded-full text-[8px] md:text-xs">{payments?.length || 0} ENCAISSEMENTS CERTIFIÉS</Badge>
                   </div>
                   <div className="relative group w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="Chercher par nom ou matricule..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 md:h-14 rounded-2xl bg-white border-2 font-bold text-sm"
                      />
                   </div>
                </div>
                
                {/* Mobile View: Cards */}
                <div className="md:hidden p-4 space-y-3">
                   {loadingPayments ? (
                     <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary size-8" /></div>
                   ) : payments?.filter((p: any) => 
                      (p.studentName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                      (p.studentId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                    ).map((p: any) => (
                      <div key={p.id} className="p-5 bg-muted/10 rounded-[1.8rem] border border-muted/50 flex flex-col gap-4 active:scale-95 transition-all">
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="font-black text-sm uppercase">{p.studentName}</p>
                               <p className="text-[9px] font-bold text-muted-foreground uppercase">{p.studentId}</p>
                            </div>
                            <Badge className="bg-emerald-500 text-white font-black text-xs h-10 px-4 rounded-xl">{Number(p.amountPaid).toLocaleString()} F</Badge>
                         </div>
                         <div className="flex justify-between items-center text-[8px] font-black uppercase text-muted-foreground">
                            <span>{p.description}</span>
                            <span>{new Date(p.date).toLocaleDateString('fr-FR')}</span>
                         </div>
                      </div>
                   ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                   <table className="w-full">
                      <thead className="bg-muted/20 text-[10px] font-black uppercase text-muted-foreground border-b">
                         <tr>
                            <th className="px-12 py-8 text-left tracking-widest">Élève & Identifiant</th>
                            <th className="px-12 py-8 text-left tracking-widest">Date Officielle</th>
                            <th className="px-12 py-8 text-left tracking-widest">Description</th>
                            <th className="px-12 py-8 text-right tracking-widest">Montant Encaissé</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/30">
                        {payments?.filter((p: any) => 
                          (p.studentName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                          (p.studentId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                        ).map((p: any) => (
                          <tr key={p.id} className="hover:bg-muted/5 transition-all group">
                            <td className="px-12 py-8">
                               <div className="flex items-center gap-6">
                                  <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">{(p.studentName || "?")[0]}</div>
                                  <div>
                                    <p className="font-black text-xl text-foreground uppercase tracking-tight">{p.studentName}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.studentId}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-12 py-8 font-bold text-muted-foreground text-sm uppercase">{new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                            <td className="px-12 py-8">
                               <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[10px] px-4 py-1 rounded-full">{p.description}</Badge>
                            </td>
                            <td className="px-12 py-8 text-right">
                               <span className="font-black text-2xl text-emerald-600 tabular-nums">{Number(p.amountPaid).toLocaleString()} F</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </Card>
          </TabsContent>
          
          <TabsContent value="depenses" className="animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm gap-6 mb-8 md:mb-12 border-2 border-primary/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000"><PiggyBank className="size-32" /></div>
                <div className="text-center md:text-left relative z-10">
                   <h3 className="text-xl md:text-3xl font-black tracking-tight">Pilotage des Sorties</h3>
                   <p className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">Contrôle de l'équilibre budgétaire</p>
                </div>
                <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
                   <DialogTrigger asChild>
                     <Button className="bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/20 rounded-2xl font-black px-10 h-14 md:h-18 w-full md:w-auto active:scale-95 transition-all text-sm md:text-lg relative z-10">
                       <Plus className="mr-2 size-5 md:size-6" /> Nouvelle Dépense
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="rounded-[2.5rem] w-[95%] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
                      <div className="p-6 md:p-10 bg-red-600 text-white">
                        <DialogTitle className="text-xl md:text-3xl font-black">Sortie de Caisse</DialogTitle>
                        <DialogDescription className="text-white/60 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">Audit • {activeYear}</DialogDescription>
                      </div>
                      <div className="p-6 md:p-10 space-y-6 bg-[#F8FAFC]">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <Label className="font-black text-[9px] uppercase text-muted-foreground tracking-widest px-1">Catégorie</Label>
                               <Select value={expenseForm.category} onValueChange={v => setExpenseForm({...expenseForm, category: v})}>
                                  <SelectTrigger className="h-12 rounded-xl border-2 font-bold text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent className="rounded-xl p-1">
                                     {["Fournitures", "Maintenance", "Factures", "Internet", "Événement"].map(v => (
                                       <SelectItem key={v} value={v} className="font-bold p-3 rounded-lg">{v}</SelectItem>
                                     ))}
                                  </SelectContent>
                               </Select>
                            </div>
                            <div className="space-y-2">
                               <Label className="font-black text-[9px] uppercase text-muted-foreground tracking-widest px-1">Montant (F)</Label>
                               <Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="h-12 rounded-xl border-2 font-black text-xl text-center" />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <Label className="font-black text-[9px] uppercase text-muted-foreground tracking-widest px-1">Motif précis</Label>
                            <Input value={expenseForm.motif} onChange={e => setExpenseForm({...expenseForm, motif: e.target.value})} className="h-12 rounded-xl border-2 font-bold text-sm" placeholder="Ex: Achat de 20 boites de craies" />
                         </div>
                         <Button onClick={handleAddExpense} disabled={loading} className="w-full h-14 md:h-16 bg-red-600 hover:bg-red-700 rounded-2xl font-black text-sm md:text-lg shadow-xl shadow-red-600/20 active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin mr-2 size-5" /> : <ShieldAlert className="size-5 mr-2" />}
                            Sceller la Dépense
                         </Button>
                      </div>
                   </DialogContent>
                </Dialog>
             </div>
             
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] md:rounded-[4rem] overflow-hidden min-h-[400px]">
                <div className="md:hidden p-4 space-y-3">
                   {loadingExpenses ? (
                     <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary size-8" /></div>
                   ) : expenses?.length === 0 ? (
                     <p className="text-center italic opacity-30 py-20 text-sm">Aucune dépense enregistrée.</p>
                   ) : expenses.map((e: any) => (
                      <div key={e.id} className="p-5 bg-red-50/50 rounded-[1.8rem] border border-red-100 flex flex-col gap-3 active:scale-95 transition-all">
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="font-black text-sm uppercase">{e.motif}</p>
                               <p className="text-[8px] font-black text-red-600 uppercase tracking-widest">{e.category}</p>
                            </div>
                            <p className="font-black text-red-600 text-lg">-{Number(e.amount).toLocaleString()} F</p>
                         </div>
                         <div className="flex justify-between items-center text-[7px] font-black uppercase text-muted-foreground opacity-60 pt-2 border-t border-red-100/50">
                            <span>Par: {e.author?.split(' ')[0]}</span>
                            <span>{new Date(e.date).toLocaleDateString('fr-FR')}</span>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                   <table className="w-full">
                      <thead className="bg-red-50/50 text-[10px] font-black uppercase text-red-700 border-b border-red-100">
                         <tr>
                            <th className="px-12 py-8 text-left tracking-widest">Motif & Responsable</th>
                            <th className="px-12 py-8 text-left tracking-widest">Catégorie</th>
                            <th className="px-12 py-8 text-left tracking-widest">Date</th>
                            <th className="px-12 py-8 text-right tracking-widest">Montant Sorti</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/30">
                        {expenses?.map((e: any) => (
                          <tr key={e.id} className="hover:bg-red-50/10 transition-all group">
                            <td className="px-12 py-8">
                               <div className="flex items-center gap-6">
                                  <div className="size-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12"><PiggyBank className="size-7" /></div>
                                  <div>
                                    <p className="font-black text-xl text-foreground uppercase tracking-tight group-hover:text-red-700 transition-colors">{e.motif}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Auteur: {e.author}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-12 py-8">
                               <Badge className="bg-red-50 text-red-700 border-red-100 font-black uppercase text-[10px] px-5 py-1.5 rounded-full shadow-sm">{e.category}</Badge>
                            </td>
                            <td className="px-12 py-8 font-bold text-muted-foreground text-sm uppercase">{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                            <td className="px-12 py-8 text-right">
                               <span className="font-black text-2xl text-red-600 tabular-nums">-{Number(e.amount).toLocaleString()} F</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </Card>
          </TabsContent>
          
          <TabsContent value="salaires" className="animate-in zoom-in-95">
             <Card className="p-20 md:p-40 text-center rounded-[3rem] md:rounded-[5rem] border-4 border-dashed bg-muted/10 opacity-30 flex flex-col items-center justify-center gap-8">
                <div className="size-20 md:size-32 bg-white rounded-[2rem] md:rounded-[3rem] flex items-center justify-center shadow-inner">
                  <UserSquare2 className="size-10 md:size-16 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl md:text-4xl font-black uppercase tracking-tight">Coffre-fort Salaires</h3>
                  <p className="max-w-sm mx-auto font-medium text-sm md:text-xl leading-relaxed">
                    "Ce module est en cours de scellage sécurisé pour garantir la confidentialité totale des paiements du corps professoral."
                  </p>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
