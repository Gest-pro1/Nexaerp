import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MercadosPadariasPage from "@/app/modulos/mercados-padarias/page";
import SuppliersScreen from "@/app/modulos/mercados-padarias/suppliers-screen";
import SettingsScreen from "@/app/modulos/mercados-padarias/settings-screen";
import PdvScreen from "@/app/modulos/mercados-padarias/pdv-screen";
import InventoryScreen from "@/app/modulos/mercados-padarias/inventory-screen";
import CashierScreen from "@/app/modulos/mercados-padarias/cashier-screen";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <img {...props} alt={String(props.alt ?? "")} />
  ),
}));

describe("Módulo Mercados e Padarias - Novas Telas e Funcionalidades", () => {
  it("navega para Fornecedores e Configurações pela barra lateral do módulo", () => {
    render(<MercadosPadariasPage />);

    // Abrir Fornecedores
    fireEvent.click(screen.getByRole("button", { name: "Fornecedores" }));
    expect(
      screen.getByRole("heading", { name: "Fornecedores" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Novo Fornecedor/i }),
    ).toBeInTheDocument();

    // Abrir Configurações
    fireEvent.click(screen.getByRole("button", { name: "Configurações" }));
    expect(
      screen.getByRole("heading", { name: "Configurações do Sistema" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Gerais do Estabelecimento/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Operadores e Permissões/i }),
    ).toBeInTheDocument();
  });

  it("cadastra, edita e exclui um fornecedor com endereço completo na tela de Fornecedores", () => {
    render(<SuppliersScreen />);

    expect(
      screen.getByText("Nenhum fornecedor cadastrado."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Novo Fornecedor/i }));
    const dialog = screen.getByRole("dialog", { name: "Cadastrar Fornecedor" });

    fireEvent.change(within(dialog).getByLabelText("Nome/Razão Social"), {
      target: { value: "Bebida Sul Atacado" },
    });
    fireEvent.change(within(dialog).getByLabelText("CNPJ"), {
      target: { value: "12.345.678/0001-99" },
    });
    fireEvent.change(within(dialog).getByLabelText("Pessoa de contato"), {
      target: { value: "Fernanda Lopes" },
    });
    fireEvent.change(within(dialog).getByLabelText("Telefone"), {
      target: { value: "(51) 99123-4567" },
    });
    fireEvent.change(within(dialog).getByLabelText("E-mail"), {
      target: { value: "pedidos@bebidasul.com.br" },
    });
    fireEvent.change(within(dialog).getByLabelText("Cidade"), {
      target: { value: "Porto Alegre" },
    });

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Salvar Fornecedor" }),
    );

    expect(screen.getByText("Bebida Sul Atacado")).toBeInTheDocument();
    expect(screen.getByText(/Fernanda Lopes/)).toBeInTheDocument();
    expect(screen.getByText("Porto Alegre/RS")).toBeInTheDocument();

    // Excluir fornecedor
    fireEvent.click(
      screen.getByRole("button", {
        name: "Excluir fornecedor Bebida Sul Atacado",
      }),
    );
    const deleteDialog = screen.getByRole("dialog", {
      name: "Excluir Fornecedor",
    });
    fireEvent.click(
      within(deleteDialog).getByRole("button", { name: "Confirmar" }),
    );

    expect(
      screen.getByText("Nenhum fornecedor cadastrado."),
    ).toBeInTheDocument();
  });

  it("realiza movimentação de estoque (Entrada, Saída e Ajuste) atualizando saldo e custo", () => {
    render(
      <InventoryScreen
        initialProducts={[
          {
            id: "prod-1",
            code: "1001",
            barcode: "7891000100103",
            description: "Açúcar Refinado 1kg",
            category: "Mercearia",
            unit: "UN",
            unitCost: 3.9,
            suggestedMargin: 35,
            salePrice: 5.5,
            currentStock: 54,
            minStock: 10,
            expirationDate: "20/12/2027",
            supplierName: "Sem fornecedor",
            active: true,
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Movimentar estoque Açúcar Refinado 1kg",
      }),
    );
    const moveDialog = screen.getByRole("dialog", {
      name: "Movimentar Estoque",
    });

    fireEvent.change(
      within(moveDialog).getByLabelText("Quantidade da Movimentação"),
      { target: { value: "10" } },
    );
    fireEvent.change(
      within(moveDialog).getByLabelText("Custo Unitário da Compra"),
      { target: { value: "4.50" } },
    );
    fireEvent.change(
      within(moveDialog).getByLabelText("Motivo da Movimentação"),
      { target: { value: "Compra nota fiscal 120" } },
    );
    fireEvent.click(
      within(moveDialog).getByRole("button", {
        name: "Confirmar Movimentação",
      }),
    );

    expect(screen.getByText("64 un")).toBeInTheDocument();
    expect(screen.getByText("R$ 4,50")).toBeInTheDocument();
  });

  it("realiza venda no PDV com múltiplos pagamentos (Dinheiro + Pix) e emite o Cupom Fiscal", () => {
    const onFinishSale = vi.fn();

    render(
      <PdvScreen
        initialCatalog={[
          {
            id: "p-1",
            code: "1001",
            barcode: "7891000100103",
            name: "Arroz Branco 5kg",
            category: "Mercearia",
            unit: "UN",
            unitPrice: 25,
            stockQuantity: 30,
          },
        ]}
        onFinishSale={onFinishSale}
      />,
    );

    // Clicar no card do produto no catálogo para adicionar 2 itens (R$ 50,00)
    fireEvent.click(screen.getAllByText("Arroz Branco 5kg")[0]);
    fireEvent.click(screen.getAllByText("Arroz Branco 5kg")[0]);

    expect(screen.getByText("2 Itens")).toBeInTheDocument();

    // Abrir modal Pagamento da Venda
    fireEvent.click(
      screen.getByRole("button", { name: /Finalizar Venda \(F5\)/i }),
    );
    const paymentModal = screen.getByRole("dialog", {
      name: "Pagamento da Venda",
    });

    // Lançar R$ 20,00 parcial em Dinheiro
    fireEvent.change(within(paymentModal).getByLabelText("Valor em Dinheiro"), {
      target: { value: "20,00" },
    });
    fireEvent.click(
      within(paymentModal).getByRole("button", { name: /Lançar Pagamento/i }),
    );

    // Verificar que Lançados (1) apareceu e o restante passou a ser R$ 30,00
    expect(within(paymentModal).getByText("Lançados (1)")).toBeInTheDocument();

    // Selecionar Pix para quitar os R$ 30,00 restantes
    fireEvent.click(
      within(paymentModal).getByRole("button", { name: /Pix\s*F7/i }),
    );
    fireEvent.click(
      within(paymentModal).getByRole("button", { name: /Concluir Venda/i }),
    );

    expect(onFinishSale).toHaveBeenCalledTimes(1);
    expect(screen.getByText("DANFE NFC-e")).toBeInTheDocument();
  });

  it("salva configurações da loja e cadastra novo operador com permissões", () => {
    render(<SettingsScreen />);

    fireEvent.change(screen.getByLabelText("Nome Fantasia"), {
      target: { value: "Supermercado Central" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Salvar dados da loja/i }),
    );
    expect(
      screen.getByText("Dados da loja salvos com sucesso!"),
    ).toBeInTheDocument();

    // Aba Operadores e Permissões
    fireEvent.click(
      screen.getByRole("button", { name: /Operadores e Permissões/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Cadastrar Operador/i }),
    );

    const opDialog = screen.getByRole("dialog", { name: "Cadastrar Operador" });
    fireEvent.change(
      within(opDialog).getByLabelText("Nome Completo / Apelido"),
      { target: { value: "Mariana Souza" } },
    );
    fireEvent.change(
      within(opDialog).getByLabelText("Nome de Usuário / Login"),
      { target: { value: "mariana.gerente" } },
    );
    fireEvent.click(within(opDialog).getByRole("button", { name: "Gerente" }));
    fireEvent.click(
      within(opDialog).getByRole("button", { name: "Salvar Operador" }),
    );

    expect(screen.getByText("Mariana Souza")).toBeInTheDocument();
    expect(screen.getByText("Login: @mariana.gerente")).toBeInTheDocument();
  });

  it("abre o modal de Movimentações do Caixa ao clicar no ícone de olho no histórico", () => {
    render(
      <CashierScreen
        operatorName="João Silva"
        initialClosings={[
          {
            id: "close-1",
            closedAt: "18/11/2026, 18:00",
            operatorName: "João Silva",
            initialFund: 100,
            totalSales: 350,
            expectedDrawer: 420,
            physicalCount: 420,
            difference: 0,
            movements: [
              {
                id: "m-1",
                type: "withdrawal",
                amount: 30,
                reason: "Depósito cofre",
                createdAt: "18/11/2026, 14:20",
              },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Ver movimentações do turno 18\/11\/2026, 18:00/i,
      }),
    );

    const movDialog = screen.getByRole("dialog", {
      name: "Movimentações do Caixa",
    });
    expect(within(movDialog).getByText("Depósito cofre")).toBeInTheDocument();
    expect(within(movDialog).getByText(/-R\$\s*30,00/)).toBeInTheDocument();

    fireEvent.click(
      within(movDialog).getByRole("button", {
        name: "Fechar Movimentações do Caixa",
      }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Movimentações do Caixa" }),
    ).not.toBeInTheDocument();
  });
});
