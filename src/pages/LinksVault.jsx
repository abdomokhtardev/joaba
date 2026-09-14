import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Archive, CheckSquare, Link as LinkIcon, Folder } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { showDeleteConfirm } from '../utils/toastUtils';
import { handleFirestoreError } from '../utils/firestoreErrorUtils';
import { bulkDeleteDocs } from '../utils/firestoreUtils';
import LinkForm from '../components/links/LinkForm';
import LinkCard from '../components/links/LinkCard';
import CategoryManagerModal from '../components/links/CategoryManagerModal';

const LinksVault = () => {
  const { currentUser } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState('active'); // 'active' or 'archived'
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Category filter
  const [activeCategory, setActiveCategory] = useState('الكل');
  const categories = ['الكل', ...new Set(links.map((l) => l.category).filter(c => c && c !== 'عام'))];
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Form state
  const [formMode, setFormMode] = useState('none'); // 'none', 'add', 'edit'
  const [currentLink, setCurrentLink] = useState({ title: '', url: '', category: '', priority: 'urgent-important' });

  const [draggedLinkId, setDraggedLinkId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'links'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const linksData = [];
        snapshot.forEach((docSnap) => {
          linksData.push({ id: docSnap.id, ...docSnap.data() });
        });
        linksData.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });
        setLinks(linksData);
        setLoading(false);
      },
      (error) => {
        console.warn("Links listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleDragStart = (e, linkId) => {
    setDraggedLinkId(linkId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetLinkId) => {
    e.preventDefault();
    if (!draggedLinkId || draggedLinkId === targetLinkId) return;
    const currentList = [...links];
    const fromIndex = currentList.findIndex((l) => l.id === draggedLinkId);
    const toIndex = currentList.findIndex((l) => l.id === targetLinkId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [movedItem] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, movedItem);
    setLinks(currentList);
    setDraggedLinkId(null);

    try {
      const batch = writeBatch(db);
      currentList.forEach((item, idx) => {
        batch.update(doc(db, 'links', item.id), { 
          order: idx,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, 'حدث خطأ أثناء تحديث ترتيب الروابط.');
    }
  };

  const handleSaveLink = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanTitle = (currentLink.title || '').trim();
    const cleanUrl = (currentLink.url || '').trim();
    if (!cleanUrl || !cleanTitle || !currentUser) return;

    if (cleanTitle.length > 200) {
      return toast.error('عنوان الرابط يجب ألا يتجاوز 200 حرف.');
    }
    if (cleanUrl.length > 2000) {
      return toast.error('الرابط (URL) طويل جداً. الحد الأقصى هو 2000 حرف.');
    }

    setIsSaving(true);
    try {
      if (formMode === 'add') {
        await addDoc(collection(db, 'links'), {
          title: cleanTitle,
          url: cleanUrl,
          category: currentLink.category || '',
          priority: currentLink.priority || 'urgent-important',
          userId: currentUser.uid,
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (formMode === 'edit') {
        const linkRef = doc(db, 'links', currentLink.id);
        await updateDoc(linkRef, {
          title: cleanTitle,
          url: cleanUrl,
          category: currentLink.category || '',
          priority: currentLink.priority || 'urgent-important',
          updatedAt: serverTimestamp()
        });
      }

      toast.success(formMode === 'add' ? 'تم حفظ الرابط بنجاح! 🔗' : 'تم تعديل الرابط 🔗');
      setCurrentLink({ title: '', url: '', category: '', priority: 'urgent-important' });
      setFormMode('none');
    } catch (error) {
      handleFirestoreError(error, 'حدث خطأ أثناء حفظ الرابط.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (link) => {
    setCurrentLink(link);
    setFormMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const archiveLink = async (id) => {
    try {
      await updateDoc(doc(db, 'links', id), { 
        archived: true,
        updatedAt: serverTimestamp()
      });
      toast.success('تمت الأرشفة 📦');
    } catch (error) {
      handleFirestoreError(error, 'حدث خطأ أثناء الأرشفة.');
    }
  };

  const deleteLinkItem = async (id) => {
    showDeleteConfirm('هل أنت متأكد من الحذف النهائي؟', async () => {
      try {
        await deleteDoc(doc(db, 'links', id));
      } catch (err) {
        handleFirestoreError(err, 'حدث خطأ أثناء الحذف.');
      }
    }, 'تم حذف الرابط 🗑️');
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    showDeleteConfirm(`حذف ${selectedIds.length} عنصر نهائياً؟`, async () => {
      try {
        await bulkDeleteDocs(db, 'links', selectedIds);
        setSelectedIds([]);
        setIsSelectionMode(false);
      } catch (err) {
        handleFirestoreError(err, 'حدث خطأ أثناء الحذف الجماعي.');
      }
    }, 'تم الحذف الجماعي بنجاح 🗑️');
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('تم نسخ الرابط! 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelectLink = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleEditCategory = async (oldName, newName) => {
    try {
      const linksToUpdate = links.filter(l => l.category === oldName);
      if (linksToUpdate.length > 0) {
        const batch = writeBatch(db);
        linksToUpdate.forEach((link) => {
          batch.update(doc(db, 'links', link.id), { 
            category: newName,
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
      toast.success('تم تعديل اسم التصنيف بنجاح ✏️');
      if (activeCategory === oldName) setActiveCategory(newName);
    } catch (error) {
      handleFirestoreError(error, 'حدث خطأ أثناء التعديل.');
    }
  };

  const handleDeleteCategory = async (catName) => {
    showDeleteConfirm('سيتم نقل جميع الروابط في هذا التصنيف إلى التصنيف "عام"، هل أنت متأكد؟', async () => {
      try {
        const linksToUpdate = links.filter(l => l.category === catName);
        if (linksToUpdate.length > 0) {
          const batch = writeBatch(db);
          linksToUpdate.forEach((link) => {
            batch.update(doc(db, 'links', link.id), {
              category: 'عام',
              updatedAt: serverTimestamp()
            });
          });
          await batch.commit();
        }
        toast.success('تم حذف التصنيف بنجاح 🗑️');
        if (activeCategory === catName) setActiveCategory('الكل');
      } catch (error) {
        handleFirestoreError(error, 'حدث خطأ أثناء الحذف.');
      }
    });
  };

  // Filtered links
  const filteredLinks = links
    .filter((l) => (view === 'active' ? !l.archived : l.archived))
    .filter((l) => (activeCategory === 'الكل' ? true : (l.category || 'عام') === activeCategory))
    .filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.url.toLowerCase().includes(search.toLowerCase()) ||
      (l.category && l.category.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-slate-50 font-bold mb-1">خزنة الروابط 🔗</h1>
          <p className="text-slate-400 text-sm">احفظ مقالاتك ومصادرك المهمة وصنفها للوصول السريع.</p>
        </div>

        <div className="flex items-center gap-2">
          {isSelectionMode && selectedIds.length > 0 && (
            <button
              className="btn-secondary text-red-400 border-red-500/20 hover:bg-red-500/10 flex items-center gap-2 text-sm"
              onClick={handleBulkDelete}
            >
              <Trash2 size={16} /> حذف ({selectedIds.length})
            </button>
          )}

          <button
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
              isSelectionMode
                ? 'bg-accent-primary text-white border-accent-primary shadow-md'
                : 'bg-white/5 text-slate-400 border-glass-border hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds([]);
            }}
          >
            <CheckSquare size={16} />
            <span>{isSelectionMode ? 'إلغاء التحديد' : 'تحديد متعدد'}</span>
          </button>

          <button
            className="btn-primary flex items-center gap-2 text-sm shadow-lg shadow-accent-primary/20"
            onClick={() => {
              setCurrentLink({ title: '', url: '', category: '', priority: 'urgent-important' });
              setFormMode(formMode === 'add' ? 'none' : 'add');
            }}
          >
            <Plus size={18} /> إضافة رابط
          </button>
        </div>
      </header>

      {/* Form (Add / Edit) */}
      <LinkForm
        formMode={formMode}
        currentLink={currentLink}
        setCurrentLink={setCurrentLink}
        handleSaveLink={handleSaveLink}
        onClose={() => setFormMode('none')}
        categories={categories}
      />

      {/* Controls Bar: Search & View Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input-glass w-full pr-9 pl-3 text-sm py-2"
            placeholder="بحث في الروابط أو التصنيفات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-black/30 p-1 rounded-xl border border-glass-border w-full sm:w-auto justify-center">
          <button
            onClick={() => setView('active')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === 'active'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الروابط النشطة ({links.filter((l) => !l.archived).length})
          </button>
          <button
            onClick={() => setView('archived')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === 'archived'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الأرشيف ({links.filter((l) => l.archived).length})
          </button>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border shrink-0 ${
                activeCategory === cat
                  ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/40 font-bold'
                  : 'bg-white/5 text-slate-400 border-glass-border hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
          {categories.length > 1 && (
            <button
              onClick={() => setIsCategoryManagerOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border bg-white/5 text-slate-400 border-glass-border hover:bg-white/10 hover:text-slate-200 flex items-center gap-1.5 shrink-0 ml-auto"
            >
              <Folder size={14} /> إدارة التصنيفات
            </button>
          )}
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Grid of Links */}
      {loading ? (
        <div className="glass-panel p-12 text-center">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">جاري تحميل الروابط...</p>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="glass-panel p-12 text-center border-dashed border-2 border-glass-border flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-3">
            <LinkIcon size={28} />
          </div>
          <p className="text-slate-300 font-medium mb-1">لا توجد روابط مطابقة</p>
          <p className="text-slate-500 text-xs">
            {search ? 'جرّب البحث بكلمة أخرى' : 'ابدأ بحفظ روابطك المفضلة هنا للرجوع إليها لاحقاً'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <div
              key={link.id}
              draggable={!isSelectionMode}
              onDragStart={(e) => handleDragStart(e, link.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, link.id)}
              onDragEnd={() => setDraggedLinkId(null)}
              className="transition-transform duration-200"
            >
              <LinkCard
                link={link}
                view={view}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.includes(link.id)}
                onToggleSelect={toggleSelectLink}
                onCopy={copyToClipboard}
                copied={copiedId === link.id}
                onEdit={handleEditClick}
                onArchive={archiveLink}
                onDelete={deleteLinkItem}
                isDragging={draggedLinkId === link.id}
                dragHandleProps={{}}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LinksVault;
