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
  { value: "TEACHER", label: "Professor" },
  { value: "SECRETARY", label: "Secretaria" },
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
type Student = { id: string; name: string };

type CreateForm = {
  role: string;
  // common
  name: string;
  email: string;
  phone: string;
  password: string;
  // student only
  cpf: string;
  birthDate: string;
  address: string;
  // guardian only
  studentId: string;
};

const emptyCreate = (): CreateForm => ({
  role: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  cpf: "",
  birthDate: "",
  address: "",
  studentId: "",
});

type EditForm = { name: string; phone: string };

export default function Users() {
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modal, setModal] = useState<
    "create" | "edit" | "deactivate" | "created" | null
  >(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate());
  const [editForm, setEditForm] = useState<EditForm>({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");
  const [createdUser, setCreatedUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [pwCopied, setPwCopied] = useState(false);
  const LIMIT = 20;

  const load = useCallback(
    async (p = 1, s = search, r = roleFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
        });
        if (r) params.set("role", r);
        // name search via query param (backend supports it for students; for users we pass name filter)
        if (s) params.set("name", s);
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
    [search, roleFilter],
  );

  useEffect(() => {
    load(1);
  }, [roleFilter]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      load(1, searchInput, roleFilter);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // load students list for guardian link
  useEffect(() => {
    if (modal === "create" && createForm.role === "GUARDIAN") {
      api
        .fetchJson("/students?limit=200")
        .then((res) => {
          setStudents(
            (res?.data ?? res ?? []).map((s: any) => ({
              id: s.id,
              name: s.name,
            })),
          );
        })
        .catch(() => {});
    }
  }, [modal, createForm.role]);

  function openCreate() {
    setCreateForm(emptyCreate());
    setFormError("");
    setModal("create");
  }

  function openEdit(u: User) {
    setEditForm({ name: u.name, phone: u.phone || "" });
    setFormError("");
    setSelected(u);
    setModal("edit");
  }

  function openDeactivate(u: User) {
    setSelected(u);
    setModal("deactivate");
  }

  function setC(patch: Partial<CreateForm>) {
    setCreateForm((f) => ({ ...f, ...patch }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const f = createForm;
    if (!f.role) {
      setFormError("Selecione um perfil.");
      return;
    }
    if (!f.name || !f.email) {
      setFormError("Nome e e-mail são obrigatórios.");
      return;
    }
    if (f.role === "GUARDIAN" && !f.studentId) {
      setFormError("Selecione o aluno vinculado.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      let tempPassword = "";
      let userName = f.name;
      let userEmail = f.email;

      if (f.role === "STUDENT") {
        // STUDENT: create via /students (creates user + student profile atomically)
        const res = await api.fetchJson("/students", {
          method: "POST",
          body: JSON.stringify({
            name: f.name,
            email: f.email || undefined,
            phone: f.phone || undefined,
            cpf: f.cpf || undefined,
            birthDate: f.birthDate || undefined,
            address: f.address || undefined,
          }),
        });
        tempPassword = res?.temporaryPassword || "";
        userName = res?.student?.name || f.name;
        userEmail = f.email;
      } else {
        // TEACHER, SECRETARY, GUARDIAN: create via /users
        const res = await api.fetchJson("/users", {
          method: "POST",
          body: JSON.stringify({
            name: f.name,
            email: f.email,
            role: f.role,
            phone: f.phone || undefined,
            password: f.password || undefined,
          }),
        });
        tempPassword = res?.temporaryPassword || "";
        userName = res?.user?.name || f.name;
        userEmail = res?.user?.email || f.email;

        // If GUARDIAN, link to student
        if (f.role === "GUARDIAN" && f.studentId && res?.user?.id) {
          try {
            await api.fetchJson(`/students/${f.studentId}/guardians`, {
              method: "POST",
              body: JSON.stringify({ guardianId: res.user.id }),
            });
          } catch {
            // link failed — not critical, warn user
            toast(
              "Usuário criado mas o vínculo com o aluno falhou. Vincule manualmente.",
              "error",
            );
          }
        }
      }

      setCreatedPassword(tempPassword);
      setCreatedUser({ name: userName, email: userEmail });
      setPwCopied(false);
      setModal("created");
      load(1, searchInput, roleFilter);
    } catch (e: any) {
      setFormError(e?.message || "Erro ao criar usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!editForm.name) {
      setFormError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.fetchJson(`/users/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone || undefined,
        }),
      });
      toast("Usuário atualizado!");
      setModal(null);
      load(page, searchInput, roleFilter);
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
      load(page, searchInput, roleFilter);
    } catch (e: any) {
      toast(e?.message || "Erro ao desativar.", "error");
    } finally {
      setSaving(false);
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(createdPassword).then(() => {
      setPwCopied(true);
      setTimeout(() => setPwCopied(false), 2000);
    });
  }

  const columns = [
    { key: "name", label: "Nome" },
    { key: "email", label: "E-mail" },
    { key: "role", label: "Perfil", width: 130 },
    { key: "phone", label: "Telefone", width: 130 },
    { key: "status", label: "Status", width: 90 },
    { key: "actions", label: "", width: 72 },
  ];

  const rows = items.map((u) => [
    <span style={{ fontWeight: 600, color: "#111827" }}>{u.name}</span>,
    <span style={{ color: "#6b7280", fontSize: 12.5 }}>{u.email}</span>,
    <StatusBadge
      label={ROLE_LABELS[u.role] || u.role}
      color={ROLE_COLORS[u.role] || "gray"}
    />,
    <span style={{ color: "#6b7280", fontSize: 12.5 }}>{u.phone || "—"}</span>,
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

  const roleLabel = ROLE_LABELS[createForm.role] || "";

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
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Buscar por nome..."
          >
            <SelectFilter
              value={roleFilter}
              onChange={(v) => setRoleFilter(v)}
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
        <Pagination
          page={page}
          total={total}
          limit={LIMIT}
          onPage={(p) => load(p, searchInput, roleFilter)}
        />
      </Card>

      {/* ── CRIAR USUÁRIO ────────────────────────── */}
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Novo usuário"
        width={520}
      >
        <form onSubmit={handleCreate}>
          {formError && (
            <div style={{ marginBottom: 14 }}>
              <InlineAlert message={formError} type="error" />
            </div>
          )}

          <FormField label="Perfil" required>
            <Select
              value={createForm.role}
              onChange={(v) => setC({ role: v })}
              options={ROLE_OPTIONS}
              placeholder="Selecione o perfil..."
            />
          </FormField>

          {createForm.role && (
            <>
              <div
                style={{
                  borderTop: "1px solid #f1f5f9",
                  margin: "14px 0 14px",
                  paddingTop: 14,
                }}
              >
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  Dados do {roleLabel}
                </p>
              </div>

              <FormField label="Nome completo" required>
                <Input
                  value={createForm.name}
                  onChange={(v) => setC({ name: v })}
                  placeholder="Ex: Maria Silva"
                />
              </FormField>

              <FormField
                label="E-mail"
                required={createForm.role !== "STUDENT"}
              >
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(v) => setC({ email: v })}
                  placeholder={
                    createForm.role === "STUDENT"
                      ? "Opcional para aluno"
                      : "email@escola.com"
                  }
                />
              </FormField>

              <FormField label="Telefone">
                <Input
                  value={createForm.phone}
                  onChange={(v) => setC({ phone: v })}
                  placeholder="(00) 00000-0000"
                />
              </FormField>

              {/* STUDENT extras */}
              {createForm.role === "STUDENT" && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <FormField label="CPF">
                      <Input
                        value={createForm.cpf}
                        onChange={(v) => setC({ cpf: v })}
                        placeholder="000.000.000-00"
                      />
                    </FormField>
                    <FormField label="Data de nascimento">
                      <input
                        type="date"
                        value={createForm.birthDate}
                        onChange={(e) => setC({ birthDate: e.target.value })}
                        style={{
                          width: "100%",
                          height: 40,
                          padding: "0 12px",
                          borderRadius: 9,
                          border: "1.5px solid #e2e8f0",
                          fontSize: 13,
                          fontFamily: "inherit",
                          boxSizing: "border-box",
                        }}
                      />
                    </FormField>
                  </div>
                  <FormField label="Endereço">
                    <Input
                      value={createForm.address}
                      onChange={(v) => setC({ address: v })}
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </FormField>
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "#eff6ff",
                      borderRadius: 9,
                      border: "1px solid #bfdbfe",
                      fontSize: 12.5,
                      color: "#1e40af",
                      marginBottom: 14,
                    }}
                  >
                    Uma senha temporária será gerada automaticamente e exibida
                    ao concluir.
                  </div>
                </>
              )}

              {/* GUARDIAN extras */}
              {createForm.role === "GUARDIAN" && (
                <>
                  <FormField label="Aluno vinculado" required>
                    <Select
                      value={createForm.studentId}
                      onChange={(v) => setC({ studentId: v })}
                      options={students.map((s) => ({
                        value: s.id,
                        label: s.name,
                      }))}
                      placeholder={
                        students.length === 0
                          ? "Carregando alunos..."
                          : "Selecione o aluno..."
                      }
                    />
                  </FormField>
                  <FormField label="Senha inicial">
                    <Input
                      type="password"
                      value={createForm.password}
                      onChange={(v) => setC({ password: v })}
                      placeholder="Deixe em branco para gerar automaticamente"
                    />
                  </FormField>
                </>
              )}

              {/* TEACHER / SECRETARY */}
              {(createForm.role === "TEACHER" ||
                createForm.role === "SECRETARY") && (
                <FormField label="Senha inicial">
                  <Input
                    type="password"
                    value={createForm.password}
                    onChange={(v) => setC({ password: v })}
                    placeholder="Deixe em branco para gerar automaticamente"
                  />
                </FormField>
              )}
            </>
          )}

          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </PrimaryButton>
            <PrimaryButton
              type="submit"
              loading={saving}
              disabled={!createForm.role}
            >
              Criar usuário
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      {/* ── USUÁRIO CRIADO — mostrar senha ────────── */}
      <Modal
        open={modal === "created"}
        onClose={() => setModal(null)}
        title="Usuário criado com sucesso"
      >
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "#374151" }}>
          <strong>{createdUser?.name}</strong> ({createdUser?.email}) foi
          cadastrado.
        </p>
        {createdPassword ? (
          <>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6b7280" }}>
              Senha temporária gerada:
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                background: "#f8fafc",
                borderRadius: 10,
                border: "1.5px solid #e2e8f0",
                marginBottom: 14,
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "2px",
                  color: "#111827",
                  fontFamily: "monospace",
                }}
              >
                {createdPassword}
              </code>
              <button
                onClick={copyPassword}
                style={{
                  padding: "5px 12px",
                  borderRadius: 7,
                  border: "1.5px solid #e2e8f0",
                  background: pwCopied ? "#dcfce7" : "#fff",
                  color: pwCopied ? "#16a34a" : "#6b7280",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {pwCopied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <InlineAlert
              message="Anote a senha. Ela não poderá ser visualizada novamente."
              type="info"
            />
          </>
        ) : (
          <InlineAlert
            message="Senha definida pelo usuário ou não retornada pela API."
            type="info"
          />
        )}
        <ModalFooter>
          <PrimaryButton onClick={() => setModal(null)}>Concluir</PrimaryButton>
        </ModalFooter>
      </Modal>

      {/* ── EDITAR ───────────────────────────────── */}
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
              value={editForm.name}
              onChange={(v) => setEditForm((f) => ({ ...f, name: v }))}
            />
          </FormField>
          <FormField label="E-mail">
            <Input value={selected?.email || ""} onChange={() => {}} disabled />
          </FormField>
          <FormField label="Perfil">
            <Input
              value={ROLE_LABELS[selected?.role || ""] || selected?.role || ""}
              onChange={() => {}}
              disabled
            />
          </FormField>
          <FormField label="Telefone">
            <Input
              value={editForm.phone}
              onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))}
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

      {/* ── DESATIVAR ────────────────────────────── */}
      <Modal
        open={modal === "deactivate"}
        onClose={() => setModal(null)}
        title="Desativar usuário"
      >
        <p style={{ margin: "0 0 16px", color: "#374151", fontSize: 14 }}>
          Tem certeza que deseja desativar <strong>{selected?.name}</strong>? O
          usuário perderá acesso ao sistema imediatamente.
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
