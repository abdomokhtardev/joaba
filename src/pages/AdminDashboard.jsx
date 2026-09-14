import React, { useState } from 'react';
import { ShieldCheck, Activity, Users, Settings, KeyRound, Tag, History, MessageSquare, Bell } from 'lucide-react';
import { useAdminData } from '../hooks/useAdminData';

import RequestsTab from '../components/admin/RequestsTab';
import HistoryTab from '../components/admin/HistoryTab';
import CodesTab from '../components/admin/CodesTab';
import AffiliatesTab from '../components/admin/AffiliatesTab';
import SettingsTab from '../components/admin/SettingsTab';
import SupportTab from '../components/admin/SupportTab';
import PromoCodesTab from '../components/admin/PromoCodesTab';
import AnnouncementsTab from '../components/admin/AnnouncementsTab';
import UsersTab from '../components/admin/UsersTab';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('requests');

  const {
    pendingRequests,
    historyRequests,
    validCodes,
    usedCodes,
    promoCodes,
    affiliates,
    tickets,
    unseenHistoryCount,
    setUnseenHistoryCount,
    usersMap,
    settings,
    handleApproveRequest,
    handleRejectRequest,
    handleDeleteRequest,
    handleBulkDeleteRequests,
    handleGenerateCodes,
    handleDeleteUsedCodes,
    handleDeleteSingleCode,
    handleBulkDeleteCodes,
    handleAddPromoCode,
    handleDeletePromoCode,
    handleTogglePromoCodeActive,
    handleCreateAffiliate,
    handlePayAffiliate,
    handleDeleteAffiliate,
    handleReplyTicket,
    handleDeleteTicket,
    handleSaveSettings
  } = useAdminData(activeTab);

  const pendingTicketsCount = tickets.filter((t) => t.status === 'pending').length;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="mb-2">
        <h1 className="text-3xl text-slate-50 mb-2 flex items-center gap-3">
          <ShieldCheck className="text-accent-primary" size={32} />
          لوحة تحكم الإدارة
        </h1>
        <p className="text-slate-400">إدارة الاشتراكات، الأكواد، المسوقين، والشكاوى.</p>
      </header>

      {/* Tabs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-2">
        {[
          { id: 'requests', label: 'الطلبات المعلقة', icon: Activity, count: pendingRequests.length },
          { id: 'history', label: 'سجل المعاملات', icon: History, count: unseenHistoryCount },
          { id: 'codes', label: 'أكواد التفعيل', icon: KeyRound },
          { id: 'promos', label: 'كوبونات الخصم', icon: Tag },
          { id: 'users', label: 'المستخدمين', icon: Users },
          { id: 'affiliates', label: 'المسوقين', icon: Users },
          { id: 'announcements', label: 'الإشعارات', icon: Bell },
          { id: 'support', label: 'الشكاوى والتوصيات', icon: MessageSquare, count: pendingTicketsCount },
          { id: 'settings', label: 'الإعدادات', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'history') {
                localStorage.setItem('admin_last_seen_history_count', String(historyRequests.length));
                setUnseenHistoryCount(0);
              }
            }}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-medium text-sm transition-all border ${
              activeTab === tab.id
                ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.15)]'
                : 'bg-white/5 text-slate-400 border-glass-border hover:bg-white/10 hover:text-slate-50 hover:border-white/20'
            }`}
          >
            <div className="relative">
              <tab.icon size={24} className={activeTab === tab.id ? 'text-accent-primary' : 'text-slate-400'} />
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`absolute -top-2 -right-2 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md ${
                  activeTab === tab.id ? 'bg-accent-primary text-white' : 'bg-red-500 text-white'
                }`}>
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </div>
            <span className="text-center">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="glass-panel p-6 min-h-[400px]">
        {activeTab === 'requests' && (
          <RequestsTab
            pendingRequests={pendingRequests}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab 
            historyRequests={historyRequests} 
            onDeleteRequest={handleDeleteRequest}
            onBulkDeleteRequests={handleBulkDeleteRequests}
          />
        )}

        {activeTab === 'codes' && (
          <CodesTab 
            validCodes={validCodes} 
            usedCodes={usedCodes} 
            usersMap={usersMap}
            onGenerateCodes={handleGenerateCodes} 
            onDeleteUsedCodes={handleDeleteUsedCodes}
            onDeleteSingleCode={handleDeleteSingleCode}
            onBulkDeleteCodes={handleBulkDeleteCodes}
          />
        )}

        {activeTab === 'promos' && (
          <PromoCodesTab
            promoCodes={promoCodes}
            plans={settings.plans}
            onAddPromoCode={handleAddPromoCode}
            onDeletePromoCode={handleDeletePromoCode}
            onTogglePromoCodeActive={handleTogglePromoCodeActive}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsTab />
        )}

        {activeTab === 'affiliates' && (
          <AffiliatesTab
            affiliates={affiliates}
            onCreateAffiliate={handleCreateAffiliate}
            onPayAffiliate={handlePayAffiliate}
            onDeleteAffiliate={handleDeleteAffiliate}
          />
        )}

        {activeTab === 'support' && (
          <SupportTab
            tickets={tickets}
            onReplyTicket={handleReplyTicket}
            onDeleteTicket={handleDeleteTicket}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            initialFreeTrialDays={settings.freeTrialDays} 
            initialPlans={settings.plans} 
            initialBanner={settings.bannerSettings} 
            initialVodafoneNumber={settings.vodafoneNumber}
            initialInstapayLink={settings.instapayLink}
            initialPaypalLink={settings.paypalLink}
            initialPlatformLink={settings.platformLink}
            initialDirectDownloadLink={settings.directDownloadLink}
            initialDeveloperLink={settings.developerLink}
            onSaveSettings={handleSaveSettings} 
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
