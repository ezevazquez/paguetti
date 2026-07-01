import { Suspense } from 'react'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<p className="text-center text-[13px] text-muted-foreground">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
