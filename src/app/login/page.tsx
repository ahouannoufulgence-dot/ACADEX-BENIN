
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
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [id, setId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast({
        title: "Compte temporairement bloqué",
        description: "Trop de tentatives échouées. Réessayez dans 15 minutes.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulation d'authentification sécurisée
    setTimeout(() => {
      setLoading(false);
      // Fallback personalized greeting if none set
      if (!localStorage.getItem('acadex_user_name')) {
        localStorage.setItem('acadex_user_name', 'Koffi Mensah');
        localStorage.setItem('acadex_user_role', 'Super Administrateur');
      }
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur ACADEX.",
      });
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
      <div className="absolute -top-24 -right-24 size-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 size-96 bg-primary/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10">
          <Link href="/">
            <div className="size-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl mb-4 transform rotate-3">
              <span className="text-white font-black text-4xl">A</span>
            </div>
          </Link>
          <h1 className="text-3xl font-black text-foreground tracking-tight">ACADEX <span className="text-primary tracking-[0.2em] text-sm align-middle ml-2">SECURE</span></h1>
          <p className="text-muted-foreground font-semibold mt-2">Gestion Scolaire de Haute Sécurité</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="h-2 bg-primary"></div>
          <CardHeader className="space-y-1 pt-10 px-10">
            <CardTitle className="text-3xl font-black">Connexion</CardTitle>
            <CardDescription className="font-medium">Entrez vos identifiants officiels.</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="id" className="font-bold flex items-center gap-2">
                  <User className="size-4 text-primary" /> Identifiant Officiel
                </Label>
                <Input 
                  id="id" 
                  placeholder="Ex: DIR-001, ENS-..., ELV-..." 
                  className="h-14 rounded-xl bg-muted/30 border-none font-black tracking-widest text-lg focus-visible:ring-primary text-center"
                  value={id}
                  onChange={e => setId(e.target.value.toUpperCase())}
                  required 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pass" className="font-bold flex items-center gap-2">
                    <Lock className="size-4 text-primary" /> Mot de passe
                  </Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-xs font-bold text-primary hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-3 mr-1" /> : <Eye className="size-3 mr-1" />}
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </Button>
                </div>
                <div className="relative">
                  <Input 
                    id="pass" 
                    type={showPassword ? "text" : "password"} 
                    className="h-14 rounded-xl bg-muted/30 border-none font-bold focus-visible:ring-primary pr-10 text-center tracking-widest"
                    required 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="remember" className="rounded border-muted text-primary focus:ring-primary" />
                  <Label htmlFor="remember" className="text-xs font-bold text-muted-foreground cursor-pointer">Rester connecté</Label>
                </div>
                <Link href="/forgot-password" size="sm" className="text-xs font-bold text-primary hover:underline">
                  Identifiant ou Pass oublié ?
                </Link>
              </div>

              {attempts > 0 && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-xl text-xs font-bold animate-in slide-in-from-top-2">
                  <AlertCircle className="size-4" />
                  Tentative {attempts}/5. Le compte sera bloqué à 5 échecs.
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 gap-3"
                disabled={loading || isBlocked}
              >
                {loading ? <Loader2 className="size-6 animate-spin" /> : <ShieldCheck className="size-6" />}
                {loading ? "Vérification..." : "Accès Sécurisé"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 p-8 flex flex-col gap-4">
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-muted-foreground tracking-tight">Pas encore de compte ?</p>
              <Link href="/register" className="text-sm font-black text-primary hover:underline block">
                Créer un espace établissement
              </Link>
            </div>
            <p className="text-[10px] text-muted-foreground font-black uppercase text-center tracking-[0.2em] opacity-50">
              Système d'Audit ACADEX Actif
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
