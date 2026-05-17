import { SignUp } from '@clerk/nextjs'

export const metadata = {
  title: 'Εγγραφή — OliveIQ',
}

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-olive-50 to-white px-4 py-12">
      <SignUp />
    </main>
  )
}
