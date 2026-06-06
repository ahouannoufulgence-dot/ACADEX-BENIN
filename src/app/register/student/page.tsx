
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShieldCheck, GraduationCap, Lock, CheckCircle2, Search, ArrowLeft, ArrowRight, Loader2, UserCircle2, ShieldAlert, KeyRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export default function RegisterStudentPage() {
  const router = useRouter();
  const db = useFirestore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [matricule, setMatricule] = useState("");
  const [validationCode, setValidationCode] = useState("");
  const [studentDoc, setStudentDoc] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const verifyAccount = async () => {
    if (!matricule.trim() || !validationCode.trim()) {
      toast({ title: "Champs requis", description: "Veuillez saisir votre matricule et votre code secret.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "students"), 
        where("matricule", "==", matricule.toUpperCase().trim()),
        where("validationCode", "==", validationCode.toUpperCase().trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast({ 
          title: "Introuvable", 
          description: "Le matricule ou le code de validation est incorrect. Vérifiez vos documents officiels.", 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      const docData = querySnapshot.docs[0].data();
      const docId = querySnapshot.docs[0].id;

      if (docData.status === "Actif") {
        toast({ title: "Déjà activé", description: "Ce compte est déjà actif. Veuillez vous connecter." });
        router.push("/login");
        return;
      }

      setStudentDoc({ ...docData, id: docId });
      setFullName(docData.fullName || "");
      setStep(2);
    } catch (error) {
      toast({ title: "Erreur de connexion", description: "Impossible de vérifier vos identifiants.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!fullName.trim() || !password.trim()) {
      toast({ title: "Infos manquantes", description: "Veuillez remplir votre nom et choisir un mot de passe.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const ref = doc(db, "students", studentDoc.id);
      await updateDoc(ref, {
        fullName: fullName.trim(),
        status: "Actif",
        activatedAt: new Date().toISOString(),
        // Dans un vrai système, on utiliserait Firebase Auth, ici on simule la mise à jour du profil
      });

      // Sauvegarde locale pour la session
      localStorage.setItem('acadex_user_id', studentDoc.matricule);
      localStorage.setItem('acadex_user_role', 'Élève');
      localStorage.setItem('acadex_user_name', fullName);

      setStep(3);
    } catch (error) {
      toast({ title: "Échec de l'activation", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-xl space-y-8 animate-in fade-in duration-700">
        
        {step < 3 && (
          <div className="flex justify-center items-center gap-4 mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${step === i ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : step > i ? 'bg-amber-600/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                  {i}
                </div>
                {i < 2 && <div className={`w-12 h-1 rounded-full ${step > i ? 'bg-amber-600' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        )}

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="h-2 bg-amber-600 w-full" />
          
          {step === 1 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Activation de Compte</CardTitle>
                <CardDescription className="text-lg font-medium">Saisissez les codes remis par l'administration.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-[10px] text-muted-foreground tracking-widest px-2">Votre Matricule</Label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                      <Input 
                        placeholder="EX: ELV-6èmeA-123" 
                        className="h-16 pl-12 rounded-2xl text-xl font-black tracking-widest border-2 focus-visible:ring-amber-600" 
                        value={matricule} 
                        onChange={e => setMatricule(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-[10px] text-muted-foreground tracking-widest px-2">Code Secret d'Activation</Label>
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                      <Input 
                        placeholder="CODE SECRET" 
                        className="h-16 pl-12 rounded-2xl text-xl font-black tracking-[0.5em] border-2 focus-visible:ring-amber-600 text-center" 
                        value={validationCode} 
                        onChange={e => setValidationCode(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <ShieldAlert className="size-5 text-amber-600 shrink-0" />
                  <p className="text-xs font-bold text-amber-800 leading-relaxed">
                    Votre identifiant et votre code secret sont disponibles sur le document PDF généré par votre Directeur.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" asChild className="font-bold rounded-xl h-12">
                  <Link href="/">Retour</Link>
                </Button>
                <Button onClick={verifyAccount} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black px-10 h-12 shadow-xl shadow-amber-600/20">
                  {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                  Vérifier
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && studentDoc && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UserCircle2 className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Finaliser mon Profil</CardTitle>
                <CardDescription className="text-lg font-medium">Bienvenue dans votre classe de <span className="text-amber-600 font-black">{studentDoc.classId}</span>.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Votre Nom Complet</Label>
                    <Input 
                      placeholder="Ex: Koffi Djimon" 
                      className="h-14 rounded-xl font-bold border-2" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      disabled={studentDoc.fullName !== ""}
                    />
                    {studentDoc.fullName && <p className="text-[10px] font-bold text-muted-foreground italic">Ce nom a été validé par la direction.</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Définir un Mot de Passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        type="password"
                        placeholder="••••••••" 
                        className="h-14 pl-12 rounded-xl border-2" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="font-bold rounded-xl h-12">Retour</Button>
                <Button onClick={handleActivate} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black px-10 h-12 shadow-xl shadow-amber-600/20">
                  {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <ShieldCheck className="size-5 mr-2" />}
                  Activer mon Cockpit
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <div className="p-12 text-center space-y-8 animate-in zoom-in-95">
              <div className="size-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="size-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black">Activation Réussie !</h2>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                  Votre espace Élève est maintenant actif. Vous pouvez consulter vos notes et votre agenda.
                </p>
              </div>
              <div className="bg-muted/50 p-8 rounded-[2rem] border-2 border-dashed border-emerald-500/20 space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Identifiant de Connexion</p>
                <p className="text-4xl font-black text-foreground tracking-tighter">{matricule}</p>
                <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-600">
                  <ShieldCheck className="size-3" /> COMPTE VÉRIFIÉ & SÉCURISÉ
                </div>
              </div>
              <div className="pt-8">
                <Button asChild className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20">
                  <Link href="/dashboard">
                    Accéder à mon espace <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
