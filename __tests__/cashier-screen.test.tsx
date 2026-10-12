import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CashierScreen from "@/app/modulos/mercados-padarias/cashier-screen";

describe("CashierScreen", () => {
  function openCashier() {
    fireEvent.click(screen.getByRole("button", { name: "Abrir Caixa Agora" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Fundo inicial de troco" }), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Abrir Caixa e Iniciar Vendas/ }));
  }

  it("shows a closed cashier and an empty closing history by default", () => {
    render(<CashierScreen operatorName="Operador Teste" />);

    expect(screen.getByRole("heading", { name: "O caixa está fechado no momento" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Movimentações de Sangria e Suprimento" })).not.toBeInTheDocument();
    expect(screen.getByText("Nenhum fechamento de caixa registrado.")).toBeInTheDocument();
    expect(screen.getByText("0 fechamento(s)")).toBeInTheDocument();
  });

  it("opens the cashier with the entered initial change fund", () => {
    render(<CashierScreen operatorName="Operador Teste" />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir Caixa Agora" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Fundo inicial de troco" }), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Abrir Caixa e Iniciar Vendas/ }));

    expect(screen.getByRole("heading", { name: "Turno em Operação" })).toBeInTheDocument();
    expect(screen.getByText(/Operador:\s*Operador Teste/)).toBeInTheDocument();
    expect(screen.getByText(/100,00/)).toBeInTheDocument();
    expect(screen.getByText("Nenhum fechamento de caixa registrado.")).toBeInTheDocument();
  });

  it("opens and dismisses the withdrawal form without creating backend records", () => {
    render(<CashierScreen operatorName="Operador Teste" />);
    openCashier();

    fireEvent.click(screen.getByRole("button", { name: /Sangrias Registradas no Turno/ }));
    expect(screen.getByRole("dialog", { name: "Registrar Sangria (Retirada)" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhum fechamento de caixa registrado.")).toBeInTheDocument();
  });

  it("records withdrawal and supply amounts and reasons, then includes them in the closing balance", () => {
    render(<CashierScreen operatorName="Operador Teste" />);
    openCashier();

    fireEvent.click(screen.getByRole("button", { name: /Sangrias Registradas no Turno/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Valor da movimentação" }), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Motivo / Justificativa" }), {
      target: { value: "Retirada para cofre" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Sangria" }));

    fireEvent.click(screen.getByRole("button", { name: /Sangrias Registradas no Turno/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Valor da movimentação" }), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Motivo / Justificativa" }), {
      target: { value: "Segunda retirada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Sangria" }));

    fireEvent.click(screen.getByRole("button", { name: /Suprimento de Troco no Turno/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Valor da movimentação" }), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Motivo / Justificativa" }), {
      target: { value: "Troco para o caixa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Suprimento" }));

    expect(screen.queryByText("Retirada para cofre")).not.toBeInTheDocument();
    expect(screen.queryByText("Segunda retirada")).not.toBeInTheDocument();
    expect(screen.queryByText("Troco para o caixa")).not.toBeInTheDocument();
    expect(screen.getByText("2 movimentações")).toBeInTheDocument();
    expect(screen.getByText("1 movimentação")).toBeInTheDocument();
    expect(screen.getAllByText(/30,00/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("heading", { name: "Movimentações de Sangria e Suprimento" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fechar Caixa" }));
    expect(screen.getAllByText(/100,00/).length).toBeGreaterThanOrEqual(2);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Total contado na gaveta" }), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar e Encerrar Caixa" }));

    expect(screen.getByText("1 fechamento(s)")).toBeInTheDocument();
    expect(screen.queryByText("Retirada para cofre")).not.toBeInTheDocument();
    expect(screen.queryByText("Segunda retirada")).not.toBeInTheDocument();
    expect(screen.queryByText("Troco para o caixa")).not.toBeInTheDocument();
    expect(screen.queryByText("Nenhum fechamento de caixa registrado.")).not.toBeInTheDocument();
  });
});
