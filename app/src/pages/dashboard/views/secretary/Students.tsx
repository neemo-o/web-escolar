import { useEffect, useState, useCallback } from "react";
import api from "../../../../utils/api";
import { useAuth } from "../../../../contexts/AuthContext";
import { cleanCpf, formatCpf, isValidCpf } from "../../../../utils/cpf";
import { fetchCep } from "../../../../utils/cep";
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

// ─── Types ───────────────────────────────────────────────────────────────────

type Student = {
  id: string;
  name: string;
  socialName?: string;
  cpf?: string;
  maskedCpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  street?: string;
  addressNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  status: string;
  avatarUrl?: string;
  nationality?: string;
  naturalidade?: string;
  birthCertificate?: string;
  enrollments?: any[];
  guardians?: any[];
};

type Health = {
  allergies?: string;
  dietaryRestrictions?: string;
  specialNeeds?: string;
  medication?: string;
  bloodType?: string;
  healthNotes?: string;
};

type DocItem = {
  id: string;
  type: string;
  name: string;
  fileUrl?: string;
  delivered: boolean;
  notes?: string;
};

type Movement = {
  id: string;
  type: string;
  description?: string;
  fromValue?: string;
  toValue?: string;
  createdAt: string;
  createdBy?: { name: string };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "TRANSFERIDO", label: "Transferido" },
  { value: "TRANCADO", label: "Trancado" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
];

const GENDER_OPTIONS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMININO", label: "Feminino" },
  { value: "OUTRO", label: "Outro" },
  { value: "NAO_INFORMADO", label: "Não informado" },
];

const DOC_TYPE_OPTIONS = [
  { value: "RG", label: "RG" },
  { value: "CPF", label: "CPF" },
  { value: "CERTIDAO_NASCIMENTO", label: "Certidão de Nascimento" },
  { value: "COMPROVANTE_RESIDENCIA", label: "Comprovante de Residência" },
  { value: "HISTORICO_ESCOLAR", label: "Histórico Escolar" },
  { value: "LAUDO_MEDICO", label: "Laudo Médico" },
  { value: "FOTO", label: "Foto" },
  { value: "OUTRO", label: "Outro" },
];

const STATUS_LABEL: Record<string, string> = {
  ATIVO: "Ativo",
  TRANSFERIDO: "Transferido",
  TRANCADO: "Trancado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const DOC_TYPE_LABEL: Record<string, string> = {
  RG: "RG",
  CPF: "CPF",
  CERTIDAO_NASCIMENTO: "Certidão de Nascimento",
  COMPROVANTE_RESIDENCIA: "Comprovante de Residência",
  HISTORICO_ESCOLAR: "Histórico Escolar",
  LAUDO_MEDICO: "Laudo Médico",
  FOTO: "Foto",
  OUTRO: "Outro",
};

const MOVEMENT_LABEL: Record<string, string> = {
  MATRICULA: "Matrícula",
  TRANSFERENCIA_TURMA: "Transferência de Turma",
  TRANSFERENCIA_SERIE: "Transferência de Série",
  TRANCAMENTO: "Trancamento",
  REATIVACAO: "Reativação",
  CONCLUSAO: "Conclusão",
  CANCELAMENTO: "Cancelamento",
  OUTRO: "Outro",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        height: 40,
        padding: "0 12px",
        borderRadius: 9,
        border: "1.5px solid #e2e8f0",
        fontSize: 13,
        fontFamily: "inherit",
        boxSizing: "border-box",
        background: "#fff",
      }}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "18px 0 10px",
        fontSize: 11,
        fontWeight: 700,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </p>
  );
}

function emptyForm() {
  return {
    name: "",
    socialName: "",
    cpf: "",
    rg: "",
    birthCertificate: "",
    birthDate: "",
    gender: "",
    nationality: "",
    naturalidade: "",
    email: "",
    phone: "",
    zipCode: "",
    street: "",
    addressNumber: "",
    neighborhood: "",
    city: "",
    state: "",
    status: "ATIVO",
  };
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "dados" | "saude" | "documentos" | "responsaveis" | "historico";

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "dados", label: "Dados" },
    { id: "saude", label: "Saúde" },
    { id: "documentos", label: "Documentos" },
    { id: "responsaveis", label: "Responsáveis" },
    { id: "historico", label: "Histórico" },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 20,
        borderBottom: "2px solid #f1f5f9",
        paddingBottom: 0,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "8px 16px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: tab === t.id ? 700 : 400,
            fontSize: 13,
            color: tab === t.id ? "#6366f1" : "#6b7280",
            borderBottom:
              tab === t.id ? "2px solid #6366f1" : "2px solid transparent",
            marginBottom: -2,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Student Detail Modal ────────────────────────────────────────────────────

function StudentDetailModal({
  student,
  onClose,
  onSaved,
}: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const canSeeCpf = user?.role === "SECRETARY";
  const [tab, setTab] = useState<Tab>("dados");
  const [form, setForm] = useState({ ...emptyForm(), ...(student as any) });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  // health
  const [health, setHealth] = useState<Health>({});
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthSaving, setHealthSaving] = useState(false);

  // documents
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    type: "",
    name: "",
    fileUrl: "",
    delivered: false,
    notes: "",
  });
  const [docSaving, setDocSaving] = useState(false);

  // guardians
  const [guardians, setGuardians] = useState<any[]>([]);
  const [guardiansLoading, setGuardiansLoading] = useState(false);
  const [availableGuardians, setAvailableGuardians] = useState<any[]>([]);
  const [guardianModal, setGuardianModal] = useState(false);
  const [guardianForm, setGuardianForm] = useState({
    guardianId: "",
    relationType: "OUTRO",
    isFinancialResponsible: false,
    canPickUp: true,
    notes: "",
  });
  const [guardianSaving, setGuardianSaving] = useState(false);

  // history
  const [history, setHistory] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    setForm({ ...emptyForm(), ...(student as any) });
  }, [student]);

  useEffect(() => {
    if (tab === "saude" && !health.allergies && !healthLoading) loadHealth();
    if (tab === "documentos") loadDocs();
    if (tab === "responsaveis") {
      loadGuardians();
      loadAvailableGuardians();
    }
    if (tab === "historico") loadHistory();
  }, [tab]);

  function setF(patch: Partial<Student>) {
    setForm((f: any) => ({ ...f, ...patch }));
  }

  async function handleCepChange(cep: string) {
    setF({ zipCode: cep });
    if (cep.replace(/\D/g, "").length === 8) {
      setCepLoading(true);
      const data = await fetchCep(cep);
      if (data) {
        setF({
          street: data.street || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "",
        });
      }
      setCepLoading(false);
    }
  }

  async function loadHealth() {
    setHealthLoading(true);
    try {
      const h = await api.fetchJson(`/students/${student.id}/health`);
      setHealth(h ?? {});
    } catch {
    } finally {
      setHealthLoading(false);
    }
  }

  async function loadDocs() {
    setDocsLoading(true);
    try {
      const r = await api.fetchJson(`/students/${student.id}/documents`);
      setDocs(r?.data ?? []);
    } catch {
    } finally {
      setDocsLoading(false);
    }
  }

  async function loadGuardians() {
    setGuardiansLoading(true);
    try {
      const r = await api.fetchJson(`/students/${student.id}/guardians`);
      setGuardians(r?.data ?? []);
    } catch {
    } finally {
      setGuardiansLoading(false);
    }
  }

  async function loadAvailableGuardians() {
    try {
      const r = await api.fetchJson("/users?role=GUARDIAN&limit=200");
      setAvailableGuardians(r?.data ?? []);
    } catch {}
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const r = await api.fetchJson(`/students/${student.id}/history`);
      setHistory(r?.data ?? []);
    } catch {
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleSaveBasic(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      setErr("Nome é obrigatório");
      return;
    }
    if (canSeeCpf && form.cpf && !isValidCpf(form.cpf)) {
      setErr("CPF inválido");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await api.fetchJson(`/students/${student.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          socialName: form.socialName || undefined,
          ...(canSeeCpf ? { cpf: form.cpf || undefined } : {}),
          rg: form.rg || undefined,
          birthCertificate: form.birthCertificate || undefined,
          birthDate: form.birthDate || undefined,
          gender: form.gender || undefined,
          nationality: form.nationality || undefined,
          naturalidade: form.naturalidade || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          zipCode: form.zipCode || undefined,
          street: form.street || undefined,
          addressNumber: form.addressNumber || undefined,
          neighborhood: form.neighborhood || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          status: form.status,
        }),
      });
      toast("Aluno atualizado!");
      onSaved();
    } catch (e: any) {
      setErr(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveHealth(e: React.FormEvent) {
    e.preventDefault();
    setHealthSaving(true);
    try {
      await api.fetchJson(`/students/${student.id}/health`, {
        method: "PUT",
        body: JSON.stringify(health),
      });
      toast("Dados de saúde salvos!");
    } catch (e: any) {
      toast(e?.message || "Erro ao salvar saúde", "error");
    } finally {
      setHealthSaving(false);
    }
  }

  async function handleAddDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!docForm.type || !docForm.name) {
      toast("Tipo e nome são obrigatórios", "error");
      return;
    }
    setDocSaving(true);
    try {
      await api.fetchJson(`/students/${student.id}/documents`, {
        method: "POST",
        body: JSON.stringify(docForm),
      });
      toast("Documento adicionado!");
      setDocModal(false);
      setDocForm({
        type: "",
        name: "",
        fileUrl: "",
        delivered: false,
        notes: "",
      });
      loadDocs();
    } catch (e: any) {
      toast(e?.message || "Erro ao adicionar documento", "error");
    } finally {
      setDocSaving(false);
    }
  }

  async function handleToggleDelivered(doc: DocItem) {
    try {
      await api.fetchJson(`/students/${student.id}/documents/${doc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ delivered: !doc.delivered }),
      });
      loadDocs();
    } catch {
      toast("Erro ao atualizar documento", "error");
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm("Remover documento?")) return;
    try {
      await api.fetchJson(`/students/${student.id}/documents/${docId}`, {
        method: "DELETE",
      });
      toast("Documento removido!");
      loadDocs();
    } catch {
      toast("Erro ao remover", "error");
    }
  }

  async function handleLinkGuardian(e: React.FormEvent) {
    e.preventDefault();
    if (!guardianForm.guardianId) {
      toast("Selecione um responsável", "error");
      return;
    }
    setGuardianSaving(true);
    try {
      await api.fetchJson(`/students/${student.id}/guardians`, {
        method: "POST",
        body: JSON.stringify(guardianForm),
      });
      toast("Responsável vinculado!");
      setGuardianModal(false);
      setGuardianForm({
        guardianId: "",
        relationType: "OUTRO",
        isFinancialResponsible: false,
        canPickUp: true,
        notes: "",
      });
      loadGuardians();
    } catch (e: any) {
      toast(e?.message || "Erro ao vincular", "error");
    } finally {
      setGuardianSaving(false);
    }
  }

  async function handleUnlinkGuardian(guardianId: string) {
    if (!confirm("Desvincular responsável?")) return;
    try {
      await api.fetchJson(`/students/${student.id}/guardians/${guardianId}`, {
        method: "DELETE",
      });
      toast("Responsável desvinculado!");
      loadGuardians();
    } catch {
      toast("Erro ao desvincular", "error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    padding: "0 12px",
    borderRadius: 9,
    border: "1.5px solid #e2e8f0",
    fontSize: 13,
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: "#fff",
  };

  return (
    <Modal open onClose={onClose} title={`Aluno: ${student.name}`} width={740}>
      <TabBar tab={tab} onChange={setTab} />

      {/* ── DADOS BÁSICOS ─── */}
      {tab === "dados" && (
        <form onSubmit={handleSaveBasic}>
          {err && (
            <div style={{ marginBottom: 12 }}>
              <InlineAlert message={err} type="error" />
            </div>
          )}

          <SectionTitle>Dados pessoais</SectionTitle>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <FormField label="Nome completo" required>
              <Input value={form.name} onChange={(v) => setF({ name: v })} />
            </FormField>
            <FormField label="Nome social">
              <Input
                value={form.socialName}
                onChange={(v) => setF({ socialName: v })}
                placeholder="Se houver"
              />
            </FormField>
            <FormField label="Data de nascimento">
              <DateInput
                value={form.birthDate?.split("T")[0] ?? ""}
                onChange={(v) => setF({ birthDate: v })}
              />
            </FormField>
            <FormField label="Sexo">
              <Select
                value={form.gender}
                onChange={(v) => setF({ gender: v })}
                options={GENDER_OPTIONS}
                placeholder="Selecione..."
              />
            </FormField>
            {canSeeCpf && (
              <FormField label="CPF">
                <Input
                  value={formatCpf(form.cpf)}
                  onChange={(v) => setF({ cpf: cleanCpf(v) })}
                  placeholder="000.000.000-00"
                />
              </FormField>
            )}
            <FormField label="RG">
              <Input value={form.rg} onChange={(v) => setF({ rg: v })} />
            </FormField>
            <FormField label="Certidão de nascimento">
              <Input
                value={form.birthCertificate}
                onChange={(v) => setF({ birthCertificate: v })}
              />
            </FormField>
            <FormField label="Nacionalidade">
              <Input
                value={form.nationality}
                onChange={(v) => setF({ nationality: v })}
                placeholder="Ex: Brasileira"
              />
            </FormField>
            <FormField label="Naturalidade">
              <Input
                value={form.naturalidade}
                onChange={(v) => setF({ naturalidade: v })}
                placeholder="Cidade/UF de nascimento"
              />
            </FormField>
            <FormField label="Situação">
              <Select
                value={form.status}
                onChange={(v) => setF({ status: v })}
                options={STATUS_OPTIONS}
              />
            </FormField>
          </div>

          <SectionTitle>Contato</SectionTitle>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <FormField label="Telefone">
              <Input
                value={form.phone}
                onChange={(v) => setF({ phone: v })}
                placeholder="(00) 00000-0000"
              />
            </FormField>
            <FormField label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(v) => setF({ email: v })}
              />
            </FormField>
          </div>

          <SectionTitle>Endereço</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 80px",
              gap: 12,
            }}
          >
            <FormField label="CEP">
              <Input
                value={form.zipCode}
                onChange={handleCepChange}
                placeholder="00000-000"
                loading={cepLoading}
              />
            </FormField>
            <FormField label="Rua / Logradouro">
              <Input
                value={form.street}
                onChange={(v) => setF({ street: v })}
              />
            </FormField>
            <FormField label="Número">
              <Input
                value={form.addressNumber}
                onChange={(v) => setF({ addressNumber: v })}
              />
            </FormField>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 60px",
              gap: 12,
            }}
          >
            <FormField label="Bairro">
              <Input
                value={form.neighborhood}
                onChange={(v) => setF({ neighborhood: v })}
              />
            </FormField>
            <FormField label="Cidade">
              <Input value={form.city} onChange={(v) => setF({ city: v })} />
            </FormField>
            <FormField label="UF">
              <Input
                value={form.state}
                onChange={(v) => setF({ state: v.toUpperCase().slice(0, 2) })}
                placeholder="SP"
              />
            </FormField>
          </div>

          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
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
              Fechar
            </button>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar dados"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      )}

      {/* ── SAÚDE ─── */}
      {tab === "saude" && (
        <form onSubmit={handleSaveHealth}>
          {healthLoading ? (
            <p style={{ color: "#6b7280" }}>Carregando...</p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <FormField label="Tipo sanguíneo">
                  <Input
                    value={health.bloodType ?? ""}
                    onChange={(v) => setHealth((h) => ({ ...h, bloodType: v }))}
                    placeholder="Ex: A+"
                  />
                </FormField>
              </div>
              <FormField label="Alergias">
                <textarea
                  value={health.allergies ?? ""}
                  onChange={(e) =>
                    setHealth((h) => ({ ...h, allergies: e.target.value }))
                  }
                  rows={3}
                  placeholder="Descreva alergias conhecidas..."
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </FormField>
              <FormField label="Restrição alimentar">
                <textarea
                  value={health.dietaryRestrictions ?? ""}
                  onChange={(e) =>
                    setHealth((h) => ({
                      ...h,
                      dietaryRestrictions: e.target.value,
                    }))
                  }
                  rows={2}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </FormField>
              <FormField label="Necessidades especiais">
                <textarea
                  value={health.specialNeeds ?? ""}
                  onChange={(e) =>
                    setHealth((h) => ({ ...h, specialNeeds: e.target.value }))
                  }
                  rows={3}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </FormField>
              <FormField label="Uso de medicação">
                <textarea
                  value={health.medication ?? ""}
                  onChange={(e) =>
                    setHealth((h) => ({ ...h, medication: e.target.value }))
                  }
                  rows={2}
                  placeholder="Nome do medicamento, dosagem, horário..."
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </FormField>
              <FormField label="Observações gerais">
                <textarea
                  value={health.healthNotes ?? ""}
                  onChange={(e) =>
                    setHealth((h) => ({ ...h, healthNotes: e.target.value }))
                  }
                  rows={3}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </FormField>
              <ModalFooter>
                <button
                  type="button"
                  onClick={onClose}
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
                  Fechar
                </button>
                <PrimaryButton type="submit" disabled={healthSaving}>
                  {healthSaving ? "Salvando..." : "Salvar saúde"}
                </PrimaryButton>
              </ModalFooter>
            </>
          )}
        </form>
      )}

      {/* ── DOCUMENTOS ─── */}
      {tab === "documentos" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
              {docs.filter((d) => d.delivered).length} / {docs.length} entregues
            </p>
            <PrimaryButton onClick={() => setDocModal(true)}>
              + Adicionar
            </PrimaryButton>
          </div>

          {docsLoading ? (
            <p style={{ color: "#6b7280" }}>Carregando...</p>
          ) : docs.length === 0 ? (
            <p
              style={{
                color: "#9ca3af",
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              Nenhum documento cadastrado
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: doc.delivered ? "#f0fdf4" : "#fff9f9",
                    border: `1.5px solid ${doc.delivered ? "#bbf7d0" : "#fee2e2"}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={doc.delivered}
                    onChange={() => handleToggleDelivered(doc)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                      {doc.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
                      {DOC_TYPE_LABEL[doc.type] ?? doc.type}
                      {doc.notes ? ` — ${doc.notes}` : ""}
                    </p>
                  </div>
                  <StatusBadge
                    status={doc.delivered ? "active" : "inactive"}
                    label={doc.delivered ? "Entregue" : "Pendente"}
                  />
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11, color: "#6366f1" }}
                    >
                      Ver arquivo
                    </a>
                  )}
                  <IconButton
                    icon="delete"
                    title="Remover"
                    onClick={() => handleDeleteDoc(doc.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {docModal && (
            <Modal
              open
              onClose={() => setDocModal(false)}
              title="Adicionar documento"
              width={420}
            >
              <form onSubmit={handleAddDoc}>
                <FormField label="Tipo" required>
                  <Select
                    value={docForm.type}
                    onChange={(v) => setDocForm((f) => ({ ...f, type: v }))}
                    options={DOC_TYPE_OPTIONS}
                    placeholder="Selecione o tipo..."
                  />
                </FormField>
                <FormField label="Nome / Descrição" required>
                  <Input
                    value={docForm.name}
                    onChange={(v) => setDocForm((f) => ({ ...f, name: v }))}
                    placeholder="Ex: RG – João Silva"
                  />
                </FormField>
                <FormField label="URL do arquivo">
                  <Input
                    value={docForm.fileUrl}
                    onChange={(v) => setDocForm((f) => ({ ...f, fileUrl: v }))}
                    placeholder="https://..."
                  />
                </FormField>
                <FormField label="Observações">
                  <Input
                    value={docForm.notes}
                    onChange={(v) => setDocForm((f) => ({ ...f, notes: v }))}
                  />
                </FormField>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <input
                    type="checkbox"
                    id="delivered"
                    checked={docForm.delivered}
                    onChange={(e) =>
                      setDocForm((f) => ({ ...f, delivered: e.target.checked }))
                    }
                  />
                  <label
                    htmlFor="delivered"
                    style={{ fontSize: 13, cursor: "pointer" }}
                  >
                    Já foi entregue
                  </label>
                </div>
                <ModalFooter>
                  <button
                    type="button"
                    onClick={() => setDocModal(false)}
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
                  <PrimaryButton type="submit" disabled={docSaving}>
                    {docSaving ? "Salvando..." : "Adicionar"}
                  </PrimaryButton>
                </ModalFooter>
              </form>
            </Modal>
          )}

          <ModalFooter>
            <button
              onClick={onClose}
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
              Fechar
            </button>
          </ModalFooter>
        </div>
      )}

      {/* ── RESPONSÁVEIS ─── */}
      {tab === "responsaveis" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <PrimaryButton onClick={() => setGuardianModal(true)}>
              + Vincular responsável
            </PrimaryButton>
          </div>

          {guardiansLoading ? (
            <p style={{ color: "#6b7280" }}>Carregando...</p>
          ) : guardians.length === 0 ? (
            <p
              style={{
                color: "#9ca3af",
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              Nenhum responsável vinculado
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {guardians.map((g: any) => (
                <div
                  key={g.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1.5px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#e0e7ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: "#6366f1",
                      fontSize: 14,
                    }}
                  >
                    {g.guardian?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                      {g.guardian?.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                      {g.relationType} &nbsp;·&nbsp;{" "}
                      {g.guardian?.phone || g.guardian?.email || "—"}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      {g.isFinancialResponsible && (
                        <span
                          style={{
                            fontSize: 11,
                            background: "#fef3c7",
                            color: "#92400e",
                            padding: "2px 8px",
                            borderRadius: 99,
                            fontWeight: 600,
                          }}
                        >
                          Resp. financeiro
                        </span>
                      )}
                      {g.canPickUp && (
                        <span
                          style={{
                            fontSize: 11,
                            background: "#dcfce7",
                            color: "#166534",
                            padding: "2px 8px",
                            borderRadius: 99,
                            fontWeight: 600,
                          }}
                        >
                          Pode buscar
                        </span>
                      )}
                    </div>
                  </div>
                  <IconButton
                    icon="delete"
                    title="Desvincular"
                    onClick={() => handleUnlinkGuardian(g.guardianId)}
                  />
                </div>
              ))}
            </div>
          )}

          {guardianModal && (
            <Modal
              open
              onClose={() => setGuardianModal(false)}
              title="Vincular responsável"
              width={460}
            >
              <form onSubmit={handleLinkGuardian}>
                <FormField label="Responsável" required>
                  <Select
                    value={guardianForm.guardianId}
                    onChange={(v) =>
                      setGuardianForm((f) => ({ ...f, guardianId: v }))
                    }
                    options={availableGuardians
                      .filter(
                        (u) =>
                          !guardians.find((g: any) => g.guardianId === u.id),
                      )
                      .map((u: any) => ({ value: u.id, label: u.name }))}
                    placeholder="Selecione..."
                  />
                </FormField>
                <FormField label="Tipo de relação">
                  <Select
                    value={guardianForm.relationType}
                    onChange={(v) =>
                      setGuardianForm((f) => ({ ...f, relationType: v }))
                    }
                    options={[
                      { value: "PAI", label: "Pai" },
                      { value: "MAE", label: "Mãe" },
                      { value: "TUTOR_LEGAL", label: "Tutor legal" },
                      { value: "OUTRO", label: "Outro" },
                    ]}
                  />
                </FormField>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={guardianForm.isFinancialResponsible}
                      onChange={(e) =>
                        setGuardianForm((f) => ({
                          ...f,
                          isFinancialResponsible: e.target.checked,
                        }))
                      }
                    />
                    Responsável financeiro
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={guardianForm.canPickUp}
                      onChange={(e) =>
                        setGuardianForm((f) => ({
                          ...f,
                          canPickUp: e.target.checked,
                        }))
                      }
                    />
                    Pode buscar o aluno
                  </label>
                </div>
                <FormField label="Observações">
                  <Input
                    value={guardianForm.notes}
                    onChange={(v) =>
                      setGuardianForm((f) => ({ ...f, notes: v }))
                    }
                  />
                </FormField>
                <ModalFooter>
                  <button
                    type="button"
                    onClick={() => setGuardianModal(false)}
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
                  <PrimaryButton type="submit" disabled={guardianSaving}>
                    {guardianSaving ? "Vinculando..." : "Vincular"}
                  </PrimaryButton>
                </ModalFooter>
              </form>
            </Modal>
          )}

          <ModalFooter>
            <button
              onClick={onClose}
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
              Fechar
            </button>
          </ModalFooter>
        </div>
      )}

      {/* ── HISTÓRICO ─── */}
      {tab === "historico" && (
        <div>
          {historyLoading ? (
            <p style={{ color: "#6b7280" }}>Carregando...</p>
          ) : history.length === 0 ? (
            <p
              style={{
                color: "#9ca3af",
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              Nenhum histórico registrado
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {history.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "12px 0",
                    borderBottom:
                      i < history.length - 1 ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#6366f1",
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
                      {MOVEMENT_LABEL[m.type] ?? m.type}
                    </p>
                    {m.description && (
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        {m.description}
                      </p>
                    )}
                    {(m.fromValue || m.toValue) && (
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        {m.fromValue && <span>{m.fromValue}</span>}
                        {m.fromValue && m.toValue && <span> → </span>}
                        {m.toValue && <span>{m.toValue}</span>}
                      </p>
                    )}
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 11,
                        color: "#9ca3af",
                      }}
                    >
                      {new Date(m.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {m.createdBy && ` · ${m.createdBy.name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ModalFooter>
            <button
              onClick={onClose}
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
              Fechar
            </button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}

// ─── Create Student Modal ─────────────────────────────────────────────────────

function CreateStudentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const canSeeCpf = user?.role === "SECRETARY";
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  function setF(patch: any) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function handleCepChange(cep: string) {
    setF({ zipCode: cep });
    if (cep.replace(/\D/g, "").length === 8) {
      setCepLoading(true);
      const data = await fetchCep(cep);
      if (data) {
        setF({
          street: data.street || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "",
        });
      }
      setCepLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      setErr("Nome é obrigatório");
      return;
    }
    // Validar CPF se fornecido e usuário tem permissão
    if (canSeeCpf && form.cpf && !isValidCpf(form.cpf)) {
      setErr("CPF inválido");
      return;
    }
    setErr("");
    setSaving(true);
    try {
      const res = await api.fetchJson("/students", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          socialName: form.socialName || undefined,
          ...(canSeeCpf ? { cpf: form.cpf || undefined } : {}),
          rg: form.rg || undefined,
          birthCertificate: form.birthCertificate || undefined,
          birthDate: form.birthDate || undefined,
          gender: form.gender || undefined,
          nationality: form.nationality || undefined,
          naturalidade: form.naturalidade || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          zipCode: form.zipCode || undefined,
          street: form.street || undefined,
          addressNumber: form.addressNumber || undefined,
          neighborhood: form.neighborhood || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          status: form.status || "ATIVO",
        }),
      });
      setCreatedPassword(res?.temporaryPassword ?? "");
      setDone(true);
      onCreated();
    } catch (e: any) {
      setErr(e?.message || "Erro ao criar aluno");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Modal open onClose={onClose} title="Aluno cadastrado!" width={420}>
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
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 15 }}>
            Aluno cadastrado com sucesso!
          </p>
          {createdPassword && (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>
                Senha temporária gerada:
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
                    setCopied(true);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1.5px solid #e2e8f0",
                    background: copied ? "#dcfce7" : "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </>
          )}
        </div>
        <ModalFooter>
          <PrimaryButton onClick={onClose}>Fechar</PrimaryButton>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Novo aluno" width={700}>
      <form onSubmit={handleCreate}>
        {err && (
          <div style={{ marginBottom: 12 }}>
            <InlineAlert message={err} type="error" />
          </div>
        )}

        <SectionTitle>Dados pessoais</SectionTitle>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormField label="Nome completo" required>
            <Input
              value={form.name}
              onChange={(v) => setF({ name: v })}
              placeholder="Nome completo do aluno"
            />
          </FormField>
          <FormField label="Nome social">
            <Input
              value={form.socialName}
              onChange={(v) => setF({ socialName: v })}
              placeholder="Se houver"
            />
          </FormField>
          <FormField label="Data de nascimento">
            <DateInput
              value={form.birthDate}
              onChange={(v) => setF({ birthDate: v })}
            />
          </FormField>
          <FormField label="Sexo">
            <Select
              value={form.gender}
              onChange={(v) => setF({ gender: v })}
              options={GENDER_OPTIONS}
              placeholder="Selecione..."
            />
          </FormField>
          {canSeeCpf && (
            <FormField label="CPF">
              <Input
                value={formatCpf(form.cpf)}
                onChange={(v) => setF({ cpf: cleanCpf(v) })}
                placeholder="000.000.000-00"
              />
            </FormField>
          )}
          <FormField label="RG">
            <Input value={form.rg} onChange={(v) => setF({ rg: v })} />
          </FormField>
          <FormField label="Certidão de nascimento">
            <Input
              value={form.birthCertificate}
              onChange={(v) => setF({ birthCertificate: v })}
            />
          </FormField>
          <FormField label="Nacionalidade">
            <Input
              value={form.nationality}
              onChange={(v) => setF({ nationality: v })}
              placeholder="Brasileira"
            />
          </FormField>
          <div style={{ gridColumn: "1 / -1" }}>
            <FormField label="Naturalidade">
              <Input
                value={form.naturalidade}
                onChange={(v) => setF({ naturalidade: v })}
                placeholder="Cidade/UF de nascimento"
              />
            </FormField>
          </div>
        </div>

        <SectionTitle>Contato</SectionTitle>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormField label="Telefone">
            <Input
              value={form.phone}
              onChange={(v) => setF({ phone: v })}
              placeholder="(00) 00000-0000"
            />
          </FormField>
          <FormField label="E-mail (opcional)">
            <Input
              type="email"
              value={form.email}
              onChange={(v) => setF({ email: v })}
              placeholder="Opcional"
            />
          </FormField>
        </div>

        <SectionTitle>Endereço</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 80px",
            gap: 12,
          }}
        >
          <FormField label="CEP">
            <Input
              value={form.zipCode}
              onChange={(v) => setF({ zipCode: v })}
              placeholder="00000-000"
            />
          </FormField>
          <FormField label="Rua">
            <Input value={form.street} onChange={(v) => setF({ street: v })} />
          </FormField>
          <FormField label="Número">
            <Input
              value={form.addressNumber}
              onChange={(v) => setF({ addressNumber: v })}
            />
          </FormField>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 60px",
            gap: 12,
          }}
        >
          <FormField label="Bairro">
            <Input
              value={form.neighborhood}
              onChange={(v) => setF({ neighborhood: v })}
            />
          </FormField>
          <FormField label="Cidade">
            <Input value={form.city} onChange={(v) => setF({ city: v })} />
          </FormField>
          <FormField label="UF">
            <Input
              value={form.state}
              onChange={(v) => setF({ state: v.toUpperCase().slice(0, 2) })}
              placeholder="SP"
            />
          </FormField>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
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
            {saving ? "Cadastrando..." : "Cadastrar aluno"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Students() {
  const [items, setItems] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<"create" | "detail" | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);

  const load = useCallback(
    async (p = 1, s = search, st = statusFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
        });
        if (s) params.set("name", s);
        if (st) params.set("status", st);
        const res = await api.fetchJson(`/students?${params}`);
        setItems(res?.data ?? []);
        setTotal(res?.meta?.total ?? 0);
        setPage(p);
      } catch (e: any) {
        toast(e?.message || "Erro ao carregar alunos", "error");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter],
  );

  useEffect(() => {
    load(1);
  }, [statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      load(1, searchInput, statusFilter);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { user } = useAuth();
  const canSeeCpf = user?.role === "SECRETARY";

  const columns = [
    {
      key: "name",
      label: "Aluno",
      render: (row: Student) => (
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
            {row.name}
            {row.socialName ? (
              <span style={{ color: "#6b7280", fontWeight: 400 }}>
                {" "}
                ({row.socialName})
              </span>
            ) : null}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
            {canSeeCpf && row.maskedCpf ? (
              <span style={{ fontFamily: "monospace" }}>
                {row.maskedCpf} ·{" "}
              </span>
            ) : null}
            {row.phone ? row.phone : "—"}
          </p>
        </div>
      ),
    },
    {
      key: "enrollment",
      label: "Turma atual",
      render: (row: Student) => {
        const enr = row.enrollments?.[0];
        if (!enr)
          return <span style={{ color: "#9ca3af" }}>Sem matrícula</span>;
        return (
          <div>
            <p style={{ margin: 0, fontSize: 13 }}>
              {enr.classroom?.name ?? "—"}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
              {enr.enrollmentNumber} · {enr.academicYear?.year}
            </p>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Situação",
      render: (row: Student) => (
        <StatusBadge
          status={row.status === "ATIVO" ? "active" : "inactive"}
          label={STATUS_LABEL[row.status] ?? row.status}
        />
      ),
    },
    {
      key: "guardians",
      label: "Responsáveis",
      render: (row: Student) => (
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          {row.guardians?.length ?? 0} vínculo(s)
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row: Student) => (
        <IconButton
          icon="edit"
          title="Ver / Editar"
          onClick={() => {
            setSelected(row);
            setModal("detail");
          }}
        />
      ),
    },
  ];

  return (
    <PageShell
      title="Alunos"
      description="Cadastro completo de alunos, dados pessoais, saúde e documentação."
      action={
        <PrimaryButton onClick={() => setModal("create")}>
          + Novo aluno
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
          }}
        >
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => load(1, searchInput, statusFilter)}
            placeholder="Buscar por nome..."
          />
          <SelectFilter
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              load(1, searchInput, v);
            }}
            options={[
              { value: "", label: "Todas as situações" },
              ...STATUS_OPTIONS,
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage="Nenhum aluno encontrado"
        />

        <Pagination
          page={page}
          total={total}
          limit={LIMIT}
          onPage={(p) => load(p, searchInput, statusFilter)}
        />
      </Card>

      {modal === "create" && (
        <CreateStudentModal
          onClose={() => setModal(null)}
          onCreated={() => {
            load(1);
            setModal(null);
          }}
        />
      )}

      {modal === "detail" && selected && (
        <StudentDetailModal
          student={selected}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          onSaved={() => load(page, search, statusFilter)}
        />
      )}
    </PageShell>
  );
}
