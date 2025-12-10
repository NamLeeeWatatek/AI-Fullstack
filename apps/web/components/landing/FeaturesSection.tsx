"use client";

import { motion } from "framer-motion";
import {
  FiMessageSquare,
  FiZap,
  FiBarChart2,
  FiShield,
  FiGitMerge,
  FiGlobe,
  FiSmartphone,
} from "react-icons/fi";
import { MdAutoAwesome } from "react-icons/md";
import { IconType } from "react-icons";
import DesktopFlowMockup from "./DesktopFlowMockup";

interface Feature {
  icon: IconType;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: FiMessageSquare,
    title: "Äa kÃªnh thá»‘ng nháº¥t",
    description:
      "Káº¿t ná»‘i WhatsApp, Messenger, Instagram, Telegram vÃ  nhiá»u kÃªnh khÃ¡c trong má»™t ná»n táº£ng duy nháº¥t.",
  },
  {
    icon: FiZap,
    title: "XÃ¢y dá»±ng Flow khÃ´ng code",
    description:
      "Táº¡o cÃ¡c luá»“ng há»™i thoáº¡i phá»©c táº¡p vá»›i cÃ´ng cá»¥ kÃ©o tháº£ trá»±c quan WataFlow.",
  },
  {
    icon: MdAutoAwesome,
    title: "Tráº£ lá»i tá»± Ä‘á»™ng báº±ng AI",
    description:
      "Äá»ƒ AI xá»­ lÃ½ cÃ¢u há»i khÃ¡ch hÃ ng má»™t cÃ¡ch thÃ´ng minh vá»›i kháº£ nÄƒng hiá»ƒu ngá»¯ cáº£nh.",
  },
  {
    icon: FiGitMerge,
    title: "TÃ­ch há»£p n8n",
    description:
      "Káº¿t ná»‘i liá»n máº¡ch vá»›i n8n workflows Ä‘á»ƒ má»Ÿ rá»™ng kháº£ nÄƒng tá»± Ä‘á»™ng hÃ³a khÃ´ng giá»›i háº¡n.",
  },
  {
    icon: FiBarChart2,
    title: "PhÃ¢n tÃ­ch & BÃ¡o cÃ¡o",
    description:
      "Theo dÃµi hiá»‡u suáº¥t, Ä‘o lÆ°á»ng tÆ°Æ¡ng tÃ¡c vÃ  tá»‘i Æ°u hÃ³a tráº£i nghiá»‡m khÃ¡ch hÃ ng.",
  },
  {
    icon: FiShield,
    title: "Báº£o máº­t doanh nghiá»‡p",
    description:
      "MÃ£ hÃ³a cáº¥p ngÃ¢n hÃ ng vÃ  tuÃ¢n thá»§ cÃ¡c tiÃªu chuáº©n GDPR, SOC 2, ISO.",
  },
  {
    icon: FiSmartphone,
    title: "Tá»‘i Æ°u di Ä‘á»™ng",
    description:
      "Quáº£n lÃ½ doanh nghiá»‡p má»i lÃºc má»i nÆ¡i vá»›i dashboard responsive hoÃ n toÃ n.",
  },
  {
    icon: FiGlobe,
    title: "Háº¡ táº§ng toÃ n cáº§u",
    description:
      "Triá»ƒn khai trÃªn máº¡ng lÆ°á»›i edge toÃ n cáº§u Ä‘á»ƒ Ä‘áº£m báº£o tá»‘c Ä‘á»™ pháº£n há»“i nhanh chÃ³ng.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-indigo-600 font-semibold mb-2 tracking-wide uppercase text-sm">
              Ná»n táº£ng thá»‘ng nháº¥t
            </h2>
            <h3 className="text-4xl font-bold text-slate-900 mb-6">
              Giáº£i phÃ¡p toÃ n diá»‡n cho <br />
              chÄƒm sÃ³c khÃ¡ch hÃ ng tá»± Ä‘á»™ng
            </h3>
            <p className="text-xl text-slate-600 leading-relaxed">
              Giáº£m chi phÃ­, tÄƒng doanh thu vÃ  váº­n hÃ nh doanh nghiá»‡p hiá»‡u quáº£ hÆ¡n
              vá»›i ná»n táº£ng AI tÃ­ch há»£p Ä‘áº§y Ä‘á»§. Sá»­ dá»¥ng WataOmi Ä‘á»ƒ quáº£n lÃ½ táº¥t cáº£
              kÃªnh giao tiáº¿p, tá»± Ä‘á»™ng hÃ³a quy trÃ¬nh bÃ¡n hÃ ng vÃ  chÄƒm sÃ³c khÃ¡ch
              hÃ ng 24/7.
            </p>
          </div>
          <div className="relative flex justify-center">
            <DesktopFlowMockup showDesktop={true} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">
                {feature.title}
              </h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

