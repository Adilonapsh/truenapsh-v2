import Navbar from "@/components/layouts/navbar";
import { Button } from "@/components/ui/button";
import HeroPill from "@/components/ui/hero-pill";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function Home() {
	return (
		<div>
			<Navbar />
			<section className="relative h-screen pt-24 pb-20 overflow-hidden">
				<div className="flex items-center container mx-auto h-full px-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
						<div className="space-y-8">
							<div className="inline-block">
								<HeroPill
									href="#"
									label="Introducing Truemaps"
									announcement="📣 Announcement"
									isExternal
									className="bg-[hsl(187,80.8%,34.7%)]/20 [&_div]:bg-[hsl(210,40%,96.1%)] [&_div]:text-[hsl(187,80.8%,34.7%)] [&_p]:text-[hsl(187,80.8%,34.7%)] [&_svg_path]:fill-[hsl(187,80.8%,34.7%)]"
								/>
							</div>

							<h1 className="text-5xl md:text-6xl font-bold leading-tight">
								Spatial analytics
								<br />
								‍built for the cloud
							</h1>

							<p className="text-xl text-gray-400">
								Bring spatial analysis into your cloud ecosystem for unparalleled security, speed, and scalability.
							</p>

							<div className="flex items-center gap-2">
								<div className="flex -space-x-2">
									{[1, 2, 3, 4].map((i) => (
										<div key={i} className="h-8 w-8 rounded-full bg-background border-2 border-primary"></div>
									))}
								</div>
								<span className="text-sm text-gray-400">Used by 1k+ indie creators</span>
							</div>

							<div className="relative flex flex-col sm:flex-row gap-4">
								<div className="relative group">
									<div className="flex items-center justify-between gap-2 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2">
										<code className="text-sm text-gray-300">npx create-once-ui-app@latest</code>
										<button className="ml-2 text-gray-500 hover:text-white transition-colors">
											<Copy size={16} />
										</button>
									</div>
								</div>

								<div className="mt-[-10px]">
									<div className="relative p-2 group transition-all duration-300">
										<div
											className="absolute inset-0 rounded-md overflow-hidden bg-gradient-to-r from-blue-500/20 to-purple-500/20 "
											style={{ filter: "blur(8px)" }}
										>
											<div className="absolute inset-0 bg-background group-hover:bg-gradient-to-br from-blue/80 to-destructive/90" />
										</div>
										<a
											href="/auth/login"
											className="relative z-10 inline-flex items-center justify-center rounded-md text-sm font-medium w-full h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
										>
											<span className="font-semibold">Start building</span>
										</a>
									</div>
								</div>
							</div>
						</div>

						<div className="relative">
							<div className="relative h-[500px] w-full">
								<div className="absolute top-0 -right-20 w-[120%] h-[500px] rounded-xl overflow-hidden">
									<div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/95 backdrop-blur-sm rounded-xl transform rotate-2 scale-105"></div>
									<Image
										src="/placeholder.svg?height=500&width=700"
										alt="Dashboard Preview"
										width={700}
										height={500}
										className="object-cover w-full h-full opacity-90 transform rotate-2 scale-105"
									/>

									
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			<section className="h-screen">

			</section>

		</div>
	);
}
