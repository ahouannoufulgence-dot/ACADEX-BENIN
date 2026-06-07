
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShieldCheck, Lock, CheckCircle2, Search, ArrowLeft, ArrowRight, Loader2, HelpCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [id, setId] = useState("");
  const [question, setQuestion] = useState("");

  const verifyId = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setQuestion("Nom de jeune fille de votre mère ?");
      setStep(2);
    }, 1500);
  };

  const verifyAnswer = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleReset = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Mot de passe réinitialisé", description: "Vous pouvez maintenant vous connecter." });
      router.push("/login");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md animate-in fade-in duration-700">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          
          {step === 1 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="size-8" />
                </div>
                <CardTitle className="text-3xl font-black">Récupération</CardTitle>
                <CardDescription className="text-lg font-medium">Saisissez votre identifiant officiel.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold">Identifiant (DIR/ENS/ELV-...)</Label>
                  <Input 
                    placeholder="Ex: DIR-001" 
                    className="h-12 rounded-xl text-center font-black tracking-widest text-lg uppercase" 
                    value={id} 
                    onChange={e => setId(e.target.value.toUpperCase())}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" asChild className="font-bold rounded-xl h-12">
                  <Link href="/login">Annuler</Link>
                </Button>
                <Button onClick={verifyId} disabled={loading} className="bg-primary rounded-xl font-black px-10 h-12">
                  {loading ? <Loader2 className="size-5 animate-spin" /> : "Vérifier"}
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <HelpCircle className="size-8" />
                </div>
                <CardTitle className="text-2xl font-black">Question Secrète</CardTitle>
                <CardDescription className="text-base font-medium">Répondez à la question définie lors de l'inscription.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="space-y-4">
                  <p className="text-center font-black text-foreground italic">"{question}"</p>
                  <div className="space-y-2">
                    <Label className="font-bold">Votre réponse</Label>
                    <Input placeholder="Votre réponse secrète" className="h-12 rounded-xl" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="font-bold rounded-xl h-12">Retour</Button>
                <Button onClick={verifyAnswer} disabled={loading} className="bg-primary rounded-xl font-black px-10 h-12">
                  {loading ? <Loader2 className="size-5 animate-spin" /> : "Vérifier"}
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="p-10 text-center">
                <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="size-8" />
                </div>
                <CardTitle className="text-2xl font-black">Nouveau Mot de Passe</CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-12 rounded-xl pr-12" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Confirmer</Label>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-12 rounded-xl" 
                  />
                </div>
              </CardContent>
              <CardFooter className="p-10 bg-muted/30">
                <Button onClick={handleReset} disabled={loading} className="w-full bg-primary rounded-xl font-black h-14 text-lg shadow-xl shadow-primary/20">
                  {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <CheckCircle2 className="size-5 mr-2" />}
                  Réinitialiser
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
