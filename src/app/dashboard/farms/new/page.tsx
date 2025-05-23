import FarmCreationForm from '@/components/farms/FarmCreationForm'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function NewFarmPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-olive-800">
            Δημιουργία Νέου Ελαιώνα
          </h1>
          <p className="text-gray-600 mt-2">
            Συμπληρώστε τις παρακάτω πληροφορίες για τον ελαιώνα σας
          </p>
        </div>
        
        <FarmCreationForm userId={userId} />
      </div>
    </div>
  )
} 