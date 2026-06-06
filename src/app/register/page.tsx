
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterEntryPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection vers la racine car la sélection de rôle est maintenant à l'accueil
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="animate-pulse font-black text-muted-foreground tracking-widest text-xs uppercase">
        Chargement de l'espace...
      </div>
    </div>
  );
}
