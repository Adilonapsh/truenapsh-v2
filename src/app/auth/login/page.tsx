import LoginComponent from '@/components/ui/auth/login-component'
import { Suspense } from 'react'


export default async function LoginPage() {
	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<LoginComponent />
			</Suspense>
		</>
	)
}

