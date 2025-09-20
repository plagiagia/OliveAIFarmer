import KnowledgeBaseContent, { OliveVarietyWithDetails } from '@/components/knowledge-base/KnowledgeBaseContent'
import { getAllOliveVarieties } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function KnowledgeBasePage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/')
  }

  const varieties = (await getAllOliveVarieties()) as OliveVarietyWithDetails[]

  return (
    <div className="min-h-screen bg-gray-50">
      <KnowledgeBaseContent varieties={varieties} />
    </div>
  )
}
