
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      
      // Store the official ID
      localStorage.setItem('acadex_user_id', id);

      // Smart identification based on prefix
      if (id.startsWith('DIR')) {
        localStorage.setItem('acadex_user_role', 'Directeur');
        localStorage.setItem('acadex_user_name', 'Koffi Mensah');
      } else if (id.startsWith('ENS')) {
        localStorage.setItem('acadex_user_role', 'Enseignant');
        localStorage.setItem('acadex_user_name', 'Marc Dossou');
        localStorage.setItem('acadex_user_classes', JSON.stringify(['3D1', 'Terminale D1']));
      } else if (id.startsWith('ELV')) {
        localStorage.setItem('acadex_user_role', 'Élève');
        localStorage.setItem('acadex_user_name', 'David Sossa');
      } else {
        localStorage.setItem('acadex_user_role', 'Directeur'); // Fallback for testing
        localStorage.setItem('acadex_user_name', 'Utilisateur');
      }
      
      router.push('/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10">
          <Link href="/">
            <div className="size-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl mb-4 transform rotate-3">
              <span className="text-white font-black text-4xl">A</span>
            </div>
          </Link>
          <h1 className="text-3xl font-black text-foreground tracking-tight">ACADEX</h1>
          <p className="text-muted-foreground font-semibold mt-2">Gestion Scolaire Sécurisée</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="h-2 bg-primary"></div>
          <CardHeader className="space-y-1 pt-10 px-10 text-center">
            <CardTitle className="text-3xl font-black">Connexion</CardTitle>
            <CardDescription className="font-medium">Identifiez-vous pour accéder au cockpit.</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="id" className="font-bold">Identifiant Officiel</Label>
                <Input 
                  id="id" 
                  placeholder="DIR-..., ENS-..., ELV-..." 
                  className="h-14 rounded-xl bg-muted/30 border-none font-black tracking-widest text-lg text-center"
                  value={id}
                  onChange={e => setId(e.target.value.toUpperCase())}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass" className="font-bold">Mot de passe</Label>
                <Input 
                  id="pass" 
                  type="password"
                  className="h-14 rounded-xl bg-muted/30 border-none font-bold text-center tracking-widest"
                  required 
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 gap-3"
                disabled={loading}
              >
                {loading ? <Loader2 className="size-6 animate-spin" /> : <ShieldCheck className="size-6" />}
                {loading ? "Vérification..." : "Accès Sécurisé"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 p-8 flex flex-col gap-4 text-center">
            <Link href="/register" className="text-sm font-black text-primary hover:underline">
              Pas de compte ? Créer un espace
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
