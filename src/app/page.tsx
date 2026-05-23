'use client'
import {
  Activity,
  ArrowUp,
  ArrowUpRight,
  Box,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cloud,
  Code2,
  Cpu,
  Database,
  Eye,
  FileJson,
  FileSpreadsheet,
  Filter,
  GitBranch,
  Github,
  Globe,
  Hexagon,
  Landmark,
  Layers,
  Linkedin,
  Link2,
  Map as MapIcon,
  Menu,
  Moon,
  MousePointer2,
  Plus,
  Radio,
  Send,
  Server,
  Smartphone,
  Sparkles,
  Sun,
  Twitter,
  Users,
  Maximize,
  RotateCcw,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";

const faqs = [
  {
    q: "Apa itu Truemaps?",
    a: "Truemaps adalah platform Web GIS kolaboratif berbasis cloud yang memungkinkan tim Anda mengolah, memvisualisasikan, dan menganalisis data spasial secara real-time langsung dari browser tanpa instalasi software berat.",
  },
  {
    q: "Bagaimana Truemaps menangani keamanan data?",
    a: "Kami menggunakan enkripsi end-to-end dengan standar enterprise, didukung oleh infrastruktur cloud bersertifikat ISO, serta audit log lengkap untuk memantau setiap perubahan pada data aset Anda.",
  },
  {
    q: "Jenis analisis apa yang bisa saya lakukan?",
    a: "Mulai dari visualisasi vektor/raster dasar, buffer spasial, overlay intersection, hingga rendering 3D untuk infrastruktur bangunan dan manajemen topologi.",
  },
  {
    q: "Apakah Truemaps gratis digunakan?",
    a: "Ya, kami menyediakan paket dasar (Free Tier) yang bisa digunakan selamanya untuk individu atau tim kecil dengan batasan kapasitas data tertentu.",
  },
  {
    q: "Bagaimana cara integrasi dengan data yang sudah ada?",
    a: "Truemaps mendukung berbagai format populer seperti GeoJSON, Shapefile, dan koneksi langsung ke database PostGIS, sehingga Anda tidak perlu memigrasikan data secara manual.",
  },
  {
    q: "Apakah ada biaya tersembunyi?",
    a: "Sama sekali tidak. Paket harga kami transparan. Anda hanya akan diminta melakukan upgrade jika kebutuhan penyimpanan atau beban rendering Anda melampaui batas paket yang dipilih.",
  },
];

interface PipelineNodeProps {
  icon: React.ReactElement;
  text: string;
  hoverBorder: string;
  hoverText: string;
}

const PipelineNode = ({ icon, text, hoverBorder, hoverText }: PipelineNodeProps) => (
  <div
    className={`flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-default group ${hoverBorder}`}
    role="text"
    aria-label={text}
  >
    <div
      className={`text-slate-400 dark:text-neutral-500 transition-colors ${hoverText}`}
      aria-hidden="true"
    >
      {React.cloneElement(icon, { className: "w-5 h-5" } as React.HTMLAttributes<SVGElement>)}
    </div>
    <span
      className={`text-[13px] font-semibold text-slate-700 dark:text-neutral-300 transition-colors ${hoverText}`}
    >
      {text}
    </span>
  </div>
);

interface MockupNodeProps {
  top: string;
  left: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  hasLeftPort?: boolean;
}

const MockupNode = ({
  top,
  left,
  title,
  sub,
  icon,
  bg,
  border,
  hasLeftPort,
}: MockupNodeProps) => (
  <div
    className={`absolute w-[220px] bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-sm flex items-center p-3.5 z-10 hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
    style={{ top, left }}
    tabIndex={0}
    role="button"
    aria-label={`${title} Node`}
  >
    {hasLeftPort && (
      <div
        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 dark:bg-neutral-400 rounded-full border-[2.5px] border-white dark:border-neutral-800"
        aria-hidden="true"
      />
    )}
    <div
      className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 dark:bg-neutral-400 rounded-full border-[2.5px] border-white dark:border-neutral-800"
      aria-hidden="true"
    />
    <div
      className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 border ${bg} ${border} dark:bg-neutral-700 dark:border-neutral-600`}
      aria-hidden="true"
    >
      {icon}
    </div>
    <div>
      <p className="text-[13px] font-bold text-slate-900 dark:text-white">
        {title}
      </p>
      <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
        {sub}
      </p>
    </div>
  </div>
);

interface BentoCardProps {
  className?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  bgGlow: string;
}

const BentoCard = ({ className, icon, title, description, bgGlow }: BentoCardProps) => (
  <article
    className={`group p-8 rounded-[24px] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[260px] ${className}`}
  >
    <div
      className={`absolute -top-10 -right-10 w-40 h-40 ${bgGlow} opacity-40 dark:opacity-20 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-700`}
      aria-hidden="true"
    />
    <div className="relative z-10">
      <div
        className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-neutral-700 transition-all duration-300 shadow-sm"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="text-2xl font-extrabold mb-3 text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-neutral-400 text-[15px] leading-relaxed font-medium">
        {description}
      </p>
    </div>
  </article>
);

const LogoItems = () => (
  <>
    <div className="flex items-center gap-3 text-slate-400 dark:text-neutral-600 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 dark:hover:text-neutral-300 transition-all cursor-default">
      <Building size={28} />
      <span className="text-xl font-bold tracking-tight">
        Truenapsh
      </span>
    </div>
    <div className="flex items-center gap-3 text-slate-400 dark:text-neutral-600 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 dark:hover:text-neutral-300 transition-all cursor-default">
      <Hexagon size={28} />
      <span className="text-xl font-extrabold tracking-tighter">
        SURVEYOR.ID
      </span>
    </div>
    <div className="flex items-center gap-3 text-slate-400 dark:text-neutral-600 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 dark:hover:text-neutral-300 transition-all cursor-default">
      <Cloud size={28} />
      <span className="text-xl font-bold tracking-tight">
        GeoCloud Nusantara
      </span>
    </div>
    <div className="flex items-center gap-3 text-slate-400 dark:text-neutral-600 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 dark:hover:text-neutral-300 transition-all cursor-default">
      <Server size={28} />
      <span className="text-xl font-bold tracking-tight">LogisTech Utama</span>
    </div>
  </>
);

interface FooterGroupProps {
  title: string;
  links: string[];
}

const FooterGroup = ({ title, links }: FooterGroupProps) => (
  <div className="space-y-4">
    <h4 className="text-slate-900 dark:text-white text-[14px] font-bold">
      {title}
    </h4>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link}>
          <a
            href="#"
            className="text-slate-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-[14px] font-medium rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"
          >
            {link}
          </a>
        </li>
      ))}
    </ul>
  </div>
);
interface StackedFormatCardsProps {
  isDropped: boolean;
}

const LayerPanelMockup = ({ isDropped }: { isDropped: boolean }) => (
  <div className="absolute top-4 left-4 z-30 flex flex-col gap-3 pointer-events-none scale-[0.85] origin-top-left">
    {/* Top Row: Search Bar + Action Buttons */}
    <div className="flex items-center gap-3">
      {/* Search Bar */}
      <div className="flex items-center bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-slate-200 dark:border-neutral-800 p-1.5 w-[320px]">
        <div className="flex-1 px-3 text-[13px] text-slate-400">Search for places or coordinates</div>
        <div className="p-2 bg-slate-50 dark:bg-neutral-800 rounded-md">
          <Search size={16} className="text-slate-600 dark:text-slate-400" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-neutral-900 p-1 rounded-lg shadow-lg border border-slate-200 dark:border-neutral-800 flex items-center gap-4">
        <div className="flex gap-4 px-2 border-r border-slate-100 dark:border-neutral-800">
          {['File', 'Edit', 'View'].map(t => <span key={t} className="text-[10px] font-medium text-slate-600 dark:text-neutral-400">{t}</span>)}
        </div>
        <div className="flex items-center gap-2 px-2 text-slate-800 dark:text-neutral-200">
          <span className="text-[13px] font-bold">Indonesia</span>
          <ChevronDown size={14} />
        </div>
      </div>
    </div>

    <div className="flex gap-3">
      {/* Workspaces Panel */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-200 dark:border-neutral-800 w-[280px] overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
          <span className="text-[14px] font-bold text-slate-800 dark:text-neutral-200">Workspaces</span>
          <div className="flex gap-2 text-slate-400">
            <RotateCcw size={14} />
            <Sparkles size={14} />
            <Maximize size={14} />
            <Settings2 size={14} />
            <Plus size={14} />
          </div>
        </div>
        
        <div className="p-2 space-y-1">
          {['Pola Ruang Tangerang', 'Kabupaten'].map((item) => (
            <div key={item} className="flex items-center justify-between p-2.5 rounded-lg text-slate-500 dark:text-neutral-400">
              <div className="flex items-center gap-3">
                <Globe size={16} className="opacity-50" />
                <span className="text-[13px] font-medium">{item}</span>
              </div>
              <ChevronDown size={14} />
            </div>
          ))}
          
          {/* Active Layer: Provinsi (Only appears when dropped) */}
          <div className={`transition-all duration-700 overflow-hidden ${isDropped ? 'opacity-100 max-h-[120px] mt-2' : 'opacity-0 max-h-0 mt-0'}`}>
            <div className={`p-2.5 rounded-lg border bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800`}>
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-3">
                <div className="flex items-center gap-3">
                  <Globe size={16} />
                  <span className="text-[13px] font-bold">Provinsi</span>
                </div>
                <ChevronDown size={14} className="rotate-180" />
              </div>
              
              <div className="flex items-center justify-between px-2">
                <Eye size={14} />
                <Sparkles size={14} />
                <Maximize size={14} />
                <Filter size={14} />
                <Layers size={14} />
                <Trash2 size={14} className="text-rose-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StackedFormatCards = ({ isDropped }: StackedFormatCardsProps) => {
  return (
    <>
      {/* Cursors and Dragging Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        {/* Raka - The Dragger */}
        <div 
          className="absolute top-1/4 left-1/4 flex flex-col items-center" 
          style={{ animation: 'file-drag 8s ease-in-out infinite' }} 
        > 
          <div className="px-3 py-2 bg-blue-600/90 dark:bg-blue-500/90 backdrop-blur-sm rounded-lg border border-blue-400 dark:border-blue-300 shadow-xl flex items-center gap-2 mb-1"> 
            <Box size={14} className="text-white" /> 
            <span className="text-[10px] font-bold text-white">Indonesia Province.shp</span> 
          </div> 
          <div className="flex flex-col items-start ml-8">
            <MousePointer2 className="w-5 h-5 text-blue-600 fill-blue-600" /> 
            <div className="px-2 py-0.5 bg-blue-600 text-[9px] font-bold text-white rounded shadow-sm">Adilonapsh (Admin)</div>
          </div>
        </div> 

        {/* Dina - Static Collaborator */}
        <div className="absolute top-[50%] right-[35%] flex flex-col items-start opacity-80" style={{ animation: 'cursor-float-2 15s ease-in-out infinite' }}>
          <div className="absolute -top-1 -left-1 w-6 h-6 bg-emerald-400/30 rounded-full animate-ripple" />
          <MousePointer2 className="w-5 h-5 text-emerald-600 fill-emerald-600" />
          <div className="px-2 py-0.5 bg-emerald-600 text-[9px] font-bold text-white rounded shadow-sm">Dina (Surveyor)</div>
        </div>

        {/* Fahmi - Static Collaborator */}
        <div className="absolute bottom-[25%] left-[40%] flex flex-col items-start opacity-80" style={{ animation: 'cursor-float-3 18s ease-in-out infinite' }}>
          <MousePointer2 className="w-5 h-5 text-purple-600 fill-purple-600" />
          <div className="px-2 py-0.5 bg-purple-600 text-[9px] font-bold text-white rounded shadow-sm">Fahmi (Analyst)</div>
        </div>
      </div>

      {/* Pop Card (Appears after drop) */}
      <div 
        className="absolute top-1/4 left-1/4 p-3 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-neutral-700 shadow-xl flex items-center gap-3 transition-colors z-30" 
        style={{ animation: 'pop-card 8s ease-in-out infinite' }} 
      > 
        <div className="w-8 h-8 bg-blue-50 dark:bg-neutral-700 rounded flex items-center justify-center border border-blue-100 dark:border-neutral-600"> 
          <Box size={16} className="text-blue-600 dark:text-blue-400" /> 
        </div> 
        <div> 
          <div className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase font-bold tracking-widest">ShapeFile</div> 
          <div className="text-xs font-bold text-slate-900 dark:text-white">Indonesia Province.shp</div> 
        </div> 
      </div> 

    </>
  );
};

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isDropped, setIsDropped] = useState(false);
  
  const [chatStep, setChatStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [aiMessage1Text, setAiMessage1Text] = useState('');
  const [aiMessage2Text, setAiMessage2Text] = useState('');
  const userMessage1 = "Tolong analisis area blank spot fasilitas kesehatan di Bandung dengan radius 2km.";
  const fullAiMessage1 = "Menarik data 142 titik rumah sakit & klinik dari PostGIS... Melakukan analisis spatial buffer 2km... Selesai. Ditemukan 3 kecamatan yang cakupan faskes-nya masih di bawah 60%: Gedebage, Panyileukan, dan Cinambo. Ingin saya tampilkan visualisasinya di peta dan buatkan workflow otomatisnya?";
  const fullAiMessage2 = "Layer \"Blank Spot Faskes\" berhasil ditambahkan ke kanvas Anda dengan highlight warna Merah (#FF0000).";

  useEffect(() => {
    // Sinkronisasi state isDropped dengan animasi CSS 8 detik (file-drag & pop-card)
    // Animasi drop dimulai di 25% (2s) dan selesai di 30% (2.4s)
    const cycleDuration = 8000;
    const dropTime = 2100; // Dimajukan sedikit agar fade-in mulai saat file hampir menyentuh peta

    const runCycle = () => {
      setIsDropped(false);
      
      // Tunggu sampai animasi file-drag "drop" (2.4 detik)
      const dropTimer = setTimeout(() => {
        setIsDropped(true);
      }, dropTime);

      return dropTimer;
    };

    runCycle();
    const interval = setInterval(runCycle, cycleDuration);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    let typingInterval: NodeJS.Timeout | null = null;
    let cycleTimeout: NodeJS.Timeout | null = null;
    
    const cycle = () => {
      if (!active) return;
      
      // Reset
      setChatStep(0);
      setInputText('');
      setAiMessage1Text('');
      setAiMessage2Text('');
      
      // Step 0: Type input
      setTimeout(() => {
        if (!active) return;
        const words = userMessage1.split(' ');
        let i = 0;
        typingInterval = setInterval(() => {
          if (!active) return;
          if (i < words.length) {
            setInputText(words.slice(0, i + 1).join(' '));
            i++;
          } else {
            if (typingInterval) clearInterval(typingInterval);
          }
        }, 150);
      }, 0);

      // Step 1: Show user message & clear input
      setTimeout(() => {
        if (!active) return;
        setChatStep(1);
        setInputText('');
      }, 2000);

      // Step 2: Start AI message 1
      setTimeout(() => {
        if (!active) return;
        setChatStep(2);
        if (typingInterval) clearInterval(typingInterval);
        const words = fullAiMessage1.split(' ');
        let i = 0;
        typingInterval = setInterval(() => {
          if (!active) return;
          if (i < words.length) {
            setAiMessage1Text(words.slice(0, i + 1).join(' '));
            i++;
          } else {
            if (typingInterval) clearInterval(typingInterval);
          }
        }, 120);
      }, 2500);

      // Step 3: AI message 1 complete
      setTimeout(() => {
        if (!active) return;
        setChatStep(3);
      }, 6000);

      // Step 4: Start AI message 2
      setTimeout(() => {
        if (!active) return;
        setChatStep(4);
        if (typingInterval) clearInterval(typingInterval);
        const words = fullAiMessage2.split(' ');
        let i = 0;
        typingInterval = setInterval(() => {
          if (!active) return;
          if (i < words.length) {
            setAiMessage2Text(words.slice(0, i + 1).join(' '));
            i++;
          } else {
            if (typingInterval) clearInterval(typingInterval);
          }
        }, 120);
      }, 6500);

      // Step 5: AI message 2 complete
      setTimeout(() => {
        if (!active) return;
        setChatStep(5);
      }, 7500);

      // Step 6: Show AI message 3
      setTimeout(() => {
        if (!active) return;
        setChatStep(6);
      }, 8000);

      // Next cycle
      cycleTimeout = setTimeout(() => {
        if (!active) return;
        cycle();
      }, 14000);
    };

    cycle();

    return () => {
      active = false;
      if (typingInterval) clearInterval(typingInterval);
      if (cycleTimeout) clearTimeout(cycleTimeout);
    };
  }, [userMessage1, fullAiMessage1, fullAiMessage2]);

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`${isDark ? "dark" : ""}`}>
      <div
        className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-slate-900 dark:text-neutral-100 selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-300"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        <style>{`
             @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
             
             html {
               scroll-behavior: smooth;
             }
   
             @keyframes subtle-float {
               0%, 100% { transform: translateY(0px); }
               50% { transform: translateY(-8px); }
             }
             .animate-float { animation: subtle-float 6s ease-in-out infinite; }
             
             .bg-grid-pattern {
               background-image: radial-gradient(circle, #00000008 1.5px, transparent 1.5px);
               background-size: 32px 32px;
             }
   
             .dark .bg-grid-pattern {
               background-image: radial-gradient(circle, #ffffff08 1.5px, transparent 1.5px);
             }
             
             @keyframes cursor-float-1 {
               0%, 100% { transform: translate(0px, 0px); }
               33% { transform: translate(120px, 60px); }
               66% { transform: translate(40px, 140px); }
             }
             @keyframes cursor-float-2 {
               0%, 100% { transform: translate(0px, 0px); }
               33% { transform: translate(-100px, 80px); }
               66% { transform: translate(-150px, -20px); }
             }

             @keyframes cursor-float-3 {
               0%, 100% { transform: translate(0px, 0px); }
               33% { transform: translate(150px, -40px); }
               66% { transform: translate(80px, -120px); }
             }

             @keyframes click-ripple {
               0% { transform: scale(0.5); opacity: 1; }
               100% { transform: scale(2.5); opacity: 0; }
             }
             .animate-ripple { animation: click-ripple 2s ease-out infinite; }

             @keyframes file-drag { 
               0%, 5% { transform: translate(150px, 120px) rotate(5deg) scale(1.1); opacity: 0; } 
               10% { transform: translate(150px, 120px) rotate(5deg) scale(1.1); opacity: 1; } 
               25% { transform: translate(0px, -10px) rotate(0deg) scale(1); opacity: 1; } 
               30% { transform: translate(0px, 0px) scale(0.9); opacity: 0; } 
               100% { transform: translate(0px, 0px) scale(0.9); opacity: 0; } 
             } 
             .animate-file-drag { animation: file-drag 8s ease-in-out infinite; }

             @keyframes pop-card {
               0%, 28% { transform: scale(0.9); opacity: 0; }
               32% { transform: scale(1.05); opacity: 1; }
               35%, 95% { transform: scale(1); opacity: 1; }
               100% { transform: scale(0.9); opacity: 0; }
             }
             .animate-pop-card { animation: pop-card 8s ease-in-out infinite; }
             
             .path-animate {
               stroke-dasharray: 8;
               animation: dash-flow 1s linear infinite;
             }
             @keyframes dash-flow {
               to { stroke-dashoffset: -16; }
             }
   
             .premium-shadow {
               box-shadow: 0 12px 40px -12px rgba(0,0,0,0.06);
             }
   
             .dark .premium-shadow {
               box-shadow: 0 12px 40px -12px rgba(0,0,0,0.4);
             }
             
             .chat-scrollbar::-webkit-scrollbar {
               width: 6px;
             }
             .chat-scrollbar::-webkit-scrollbar-track {
               background: transparent;
             }
             .chat-scrollbar::-webkit-scrollbar-thumb {
               background-color: #cbd5e1;
               border-radius: 20px;
             }
             .dark .chat-scrollbar::-webkit-scrollbar-thumb {
               background-color: #404040;
             }
   
             @keyframes marquee {
               0% { transform: translateX(0); }
               100% { transform: translateX(-50%); }
             }
             .animate-marquee {
               animation: marquee 30s linear infinite;
             }
             
             *:focus-visible {
               outline: 2px solid #2563EB;
               outline-offset: 2px;
               border-radius: 4px;
             }

             .format-card {
               transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
             }

             .group:hover .format-card-0 { transform: translateY(0px) !important; opacity: 1 !important; z-index: 50 !important; }
             .group:hover .format-card-1 { transform: translateY(60px) !important; opacity: 1 !important; z-index: 40 !important; }
             .group:hover .format-card-2 { transform: translateY(120px) !important; opacity: 1 !important; z-index: 30 !important; }
             .group:hover .format-card-3 { transform: translateY(180px) !important; opacity: 1 !important; z-index: 20 !important; }
             .group:hover .format-card-4 { transform: translateY(240px) !important; opacity: 1 !important; z-index: 10 !important; }
           `}</style>

        {/* Scroll To Top Button */}
        <button
          onClick={scrollToTop}
          aria-label="Kembali ke atas"
          className={`fixed bottom-8 right-8 p-3.5 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-all duration-300 z-50 hover:bg-blue-700 hover:-translate-y-1 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0A0A0A] ${showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}
        >
          <ArrowUp size={20} />
        </button>

        {/* Floating Pill Navigation */}
        <header
          className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 pt-6 px-4 md:px-6`}
        >
          <div
            className={`mx-auto max-w-5xl flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 ${scrolled ? "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-neutral-900/80 border border-slate-200/80 dark:border-neutral-800" : "bg-white dark:bg-neutral-900 shadow-md shadow-slate-200/20 dark:shadow-neutral-900/20 border border-slate-100 dark:border-neutral-800"}`}
          >
            {/* Custom Logo Container */}
            <a
              href="#"
              onClick={(e) => handleNavClick(e, "home")}
              className="flex items-center gap-2.5 focus-visible:ring-offset-4 rounded-full"
              aria-label="Beranda Truemaps"
            >
              <Image
                src="/assets/logo.png"
                alt="Truenapsh"
                width={26}
                height={26}
                className="shrink-0"
                aria-hidden="true"
              />
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                TrueMaps
              </span>
            </a>

            {/* Center Links */}
            <nav
              aria-label="Navigasi Utama"
              className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-600 dark:text-neutral-300"
            >
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTop();
                }}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Home
              </a>
              <a
                href="#fitur"
                onClick={(e) => handleNavClick(e, "fitur")}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Fitur
              </a>
              <a
                href="#testimoni"
                onClick={(e) => handleNavClick(e, "testimoni")}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Testimoni
              </a>
              <a
                href="#faq"
                onClick={(e) => handleNavClick(e, "faq")}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors focus-visible:ring-offset-2"
                aria-label="Toggle Dark Mode"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <a href="/auth/login" className="hidden md:block bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all hover:bg-slate-800 dark:hover:bg-neutral-200 active:scale-95 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0A0A0A]">
                Gabung
              </a>

              <button
                className="md:hidden p-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors focus-visible:ring-offset-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label="Buka menu navigasi"
              >
                {isMenuOpen ? (
                  <X size={20} aria-hidden="true" />
                ) : (
                  <Menu size={20} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-[80px] left-4 right-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl rounded-2xl py-4 px-6 flex flex-col gap-4 z-50">
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTop();
                  setIsMenuOpen(false);
                }}
                className="text-slate-600 dark:text-neutral-300 font-semibold py-2"
              >
                Home
              </a>
              <a
                href="#fitur"
                onClick={(e) => handleNavClick(e, "fitur")}
                className="text-slate-600 dark:text-neutral-300 font-semibold py-2"
              >
                Fitur
              </a>
              <a
                href="#testimoni"
                onClick={(e) => handleNavClick(e, "testimoni")}
                className="text-slate-600 dark:text-neutral-300 font-semibold py-2"
              >
                Testimoni
              </a>
              <a
                href="#faq"
                onClick={(e) => handleNavClick(e, "faq")}
                className="text-slate-600 dark:text-neutral-300 font-semibold py-2"
              >
                FAQ
              </a>
              <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold w-full mt-2">
                Gabung
              </button>
            </div>
          )}
        </header>

        <main>
          {/* Hero Section */}
          <section
            className="relative pt-52 pb-32 px-6 overflow-hidden bg-grid-pattern"
            aria-labelledby="hero-heading"
          >
            <div
              className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-blue-100/60 dark:bg-blue-900/10 blur-[120px] rounded-full -z-10 transition-colors duration-500"
              aria-hidden="true"
            />
            <div
              className="absolute top-40 right-0 w-[500px] h-[500px] bg-indigo-50/50 dark:bg-indigo-900/10 blur-[120px] rounded-full -z-10 transition-colors duration-500"
              aria-hidden="true"
            />

            <div className="max-w-7xl mx-auto text-center">
              <div
                className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-700 dark:text-neutral-200 mb-10 shadow-sm"
                role="status"
              >
                <GitBranch size={16} className="text-blue-600 dark:text-blue-400" />
                Introducing Workflow Node
              </div>

              <h1
                id="hero-heading"
                className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-10 leading-[1] text-slate-900 dark:text-white transition-colors"
              >
                Analisis Spasial <br />
                <span className="text-blue-600 dark:text-blue-500">
                  Tanpa Batas.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-600 dark:text-neutral-400 mb-16 max-w-3xl mx-auto leading-relaxed font-medium transition-colors">
                Platform Web GIS kelas{" "}
                <span className="text-slate-900 dark:text-white font-semibold">
                  enterprise
                </span>{" "}
                yang memindahkan kompleksitas desktop ke kelincahan cloud.
                Kolaborasi real-time untuk tim yang presisi.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="/auth/register" className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 group focus-visible:ring-offset-2">
                  Mulai Eksplorasi
                  <ArrowUpRight
                    size={22}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                    aria-hidden="true"
                  />
                </a>
                <button className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 rounded-2xl font-bold text-lg transition-all shadow-md focus-visible:ring-offset-2">
                  Konsultasi Enterprise
                </button>
              </div>
            </div>

            {/* Hero Interactive App Mockup */}
            <div
              className="mt-28 max-w-[1400px] mx-auto relative animate-float"
              aria-hidden="true"
            >
              <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 p-3 premium-shadow transition-colors">
                <div className="rounded-[2rem] border border-slate-100 dark:border-neutral-800 bg-[#F8FAFC] dark:bg-neutral-950 overflow-hidden relative shadow-inner">
                  {/* Header UI Mockup */}
                  <div className="h-12 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between px-4 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-neutral-700" />
                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-neutral-700" />
                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-neutral-700" />
                      </div>
                      <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700" />
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono bg-slate-100 dark:bg-neutral-800 px-3 py-1 rounded-md">
                        trumap.web.id/project-alpha-v2
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full border-2 border-white dark:border-neutral-900 bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-neutral-400 shadow-sm"
                          >
                            U{i}
                          </div>
                        ))}
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-3 py-1 rounded-md font-bold border border-emerald-200 dark:border-emerald-500/20">
                        LIVE
                      </div>
                    </div>
                  </div>

                  <div className="relative aspect-[16/9] bg-white dark:bg-[#0A0A0A] group overflow-hidden transition-colors">
                    {/* Background Images - Init is static, Drop fades in over it */}
                    <img
                      src="/assets/landing/init.png"
                      alt="Antarmuka peta awal"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <img
                      src="/assets/landing/drop.png"
                      alt="Antarmuka peta setelah drop"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isDropped ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* All Interactive Elements managed by StackedFormatCards */}
                    <LayerPanelMockup isDropped={isDropped} />
                    <StackedFormatCards isDropped={isDropped} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social Proof / Trusted By Logo Banner */}
          <section
            id="testimoni"
            className="py-10 border-b border-slate-200/60 dark:border-neutral-800/60 bg-[#FAFAFA] dark:bg-[#0A0A0A] overflow-hidden transition-colors"
            aria-labelledby="clients-heading"
          >
            <div className="max-w-7xl mx-auto px-6 mb-6">
              <h2
                id="clients-heading"
                className="text-center text-sm font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest"
              >
                Dipercaya oleh institusi inovatif di seluruh Indonesia
              </h2>
            </div>

            <div className="relative w-full flex overflow-x-hidden">
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#FAFAFA] dark:from-[#0A0A0A] to-transparent z-10 pointer-events-none transition-colors" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#FAFAFA] dark:from-[#0A0A0A] to-transparent z-10 pointer-events-none transition-colors" />

              <div className="flex items-center whitespace-nowrap animate-marquee gap-16 py-4 hover:[animation-play-state:paused]">
                <div className="flex items-center gap-16" aria-hidden="false">
                  <LogoItems />
                </div>
                <div className="flex items-center gap-16" aria-hidden="true">
                  <LogoItems />
                </div>
              </div>
            </div>
          </section>

          {/* Fitur / Engine Tangguh */}
          <section
            id="fitur"
            className="py-32 px-6 bg-[#FAFAFA] dark:bg-[#0A0A0A] transition-colors"
            aria-labelledby="fitur-heading"
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                <div className="max-w-2xl">
                  <h2
                    id="fitur-heading"
                    className="text-4xl font-extrabold tracking-tight mb-5 text-slate-900 dark:text-white leading-tight"
                  >
                    Engine Tangguh. <br />
                    <span className="text-slate-400 dark:text-neutral-500">
                      Didesain untuk Skala Besar.
                    </span>
                  </h2>
                  <p className="text-slate-600 dark:text-neutral-400 text-lg leading-relaxed font-medium">
                    Kami mengombinasikan infrastruktur spasial terbaik untuk
                    memastikan performa tidak pernah menjadi hambatan Anda.
                  </p>
                </div>
                <div
                  className="flex flex-wrap gap-3 pb-2"
                  aria-label="Teknologi inti"
                >
                  <span className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-slate-600 dark:text-neutral-300 shadow-sm">
                    PostGIS
                  </span>
                  <span className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-slate-600 dark:text-neutral-300 shadow-sm">
                    Mapbox
                  </span>
                  <span className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-slate-600 dark:text-neutral-300 shadow-sm">
                    WebGL
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <BentoCard
                  icon={
                    <Users
                      className="text-blue-600 dark:text-blue-400"
                      size={26}
                    />
                  }
                  title="Kolaborasi Spasial Real-Time"
                  description="Edit geometri, tambahkan atribut, dan beri anotasi pada layer peta secara bersamaan dengan seluruh tim tanpa risiko konflik file .shp."
                  bgGlow="bg-blue-100 dark:bg-blue-900/30"
                />
                <BentoCard
                  icon={
                    <Layers
                      className="text-amber-500 dark:text-amber-400"
                      size={26}
                    />
                  }
                  title="Rendering 3D & Vektor Berat"
                  description="Didukung WebGL mutakhir, sistem kami mampu me-render jutaan titik data, poligon kompleks, hingga model bangunan 3D tanpa membuat browser lag."
                  bgGlow="bg-amber-100 dark:bg-amber-900/30"
                />
                <BentoCard
                  icon={
                    <Hexagon
                      className="text-emerald-600 dark:text-emerald-400"
                      size={26}
                    />
                  }
                  title="Topologi & Manajemen Aset"
                  description="Sistem validasi geometri ketat untuk memastikan tidak ada tumpang tindih (overlap) batas pada data tata ruang dan infrastruktur daerah."
                  bgGlow="bg-emerald-100 dark:bg-emerald-900/30"
                />
                <BentoCard
                  icon={
                    <Database
                      className="text-indigo-600 dark:text-indigo-400"
                      size={26}
                    />
                  }
                  title="Cloud-Native PostGIS"
                  description="Infrastruktur database spasial kelas industri yang otomatis ter-skala dan siap diintegrasikan ke aplikasi internal Anda lewat REST API."
                  bgGlow="bg-indigo-100 dark:bg-indigo-900/30"
                />
              </div>
            </div>
          </section>

          {/* Flow Builder Horizontal */}
          <section
            id="flow"
            className="py-32 px-6 bg-white dark:bg-[#0A0A0A] border-y border-slate-200/60 dark:border-neutral-800/60 overflow-hidden transition-colors"
            aria-labelledby="flow-heading"
          >
            <div className="max-w-7xl mx-auto mb-16 text-center">
              <h2
                id="flow-heading"
                className="text-4xl font-extrabold tracking-tight mb-5 text-slate-900 dark:text-white"
              >
                Flow Builder <br />
                <span className="text-slate-400 dark:text-neutral-500 font-medium">
                  Masa Depan Automasi Spasial.
                </span>
              </h2>
              <p className="text-slate-600 dark:text-neutral-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                Bangun logika pemrosesan data kompleks secara visual dari kiri
                ke kanan. Hubungkan <i>node</i> tanpa menulis satu baris kode
                pun.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 premium-shadow p-2 relative overflow-hidden transition-colors"
                aria-hidden="true"
              >
                {/* Header Canvas */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 z-20 relative transition-colors">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-slate-400 dark:text-neutral-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                      Workflow_Automation_01
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 rounded-md text-xs font-bold">
                      Auto-saved
                    </span>
                  </div>
                </div>

                {/* Canvas Area */}
                <div
                  className="w-full relative bg-[#F8FAFC] dark:bg-[#0A0A0A] h-[500px] overflow-x-auto overflow-y-hidden transition-colors"
                  style={{
                    backgroundImage: isDark
                      ? "radial-gradient(#404040 1.5px, transparent 1.5px)"
                      : "radial-gradient(#CBD5E1 1.5px, transparent 1.5px)",
                    backgroundSize: "24px 24px",
                  }}
                >
                  <div className="w-[1000px] h-full relative mx-auto">
                    {/* SVG Connecting Lines */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none z-0"
                      viewBox="0 0 1000 500"
                    >
                      <path
                        d="M 270 126 C 350 126, 350 246, 430 246"
                        stroke={isDark ? "#525252" : "#94A3B8"}
                        strokeWidth="2.5"
                        fill="none"
                        strokeDasharray="6,6"
                        className="path-animate"
                      />
                      <path
                        d="M 270 366 C 350 366, 350 246, 430 246"
                        stroke={isDark ? "#525252" : "#94A3B8"}
                        strokeWidth="2.5"
                        fill="none"
                        strokeDasharray="6,6"
                        className="path-animate"
                      />
                      <path
                        d="M 650 246 C 710 246, 710 246, 770 246"
                        stroke={isDark ? "#525252" : "#94A3B8"}
                        strokeWidth="2.5"
                        fill="none"
                        strokeDasharray="6,6"
                        className="path-animate"
                      />
                    </svg>

                    {/* Nodes */}
                    <MockupNode
                      top="90px"
                      left="50px"
                      title="Webhook"
                      sub="Source Node"
                      icon={
                        <Link2 className="text-orange-500 dark:text-orange-400 w-4 h-4" />
                      }
                      bg="bg-orange-50 dark:bg-orange-900/20"
                      border="border-orange-100 dark:border-orange-900/50"
                    />
                    <MockupNode
                      top="330px"
                      left="50px"
                      title="Map Data"
                      sub="PostGIS Source"
                      icon={
                        <MapIcon className="text-blue-600 dark:text-blue-400 w-4 h-4" />
                      }
                      bg="bg-blue-50 dark:bg-blue-900/20"
                      border="border-blue-100 dark:border-blue-900/50"
                    />

                    {/* Process Node */}
                    <div
                      className="absolute top-[210px] left-[430px] w-[220px] bg-white dark:bg-neutral-800 border border-blue-400 dark:border-blue-500 rounded-xl shadow-md flex items-center p-3.5 z-10 hover:shadow-lg transition-shadow cursor-pointer ring-4 ring-blue-50 dark:ring-blue-900/20 focus-visible:outline-none focus-visible:ring-offset-2"
                      tabIndex={0}
                      role="button"
                    >
                      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 dark:bg-neutral-400 rounded-full border-[2.5px] border-white dark:border-neutral-800" />
                      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 dark:bg-neutral-400 rounded-full border-[2.5px] border-white dark:border-neutral-800" />
                      <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-neutral-700 flex items-center justify-center mr-3 border border-slate-200 dark:border-neutral-600">
                        <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                          Filter Polygon
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                          Transform Node
                        </p>
                      </div>
                    </div>

                    <MockupNode
                      top="210px"
                      left="770px"
                      title="Buffer Layer"
                      sub="Output Node"
                      icon={
                        <Activity className="text-purple-600 dark:text-purple-400 w-4 h-4" />
                      }
                      bg="bg-purple-50 dark:bg-purple-900/20"
                      border="border-purple-100 dark:border-purple-900/50"
                      hasLeftPort
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AI Assistant Section */}
          <section
            id="ai"
            className="py-32 px-6 bg-[#FAFAFA] dark:bg-[#0A0A0A] transition-colors"
            aria-labelledby="ai-heading"
          >
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
              {/* Left Column: Descriptions */}
              <div className="lg:w-[45%]">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400 mb-6">
                  <Sparkles
                    size={14}
                    className="fill-blue-600 dark:fill-blue-400"
                    aria-hidden="true"
                  />
                  <span>Memperkenalkan Truemaps AI</span>
                </div>

                <h2
                  id="ai-heading"
                  className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white leading-tight"
                >
                  Analisis Peta Lewat{" "}
                  <span className="text-blue-600 dark:text-blue-500">
                    Percakapan.
                  </span>
                </h2>

                <p className="text-slate-600 dark:text-neutral-400 text-lg mb-8 leading-relaxed font-medium">
                  Ucapkan selamat tinggal pada menu navigasi yang rumit. Cari
                  lokasi, analisis tren, dan buat aksi peta otomatis hanya
                  dengan memberikan instruksi bahasa natural.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div
                      className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                        Analisis Data Cerdas
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                        Lakukan query spasial kompleks seperti analisis buffer
                        radius dan deteksi pola data aset langsung melalui
                        percakapan.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div
                      className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <GitBranch className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                        Automasi Workflow & Render
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                        Biarkan AI menyusun struktur node Flow Builder secara
                        instan dan me-render visualisasi hasilnya ke atas kanvas
                        peta Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Chat Mockup UI */}
              <div
                className="lg:w-[55%] w-full flex justify-center"
                aria-hidden="true"
              >
                <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-[1.5rem] shadow-2xl premium-shadow flex flex-col h-[650px] overflow-hidden transition-colors">
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 shrink-0 transition-colors">
                    <div className="flex items-center gap-3">
                      <Menu className="w-5 h-5 text-slate-600 dark:text-neutral-400 cursor-pointer" />
                      <div className="flex items-center text-[15px] font-bold text-slate-800 dark:text-neutral-200 cursor-pointer">
                        <span className="text-slate-400 dark:text-neutral-500 font-medium mr-1">
                          Chats
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-500 mx-1" />
                        <span className="truncate max-w-[180px]">
                          Analisis Faskes Bandung
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-neutral-500 ml-1" />
                      </div>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                      <Plus className="w-5 h-5 text-slate-600 dark:text-neutral-400" />
                    </button>
                  </div>

                  {/* Chat Messages Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-neutral-900 chat-scrollbar transition-colors">
                    {/* User Message 1 */}
                    <div className={`flex justify-end transition-all duration-500 ${chatStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                      <div className="bg-[#2563EB] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-[14px] font-medium max-w-[80%] leading-relaxed">
                        {userMessage1}
                      </div>
                    </div>

                    {/* AI Message 1 */}
                    {chatStep >= 2 && (
                      <div className={`flex justify-start transition-all duration-500 ${chatStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl p-4 w-full max-w-[90%] shadow-sm">
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-neutral-700">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                              <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                                Spatial Query & Buffer
                              </span>
                            </div>
                            {chatStep < 3 ? (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <p className="text-[14px] text-slate-700 dark:text-neutral-300 leading-relaxed">
                            {aiMessage1Text}
                            {chatStep === 2 && <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-slate-600 dark:bg-neutral-400 animate-pulse" />}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI Message 2 */}
                    {chatStep >= 4 && (
                      <div className={`flex justify-start transition-all duration-500 ${chatStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl p-4 w-full max-w-[90%] shadow-sm">
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-neutral-700">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                                Render Map Layer
                              </span>
                            </div>
                            {chatStep < 5 ? (
                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            )}
                          </div>
                          <p className="text-[14px] text-slate-700 dark:text-neutral-300 leading-relaxed">
                            {aiMessage2Text}
                            {chatStep === 4 && <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-slate-600 dark:bg-neutral-400 animate-pulse" />}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI Message 3 - Workflow */}
                    {chatStep >= 6 && (
                      <div className={`flex justify-start transition-all duration-700 ${chatStep >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl p-4 w-full max-w-[90%] shadow-sm">
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-neutral-700">
                            <div className="flex items-center gap-2">
                              <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                                Generate Node Workflow
                              </span>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                          </div>
                          <p className="text-[14px] text-slate-700 dark:text-neutral-300 leading-relaxed mb-3">
                            Saya juga telah menyusun draft di{" "}
                            <b className="dark:text-white">Flow Builder</b> untuk
                            Anda:
                          </p>
                          <div className="bg-[#F8FAFC] dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 flex items-center gap-2 text-[12px] font-mono text-slate-600 dark:text-neutral-400 overflow-x-auto">
                            <span className={`bg-white dark:bg-neutral-800 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-neutral-700 transition-all duration-500 ${chatStep >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} style={{ transitionDelay: '0ms' }}>
                              API_Dinkes
                            </span>
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 transition-all duration-500" style={{ transitionDelay: '200ms' }} />
                            <span className={`bg-white dark:bg-neutral-800 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-neutral-700 transition-all duration-500 ${chatStep >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} style={{ transitionDelay: '400ms' }}>
                              Buffer_2KM
                            </span>
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 transition-all duration-500" style={{ transitionDelay: '600ms' }} />
                            <span className={`bg-white dark:bg-neutral-800 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-neutral-700 border-l-2 border-l-emerald-500 dark:border-l-emerald-500 transition-all duration-500 ${chatStep >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} style={{ transitionDelay: '800ms' }}>
                              Update_Map
                            </span>
                          </div>
                          <p className="text-[13px] text-slate-500 dark:text-neutral-400 mt-3 font-medium transition-all duration-700" style={{ transitionDelay: '1000ms' }}>
                            Workflow ini akan berjalan otomatis setiap Senin jam
                            08:00.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input Area (Accessible Form) */}
                  <form
                    className="p-4 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 shrink-0 transition-colors"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="relative border border-slate-300 dark:border-neutral-700 rounded-2xl bg-white dark:bg-neutral-800 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                      <textarea
                        rows={1}
                        placeholder="Ask me anything, @ for mentions, / for commands"
                        aria-label="Ketik pesan ke AI"
                        value={inputText}
                        readOnly
                        className="w-full text-[14px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 bg-transparent py-3.5 pl-4 pr-12 focus:outline-none resize-none max-h-32 min-h-[52px] leading-relaxed whitespace-pre-wrap"
                      />
                      <button
                        type="button"
                        aria-label="Kirim Pesan"
                        className={`absolute right-2 bottom-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm ${chatStep < 1 ? 'bg-white dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 text-slate-600 dark:text-neutral-300' : 'bg-blue-600 border border-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* Ekosistem / Integrasi Section */}
          <section
            id="integrasi"
            className="py-32 px-6 bg-[#FAFAFA] dark:bg-[#0A0A0A] border-t border-slate-200 dark:border-neutral-800 relative overflow-hidden transition-colors"
            aria-labelledby="pipeline-heading"
          >
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
              style={{
                backgroundImage: isDark
                  ? "radial-gradient(#ffffff 1.5px, transparent 1.5px)"
                  : "radial-gradient(#000 1.5px, transparent 1.5px)",
                backgroundSize: "32px 32px",
              }}
              aria-hidden="true"
            />

            <div className="max-w-4xl mx-auto text-center mb-24 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-600 dark:text-neutral-300 mb-6 shadow-sm">
                <GitBranch
                  size={14}
                  className="text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
                <span>End-to-End Pipeline</span>
              </div>
              <h2
                id="pipeline-heading"
                className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white leading-tight"
              >
                Alur Kerja Spasial <br />{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  Satu Pintu.
                </span>
              </h2>
              <p className="text-slate-600 dark:text-neutral-400 text-lg leading-relaxed font-medium">
                Dari integrasi data mentah hingga distribusi hasil akhir melalui
                API. Truemaps menyederhanakan arsitektur spasial yang kompleks
                menjadi pipeline 4 langkah yang rapi.
              </p>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
              {/* Animated Connecting Line */}
              <div
                className="hidden md:block absolute top-[48px] left-[12.5%] right-[12.5%] h-[2px] z-0"
                aria-hidden="true"
              >
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <line
                    x1="0"
                    y1="1"
                    x2="100%"
                    y2="1"
                    stroke={isDark ? "#404040" : "#e2e8f0"}
                    strokeWidth="2.5"
                    strokeDasharray="8,8"
                  />
                  <line
                    x1="0"
                    y1="1"
                    x2="100%"
                    y2="1"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeDasharray="8,8"
                    className="path-animate"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
                {/* 1. INPUT */}
                <article className="flex flex-col relative">
                  <div
                    className="w-24 h-24 mx-auto bg-white dark:bg-neutral-900 rounded-full border-[6px] border-[#FAFAFA] dark:border-[#0A0A0A] shadow-xl shadow-blue-900/5 dark:shadow-none flex flex-col items-center justify-center relative z-10 mb-6 transition-transform hover:scale-105 duration-300"
                    aria-hidden="true"
                  >
                    <Database className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                  </div>
                  <h3 className="text-center text-[15px] font-extrabold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">
                    1. Input
                  </h3>
                  <div className="space-y-3 px-2">
                    <PipelineNode
                      icon={<Database />}
                      text="PostgreSQL / PostGIS"
                      hoverBorder="hover:border-blue-300 dark:hover:border-blue-500"
                      hoverText="group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    />
                    <PipelineNode
                      icon={<Server />}
                      text="GeoJSON / SHP Files"
                      hoverBorder="hover:border-blue-300 dark:hover:border-blue-500"
                      hoverText="group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    />
                    <PipelineNode
                      icon={<Cloud />}
                      text="Http Fetch"
                      hoverBorder="hover:border-blue-300 dark:hover:border-blue-500"
                      hoverText="group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    />
                  </div>
                </article>

                {/* 2. VISUAL */}
                <article className="flex flex-col relative">
                  <div
                    className="w-24 h-24 mx-auto bg-white dark:bg-neutral-900 rounded-full border-[6px] border-[#FAFAFA] dark:border-[#0A0A0A] shadow-xl shadow-purple-900/5 dark:shadow-none flex flex-col items-center justify-center relative z-10 mb-6 transition-transform hover:scale-105 duration-300"
                    aria-hidden="true"
                  >
                    <Eye className="w-8 h-8 text-purple-600 dark:text-purple-500" />
                  </div>
                  <h3 className="text-center text-[15px] font-extrabold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">
                    2. Visual
                  </h3>
                  <div className="space-y-3 px-2">
                    <PipelineNode
                      icon={<MapIcon />}
                      text="Mapbox GL JS"
                      hoverBorder="hover:border-purple-300 dark:hover:border-purple-500"
                      hoverText="group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    />
                    <PipelineNode
                      icon={<Layers />}
                      text="Vector Tile Engine"
                      hoverBorder="hover:border-purple-300 dark:hover:border-purple-500"
                      hoverText="group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    />
                    <PipelineNode
                      icon={<Box />}
                      text="3D Building Models"
                      hoverBorder="hover:border-purple-300 dark:hover:border-purple-500"
                      hoverText="group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    />
                  </div>
                </article>

                {/* 3. ANALYSIS */}
                <article className="flex flex-col relative">
                  <div
                    className="w-24 h-24 mx-auto bg-white dark:bg-neutral-900 rounded-full border-[6px] border-[#FAFAFA] dark:border-[#0A0A0A] shadow-xl shadow-emerald-900/5 dark:shadow-none flex flex-col items-center justify-center relative z-10 mb-6 transition-transform hover:scale-105 duration-300"
                    aria-hidden="true"
                  >
                    <Cpu className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <h3 className="text-center text-[15px] font-extrabold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">
                    3. Analysis
                  </h3>
                  <div className="space-y-3 px-2">
                    <PipelineNode
                      icon={<Activity />}
                      text="Spatial Query"
                      hoverBorder="hover:border-emerald-300 dark:hover:border-emerald-500"
                      hoverText="group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    />
                    <PipelineNode
                      icon={<Sparkles />}
                      text="AI Data Insights"
                      hoverBorder="hover:border-emerald-300 dark:hover:border-emerald-500"
                      hoverText="group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    />
                    <PipelineNode
                      icon={<GitBranch />}
                      text="Workflow Auto"
                      hoverBorder="hover:border-emerald-300 dark:hover:border-emerald-500"
                      hoverText="group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    />
                  </div>
                </article>

                {/* 4. EXPORT */}
                <article className="flex flex-col relative">
                  <div
                    className="w-24 h-24 mx-auto bg-white dark:bg-neutral-900 rounded-full border-[6px] border-[#FAFAFA] dark:border-[#0A0A0A] shadow-xl shadow-orange-900/5 dark:shadow-none flex flex-col items-center justify-center relative z-10 mb-6 transition-transform hover:scale-105 duration-300"
                    aria-hidden="true"
                  >
                    <Send className="w-8 h-8 text-orange-600 dark:text-orange-500 ml-1" />
                  </div>
                  <h3 className="text-center text-[15px] font-extrabold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">
                    4. Export
                  </h3>
                  <div className="space-y-3 px-2">
                    <PipelineNode
                      icon={<Code2 />}
                      text="REST API & GraphQL"
                      hoverBorder="hover:border-orange-300 dark:hover:border-orange-500"
                      hoverText="group-hover:text-orange-600 dark:group-hover:text-orange-400"
                    />
                    <PipelineNode
                      icon={<FileSpreadsheet />}
                      text="CSV / Excel File"
                      hoverBorder="hover:border-orange-300 dark:hover:border-orange-500"
                      hoverText="group-hover:text-orange-600 dark:group-hover:text-orange-400"
                    />
                    <PipelineNode
                      icon={<Radio />}
                      text="Event Webhooks"
                      hoverBorder="hover:border-orange-300 dark:hover:border-orange-500"
                      hoverText="group-hover:text-orange-600 dark:group-hover:text-orange-400"
                    />
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* FAQ Section - Clean & Accurate to Current Design */}
          <section
            id="faq"
            className="py-32 px-6 bg-[#FAFAFA] dark:bg-[#0A0A0A] border-t border-slate-200 dark:border-neutral-800 transition-colors"
            aria-labelledby="faq-heading"
          >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-20 items-start">
              {/* Left Column: Heading & Description (Professional Sidebar Style) */}
              <div className="md:w-[40%] md:sticky top-32">
                <div className="mb-6 flex justify-start" aria-hidden="true">
                  <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 shadow-sm flex items-center justify-center">
                    <Sparkles className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                  </div>
                </div>
                <h2
                  id="faq-heading"
                  className="text-4xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white leading-tight"
                >
                  Frequently asked <br />{" "}
                  <span className="text-blue-600 dark:text-blue-500">
                    questions
                  </span>
                </h2>
                <p className="text-slate-600 dark:text-neutral-400 text-[15px] leading-relaxed mb-8 font-medium">
                  Temukan jawaban cepat seputar fitur, keamanan, harga, dan
                  kemampuan integrasi yang dimiliki oleh platform Truemaps untuk
                  kebutuhan spasial tim Anda.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-all group rounded-lg focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0A0A0A]"
                >
                  Lihat Dokumentasi Lengkap
                  <ChevronRight
                    size={18}
                    className="text-slate-400 dark:text-neutral-500 group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all"
                    aria-hidden="true"
                  />
                </a>
              </div>

              {/* Right Column: Accessible & Minimalist Accordion List */}
              <div className="md:w-[60%] w-full">
                <div className="border-t border-slate-200 dark:border-neutral-800">
                  {faqs.map((faq, index) => {
                    const isOpen = activeFaq === index;
                    return (
                      <div
                        key={faq.q}
                        className="border-b border-slate-200 dark:border-neutral-800"
                      >
                        <h3>
                          <button
                            onClick={() => setActiveFaq(isOpen ? null : index)}
                            className="w-full flex items-center justify-between py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm group transition-all"
                            aria-expanded={isOpen}
                            aria-controls={`faq-answer-${index}`}
                            id={`faq-button-${index}`}
                          >
                            <span
                              className={`text-[16px] font-bold tracking-tight transition-colors duration-300 ${isOpen ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-neutral-200 group-hover:text-slate-500 dark:group-hover:text-neutral-400"}`}
                            >
                              {faq.q}
                            </span>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? "bg-blue-50 dark:bg-neutral-800 rotate-180" : "bg-slate-50 dark:bg-neutral-800/50 group-hover:bg-slate-100 dark:group-hover:bg-neutral-700"}`}
                            >
                              <ChevronDown
                                className={`w-4 h-4 ${isOpen ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-neutral-500"}`}
                                aria-hidden="true"
                              />
                            </div>
                          </button>
                        </h3>
                        <div
                          id={`faq-answer-${index}`}
                          role="region"
                          aria-labelledby={`faq-button-${index}`}
                          className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[300px] pb-6 opacity-100" : "max-h-0 opacity-0"}`}
                        >
                          <p className="text-slate-600 dark:text-neutral-400 text-[15px] leading-relaxed pr-10 font-medium">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Contextual CTA for FAQ */}
                <div className="mt-12 p-8 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Users size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Masih punya pertanyaan?
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                        Tim support kami siap membantu Anda 24/7.
                      </p>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-full hover:bg-slate-800 dark:hover:bg-neutral-100 transition-all focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0A0A0A]">
                    Hubungi Support
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section - High Contrast Split Layout */}
          <section
            className="py-24 px-6 relative bg-[#FAFAFA] dark:bg-[#0A0A0A] transition-colors"
            aria-labelledby="cta-heading"
          >
            <div className="max-w-6xl mx-auto bg-slate-900 dark:bg-neutral-800 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12">
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "radial-gradient(#ffffff 2px, transparent 2px)",
                  backgroundSize: "32px 32px",
                }}
                aria-hidden="true"
              />
              <div
                className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3"
                aria-hidden="true"
              />

              <div className="relative z-10 md:w-3/5 text-center md:text-left">
                <h2
                  id="cta-heading"
                  className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-white leading-[1.1]"
                >
                  Tinggalkan cara lama. <br />
                  <span className="text-blue-400">Beralih ke Truemaps.</span>
                </h2>
                <p className="text-slate-400 dark:text-neutral-300 text-lg mb-10 max-w-lg mx-auto md:mx-0 font-medium leading-relaxed">
                  Bergabung dengan instansi dan enterprise terkemuka yang telah
                  mendigitalisasi aset mereka. Tanpa instalasi, tanpa hambatan
                  performa.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                  <a href="/auth/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-[15px] hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 dark:focus-visible:ring-offset-neutral-800">
                    Mulai Gratis Sekarang{" "}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                  <button className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white rounded-xl font-bold text-[15px] hover:bg-white/10 border border-white/10 transition-all focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 dark:focus-visible:ring-offset-neutral-800">
                    Jadwalkan Demo
                  </button>
                </div>
                <p
                  className="text-slate-500 dark:text-neutral-400 text-xs font-semibold mt-6 uppercase tracking-widest flex items-center justify-center md:justify-start gap-4"
                  aria-label="Syarat dan ketentuan ringkas"
                >
                  <span>✓ Gratis untuk tim kecil</span>
                  <span>✓ Tanpa kartu kredit</span>
                </p>
              </div>

              <div
                className="relative z-10 md:w-2/5 hidden md:flex justify-end"
                aria-hidden="true"
              >
                <div className="w-72 h-72 rounded-full border border-slate-700/50 dark:border-neutral-600/50 flex items-center justify-center relative">
                  <div className="absolute inset-4 rounded-full border border-slate-600/30 dark:border-neutral-500/30 flex items-center justify-center animate-[spin_20s_linear_infinite]" />
                  <div className="w-40 h-40 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] relative">
                    <Globe className="w-16 h-16 text-white opacity-90" />
                    <div className="absolute -top-4 -right-4 bg-slate-800 dark:bg-neutral-900 border border-slate-700 dark:border-neutral-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl animate-float">
                      100ms Render
                    </div>
                    <div
                      className="absolute -bottom-4 -left-4 bg-slate-800 dark:bg-neutral-900 border border-slate-700 dark:border-neutral-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl animate-float"
                      style={{ animationDelay: "1s" }}
                    >
                      Real-time Sync
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Minimalist Laravel-style Footer */}
        <footer
          className="py-16 border-t border-slate-200 dark:border-neutral-800 px-6 bg-white dark:bg-neutral-900 transition-colors"
          role="contentinfo"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-8">
              {/* Left Column: Brand & Socials */}
              <div className="md:w-1/3 flex flex-col items-start">
                <div
                  className="flex items-center gap-2.5 mb-6"
                  aria-hidden="true"
                >
                  <Image
                    src="/assets/logo.png"
                    alt="Truenapsh"
                    width={26}
                    height={26}
                    className="shrink-0"
                  />
                  <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    TrueMaps
                  </span>
                </div>
                <p className="text-slate-500 dark:text-neutral-400 text-[14px] leading-relaxed mb-6 max-w-[260px]">
                  Platform Web GIS kolaboratif untuk tim modern. Didesain untuk
                  performa dan skalabilitas enterprise.
                </p>
                <div className="flex items-center gap-5 text-slate-400 dark:text-neutral-500">
                  <a
                    href="#"
                    className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
                    aria-label="Twitter"
                  >
                    <Twitter size={18} />
                  </a>
                  <a
                    href="#"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
                    aria-label="GitHub"
                  >
                    <Github size={18} />
                  </a>
                  <a
                    href="#"
                    className="hover:text-blue-700 dark:hover:text-blue-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={18} />
                  </a>
                </div>
              </div>

              {/* Right Column: Links Grid */}
              <nav
                aria-label="Navigasi Footer"
                className="md:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 w-full"
              >
                <FooterGroup
                  title="Ecosystem"
                  links={[
                    "Flow Builder",
                    "API Rendering",
                    "Studio Visual",
                    "Integrasi",
                  ]}
                />
                <FooterGroup
                  title="Solutions"
                  links={[
                    "Tata Kota",
                    "Logistik & Rute",
                    "Perkebunan",
                    "Enterprise",
                  ]}
                />
                <FooterGroup
                  title="Resources"
                  links={[
                    "Dokumentasi",
                    "Blog & Edukasi",
                    "Komunitas GIS",
                    "Help Center",
                  ]}
                />
                <FooterGroup
                  title="Company"
                  links={["Tentang Kami", "Karir", "Hubungi Sales", "Partners"]}
                />
              </nav>
            </div>

            {/* Bottom Bar: Copyright & Legal */}
            <div className="mt-16 pt-8 border-t border-slate-100 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-slate-500 dark:text-neutral-400 font-medium transition-colors">
              <p>
                © {new Date().getFullYear()} Truemaps Inc. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Security
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
