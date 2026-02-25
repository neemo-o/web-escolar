import React, { useEffect, useState } from "react";
import api from "../utils/api";
import {
  Modal,
  FormField,
  Input,
  Select,
  ModalFooter,
  PrimaryButton,
  InlineAlert,
  toast,
} from "./ui";

const GENDER_OPTIONS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMININO", label: "Feminino" },
  { value: "OUTRO", label: "Outro" },
  { value: "NAO_INFORMADO", label: "Não informado" },
];

const STATUS_OPTIONS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "AFASTADO", label: "Afastado" },
  { value: "DESLIGADO", label: "Desligado" },
];

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

type Props = { userId: string; userName: string; onClose: () => void };

export default function TeacherProfileModal({
  userId,
  userName,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    internalCode: "",
    rg: "",
    birthDate: "",
    gender: "",
    nationality: "",
    formation: "",
    specialization: "",
    workloadHours: "",
    admissionDate: "",
    status: "ATIVO",
    zipCode: "",
    street: "",
    addressNumber: "",
    neighborhood: "",
    city: "",
    state: "",
    canGrade: true,
    canAttendance: true,
    canEditContent: true,
    canViewReports: true,
  });

  function setF(patch: any) {
    setForm((f) => ({ ...f, ...patch }));
  }

  useEffect(() => {
    api
      .fetchJson(`/users/${userId}/teacher-profile`)
      .then((p) => {
        if (p && p.id) {
          setForm({
            internalCode: p.internalCode ?? "",
            rg: p.rg ?? "",
            birthDate: p.birthDate ? p.birthDate.split("T")[0] : "",
            gender: p.gender ?? "",
            nationality: p.nationality ?? "",
            formation: p.formation ?? "",
            specialization: p.specialization ?? "",
            workloadHours: p.workloadHours ? String(p.workloadHours) : "",
            admissionDate: p.admissionDate ? p.admissionDate.split("T")[0] : "",
            status: p.status ?? "ATIVO",
            zipCode: p.zipCode ?? "",
            street: p.street ?? "",
            addressNumber: p.addressNumber ?? "",
            neighborhood: p.neighborhood ?? "",
            city: p.city ?? "",
            state: p.state ?? "",
            canGrade: p.canGrade ?? true,
            canAttendance: p.canAttendance ?? true,
            canEditContent: p.canEditContent ?? true,
            canViewReports: p.canViewReports ?? true,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      await api.fetchJson(`/users/${userId}/teacher-profile`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          workloadHours: form.workloadHours
            ? parseInt(form.workloadHours)
            : undefined,
          birthDate: form.birthDate || undefined,
          admissionDate: form.admissionDate || undefined,
          gender: form.gender || undefined,
          status: form.status,
        }),
      });
      toast("Perfil do professor salvo!");
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Perfil profissional — ${userName}`}
      width={700}
    >
      {loading ? (
        <p style={{ color: "#6b7280" }}>Carregando...</p>
      ) : (
        <form onSubmit={handleSave}>
          {err && (
            <div style={{ marginBottom: 12 }}>
              <InlineAlert message={err} type="error" />
            </div>
          )}

          <SectionTitle>Dados pessoais</SectionTitle>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <FormField label="RG">
              <Input value={form.rg} onChange={(v) => setF({ rg: v })} />
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
            <FormField label="Nacionalidade">
              <Input
                value={form.nationality}
                onChange={(v) => setF({ nationality: v })}
                placeholder="Brasileira"
              />
            </FormField>
          </div>

          <SectionTitle>Dados profissionais</SectionTitle>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <FormField label="Código interno">
              <Input
                value={form.internalCode}
                onChange={(v) => setF({ internalCode: v })}
                placeholder="Ex: PROF-001"
              />
            </FormField>
            <FormField label="Situação">
              <Select
                value={form.status}
                onChange={(v) => setF({ status: v })}
                options={STATUS_OPTIONS}
              />
            </FormField>
            <FormField label="Formação">
              <Input
                value={form.formation}
                onChange={(v) => setF({ formation: v })}
                placeholder="Licenciatura em Matemática..."
              />
            </FormField>
            <FormField label="Especialização">
              <Input
                value={form.specialization}
                onChange={(v) => setF({ specialization: v })}
              />
            </FormField>
            <FormField label="Carga horária (h/semana)">
              <Input
                type="number"
                value={form.workloadHours}
                onChange={(v) => setF({ workloadHours: v })}
                placeholder="20"
              />
            </FormField>
            <FormField label="Data de admissão">
              <DateInput
                value={form.admissionDate}
                onChange={(v) => setF({ admissionDate: v })}
              />
            </FormField>
          </div>

          <SectionTitle>Permissões</SectionTitle>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              { key: "canGrade", label: "Pode lançar notas" },
              { key: "canAttendance", label: "Pode lançar frequência" },
              { key: "canEditContent", label: "Pode editar conteúdo" },
              { key: "canViewReports", label: "Pode ver relatórios" },
            ].map((p) => (
              <label
                key={p.key}
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
                  checked={(form as any)[p.key]}
                  onChange={(e) => setF({ [p.key]: e.target.checked })}
                />
                {p.label}
              </label>
            ))}
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
              Cancelar
            </button>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar perfil"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
