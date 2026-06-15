"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Plus, 
  ChevronRight,
  History,
  FileDown,
  Wallet,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  PiggyBank,
  Sparkles,
  Zap,
  Calculator,
  HardDrive,
  Settings2,
  Save
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useState, useMemo, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore"
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

const OFFICIAL_CLASSES = [
  "6EME A", "6EME B", "5EME A", "5EME B", "4EME A", "4EME B", "3EME D1", "3EME D2",
  "2NDE A", "2NDE B", "2NDE C", "2NDE D",
  "1ERE A", "1ERE B", "1ERE C", "1ERE D",
  "TLE A", "TLE B", "TLE C", "TLE D"
]

export default function TreasuryModule() {
  const db = useFirestore()
  const [activeYear, setActiveYear] = useState("2026-2027")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAdding, setIsAdding] = useState(false)
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingFees, setSavingFees] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [studentSearch, setStudentSearch] = useState("")
  const [feesData, setFeesData] = useState<Record<string, string>>({})

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
  }, [])

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
  const { data: expenses } = useCollection(expensesQuery)
  const { data: students } = useCollection(studentsQuery)
  const { data: classFees } = useCollection(query(collection(db, "class_contributions"), where("academicYear", "==", activeYear)))

  useEffect(() => {
    if (classFees) {
      const data: Record<string, string> = {}
      classFees.forEach((f: any) => { data[f.classId] = f.amount.toString() })
      setFeesData(data)
    }
  }, [classFees])

  const stats = useMemo(() => {
    const totalReceived = payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
    const totalExpenses = expenses?.reduce((acc, e: any) => acc + (Number(e.amount) || 0), 0) || 0
    let expected = 0
    students?.forEach((s: any) => {
      const fee = classFees?.find((f: any) => f.classId === s.classId)?.amount || 150000
      expected += Number(fee)
    })
    const percent = expected > 0 ? (totalReceived / expected) * 100 : 0
    return { totalReceived, totalExpenses, balance: totalReceived - totalExpenses, percent }
  }, [payments, expenses, students, classFees])

  const filteredStudents = useMemo(() => {
    if (!students) return []
    return students.filter((s: any) => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) || 
      s.matricule.toLowerCase().includes(studentSearch.toLowerCase())
    )
  }, [students, studentSearch])

  const handleAddPayment = async () => {
    if (!formData.studentId || !formData.amountPaid) {
      toast({ title: "Champs requis", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const student = students?.find((s: any) => s.matricule === formData.studentId)
      await addDoc(collection(db, "payments"), {
        ...formData,
        amountPaid: Number(formData.amountPaid),
        studentName: student ? `${student.lastName} ${student.firstName}` : "Inconnu",
        academicYear: activeYear,
        createdAt: serverTimestamp(),
        author: localStorage.getItem('acadex_user_name') || "Direction"
      })
      toast({ title: "Encaissement scellé" })
      setIsAdding(false)
      setFormData({ studentId: "", amountPaid: "", description: "Scolarité - Tranche", date: new Date().toISOString().split('T')[0] })
    } catch (e) { toast({ title: "Erreur", variant: "destructive" }) }
    finally { setLoading(false) }
  }

  const handleSaveFees = async () => {
    setSavingFees(true)
    try {
      const batch = writeBatch(db)
      OFFICIAL_CLASSES.forEach(classId => {
        const amount = Number(feesData[classId]) || 150000
        const feeRef = doc(db, "class_contributions", `${classId}_${activeYear}`.replace(/\s/g, '_'))
        batch.set(feeRef, { classId, amount, academicYear: activeYear, updatedAt: serverTimestamp() })
      })
      await batch.commit()
      toast({ title: "Tarifs scellés" })
    } catch (e) { toast({ title: "Erreur", variant: "destructive" }) }
    finally { setSavingFees(false) }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
              Trésorerie <span className="text-primary italic">& Finance</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[8px] md:text-sm">
              <ShieldCheck className="size-3 md:size-4 text-emerald-500" />
              <span className="uppercase tracking-widest">Audit Certifié • {activeYear}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 md:flex-none h-11 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl border-2 font-black bg-white text-[10px] md:text-sm shadow-sm active:scale-95 transition-all">
              <FileDown className="mr-1.5 md:mr-2 size-3.5 md:size-4" /> Rapport
            </Button>
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 shadow-xl rounded-xl md:rounded-2xl h-11 md:h-14 px-5 md:px-10 font-black text-[10px] md:text-sm active:scale-95 transition-all">
                  <Plus className="mr-1.5 md:mr-2 size-3.5 md:size-4" /> Encaisser
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem] md:rounded-[3rem] w-[95%] max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                 <div className="p-6 md:p-10 bg-primary text-white">
                   <DialogTitle className="text-xl md:text-3xl font-black uppercase">Encaissement</DialogTitle>
                   <p className="text-white/40 font-bold text-[9px] uppercase tracking-widest mt-1">Scolarité • {activeYear}</p>
                 </div>
                 <div className="p-5 md:p-10 space-y-6 bg-[#F8FAFC]">
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <Label className="font-black text-[9px] uppercase text-muted-foreground px-1">Choisir Élève</Label>
                          <Input placeholder="Rechercher..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="h-11 rounded-xl bg-white border-none shadow-inner" />
                          <ScrollArea className="h-44 md:h-56 border-2 rounded-2xl p-2 bg-white/50">
                             {filteredStudents.map((s:any) => (
                               <button 
                                 key={s.id} 
                                 onClick={() => setFormData({...formData, studentId: s.matricule})} 
                                 className={cn(
                                   "w-full text-left p-3 rounded-xl text-xs font-bold transition-all mb-1 truncate uppercase", 
                                   formData.studentId === s.matricule ? "bg-primary text-white shadow-lg" : "hover:bg-muted/50"
                                 )}
                               >
                                 {s.lastName} {s.firstName}
                               </button>
                             ))}
                          </ScrollArea>
                       </div>
                       <div className="space-y-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                               <Label className="font-black text-[9px] uppercase text-muted-foreground">Montant (FCFA)</Label>
                               <Input type="number" value={formData.amountPaid} onChange={e => setFormData({...formData, amountPaid: e.target.value})} className="h-12 md:h-16 rounded-xl md:rounded-2xl text-center text-xl md:text-3xl font-black border-2 border-primary/10 shadow-sm focus:ring-primary" />
                            </div>
                            <div className="space-y-1.5">
                               <Label className="font-black text-[9px] uppercase text-muted-foreground">Motif</Label>
                               <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-11 rounded-xl font-bold border-2" />
                            </div>
                          </div>
                          <Button onClick={handleAddPayment} disabled={loading || !formData.studentId} className="w-full h-12 md:h-16 rounded-xl md:rounded-2xl bg-primary font-black text-[10px] md:text-lg shadow-xl active:scale-95 transition-all uppercase">
                            {loading ? <Loader2 className="animate-spin size-4" /> : "Valider Encaissement"}
                          </Button>
                       </div>
                    </div>
                 </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          <TabsList className="bg-white border-2 rounded-[1.2rem] md:rounded-[2.5rem] h-11 md:h-20 p-1 flex w-full md:w-fit shadow-md overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "dashboard", label: "Cockpit", icon: TrendingUp },
              { id: "encaissements", label: "Recettes", icon: Banknote },
              { id: "depenses", label: "Sorties", icon: PiggyBank },
              { id: "tarifs", label: "Tarifs", icon: Settings2 },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-lg md:rounded-[2rem] font-black px-4 md:px-10 text-[8px] md:text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-1.5 md:gap-3 shrink-0">
                <t.icon className="size-3.5 md:size-4.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
              {[
                { label: "Total Reçu", value: stats.totalReceived, icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50", suffix: "F" },
                { label: "Sorties", value: stats.totalExpenses, icon: PiggyBank, color: "text-red-600", bg: "bg-red-50", suffix: "F" },
                { label: "Solde Net", value: stats.balance, icon: Wallet, color: "text-primary", bg: "bg-primary/5", suffix: "F", premium: true },
                { label: "Taux", value: stats.percent.toFixed(1), icon: Calculator, color: "text-amber-600", bg: "bg-amber-50", suffix: "%" },
              ].map((kpi, i) => (
                <Card key={i} className={cn("p-4 md:p-9 rounded-[1.5rem] md:rounded-[3rem] border-none shadow-sm transition-all group overflow-hidden relative h-28 md:h-48 flex flex-col justify-between", kpi.premium ? "bg-foreground text-white shadow-xl" : "bg-white")}>
                  <div className={cn("absolute -top-4 -right-4 size-14 md:size-24 rounded-full opacity-[0.04]", kpi.premium ? "bg-primary" : kpi.bg)} />
                  <div className="flex items-center justify-between relative z-10">
                    <div className={cn("p-2 md:p-4 rounded-lg md:rounded-2xl shadow-sm transition-all group-hover:bg-primary group-hover:text-white", kpi.premium ? "bg-white/10 text-primary" : cn(kpi.bg, kpi.color))}>
                      <kpi.icon className="size-3.5 md:size-6" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className={cn("text-[7px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-60", kpi.premium ? "text-white" : "text-muted-foreground")}>{kpi.label}</p>
                    <h3 className="text-xs md:text-3xl font-black truncate tabular-nums">
                      {Number(kpi.value).toLocaleString()}<span className="text-[7px] md:text-sm opacity-40 ml-1">{kpi.suffix}</span>
                    </h3>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
              <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3.5rem] p-5 md:p-12">
                 <div className="flex items-center justify-between mb-8 md:mb-14">
                    <div className="space-y-1">
                      <h3 className="text-base md:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <History className="text-primary size-4 md:size-7" /> Flux Financier
                      </h3>
                      <p className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Audit des transactions scellées</p>
                    </div>
                 </div>
                 
                 <div className="space-y-2 md:space-y-4">
                    {loadingPayments ? (
                      <div className="py-20 text-center animate-pulse"><Loader2 className="animate-spin text-primary size-8" /></div>
                    ) : (payments?.length === 0 && expenses?.length === 0) ? (
                      <div className="py-24 text-center opacity-30 italic text-[10px] md:text-xl">Aucune donnée certifiée.</div>
                    ) : (
                      <div className="grid gap-2 md:gap-4">
                        {[...(payments || []), ...(expenses || [])]
                          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                          .slice(0, 6)
                          .map((tx: any, idx) => {
                            const isExpense = !!tx.category
                            return (
                              <div key={tx.id || idx} className="p-3 md:p-7 bg-muted/5 rounded-xl md:rounded-[2.5rem] border border-muted/20 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 md:gap-8 min-w-0">
                                   <div className={cn("size-9 md:size-14 rounded-lg md:rounded-2xl flex items-center justify-center shadow-sm shrink-0", isExpense ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                                     {isExpense ? <PiggyBank className="size-4 md:size-6" /> : <Banknote className="size-4 md:size-6" />}
                                   </div>
                                   <div className="min-w-0">
                                      <h4 className="font-black text-[10px] md:text-xl truncate uppercase tracking-tight">{isExpense ? tx.motif : tx.studentName}</h4>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("text-[6px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded-full", isExpense ? "border-red-100 text-red-600" : "border-emerald-100 text-emerald-600")}>
                                          {isExpense ? tx.category : tx.description}
                                        </Badge>
                                      </div>
                                   </div>
                                </div>
                                <div className="text-right shrink-0">
                                   <p className={cn("font-black text-xs md:text-2xl tabular-nums", isExpense ? "text-red-600" : "text-emerald-600")}>
                                     {isExpense ? '-' : '+'}{Number(isExpense ? tx.amount : tx.amountPaid).toLocaleString()}
                                   </p>
                                   <span className="text-[6px] md:text-[10px] font-bold text-muted-foreground/40 uppercase">{new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                </div>
                              </div>
                            )
                          })
                        }
                      </div>
                    )}
                 </div>
              </Card>

              <div className="lg:col-span-4 space-y-6">
                <Card className="p-7 md:p-12 rounded-[2rem] md:rounded-[3.5rem] bg-primary/5 border-2 border-dashed border-primary/20 group hover:bg-primary/10 transition-all relative overflow-hidden">
                   <div className="relative z-10 space-y-6 md:space-y-10">
                     <div className="flex items-center gap-4">
                       <div className="size-10 md:size-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5 animate-pulse">
                         <Sparkles className="size-4 md:size-8 text-primary" />
                       </div>
                       <h4 className="font-black text-sm md:text-2xl">Audit IA Brain</h4>
                     </div>
                     <p className="text-[10px] md:text-base font-medium text-muted-foreground italic leading-relaxed">
                       "Analyse scellée : Le taux de recouvrement global affiche une progression de +12% par rapport à 2025."
                     </p>
                     <Button asChild className="w-full bg-white text-primary border border-primary/10 rounded-xl md:rounded-2xl font-black h-11 md:h-16 shadow-sm active:scale-95 transition-all text-[10px] md:text-sm mobile-touch-target">
                       <Link href="/assistant">Lancer l'Audit</Link>
                     </Button>
                   </div>
                   <Zap className="absolute -bottom-10 -right-10 size-32 md:size-48 text-primary/5 pointer-events-none group-hover:scale-125 transition-transform duration-[3000ms]" />
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="encaissements" className="animate-in fade-in">
             <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden min-h-[400px]">
                <div className="p-5 md:p-12 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="space-y-0.5">
                      <h3 className="text-base md:text-3xl font-black tracking-tight uppercase">Journal Recettes</h3>
                      <Badge className="bg-primary text-white font-black px-4 py-1 rounded-full text-[8px] md:text-xs">CERTIFIÉ ACADEX</Badge>
                   </div>
                   <div className="relative group w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input placeholder="Chercher un élève..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-11 md:h-14 rounded-2xl bg-white border-2 font-bold text-xs md:text-sm shadow-sm" />
                   </div>
                </div>
                <div className="p-2 md:p-6 space-y-2 md:space-y-4">
                   {payments?.filter((p: any) => 
                      (p.studentName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                    ).map((p: any) => (
                      <div key={p.id} className="p-4 md:p-8 bg-muted/5 rounded-xl md:rounded-[2.5rem] border border-muted/20 hover:border-primary/10 hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-8 min-w-0">
                           <div className="size-9 md:size-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-sm md:text-2xl group-hover:scale-110 transition-transform">{(p.studentName || "?")[0]}</div>
                           <div className="min-w-0">
                             <p className="font-black text-xs md:text-xl text-foreground uppercase tracking-tight truncate">{p.studentName}</p>
                             <div className="flex items-center gap-2">
                               <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[7px] md:text-[9px] px-2 py-0.5 rounded-full">{p.description}</Badge>
                               <span className="text-[7px] md:text-[9px] font-bold text-muted-foreground uppercase hidden sm:inline-block">Le {new Date(p.date).toLocaleDateString('fr-FR')}</span>
                             </div>
                           </div>
                        </div>
                        <div className="text-right shrink-0">
                           <p className="font-black text-sm md:text-2xl text-emerald-600 tabular-nums">+{Number(p.amountPaid).toLocaleString()} F</p>
                           <span className="text-[7px] md:text-[9px] font-black text-muted-foreground uppercase opacity-40 sm:hidden">{new Date(p.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                   ))}
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="tarifs" className="animate-in fade-in">
             <Card className="border-none shadow-sm bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden">
                <div className="p-6 md:p-14 border-b bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="space-y-1">
                      <h3 className="text-lg md:text-3xl font-black tracking-tight uppercase">Contribution par <span className="text-primary italic">Classe</span></h3>
                      <p className="text-[8px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Scolarité attendue par niveau</p>
                   </div>
                   <Button onClick={handleSaveFees} disabled={savingFees} className="w-full md:w-auto h-12 md:h-16 px-8 md:px-14 rounded-xl md:rounded-2xl bg-primary font-black text-[10px] md:text-lg shadow-xl active:scale-95 transition-all">
                      {savingFees ? <Loader2 className="animate-spin mr-2 size-4" /> : <Save className="mr-2 size-4 md:size-5" />} Sceller les Tarifs
                   </Button>
                </div>
                <div className="p-5 md:p-14">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
                      {OFFICIAL_CLASSES.map((classId) => (
                        <div key={classId} className="space-y-1.5 p-3 md:p-6 bg-muted/5 rounded-2xl border-2 border-transparent hover:border-primary/10 transition-all">
                           <Label className="font-black text-[8px] md:text-[10px] uppercase text-muted-foreground px-1">{classId}</Label>
                           <div className="relative">
                             <Input 
                               type="number" 
                               value={feesData[classId] || "150000"} 
                               onChange={(e) => setFeesData({...feesData, [classId]: e.target.value})}
                               className="h-10 md:h-14 rounded-xl md:rounded-2xl border-2 font-black text-sm md:text-xl text-center pr-8 shadow-inner focus:ring-primary bg-white" 
                             />
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground">F</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}