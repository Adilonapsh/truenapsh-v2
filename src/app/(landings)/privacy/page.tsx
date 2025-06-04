import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TableOfContents } from "@/components/ui/table-of-contents"
import Navbar from "@/components/layouts/navbar"
import { Footer } from "@/components/layouts/footer"
import { TwitterLogoIcon } from "@radix-ui/react-icons"
import { FaGithub } from "react-icons/fa6"
import { ProgressBar } from "@/components/ui/progress-bar"

export default function PrivacyPolicy() {
    // Sample sections for a privacy policy
    const sections = [
        {
            id: "introduction",
            title: "Introduction",
            content: "TrueMaps is a collaborative GIS and mapping platform in the browser. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services. By accessing or using TrueMaps, you agree to the terms described in this policy."
          },
          {
            id: "information-collection",
            title: "Information We Collect",
            content: "We collect information that you provide directly, such as your name, email, and map content, as well as data collected automatically through cookies, IP address, browser type, and usage patterns."
          },
          {
            id: "information-use",
            title: "How We Use Your Information",
            content: "We use your information to provide and improve our services, personalize your experience, facilitate collaborative features like real-time editing, and communicate with you about updates or support."
          },
          {
            id: "information-sharing",
            title: "Information Sharing and Disclosure",
            content: "We do not sell your personal information. We may share data with service providers, legal authorities when required, or collaborators if you explicitly share maps or data through the platform."
          },
          {
            id: "cookies",
            title: "Cookies and Similar Technologies",
            content: "TrueMaps uses cookies and similar tracking technologies to enhance user experience, remember preferences, and analyze platform performance."
          },
          {
            id: "data-security",
            title: "Data Security",
            content: "We implement reasonable measures to protect your data from unauthorized access, loss, or misuse. However, no system is completely secure."
          },
          {
            id: "data-retention",
            title: "Data Retention",
            content: "We retain your personal data for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data at any time."
          },
          {
            id: "your-rights",
            title: "Your Rights and Choices",
            content: "You have the right to access, correct, delete, or restrict use of your data. You can also opt out of certain communications or disable cookies in your browser settings."
          },
          {
            id: "children-privacy",
            title: "Children's Privacy",
            content: "TrueMaps is not intended for children under the age of 13. We do not knowingly collect personal data from minors without parental consent."
          },
          {
            id: "international-transfers",
            title: "International Data Transfers",
            content: "Your data may be stored or processed in countries outside of your own. We ensure adequate protections are in place for such transfers."
          },
          {
            id: "policy-changes",
            title: "Changes to This Privacy Policy",
            content: "We may update this Privacy Policy periodically. Material changes will be notified to users through the platform or email."
          },
          {
            id: "contact-us",
            title: "Contact Us",
            content: "If you have any questions or concerns about this Privacy Policy, please contact us at cs@trumap.web.id or at Kp Jero Suripadan No 20 Rt. 05 Rw. 05, Jakarta Barat, DKI Jakarta."
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
                                <TableOfContents sections={sections} basePath="/privacy" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-3 space-y-8 scroll-smooth">
                        <div>
                            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
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
                                If you have any questions about this Privacy Policy, please contact us at{" "}
                                <a href="mailto:privacy@trumap.web.id" className="text-primary hover:underline">
                                    privacy@trumap.web.id
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
