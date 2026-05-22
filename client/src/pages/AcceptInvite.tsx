// PIE Digital NR-10 — Accept Visitor Invite Page
// Página pública para visitantes aceitarem convites

import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { getVisitorInvite, acceptVisitorInvite, registerWithEmail } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvite() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const [, setLocation] = useLocation();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      try {
        if (!inviteId) {
          setError("Convite inválido.");
          setLoading(false);
          return;
        }

        const data = await getVisitorInvite(inviteId);
        if (!data) {
          setError("Convite não encontrado ou expirado.");
          setLoading(false);
          return;
        }

        if (data.status !== "pending") {
          setError("Este convite já foi utilizado ou foi revogado.");
          setLoading(false);
          return;
        }

        if (data.expiresAt && data.expiresAt < Date.now()) {
          setError("Este convite expirou.");
          setLoading(false);
          return;
        }

        setInvite(data);
        setLoading(false);
      } catch (err) {
        setError("Erro ao carregar convite.");
        setLoading(false);
      }
    };

    loadInvite();
  }, [inviteId]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error("Senha é obrigatória.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setAccepting(true);

    try {
      // Criar conta
      const userCredential = await registerWithEmail(invite.email, password);
      const uid = userCredential.user.uid;

      // Aceitar convite
      await acceptVisitorInvite(inviteId!, uid);

      setAccepted(true);
      toast.success("Convite aceito com sucesso! Redirecionando...");

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (err: any) {
      const msg = err.code === "auth/email-already-in-use"
        ? "Este e-mail já está cadastrado."
        : err.message || "Erro ao aceitar convite.";
      toast.error(msg);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertCircle className="w-5 h-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => setLocation("/")}
              className="w-full mt-4"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-600">
              <CheckCircle className="w-5 h-5" />
              Convite aceito!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sua conta foi criada com sucesso. Você será redirecionado para fazer login em breve.
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="w-full"
            >
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Aceitar convite</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Você foi convidado para acessar o PIE Digital como visitante.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-1.5 bg-muted p-3 rounded-md">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">E-mail</p>
              <p className="text-sm font-medium">{invite?.email}</p>
            </div>

            {invite?.nomeCompleto && (
              <div className="space-y-1.5 bg-muted p-3 rounded-md">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nome</p>
                <p className="text-sm font-medium">{invite.nomeCompleto}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Criar senha *</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Confirmar senha *</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={accepting}
              style={{ background: "oklch(0.72 0.19 47)", color: "oklch(0.1 0.02 258)" }}
              className="font-bold w-full"
            >
              {accepting ? "Processando..." : "Aceitar convite"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Ao aceitar, você concorda em acessar o sistema como visitante com permissões de somente leitura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
