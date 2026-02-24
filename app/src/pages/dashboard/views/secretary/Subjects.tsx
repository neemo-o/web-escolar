import React, { useEffect, useState, useCallback } from "react";
import api from "../../../../utils/api";
import {
  PageShell, Card, PrimaryButton, SearchBar, DataTable, Pagination,
  IconButton, Modal, FormField, ModalFooter, InlineAlert, toast,
} from "../../../../components/ui";

type Subject = { id: string; name: string; code: string; description?: string };
type Form = { name: string; code: string; description: string };
const emptyForm = (): Form => ({ name: "", code: "", description: "" });

const inputStyle: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px", borderRadius: 9,
  border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
};

export default function Subjects() {
  const [items, setItems] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const LIMIT = 20;

  const load = useCallback(async (p = 1, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (s) params.set("name", s);
      const res = await api.fetchJson(`/subjects?${params}`);
      setItems(res?.data ?? res ?? []);
      setTotal(res?.meta?.total ?? 0);
      setPage(p);
    } catch { toast("Erro ao carregar disciplinas", "error"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, []);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); load(1, searchInput); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function setF(patch: Partial<Form>) { setForm(f => ({ ...f, ...patch })); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.code) { setFormError("Nome e código são obrigatórios."); return; }
    setSaving(true); setFormError("");
    try {
      await api.fetchJson("/subjects", {
        method: "POST",
        body: JSON.stringify({ name: form.name, code: form.code.toUpperCase(), description: form.description || undefined }),
      });
      toast("Disciplina criada!"); setModal(null); load(1);
    } catch (e: any) { setFormError(e?.message || "Erro ao criar."); }
    finally { setSaving(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !form.name) { setFormError("Nome é obrigatório."); return; }
    setSaving(true); setFormError("");
    try {
      await api.fetchJson(`/subjects/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: form.name, description: form.description || undefined }),
      });
      toast("Disciplina atualizada!"); setModal(null); load(page);
    } catch (e: any) { setFormError(e?.message || "Erro ao atualizar."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.fetchJson(`/subjects/${selected.id}`, { method: "DELETE" });
      toast("Disciplina removida!"); setModal(null); load(page);
    } catch (e: any) { toast(e?.message || "Erro ao remover.", "error"); }
    finally { setSaving(false); }
  }

  function openEdit(item: Subject) {
    setForm({ name: item.name, code: item.code, description: item.description || "" });
    setFormError(""); setSelected(item); setModal("edit");
  }

  const columns = ["Nome", "Código", "Descrição", "Ações"];
  const rows = items.map(item => [
    <span style={{ fontWeight: 600 }}>{item.name}</span>,
    <code style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>{item.code}</code>,
    item.description || <span style={{ color: "#9ca3af" }}>—</span>,
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
      title="Disciplinas"
      description="Cadastre as disciplinas oferecidas pela escola (ex: Matemática, Português, Ciências)."
      action={<PrimaryButton onClick={() => { setForm(emptyForm()); setFormError(""); setModal("create"); }}>+ Nova disciplina</PrimaryButton>}
    >
      <Card>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Buscar disciplina..." />
        </div>
        <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="Nenhuma disciplina cadastrada." />
        <Pagination page={page} total={total} limit={LIMIT} onChange={(p) => load(p)} />
      </Card>

      <Modal open={modal === "create"} onClose={() => setModal(null)} title="Nova disciplina">
        <form onSubmit={handleCreate}>
          {formError && <div style={{ marginBottom: 14 }}><InlineAlert message={formError} type="error" /></div>}
          <FormField label="Nome (ex: Matemática)" required>
            <input value={form.name} onChange={e => setF({ name: e.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Código (ex: MAT)" required>
            <input value={form.code} onChange={e => setF({ code: e.target.value.toUpperCase() })} style={inputStyle} />
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
          <FormField label="Código">
            <input value={form.code} disabled style={{ ...inputStyle, background: "#f8fafc", color: "#94a3b8" }} />
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

      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Remover disciplina">
        <p style={{ margin: "0 0 20px", color: "#374151" }}>
          Remover <strong>{selected?.name}</strong>? Vínculos com turmas e avaliações existentes não serão afetados.
        </p>
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>Cancelar</PrimaryButton>
          <PrimaryButton variant="danger" onClick={handleDelete} loading={saving}>Remover</PrimaryButton>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
