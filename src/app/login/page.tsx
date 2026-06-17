"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import placeholderData from "@/app/lib/placeholder-images.json";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [id, setId] = useState("");
  const [schoolName, setSchoolName] = useState("ACADEX")
  const [schoolLogo, setSchoolLogo] = useState("")

  const loginImage = placeholderData.placeholderImages.find(img => img.id === "hero-students-class");

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .eq('id', 'main_config')
        .single()
      if (data) {
        setSchoolName(data.school_name || "ACADEX")
        setSchoolLogo(data.logo_url || "")
      }
    }
    fetchSettings()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) return;
    setLoading(true);
    
    const upperId = id.toUpperCase().trim();
    
    try {
      if (upperId.startsWith('DIR')) {
        localStorage.setItem('acadex_user_id', upperId);
        localStorage.setItem('acadex_user_role', 'Directeur');
        localStorage.setItem('acadex_user_name', 'le Directeur');
        router.push('/dashboard/directeur');
        return;
      }

      if (upperId.startsWith('ENS')) {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('*')
          .eq('official_id', upperId)
          .single();
        if (teacherData) {
          localStorage.setItem('acadex_user_id', upperId);
          localStorage.setItem('acadex_user_role', 'Enseignant');
          localStorage.setItem('acadex_user_name', teacherData.full_name || 'Professeur');
          localStorage.setItem('acadex_user_classes', JSON.stringify(teacherData.classes || []));
          localStorage.setItem('acadex_user_subject', teacherData.subject || "");
          router.push('/dashboard/enseignant');
          return;
        }
      } else if (upperId.startsWith('ELV')) {
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('matricule', upperId)
          .single();
        if (studentData) {
          localStorage.setItem('acadex_user_id', upperId);
          localStorage.setItem('acadex_user_role', 'Élève');
          localStorage.setItem('acadex_user_name', `${studentData.first_name} ${studentData.last_name}`);
          router.push('/dashboard/eleve');
          return;
        }
      } else {
        const [{ data: tData }, { data: sData }] = await Promise.all([
          supabase.from('teachers').select('*').eq('official_id', upperId).single(),
          supabase.from('students').select('*').eq('matricule', upperId).single()
        ]);

        if (tData) {
          localStorage.setItem('acadex_user_id', upperId);
          localStorage.setItem('acadex_user_role', 'Enseignant');
          localStorage.setItem('acadex_user_name', tData.full_name || 'Professeur');
          router.push('/dashboard/enseignant');
          return;
        }
        if (sData) {
          localStorage.setItem('acadex_user_id', upperId);
          localStorage.setItem('acadex_user_role', 'Élève');
          localStorage.setItem('acadex_user_name', `${sData.first_name} ${sData.last_name}`);
          router.push('/dashboard/eleve');
          return;
        }
      }

      toast({ title: "Identifiant inconnu", description: "Veuillez vérifier votre code.", variant: "destructive" });
    } catch (err) {
      toast({ title: "Connexion limitée", description: "Vérifiez votre connexion internet.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-background">
      <div className="fixed inset-0 z-0">
        <Image 
          src="/images/bg-login.jpg"
          alt="Login Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] animate-in fade-in duration-500">
        <div className="flex flex-col items-center mb-8 md:mb-10">
          <div className="size-16 md:size-20 bg-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl mb-4 overflow-hidden border-4 border-white transition-transform hover:scale-105 duration-500">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-primary font-black text-3xl md:text-4xl">{schoolName[0]}</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 uppercase drop-shadow-lg text-center px-4">
            {schoolName} <Sparkles className="size-4 text-emerald-400 fill-emerald-400/10" />
          </h1>
          <p className="text-[9px] md:text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mt-1">Portail de confiance</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2rem] md:rounded-[2.5rem] bg-white/95 backdrop-blur-xl overflow-hidden p-1">
          <div className="h-1 bg-primary w-full" />
          <CardHeader className="pt-6 md:pt-8 px-6 md:px-8 text-center">
            <CardTitle className="text-xl md:text-2xl font-black text-foreground">Accès Cockpit</CardTitle>
            <CardDescription className="text-[10px] md:text-xs font-medium italic text-muted-foreground">"Apprendre aujourd'hui, réussir demain"</CardDescription>
          </CardHeader>
          <CardContent className="px-6 md:px-8 pb-6 md:pb-8">
            <form onSubmit={handleLogin} className="space-y-5 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="id" className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground px-1">Identifiant Unique</Label>
                <div className="relative">
                  <Input 
                    id="id" 
                    placeholder="Ex: ENS-MAT-123" 
                    className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-none font-black tracking-widest text-lg md:text-xl text-center focus-visible:ring-primary shadow-inner uppercase placeholder:text-muted-foreground/30" 
                    value={id} 
                    onChange={e => setId(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="pass" className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
                  <Link href="/forgot-password" size="sm" className="text-[9px] md:text-[10px] font-black text-primary hover:underline uppercase tracking-tighter">Oublié ?</Link>
                </div>
                <div className="relative">
                  <Input 
                    id="pass" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-none font-bold text-center tracking-widest shadow-inner pr-14 placeholder:text-muted-foreground/30" 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-white/50 text-muted-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4 md:size-5" /> : <Eye className="size-4 md:size-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-14 md:h-16 bg-primary hover:bg-primary/90 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl shadow-primary/20 gap-3 active:scale-95 transition-all" disabled={loading}>
                {loading ? <Loader2 className="size-5 md:size-6 animate-spin" /> : <ShieldCheck className="size-5 md:size-6" />}
                {loading ? "Vérification..." : "Entrer"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 p-4 md:p-6 flex flex-col gap-4 text-center">
            <Link href="/register/student" className="text-[10px] md:text-xs font-black text-primary hover:underline uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="size-2.5 md:size-3" /> Nouveau sur {schoolName} ?
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      <div className="absolute bottom-6 w-full text-center text-[8px] md:text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] z-10 px-4">
        Connexion Sécurisée • ACADEX V1
      </div>
    </div>
  );
}
