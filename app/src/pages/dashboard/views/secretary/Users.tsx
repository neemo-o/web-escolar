import React, { useEffect, useState, useCallback } from "react";
import api from "../../../../utils/api";
import {
  PageShell,
  Card,
  PrimaryButton,
  SearchBar,
  SelectFilter,
  DataTable,
  Pagination,
  StatusBadge,
  IconButton,
  Modal,
  FormField,
  Input,
  Select,
  ModalFooter,
  InlineAlert,
  toast,
} from "../../../../components/ui";

const ROLE_OPTIONS = [
  { value: "SECRETARY", label: "Secretaria" },
  { value: "TEACHER", label: "Professor" },
  { value: "STUDENT", label: "Aluno" },
  { value: "GUARDIAN", label: "Responsável" },
];
const ROLE_LABELS: Record<string, string> = {
  SECRETARY: "Secretaria",
  TEACHER: "Professor",
  STUDENT: "Aluno",
  GUARDIAN: "Responsável",
  ADMIN_GLOBAL: "Admin Global",
};
const ROLE_COLORS: Record<
  string,
  "blue" | "green" | "yellow" | "purple" | "gray"
> = {
  SECRETARY: "blue",
  TEACHER: "green",
  STUDENT: "yellow",
  GUARDIAN: "purple",
  ADMIN_GLOBAL: "gray",
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  active: boolean;
  createdAt: string;
};

type FormState = {
  name: string;
  email: string;
  role: string;
  phone: string;
  password: string;
};
const emptyForm = (): FormState => ({
  name: "",
  email: "",
  role: "",
  phone: "",
  password: "",
});

export default function Users() {
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "deactivate" | null>(
    null,
  );
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const LIMIT = 20;

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
          ...(roleFilter ? { role: roleFilter } : {}),
        });
        const res = await api.fetchJson(`/users?${params}`);
        const data: User[] = res?.data ?? res ?? [];
        setItems(data);
        setTotal(res?.meta?.total ?? data.length);
        setPage(p);
      } catch (e: any) {
        toast(e?.message || "Erro ao carregar usuários", "error");
      } finally {
        setLoading(false);
      }
    },
    [roleFilter],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const filtered = items.filter(
    (u) =>
      !search ||
      `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setForm(emptyForm());
    setFormError("");
    setSelected(null);
    setModal("create");
  }

  function openEdit(u: User) {
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || "",
      password: "",
    });
    setFormError("");
    setSelected(u);
    setModal("edit");
  }

  function openDeactivate(u: User) {
    setSelected(u);
    setModal("deactivate");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.role) {
      setFormError("Nome, e-mail e perfil são obrigatórios.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.fetchJson("/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          phone: form.phone || undefined,
          password: form.password || undefined,
        }),
      });
      toast("Usuário criado com sucesso!");
      setModal(null);
      load(1);
    } catch (e: any) {
      setFormError(e?.message || "Erro ao criar usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setFormError("");
    try {
      await api.fetchJson(`/users/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
        }),
      });
      toast("Usuário atualizado!");
      setModal(null);
      load(page);
    } catch (e: any) {
      setFormError(e?.message || "Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.fetchJson(`/users/${selected.id}/deactivate`, {
        method: "PATCH",
      });
      toast("Usuário desativado.");
      setModal(null);
      load(page);
    } catch (e: any) {
      toast(e?.message || "Erro ao desativar.", "error");
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "name", label: "Nome" },
    { key: "email", label: "E-mail" },
    { key: "role", label: "Perfil", width: 130 },
    { key: "status", label: "Status", width: 90 },
    { key: "actions", label: "", width: 80 },
  ];

  const rows = filtered.map((u) => [
    <span style={{ fontWeight: 600, color: "#111827" }}>{u.name}</span>,
    <span style={{ color: "#6b7280" }}>{u.email}</span>,
    <StatusBadge
      label={ROLE_LABELS[u.role] || u.role}
      color={ROLE_COLORS[u.role] || "gray"}
    />,
    <StatusBadge
      label={u.active ? "Ativo" : "Inativo"}
      color={u.active ? "green" : "red"}
    />,
    <div style={{ display: "flex", gap: 4 }}>
      <IconButton onClick={() => openEdit(u)} title="Editar">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </IconButton>
      {u.active && (
        <IconButton
          onClick={() => openDeactivate(u)}
          title="Desativar"
          variant="danger"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </IconButton>
      )}
    </div>,
  ]);

  return (
    <PageShell
      title="Usuários"
      description="Gerencie professores, alunos, secretários e responsáveis da escola."
      action={
        <PrimaryButton onClick={openCreate}>+ Novo usuário</PrimaryButton>
      }
    >
      <Card>
        <div
          style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome ou e-mail..."
          >
            <SelectFilter
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v);
                load(1);
              }}
              options={ROLE_OPTIONS}
              placeholder="Todos os perfis"
            />
          </SearchBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Nenhum usuário encontrado."
        />
        <Pagination page={page} total={total} limit={LIMIT} onPage={load} />
      </Card>

      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Novo usuário"
      >
        <form onSubmit={handleCreate}>
          {formError && (
            <div style={{ marginBottom: 14 }}>
              <InlineAlert message={formError} type="error" />
            </div>
          )}
          <FormField label="Nome completo" required>
            <Input
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Ex: Maria Silva"
            />
          </FormField>
          <FormField label="E-mail" required>
            <Input
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="email@escola.com"
            />
          </FormField>
          <FormField label="Perfil" required>
            <Select
              value={form.role}
              onChange={(v) => setForm((f) => ({ ...f, role: v }))}
              options={ROLE_OPTIONS}
              placeholder="Selecione..."
            />
          </FormField>
          <FormField label="Telefone">
            <Input
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="(00) 00000-0000"
            />
          </FormField>
          <FormField label="Senha inicial">
            <Input
              type="password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder="Deixe em branco para gerar automaticamente"
            />
          </FormField>
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>
              Criar usuário
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="Editar usuário"
      >
        <form onSubmit={handleEdit}>
          {formError && (
            <div style={{ marginBottom: 14 }}>
              <InlineAlert message={formError} type="error" />
            </div>
          )}
          <FormField label="Nome completo" required>
            <Input
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
          </FormField>
          <FormField label="E-mail">
            <Input value={form.email} onChange={() => {}} disabled />
          </FormField>
          <FormField label="Perfil">
            <Input
              value={ROLE_LABELS[form.role] || form.role}
              onChange={() => {}}
              disabled
            />
          </FormField>
          <FormField label="Telefone">
            <Input
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="(00) 00000-0000"
            />
          </FormField>
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>
              Salvar alterações
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={modal === "deactivate"}
        onClose={() => setModal(null)}
        title="Desativar usuário"
      >
        <p style={{ margin: "0 0 16px", color: "#374151", fontSize: 14 }}>
          Tem certeza que deseja desativar <strong>{selected?.name}</strong>? O
          usuário perderá acesso ao sistema.
        </p>
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
            Cancelar
          </PrimaryButton>
          <PrimaryButton
            variant="danger"
            onClick={handleDeactivate}
            loading={saving}
          >
            Desativar
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
