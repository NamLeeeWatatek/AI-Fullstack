"use client";

export default function GlobalScaleSection() {
  return (
    <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold mb-6">Quy mÃ´ toÃ n cáº§u</h2>
          <p className="text-xl text-slate-400">
            WataOmi hoáº¡t Ä‘á»™ng trÃªn quy mÃ´ toÃ n cáº§u, xá»­ lÃ½ hÃ ng triá»‡u cuá»™c há»™i
            thoáº¡i má»™t cÃ¡ch an toÃ n vÃ  Ä‘Ã¡ng tin cáº­y.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-teal-400 mb-2">10M+</div>
            <div className="text-slate-400">Tin nháº¯n má»—i ngÃ y</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-teal-400 mb-2">99.9%</div>
            <div className="text-slate-400">Thá»i gian hoáº¡t Ä‘á»™ng</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-teal-400 mb-2">15+</div>
            <div className="text-slate-400">KÃªnh tÃ­ch há»£p</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-teal-400 mb-2">50+</div>
            <div className="text-slate-400">Quá»‘c gia</div>
          </div>
        </div>
      </div>
    </section>
  );
}

