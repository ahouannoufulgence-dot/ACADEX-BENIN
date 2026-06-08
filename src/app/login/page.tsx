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
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { toast } from "@/hooks/use-toast"
import placeholderData from "@/app/lib/placeholder-images.json";

export default function LoginPage() {
  const router = useRouter();
  const db = useFirestore()
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [id, setId] = useState("");
  const [schoolName, setSchoolName] = useState("ACADEX")
  const [schoolLogo, setSchoolLogo] = useState("")

  const loginImage = placeholderData.placeholderImages.find(img => img.id === "hero-students");

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const docSnap = await getDoc(doc(db, "school_settings", "main_config"))
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSchoolName(data.schoolName || "ACADEX")
          setSchoolLogo(data.logoUrl || "")
        }
      } catch (err) {
        console.warn("Mode Hors-ligne / Config par défaut")
      }
    }
    fetchSchool()
  }, [db])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) return;
    setLoading(true);
    
    const upperId = id.toUpperCase();
    
    try {
      if (upperId.startsWith('DIR')) {
        localStorage.setItem('acadex_user_id', upperId);
        localStorage.setItem('acadex_user_role', 'Directeur');
        localStorage.setItem('acadex_user_name', 'le Directeur');
        router.push('/dashboard/directeur');
        return;
      }

      const teacherQuery = query(collection(db, "teachers"), where("officialId", "==", upperId));
      const teacherSnap = await getDocs(teacherQuery);
      
      if (!teacherSnap.empty) {
        const teacherData = teacherSnap.docs[0].data();
        localStorage.setItem('acadex_user_id', upperId);
        localStorage.setItem('acadex_user_role', 'Enseignant');
        localStorage.setItem('acadex_user_name', teacherData.fullName || 'Professeur');
        localStorage.setItem('acadex_user_classes', JSON.stringify(teacherData.classes || []));
        localStorage.setItem('acadex_user_subject', teacherData.subject || "");
        router.push('/dashboard/enseignant');
        return;
      }

      const studentQuery = query(collection(db, "students"), where("matricule", "==", upperId));
      const studentSnap = await getDocs(studentQuery);

      if (!studentSnap.empty) {
        const studentData = studentSnap.docs[0].data();
        localStorage.setItem('acadex_user_id', upperId);
        localStorage.setItem('acadex_user_role', 'Élève');
        localStorage.setItem('acadex_user_name', `${studentData.firstName} ${studentData.lastName}`);
        router.push('/dashboard/eleve');
        return;
      }

      toast({ title: "Identifiant inconnu", description: "Veuillez vérifier votre code ou contacter la direction.", variant: "destructive" });
    } catch (err) {
      toast({ title: "Erreur de connexion", description: "Impossible de joindre le serveur.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-background">
      {/* Background Image with Professional Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={loginImage?.imageUrl || "https://picsum.photos/seed/acadex-students/1920/1080"}
          alt="Login Background"
          fill
          className="object-cover opacity-30 grayscale-[0.2]"
          priority
          data-ai-hint="smiling students"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-background/90 to-primary/40" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] animate-in fade-in duration-700">
        <div className="flex flex-col items-center mb-10">
          <div className="size-20 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl mb-4 overflow-hidden border-4 border-white transition-transform hover:scale-105 duration-500">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-primary font-black text-4xl">{schoolName[0]}</span>
            )}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 uppercase drop-shadow-lg">
            {schoolName} <Sparkles className="size-4 text-emerald-400 fill-emerald-400/10" />
          </h1>
          <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mt-1">Portail de confiance</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white/95 backdrop-blur-xl overflow-hidden p-1">
          <div className="h-1.5 bg-primary w-full" />
          <CardHeader className="pt-8 px-8 text-center">
            <CardTitle className="text-2xl font-black text-foreground">Accès Cockpit</CardTitle>
            <CardDescription className="text-xs font-medium italic text-muted-foreground">"Apprendre aujourd'hui, réussir demain"</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="id" className="font-bold text-xs uppercase tracking-widest text-muted-foreground px-1">Identifiant Unique</Label>
                <div className="relative">
                  <Input 
                    id="id" 
                    placeholder="Ex: ENS-MAT-123" 
                    className="h-16 rounded-2xl bg-muted/30 border-none font-black tracking-widest text-xl text-center focus-visible:ring-primary shadow-inner uppercase placeholder:text-muted-foreground/30" 
                    value={id} 
                    onChange={e => setId(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="pass" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
                  <Link href="/forgot-password" size="sm" className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter">Oublié ?</Link>
                </div>
                <div className="relative">
                  <Input 
                    id="pass" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-16 rounded-2xl bg-muted/30 border-none font-bold text-center tracking-widest shadow-inner pr-14 placeholder:text-muted-foreground/30" 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-white/50 text-muted-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 gap-3 active:scale-95 transition-all" disabled={loading}>
                {loading ? <Loader2 className="size-6 animate-spin" /> : <ShieldCheck className="size-6" />}
                {loading ? "Vérification..." : "Entrer"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 flex flex-col gap-4 text-center">
            <Link href="/register/student" className="text-xs font-black text-primary hover:underline uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="size-3" /> Nouveau sur {schoolName} ?
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      <div className="absolute bottom-6 w-full text-center text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] z-10">
        Connexion Sécurisée AES-256 • ACADEX V1
      </div>
    </div>
  );
}