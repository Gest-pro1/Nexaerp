"use client"
import React from 'react'
import Image from 'next/image'

interface ModalContent {
  icon: string
  title: string
  modalText: string
}

interface ModalProps {
  open: boolean
  content: ModalContent | null
  onClose: () => void
}

export default function Modal({ open, content, onClose }: ModalProps) {
  if (!open || !content) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-[534px] h-[530px] bg-white rounded-[40px] shadow-2xl z-10 flex flex-col overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-black hover:text-gray-600 text-2xl">✕</button>

        <div className="px-10 pt-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Image src={content.icon} alt={content.title} width={65} height={30} />
          </div>

          <h2 className="text-[28px] font-bold font-bevietnam text-black">{content.title}</h2>
        </div>

        <div className="flex-1 px-10 mt-4 overflow-y-auto">
          <p className="text-[#667085] text-[18px] leading-[28px] font-bevietnam break-words">
            {content.modalText}
          </p>
        </div>

        <div className="px-10 pb-10 flex justify-end items-center gap-10">
          <button onClick={onClose} className="text-[#667085] text-sm font-bevietnam hover:text-black cursor-pointer">Fechar</button>
          <button className="bg-[#1E40AF] hover:bg-[#1E3A8A] text-white px-8 py-4 rounded-xl text-sm font-bevietnam cursor-pointer">Experimente Agora</button>
        </div>
      </div>
    </div>
  )
}
