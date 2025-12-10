"use client";

import { MdAutoAwesome } from "react-icons/md";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <MdAutoAwesome className="w-6 h-6 text-indigo-600" />
              <span className="text-xl font-bold text-slate-900">WataOmi</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              One AI. Every Channel. Zero Code.
              <br />
              Designed for the future of business.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Sáº£n pháº©m</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  TÃ­nh nÄƒng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Báº£ng giÃ¡
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  TÃ­ch há»£p
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">TÃ i nguyÃªn</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  TÃ i liá»‡u
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Cá»™ng Ä‘á»“ng
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">CÃ´ng ty</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Vá» chÃºng tÃ´i
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  LiÃªn há»‡
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          Â© 2024 WataOmi. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

