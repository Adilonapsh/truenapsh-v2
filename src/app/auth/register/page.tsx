'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapIcon, CompassIcon, GithubIcon, TwitterIcon } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
                  <CompassIcon size={64} className="text-gray-800 dark:text-gray-200" />
                </div>
                <CardTitle className="text-3xl font-bold mt-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white">
                  Join MapExplorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">Start your mapping adventure today!</p>
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
                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">Create your account</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <p htmlFor="full-name" className="text-gray-700 dark:text-gray-300">Full Name</p>
                    <Input
                      id="full-name"
                      name="full-name"
                      type="text"
                      autoComplete="name"
                      required
                      className="mt-1"
                      value={fullName}
                      aria-autocomplete="list"
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
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
                      autoComplete="new-password"
                      required
                      className="mt-1"
                      value={password}
                      aria-autocomplete="list"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <p htmlFor="confirm-password" className="text-gray-700 dark:text-gray-300">Confirm Password</p>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="mt-1"
                      value={confirmPassword}
                      aria-autocomplete="list"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black">
                    Create Account
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
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Quick Sign Up</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="outline" className="w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <GithubIcon className="mr-2 h-4 w-4" />
                  Sign up with GitHub
                </Button>
                <Button variant="outline" className="w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <TwitterIcon className="mr-2 h-4 w-4" />
                  Sign up with Twitter
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
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Returning Explorer?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600 dark:text-gray-400">Already have an account? Sign in to continue your journey.</p>
                <Button variant="secondary" className="w-full bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                  <Link href="/auth/login">Sign In</Link>
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
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Need Assistance?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600 dark:text-gray-400">Our support team is here to help you get started.</p>
                <Button variant="secondary" className="w-full bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                  <Link href="/support">Get Help</Link>
                </Button>
              </CardContent>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

