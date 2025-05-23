import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  const { userId } = auth()

  if (!userId) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-6xl mb-6">🫒</div>
          <h1 className="text-4xl font-bold text-olive-800 mb-4">
            Καλώς ήρθατε στο ΕλαιοLog!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Το ψηφιακό ημερολόγιο του ελαιώνα σας είναι έτοιμο
          </p>
          
          <div className="bg-white rounded-3xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-olive-700 mb-6">
              Επόμενα Βήματα
            </h2>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center">
                  <span className="text-olive-700 font-semibold">1</span>
                </div>
                <span className="text-gray-700">Προσθήκη πληροφοριών ελαιώνα</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center">
                  <span className="text-olive-700 font-semibold">2</span>
                </div>
                <span className="text-gray-700">Καταγραφή δέντρων και τμημάτων</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center">
                  <span className="text-olive-700 font-semibold">3</span>
                </div>
                <span className="text-gray-700">Ξεκίνημα καταγραφής δραστηριοτήτων</span>
              </div>
            </div>
            
            <div className="mt-8">
              <button className="bg-gradient-to-r from-olive-700 to-olive-600 hover:from-olive-800 hover:to-olive-700 text-white py-3 px-8 rounded-2xl font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                Ξεκινήστε τώρα
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 