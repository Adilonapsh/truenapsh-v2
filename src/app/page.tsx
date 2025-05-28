import { CtaSection } from "@/components/layouts/call-to-action";
import { Footer } from "@/components/layouts/footer";
import Navbar from "@/components/layouts/navbar";
import { Testimonials } from "@/components/layouts/testimonials";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import HeroPill from "@/components/ui/hero-pill";
import { TwitterLogoIcon } from "@radix-ui/react-icons";
import { Code, Map, MapIcon, Shield, Sparkles, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { FaGithub } from "react-icons/fa6";

export default function Home() {
    return (
        <div>
            <Navbar />
            <section className="relative min-h-screen lg:h-screen pt-24 pb-20 overflow-hidden">
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
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                    Spatial analytics
                                </span>
                                <span className="block">
                                    built for the cloud
                                </span>
                            </h1>

                            <p className="text-xl text-gray-400">
                                Bring spatial analysis into your cloud ecosystem for unparalleled security, speed, and scalability.
                            </p>

                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="h-8 w-8 rounded-full bg-background border-2 border-primary"></div>
                                    ))}
                                </div>
                                <span className="text-sm text-gray-400">
                                    <span className="font-bold text-cyan-400 animate-pulse">1,000+</span> indie creators trust us
                                </span>
                            </div>

                            <div className="relative flex flex-col sm:flex-row gap-4">

                                <div className="mt-[-10px]">
                                    <div className="mt-[-10px]">
                                        <div className="relative p-2 group transition-all duration-1000">
                                            {/* <div
                                                className="absolute inset-0 rounded-md overflow-hidden bg-gradient-to-r from-blue-500/30 to-blue-500/30"
                                                style={{ filter: "blur(200px)" }}>
                                                <div className="absolute inset-0 bg-background group-hover:bg-gradient-to-br from-cyan-600/80 to-blue-600/90 transition-all duration-1000" />
                                            </div> */}
                                            <a
                                                href="/auth/login"
                                                className="relative z-10 inline-flex items-center justify-center rounded-md text-sm font-medium w-full h-10 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:opacity-90 transition-opacity">
                                                <span className="font-semibold">Start building</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="relative h-[500px] w-full">
                                <div className="absolute top-0 -left-72 lg:left-0 w-[960px] h-[540px] rounded-xl overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/95 backdrop-blur-sm rounded-xl">
                                        <Image
                                            src="/assets/thumbnail.png"
                                            alt="Dashboard Preview"
                                            width={1920}
                                            height={1080}
                                            className="opacity-90"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="min-h-[300px] flex items-center justify-center">
                <div className="flex flex-col justify-center items-center gap-10">
                    <div>
                        <h1 className="text-2xl font-bold text-center">
                            Powering creative minds.
                            <br />
                            Used by professionals working at:
                        </h1>
                    </div>
                    <div className="flex flex-col lg:flex-row justify-center items-center gap-10 filter grayscale dark:invert">
                        <Image height={100} width={150} className="h-7 lg:h-10" src="/assets/logo/logoipsum-1.svg" alt="" />
                        <Image height={100} width={150} className="h-7 lg:h-10" src="/assets/logo/logoipsum-2.svg" alt="" />
                        <Image height={100} width={150} className="h-7 lg:h-10" src="/assets/logo/logoipsum-3.svg" alt="" />
                        <Image height={100} width={150} className="h-7 lg:h-10" src="/assets/logo/logoipsum-4.svg" alt="" />
                        <Image height={100} width={150} className="h-7 lg:h-10" src="/assets/logo/logoipsum-5.svg" alt="" />
                        <Image height={100} width={150} className="h-7 lg:h-10" src="/assets/logo/logoipsum-6.svg" alt="" />
                    </div>
                </div>
            </section>
            <section className="min-h-screen flex items-center justify-center">
                <div className="container grid grid-cols-1 lg:grid-cols-3 gap-5 justify-center">
                    <div className="rounded-lg border min-h-[350px] p-5">
                        <div className="h-[200px] flex justify-center items-center border mb-4">
                            <img src="/assets/logo/logoipsum-2.svg" alt="" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="h-12 w-12 rounded-lg bg-foreground flex items-center justify-center gap-3">
                                <Map size={24} className="text-background" />
                            </div>
                            <h5 className="text-xl font-semibold">Real-time Data Visualization</h5>
                            <p className="text-sm">Visualize spatial data in real-time with interactive maps and customizable dashboards.</p>
                        </div>
                    </div>
                    <div className="rounded-lg border min-h-[350px] p-5">
                        <div className="h-[200px] flex justify-center items-center border mb-4">
                            <img src="/assets/logo/logoipsum-3.svg" alt="" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="h-12 w-12 rounded-lg bg-foreground flex items-center justify-center gap-3">
                                <SparklesIcon size={24} className="text-background" />
                            </div>
                            <h5 className="text-xl font-semibold">Advanced Analytics</h5>
                            <p className="text-sm">Perform complex spatial analyses with our intuitive and powerful analytics engine.</p>
                        </div>
                    </div>
                    <div className="rounded-lg border min-h-[350px] p-5">
                        <div className="h-[200px] flex justify-center items-center border mb-4">
                            <img src="/assets/logo/logoipsum-5.svg" alt="" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="h-12 w-12 rounded-lg bg-foreground flex items-center justify-center gap-3">
                                <Shield size={24} className="text-background" />
                            </div>
                            <h5 className="text-xl font-semibold">Security</h5>
                            <p className="text-sm">Keep your data safe with our enterprise-grade security and compliance features.</p>
                        </div>
                    </div>
                    <div className="lg:col-span-2 rounded-lg border min-h-[350px] p-5">
                        <div className="h-[200px] flex justify-center items-center border mb-4">
                            <img src="/assets/logo/logoipsum-2.svg" alt="" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="h-12 w-12 rounded-lg bg-foreground flex items-center justify-center gap-3">
                                <MapIcon size={24} className="text-background" />
                            </div>
                            <h5 className="text-xl font-semibold">Collaborative Workspaces</h5>
                            <p className="text-sm">Work together seamlessly with team collaboration tools designed for spatial projects.</p>
                        </div>
                    </div>
                    <div className="rounded-lg border min-h-[350px] p-5">
                        <div className="h-[200px] flex justify-center items-center border mb-4">
                            <img src="/assets/logo/logoipsum-1.svg" alt="" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="h-12 w-12 rounded-lg bg-foreground flex items-center justify-center gap-3">
                                <Code size={24} className="text-background" />
                            </div>
                            <h5 className="text-xl font-semibold">Custom Integrations</h5>
                            <p className="text-sm">Connect TrueMaps with your existing tools through our extensive API ecosystem.</p>
                        </div>
                    </div>
                </div>
            </section >
            <section className="min-h-[700px] w-full flex items-center justify-center">
                <Testimonials
                    className="self-center"
                    title="Loved By Community Members"
                    testimonials={[
                        {
                            id: 1,
                            name: "Alex Johnson",
                            role: "Full Stack Developer",
                            company: "TechFlow",
                            content:
                                "This starter template saved me weeks of setup time. The Supabase integration is flawless, and the UI components are beautiful and easy to customize. Worth every penny!",
                            rating: 5,
                            avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                        },
                        {
                            id: 2,
                            name: "Sarah Miller",
                            role: "Frontend Engineer",
                            company: "DesignHub",
                            content:
                                "I've used many starter templates, but this one stands out for its clean architecture and attention to detail. The TypeScript support is excellent, and the documentation is comprehensive.",
                            rating: 5,
                            avatar: "https://randomuser.me/api/portraits/women/44.jpg",
                        },
                        {
                            id: 3,
                            name: "Michael Chen",
                            role: "Product Manager",
                            company: "InnovateLabs",
                            content:
                                "Our team was able to launch our MVP in record time thanks to this template. The authentication flow and user management features worked right out of the box. Highly recommended!",
                            rating: 5,
                            avatar: "https://randomuser.me/api/portraits/men/46.jpg",
                        },
                    ]}
                    trustedCompaniesTitle="Trusted by innovative teams worldwide" />
            </section>
            <section className="min-h-screen flex items-center">
                <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="flex flex-col justify-center items-center gap-5">
                        <Sparkles size={50} />
                        <h1 className="text-4xl font-semibold mb-4">Frequently asked questions</h1>
                        <p className="text-sm text-gray-400 text-justify mb-4">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione dolores earum sequi. Ex, nulla! Tempora doloribus reprehenderit sunt laboriosam ex, nihil consectetur temporibus voluptatibus facilis minus tempore, quisquam harum deserunt non aut rerum quaerat similique nam quos aliquam eligendi? Totam unde delectus tenetur quod temporibus ipsum non est iure, harum architecto fuga inventore odio laboriosam consectetur rem aperiam blanditiis quae.
                        </p>
                        <a href="#" className="flex items-center gap-2">
                            More FAQs
                            <span className="ml-2 text-sm text-gray-400">
                                <svg xmlns="URL_ADDRESS.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </span>
                        </a>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>What is TrueMaps?</AccordionTrigger>
                            <AccordionContent>
                                TrueMaps is a cloud-based spatial analytics platform that enables organizations to perform advanced geographic analysis securely and efficiently in the cloud.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>How does TrueMaps handle data security?</AccordionTrigger>
                            <AccordionContent>
                                TrueMaps implements enterprise-grade security measures including end-to-end encryption, role-based access control, and compliance with major security standards to ensure your spatial data remains protected.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>What types of analysis can I perform?</AccordionTrigger>
                            <AccordionContent>
                                TrueMaps supports a wide range of spatial analytics including proximity analysis, hotspot detection, network analysis, and custom geographic visualizations. Our platform is extensible to accommodate specialized analysis needs.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>Is TrueMaps free to use?</AccordionTrigger>
                            <AccordionContent>
                                Yes! TrueMaps offers a generous free tier that includes basic spatial analytics features, up to 1GB storage, and unlimited public projects. Start using TrueMaps today without any cost.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                            <AccordionTrigger>What's included in the free tier?</AccordionTrigger>
                            <AccordionContent>
                                Our free tier includes essential features like basic mapping, data visualization, simple analytics, and community support. Perfect for individuals and small teams getting started with spatial analysis.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-6">
                            <AccordionTrigger>Are there any hidden costs?</AccordionTrigger>
                            <AccordionContent>
                                No hidden costs! Our free tier is completely free forever. We're transparent about our features and limitations, and you'll never be charged without explicit consent.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-7">
                            <AccordionTrigger>Do I need a credit card to sign up?</AccordionTrigger>
                            <AccordionContent>
                                No credit card required! Simply create an account with your email address to start using TrueMaps' free features immediately.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-8">
                            <AccordionTrigger>Can I upgrade later if needed?</AccordionTrigger>
                            <AccordionContent>
                                Yes! While our free tier is great for many users, you can easily upgrade to premium features when your needs grow. But there's no pressure - use the free tier as long as you like.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-9">
                            <AccordionTrigger>How long does the free tier last?</AccordionTrigger>
                            <AccordionContent>
                                Our free tier has no time limit - it's free forever! Use it as long as you want without worrying about trial periods or expiration dates.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>
            <section>
                <CtaSection />
            </section>
            <footer className="container">
                <Footer
                    logo={<img src="/assets/logo.png" alt="Logo" className="h-7 w-7" />}
                    brandName="Truemaps"
                    socialLinks={[
                        {
                            icon: <TwitterLogoIcon className="h-5 w-5" />,
                            href: "https://twitter.com",
                            label: "Twitter",
                        },
                        {
                            icon: <FaGithub className="h-5 w-5" />,
                            href: "https://github.com",
                            label: "GitHub",
                        },
                    ]}
                    mainLinks={[
                        { href: "#home", label: "Home" },
                        { href: "#fitur", label: "Fitur" },
                        { href: "#testimoni", label: "Testimoni" },
                        { href: "#faq", label: "FAQ" },
                    ]}
                    legalLinks={[
                        { href: "/privacy", label: "Privacy" },
                        { href: "/terms", label: "Terms" },
                    ]}
                    copyright={{
                        text: "© 2024 Truemaps",
                        license: "All rights reserved",
                    }}
                />
            </footer>
        </div >
    );
}
