import { Suspense } from "react"
import SucessoContent from "./SucessoContent"

export default function SucessoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SucessoContent />
    </Suspense>
  )
}