// PIE Digital NR-10 — Relatórios PDF section
// Geração completa do Prontuário das Instalações Elétricas em PDF

import { useState, useRef } from "react";
import { usePie } from "@/contexts/PieContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Download, Loader2 } from "lucide-react";

declare const html2pdf: (element?: HTMLElement) => {
  set: (opts: Record<string, unknown>) => ReturnType<typeof html2pdf>;
  from: (el: HTMLElement) => ReturnType<typeof html2pdf>;
  save: () => Promise<void>;
};

export default function Relatorios() {
  const { clientes, documentos, checklist, inspecoes, acoes, trabalhadores, epis } = usePie();
  const [clienteId, setClienteId] = useState("");
  const [rt, setRt] = useState("");
  const [art, setArt] = useState("");
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const cliente = clientes.find((c) => c.id === clienteId);

  const handleGenerate = async () => {
    if (!cliente) { toast.error("Selecione um cliente."); return; }
    setGenerating(true);
    try {
      const el = reportRef.current;
      if (!el) return;
      const h2p = (window as unknown as { html2pdf: typeof html2pdf }).html2pdf;
      await h2p(el)
        .set({
          margin: 12,
          filename: `PIE_${cliente.razao.replace(/\W+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(el)
        .save();
      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF. Verifique o console.");
    } finally {
      setGenerating(false);
    }
  };

  const docs = documentos.filter((d) => d.clienteId === clienteId);
  const checks = checklist.filter((i) => i.clienteId === clienteId);
  const insps = inspecoes.filter((i) => i.clienteId === clienteId);
  const acts = acoes.filter((a) => a.clienteId === clienteId);
  const trabs = trabalhadores.filter((t) => t.clienteId === clienteId);
  const episList = epis.filter((e) => e.clienteId === clienteId);

  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" style={{ color: "oklch(0.72 0.19 47)" }} />
            Gerar relatório do prontuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder={clientes.length === 0 ? "Cadastre um cliente" : "Selecionar cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.razao}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Responsável técnico</Label>
              <Input value={rt} onChange={(e) => setRt(e.target.value)} placeholder="Nome, CREA/CFT" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">ART / TRT</Label>
              <Input value={art} onChange={(e) => setArt(e.target.value)} placeholder="Número da ART/TRT" />
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !clienteId}
            style={{ background: "oklch(0.72 0.19 47)", color: "oklch(0.1 0.02 258)" }}
            className="font-bold gap-2"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...</>
            ) : (
              <><Download className="w-4 h-4" /> Gerar PDF do Prontuário</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report preview */}
      {cliente && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pré-visualização do relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={reportRef}
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: "11px",
                color: "#111",
                background: "#fff",
                padding: "0",
                lineHeight: 1.5,
              }}
            >
              {/* Cover */}
              <div style={{ borderBottom: "4px solid #ff7a00", paddingBottom: "16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "12px",
                    background: "linear-gradient(135deg, #ff7a00, #ffc079)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "900", fontSize: "14px", color: "#061a3a",
                  }}>PIE</div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: "18px", color: "#061a3a", fontWeight: "900" }}>
                      Prontuário das Instalações Elétricas — PIE
                    </h1>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6b7280" }}>
                      Base técnica: NR-10 • NBR 5410 • NBR 5419 quando aplicável
                    </p>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px 8px 3px 0", fontWeight: "bold", color: "#374151", width: "160px" }}>Cliente:</td>
                      <td style={{ padding: "3px 0" }}>{cliente.razao}</td>
                      <td style={{ padding: "3px 8px 3px 16px", fontWeight: "bold", color: "#374151", width: "80px" }}>CNPJ:</td>
                      <td style={{ padding: "3px 0" }}>{cliente.cnpj || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 8px 3px 0", fontWeight: "bold", color: "#374151" }}>Endereço:</td>
                      <td colSpan={3} style={{ padding: "3px 0" }}>{cliente.endereco || "—"} — {cliente.cidade || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 8px 3px 0", fontWeight: "bold", color: "#374151" }}>Resp. técnico:</td>
                      <td style={{ padding: "3px 0" }}>{rt || "—"}</td>
                      <td style={{ padding: "3px 8px 3px 16px", fontWeight: "bold", color: "#374151" }}>ART/TRT:</td>
                      <td style={{ padding: "3px 0" }}>{art || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 8px 3px 0", fontWeight: "bold", color: "#374151" }}>Data de emissão:</td>
                      <td style={{ padding: "3px 0" }}>{today}</td>
                      <td style={{ padding: "3px 8px 3px 16px", fontWeight: "bold", color: "#374151" }}>Carga instalada:</td>
                      <td style={{ padding: "3px 0" }}>{cliente.carga || 0} kW</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 1 */}
              <ReportSection title="1. Caracterização da instalação">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <tbody>
                    {[
                      ["Tensão de entrada", cliente.tensao || "—"],
                      ["Possui subestação", cliente.subestacao || "—"],
                      ["Sistema solar fotovoltaico", cliente.solar || "—"],
                      ["Responsável legal", cliente.responsavelEmpresa || "—"],
                      ["Telefone", cliente.telefone || "—"],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ padding: "4px 8px 4px 0", fontWeight: "bold", color: "#374151", width: "200px" }}>{k}:</td>
                        <td style={{ padding: "4px 0" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ReportSection>

              {/* Section 2 */}
              <ReportSection title="2. Documentos do prontuário">
                <ReportTable
                  headers={["Documento", "Status", "Validade", "Responsável técnico"]}
                  rows={docs.map((d) => [d.tipo, d.status, d.validade || "—", d.responsavelTecnico || "—"])}
                  empty="Nenhum documento registrado."
                />
              </ReportSection>

              {/* Section 3 */}
              <ReportSection title="3. Checklist NR-10">
                <ReportTable
                  headers={["Item verificado", "Conformidade", "Observação/Evidência"]}
                  rows={checks.map((i) => [i.item, i.status, i.obs || "—"])}
                  empty="Nenhum item de checklist registrado."
                />
              </ReportSection>

              {/* Section 4 */}
              <ReportSection title="4. Relatório de inspeção técnica de campo">
                <ReportTable
                  headers={["Local", "Risco", "Não conformidade", "Recomendação", "Norma", "Status"]}
                  rows={insps.map((i) => [i.local || "—", i.risco, i.descricao || "—", i.recomendacao || "—", i.norma || "—", i.status])}
                  empty="Nenhuma inspeção registrada."
                />
              </ReportSection>

              {/* Section 5 */}
              <ReportSection title="5. Plano de ação e cronograma de adequação">
                <ReportTable
                  headers={["Ação recomendada", "Prioridade", "Prazo", "Responsável", "Status"]}
                  rows={acts.map((a) => [a.acao || "—", a.prioridade, a.prazo || "—", a.responsavel || "—", a.status])}
                  empty="Nenhuma ação registrada."
                />
              </ReportSection>

              {/* Section 6 */}
              <ReportSection title="6. Trabalhadores autorizados (NR-10)">
                <ReportTable
                  headers={["Nome", "Função", "Tipo de autorização", "Validade", "Status"]}
                  rows={trabs.map((t) => [t.nome || "—", t.funcao || "—", t.tipo, t.validade || "—", t.status])}
                  empty="Nenhum trabalhador registrado."
                />
              </ReportSection>

              {/* Section 7 */}
              <ReportSection title="7. EPIs, EPCs e ferramentas">
                <ReportTable
                  headers={["Tipo", "Nome", "CA/Certificado", "Validade/Teste", "Condição"]}
                  rows={episList.map((e) => [e.tipo, e.nome || "—", e.ca || "—", e.validade || "—", e.status])}
                  empty="Nenhum item registrado."
                />
              </ReportSection>

              {/* Section 8 */}
              <ReportSection title="8. Observação técnica e declaração">
                <p style={{ margin: 0, textAlign: "justify" }}>
                  Este Prontuário das Instalações Elétricas foi elaborado com base nas informações fornecidas e nos registros
                  técnicos disponíveis, em conformidade com os requisitos da NR-10 (Segurança em Instalações e Serviços em
                  Eletricidade), NBR 5410 (Instalações Elétricas de Baixa Tensão) e NBR 5419 (Proteção contra Descargas
                  Atmosféricas), quando aplicável. A validação final deve ser realizada por profissional legalmente habilitado,
                  com emissão de ART ou TRT junto ao CREA/CFT competente.
                </p>
                <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between", gap: "24px" }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ borderTop: "1px solid #374151", paddingTop: "6px", marginTop: "32px" }}>
                      <p style={{ margin: 0, fontWeight: "bold" }}>{rt || "Responsável técnico"}</p>
                      <p style={{ margin: "2px 0 0", color: "#6b7280" }}>CREA/CFT: {art || "—"}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ borderTop: "1px solid #374151", paddingTop: "6px", marginTop: "32px" }}>
                      <p style={{ margin: 0, fontWeight: "bold" }}>{cliente.responsavelEmpresa || "Responsável legal"}</p>
                      <p style={{ margin: "2px 0 0", color: "#6b7280" }}>{cliente.razao}</p>
                    </div>
                  </div>
                </div>
              </ReportSection>

              {/* Footer */}
              <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "20px", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#9ca3af" }}>
                <span>PIE Digital NR-10 — Desenvolvido por Joelson M. Mendes — SENAI HUB Inovação e Tecnologia</span>
                <span>Emitido em {today}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!cliente && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Selecione um cliente acima para visualizar e gerar o relatório do prontuário.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{
        margin: "0 0 8px",
        fontSize: "13px",
        fontWeight: "900",
        color: "#061a3a",
        borderLeft: "4px solid #ff7a00",
        paddingLeft: "8px",
        lineHeight: 1.3,
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function ReportTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) {
    return <p style={{ margin: 0, color: "#9ca3af", fontStyle: "italic" }}>{empty}</p>;
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
      <thead>
        <tr style={{ background: "#f1f5f9" }}>
          {headers.map((h) => (
            <th key={h} style={{
              border: "1px solid #e2e8f0",
              padding: "5px 6px",
              textAlign: "left",
              fontWeight: "700",
              color: "#374151",
              fontSize: "10px",
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
            {row.map((cell, j) => (
              <td key={j} style={{
                border: "1px solid #e2e8f0",
                padding: "5px 6px",
                color: "#1f2937",
                verticalAlign: "top",
              }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
