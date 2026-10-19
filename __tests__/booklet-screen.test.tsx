import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MercadosPadariasPage from "@/app/modulos/mercados-padarias/page";
import BookletScreen from "@/app/modulos/mercados-padarias/booklet-screen";
import {
  calculateLimitUtilization,
  computeBookletMetrics,
  extractDueDayLabel,
  type BookletCustomer,
} from "@/lib/market-booklet";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} alt={String(props.alt ?? "")} />,
}));

const MOCK_CUSTOMER_WITH_DEBT: BookletCustomer = {
  id: "cust-1",
  code: "0012",
  name: "Professora Fernanda",
  phone: "(83) 99485-6521",
  cpf: "025.658.842-65",
  rg: "11.548",
  creditLimit: 500,
  balance: 155,
  dueDay: "Todo dia 05",
  notes: "Miguel (filho), Vera (esposa)",
  createdAt: "23 de setembro de 2026",
  entries: [
    {
      id: "e-2",
      type: "purchase",
      description: "Compra PDV #VD-1145",
      dateTime: "23/09/2026, 15:45:00",
      operatorName: "João Silva",
      amount: 100,
      balanceAfter: 155,
    },
    {
      id: "e-1",
      type: "purchase",
      description: "Compra PDV #VD-1040",
      dateTime: "17/09/2026, 09:33:00",
      operatorName: "João Silva",
      amount: 55,
      balanceAfter: 55,
    },
  ],
};

describe("BookletScreen & market-booklet helpers", () => {
  it("opens the Caderneta screen from the Mercados e Padarias module sidebar", () => {
    render(<MercadosPadariasPage />);

    fireEvent.click(screen.getByRole("button", { name: "Caderneta" }));
    expect(screen.getByRole("heading", { name: "Gestão da Caderneta" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Novo Cliente/i })).toBeVisible();
  });

  it("computes booklet metrics and credit limit utilization accurately", () => {
    expect(calculateLimitUtilization(405, 500)).toBe(81);
    expect(calculateLimitUtilization(0, 300)).toBe(0);
    expect(extractDueDayLabel("Todo dia 05")).toBe("05");

    const metrics = computeBookletMetrics([
      MOCK_CUSTOMER_WITH_DEBT,
      {
        ...MOCK_CUSTOMER_WITH_DEBT,
        id: "cust-2",
        name: "Roberto Pedreiro",
        creditLimit: 300,
        balance: 0,
      },
    ]);

    expect(metrics).toEqual({
      totalReceivable: 155,
      totalCreditLimit: 800,
      commitmentRate: 19,
      totalCustomers: 2,
      activeDebtCount: 1,
      upToDateCount: 1,
    });
  });

  it("registers a new customer and automatically opens the Termo de Abertura modal (A4 and 80mm)", () => {
    const onSaveCustomer = vi.fn();
    render(<BookletScreen onSaveCustomer={onSaveCustomer} />);

    fireEvent.click(screen.getByRole("button", { name: /Novo Cliente/i }));
    const createDialog = screen.getByRole("dialog", {
      name: "Cadastrar Cliente na Caderneta",
    });

    fireEvent.change(within(createDialog).getByLabelText(/Nome Completo \/ Apelido/i), {
      target: { value: "Fernanda de Lima Cabral" },
    });
    fireEvent.change(within(createDialog).getByLabelText(/WhatsApp \(Com DDD\)/i), {
      target: { value: "(83) 99542-6548" },
    });
    fireEvent.change(within(createDialog).getByLabelText(/^CPF/i), {
      target: { value: "015.023.254-65" },
    });
    fireEvent.change(within(createDialog).getByLabelText(/RG \(Opcional\)/i), {
      target: { value: "11.548" },
    });
    fireEvent.change(within(createDialog).getByLabelText(/Limite Autorizado/i), {
      target: { value: "500,00" },
    });
    fireEvent.change(within(createDialog).getByLabelText(/Observações\/Pessoas Autorizadas/i), {
      target: { value: "Miguel (filho), Vera (esposa)" },
    });

    fireEvent.click(within(createDialog).getByRole("button", { name: /Salvar e Gerar Termo/i }));

    expect(onSaveCustomer).toHaveBeenCalledTimes(1);

    const termDialog = screen.getByRole("dialog", {
      name: "Termo de Abertura da Caderneta",
    });
    expect(termDialog).toBeInTheDocument();
    expect(
      within(termDialog).getByText("Termo de Abertura e Adesão de Conta na Caderneta"),
    ).toBeInTheDocument();

    // Switch to Bobina 80mm format
    fireEvent.click(within(termDialog).getByRole("button", { name: /Bobina 80mm/i }));
    expect(within(termDialog).getByText("TERMO DE ADESÃO DA CADERNETA")).toBeInTheDocument();
    expect(within(termDialog).getByText(/ASSINATURA DO CLIENTE/i)).toBeInTheDocument();

    fireEvent.click(within(termDialog).getByRole("button", { name: "Fechar" }));
    expect(
      screen.queryByRole("dialog", { name: "Termo de Abertura da Caderneta" }),
    ).not.toBeInTheDocument();
  });

  it("receives payment, updates customer balance, and shows statement history and edit modal", () => {
    const onReceivePayment = vi.fn();
    render(
      <BookletScreen
        operatorName="João Silva"
        initialCustomers={[MOCK_CUSTOMER_WITH_DEBT]}
        onReceivePayment={onReceivePayment}
      />,
    );

    // Open Receber Pagamento modal
    fireEvent.click(screen.getByRole("button", { name: "Receber de Professora Fernanda" }));
    const paymentDialog = screen.getByRole("dialog", { name: "Professora Fernanda" });
    expect(within(paymentDialog).getByText("Dívida Total em Aberto:")).toBeInTheDocument();

    fireEvent.change(within(paymentDialog).getByLabelText(/Valor a Pagar \/ Abater/i), {
      target: { value: "100,00" },
    });
    fireEvent.click(within(paymentDialog).getByRole("button", { name: /Confirmar Pagamento/i }));

    expect(onReceivePayment).toHaveBeenCalledWith("cust-1", 100, "pix");

    // Open Extrato drawer and verify updated balance (R$ 55,00) and new payment entry
    fireEvent.click(screen.getByRole("button", { name: "Extrato de Professora Fernanda" }));
    const statementDrawer = screen.getByRole("dialog", { name: "Professora Fernanda" });
    expect(
      within(statementDrawer).getByText("Pagamento recebido no balcão via PIX"),
    ).toBeInTheDocument();
    expect(within(statementDrawer).getByText("Compra PDV #VD-1145")).toBeInTheDocument();

    // Open Editar Caderneta from inside Extrato drawer
    fireEvent.click(within(statementDrawer).getByRole("button", { name: /Editar Caderneta/i }));
    const editDialog = screen.getByRole("dialog", { name: "Editar Caderneta" });
    fireEvent.change(within(editDialog).getByLabelText(/Nome Completo \/ Apelido/i), {
      target: { value: "Professora Fernanda Lima" },
    });
    fireEvent.click(within(editDialog).getByRole("button", { name: /Salvar Alterações/i }));

    expect(screen.getAllByText("Professora Fernanda Lima").length).toBeGreaterThanOrEqual(1);
  });
});
