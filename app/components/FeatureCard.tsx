"use client"
import React from 'react'
import Image from 'next/image'

interface Card {
  icon: string
  title: string
  desc: string
  modalText: string
}

interface FeatureCardProps {
  card: Card
  onSaibaMais: (card: Card) => void
}

export default function FeatureCard({ card, onSaibaMais }: FeatureCardProps) {
  return (
    <div
      className="
        bg-white
        rounded-2xl
        p-8
        shadow-xl/30
        inset-shadow-sm
        flex
        flex-col
        justify-between
        hover:-translate-y-1
        hover:shadow-2xl
        transition
      "
    >
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Image src={card.icon} alt={card.title} width={56} height={56} />
          <h3 className="text-lg sm:text-xl font-bold font-bevietnam text-black">
            {card.title}
          </h3>
        </div>

        <p className="text-[#4B4B4B] text-base font-bevietnam font-light">{card.desc}</p>
      </div>

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onSaibaMais(card)
        }}
        className="mt-6 text-[#00218F] font-bevietnam font-medium hover:underline"
      >
        Saiba Mais
      </a>
    </div>
  )
}
