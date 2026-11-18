"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import {
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  HomeIcon,
  LockClosedIcon,
  PencilSquareIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon,
  UserPlusIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  DEFAULT_OPERATORS,
  DEFAULT_STORE_SETTINGS,
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
    role: "admin",
    permissions: getPresetPermissionsForRole("admin"),
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getPermissionIcon(key: keyof OperatorPermissions) {
  switch (key) {
    case "authorizeBookletSale":
      return BookOpenIcon;
    case "grantPosDiscounts":
      return CurrencyDollarIcon;
    case "cancelItemsAndSales":
      return XCircleIcon;
    case "manageStockAndPrices":
      return CubeIcon;
    case "financialReportsAndProfits":
      return ChartBarIcon;
    case "manageTeamAndPermissions":
      return UserGroupIcon;
  }
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
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4">
      {/* Header & Underline Tabs Card (Screenshots 110040.png & 110054.png) */}
      <div className="-mx-5 -mt-5 border-b border-slate-200 bg-white px-6 pt-5 lg:-mx-6 lg:-mt-6">
        <header className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-bold tracking-tight text-[#203f9f]">
            Configurações do Sistema
          </h1>
          <p className="text-[11px] text-slate-400">
            Gerencie parâmetros do estabelecimento, terminal físico PDV e a
            equipe de operadores.
          </p>
        </header>

        <div className="mt-4 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`inline-flex items-center gap-2 border-b-2 pb-2.5 text-[12px] font-bold transition-colors ${
              activeTab === "general"
                ? "border-[#203f9f] text-[#203f9f]"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Cog6ToothIcon
              className={`h-4 w-4 ${
                activeTab === "general" ? "text-[#ff6b00]" : "text-slate-500"
              }`}
            />
            <span>Gerais do Estabelecimento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("operators")}
            className={`inline-flex items-center gap-2 border-b-2 pb-2.5 text-[12px] font-bold transition-colors ${
              activeTab === "operators"
                ? "border-[#203f9f] text-[#203f9f]"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlusIcon
              className={`h-4 w-4 ${
                activeTab === "operators" ? "text-[#ff6b00]" : "text-slate-500"
              }`}
            />
            <span>Operadores e Permissões</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Gerais do Estabelecimento (Screenshot 110040.png) */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveStoreForm} className="space-y-4 pt-1">
          {/* Card 1: Identificação do Estabelecimento */}
          <section className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center gap-2">
              <HomeIcon className="h-4 w-4 text-[#ff6b00]" />
              <h2 className="text-[13px] font-bold text-[#203f9f]">
                Identificação do Estabelecimento
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                  className="h-[36px] w-full rounded-[6px] border border-blue-200/80 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                  className="h-[36px] w-full rounded-[6px] border border-blue-200/80 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                  className="h-[36px] w-full rounded-[6px] border border-blue-200/80 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                  className="h-[36px] w-full rounded-[6px] border border-blue-200/80 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                  className="h-[36px] w-full rounded-[6px] border border-blue-200/80 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3.5">
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                className="h-[36px] w-full rounded-[6px] border border-blue-200/80 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
              />
            </div>
          </section>

          {/* Card 2: Chave Pix do Estabelecimento */}
          <section className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center gap-2">
              <QrCodeIcon className="h-4 w-4 text-[#008f58]" />
              <h2 className="text-[13px] font-bold text-[#203f9f]">
                Chave Pix do Estabelecimento (Para PDV e Cobrança da Caderneta)
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                  className="h-[36px] w-full rounded-[6px] border border-blue-200/80 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                >
                  {PIX_KEY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                  className="h-[36px] w-full rounded-[6px] border border-blue-200/80 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Card 3: Mensagem de Rodapé do Cupom */}
          <section className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-3 flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4 text-[#ff6b00]" />
              <h2 className="text-[13px] font-bold text-[#203f9f]">
                Mensagem de Rodapé do Cupom
              </h2>
            </div>
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
              className="h-[36px] w-full rounded-[6px] border border-blue-200/80 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
            />
          </section>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="inline-flex h-[36px] items-center gap-1.5 rounded-[6px] bg-[#0f766e] px-4 text-[12px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0d645d]"
            >
              <DocumentCheckIcon className="h-4 w-4" />
              <span>Salvar dados da loja</span>
            </button>

            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#008f58]">
                <CheckCircleIcon className="h-4 w-4" />
                Dados da loja salvos com sucesso!
              </span>
            )}
          </div>
        </form>
      )}

      {/* Tab 2: Operadores e Permissões (Screenshot 110054.png) */}
      {activeTab === "operators" && (
        <div className="space-y-4 pt-1">
          {/* Terminal & Operator Header Card */}
          <section className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-[#ff6b00]" />
              <h2 className="text-[13px] font-bold text-[#203f9f]">
                Configurações de Operadores e Níveis de Permissão
              </h2>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Defina acessos para caixas, gerentes e administradores do
              estabelecimento.
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                Terminal
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  className="h-[38px] flex-1 rounded-[8px] border border-slate-200 bg-white px-3.5 text-[12px] text-slate-600 focus:border-[#203f9f] focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleOpenNewOperator}
                  className="inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-[8px] bg-[#0f766e] px-4 text-[12px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0d645d]"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  <span>Cadastrar Operador</span>
                </button>
              </div>
            </div>
          </section>

          {/* Usuários com acesso List (Screenshot 110054.png) */}
          <section className="overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="border-b border-slate-100 px-5 py-3">
              <h3 className="text-[13px] font-bold text-slate-700">
                Usuários com acesso
              </h3>
            </div>

            <ul className="divide-y divide-slate-100">
              {operators.map((op) => (
                <li
                  key={op.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                      {getInitials(op.name)}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-slate-800">
                        {op.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Login: @{op.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditOperator(op)}
                      aria-label={`Editar operador ${op.name}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#203f9f]"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOperator(op.id)}
                      aria-label={`Excluir operador ${op.name}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* Modal: Cadastrar / Editar Operador (Screenshots 110104.png & 110111.png) */}
      {isOperatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={operatorModalTitleId}
            className="w-full max-w-[440px] overflow-hidden rounded-[12px] bg-white shadow-2xl"
          >
            {/* Royal Blue Header */}
            <header className="flex items-center justify-between bg-[#153488] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <PencilSquareIcon className="h-5 w-5 text-[#ff6b00]" />
                <h2
                  id={operatorModalTitleId}
                  className="text-[15px] font-bold text-white"
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
                className="rounded p-1 text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </header>

            <form
              onSubmit={handleSaveOperatorForm}
              className="space-y-3.5 p-5"
            >
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                  className="h-[36px] w-full rounded-[6px] border border-slate-200 bg-[#f8fafc] px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#203f9f] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-200 bg-[#f8fafc] px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#203f9f] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Senha *
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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
                      className="h-[36px] w-full rounded-[6px] border border-slate-200 bg-[#f8fafc] pl-8 pr-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#203f9f] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selector Cards with Icons */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {(
                  [
                    {
                      id: "cashier",
                      label: "Operador de caixa",
                      icon: UserIcon,
                    },
                    {
                      id: "manager",
                      label: "Gerente",
                      icon: ShieldCheckIcon,
                    },
                    {
                      id: "admin",
                      label: "Administrador",
                      icon: ShieldCheckIcon,
                    },
                  ] as const
                ).map((roleOption) => {
                  const selected = operatorDraft.role === roleOption.id;
                  const RoleIcon = roleOption.icon;
                  return (
                    <button
                      key={roleOption.id}
                      type="button"
                      onClick={() => handleSelectRole(roleOption.id)}
                      className={`flex h-[50px] flex-col items-center justify-center gap-1 rounded-[8px] border px-2 text-center text-[10px] font-semibold transition-colors ${
                        selected
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                          : "border-slate-200 bg-[#f8fafc] text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <RoleIcon className="h-3.5 w-3.5" />
                      <span>{roleOption.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Granular Permissions Checklist Box */}
              <div className="rounded-[8px] border border-slate-200 bg-[#f8fafc] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">
                    Permissões Específicas
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Personalize individualmente
                  </span>
                </div>

                <div className="max-h-[168px] space-y-1.5 overflow-y-auto pr-1">
                  {OPERATOR_PERMISSION_ITEMS.map((item) => {
                    const checked = operatorDraft.permissions[item.key];
                    const PermIcon = getPermissionIcon(item.key);
                    return (
                      <label
                        key={item.key}
                        className="flex h-[28px] cursor-pointer items-center justify-between rounded-[6px] border border-slate-200/80 bg-white px-2.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-2">
                          <PermIcon className="h-3.5 w-3.5 text-[#2563eb]" />
                          <span>{item.label}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleTogglePermission(item.key)}
                          className="h-3.5 w-3.5 rounded accent-[#2563eb]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {operatorError && (
                <p className="text-[11px] font-medium text-rose-600">
                  {operatorError}
                </p>
              )}

              <footer className="flex items-center justify-end gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOperatorModalOpen(false);
                    setOperatorError(null);
                  }}
                  className="text-[12px] font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`inline-flex h-[34px] items-center gap-1.5 rounded-[6px] px-4 text-[12px] font-semibold text-white shadow-xs transition-colors ${
                    operatorDraft.id
                      ? "bg-[#2563eb] hover:bg-blue-700"
                      : "bg-[#0f766e] hover:bg-[#0d645d]"
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Salvar Operador</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
