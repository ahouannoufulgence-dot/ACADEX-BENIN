
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck } from "lucide-react"

export default function DashboardRedirector() {
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role')
    
    // Suppression du délai artificiel pour une fluidité maximale
    if (role === 'Directeur') {
      router.replace('/dashboard/directeur')
    } else if (role === 'Enseignant') {
      router.replace('/dashboard/enseignant')
    } else if (role === 'Élève') {
      router.replace('/dashboard/eleve')
    } else {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center space-y-6 animate-in">
        <div className="size-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl animate-pulse">
          <ShieldCheck className="size-10 text-white" />
        </div>
        <div className="space-y-2">
          <p className="font-black text-foreground uppercase tracking-[0.3em] text-xs">Authentification Sécurisée</p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Initialisation de votre cockpit...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
