"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
	BuildingStorefrontIcon,
	CheckCircleIcon,
	ScissorsIcon,
	ShoppingBagIcon,
	ShoppingCartIcon,
	ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { getUserModule } from "@/lib/auth";

const modules = [
	{
		id: "lojas-varejo",
		name: "Lojas e Varejo",
		description: "Controle de estoque e PDV ágil",
		Icon: ShoppingBagIcon,
		iconClass: "bg-blue-100 text-blue-700",
	},
	{
		id: "bares-restaurantes",
		name: "Bares e Restaurantes",
		description: "Mesas, comandas e KDS",
		Icon: BuildingStorefrontIcon,
		iconClass: "bg-red-100 text-red-500",
	},
	{
		id: "saloes-barbearias",
		name: "Salões e Barbearias",
		description: "Agenda e comissões",
		Icon: ScissorsIcon,
		iconClass: "bg-violet-100 text-violet-500",
	},
	{
		id: "mercados-padarias",
		name: "Mercados e Padarias",
		description: "Agilidade no caixa",
		Icon: ShoppingCartIcon,
		iconClass: "bg-green-100 text-green-600",
	},
];

export default function MenuModulosPage() {
	const router = useRouter();
	const [selectedModule, setSelectedModule] = useState("lojas-varejo");

	useEffect(() => {
		const userModule = getUserModule();
		if (modules.some((module) => module.id === userModule)) {
			setSelectedModule(userModule!);
		}
	}, []);

	return (
		<main className="relative isolate flex min-h-svh w-full items-center justify-center overflow-x-hidden bg-[#f3f4f6] px-4 py-8 text-gray-950 sm:px-6 sm:py-12">
			<div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[52svh] min-h-65 bg-[#2444b2]" />

			<header className="absolute left-6 top-5 z-10 hidden sm:block md:left-10 md:top-8">
				<Image
					src="/nova-logo.svg"
					alt="Nexa ERP"
					width={225}
					height={150}
					priority
					className="h-37.5 w-56.25 object-contain object-left"
				/>
			</header>

			<section className="my-auto h-fit w-full max-w-95 rounded-[24px] bg-white px-5 pb-8 pt-8 shadow-[0_12px_30px_rgba(15,23,42,0.12)] sm:rounded-[28px] sm:pb-9">
				<div className="flex flex-col items-center text-center">
					<span className="flex size-13 items-center justify-center rounded-full bg-green-100 text-green-600">
						<CheckCircleIcon aria-hidden="true" className="size-9" strokeWidth={1.7} />
					</span>
					<h1 className="mt-3 text-lg font-semibold leading-6">Login Realizado!</h1>
					<p className="mt-1.5 text-[11px] font-medium text-slate-500 sm:text-xs">
						Selecione o módulo para acessar:
					</p>
				</div>

				<fieldset className="mt-6.75 space-y-2.5">
					<legend className="sr-only">Selecione um módulo</legend>
					{modules.map(({ id, name, description, Icon, iconClass }) => (
						<label
							key={id}
							className={`flex min-h-14 cursor-pointer items-center gap-2.5 rounded-[8px] border px-3 transition-colors sm:h-14 sm:min-h-0 ${selectedModule === id ? "border-blue-400 bg-blue-50/70" : "border-slate-200 bg-[#f1f2f4] hover:border-blue-300"} focus-within:ring-2 focus-within:ring-blue-500`}
						>
							<input
								type="radio"
								name="module"
								value={id}
								checked={selectedModule === id}
								onChange={() => setSelectedModule(id)}
								className="sr-only"
							/>
							<span className={`flex size-7 shrink-0 items-center justify-center rounded-[5px] ${iconClass}`}>
								<Icon aria-hidden="true" className="size-4.5" strokeWidth={1.8} />
							</span>
							<span className="min-w-0 text-left">
								<span className="block truncate text-[13px] font-semibold leading-4">{name}</span>
								<span className="block truncate text-[10px] leading-3.5 text-gray-500 sm:text-[11px]">{description}</span>
							</span>
						</label>
					))}
				</fieldset>

				<button
					type="button"
					onClick={() => router.push(`/modulos/${selectedModule}`)}
					className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-[7px] bg-[#2444b2] text-sm font-semibold text-white shadow-[0_2px_8px_rgba(36,68,178,0.25)] transition-colors hover:bg-[#1e3a9c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:h-10 sm:min-h-0"
				>
					Acessar Painel
					<ArrowRightIcon aria-hidden="true" className="size-4" strokeWidth={2} />
				</button>
			</section>
		</main>
	);
}
