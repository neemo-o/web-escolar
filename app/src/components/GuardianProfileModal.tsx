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

const MARITAL_OPTIONS = [
  { value: "Solteiro(a)", label: "Solteiro(a)" },
  { value: "Casado(a)", label: "Casado(a)" },
  { value: "Divorciado(a)", label: "Divorciado(a)" },
  { value: "Viúvo(a)", label: "Viúvo(a)" },
  { value: "União estável", label: "União estável" },
  { value: "Outro", label: "Outro" },
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

export default function GuardianProfileModal({
  userId,
  userName,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    rg: "",
    birthDate: "",
    maritalStatus: "",
    profession: "",
    phoneSecondary: "",
    zipCode: "",
    street: "",
    addressNumber: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  function setF(patch: any) {
    setForm((f) => ({ ...f, ...patch }));
  }

  useEffect(() => {
    api
      .fetchJson(`/users/${userId}/guardian-profile`)
      .then((p) => {
        if (p && p.id) {
          setForm({
            rg: p.rg ?? "",
            birthDate: p.birthDate ? p.birthDate.split("T")[0] : "",
            maritalStatus: p.maritalStatus ?? "",
            profession: p.profession ?? "",
            phoneSecondary: p.phoneSecondary ?? "",
            zipCode: p.zipCode ?? "",
            street: p.street ?? "",
            addressNumber: p.addressNumber ?? "",
            neighborhood: p.neighborhood ?? "",
            city: p.city ?? "",
            state: p.state ?? "",
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
      await api.fetchJson(`/users/${userId}/guardian-profile`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          birthDate: form.birthDate || undefined,
          maritalStatus: form.maritalStatus || undefined,
        }),
      });
      toast("Dados do responsável salvos!");
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
      title={`Dados do responsável — ${userName}`}
      width={640}
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
            <FormField label="Estado civil">
              <Select
                value={form.maritalStatus}
                onChange={(v) => setF({ maritalStatus: v })}
                options={MARITAL_OPTIONS}
                placeholder="Selecione..."
              />
            </FormField>
            <FormField label="Profissão">
              <Input
                value={form.profession}
                onChange={(v) => setF({ profession: v })}
              />
            </FormField>
            <FormField label="Telefone secundário">
              <Input
                value={form.phoneSecondary}
                onChange={(v) => setF({ phoneSecondary: v })}
                placeholder="(00) 00000-0000"
              />
            </FormField>
          </div>

          <SectionTitle>Endereço (se diferente do aluno)</SectionTitle>
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
              {saving ? "Salvando..." : "Salvar dados"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
