import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TableOfContents } from "@/components/ui/table-of-contents"
import Navbar from "@/components/layouts/navbar"
import { Footer } from "@/components/layouts/footer"
import { TwitterLogoIcon } from "@radix-ui/react-icons"
import { FaGithub } from "react-icons/fa6"
import { ProgressBar } from "@/components/ui/progress-bar"

export default function TermsCondition() {
    const sections = [
        {
            id: "acceptance",
            title: "Acceptance of Terms",
            content: "By accessing or using the TrueMaps platform, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions. These Terms apply to all visitors, users, and others who access or use the Service. If you do not agree to these Terms, in whole or in part, you must not access or use the platform."
        },
        {
            id: "changes",
            title: "Changes to Terms",
            content: "TrueMaps reserves the right to revise, modify, or update these Terms and Conditions at any time without prior notice. Any changes will become effective immediately upon being posted on our website. Your continued use of the Service after the posting of any modifications constitutes acceptance of those changes. It is your responsibility to review the Terms periodically for updates."
        },
        {
            id: "access",
            title: "Access and Use of the Service",
            content: "Subject to these Terms, TrueMaps grants you a limited, non-exclusive, non-transferable, and revocable license to access and use the platform solely for lawful purposes and in accordance with the intended use of the Service. You agree not to use the platform in any manner that could disable, overburden, damage, or impair its functionality or interfere with any other party’s use of the Service."
        },
        {
            id: "account",
            title: "Account Registration and Security",
            content: "To access certain features of TrueMaps, you may be required to create an account and provide accurate, complete, and current information. You are solely responsible for safeguarding your login credentials and for all activities that occur under your account. You must notify us immediately if you suspect any unauthorized use of your account."
        },
        {
            id: "content",
            title: "User Content",
            content: "You retain ownership of all content, including maps and datasets, that you create or upload to the platform. However, by submitting such content, you grant TrueMaps a worldwide, non-exclusive, royalty-free license to host, use, reproduce, and distribute such content as part of providing and improving our services. You represent that you have the necessary rights and permissions to upload and share any content through the platform."
        },
        {
            id: "prohibited",
            title: "Prohibited Activities",
            content: "You agree not to engage in any of the following prohibited activities: using the platform for any illegal purpose; impersonating any person or entity; accessing or attempting to access the accounts of other users without authorization; uploading or transmitting malicious code; scraping, data mining, or reverse-engineering the platform; or interfering with the operation of the service in any way."
        },
        {
            id: "intellectual-property",
            title: "Intellectual Property Rights",
            content: "All content, features, and functionality of the TrueMaps platform—including but not limited to its design, text, code, software, and graphics—are the exclusive property of TrueMaps and its licensors and are protected by applicable intellectual property laws. Except as expressly permitted in writing, you may not copy, modify, distribute, or use any part of the platform's content without prior written consent."
        },
        {
            id: "dmca",
            title: "DMCA/Copyright Policy",
            content: "TrueMaps respects the intellectual property rights of others and expects users to do the same. If you believe that your copyrighted work has been infringed on our platform, please notify us in accordance with the Digital Millennium Copyright Act (DMCA) by providing a written notice with the required details. We will respond to valid claims and take appropriate actions, including content removal or account suspension."
        },
        {
            id: "third-party",
            title: "Third-Party Links and Content",
            content: "The TrueMaps platform may contain links to third-party websites, services, or resources. These links are provided for your convenience only and do not constitute an endorsement by TrueMaps. We have no control over the content, policies, or practices of any third-party websites and disclaim any responsibility for them. You access such third-party content at your own risk."
        },
        {
            id: "termination",
            title: "Termination",
            content: "We reserve the right to suspend or terminate your access to the Service, without prior notice or liability, for any reason, including but not limited to your violation of these Terms. Upon termination, your right to use the Service will immediately cease, and we may delete or disable access to your account and any associated content."
        },
        {
            id: "disclaimer",
            title: "Disclaimer of Warranties",
            content: "The Service is provided on an 'as is' and 'as available' basis. TrueMaps makes no warranties or representations, either express or implied, regarding the operation or availability of the platform or the information, content, materials, or products included therein. To the fullest extent permitted by law, we disclaim all warranties of any kind, including but not limited to merchantability, fitness for a particular purpose, and non-infringement."
        },
        {
            id: "limitation",
            title: "Limitation of Liability",
            content: "In no event shall TrueMaps, its affiliates, or its service providers be liable for any indirect, incidental, consequential, special, or punitive damages arising out of or relating to your use of or inability to use the Service, even if we have been advised of the possibility of such damages. Our liability is limited to the maximum extent permitted by law."
        },
        {
            id: "indemnification",
            title: "Indemnification",
            content: "You agree to defend, indemnify, and hold harmless TrueMaps, its affiliates, employees, agents, and licensors from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your access to or use of the platform, your violation of these Terms, or your infringement of any third-party rights."
        },
        {
            id: "governing-law",
            title: "Governing Law",
            content: "These Terms and any dispute arising out of or in connection with them shall be governed by and construed in accordance with the laws of the Republic of Indonesia, without regard to its conflict of law provisions."
        },
        {
            id: "dispute",
            title: "Dispute Resolution",
            content: "In the event of any dispute arising out of or relating to these Terms, both parties shall attempt to resolve the matter amicably through mutual negotiation. If the dispute cannot be resolved, it shall be submitted to the exclusive jurisdiction of the competent courts in Jakarta, Indonesia."
        },
        {
            id: "general",
            title: "General Terms",
            content: "If any provision of these Terms is held to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights."
        },
        {
            id: "contact",
            title: "Contact Information",
            content: "If you have any questions about these Terms and Conditions, please feel free to contact us at cs@trumap.web.id or send mail to: Kp Jero Suripadan No 20 Rt. 05 Rw. 05, Jakarta Barat, DKI Jakarta, Indonesia."
        }
    ]

    return (
        <div className="flex flex-col min-h-screen">
            <ProgressBar />
            <Navbar />
            <main className="flex-1 container py-32">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Table of Contents - Sidebar */}
                    <div className="md:col-span-1">
                        <div className="sticky top-32 space-y-4">
                            <Button variant="outline" asChild className="w-full justify-start mb-4">
                                <Link href="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Home
                                </Link>
                            </Button>
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium mb-3">On this page</h3>
                                <TableOfContents sections={sections} basePath="/terms" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-3 space-y-8 scroll-smooth">
                        <div>
                            <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
                            <p className="text-muted-foreground">Last updated: June 4, 2025</p>
                        </div>

                        {sections.map((section) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-20 p-4 rounded-lg hover:bg-muted/30 transition-colors"
                            >
                                <h2 className="text-xl font-semibold mb-4 text-primary">{section.title}</h2>
                                <div className="prose max-w-none text-muted-foreground">
                                    <p>
                                        {section.content}
                                    </p>
                                </div>
                            </section>
                        ))}

                        <div className="border-t pt-8 mt-12">
                            <p className="text-sm text-muted-foreground">
                                If you have any questions about these Terms & Conditions, please contact us at{" "}
                                <a href="mailto:legal@trumap.web.id" className="text-primary hover:underline">
                                    legal@trumap.web.id
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
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
        </div>
    )
}
