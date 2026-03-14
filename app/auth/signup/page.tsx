import { redirect } from 'next/navigation'

export default function SignUpFallback() {
  redirect('/en/auth/signup')
}
