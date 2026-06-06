
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { CreditCard, DollarSign, History, CheckCircle2, AlertCircle, FileDown, ShieldCheck, Wallet } from "lucide-react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function StudentPaymentsPage() {
  const db = useFirestore()
  const [studentId, setStudentId] = useState("")

  useEffect(() => {
    setStudentId(localStorage.getItem('acadex_user_id') || "")
  }, [])

  const paymentsQuery = useMemo(() => {
    if (!db || !studentId) return null
    return query(collection(db, "payments"), where("studentId", "==", studentId), orderBy("date", "desc"))
  }, [db, studentId])

  const { data: payments, loading } = useCollection(paymentsQuery)

  const totalPaid = useMemo(() => {
    return payments?.reduce((acc, p: any) => acc + (Number(p.amountPaid) || 0), 0) || 0
  }, [payments])

  const TOTAL_TUITION = 150000 // Exemple fixe pour l'établissement
  const remaining = TOTAL_TUITION - totalPaid

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Mes <span className="text-primary italic">Paiements</span></h1>
            <p className="text-muted-foreground mt-2 font-medium">Suivi financier de ta scolarité en toute transparence.</p>
          </div>
          <Button variant="outline" className="border-2 rounded-2xl h-12 px-6 font-black bg-white">
            <FileDown className="mr-2 size-5" /> Imprimer Reçus
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-10 rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
             <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6"><DollarSign className="size-8" /></div>
             <div>
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Versé</p>
               <p className="text-4xl font-black text-foreground">{totalPaid.toLocaleString()} FCFA</p>
             </div>
          </Card>
          <Card className="p-10 rounded-[3rem] bg-white border-none shadow-sm flex flex-col justify-between border-l-[10px] border-amber-500">
             <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6"><Wallet className="size-8" /></div>
             <div>
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reste à payer</p>
               <p className="text-4xl font-black text-amber-600">{remaining.toLocaleString()} FCFA</p>
             </div>
          </Card>
          <Card className="p-10 rounded-[3rem] bg-foreground text-white flex flex-col justify-between">
             <div className="size-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6"><ShieldCheck className="size-8 text-primary" /></div>
             <div>
               <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Statut Scolarité</p>
               <p className="text-2xl font-black">{remaining <= 0 ? "EN RÈGLE" : "À RÉGULARISER"}</p>
               <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(totalPaid / TOTAL_TUITION) * 100}%` }}
                  />
               </div>
             </div>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden">
          <div className="p-8 border-b bg-muted/10">
            <h3 className="text-xl font-black flex items-center gap-3">
               <History className="text-primary" /> Historique des Transactions
            </h3>
          </div>
          <div className="p-0">
             {loading ? (
               <div className="p-20 text-center animate-pulse">Chargement des transactions...</div>
             ) : !payments || payments.length === 0 ? (
               <div className="p-20 text-center space-y-4">
                 <AlertCircle className="size-12 text-muted-foreground mx-auto opacity-20" />
                 <p className="text-muted-foreground font-medium">Aucun versement n'a encore été enregistré pour ton matricule.</p>
               </div>
             ) : (
               <div className="divide-y divide-muted/30">
                 {payments.map((p: any, i: number) => (
                   <div key={i} className="p-8 flex items-center justify-between group hover:bg-muted/5 transition-all">
                     <div className="flex items-center gap-6">
                        <div className="size-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                           <CheckCircle2 className="size-6" />
                        </div>
                        <div>
                           <p className="font-black text-lg">{Number(p.amountPaid).toLocaleString()} FCFA</p>
                           <p className="text-xs font-bold text-muted-foreground uppercase">{p.description || 'Frais de scolarité'}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-black text-foreground">{new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <Badge variant="ghost" className="text-[10px] font-black uppercase text-emerald-600">Transaction Validée</Badge>
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
                Ces informations sont fournies à titre indicatif. Seuls les reçus portant le cachet humide de l'établissement font foi en cas de litige.
              </p>
           </div>
           <Button className="rounded-xl font-black bg-foreground text-white px-8 h-12">Signaler une erreur</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
