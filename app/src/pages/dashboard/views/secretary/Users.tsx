import React, { useEffect, useState, useCallback } from "react";
import api from "../../../../utils/api";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  cleanPhone,
  formatBrPhone,
  isValidBrPhone,
} from "../../../../utils/phone";
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
import TeacherProfileModal from "../../../../components/TeacherProfileModal";
import GuardianProfileModal from "../../../../components/GuardianProfileModal";

const ROLE_OPTIONS = [
  { value: "TEACHER", label: "Professor" },
  { value: "GUARDIAN", label: "Responsável" },
  { value: "SECRETARY", label: "Secretaria" },
];

const ROLE_FILTER_OPTIONS = [
  { value: "TEACHER", label: "Professor" },
  { value: "SECRETARY", label: "Secretaria" },
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
type CreateForm = {
  role: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
};
type EditForm = { name: string; email: string; phone: string };

const emptyCreate = (): CreateForm => ({
  role: "",
  name: "",
  email: "",
  phone: "",
  studentId: "",
});

const LIMIT = 20;

function formatPhonePartial(raw: string) {
  const d = cleanPhone(raw);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export default function Users() {
  const { user: authUser } = useAuth();
  const requesterRole = authUser?.role || "";
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [modal, setModal] = useState<
    | "create"
    | "edit"
    | "deactivate"
    | "activate"
    | "created"
    | "teacherProfile"
    | "guardianProfile"
    | null
  >(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate());
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");
  const [createdUser, setCreatedUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [pwCopied, setPwCopied] = useState(false);

  const roleLabel = ROLE_LABELS[createForm.role] ?? createForm.role;

  const load = useCallback(
    async (p = 1, s = search, r = roleFilter, inactive = showInactive) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
        });
        if (r) params.set("role", r);
        if (s) params.set("name", s);
        if (inactive) params.set("active", "false");
        else params.set("active", "true");
        const res = await api.fetchJson(`/users?${params}`);
        setItems(res?.data ?? []);
        setTotal(res?.meta?.total ?? 0);
        setPage(p);
      } catch (e: any) {
        toast(e?.message || "Erro ao carregar usuários", "error");
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, showInactive],
  );

  useEffect(() => {
    load(1);
  }, [roleFilter, showInactive]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      load(1, searchInput, roleFilter, showInactive);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (modal === "create" && createForm.role === "GUARDIAN") {
      api
        .fetchJson("/students?limit=200")
        .then((res) => {
          setStudents(
            (res?.data ?? []).map((s: any) => ({ id: s.id, name: s.name })),
          );
        })
        .catch(() => {});
    }
  }, [modal, createForm.role]);

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
    const phoneDigits = cleanPhone(f.phone);
    const phoneRequired = f.role === "TEACHER" || f.role === "GUARDIAN";
    if (phoneRequired && !phoneDigits) {
      setFormError("Telefone é obrigatório.");
      return;
    }
    if ((phoneDigits || phoneRequired) && !isValidBrPhone(phoneDigits)) {
      setFormError("Telefone inválido.");
      return;
    }
    if (f.role === "GUARDIAN" && !f.studentId) {
      setFormError("Selecione o aluno vinculado.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await api.fetchJson("/users", {
        method: "POST",
        body: JSON.stringify({
          name: f.name,
          email: f.email,
          role: f.role,
          phone: phoneDigits || undefined,
        }),
      });
      const tempPassword = res?.temporaryPassword ?? "";

      if (f.role === "GUARDIAN" && f.studentId && res?.user?.id) {
        try {
          await api.fetchJson(`/students/${f.studentId}/guardians`, {
            method: "POST",
            body: JSON.stringify({ guardianId: res.user.id }),
          });
        } catch {
          toast(
            "Usuário criado mas o vínculo com o aluno falhou. Vincule manualmente.",
            "error",
          );
        }
      }

      setCreatedPassword(tempPassword);
      setCreatedUser({
        name: res?.user?.name ?? f.name,
        email: res?.user?.email ?? f.email,
      });
      setPwCopied(false);
      setModal("created");
      load(1, searchInput, roleFilter, showInactive);
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
    if (!editForm.email) {
      setFormError("E-mail é obrigatório.");
      return;
    }
    const phoneDigits = cleanPhone(editForm.phone);
    const phoneRequired =
      selected.role === "TEACHER" || selected.role === "GUARDIAN";
    if (phoneRequired && !phoneDigits) {
      setFormError("Telefone é obrigatório.");
      return;
    }
    if ((phoneDigits || phoneRequired) && !isValidBrPhone(phoneDigits)) {
      setFormError("Telefone inválido.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.fetchJson(`/users/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: phoneDigits || undefined,
        }),
      });
      toast("Usuário atualizado!");
      setModal(null);
      load(page, searchInput, roleFilter, showInactive);
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
      toast("Usuário desativado!");
      setModal(null);
      load(page, searchInput, roleFilter, showInactive);
    } catch (e: any) {
      toast(e?.message || "Erro ao desativar.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.fetchJson(`/users/${selected.id}/activate`, {
        method: "PATCH",
      });
      toast("Usuário reativado!");
      setModal(null);
      load(page, searchInput, roleFilter, showInactive);
    } catch (e: any) {
      toast(e?.message || "Erro ao reativar.", "error");
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      key: "name",
      label: "Usuário",
      render: (row: User) => (
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{row.name}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Perfil",
      render: (row: User) => (
        <StatusBadge
          status="active"
          label={ROLE_LABELS[row.role] ?? row.role}
          color={ROLE_COLORS[row.role]}
        />
      ),
    },
    {
      key: "phone",
      label: "Telefone",
      render: (row: User) => (
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          {formatBrPhone(row.phone) || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: User) => (
        <StatusBadge
          status={row.active ? "active" : "inactive"}
          label={row.active ? "Ativo" : "Inativo"}
        />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row: User) => (
        <div style={{ display: "flex", gap: 4 }}>
          {!(requesterRole === "SECRETARY" && row.role === "SECRETARY") && (
            <IconButton
              icon="edit"
              title="Editar"
              onClick={() => {
                setSelected(row);
                setEditForm({
                  name: row.name,
                  email: row.email,
                  phone: row.phone ?? "",
                });
                setFormError("");
                setModal("edit");
              }}
            />
          )}
          {row.role === "TEACHER" && (
            <IconButton
              icon="view"
              title="Perfil profissional"
              onClick={() => {
                setSelected(row);
                setModal("teacherProfile");
              }}
            />
          )}
          {row.role === "GUARDIAN" && (
            <IconButton
              icon="view"
              title="Dados do responsável"
              onClick={() => {
                setSelected(row);
                setModal("guardianProfile");
              }}
            />
          )}
          {row.active ? (
            <IconButton
              icon="delete"
              title="Desativar"
              onClick={() => {
                setSelected(row);
                setModal("deactivate");
              }}
            />
          ) : (
            <IconButton
              icon="check"
              title="Reativar"
              onClick={() => {
                setSelected(row);
                setModal("activate");
              }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Usuários"
      description="Gerencie professores, responsáveis e secretaria. Para alunos, use o menu Alunos."
      action={
        <PrimaryButton
          onClick={() => {
            setCreateForm(emptyCreate());
            setFormError("");
            setModal("create");
          }}
        >
          + Novo usuário
        </PrimaryButton>
      }
    >
      <Card>
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "14px 16px",
            borderBottom: "1px solid #f1f5f9",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => load(1, searchInput, roleFilter, showInactive)}
            placeholder="Buscar por nome..."
          />
          <SelectFilter
            value={roleFilter}
            onChange={(v) => {
              setRoleFilter(v);
            }}
            options={[
              { value: "", label: "Todos os perfis" },
              ...ROLE_FILTER_OPTIONS,
            ]}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#6b7280",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Mostrar inativos
          </label>
        </div>

        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage="Nenhum usuário encontrado"
        />
        <Pagination
          page={page}
          total={total}
          limit={LIMIT}
          onPage={(p) => load(p, searchInput, roleFilter, showInactive)}
        />
      </Card>

      {/* CREATE */}
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Novo usuário"
        width={500}
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
                  margin: "14px 0",
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
              <FormField label="E-mail" required>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(v) => setC({ email: v })}
                  placeholder="email@exemplo.com"
                />
              </FormField>
              <FormField
                label="Telefone"
                required={
                  createForm.role === "TEACHER" ||
                  createForm.role === "GUARDIAN"
                }
              >
                <Input
                  value={formatPhonePartial(createForm.phone)}
                  onChange={(v) => setC({ phone: cleanPhone(v) })}
                  placeholder="(00) 00000-0000"
                />
              </FormField>
              {createForm.role === "GUARDIAN" && (
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
              )}
            </>
          )}
          <ModalFooter>
            <button
              type="button"
              onClick={() => setModal(null)}
              style={{
                padding: "0 20px",
                height: 38,
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                background: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancelar
            </button>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Criando..." : "Criar usuário"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      {/* CREATED */}
      <Modal
        open={modal === "created"}
        onClose={() => setModal(null)}
        title="Usuário criado!"
        width={400}
      >
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.5"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          {createdUser && (
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 15 }}>
              {createdUser.name}
            </p>
          )}
          {createdPassword && (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>
                Senha temporária:
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <code
                  style={{
                    background: "#f1f5f9",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  {createdPassword}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdPassword);
                    setPwCopied(true);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1.5px solid #e2e8f0",
                    background: pwCopied ? "#dcfce7" : "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {pwCopied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </>
          )}
        </div>
        <ModalFooter>
          <PrimaryButton onClick={() => setModal(null)}>Fechar</PrimaryButton>
        </ModalFooter>
      </Modal>

      {/* EDIT */}
      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="Editar usuário"
        width={440}
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
          <FormField label="E-mail" required>
            <Input
              type="email"
              value={editForm.email}
              onChange={(v) => setEditForm((f) => ({ ...f, email: v }))}
              placeholder="email@exemplo.com"
            />
          </FormField>
          <FormField
            label="Telefone"
            required={
              selected?.role === "TEACHER" || selected?.role === "GUARDIAN"
            }
          >
            <Input
              value={formatPhonePartial(editForm.phone)}
              onChange={(v) =>
                setEditForm((f) => ({ ...f, phone: cleanPhone(v) }))
              }
              placeholder="(00) 00000-0000"
            />
          </FormField>
          <ModalFooter>
            <button
              type="button"
              onClick={() => setModal(null)}
              style={{
                padding: "0 20px",
                height: 38,
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                background: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancelar
            </button>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      {/* DEACTIVATE */}
      <Modal
        open={modal === "deactivate"}
        onClose={() => setModal(null)}
        title="Desativar usuário"
        width={400}
      >
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#374151" }}>
          Desativar <strong>{selected?.name}</strong>? O usuário perderá acesso
          ao sistema.
        </p>
        <ModalFooter>
          <button
            onClick={() => setModal(null)}
            style={{
              padding: "0 20px",
              height: 38,
              borderRadius: 8,
              border: "1.5px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleDeactivate}
            disabled={saving}
            style={{
              padding: "0 20px",
              height: 38,
              borderRadius: 8,
              border: "none",
              background: "#ef4444",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {saving ? "Desativando..." : "Desativar"}
          </button>
        </ModalFooter>
      </Modal>

      {/* ACTIVATE */}
      <Modal
        open={modal === "activate"}
        onClose={() => setModal(null)}
        title="Reativar usuário"
        width={400}
      >
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#374151" }}>
          Reativar <strong>{selected?.name}</strong> e restaurar o acesso?
        </p>
        <ModalFooter>
          <button
            onClick={() => setModal(null)}
            style={{
              padding: "0 20px",
              height: 38,
              borderRadius: 8,
              border: "1.5px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancelar
          </button>
          <PrimaryButton onClick={handleActivate} disabled={saving}>
            {saving ? "Reativando..." : "Reativar"}
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      {/* TEACHER PROFILE */}
      {modal === "teacherProfile" && selected && (
        <TeacherProfileModal
          userId={selected.id}
          userName={selected.name}
          onClose={() => setModal(null)}
        />
      )}

      {/* GUARDIAN PROFILE */}
      {modal === "guardianProfile" && selected && (
        <GuardianProfileModal
          userId={selected.id}
          userName={selected.name}
          onClose={() => setModal(null)}
        />
      )}
    </PageShell>
  );
}
