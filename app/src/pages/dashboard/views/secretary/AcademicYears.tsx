import React, { useEffect, useState, useCallback } from "react";
import api from "../../../../utils/api";
import {
  PageShell, Card, PrimaryButton, DataTable, Pagination,
  StatusBadge, IconButton, Modal, FormField, ModalFooter,
  InlineAlert, toast,
} from "../../../../components/ui";

const YEAR_STATUS_LABELS: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  EM_ANDAMENTO: "Em andamento",
  ENCERRADO: "Encerrado",
  ARQUIVADO: "Arquivado",
};
const YEAR_STATUS_COLORS: Record<string, "blue" | "green" | "gray" | "red"> = {
  PLANEJAMENTO: "blue",
  EM_ANDAMENTO: "green",
  ENCERRADO: "gray",
  ARQUIVADO: "gray",
};
const PERIOD_STATUS_LABELS: Record<string, string> = { OPEN: "Aberto", CLOSED: "Fechado" };
const PERIOD_STATUS_COLORS: Record<string, "green" | "gray"> = { OPEN: "green", CLOSED: "gray" };
const YEAR_STATUS_OPTIONS = Object.entries(YEAR_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

type AcYear = { id: string; year: number; startDate: string; endDate: string; status: string; active: boolean };
type Period = { id: string; name: string; sequence: number; startDate: string; endDate: string; status: string };

type YearForm = { year: string; startDate: string; endDate: string };
type PeriodForm = { name: string; sequence: string; startDate: string; endDate: string };

const emptyYear = (): YearForm => ({ year: String(new Date().getFullYear()), startDate: "", endDate: "" });
const emptyPeriod = (): PeriodForm => ({ name: "", sequence: "1", startDate: "", endDate: "" });

const inputStyle: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px", borderRadius: 9,
  border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
};

export default function AcademicYears() {
  const [years, setYears] = useState<AcYear[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"createYear" | "editYear" | "status" | "periods" | "createPeriod" | null>(null);
  const [selected, setSelected] = useState<AcYear | null>(null);
  const [yearForm, setYearForm] = useState<YearForm>(emptyYear());
  const [periodForm, setPeriodForm] = useState<PeriodForm>(emptyPeriod());
  const [newStatus, setNewStatus] = useState("");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const LIMIT = 20;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.fetchJson(`/academic-years?page=${p}&limit=${LIMIT}`);
      setYears(res?.data ?? res ?? []);
      setTotal(res?.meta?.total ?? 0);
      setPage(p);
    } catch { toast("Erro ao carregar anos letivos", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, []);

  async function loadPeriods(yearId: string) {
    try {
      const res = await api.fetchJson(`/academic-years/${yearId}/periods`);
      setPeriods(res?.data ?? res ?? []);
    } catch { toast("Erro ao carregar períodos", "error"); }
  }

  async function handleCreateYear(e: React.FormEvent) {
    e.preventDefault();
    if (!yearForm.year || !yearForm.startDate || !yearForm.endDate) {
      setFormError("Todos os campos são obrigatórios."); return;
    }
    setSaving(true); setFormError("");
    try {
      await api.fetchJson("/academic-years", {
        method: "POST",
        body: JSON.stringify({ year: Number(yearForm.year), startDate: yearForm.startDate, endDate: yearForm.endDate }),
      });
      toast("Ano letivo criado!"); setModal(null); load(1);
    } catch (e: any) { setFormError(e?.message || "Erro ao criar."); }
    finally { setSaving(false); }
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !newStatus) return;
    setSaving(true); setFormError("");
    try {
      await api.fetchJson(`/academic-years/${selected.id}/status`, {
        method: "PATCH", body: JSON.stringify({ status: newStatus }),
      });
      toast("Status atualizado!"); setModal(null); load(page);
    } catch (e: any) { setFormError(e?.message || "Erro ao atualizar."); }
    finally { setSaving(false); }
  }

  async function handleActivate(year: AcYear) {
    try {
      await api.fetchJson(`/academic-years/${year.id}/activate`, { method: "PATCH" });
      toast("Ano letivo ativado!"); load(page);
    } catch (e: any) { toast(e?.message || "Erro ao ativar.", "error"); }
  }

  async function handleCreatePeriod(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !periodForm.name || !periodForm.startDate || !periodForm.endDate) {
      setFormError("Todos os campos são obrigatórios."); return;
    }
    setSaving(true); setFormError("");
    try {
      await api.fetchJson(`/academic-years/${selected.id}/periods`, {
        method: "POST",
        body: JSON.stringify({
          name: periodForm.name,
          sequence: Number(periodForm.sequence),
          startDate: periodForm.startDate,
          endDate: periodForm.endDate,
        }),
      });
      toast("Período criado!"); setModal("periods"); loadPeriods(selected.id);
    } catch (e: any) { setFormError(e?.message || "Erro ao criar período."); }
    finally { setSaving(false); }
  }

  async function togglePeriodStatus(period: Period, yearId: string) {
    try {
      const newSt = period.status === "OPEN" ? "CLOSED" : "OPEN";
      await api.fetchJson(`/academic-years/${yearId}/periods/${period.id}/status`, {
        method: "PATCH", body: JSON.stringify({ status: newSt }),
      });
      loadPeriods(yearId);
    } catch (e: any) { toast(e?.message || "Erro.", "error"); }
  }

  function fmt(d: string) { return d ? new Date(d).toLocaleDateString("pt-BR") : "—"; }

  const columns = ["Ano", "Período", "Status", "Ano Ativo", "Ações"];
  const rows = years.map((y) => [
    <span style={{ fontWeight: 700 }}>{y.year}</span>,
    `${fmt(y.startDate)} → ${fmt(y.endDate)}`,
    <StatusBadge label={YEAR_STATUS_LABELS[y.status] || y.status} color={YEAR_STATUS_COLORS[y.status] || "gray"} />,
    y.active ? <StatusBadge label="Ativo" color="green" /> : <StatusBadge label="Inativo" color="gray" />,
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      <IconButton title="Gerenciar Períodos" onClick={() => {
        setSelected(y); loadPeriods(y.id); setModal("periods");
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </IconButton>
      <IconButton title="Alterar Status" onClick={() => { setSelected(y); setNewStatus(y.status); setFormError(""); setModal("status"); }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      </IconButton>
      {!y.active && (
        <IconButton title="Definir como ativo" onClick={() => handleActivate(y)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </IconButton>
      )}
    </div>,
  ]);

  const periodColumns = ["Nome", "Seq.", "Período", "Status", "Ação"];
  const periodRows = periods.map((p) => [
    p.name,
    p.sequence,
    `${fmt(p.startDate)} → ${fmt(p.endDate)}`,
    <StatusBadge label={PERIOD_STATUS_LABELS[p.status] || p.status} color={PERIOD_STATUS_COLORS[p.status] || "gray"} />,
    <IconButton title={p.status === "OPEN" ? "Fechar" : "Reabrir"}
      onClick={() => selected && togglePeriodStatus(p, selected.id)}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    </IconButton>,
  ]);

  return (
    <PageShell
      title="Anos Letivos"
      description="Gerencie anos letivos e períodos (bimestres/semestres) da escola."
      action={<PrimaryButton onClick={() => { setYearForm(emptyYear()); setFormError(""); setModal("createYear"); }}>+ Novo ano letivo</PrimaryButton>}
    >
      <Card>
        <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="Nenhum ano letivo cadastrado." />
        <Pagination page={page} total={total} limit={LIMIT} onChange={(p) => load(p)} />
      </Card>

      {/* Create year */}
      <Modal open={modal === "createYear"} onClose={() => setModal(null)} title="Novo ano letivo">
        <form onSubmit={handleCreateYear}>
          {formError && <div style={{ marginBottom: 14 }}><InlineAlert message={formError} type="error" /></div>}
          <FormField label="Ano" required>
            <input type="number" value={yearForm.year} onChange={e => setYearForm(f => ({ ...f, year: e.target.value }))} style={inputStyle} />
          </FormField>
          <FormField label="Data de início" required>
            <input type="date" value={yearForm.startDate} onChange={e => setYearForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
          </FormField>
          <FormField label="Data de término" required>
            <input type="date" value={yearForm.endDate} onChange={e => setYearForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
          </FormField>
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>Cancelar</PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>Criar</PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      {/* Change status */}
      <Modal open={modal === "status"} onClose={() => setModal(null)} title={`Status — ${selected?.year}`}>
        <form onSubmit={handleUpdateStatus}>
          {formError && <div style={{ marginBottom: 14 }}><InlineAlert message={formError} type="error" /></div>}
          <FormField label="Novo status">
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={inputStyle}>
              {YEAR_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>Cancelar</PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>Salvar</PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      {/* Periods */}
      <Modal open={modal === "periods"} onClose={() => setModal(null)} title={`Períodos — ${selected?.year}`} width={640}>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
          <PrimaryButton onClick={() => { setPeriodForm(emptyPeriod()); setFormError(""); setModal("createPeriod"); }}>
            + Novo período
          </PrimaryButton>
        </div>
        <DataTable columns={periodColumns} rows={periodRows} loading={false} emptyMessage="Nenhum período cadastrado." />
      </Modal>

      {/* Create period */}
      <Modal open={modal === "createPeriod"} onClose={() => setModal("periods")} title="Novo período">
        <form onSubmit={handleCreatePeriod}>
          {formError && <div style={{ marginBottom: 14 }}><InlineAlert message={formError} type="error" /></div>}
          <FormField label="Nome (ex: 1º Bimestre)" required>
            <input value={periodForm.name} onChange={e => setPeriodForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
          </FormField>
          <FormField label="Sequência">
            <input type="number" min={1} value={periodForm.sequence} onChange={e => setPeriodForm(f => ({ ...f, sequence: e.target.value }))} style={inputStyle} />
          </FormField>
          <FormField label="Data de início" required>
            <input type="date" value={periodForm.startDate} onChange={e => setPeriodForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
          </FormField>
          <FormField label="Data de término" required>
            <input type="date" value={periodForm.endDate} onChange={e => setPeriodForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
          </FormField>
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal("periods")}>Voltar</PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>Criar período</PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>
    </PageShell>
  );
}
