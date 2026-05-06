"use client"
// MENU HORIZONTAL COM LUPA E BOTÃO DE LOGIN COM FOTO DO USUÁRIO
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Head() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="bg-gray-800 text-white p-4 flex items-center justify-between">
      <div className="text-xl font-bold">GestPro</div>
      <form onSubmit={handleSearch} className="flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="px-2 py-1 rounded-l bg-gray-700 text-white focus:outline-none"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded-r bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          Search
        </button>
      </form>
      <div className="flex items-center gap-4">
        <img
          src="/user-avatar.jpg"
          alt="User Avatar"
          className="w-8 h-8 rounded-full"
        />
        <span>John Doe</span>
      </div>
    </header>
  );
}