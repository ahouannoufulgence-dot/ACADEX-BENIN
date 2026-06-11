
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
      <div className="space-y-6 md:space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground uppercase">Mes <span className="text-primary italic">Paiements</span></h1>
            <p className="text-muted-foreground font-medium text-[10px] md:text-base">Suivi financier personnel pour l'année {activeYear}.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg w-fit">
             TOTAL : {expectedFee.toLocaleString()} F
          </Badge>
        </div>

        <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-3">
          <Card className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all h-full">
             <div className="size-11 md:size-16 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><DollarSign className="size-5 md:size-8" /></div>
             <div>
               <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Versé</p>
               <p className="text-2xl md:text-4xl font-black text-foreground tabular-nums">{totalPaid.toLocaleString()} <span className="text-[10px] md:text-sm opacity-40 ml-1">F</span></p>
             </div>
          </Card>
          <Card className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between border-l-[6px] md:border-l-[10px] border-amber-500 h-full">
             <div className="size-11 md:size-16 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><Wallet className="size-5 md:size-8" /></div>
             <div>
               <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reste à payer</p>
               <p className="text-2xl md:text-4xl font-black text-amber-600 tabular-nums">{remaining.toLocaleString()} <span className="text-[10px] md:text-sm opacity-40 ml-1">F</span></p>
             </div>
          </Card>
          <Card className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] bg-foreground text-white flex flex-col justify-between overflow-hidden relative h-full">
             <div className="relative z-10">
               <p className="text-[8px] md:text-[10px] font-black uppercase text-white/40 tracking-widest">Statut Règlement</p>
               <p className="text-lg md:text-2xl font-black uppercase tracking-tight">{remaining <= 0 ? "SCOLARITÉ SOLDÉE" : "PARTIEL"}</p>
               <div className="w-full bg-white/10 h-2 md:h-3 rounded-full mt-4 md:mt-6 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${percent}%` }}
                  />
               </div>
               <p className="text-[7px] md:text-[10px] font-bold text-white/40 mt-1.5">{percent.toFixed(1)}% du parcours</p>
             </div>
             <ShieldCheck className="absolute -bottom-10 -right-10 size-32 md:size-48 text-white/5" />
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[1.8rem] md:rounded-[3rem] overflow-hidden">
          <div className="p-5 md:p-8 border-b bg-muted/5 flex items-center justify-between">
            <h3 className="text-base md:text-xl font-black flex items-center gap-2 md:gap-3">
               <History className="text-primary size-4 md:size-5" /> Historique
            </h3>
            <Button variant="outline" className="rounded-lg h-8 md:h-11 font-bold border-2 text-[10px] md:text-sm px-3 md:px-4"><FileDown className="size-3 md:size-4 mr-1.5 md:mr-2" /> Reçus</Button>
          </div>
          <div className="p-0">
             {loading ? (
               <div className="p-12 md:p-20 text-center animate-pulse font-black text-muted-foreground text-[10px] md:text-base">Synchronisation...</div>
             ) : !payments || payments.length === 0 ? (
               <div className="p-16 md:p-24 text-center space-y-3 opacity-30">
                 <Lock className="size-10 md:size-16 text-muted-foreground mx-auto" />
                 <p className="text-[10px] md:text-base font-medium">Aucun versement scellé.</p>
               </div>
             ) : (
               <div className="divide-y divide-muted/20">
                 {payments.map((p: any, i: number) => (
                   <div key={i} className="p-4 md:p-8 flex items-center justify-between group hover:bg-muted/5 transition-all">
                     <div className="flex items-center gap-3 md:gap-6 min-w-0">
                        <div className="size-10 md:size-14 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm shrink-0">
                           <CheckCircle2 className="size-5 md:size-7" />
                        </div>
                        <div className="min-w-0">
                           <p className="font-black text-sm md:text-xl tabular-nums truncate">{Number(p.amountPaid).toLocaleString()} F</p>
                           <div className="flex items-center gap-2 truncate">
                             <Badge variant="outline" className="text-[7px] md:text-[9px] font-black border-primary/20 text-primary truncate max-w-[80px] md:max-w-none">{p.description}</Badge>
                             <span className="text-[7px] md:text-[10px] font-bold text-muted-foreground uppercase">{new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                           </div>
                        </div>
                     </div>
                     <Button variant="ghost" className="rounded-lg font-black text-primary hover:bg-primary/5 text-[9px] md:text-xs h-8 md:h-10 shrink-0">
                        Reçu <ArrowRight className="ml-1 md:ml-2 size-2.5 md:size-4" />
                     </Button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
