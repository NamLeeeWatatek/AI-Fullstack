"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FiCheck } from "react-icons/fi";

interface PricingPlan {
  name: string;
  price: number;
  description: string;
  cta: string;
  featured: boolean;
  features: string[];
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: 0,
    description: "HoÃ n háº£o Ä‘á»ƒ dÃ¹ng thá»­ WataOmi",
    cta: "DÃ¹ng thá»­ miá»…n phÃ­",
    featured: false,
    features: [
      "1 bot",
      "100 cuá»™c há»™i thoáº¡i/thÃ¡ng",
      "2 kÃªnh",
      "PhÃ¢n tÃ­ch cÆ¡ báº£n",
      "Há»— trá»£ cá»™ng Ä‘á»“ng",
    ],
  },
  {
    name: "Pro",
    price: 49,
    description: "Cho doanh nghiá»‡p Ä‘ang phÃ¡t triá»ƒn",
    cta: "DÃ¹ng thá»­ Pro",
    featured: true,
    features: [
      "10 bots",
      "10,000 cuá»™c há»™i thoáº¡i/thÃ¡ng",
      "KhÃ´ng giá»›i háº¡n kÃªnh",
      "PhÃ¢n tÃ­ch nÃ¢ng cao",
      "TÃ­ch há»£p n8n",
      "Há»— trá»£ Æ°u tiÃªn",
      "TÃ¹y chá»‰nh thÆ°Æ¡ng hiá»‡u",
    ],
  },
  {
    name: "Enterprise",
    price: 299,
    description: "Cho tá»• chá»©c lá»›n",
    cta: "LiÃªn há»‡ tÆ° váº¥n",
    featured: false,
    features: [
      "KhÃ´ng giá»›i háº¡n bots",
      "KhÃ´ng giá»›i háº¡n cuá»™c há»™i thoáº¡i",
      "KhÃ´ng giá»›i háº¡n kÃªnh",
      "TÃ­nh nÄƒng AI nÃ¢ng cao",
      "Quáº£n lÃ½ tÃ i khoáº£n riÃªng",
      "Cam káº¿t SLA",
      "TÃ­ch há»£p tÃ¹y chá»‰nh",
      "Triá»ƒn khai on-premise",
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Báº£ng giÃ¡ Ä‘Æ¡n giáº£n, minh báº¡ch
          </h2>
          <p className="text-xl text-slate-600">
            KhÃ´ng phÃ­ cÃ i Ä‘áº·t, khÃ´ng phÃ­ áº©n
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-2xl p-8 border ${
                plan.featured
                  ? "border-indigo-600 shadow-2xl scale-105 z-10 bg-white"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {plan.featured && (
                <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  ${plan.price}
                </span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="text-slate-600 mb-8">{plan.description}</p>
              <Button
                className={`w-full mb-8 h-12 rounded-full font-semibold ${
                  plan.featured
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {plan.cta}
              </Button>
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <FiCheck className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

