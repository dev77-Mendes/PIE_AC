// PIE Digital NR-10 — Documentos section (Novo)
// Gestão completa dos documentos do prontuário com upload de arquivo

import { useState } from "react";
import { usePie } from "@/contexts/PieContext";
import { useRbac } from "@/contexts/RbacContext";
import { useAuth } from "@/contexts/AuthContext";
import { uploadDocumento, deleteDocumentoFile } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ConfirmDelete from "@/components/ConfirmDelete";
import StatusBadge from "@/components/StatusBadge";
import PdfViewer from "@/components/PdfViewer";
import { toast } from "sonner";
import { Plus, ExternalLink, FolderOpen, Upload, FileText } from "lucide-react";

const CATEGORIAS_DOC = [
  "Projeto elétrico",
  "Diagrama unifilar",
  "Laudo técnico",
  "Relatório de inspeção",
  "ART/TRT",
  "Certificados NR-10",
  "Plano de manutenção",
  "Prontuário NR-10",
  "Fotos da instalação",
  "Outros documentos",
];

interface DocForm {
  clienteId: string;
  nomeArquivo: string;
  tipo: string;
  categoria: string;
  descricao: string;
  validade: string;
  status: string;
  responsavelTecnico: string;
  obs: string;
  arquivo?: File;
}

const EMPTY: DocForm = {
  clienteId: "",
  nomeArquivo: "",
  tipo: "Documento técnico",
  categoria: CATEGORIAS_DOC[0],
  descricao: "",
  validade: "",
  status: "Válido",
  responsavelTecnico: "",
  obs: "",
};

export default function DocumentosNovo() {
  const { user } = useAuth();
  const { clientes, documentos, add, update, remove } = usePie();
  const { hasPermission } = useRbac();
  const [form, setForm] = useState<DocForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCliente, setFilterCliente] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCategoria, setFilterCategoria] = useState("todos");
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState("");
  const [pdfViewerTitle, setPdfViewerTitle] = useState("");

  const canCreate = hasPermission("documento:create");
  const canUpdate = hasPermission("documento:update");
  const canDelete = hasPermission("documento:delete");

  const set = (k: keyof DocForm, v: string | File | undefined) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.razao ?? "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteId) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (!form.nomeArquivo.trim()) {
      toast.error("Nome do arquivo é obrigatório.");
      return;
    }

    setSaving(true);
    setUploading(true);

    try {
      let storageUrl = "";
      let storagePath = "";
      let mimeType = "";
      let tamanho = 0;

      // Se houver arquivo, fazer upload
      if (form.arquivo) {
        const { url, path } = await uploadDocumento(user!.uid, form.clienteId, form.arquivo);
        storageUrl = url;
        storagePath = path;
        mimeType = form.arquivo.type;
        tamanho = form.arquivo.size;
      }

      // Salvar metadados no Firestore
      await add("documentos", {
        clienteId: form.clienteId,
        nomeArquivo: form.nomeArquivo,
        tipo: form.tipo,
        categoria: form.categoria,
        descricao: form.descricao,
        validade: form.validade,
        status: form.status,
        responsavelTecnico: form.responsavelTecnico,
        uploadedBy: user!.email,
        storageUrl,
        storagePath,
        mimeType,
        tamanho,
        obs: form.obs,
      });

      setForm(EMPTY);
      toast.success("Documento salvo com sucesso!");
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code === "permission-denied"
        ? "Permissão negada. Configure as regras do Firestore em Configurações."
        : "Erro ao salvar documento.";
      toast.error(msg);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleViewPdf = (doc: any) => {
    if (doc.storageUrl) {
      setPdfViewerUrl(doc.storageUrl);
      setPdfViewerTitle(doc.nomeArquivo);
      setPdfViewerOpen(true);
    } else {
      toast.error("Arquivo não disponível.");
    }
  };

  const handleDelete = async (doc: any) => {
    try {
      if (doc.storagePath) {
        await deleteDocumentoFile(doc.storagePath);
      }
      await remove("documentos", doc.id);
      toast.success("Documento deletado com sucesso!");
    } catch (err) {
      toast.error("Erro ao deletar documento.");
    }
  };

  const filtered = documentos.filter((d) => {
    const byCliente = filterCliente === "todos" || d.clienteId === filterCliente;
    const byStatus = filterStatus === "todos" || d.status === filterStatus;
    const byCategoria = filterCategoria === "todos" || d.categoria === filterCategoria;
    return byCliente && byStatus && byCategoria;
  });

  return (
    <div className="space-y-6">
      {/* Form */}
      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="w-4 h-4" style={{ color: "oklch(0.72 0.19 47)" }} />
              Adicionar documento ao prontuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Cliente *</Label>
                  <Select value={form.clienteId} onValueChange={(v) => set("clienteId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={clientes.length === 0 ? "Cadastre um cliente primeiro" : "Selecionar cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.razao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nome do arquivo *</Label>
                  <Input
                    value={form.nomeArquivo}
                    onChange={(e) => set("nomeArquivo", e.target.value)}
                    placeholder="Ex: Projeto Elétrico v2"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => set("categoria", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_DOC.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tipo</Label>
                  <Input
                    value={form.tipo}
                    onChange={(e) => set("tipo", e.target.value)}
                    placeholder="Ex: PDF, Imagem, etc"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Validade</Label>
                  <Input type="date" value={form.validade} onChange={(e) => set("validade", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Válido", "Pendente", "Vencido", "Em revisão"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Responsável técnico</Label>
                  <Input
                    value={form.responsavelTecnico}
                    onChange={(e) => set("responsavelTecnico", e.target.value)}
                    placeholder="Nome, CREA/CFT"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Arquivo</Label>
                  <Input
                    type="file"
                    onChange={(e) => set("arquivo", e.target.files?.[0])}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  className="min-h-[60px]"
                  placeholder="Descreva o conteúdo do documento..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Observações</Label>
                <Textarea
                  value={form.obs}
                  onChange={(e) => set("obs", e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              <Button
                type="submit"
                disabled={saving || uploading}
                style={{ background: "oklch(0.72 0.19 47)", color: "oklch(0.1 0.02 258)" }}
                className="font-bold w-full"
              >
                {uploading ? "Enviando arquivo..." : saving ? "Salvando..." : "Salvar documento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Documentos ({filtered.length})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger className="h-8 text-xs w-[180px]">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.razao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="h-8 text-xs w-[160px]">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {CATEGORIAS_DOC.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs w-[140px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {["Válido", "Pendente", "Vencido", "Em revisão"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum documento encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d: any) => (
                    <TableRow key={d.id} className="data-row">
                      <TableCell className="font-medium text-sm">{clienteName(d.clienteId)}</TableCell>
                      <TableCell className="text-sm max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate block">{d.nomeArquivo}</span>
                        </div>
                        {d.descricao && (
                          <span className="text-xs text-muted-foreground block truncate">{d.descricao}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{d.categoria || "—"}</TableCell>
                      <TableCell><StatusBadge value={d.status} /></TableCell>
                      <TableCell className="text-sm font-mono">{d.validade || "—"}</TableCell>
                      <TableCell className="text-sm">{d.responsavelTecnico || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {d.storageUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => handleViewPdf(d)}
                            >
                              <ExternalLink className="w-3 h-3" /> Abrir
                            </Button>
                          )}
                          {canDelete && (
                            <ConfirmDelete onConfirm={() => handleDelete(d)} />
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

      {/* PDF Viewer */}
      <PdfViewer
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        title={pdfViewerTitle}
        url={pdfViewerUrl}
      />
    </div>
  );
}
