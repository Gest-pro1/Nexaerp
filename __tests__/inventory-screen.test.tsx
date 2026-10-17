import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MercadosPadariasPage from "@/app/modulos/mercados-padarias/page";
import InventoryScreen from "@/app/modulos/mercados-padarias/inventory-screen";
import {
  calculateSalePrice,
  computeInventoryMetrics,
  generateEan13,
  getExpirationStatus,
} from "@/lib/market-inventory";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} alt={String(props.alt ?? "")} />,
}));

describe("InventoryScreen & market-inventory helpers", () => {
  it("opens the Estoque screen from the Mercados e Padarias module sidebar", () => {
    render(<MercadosPadariasPage />);

    fireEvent.click(screen.getByRole("button", { name: "Estoque" }));
    expect(screen.getByRole("heading", { name: "Gestão de Estoque" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Novo Produto/i })).toBeVisible();
  });

  it("generates a valid 13-digit EAN-13 barcode and calculates sale price from cost and margin", () => {
    const ean = generateEan13();
    expect(ean).toMatch(/^\d{13}$/);
    expect(calculateSalePrice(5, 35)).toBe(6.75);
  });

  it("renders an empty inventory state by default ready for backend data", () => {
    render(<InventoryScreen />);

    expect(screen.getByRole("heading", { name: "Gestão de Estoque" })).toBeInTheDocument();
    expect(screen.getByText("Produtos em Estoque")).toBeInTheDocument();
    expect(screen.getByText("Nenhum produto cadastrado no estoque.")).toBeInTheDocument();
    expect(screen.getByText("0 de 0 linha(s) selecionadas")).toBeInTheDocument();
  });

  it("registers a new product and supplier, then allows editing and deleting the product", () => {
    const onSaveProduct = vi.fn();
    const onSaveSupplier = vi.fn();
    const onDeleteProduct = vi.fn();

    render(
      <InventoryScreen
        onSaveProduct={onSaveProduct}
        onSaveSupplier={onSaveSupplier}
        onDeleteProduct={onDeleteProduct}
      />,
    );

    // Open Cadastrar Produto modal
    fireEvent.click(screen.getByRole("button", { name: /Novo Produto/i }));
    const productDialog = screen.getByRole("dialog", { name: "Cadastrar Produto" });
    expect(productDialog).toBeInTheDocument();

    // Open Cadastrar Novo Fornecedor from inside the product modal
    fireEvent.click(within(productDialog).getByRole("button", { name: /Novo/i }));
    const supplierDialog = screen.getByRole("dialog", { name: "Cadastrar Novo Fornecedor" });
    expect(supplierDialog).toBeInTheDocument();

    fireEvent.change(within(supplierDialog).getByLabelText(/Nome \/ Razão Social/i), {
      target: { value: "JDE Jacobs Douwe" },
    });
    fireEvent.change(within(supplierDialog).getByLabelText(/Contato/i), {
      target: { value: "(11) 98451-6521" },
    });
    fireEvent.click(within(supplierDialog).getByRole("button", { name: /Salvar Fornecedor/i }));

    expect(onSaveSupplier).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "Cadastrar Novo Fornecedor" })).not.toBeInTheDocument();

    // Fill in product details
    fireEvent.change(within(productDialog).getByLabelText(/Descrição/i), {
      target: { value: "Café Torrado e Moído" },
    });
    fireEvent.change(within(productDialog).getByLabelText(/Custo Unitário/i), {
      target: { value: "5" },
    });
    expect(within(productDialog).getByLabelText(/Preço de Venda/i)).toHaveValue(6.75);

    fireEvent.change(within(productDialog).getByLabelText(/Estoque Atual/i), {
      target: { value: "20" },
    });
    fireEvent.change(within(productDialog).getByLabelText(/Estoque Mínimo/i), {
      target: { value: "25" },
    });
    fireEvent.change(within(productDialog).getByLabelText(/Data de Validade/i), {
      target: { value: "29/01/2027" },
    });

    fireEvent.click(within(productDialog).getByRole("button", { name: /Salvar no Estoque/i }));

    expect(onSaveProduct).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Café Torrado e Moído")).toBeInTheDocument();
    expect(screen.getByText("JDE Jacobs Douwe")).toBeInTheDocument();
    expect(screen.getByText("Baixo")).toBeInTheDocument();
    expect(screen.getByText("0 de 1 linha(s) selecionadas")).toBeInTheDocument();

    // Open Editar Fornecedor from the table row
    fireEvent.click(screen.getByRole("button", { name: "Editar fornecedor JDE Jacobs Douwe" }));
    const editSupplierDialog = screen.getByRole("dialog", { name: "Editar Fornecedor" });
    fireEvent.change(within(editSupplierDialog).getByLabelText(/Nome \/ Razão Social/i), {
      target: { value: "JDE Brasil" },
    });
    fireEvent.click(within(editSupplierDialog).getByRole("button", { name: /Salvar Alterações/i }));
    expect(screen.getByText("JDE Brasil")).toBeInTheDocument();

    // Open Editar Produto from the table row
    fireEvent.click(screen.getByRole("button", { name: "Editar produto Café Torrado e Moído" }));
    const editProductDialog = screen.getByRole("dialog", { name: "Editar Produto" });
    fireEvent.change(within(editProductDialog).getByLabelText(/Descrição/i), {
      target: { value: "Café Torrado e Moído Pilão 500g" },
    });
    fireEvent.click(within(editProductDialog).getByRole("button", { name: /Salvar no Estoque/i }));
    expect(screen.getByText("Café Torrado e Moído Pilão 500g")).toBeInTheDocument();

    // Open Excluir Produto modal and confirm deletion
    fireEvent.click(
      screen.getByRole("button", { name: "Excluir produto Café Torrado e Moído Pilão 500g" }),
    );
    const deleteDialog = screen.getByRole("dialog", { name: "Excluir Produto" });
    expect(
      within(deleteDialog).getByText(
        "Atenção: Todos os dados desse produto serão perdidos. Confirmar exclusão?",
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(deleteDialog).getByRole("button", { name: "Confirmar" }));

    expect(onDeleteProduct).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Nenhum produto cadastrado no estoque.")).toBeInTheDocument();
  });

  it("computes expiration statuses and inventory metrics accurately", () => {
    const refDate = new Date(2026, 11, 9); // 09/12/2026
    expect(getExpirationStatus("19/12/2026", refDate)).toMatchObject({
      status: "expiring-soon",
      label: "Vence em 10d",
    });
    expect(getExpirationStatus("01/12/2026", refDate)).toMatchObject({
      status: "expired",
      label: "Vencido !",
    });

    const metrics = computeInventoryMetrics(
      [
        {
          id: "1",
          barcode: "7891000100103",
          description: "Item 1",
          category: "Mercearia",
          unit: "UN",
          unitCost: 5,
          suggestedMargin: 35,
          salePrice: 6.75,
          currentStock: 4,
          minStock: 10,
          expirationDate: "19/12/2026",
          supplierName: "Fornecedor A",
        },
        {
          id: "2",
          barcode: "7891000100104",
          description: "Item 2",
          category: "Bebidas",
          unit: "UN",
          unitCost: 7,
          suggestedMargin: 30,
          salePrice: 9.1,
          currentStock: 20,
          minStock: 10,
          expirationDate: "01/12/2026",
          supplierName: "Fornecedor B",
        },
      ],
      refDate,
    );

    expect(metrics).toEqual({
      totalItems: 2,
      lowStockCount: 1,
      expiringSoonCount: 1,
      expiredCount: 1,
    });
  });
});
