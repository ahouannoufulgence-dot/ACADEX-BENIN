
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AbsencesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirection vers le nouveau module Vie Scolaire qui centralise tout
    router.replace("/vie-scolaire")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-primary size-10 mx-auto" />
        <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Redirection vers Vie Scolaire...</p>
      </div>
    </div>
  )
}
