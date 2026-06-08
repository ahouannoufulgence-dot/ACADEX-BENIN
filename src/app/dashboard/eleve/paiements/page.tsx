
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { CreditCard, DollarSign, History, CheckCircle2, AlertCircle, FileDown, ShieldCheck, Wallet, Info, Lock } from "lucide-react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, doc, onSnapshot } from "firebase/firestore"
import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function StudentPaymentsPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")
  const [activeYear, setActiveYear] = useState("")
  const [expectedFee, setExpectedFee] = useState(150000)

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
    setActiveYear(localStorage.getItem('acadex_active_year') || "2026-2027")
  }, [])

  const paymentsQuery = useMemo(() => {
    if (!db || !studentId || !activeYear) return null
    return query(
      collection(db, "payments"), 
      where("studentId", "==", studentId), 
      where("academicYear", "==", activeYear),
      orderBy("date", "desc")
    )
  }, [db, studentId, activeYear])

  const { data: payments, loading } = useCollection(paymentsQuery)

  const totalPaid = useMemo(() => {
    return payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
  }, [payments])

  const remaining = expectedFee - totalPaid
  const percent = Math.min(100, (totalPaid / expectedFee) * 100)

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Mes <span className="text-primary italic">Paiements</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Suivi financier personnel pour l'année {activeYear}.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none px-6 py-2 rounded-full font-black text-lg">
             TOTAL SCOLARITÉ : {expectedFee.toLocaleString()} F
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-10 rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
             <div className="size-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><DollarSign className="size-8" /></div>
             <div>
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Versé</p>
               <p className="text-4xl font-black text-foreground">{totalPaid.toLocaleString()} <span className="text-sm opacity-40">F</span></p>
             </div>
          </Card>
          <Card className="p-10 rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between border-l-[10px] border-amber-500">
             <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6"><Wallet className="size-8" /></div>
             <div>
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reste à payer</p>
               <p className="text-4xl font-black text-amber-600">{remaining.toLocaleString()} <span className="text-sm opacity-40">F</span></p>
             </div>
          </Card>
          <Card className="p-10 rounded-[3rem] bg-foreground text-white flex flex-col justify-between overflow-hidden relative">
             <div className="relative z-10">
               <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Statut Règlement</p>
               <p className="text-2xl font-black">{remaining <= 0 ? "SCOLARITÉ SOLDÉE" : "PAIEMENT PARTIEL"}</p>
               <div className="w-full bg-white/10 h-3 rounded-full mt-6 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${percent}%` }}
                  />
               </div>
               <p className="text-[10px] font-bold text-white/40 mt-2">{percent.toFixed(1)}% du parcours financier complété</p>
             </div>
             <ShieldCheck className="absolute -bottom-10 -right-10 size-48 text-white/5" />
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
          <div className="p-8 border-b bg-muted/10 flex items-center justify-between">
            <h3 className="text-xl font-black flex items-center gap-3">
               <History className="text-primary" /> Historique des Versements
            </h3>
            <Button variant="outline" className="rounded-xl font-bold border-2"><FileDown className="size-4 mr-2" /> Reçus PDF</Button>
          </div>
          <div className="p-0">
             {loading ? (
               <div className="p-20 text-center animate-pulse font-black text-muted-foreground">Synchronisation de vos paiements...</div>
             ) : !payments || payments.length === 0 ? (
               <div className="p-24 text-center space-y-4">
                 <Lock className="size-16 text-muted-foreground mx-auto opacity-20" />
                 <p className="text-muted-foreground font-medium">Aucun versement enregistré pour l'instant.</p>
               </div>
             ) : (
               <div className="divide-y divide-muted/30">
                 {payments.map((p: any, i: number) => (
                   <div key={i} className="p-8 flex items-center justify-between group hover:bg-muted/5 transition-all">
                     <div className="flex items-center gap-6">
                        <div className="size-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                           <CheckCircle2 className="size-7" />
                        </div>
                        <div>
                           <p className="font-black text-xl">{Number(p.amountPaid).toLocaleString()} F</p>
                           <div className="flex items-center gap-3">
                             <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary">{p.description}</Badge>
                             <span className="text-[10px] font-bold text-muted-foreground">{new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                           </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <Button variant="ghost" className="rounded-xl font-black text-primary hover:bg-primary/5">
                           Détails Reçu <ArrowRight className="ml-2 size-4" />
                        </Button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </Card>

        <div className="p-8 bg-muted/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-dashed border-muted-foreground/10">
           <div className="flex items-center gap-4">
              <div className="size-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Info className="text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground max-w-xl">
                L'intégrité de vos paiements est garantie par ACADEX. En cas de doute, veuillez vous présenter à la comptabilité avec vos reçus physiques originaux.
              </p>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
