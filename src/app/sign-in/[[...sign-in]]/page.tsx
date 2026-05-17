import { SignIn } from '@clerk/nextjs'

export const metadata = {
  title: 'Σύνδεση — OliveIQ',
}

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-olive-50 to-white px-4 py-12">
      <SignIn />
    </main>
  )
}
