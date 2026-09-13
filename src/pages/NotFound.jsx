import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-accent-primary/20 blur-[50px] rounded-full" />
        <Compass size={120} className="text-accent-primary animate-pulse relative z-10 drop-shadow-[0_0_30px_rgba(var(--color-accent-primary),0.5)]" />
      </div>
      
      <h1 className="text-6xl font-black text-slate-50 mb-4 tracking-wider font-mono">404</h1>
      
      <h2 className="text-2xl font-bold text-slate-200 mb-4">
        عذراً، لقد ضللت الطريق!
      </h2>
      
      <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
        يبدو أن الصفحة التي تبحث عنها غير موجودة أو تم نقلها. لا تقلق، يمكنك العودة دائماً إلى نقطة البداية في جُعْبَة.
      </p>
      
      <Link 
        to="/" 
        className="btn-primary py-3 px-8 text-lg font-bold flex items-center gap-2 shadow-xl shadow-accent-primary/20 group hover:scale-105 transition-transform"
      >
        <Home size={20} className="group-hover:-translate-y-0.5 transition-transform" />
        العودة للرئيسية
      </Link>
    </div>
  );
};

export default NotFound;
