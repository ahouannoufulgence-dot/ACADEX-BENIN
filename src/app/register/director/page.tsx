
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShieldCheck, UserCog, Lock, CheckCircle2, Copy, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function RegisterDirectorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    schoolName: "",
    city: "Cotonou",
    schoolType: "col-lyc",
    password: "",
    confirmPassword: "",
    secretQuestion: "mother",
    secretAnswer: ""
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleRegister = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Save user info for personalization
      localStorage.setItem('acadex_user_name', `${form.firstName} ${form.lastName}`);
      localStorage.setItem('acadex_user_role', 'Directeur');
      localStorage.setItem('acadex_user_id', 'DIR-001');
      nextStep();
      toast({
        title: "Compte créé avec succès",
        description: `Bienvenue Monsieur ${form.lastName} dans l'écosystème ACADEX.`
      });
    }, 2000);
  };

  const copyId = () => {
    navigator.clipboard.writeText("DIR-001");
    toast({ title: "Identifiant copié !" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-xl space-y-8 animate-in fade-in duration-700">
        
        {step < 3 && (
          <div className="flex justify-center items-center gap-4 mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${step === i ? 'bg-primary text-white shadow-lg shadow-primary/20' : step > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {i}
                </div>
                {i === 1 && <div className={`w-12 h-1 rounded-full ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        )}

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          
          {step === 1 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UserCog className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Identité & École</CardTitle>
                <CardDescription className="text-lg font-medium">Commençons par faire connaissance.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Nom</Label>
                    <Input placeholder="Koffi" className="h-12 rounded-xl" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Prénom</Label>
                    <Input placeholder="Mensah" className="h-12 rounded-xl" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Téléphone</Label>
                  <Input placeholder="+229 ..." className="h-12 rounded-xl" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Nom de l'établissement</Label>
                  <Input placeholder="Collège Acadex Elite" className="h-12 rounded-xl" value={form.schoolName} onChange={e => setForm({...form, schoolName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Ville</Label>
                    <Input placeholder="Cotonou" className="h-12 rounded-xl" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Type d'école</Label>
                    <Select value={form.schoolType} onValueChange={v => setForm({...form, schoolType: v})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="college">Collège</SelectItem>
                        <SelectItem value="lycee">Lycée</SelectItem>
                        <SelectItem value="col-lyc">Collège + Lycée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={() => router.push("/register")} className="font-bold rounded-xl h-12">Annuler</Button>
                <Button onClick={nextStep} className="bg-primary rounded-xl font-black px-10 h-12">Continuer <ArrowRight className="ml-2 size-4" /></Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Sécurité du Cockpit</CardTitle>
                <CardDescription className="text-lg font-medium">Protégez votre espace avec un mot de passe robuste.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold">Mot de passe</Label>
                  <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Confirmer mot de passe</Label>
                  <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
                </div>
                <div className="space-y-4 pt-4 border-t border-dashed">
                  <div className="space-y-2">
                    <Label className="font-bold">Question Secrète</Label>
                    <Select value={form.secretQuestion} onValueChange={v => setForm({...form, secretQuestion: v})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mother">Nom de jeune fille de votre mère ?</SelectItem>
                        <SelectItem value="teacher">Nom de votre premier enseignant ?</SelectItem>
                        <SelectItem value="birth">Ville de votre naissance ?</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Réponse Secrète</Label>
                    <Input placeholder="Votre réponse" className="h-12 rounded-xl" value={form.secretAnswer} onChange={e => setForm({...form, secretAnswer: e.target.value})} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={prevStep} className="font-bold rounded-xl h-12">Retour</Button>
                <Button onClick={handleRegister} disabled={loading} className="bg-primary rounded-xl font-black px-10 h-12 shadow-xl shadow-primary/20">
                  {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <ShieldCheck className="size-5 mr-2" />}
                  Finaliser l'inscription
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <div className="p-12 text-center space-y-8 animate-in zoom-in-95">
              <div className="size-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="size-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black">Félicitations !</h2>
                <p className="text-muted-foreground font-medium text-lg">Votre espace Directeur a été créé avec succès.</p>
              </div>
              <div className="bg-muted/50 p-8 rounded-[2rem] border-2 border-dashed border-primary/20 space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Votre Identifiant Officiel</p>
                <p className="text-5xl font-black text-primary tracking-tighter">DIR-001</p>
                <Button onClick={copyId} variant="outline" size="sm" className="rounded-full border-primary/20 text-primary font-bold h-10 px-6">
                  Copier l'identifiant
                </Button>
              </div>
              <div className="pt-8">
                <Button asChild className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black text-lg shadow-xl shadow-primary/20">
                  <Link href="/dashboard">
                    Accéder au tableau de bord <ArrowRight className="ml-2 size-5" />
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
