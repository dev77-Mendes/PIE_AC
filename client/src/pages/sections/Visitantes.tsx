// PIE Digital NR-10 — Visitantes section
// Gerenciar convites e acesso para fiscais e interessados

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRbac } from "@/contexts/RbacContext";
import { createVisitorInvite, listVisitorInvites, revokeVisitorInvite } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ConfirmDelete from "@/components/ConfirmDelete";
import { toast } from "sonner";
import { Plus, Mail, Clock, CheckCircle, XCircle, Copy } from "lucide-react";

interface InviteForm {
  email: string;
  nomeCompleto: string;
  diasValidade: string;
}

const EMPTY: InviteForm = {
  email: "",
  nomeCompleto: "",
  diasValidade: "30",
};

export default function Visitantes() {
  const { user } = useAuth();
  const { hasPermission } = useRbac();
  const [form, setForm] = useState<InviteForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = hasPermission("usuario:manage");

  useEffect(() => {
    if (!user || !canManage) {
      setLoading(false);
      return;
    }

    const unsub = listVisitorInvites(user.uid, (data) => {
      setInvites(data);
      setLoading(false);
    });

    return unsub;
  }, [user, canManage]);

  const set = (k: keyof InviteForm, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error("E-mail é obrigatório.");
      return;
    }
    if (!form.email.includes("@")) {
      toast.error("E-mail inválido.");
      return;
    }

    setSaving(true);
    try {
      const expiresAt = Date.now() + Number(form.diasValidade) * 24 * 60 * 60 * 1000;
      const inviteId = await createVisitorInvite(
        user!.uid,
        form.email,
        form.nomeCompleto || undefined,
        expiresAt
      );

      const inviteUrl = `${window.location.origin}/convite/${inviteId}`;
      
      // Copiar para clipboard
      navigator.clipboard.writeText(inviteUrl);
      
      setForm(EMPTY);
      toast.success("Convite criado! Link copiado para a área de transferência.");
    } catch (err) {
      toast.error("Erro ao criar convite.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await revokeVisitorInvite(inviteId);
      toast.success("Convite revogado com sucesso!");
    } catch (err) {
      toast.error("Erro ao revogar convite.");
    }
  };

  const getStatusBadge = (status: string, expiresAt?: number) => {
    if (status === "revoked") {
      return <Badge variant="destructive">Revogado</Badge>;
    }
    if (status === "accepted") {
      return <Badge variant="default">Aceito</Badge>;
    }
    if (expiresAt && expiresAt < Date.now()) {
      return <Badge variant="secondary">Expirado</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return date.toLocaleDateString("pt-BR");
  };

  const formatExpiry = (expiresAt?: number) => {
    if (!expiresAt) return "—";
    const date = new Date(expiresAt);
    return date.toLocaleDateString("pt-BR");
  };

  if (!canManage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para gerenciar visitantes. Apenas administradores podem criar convites.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4" style={{ color: "oklch(0.72 0.19 47)" }} />
            Criar convite para visitante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">E-mail do visitante *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="fiscal@empresa.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nome completo</Label>
                <Input
                  value={form.nomeCompleto}
                  onChange={(e) => set("nomeCompleto", e.target.value)}
                  placeholder="João da Silva"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Validade (dias)</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={form.diasValidade}
                  onChange={(e) => set("diasValidade", e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              style={{ background: "oklch(0.72 0.19 47)", color: "oklch(0.1 0.02 258)" }}
              className="font-bold w-full"
            >
              {saving ? "Criando convite..." : "Criar convite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convites enviados ({invites.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Carregando convites...</p>
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum convite criado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Válido até</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite: any) => (
                    <TableRow key={invite.id} className="data-row">
                      <TableCell className="font-medium text-sm">{invite.email}</TableCell>
                      <TableCell className="text-sm">{invite.nomeCompleto || "—"}</TableCell>
                      <TableCell>
                        {getStatusBadge(invite.status, invite.expiresAt)}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(invite.createdAt)}</TableCell>
                      <TableCell className="text-sm">{formatExpiry(invite.expiresAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {invite.status === "pending" && (
                            <ConfirmDelete
                              onConfirm={() => handleRevoke(invite.id)}
                              label="Revogar"
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
