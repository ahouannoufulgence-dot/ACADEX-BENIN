'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Lock, Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) return;
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('acadex_user_id', id);

      if (id.startsWith('DIR')) {
        localStorage.setItem('acadex_user_role', 'Directeur');
        localStorage.setItem('acadex_user_name', 'Koffi Mensah');
      } else if (id.startsWith('ENS')) {
        localStorage.setItem('acadex_user_role', 'Enseignant');
        localStorage.setItem('acadex_user_name', 'Marc Dossou');
        localStorage.setItem('acadex_user_classes', JSON.stringify(['3D1', 'Terminale D1']));
      } else {
        localStorage.setItem('acadex_user_role', 'Élève');
        localStorage.setItem('acadex_user_name', 'David Sossa');
      }
      
      router.push('/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 md:p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
      
      <div className="w-full max-w-[420px] animate-in">
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <div className="size-14 md:size-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl mb-4 transform rotate-3 active:rotate-0 transition-transform">
            <span className="text-white font-black text-3xl md:text-4xl">A</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            ACADEX <Sparkles className="size-4 text-primary fill-primary/10" />
          </h1>
          <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Gestion Scolaire Bénin</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-2">
          <CardHeader className="space-y-1 pt-8 px-8 text-center">
            <CardTitle className="text-2xl md:text-3xl font-black">Accès Cockpit</CardTitle>
            <CardDescription className="text-xs font-medium">Connectez-vous à votre espace sécurisé.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 md:px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="id" className="font-bold text-xs">Identifiant Officiel</Label>
                <Input 
                  id="id" 
                  placeholder="DIR-..., ENS-..., ELV-..." 
                  className="h-14 md:h-16 rounded-2xl bg-muted/30 border-none font-black tracking-widest text-lg md:text-xl text-center focus-visible:ring-primary shadow-inner"
                  value={id}
                  onChange={e => setId(e.target.value.toUpperCase())}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass" className="font-bold text-xs">Mot de passe</Label>
                <Input 
                  id="pass" 
                  type="password"
                  placeholder="••••••••"
                  className="h-14 md:h-16 rounded-2xl bg-muted/30 border-none font-bold text-center tracking-widest shadow-inner"
                  required 
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 md:h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-lg md:text-xl shadow-xl shadow-primary/20 gap-3 active:scale-95 transition-all"
                disabled={loading}
              >
                {loading ? <Loader2 className="size-6 animate-spin" /> : <ShieldCheck className="size-5 md:size-6" />}
                {loading ? "Vérification..." : "Entrer"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 md:p-8 flex flex-col gap-4 text-center rounded-b-[2rem]">
            <Link href="/register" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">
              Nouveau ? Créer un espace
            </Link>
          </CardFooter>
        </Card>

        <p className="text-center mt-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          &copy; 2025 ACADEX • Excellence & Rigueur
        </p>
      </div>
    </div>
  );
}
