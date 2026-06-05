"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DashboardRedirector() {
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('acadex_user_role')
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
      <div className="text-center space-y-4">
        <Loader2 className="size-10 animate-spin text-primary mx-auto" />
        <p className="font-black text-foreground uppercase tracking-widest text-xs animate-pulse">Chargement de votre cockpit...</p>
      </div>
    </div>
  )
}
