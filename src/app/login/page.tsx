
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter();
  const db = useFirestore()
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState("");
  const [schoolName, setSchoolName] = useState("ACADEX")
  const [schoolLogo, setSchoolLogo] = useState("")

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
      // 1. Check Directeur (Simulé ou config)
      if (upperId.startsWith('DIR')) {
        localStorage.setItem('acadex_user_id', upperId);
        localStorage.setItem('acadex_user_role', 'Directeur');
        localStorage.setItem('acadex_user_name', 'le Directeur');
        router.push('/dashboard/directeur');
        return;
      }

      // 2. Check Teachers Collection
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

      // 3. Check Students Collection
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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
      <div className="w-full max-w-[420px] animate-in">
        <div className="flex flex-col items-center mb-10">
          <div className="size-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl mb-4 overflow-hidden border-4 border-white">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-white font-black text-4xl">{schoolName[0]}</span>
            )}
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2 uppercase">
            {schoolName} <Sparkles className="size-4 text-primary fill-primary/10" />
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Portail de confiance</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-2">
          <CardHeader className="pt-8 px-8 text-center">
            <CardTitle className="text-2xl font-black">Accès Cockpit</CardTitle>
            <CardDescription className="text-xs font-medium italic">"Apprendre aujourd'hui, réussir demain"</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="id" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Identifiant Unique</Label>
                <Input id="id" placeholder="Ex: ENS-MAT-123" className="h-16 rounded-2xl bg-muted/30 border-none font-black tracking-widest text-xl text-center focus-visible:ring-primary shadow-inner" value={id} onChange={e => setId(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
                <Input id="pass" type="password" placeholder="••••••••" className="h-16 rounded-2xl bg-muted/30 border-none font-bold text-center tracking-widest shadow-inner" required />
              </div>
              <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 gap-3 active:scale-95 transition-all" disabled={loading}>
                {loading ? <Loader2 className="size-6 animate-spin" /> : <ShieldCheck className="size-6" />}
                {loading ? "Vérification..." : "Entrer"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 flex flex-col gap-4 text-center rounded-b-[2rem]">
            <Link href="/register" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Nouveau sur {schoolName} ?</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
