import { redirect } from 'next/navigation'

// The middleware redirects /auth/signin to /[locale]/auth/signin.
// This component handles any rare case where middleware doesn't catch it.
export default function SignInFallback() {
  redirect('/en/auth/signin')
}
