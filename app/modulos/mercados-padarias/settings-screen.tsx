"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import {
  Check,
  Home,
  Pencil,
  Plus,
  QrCode,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import {
  DEFAULT_OPERATORS,
  DEFAULT_STORE_SETTINGS,
  formatOperatorRoleLabel,
  getPresetPermissionsForRole,
  OPERATOR_PERMISSION_ITEMS,
  PIX_KEY_TYPES,
  type OperatorPermissions,
  type OperatorRole,
  type PixKeyType,
  type StoreGeneralSettings,
  type SystemOperator,
} from "@/lib/market-settings";

export interface SettingsScreenProps {
  initialSettings?: StoreGeneralSettings;
  settings?: StoreGeneralSettings;
  initialOperators?: SystemOperator[];
  operators?: SystemOperator[];
  onSaveSettings?: (settings: StoreGeneralSettings) => void;
  onSaveOperator?: (operator: SystemOperator, isEdit: boolean) => void;
  onDeleteOperator?: (operatorId: string) => void;
}

type SettingsTab = "general" | "operators";

interface OperatorFormDraft {
  id?: string;
  name: string;
  username: string;
  password: string;
  role: OperatorRole;
  permissions: OperatorPermissions;
}

function createEmptyOperatorDraft(): OperatorFormDraft {
  return {
    name: "",
    username: "",
    password: "",
    role: "cashier",
    permissions: getPresetPermissionsForRole("cashier"),
  };
}

function operatorToDraft(operator: SystemOperator): OperatorFormDraft {
  return {
    id: operator.id,
    name: operator.name,
    username: operator.username,
    password: operator.password,
    role: operator.role,
    permissions: { ...operator.permissions },
  };
}

export default function SettingsScreen({
  initialSettings = DEFAULT_STORE_SETTINGS,
  settings: controlledSettings,
  initialOperators = DEFAULT_OPERATORS,
  operators: controlledOperators,
  onSaveSettings,
  onSaveOperator,
  onDeleteOperator,
}: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [internalSettings, setInternalSettings] =
    useState<StoreGeneralSettings>(initialSettings);
  const storeSettings = controlledSettings ?? internalSettings;

  const [formSettings, setFormSettings] =
    useState<StoreGeneralSettings>(storeSettings);
  const [savedNotice, setSavedNotice] = useState(false);

  const [internalOperators, setInternalOperators] =
    useState<SystemOperator[]>(initialOperators);
  const operators = controlledOperators ?? internalOperators;

  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [operatorDraft, setOperatorDraft] = useState<OperatorFormDraft>(
    createEmptyOperatorDraft,
  );
  const [operatorError, setOperatorError] = useState<string | null>(null);

  const operatorModalTitleId = useId();

  useEffect(() => {
    setFormSettings(storeSettings);
  }, [storeSettings]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOperatorModalOpen) {
        setIsOperatorModalOpen(false);
        setOperatorError(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOperatorModalOpen]);

  const handleSaveStoreForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!controlledSettings) {
      setInternalSettings(formSettings);
    }
    onSaveSettings?.(formSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleOpenNewOperator = () => {
    setOperatorDraft(createEmptyOperatorDraft());
    setOperatorError(null);
    setIsOperatorModalOpen(true);
  };

  const handleOpenEditOperator = (operator: SystemOperator) => {
    setOperatorDraft(operatorToDraft(operator));
    setOperatorError(null);
    setIsOperatorModalOpen(true);
  };

  const handleSelectRole = (role: OperatorRole) => {
    setOperatorDraft((curr) => ({
      ...curr,
      role,
      permissions: getPresetPermissionsForRole(role),
    }));
  };

  const handleTogglePermission = (key: keyof OperatorPermissions) => {
    setOperatorDraft((curr) => ({
      ...curr,
      permissions: {
        ...curr.permissions,
        [key]: !curr.permissions[key],
      },
    }));
  };

  const handleSaveOperatorForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = operatorDraft.name.trim();
    const trimmedUsername = operatorDraft.username.trim();
    if (!trimmedName || !trimmedUsername) {
      setOperatorError("Informe o nome completo e o login do operador.");
      return;
    }

    const isEdit = Boolean(operatorDraft.id);
    const savedOperator: SystemOperator = {
      id: operatorDraft.id ?? `op-${Date.now()}`,
      name: trimmedName,
      username: trimmedUsername,
      password: operatorDraft.password.trim() || "123",
      role: operatorDraft.role,
      permissions: { ...operatorDraft.permissions },
    };

    if (!controlledOperators) {
      setInternalOperators((current) =>
        isEdit
          ? current.map((item) =>
              item.id === savedOperator.id ? savedOperator : item,
            )
          : [...current, savedOperator],
      );
    }

    onSaveOperator?.(savedOperator, isEdit);
    setIsOperatorModalOpen(false);
    setOperatorError(null);
  };

  const handleDeleteOperator = (operatorId: string) => {
    if (!controlledOperators) {
      setInternalOperators((current) =>
        current.filter((item) => item.id !== operatorId),
      );
    }
    onDeleteOperator?.(operatorId);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1250px] flex-col gap-5">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-black">
          Configurações do Sistema
        </h1>
        <p className="text-[13px] text-black/60">
          Gerencie parâmetros do estabelecimento, terminal físico PDV e a equipe de operadores.
        </p>
      </header>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-black/10 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`inline-flex h-[42px] items-center gap-2 rounded-[8px] px-4 text-[14px] font-semibold transition-colors ${
            activeTab === "general"
              ? "bg-[#203f9f] text-white shadow-sm"
              : "bg-[#f0f2f5] text-black/75 hover:bg-black/10"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Gerais do Estabelecimento</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("operators")}
          className={`inline-flex h-[42px] items-center gap-2 rounded-[8px] px-4 text-[14px] font-semibold transition-colors ${
            activeTab === "operators"
              ? "bg-[#203f9f] text-white shadow-sm"
              : "bg-[#f0f2f5] text-black/75 hover:bg-black/10"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Operadores e Permissões</span>
        </button>
      </div>

      {/* Tab 1: Gerais do Estabelecimento */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveStoreForm} className="space-y-4">
          {/* Card 1: Identificação do Estabelecimento */}
          <section className="rounded-[8px] border border-black/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="mb-4 flex items-center gap-2.5">
              <Home className="h-5 w-5 text-[#203f9f]" />
              <h2 className="text-[18px] font-bold text-black">
                Identificação do Estabelecimento
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black/70">
                  Razão Social *
                </label>
                <input
                  type="text"
                  aria-label="Razão Social"
                  value={formSettings.razaoSocial}
                  onChange={(e) =>
                    setFormSettings((curr) => ({
                      ...curr,
                      razaoSocial: e.target.value,
                    }))
                  }
                  className="h-[42px] w-full rounded-[8px] border border-black/20 bg-white px-3.5 text-[14px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black/70">
                  Nome Fantasia (Aparece no Cupom)*
                </label>
                <input
                  type="text"
                  aria-label="Nome Fantasia"
                  value={formSettings.nomeFantasia}
                  onChange={(e) =>
                    setFormSettings((curr) => ({
                      ...curr,
                      nomeFantasia: e.target.value,
                    }))
                  }
                  className="h-[42px] w-full rounded-[8px] border border-black/20 bg-white px-3.5 text-[14px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black/70">
                  CNPJ *
                </label>
                <input
                  type="text"
                  aria-label="CNPJ do Estabelecimento"
                  value={formSettings.cnpj}
                  onChange={(e) =>
                    setFormSettings((curr) => ({
                      ...curr,
                      cnpj: e.target.value,
                    }))
                  }
                  className="h-[42px] w-full rounded-[8px] border border-black/20 bg-white px-3.5 text-[14px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black/70">
                  Inscrição Estadual (IE)
                </label>
                <input
                  type="text"
                  aria-label="Inscrição Estadual"
                  value={formSettings.ie}
                  onChange={(e) =>
                    setFormSettings((curr) => ({
                      ...curr,
                      ie: e.target.value,
                    }))
                  }
                  className="h-[42px] w-full rounded-[8px] border border-black/20 bg-white px-3.5 text-[14px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black/70">
                  Contato
                </label>
                <input
                  type="text"
                  aria-label="Contato do Estabelecimento"
                  value={formSettings.phone}
                  onChange={(e) =>
                    setFormSettings((curr) => ({
                      ...curr,
                      phone: e.target.value,
                    }))
                  }
                  className="h-[42px] w-full rounded-[8px] border border-black/20 bg-white px-3.5 text-[14px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-[13px] font-semibold text-black/70">
                Endereço Completo
              </label>
              <input
                type="text"
                aria-label="Endereço Completo"
                value={formSettings.address}
                onChange={(e) =>
                  setFormSettings((curr) => ({
                    ...curr,
                    address: e.target.value,
                  }))
                }
                className="h-[42px] w-full rounded-[8px] border border-black/20 bg-white px-3.5 text-[14px] text-black focus:border-[#203f9f] focus:outline-none"
              />
            </div>
          </section>

          {/* Card 2: Chave Pix do Estabelecimento */}
          <section className="rounded-[8px] border border-black/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="mb-4 flex items-center gap-2.5">
              <QrCode className="h-5 w-5 text-[#008f58]" />
              <h2 className="text-[18px] font-bold text-black">
                Chave Pix do Estabelecimento (Para PDV e Cobrança da Caderneta)
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <label className="mb-1 block text-[13px] font-semibold text-black/70">
                  Tipo da Chave
                </label>
                <select
                  aria-label="Tipo da Chave"
                  value={formSettings.pixKeyType}
                  onChange={(e) =>
                    setFormSettings((curr) => ({
                      ...curr,
                      pixKeyType: e.target.value as PixKeyType,
                    }))
                  }
                  className="h-[42px] w-full rounded-[8px] border border-black/20 bg-white px-3.5 text-[14px] text-black focus:border-[#203f9f] focus:outline-none"
                >
                  {PIX_KEY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-8">
                <label className="mb-1 block text-[13px] font-semibold text-black/70">
                  Chave Pix Cadastrada *
                </label>
                <input
                  type="text"
                  aria-label="Chave Pix Cadastrada"
                  value={formSettings.pixKey}
                  onChange={(e) =>
                    setFormSettings((curr) => ({
                      ...curr,
                      pixKey: e.target.value,
                    }))
                  }
                  className="h-[42px] w-full rounded-[8px] border border-black/20 bg-white px-3.5 text-[14px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Card 3: Mensagem de Rodapé do Cupom */}
          <section className="rounded-[8px] border border-black/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h2 className="mb-2 text-[16px] font-bold text-black">
              Mensagem de Rodapé do Cupom
            </h2>
            <input
              type="text"
              aria-label="Mensagem de Rodapé do Cupom"
              value={formSettings.receiptFooter}
              onChange={(e) =>
                setFormSettings((curr) => ({
                  ...curr,
                  receiptFooter: e.target.value,
                }))
              }
              className="h-[42px] w-full rounded-[8px] border border-black/20 bg-white px-3.5 text-[14px] text-black focus:border-[#203f9f] focus:outline-none"
            />
          </section>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#008f58] px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
            >
              <Save className="h-4 w-4" />
              <span>Salvar dados da loja</span>
            </button>

            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#008f58]">
                <Check className="h-4 w-4" />
                Dados da loja salvos com sucesso!
              </span>
            )}
          </div>
        </form>
      )}

      {/* Tab 2: Operadores e Permissões */}
      {activeTab === "operators" && (
        <div className="space-y-4">
          {/* Terminal & Operator Header Card */}
          <section className="flex flex-col justify-between gap-4 rounded-[8px] border border-black/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] md:flex-row md:items-center">
            <div className="space-y-3">
              <div>
                <h2 className="text-[18px] font-bold text-black">
                  Configurações de Operadores e Níveis de Permissão
                </h2>
                <p className="text-[13px] text-black/60">
                  Defina acessos para caixas, gerentes e administradores do estabelecimento.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="text-[13px] font-semibold text-black/75">
                  Número / Identificação do Terminal *:
                </label>
                <input
                  type="text"
                  aria-label="Número / Identificação do Terminal"
                  value={formSettings.terminalName}
                  onChange={(e) => {
                    const next = {
                      ...formSettings,
                      terminalName: e.target.value,
                    };
                    setFormSettings(next);
                    if (!controlledSettings) {
                      setInternalSettings(next);
                    }
                    onSaveSettings?.(next);
                  }}
                  className="h-[38px] w-[180px] rounded-[8px] border border-black/20 bg-white px-3 text-[13px] font-medium text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenNewOperator}
              className="inline-flex h-[42px] shrink-0 items-center gap-2 rounded-[8px] bg-[#203f9f] px-4 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#193382]"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Operador</span>
            </button>
          </section>

          {/* Operators Grid */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {operators.map((op) => {
              const activeBadges = OPERATOR_PERMISSION_ITEMS.filter(
                (item) => op.permissions[item.key],
              );
              const allActive =
                activeBadges.length === OPERATOR_PERMISSION_ITEMS.length;

              return (
                <article
                  key={op.id}
                  className="flex flex-col justify-between rounded-[8px] border border-black/10 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[16px] font-bold text-black">
                            {op.name}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              op.role === "admin"
                                ? "bg-[#6155f5]/15 text-[#6155f5]"
                                : op.role === "manager"
                                  ? "bg-[#203f9f]/15 text-[#203f9f]"
                                  : "bg-[#008f58]/15 text-[#008f58]"
                            }`}
                          >
                            {formatOperatorRoleLabel(op.role)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-black/55">
                          Login: @{op.username}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditOperator(op)}
                          aria-label={`Editar operador ${op.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-black/60 transition-colors hover:bg-black/5 hover:text-[#203f9f]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOperator(op.id)}
                          aria-label={`Excluir operador ${op.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-black/60 transition-colors hover:bg-[#ff383c]/10 hover:text-[#ff383c]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-black/10 pt-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/50">
                        Permissões de Acesso
                      </p>
                      {allActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#008f58]/15 px-3 py-1 text-[12px] font-semibold text-[#008f58]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Todas as permissões ativas
                        </span>
                      ) : activeBadges.length === 0 ? (
                        <span className="text-[12px] text-black/45">
                          Apenas vendas básicas no PDV
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {activeBadges.map((badge) => (
                            <span
                              key={badge.key}
                              className="rounded-md bg-[#f0f2f5] px-2.5 py-1 text-[11px] font-semibold text-black/75"
                            >
                              {badge.badgeLabel}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      )}

      {/* Modal: Cadastrar / Editar Operador */}
      {isOperatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={operatorModalTitleId}
            className="w-full max-w-[463px] overflow-hidden rounded-[15px] bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-5 w-5 text-[#203f9f]" />
                <h2
                  id={operatorModalTitleId}
                  className="text-[19px] font-bold text-black"
                >
                  {operatorDraft.id ? "Editar Operador" : "Cadastrar Operador"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOperatorModalOpen(false);
                  setOperatorError(null);
                }}
                aria-label="Fechar modal de operador"
                className="rounded-full p-1 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleSaveOperatorForm}
              className="space-y-3.5 px-5 py-4"
            >
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-black/75">
                  Nome Completo / Apelido *
                </label>
                <input
                  type="text"
                  aria-label="Nome Completo / Apelido"
                  value={operatorDraft.name}
                  onChange={(e) =>
                    setOperatorDraft((curr) => ({
                      ...curr,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Ex: Carlos Mendes"
                  className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-black/75">
                    Nome de Usuário / Login *
                  </label>
                  <input
                    type="text"
                    aria-label="Nome de Usuário / Login"
                    value={operatorDraft.username}
                    onChange={(e) =>
                      setOperatorDraft((curr) => ({
                        ...curr,
                        username: e.target.value,
                      }))
                    }
                    placeholder="carlos.caixa"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-black/75">
                    Senha *
                  </label>
                  <input
                    type="password"
                    aria-label="Senha"
                    value={operatorDraft.password}
                    onChange={(e) =>
                      setOperatorDraft((curr) => ({
                        ...curr,
                        password: e.target.value,
                      }))
                    }
                    placeholder="****"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Role Selector Cards */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {(
                  [
                    { id: "cashier", label: "Operador de caixa" },
                    { id: "manager", label: "Gerente" },
                    { id: "admin", label: "Administrador" },
                  ] as const
                ).map((roleOption) => {
                  const selected = operatorDraft.role === roleOption.id;
                  return (
                    <button
                      key={roleOption.id}
                      type="button"
                      onClick={() => handleSelectRole(roleOption.id)}
                      className={`flex h-[58px] flex-col items-center justify-center rounded-[8px] border px-2 text-center text-[12px] font-semibold transition-colors ${
                        selected
                          ? "border-[#203f9f] bg-[#203f9f]/10 text-[#203f9f]"
                          : "border-black/20 bg-white text-black/70 hover:bg-black/5"
                      }`}
                    >
                      <span>{roleOption.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Granular Permissions Checklist */}
              <div className="pt-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-black/75">
                    Permissões Específicas
                  </span>
                  <span className="text-[11px] text-black/45">
                    Personalize individualmente
                  </span>
                </div>

                <div className="space-y-2">
                  {OPERATOR_PERMISSION_ITEMS.map((item) => {
                    const checked = operatorDraft.permissions[item.key];
                    return (
                      <label
                        key={item.key}
                        className="flex h-[34px] cursor-pointer items-center gap-2.5 rounded-[8px] border border-black/15 bg-white px-3 text-[12px] font-medium text-black/85 hover:bg-black/[0.02]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleTogglePermission(item.key)}
                          className="h-4 w-4 rounded border-black/30 text-[#203f9f] focus:ring-[#203f9f]"
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {operatorError && (
                <p className="text-[12px] font-medium text-[#ff383c]">
                  {operatorError}
                </p>
              )}

              <footer className="flex items-center justify-end gap-4 border-t border-black/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOperatorModalOpen(false);
                    setOperatorError(null);
                  }}
                  className="text-[14px] font-semibold text-black/60 transition-colors hover:text-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[36px] rounded-[8px] bg-[#008f58] px-4 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
                >
                  Salvar Operador
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
