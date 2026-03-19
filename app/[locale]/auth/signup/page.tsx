"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Registration is handled by Privy on the signin page
export default function SignUpPage() {
  const router = useRouter()
  useEffect(() => { router.replace("/auth/signin") }, [])
  return null
}
