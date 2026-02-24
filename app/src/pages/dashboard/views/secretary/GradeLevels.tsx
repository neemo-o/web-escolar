import React, { useEffect, useState, useCallback } from "react";
import api from "../../../../utils/api";
import {
  PageShell, Card, PrimaryButton, DataTable, Pagination,
  IconButton, Modal, FormField, ModalFooter, InlineAlert, toast,
} from "../../../../components/ui";

type GradeLevel = { id: string; name: string; code: string; description?: string; sortOrder: number };
type Form = { name: string; code: string; description: string; sortOrder: string };

const emptyForm = (): Form => ({ name: "", code: "", description: "", sortOrder: "0" });

const inputStyle: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px", borderRadius: 9,
  border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
};

export default function GradeLevels() {
  const [items, setItems] = useState<GradeLevel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<GradeLevel | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const LIMIT = 50;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.fetchJson(`/grade-levels?page=${p}&limit=${LIMIT}`);
      setItems(res?.data ?? res ?? []);
      setTotal(res?.meta?.total ?? 0);
      setPage(p);
    } catch { toast("Erro ao carregar séries", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, []);

  function setF(patch: Partial<Form>) { setForm(f => ({ ...f, ...patch })); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.code) { setFormError("Nome e código são obrigatórios."); return; }
    setSaving(true); setFormError("");
    try {
      await api.fetchJson("/grade-levels", {
        method: "POST",
        body: JSON.stringify({ name: form.name, code: form.code.toUpperCase(), description: form.description || undefined, sortOrder: Number(form.sortOrder) }),
      });
      toast("Série criada!"); setModal(null); load(1);
    } catch (e: any) { setFormError(e?.message || "Erro ao criar."); }
    finally { setSaving(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !form.name) { setFormError("Nome é obrigatório."); return; }
    setSaving(true); setFormError("");
    try {
      await api.fetchJson(`/grade-levels/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: form.name, description: form.description || undefined, sortOrder: Number(form.sortOrder) }),
      });
      toast("Série atualizada!"); setModal(null); load(page);
    } catch (e: any) { setFormError(e?.message || "Erro ao atualizar."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.fetchJson(`/grade-levels/${selected.id}`, { method: "DELETE" });
      toast("Série removida!"); setModal(null); load(page);
    } catch (e: any) { toast(e?.message || "Erro ao remover.", "error"); }
    finally { setSaving(false); }
  }

  function openEdit(item: GradeLevel) {
    setForm({ name: item.name, code: item.code, description: item.description || "", sortOrder: String(item.sortOrder) });
    setFormError(""); setSelected(item); setModal("edit");
  }

  const columns = [
    { key: "name", label: "Nome" },
    { key: "code", label: "Código" },
    { key: "sortOrder", label: "Ordem" },
    { key: "actions", label: "Ações" },
  ];
  const rows = items.map(item => [
    <span style={{ fontWeight: 600 }}>{item.name}</span>,
    <code style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>{item.code}</code>,
    item.sortOrder,
    <div style={{ display: "flex", gap: 4 }}>
      <IconButton onClick={() => openEdit(item)} title="Editar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </IconButton>
      <IconButton onClick={() => { setSelected(item); setModal("delete"); }} title="Remover" variant="danger">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
      </IconButton>
    </div>,
  ]);

  return (
    <PageShell
      title="Séries / Anos"
      description="Cadastre as séries ou anos escolares da sua instituição (ex: 1º Ano, 7º Ano, 3ª Série)."
      action={<PrimaryButton onClick={() => { setForm(emptyForm()); setFormError(""); setModal("create"); }}>+ Nova série</PrimaryButton>}
    >
      <Card>
        <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="Nenhuma série cadastrada." />
        <Pagination page={page} total={total} limit={LIMIT} onChange={load} />
      </Card>

      <Modal open={modal === "create"} onClose={() => setModal(null)} title="Nova série">
        <form onSubmit={handleCreate}>
          {formError && <div style={{ marginBottom: 14 }}><InlineAlert message={formError} type="error" /></div>}
          <FormField label="Nome (ex: 7º Ano)" required>
            <input value={form.name} onChange={e => setF({ name: e.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Código (ex: 7ANO)" required>
            <input value={form.code} onChange={e => setF({ code: e.target.value.toUpperCase() })} style={inputStyle} />
          </FormField>
          <FormField label="Ordem de exibição">
            <input type="number" min={0} value={form.sortOrder} onChange={e => setF({ sortOrder: e.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Descrição">
            <input value={form.description} onChange={e => setF({ description: e.target.value })} style={inputStyle} />
          </FormField>
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>Cancelar</PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>Criar</PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal open={modal === "edit"} onClose={() => setModal(null)} title={`Editar — ${selected?.name}`}>
        <form onSubmit={handleEdit}>
          {formError && <div style={{ marginBottom: 14 }}><InlineAlert message={formError} type="error" /></div>}
          <FormField label="Nome" required>
            <input value={form.name} onChange={e => setF({ name: e.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Código" >
            <input value={form.code} disabled style={{ ...inputStyle, background: "#f8fafc", color: "#94a3b8" }} />
          </FormField>
          <FormField label="Ordem de exibição">
            <input type="number" min={0} value={form.sortOrder} onChange={e => setF({ sortOrder: e.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Descrição">
            <input value={form.description} onChange={e => setF({ description: e.target.value })} style={inputStyle} />
          </FormField>
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>Cancelar</PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>Salvar</PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Remover série">
        <p style={{ margin: "0 0 20px", color: "#374151" }}>
          Tem certeza que deseja remover <strong>{selected?.name}</strong>? Turmas vinculadas a esta série ficarão sem série.
        </p>
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>Cancelar</PrimaryButton>
          <PrimaryButton variant="danger" onClick={handleDelete} loading={saving}>Remover</PrimaryButton>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
