'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapIcon, GithubIcon, TwitterIcon } from 'lucide-react'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const result = await signIn("credentials", {
			email,
			password,
			redirect: true,
			callbackUrl: "/dashboard",
		});
		console.log(result);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br flex items-center from-gray-100 to-gray-200 p-4 lg:p-8">
			<div className="mx-auto max-w-6xl">
				<motion.div
					className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<Card className="col-span-full lg:col-span-1 flex flex-col justify-center items-center text-center overflow-hidden bg-white dark:bg-gray-800">
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.2, duration: 0.5 }}
						>
							<CardHeader>
								<div className="mx-auto rounded-full bg-gray-100 p-3 shadow-md">
									<MapIcon size={64} className="text-gray-800 dark:text-gray-200" />
								</div>
								<CardTitle className="text-3xl font-bold mt-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white">
									Welcome to MapExplorer
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600 dark:text-gray-400">Your journey begins here!</p>
							</CardContent>
						</motion.div>
					</Card>

					<Card className="col-span-full lg:col-span-2 overflow-hidden bg-white dark:bg-gray-800">
						<motion.div
							initial={{ x: 20, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							transition={{ delay: 0.3, duration: 0.5 }}
						>
							<CardHeader>
								<CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">Sign in to your account</CardTitle>
							</CardHeader>
							<CardContent>
								<form className="space-y-4" onSubmit={handleSubmit}>
									<div>
										<p htmlFor="email" className="text-gray-700 dark:text-gray-300">Email address</p>
										<Input
											id="email"
											name="email"
											type="email"
											autoComplete="email"
											required
											className="mt-1"
											value={email}
											aria-autocomplete="list"
											onChange={(e) => setEmail(e.target.value)}
										/>
									</div>
									<div>
										<p htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</p>
										<Input
											id="password"
											name="password"
											type="password"
											autoComplete="current-password"
											required
											className="mt-1"
											value={password}
											aria-autocomplete="list"
											onChange={(e) => setPassword(e.target.value)}
										/>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<input
												id="remember-me"
												name="remember-me"
												type="checkbox"
												className="h-4 w-4 rounded border-gray-300 text-black focus:ring-gray-500 dark:border-gray-600 dark:text-white dark:focus:ring-gray-400"
											/>
											<p htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
												Remember me
											</p>
										</div>
										<div className="text-sm">
											<Link href="/forgot-password" className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300">
												Forgot your password?
											</Link>
										</div>
									</div>
									<Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black">
										Sign in
									</Button>
								</form>
							</CardContent>
						</motion.div>
					</Card>

					<Card className="col-span-full md:col-span-1 overflow-hidden bg-white dark:bg-gray-800">
						<motion.div
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.4, duration: 0.5 }}
						>
							<CardHeader>
								<CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Social Login</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-2">
								<Button variant="outline" className="w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
									<GithubIcon className="mr-2 h-4 w-4" />
									Continue with GitHub
								</Button>
								<Button variant="outline" className="w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
									<TwitterIcon className="mr-2 h-4 w-4" />
									Continue with Twitter
								</Button>
							</CardContent>
						</motion.div>
					</Card>

					<Card className="col-span-full md:col-span-1 overflow-hidden bg-white dark:bg-gray-800">
						<motion.div
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.5, duration: 0.5 }}
						>
							<CardHeader>
								<CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">New Explorer?</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-gray-600 dark:text-gray-400">Create an account to start your mapping journey.</p>
								<Button variant="secondary" className="w-full bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
									<Link href="/auth/register">Create Account</Link>
								</Button>
							</CardContent>
						</motion.div>
					</Card>

					<Card className="col-span-full md:col-span-1 lg:col-span-1 overflow-hidden bg-white dark:bg-gray-800">
						<motion.div
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.6, duration: 0.5 }}
						>
							<CardHeader>
								<CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Lost?</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-gray-600 dark:text-gray-400">Our support team is here to guide you.</p>
								<Button variant="secondary" className="w-full bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
									<Link href="/support">Get Directions</Link>
								</Button>
							</CardContent>
						</motion.div>
					</Card>
				</motion.div>
			</div>
		</div>
	)
}

