import React, { useState, useEffect } from 'react';
import { Save, CreditCard, Tag, Layers, Globe, Zap } from 'lucide-react';

const SettingsTab = ({
  initialFreeTrialDays,
  initialPlans,
  initialBanner,
  initialVodafoneNumber = '01029060019',
  initialInstapayLink = '',
  initialPaypalLink = '',
  initialPlatformLink = '',
  initialDirectDownloadLink = '',
  initialDeveloperLink = '',
  onSaveSettings
}) => {
  const [freeTrialDays, setFreeTrialDays] = useState(initialFreeTrialDays);
  const [plans, setPlans] = useState(initialPlans);
  const [bannerSettings, setBannerSettings] = useState(initialBanner);
  const [vodafoneNumber, setVodafoneNumber] = useState(initialVodafoneNumber);
  const [instapayLink, setInstapayLink] = useState(initialInstapayLink);
  const [paypalLink, setPaypalLink] = useState(initialPaypalLink);
  const [platformLink, setPlatformLink] = useState(initialPlatformLink);
  const [directDownloadLink, setDirectDownloadLink] = useState(initialDirectDownloadLink);
  const [developerLink, setDeveloperLink] = useState(initialDeveloperLink);
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'payments' | 'plans' | 'banner' | 'links'

  useEffect(() => {
    setFreeTrialDays(initialFreeTrialDays);
    setPlans(initialPlans);
    setBannerSettings(initialBanner);
    setVodafoneNumber(initialVodafoneNumber);
    setInstapayLink(initialInstapayLink);
    setPaypalLink(initialPaypalLink);
    setPlatformLink(initialPlatformLink);
    setDirectDownloadLink(initialDirectDownloadLink);
    setDeveloperLink(initialDeveloperLink);
  }, [
    initialFreeTrialDays,
    initialPlans,
    initialBanner,
    initialVodafoneNumber,
    initialInstapayLink,
    initialPaypalLink,
    initialPlatformLink,
    initialDirectDownloadLink,
    initialDeveloperLink
  ]);

  const handlePlanChange = (index, field, value) => {
    const newPlans = [...plans];
    newPlans[index][field] = field === 'name' ? value : parseInt(value, 10) || 0;
    setPlans(newPlans);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onSaveSettings({
      freeTrialDays: parseInt(freeTrialDays, 10) || 7,
      plans,
      banner: bannerSettings,
      vodafoneNumber: vodafoneNumber.trim(),
      instapayLink: instapayLink.trim(),
      paypalLink: paypalLink.trim(),
      platformLink: platformLink.trim(),
      directDownloadLink: directDownloadLink.trim(),
      developerLink: developerLink.trim()
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Sticky Header with Quick Save Button & Section Filter Tabs */}
      <div className="sticky top-0 z-30 bg-[#0f172a]/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg text-slate-50 font-bold flex items-center gap-2">
            <span>الإعدادات العامة وطرق الدفع ⚙️</span>
          </h2>
          <p className="text-xs text-slate-400">تحكم بالأسعار، وسائل الدفع، والروابط بسهولة.</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="btn-primary py-2 px-5 flex items-center gap-2 text-xs font-bold shadow-lg shadow-accent-primary/20 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Save size={16} />
          <span>حفظ التغييرات 💾</span>
        </button>
      </div>

      {/* Quick Section Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'all', label: 'الكل', icon: Zap },
          { id: 'payments', label: 'طرق الدفع', icon: CreditCard },
          { id: 'plans', label: 'الخطط والأسعار', icon: Layers },
          { id: 'banner', label: 'البانر الإعلاني', icon: Tag },
          { id: 'links', label: 'الروابط والتطبيق', icon: Globe },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border font-medium ${
                isActive
                  ? 'bg-accent-primary text-white border-accent-primary shadow-md shadow-accent-primary/20'
                  : 'bg-white/5 border-glass-border text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 1. Free Trial & Payments */}
        {(activeSection === 'all' || activeSection === 'payments') && (
          <div className="glass-panel p-5 flex flex-col gap-5 border-white/10 animate-slideDown">
            <h3 className="text-base text-slate-50 font-bold flex items-center gap-2 border-b border-glass-border pb-3">
              <CreditCard size={18} className="text-accent-primary" />
              ١. الفترة التجريبية وطرق استقبال المدفوعات
            </h3>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">مدة الفترة التجريبية المجانية (بالأيام)</label>
              <input 
                type="number" 
                min="0" 
                className="input-glass w-full text-sm" 
                value={freeTrialDays} 
                onChange={(e) => setFreeTrialDays(e.target.value)} 
                required 
              />
              <p className="text-[11px] text-slate-500 mt-1">المدة المجانية الممنوحة للحسابات الجديدة فور التسجيل.</p>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">رقم فودافون كاش (Vodafone Cash)</label>
                <input
                  type="text"
                  className="input-glass w-full text-sm font-mono"
                  placeholder="01029060019"
                  value={vodafoneNumber}
                  onChange={(e) => setVodafoneNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">رابط أو معرف إنستاباي (InstaPay Link / IPN)</label>
                <input
                  type="text"
                  className="input-glass w-full text-sm font-mono"
                  placeholder="https://ipn.eg/... أو username@instapay"
                  value={instapayLink}
                  onChange={(e) => setInstapayLink(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">حساب باي بال (PayPal Link / Email)</label>
                <input
                  type="text"
                  className="input-glass w-full text-sm font-mono"
                  placeholder="https://paypal.me/... أو email@paypal.com"
                  value={paypalLink}
                  onChange={(e) => setPaypalLink(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Pricing Plans */}
        {(activeSection === 'all' || activeSection === 'plans') && (
          <div className="glass-panel p-5 flex flex-col gap-5 border-white/10 animate-slideDown">
            <h3 className="text-base text-slate-50 font-bold flex items-center gap-2 border-b border-glass-border pb-3">
              <Layers size={18} className="text-purple-400" />
              ٢. خطط الاشتراك وعمولات التسويق
            </h3>
            
            <div className="flex flex-col gap-3">
              {plans.map((plan, index) => (
                <div key={plan.id} className="bg-white/5 border border-glass-border p-3.5 rounded-xl flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-[11px] text-slate-400 mb-1">اسم الخطة</label>
                    <input 
                      type="text" 
                      className="input-glass w-full text-sm font-bold" 
                      value={plan.name} 
                      onChange={(e) => handlePlanChange(index, 'name', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[11px] text-slate-400 mb-1">المدة (أيام)</label>
                    <input 
                      type="number" 
                      min="1" 
                      className="input-glass w-full text-sm font-mono" 
                      value={plan.durationDays} 
                      onChange={(e) => handlePlanChange(index, 'durationDays', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[11px] text-slate-400 mb-1">السعر (ج.م)</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="input-glass w-full text-sm font-mono" 
                      value={plan.price} 
                      onChange={(e) => handlePlanChange(index, 'price', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[11px] text-slate-400 mb-1">عمولة المسوق (ج.م)</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="input-glass w-full text-sm font-mono" 
                      value={plan.commission} 
                      onChange={(e) => handlePlanChange(index, 'commission', e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Banner Settings */}
        {(activeSection === 'all' || activeSection === 'banner') && (
          <div className="glass-panel p-5 flex flex-col gap-4 border-white/10 animate-slideDown">
            <h3 className="text-base text-slate-50 font-bold flex items-center gap-2 border-b border-glass-border pb-3">
              <Tag size={18} className="text-amber-400" />
              ٣. البانر الإعلاني العلوي
            </h3>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-xl border border-glass-border">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-glass-border text-accent-primary" 
                checked={bannerSettings?.isActive || false} 
                onChange={(e) => setBannerSettings({ ...bannerSettings, isActive: e.target.checked })} 
              />
              <span className="text-xs text-slate-200 font-medium">تفعيل ظهور البانر الإعلاني أعلى المنصة</span>
            </label>
            
            {bannerSettings?.isActive && (
              <div className="mt-1">
                <label className="block text-xs text-slate-400 mb-1">نص الرسالة الإعلانية</label>
                <input 
                  type="text" 
                  className="input-glass w-full text-sm" 
                  value={bannerSettings?.message || ''} 
                  onChange={(e) => setBannerSettings({ ...bannerSettings, message: e.target.value })} 
                  placeholder="مثال: خصم حصري! استخدم كود SUMMER50 عند الاشتراك." 
                />
              </div>
            )}
          </div>
        )}

        {/* 4. Platform & App Links */}
        {(activeSection === 'all' || activeSection === 'links') && (
          <div className="glass-panel p-5 flex flex-col gap-4 border-white/10 animate-slideDown">
            <h3 className="text-base text-slate-50 font-bold flex items-center gap-2 border-b border-glass-border pb-3">
              <Globe size={18} className="text-cyan-400" />
              ٤. روابط المنصة، التطبيق، والمطور
            </h3>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">رابط المنصة الرسمي (Web Link)</label>
              <input 
                type="url" 
                className="input-glass w-full text-sm font-mono" 
                placeholder="https://joaba.com"
                value={platformLink} 
                onChange={(e) => setPlatformLink(e.target.value)} 
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">رابط تحميل التطبيق المباشر (Direct APK / Store Link)</label>
              <input 
                type="url" 
                className="input-glass w-full text-sm font-mono" 
                placeholder="https://github.com/.../releases/latest/download/app-release.apk"
                value={directDownloadLink} 
                onChange={(e) => setDirectDownloadLink(e.target.value)} 
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">رابط موقع المطور (Developer Website)</label>
              <input 
                type="url" 
                className="input-glass w-full text-sm font-mono" 
                placeholder="https://yourportfolio.com"
                value={developerLink} 
                onChange={(e) => setDeveloperLink(e.target.value)} 
                dir="ltr"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsTab;
