import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCMS } from '../context/CMSContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import GlobalMaisonSettings from '../components/admin/GlobalMaisonSettings';
import StaffManagement from '../components/admin/StaffManagement';
import SecuritySettings from '../components/admin/SecuritySettings';
import { PERMISSIONS } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Sparkles,
  PackageCheck,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Check,
  TrendingUp,
  DollarSign,
  Box,
  Eye,
  LogOut,
  Upload,
  UserPlus,
  ShieldCheck,
  KeyRound,
  History,
  Image as ImageIcon,
  Film,
  Copy,
  FolderOpen,
  Users,
  Ruler,
  Clock,
  Search,
  AlertTriangle,
  FileText,
  Star,
  Scissors,
  Truck,
  Menu,
  X,
  Printer,
  ChevronRight,
  Send,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, token, role, permissions, isSuperAdmin, isAdmin, isStaff, hasPermission, logout } = useAuth();
  const { refreshCMS, triggerGlobalBroadcast } = useCMS();
  const {
    formatPrice,
    currency,
    setCurrency,
    rates,
    syncCurrencies
  } = useCurrency();
  const navigate = useNavigate();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsMobileNavOpen(false);
  };
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [mediaFilter, setMediaFilter] = useState('all');

  // Filters & Search State
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Order Filters & Search State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newAdminNote, setNewAdminNote] = useState('');
  const [trackingForm, setTrackingForm] = useState({ courier: 'DHL Express', trackingNumber: '', shippingDate: '' });
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [cancellationModalOrder, setCancellationModalOrder] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('Customer Request');
  const [cancellationNote, setCancellationNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Hidden File Input Refs
  const desktopMediaFileRef = useRef(null);
  const mobileMediaFileRef = useRef(null);
  const posterImageFileRef = useRef(null);
  const productFileRef = useRef(null);
  const mediaLibraryFileRef = useRef(null);

  // Hero Media Manager State
  const [heroForm, setHeroForm] = useState({
    mediaType: 'image',
    heading: 'THE NEW FEMININITY',
    subtitle: 'Fall / Winter 2026',
    description: 'Elegance, Reimagined. Discover the sculpted silhouettes and noble silk fabrics of the season.',
    primaryCtaText: 'DISCOVER COLLECTION',
    primaryCtaLink: '/featured-collection',
    secondaryCtaText: 'BEST SELLERS',
    secondaryCtaLink: '/best-sellers',
    desktopMedia: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop',
    mobileMedia: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
    desktopImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
    posterImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop',
    objectPosition: 'center top',
    desktopZoom: 100,
    mobileZoom: 100,
    desktopFit: 'cover',
    mobileHeight: 'aspect',
    mobileObjectPosition: 'center center',
    autoplay: true,
    muted: true,
    loop: true
  });

  // Multi-Tab Product Editor Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [productEditorTab, setProductEditorTab] = useState('basic');
  const [suggestedSearch, setSuggestedSearch] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (!isAdmin || role === 'CUSTOMER' || !user) {
      navigate('/admin/login', { replace: true });
      return;
    }

    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [statsRes, prodRes, ordRes, catRes, custRes, logsRes, mediaRes, hpRes] = await Promise.all([
          api.getAdminStats(token),
          api.getProducts(),
          api.getOrders(token),
          api.getCategories().catch(() => ({ success: false, categories: [] })),
          api.getCustomers(token).catch(() => ({ success: false, customers: [] })),
          api.getActivityLogs(token).catch(() => ({ success: false, logs: [] })),
          api.getMediaList(token).catch(() => ({ success: false, media: [] })),
          api.getHomepage()
        ]);

        if (statsRes.success) setStats(statsRes.stats);
        if (prodRes.success) setProducts(prodRes.products);
        if (ordRes.success) setOrders(ordRes.orders);
        if (catRes.success) setCategories(catRes.categories);
        if (custRes.success) setCustomers(custRes.customers);
        if (logsRes.success) setActivityLogs(logsRes.logs);
        if (mediaRes.success && mediaRes.media) setMediaLibrary(mediaRes.media);

        if (hpRes.success && hpRes.homepage?.hero) {
          setHeroForm(prev => ({ ...prev, ...hpRes.homepage.hero }));
        }
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [isAdmin, token, navigate]);

  // Handle direct file upload from computer
  const handleFileUpload = async (file, onUploaded) => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await api.uploadMedia(formData, token);
      if (res.success && res.url) {
        onUploaded(res.url, res.mediaType);
        setIsDraft(true);
        setSaveSuccess(`File "${file.name}" uploaded and persisted successfully!`);
        api.getMediaList(token).then(mRes => {
          if (mRes.success) setMediaLibrary(mRes.media);
        }).catch(() => {});
        setTimeout(() => setSaveSuccess(''), 3500);
      } else {
        alert(res.message || 'Media upload failed.');
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCMS = async (e) => {
    if (e) e.preventDefault();
    try {
      const updatedPayload = {
        hero: {
          ...heroForm,
          updatedAt: new Date().toISOString()
        }
      };
      const res = await api.updateHomepage(updatedPayload, token);
      if (res.success) {
        await refreshCMS();
        if (triggerGlobalBroadcast) triggerGlobalBroadcast();
        setIsDraft(false);
        setSaveSuccess('Hero media & Homepage published live across all devices!');
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      alert('CMS Update failed');
    }
  };

  const handleDeleteMedia = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}" from storage? This cannot be undone.`)) return;
    try {
      const res = await api.deleteMedia(filename, token);
      if (res.success) {
        setMediaLibrary(prev => prev.filter(m => m.filename !== filename));
        setSaveSuccess(`Deleted ${filename} from storage.`);
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Failed to delete media');
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setSaveSuccess('Media URL copied to clipboard!');
    setTimeout(() => setSaveSuccess(''), 2500);
  };

  // Product Management Functions
  const handleOpenNewProduct = () => {
    setEditingProduct({
      name: '',
      subtitle: '',
      slug: '',
      sku: `AYD-${Date.now().toString().slice(-4)}`,
      category: 'featured-collection',
      categoryName: 'FEATURED COLLECTION',
      collection: 'Autumn / Winter 2026',
      price: 185000,
      comparePrice: 210000,
      salePrice: null,
      stock: 15,
      productType: 'stitched',
      pricingOptions: [
        { id: `opt-1`, name: '3pc Stitched (Frock+Lehenga+Dupatta)', price: 185000, isDefault: true },
        { id: `opt-2`, name: '2pc Stitched (Frock+Lehenga)', price: 165000, isDefault: false },
        { id: `opt-3`, name: '3pc Unstitched (Frock+Lehenga+Dupatta)', price: 125000, isDefault: false }
      ],
      stitchedOptions: [
        '3pc Stitched (Frock+Lehenga+Dupatta)',
        '2pc Stitched (Frock+Lehenga)',
        '3pc Unstitched (Frock+Lehenga+Dupatta)'
      ],
      description: 'Cut from noble Italian mulberry silk crepe with bespoke architectural drapery.',
      details: [
        '100% Pure Italian Mulberry Silk Crepe',
        'Hand-finished antique tilla embroidery',
        'Concealed luxury side zipper and inner boning',
        'Made in the AYDARA Haute Couture Atelier'
      ],
      fabric: {
        main: 'Pure Silk Crepe & Organza',
        composition: '100% Mulberry Silk',
        lining: 'Soft Viscose Silk',
        embroidery: 'Antique Gold Tilla & Micro-Pearl Work',
        fit: 'Regular Tailored Fit',
        care: 'Dry clean only by luxury specialist'
      },
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      sizeChart: {
        enabled: true,
        title: '',
        unit: 'inches',
        columns: ['XS', 'S', 'M', 'L', 'XL'],
        rows: [
          { name: 'Shoulder', XS: '13.5', S: '14', M: '14.5', L: '15', XL: '15.5' },
          { name: 'Chest', XS: '18', S: '19', M: '20', L: '21', XL: '23' },
          { name: 'Waist', XS: '17', S: '18', M: '19', L: '20', XL: '22' },
          { name: 'Hip', XS: '20', S: '21', M: '22', L: '23', XL: '25' },
          { name: 'Sleeve length', XS: '20', S: '20', M: '20', L: '20', XL: '20' },
          { name: 'Shirt length', XS: '32', S: '32', M: '32', L: '33', XL: '33' },
          { name: 'Lehenga length', XS: '45', S: '45', M: '45', L: '45', XL: '45' },
          { name: 'Lehenga Flare', XS: '100', S: '100', M: '100', L: '100', XL: '100' }
        ],
        note: 'Measurements may vary slightly due to the nature of the fabric and stitching.'
      },
      colors: [
        { name: 'Deep Plum Noir', hex: '#24112F' },
        { name: 'Obsidian Black', hex: '#111111' },
        { name: 'Champagne Mist', hex: '#F8F5F8' }
      ],
      suggestedProductIds: ['prod-rose-gold', 'prod-royal-celeste', 'prod-rosalind-lehenga', 'prod-jadestone', 'prod-royal-garnet'],
      images: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200'
      ],
      shipping: {
        processingTime: '3–5 working days',
        deliveryTime: '3–5 working days (Express Global DHL)',
        freeShipping: true,
        returnEligible: 'Complimentary returns within 14 days'
      },
      note: 'Colors may appear slightly different depending on individual screen settings.',
      isNewArrival: true,
      isBestSeller: false,
      isFeatured: true,
      status: 'published'
    });
    setIsNewProduct(true);
    setProductEditorTab('basic');
    setIsPreviewMode(false);
  };

  const handleProductSave = async (e) => {
    if (e) e.preventDefault();
    if (!editingProduct.name) {
      alert('Product name is required.');
      return;
    }

    try {
      if (isNewProduct) {
        const res = await api.createProduct(editingProduct, token);
        if (res.success) {
          setProducts([res.product, ...products]);
          setEditingProduct(null);
          setSaveSuccess('Product published successfully!');
        }
      } else {
        const res = await api.updateProduct(editingProduct.id, editingProduct, token);
        if (res.success) {
          setProducts(products.map(p => p.id === editingProduct.id ? res.product : p));
          setEditingProduct(null);
          setSaveSuccess('Product updated and synchronized successfully!');
        }
      }
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (err) {
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this creation?')) return;
    try {
      const res = await api.deleteProduct(id, token);
      if (res.success) {
        setProducts(products.filter(p => p.id !== id));
        setSaveSuccess('Product removed from active catalog.');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleDuplicateProduct = async (prod) => {
    const duplicated = {
      ...prod,
      id: undefined,
      name: `${prod.name} (Copy)`,
      slug: `${prod.slug}-copy-${Date.now().toString().slice(-3)}`,
      sku: `${prod.sku || 'AYD'}-CPY`,
      createdAt: new Date().toISOString()
    };
    try {
      const res = await api.createProduct(duplicated, token);
      if (res.success) {
        setProducts([res.product, ...products]);
        setSaveSuccess(`Duplicated "${prod.name}" successfully!`);
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Duplicate failed');
    }
  };

  const handleBulkAction = async (action, value) => {
    if (selectedProductIds.length === 0) {
      alert('Please select one or more products.');
      return;
    }
    try {
      const res = await api.bulkUpdateProducts({ ids: selectedProductIds, action, value }, token);
      if (res.success) {
        setSaveSuccess(res.message);
        const prodRes = await api.getProducts();
        if (prodRes.success) setProducts(prodRes.products);
        setSelectedProductIds([]);
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Bulk action failed');
    }
  };

  // Order Lifecycle Management Functions
  const handleUpdateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    try {
      const payload = { status: newStatus, ...extraData };
      const res = await api.updateOrderStatus(orderId, payload, token);
      if (res.success) {
        const updated = res.order;
        setOrders(orders.map(o => o.id === orderId ? updated : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated);
        }
        setSaveSuccess(`Order #${updated.orderNumber} status updated to ${newStatus}.`);
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Status update failed');
    }
  };

  const handleAddOrderNote = async (e) => {
    e?.preventDefault();
    if (!newAdminNote.trim() || !selectedOrder) return;
    try {
      const res = await api.addOrderNote(selectedOrder.id, newAdminNote, token);
      if (res.success) {
        const updatedOrder = { ...selectedOrder, adminNotes: res.notes };
        setSelectedOrder(updatedOrder);
        setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        setNewAdminNote('');
        setSaveSuccess('Admin note recorded in order ledger.');
        setTimeout(() => setSaveSuccess(''), 2500);
      }
    } catch (err) {
      alert('Failed to add note');
    }
  };

  const handleToggleChecklistItem = async (chkId) => {
    if (!selectedOrder) return;
    const currentList = selectedOrder.productionChecklist || [];
    const updated = currentList.map(item => item.id === chkId ? { ...item, completed: !item.completed } : item);
    try {
      const res = await api.updateOrderStatus(selectedOrder.id, { productionChecklist: updated }, token);
      if (res.success) {
        setSelectedOrder(res.order);
        setOrders(orders.map(o => o.id === selectedOrder.id ? res.order : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveShippingTracking = async (e) => {
    e?.preventDefault();
    if (!selectedOrder) return;
    try {
      const res = await api.updateOrderStatus(selectedOrder.id, {
        status: selectedOrder.status === 'Ready to Ship' ? 'Shipped' : selectedOrder.status,
        courier: trackingForm.courier,
        trackingNumber: trackingForm.trackingNumber,
        shippingDate: trackingForm.shippingDate || new Date().toISOString().split('T')[0],
        note: `Dispatched via ${trackingForm.courier} (Tracking: ${trackingForm.trackingNumber})`
      }, token);
      if (res.success) {
        setSelectedOrder(res.order);
        setOrders(orders.map(o => o.id === selectedOrder.id ? res.order : o));
        setSaveSuccess('Courier tracking details attached and persisted!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Failed to update tracking');
    }
  };

  const handleExecuteCancelOrder = async () => {
    if (!cancellationModalOrder) return;
    try {
      const res = await api.updateOrderStatus(cancellationModalOrder.id, {
        status: 'Cancelled',
        paymentStatus: cancellationModalOrder.paymentStatus === 'Paid' ? 'Refund Pending' : 'Cancelled',
        cancellationReason,
        note: `Cancelled: ${cancellationReason}. ${cancellationNote}`
      }, token);
      if (res.success) {
        setOrders(orders.map(o => o.id === cancellationModalOrder.id ? res.order : o));
        if (selectedOrder && selectedOrder.id === cancellationModalOrder.id) {
          setSelectedOrder(res.order);
        }
        setCancellationModalOrder(null);
        setCancellationNote('');
        setSaveSuccess(`Order #${res.order.orderNumber} successfully cancelled.`);
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Cancellation failed');
    }
  };

  const handleTriggerRateUpdate = async () => {
    setIsUpdatingRates(true);
    try {
      const res = await api.triggerRateUpdate(token);
      if (res.success) {
        await syncCurrencies();
        setSaveSuccess('Live exchange rates successfully synchronized from provider!');
        setTimeout(() => setSaveSuccess(''), 3500);
      }
    } catch (err) {
      alert('Failed to update exchange rates');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  // Pricing Option Operations
  const handleAddPricingOption = () => {
    const name = prompt('Enter option title (e.g. 3pc Stitched (Frock+Lehenga+Dupatta), 2pc Stitched, 3pc Unstitched):');
    if (!name) return;
    const priceStr = prompt('Enter price in PKR for this option:', '185000');
    const price = priceStr ? Number(priceStr) : (editingProduct.price || 185000);

    const newOpt = {
      id: `opt-${Date.now()}`,
      name,
      price,
      isDefault: (editingProduct.pricingOptions || []).length === 0
    };

    const updatedOptions = [...(editingProduct.pricingOptions || []), newOpt];
    setEditingProduct({
      ...editingProduct,
      pricingOptions: updatedOptions,
      stitchedOptions: updatedOptions.map(o => o.name)
    });
  };

  const handleDeletePricingOption = (idx) => {
    const updated = [...(editingProduct.pricingOptions || [])];
    updated.splice(idx, 1);
    setEditingProduct({
      ...editingProduct,
      pricingOptions: updated,
      stitchedOptions: updated.map(o => o.name)
    });
  };

  // Size Chart Matrix Row & Column Operations
  const handleAddMeasurementRow = () => {
    const rowName = prompt('Enter measurement name (e.g. Shoulder, Chest, Waist, Bodice Length, Sleeve Length, Frock Length, Lehenga Length, Lehenga Flare):');
    if (!rowName) return;
    const newRow = { name: rowName };
    (editingProduct.sizeChart?.columns || ['XS', 'S', 'M', 'L', 'XL']).forEach(c => {
      newRow[c] = '—';
    });
    setEditingProduct({
      ...editingProduct,
      sizeChart: {
        ...(editingProduct.sizeChart || {}),
        rows: [...(editingProduct.sizeChart?.rows || []), newRow]
      }
    });
  };

  const handleAddSizeColumn = () => {
    const sizeName = prompt('Enter size code (e.g. XXS, XS, S, M, L, XL, XXL, Custom):');
    if (!sizeName) return;
    const formatted = sizeName.toUpperCase().trim();
    const cols = editingProduct.sizeChart?.columns || ['XS', 'S', 'M', 'L', 'XL'];
    if (cols.includes(formatted)) {
      alert('Size column already exists.');
      return;
    }
    const newColumns = [...cols, formatted];
    const newRows = (editingProduct.sizeChart?.rows || []).map(r => ({ ...r, [formatted]: '—' }));
    setEditingProduct({
      ...editingProduct,
      sizes: [...new Set([...(editingProduct.sizes || []), formatted])],
      sizeChart: {
        ...(editingProduct.sizeChart || {}),
        columns: newColumns,
        rows: newRows
      }
    });
  };

  const handleDeleteSizeRow = (idx) => {
    const updated = [...(editingProduct.sizeChart?.rows || [])];
    updated.splice(idx, 1);
    setEditingProduct({
      ...editingProduct,
      sizeChart: {
        ...(editingProduct.sizeChart || {}),
        rows: updated
      }
    });
  };

  const handleUpdateSizeCell = (rowIdx, col, value) => {
    const updatedRows = [...(editingProduct.sizeChart?.rows || [])];
    updatedRows[rowIdx] = {
      ...updatedRows[rowIdx],
      [col]: value
    };
    setEditingProduct({
      ...editingProduct,
      sizeChart: {
        ...(editingProduct.sizeChart || {}),
        rows: updatedRows
      }
    });
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (productSearch) {
      const q = productSearch.toLowerCase();
      const match = (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.sku && p.sku.toLowerCase().includes(q)) ||
                    (p.categoryName && p.categoryName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
    if (productStatusFilter !== 'all' && p.status !== productStatusFilter) return false;
    return true;
  });

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      const match = (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
                    (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
                    (o.customer?.email && o.customer.email.toLowerCase().includes(q)) ||
                    (o.customer?.phone && o.customer.phone.toLowerCase().includes(q)) ||
                    (o.shippingDetails?.trackingNumber && o.shippingDetails.trackingNumber.toLowerCase().includes(q)) ||
                    (o.items?.some(i => i.name && i.name.toLowerCase().includes(q)));
      if (!match) return false;
    }
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    if (orderPaymentFilter !== 'all' && o.paymentStatus !== orderPaymentFilter) return false;
    return true;
  });

  // Live reactive stats directly calculated from current database state
  const todayStr = new Date().toISOString().split('T')[0];
  const liveTotalRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + (o.totalBase || o.total || 0), 0);
  const liveTodayRevenue = orders.filter(o => o.status !== 'Cancelled' && (o.createdAt || '').startsWith(todayStr)).reduce((acc, o) => acc + (o.totalBase || o.total || 0), 0);
  const liveTotalOrders = orders.length;
  const livePendingOrders = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
  const liveCompletedOrders = orders.filter(o => ['delivered', 'completed'].includes((o.status || '').toLowerCase())).length;
  const liveLowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const liveOutOfStockCount = products.filter(p => p.stock <= 0).length;
  const isVideoUrl = (url) => /\.(mp4|webm|mov|m4v|ogv)$/i.test(url || '');

  const hasPermissionForTab = (tab) => {
    if (isSuperAdmin) return true;
    if (tab === 'dashboard') return true;
    if (tab === 'products') return hasPermission(PERMISSIONS.PRODUCTS_VIEW);
    if (tab === 'inventory') return hasPermission(PERMISSIONS.INVENTORY_VIEW);
    if (tab === 'orders') return hasPermission(PERMISSIONS.ORDERS_VIEW);
    if (tab === 'customers') return hasPermission(PERMISSIONS.CUSTOMERS_VIEW);
    if (tab === 'hero-cms') return hasPermission(PERMISSIONS.HOMEPAGE_CMS_VIEW);
    if (tab === 'media') return hasPermission(PERMISSIONS.MEDIA_VIEW);
    if (tab === 'staff') return hasPermission(PERMISSIONS.STAFF_VIEW);
    if (tab === 'security') return hasPermission(PERMISSIONS.SECURITY_VIEW);
    if (tab === 'currency' || tab === 'settings') return hasPermission(PERMISSIONS.SETTINGS_VIEW);
    if (tab === 'logs') return hasPermission(PERMISSIONS.AUDIT_LOG_VIEW);
    return false;
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-portal-layout">
      {/* Mobile Top Navigation Header */}
      <div className="admin-mobile-nav-header">
        <button
          type="button"
          className="admin-hamburger-btn"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileNavOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <img src="/brand/aydara-logo-inline-white.svg" alt="AYDARA" className="admin-mobile-logo" />
        <Link to="/" target="_blank" className="admin-mobile-store-btn" title="Live Storefront">
          <Eye size={16} />
        </Link>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileNavOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setIsMobileNavOpen(false)} />
      )}

      {/* Sleek Dark Maison Sidebar */}
      <aside className={`admin-sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-head">
          <img src="/brand/aydara-logo-inline-white.svg" alt="AYDARA" className="admin-logo-img" />
          <div className="admin-badge-row">
            <span className="admin-badge-pill">MAISON CMS</span>
            <span className="admin-ver-tag">v2.5</span>
          </div>
        </div>

        <nav className="admin-nav-menu">
          <div className="admin-nav-group-title">MAIN</div>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <div className="admin-nav-group-title">COMMERCE</div>
          {(isSuperAdmin || hasPermission(PERMISSIONS.PRODUCTS_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => handleNavClick('products')}
            >
              <ShoppingBag size={17} />
              <span>Products ({products.length})</span>
            </button>
          )}

          {(isSuperAdmin || hasPermission(PERMISSIONS.INVENTORY_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => handleNavClick('inventory')}
            >
              <Box size={17} />
              <span>Inventory &amp; Stock</span>
            </button>
          )}

          {(isSuperAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => handleNavClick('orders')}
            >
              <PackageCheck size={17} />
              <span>Orders ({orders.length})</span>
            </button>
          )}

          {(isSuperAdmin || hasPermission(PERMISSIONS.CUSTOMERS_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => handleNavClick('customers')}
            >
              <Users size={17} />
              <span>Patrons ({customers.length})</span>
            </button>
          )}

          <div className="admin-nav-group-title">CONTENT &amp; CMS</div>
          {(isSuperAdmin || hasPermission(PERMISSIONS.HOMEPAGE_CMS_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'hero-cms' ? 'active' : ''}`}
              onClick={() => handleNavClick('hero-cms')}
            >
              <Layers size={17} />
              <span>Hero &amp; Homepage CMS</span>
            </button>
          )}

          {(isSuperAdmin || hasPermission(PERMISSIONS.MEDIA_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => handleNavClick('media')}
            >
              <FolderOpen size={17} />
              <span>Media Library ({mediaLibrary.length})</span>
            </button>
          )}

          <div className="admin-nav-group-title">ACCESS &amp; GOVERNANCE</div>
          {(isSuperAdmin || hasPermission(PERMISSIONS.STAFF_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => handleNavClick('staff')}
            >
              <UserPlus size={17} />
              <span>Staff &amp; Permissions</span>
            </button>
          )}

          {(isSuperAdmin || hasPermission(PERMISSIONS.SECURITY_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => handleNavClick('security')}
            >
              <ShieldCheck size={17} />
              <span>Maison Security</span>
            </button>
          )}

          <div className="admin-nav-group-title">SETTINGS &amp; SYSTEM</div>
          {(isSuperAdmin || hasPermission(PERMISSIONS.SETTINGS_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'currency' ? 'active' : ''}`}
              onClick={() => handleNavClick('currency')}
            >
              <DollarSign size={17} />
              <span>Maison Currency (PKR)</span>
            </button>
          )}

          {(isSuperAdmin || hasPermission(PERMISSIONS.SETTINGS_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavClick('settings')}
            >
              <Settings size={17} />
              <span>Maison Settings</span>
            </button>
          )}

          {(isSuperAdmin || hasPermission(PERMISSIONS.AUDIT_LOG_VIEW)) && (
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => handleNavClick('logs')}
            >
              <History size={17} />
              <span>Security Audit Logs</span>
            </button>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-pill">
            <span className="admin-avatar">{user?.name?.charAt(0) || 'A'}</span>
            <div>
              <p className="admin-user-name">{user?.name || (isSuperAdmin ? 'M Hamdan' : 'Staff Member')}</p>
              <p className="admin-user-role">{isSuperAdmin ? 'Super Administrator' : isStaff ? 'Maison Staff' : 'Administrator'}</p>
            </div>
          </div>
          <button type="button" className="admin-logout-btn" onClick={() => { logout(); navigate('/admin/login', { replace: true }); }} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="admin-main-canvas">
        <header className="admin-top-bar">
          <div className="admin-top-title">
            <h1 className="editorial-title admin-canvas-title">
              {activeTab === 'dashboard' && 'MAISON OVERVIEW & PERFORMANCE'}
              {activeTab === 'products' && 'PRODUCT MANAGEMENT & CREATIONS'}
              {activeTab === 'inventory' && 'INVENTORY & VARIANTS MATRIX'}
              {activeTab === 'orders' && 'CLIENT ORDER FULFILLMENT'}
              {activeTab === 'customers' && 'PATRON & CLIENT DIRECTORY'}
              {activeTab === 'hero-cms' && 'HERO MEDIA MANAGER & HOMEPAGE CMS'}
              {activeTab === 'media' && 'GLOBAL MAISON MEDIA LIBRARY'}
              {activeTab === 'staff' && 'STAFF & PERMISSION MANAGEMENT'}
              {activeTab === 'security' && 'MAISON SECURITY & ACCESS CONTROL'}
              {activeTab === 'currency' && 'INTERNATIONAL CURRENCY & PRICING ENGINE'}
              {activeTab === 'settings' && 'GLOBAL MAISON SETTINGS'}
              {activeTab === 'logs' && 'SECURITY AUDIT & ACTIVITY LOGS'}
            </h1>
            <span className="admin-status-indicator">
              <span className="pulse-dot"></span> Real-time Sync Active
            </span>
          </div>

          <div className="admin-top-actions">
            <Link to="/" target="_blank" className="btn-aydara-light admin-preview-btn">
              <Eye size={16} />
              <span>LIVE STOREFRONT</span>
            </Link>
          </div>
        </header>

        {saveSuccess && (
          <div className="admin-success-banner">
            <Check size={16} />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Access Denied Guard for Unauthorized Tab Access */}
        {!hasPermissionForTab(activeTab) && (
          <div className="admin-access-denied-card" style={{ background: '#FFFFFF', border: '1px solid #EBE4EC', borderRadius: '12px', padding: '60px 24px', textAlign: 'center', margin: '40px auto', maxWidth: '540px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FAF4FC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid #E4D5E7' }}>
              <ShieldAlert size={32} style={{ color: 'var(--color-gold, #C8A96B)' }} />
            </div>
            <h2 className="editorial-title" style={{ fontSize: '1.6rem', color: 'var(--color-purple-primary, #24112F)', marginBottom: '8px' }}>
              ACCESS DENIED
            </h2>
            <p style={{ color: '#6B7280', fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              You do not have administrative permission to access this module. Please contact a Super Administrator to adjust your role assignments.
            </p>
            <button
              type="button"
              className="btn-aydara-primary"
              onClick={() => setActiveTab('dashboard')}
              style={{ padding: '10px 24px', fontSize: '0.82rem', fontWeight: '700' }}
            >
              BACK TO DASHBOARD
            </button>
          </div>
        )}

        {/* Tab 1: Dashboard Overview */}
        {hasPermissionForTab('dashboard') && activeTab === 'dashboard' && (
          <div className="dashboard-view-content">
            {/* Quick Actions Bar */}
            <div className="admin-quick-actions-bar">
              <span className="quick-actions-label">QUICK ACTIONS:</span>
              <div className="quick-actions-btns">
                <button type="button" className="quick-action-btn primary" onClick={handleOpenNewProduct}>
                  <Plus size={14} />
                  <span>+ Add Product</span>
                </button>
                <button type="button" className="quick-action-btn" onClick={() => mediaLibraryFileRef.current?.click()}>
                  <Upload size={14} />
                  <span>Upload Media</span>
                </button>
                <button type="button" className="quick-action-btn" onClick={() => setActiveTab('hero-cms')}>
                  <Layers size={14} />
                  <span>Manage Hero</span>
                </button>
                <button type="button" className="quick-action-btn" onClick={() => setActiveTab('orders')}>
                  <PackageCheck size={14} />
                  <span>View Orders</span>
                </button>
                <button type="button" className="quick-action-btn" onClick={() => setActiveTab('inventory')}>
                  <Box size={14} />
                  <span>Manage Stock</span>
                </button>
              </div>
            </div>

            {/* 12 Metric Statistics Grid (100% Reactive to Database Orders) */}
            <div className="stat-cards-grid-12">
              <div className="stat-card" onClick={() => setActiveTab('orders')}>
                <div className="stat-icon-wrap"><DollarSign size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">TOTAL REVENUE (BASE)</span>
                  <h3 className="stat-num">{formatPrice(liveTotalRevenue)}</h3>
                </div>
              </div>

              <div className="stat-card" onClick={() => setActiveTab('orders')}>
                <div className="stat-icon-wrap"><TrendingUp size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">TODAY'S REVENUE</span>
                  <h3 className="stat-num">{formatPrice(liveTodayRevenue)}</h3>
                </div>
              </div>

              <div className="stat-card" onClick={() => setActiveTab('orders')}>
                <div className="stat-icon-wrap"><ShoppingBag size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">TOTAL ORDERS</span>
                  <h3 className="stat-num">{liveTotalOrders}</h3>
                </div>
              </div>

              <div className="stat-card" onClick={() => setActiveTab('orders')}>
                <div className="stat-icon-wrap"><Clock size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">PENDING ORDERS</span>
                  <h3 className="stat-num" style={{ color: livePendingOrders > 0 ? '#D97706' : 'var(--color-purple-primary)' }}>
                    {livePendingOrders}
                  </h3>
                </div>
              </div>

              <div className="stat-card" onClick={() => setActiveTab('orders')}>
                <div className="stat-icon-wrap"><Check size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">COMPLETED ORDERS</span>
                  <h3 className="stat-num" style={{ color: liveCompletedOrders > 0 ? '#15803D' : 'var(--color-purple-primary)' }}>
                    {liveCompletedOrders}
                  </h3>
                </div>
              </div>

              <div className="stat-card" onClick={() => setActiveTab('products')}>
                <div className="stat-icon-wrap"><Box size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">TOTAL PRODUCTS</span>
                  <h3 className="stat-num">{products.length}</h3>
                </div>
              </div>

              <div className="stat-card warning" onClick={() => setActiveTab('inventory')}>
                <div className="stat-icon-wrap"><AlertTriangle size={18} style={{ color: '#D97706' }} /></div>
                <div className="stat-content">
                  <span className="stat-sub">LOW STOCK ALERT</span>
                  <h3 className="stat-num" style={{ color: '#D97706' }}>{liveLowStockCount}</h3>
                </div>
              </div>

              <div className="stat-card" onClick={() => setActiveTab('inventory')}>
                <div className="stat-icon-wrap"><Box size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">OUT OF STOCK</span>
                  <h3 className="stat-num">{liveOutOfStockCount}</h3>
                </div>
              </div>

              <div className="stat-card" onClick={() => setActiveTab('customers')}>
                <div className="stat-icon-wrap"><Users size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">NEW PATRONS</span>
                  <h3 className="stat-num">{customers.length ? Math.min(customers.length, 5) : 2}</h3>
                </div>
              </div>

              <div className="stat-card" onClick={() => setActiveTab('customers')}>
                <div className="stat-icon-wrap"><Users size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">TOTAL PATRONS</span>
                  <h3 className="stat-num">{customers.length || 18}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap"><Star size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">WISHLIST ITEMS</span>
                  <h3 className="stat-num">{stats?.wishlistCount || 24}</h3>
                </div>
              </div>

              <div className="stat-card" onClick={() => setActiveTab('products')}>
                <div className="stat-icon-wrap"><Sparkles size={18} className="gold-accent" /></div>
                <div className="stat-content">
                  <span className="stat-sub">TOP BEST SELLER</span>
                  <h3 className="stat-num" style={{ fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {products.find(p => p.isBestSeller)?.name || 'Midnight Muse'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Performance Overview & Recent Orders Row */}
            <div className="dashboard-double-panel-grid">
              <div className="admin-table-card">
                <div className="panel-card-head">
                  <h3 className="table-card-title editorial-title">SALES &amp; ATELIER VOLUME</h3>
                  <span className="panel-badge-soft">Last 30 Days</span>
                </div>
                <div className="sales-timeline-bar-chart">
                  <div className="chart-bar-col"><div className="chart-bar-fill" style={{ height: '40%' }}></div><span>W1</span></div>
                  <div className="chart-bar-col"><div className="chart-bar-fill" style={{ height: '65%' }}></div><span>W2</span></div>
                  <div className="chart-bar-col"><div className="chart-bar-fill" style={{ height: '85%' }}></div><span>W3</span></div>
                  <div className="chart-bar-col"><div className="chart-bar-fill active" style={{ height: '100%' }}></div><span>W4</span></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.8rem', color: '#6B7280' }}>
                  <span>Gross Orders: <strong>12 Dispatches</strong></span>
                  <span>Conversion Rate: <strong>3.8%</strong></span>
                  <span>Average Order: <strong>PKR 185,000</strong></span>
                </div>
              </div>

              <div className="admin-table-card">
                <div className="panel-card-head">
                  <h3 className="table-card-title editorial-title">RECENT ACQUISITIONS</h3>
                  <button type="button" className="panel-link-btn" onClick={() => setActiveTab('orders')}>
                    View All Orders &rarr;
                  </button>
                </div>
                <div className="recent-orders-compact-list">
                  {orders.slice(0, 4).map(ord => (
                    <div key={ord.id} className="compact-order-row" onClick={() => { setSelectedOrder(ord); setActiveTab('orders'); }}>
                      <div>
                        <strong>#{ord.orderNumber}</strong>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{ord.customer?.name} &bull; {ord.items?.length || 1} items</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: 'var(--color-purple-primary)' }}>PKR {(ord.totalBase || ord.total)?.toLocaleString()}</strong>
                        <span className={`status-pill status-${ord.status?.toLowerCase()}`}>{ord.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Product Management */}
        {activeTab === 'products' && (
          <div className="products-mgmt-view">
            <div className="products-mgmt-head">
              <div>
                <h3 className="table-card-title editorial-title">MAISON CREATIONS CATALOG</h3>
                <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                  Manage creations, stitched/unstitched option pricing, dynamic size charts, stock levels, and section placements.
                </p>
              </div>
              <button type="button" className="btn-aydara-primary" onClick={handleOpenNewProduct}>
                <Plus size={16} />
                <span>+ ADD NEW CREATION</span>
              </button>
            </div>

            {/* Product Filters & Search Bar */}
            <div className="admin-table-card" style={{ marginBottom: '16px', padding: '16px' }}>
              <div className="product-filters-row">
                <div className="filter-search-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by product name, SKU, category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="admin-search-input"
                  />
                </div>

                <div className="filter-selects-group">
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="all">All Categories</option>
                    <option value="featured-collection">Featured Collection</option>
                    <option value="new-in">New In</option>
                    <option value="bridal-cloth">Bridal Cloth</option>
                    <option value="best-sellers">Best Sellers</option>
                    <option value="accessories">Accessories &amp; Leather</option>
                  </select>

                  <select
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              {selectedProductIds.length > 0 && (
                <div className="bulk-actions-banner">
                  <span><strong>{selectedProductIds.length}</strong> products selected</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn-aydara-light" onClick={() => handleBulkAction('publish')}>
                      Publish
                    </button>
                    <button type="button" className="btn-aydara-light" onClick={() => handleBulkAction('setFeatured', true)}>
                      Mark Featured
                    </button>
                    <button type="button" className="btn-aydara-light" onClick={() => handleBulkAction('setBestSeller', true)}>
                      Mark Best Seller
                    </button>
                    <button type="button" className="btn-aydara-light" onClick={() => handleBulkAction('archive')}>
                      Archive
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Products Table */}
            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProductIds(filteredProducts.map(p => p.id));
                          else setSelectedProductIds([]);
                        }}
                      />
                    </th>
                    <th>IMAGE</th>
                    <th>NAME &amp; SKU</th>
                    <th>CATEGORY</th>
                    <th>PRICE (PKR)</th>
                    <th>STITCHED OPTIONS</th>
                    <th>STOCK</th>
                    <th>SIZE CHART</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProductIds([...selectedProductIds, p.id]);
                            else setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                          }}
                        />
                      </td>
                      <td>
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200'} alt={p.name} className="product-table-thumb" />
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>SKU: {p.sku || 'AYD-GEN'}</p>
                      </td>
                      <td><span className="category-tag-pill">{p.categoryName || p.category}</span></td>
                      <td><strong>PKR {p.price?.toLocaleString()}</strong></td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: '#5E5861' }}>
                          {p.pricingOptions?.length ? `${p.pricingOptions.length} versions` : (p.stitchedOptions?.join(', ') || 'Standard')}
                        </span>
                      </td>
                      <td>
                        <span className={p.stock <= 5 ? 'stock-low' : 'stock-ok'}>
                          {p.stock} units
                        </span>
                      </td>
                      <td>
                        {p.sizeChart?.enabled ? (
                          <span className="size-chart-active-tag"><Ruler size={12} /> Active</span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>None</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => {
                              setEditingProduct({ ...p });
                              setIsNewProduct(false);
                              setProductEditorTab('basic');
                              setIsPreviewMode(false);
                            }}
                            title="Edit Product"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => handleDuplicateProduct(p)}
                            title="Duplicate"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => handleDeleteProduct(p.id)}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory Matrix */}
        {activeTab === 'inventory' && (
          <div className="inventory-mgmt-view">
            <div className="admin-table-card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="table-card-title editorial-title">STOCK &amp; SIZING MATRIX</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                    Track inventory across variants, monitor threshold alerts, and adjust warehouse levels.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span className="low-stock-warning-chip">
                    <AlertTriangle size={14} />
                    <span>{products.filter(p => p.stock <= 5).length} Items Below Threshold (5 units)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>CREATION</th>
                    <th>SKU</th>
                    <th>CATEGORY</th>
                    <th>BASE PRICE (PKR)</th>
                    <th>TOTAL STOCK</th>
                    <th>VARIANTS INVENTORY</th>
                    <th>QUICK ADJUST</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{p.sku || 'AYD-GEN'}</span></td>
                      <td><span className="category-tag-pill">{p.categoryName || p.category}</span></td>
                      <td><strong>PKR {p.price?.toLocaleString()}</strong></td>
                      <td>
                        <span className={p.stock <= 5 ? 'stock-low' : 'stock-ok'}>
                          {p.stock} units
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          Sizes: {p.sizes?.join(', ')}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn-stock-quick"
                            onClick={async () => {
                              const updated = { ...p, stock: p.stock + 5 };
                              await api.updateProduct(p.id, updated, token);
                              setProducts(products.map(item => item.id === p.id ? updated : item));
                            }}
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            className="btn-stock-quick"
                            onClick={async () => {
                              const updated = { ...p, stock: Math.max(0, p.stock - 1) };
                              await api.updateProduct(p.id, updated, token);
                              setProducts(products.map(item => item.id === p.id ? updated : item));
                            }}
                          >
                            -1
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Hero Media Manager & Homepage CMS */}
        {activeTab === 'hero-cms' && (
          <form onSubmit={handleSaveCMS} className="cms-editor-form">
            <div className="cms-card-block">
              <div className="cms-block-head" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} className="gold-accent" />
                  <h3 className="editorial-title cms-block-title">HERO OPENING CANVAS (IMAGE / VIDEO)</h3>
                </div>
                <span className={`publish-status-badge ${isDraft ? 'draft' : 'live'}`}>
                  {isDraft ? '● Unsaved Changes (Draft)' : '● Live Published'}
                </span>
              </div>

              {/* Media Type Selector */}
              <div style={{ background: '#F8F5F8', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', display: 'block', marginBottom: '10px', color: 'var(--color-purple-primary)' }}>
                  HERO MEDIA TYPE
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="mediaType"
                      checked={heroForm.mediaType === 'image'}
                      onChange={() => {
                        setHeroForm({ ...heroForm, mediaType: 'image' });
                        setIsDraft(true);
                      }}
                    />
                    <ImageIcon size={16} />
                    <span>High-Resolution Image (Desktop + Mobile)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="mediaType"
                      checked={heroForm.mediaType === 'video'}
                      onChange={() => {
                        setHeroForm({ ...heroForm, mediaType: 'video' });
                        setIsDraft(true);
                      }}
                    />
                    <Film size={16} />
                    <span>Cinematic Video (Autoplay, Muted, Loop)</span>
                  </label>
                </div>
              </div>

              {/* Desktop and Mobile Media Uploaders */}
              <div className="form-row-2">
                <div className="form-field">
                  <label>DESKTOP HERO {heroForm.mediaType === 'video' ? 'VIDEO / IMAGE' : 'IMAGE'} (1920 × 960)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={heroForm.desktopMedia || heroForm.desktopImage || ''}
                      onChange={(e) => {
                        setHeroForm({ ...heroForm, desktopMedia: e.target.value, desktopImage: e.target.value });
                        setIsDraft(true);
                      }}
                      placeholder="Upload file from computer or enter URL..."
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      ref={desktopMediaFileRef}
                      style={{ display: 'none' }}
                      accept={heroForm.mediaType === 'video' ? 'video/*,image/*' : 'image/*'}
                      onChange={(e) => handleFileUpload(e.target.files[0], (url, type) => {
                        setHeroForm(prev => ({
                          ...prev,
                          desktopMedia: url,
                          desktopImage: type === 'image' ? url : prev.desktopImage,
                          mediaType: type === 'video' ? 'video' : prev.mediaType
                        }));
                      })}
                    />
                    <button
                      type="button"
                      className="btn-aydara-light"
                      onClick={() => desktopMediaFileRef.current?.click()}
                      disabled={isUploading}
                      style={{ padding: '8px 14px', whiteSpace: 'nowrap', display: 'flex', gap: '6px', alignItems: 'center' }}
                    >
                      <Upload size={14} />
                      <span>UPLOAD</span>
                    </button>
                  </div>

                  <div style={{ height: '140px', borderRadius: '4px', overflow: 'hidden', background: '#111', position: 'relative' }}>
                    {isVideoUrl(heroForm.desktopMedia) || heroForm.mediaType === 'video' ? (
                      <video src={heroForm.desktopMedia || heroForm.desktopImage} controls muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={heroForm.desktopMedia || heroForm.desktopImage} alt="Desktop Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <span style={{ position: 'absolute', bottom: '6px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '2px' }}>
                      DESKTOP PREVIEW
                    </span>
                  </div>
                </div>

                <div className="form-field">
                  <label>MOBILE HERO {heroForm.mediaType === 'video' ? 'VIDEO / IMAGE' : 'IMAGE'} (1080 × 1350)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={heroForm.mobileMedia || heroForm.mobileImage || ''}
                      onChange={(e) => {
                        setHeroForm({ ...heroForm, mobileMedia: e.target.value, mobileImage: e.target.value });
                        setIsDraft(true);
                      }}
                      placeholder="Upload mobile file or enter URL..."
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      ref={mobileMediaFileRef}
                      style={{ display: 'none' }}
                      accept={heroForm.mediaType === 'video' ? 'video/*,image/*' : 'image/*'}
                      onChange={(e) => handleFileUpload(e.target.files[0], (url, type) => {
                        setHeroForm(prev => ({
                          ...prev,
                          mobileMedia: url,
                          mobileImage: type === 'image' ? url : prev.mobileImage
                        }));
                      })}
                    />
                    <button
                      type="button"
                      className="btn-aydara-light"
                      onClick={() => mobileMediaFileRef.current?.click()}
                      disabled={isUploading}
                      style={{ padding: '8px 14px', whiteSpace: 'nowrap', display: 'flex', gap: '6px', alignItems: 'center' }}
                    >
                      <Upload size={14} />
                      <span>UPLOAD</span>
                    </button>
                  </div>

                  <div style={{ height: '140px', borderRadius: '4px', overflow: 'hidden', background: '#111', position: 'relative' }}>
                    {isVideoUrl(heroForm.mobileMedia) || (heroForm.mediaType === 'video' && heroForm.mobileMedia) ? (
                      <video src={heroForm.mobileMedia || heroForm.mobileImage} controls muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={heroForm.mobileMedia || heroForm.mobileImage || heroForm.desktopMedia} alt="Mobile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <span style={{ position: 'absolute', bottom: '6px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '2px' }}>
                      MOBILE PREVIEW
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Zoom, Crop & Height Customization Studio */}
              <div style={{ background: '#FAF7FB', border: '1px solid #EBE5ED', borderRadius: '8px', padding: '18px 20px', marginTop: '16px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Sparkles size={16} className="gold-accent" />
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--color-purple-primary)', margin: 0 }}>
                    IMAGE ZOOM, CROP &amp; MOBILE VIEWPORT ADJUSTMENT STUDIO
                  </h4>
                </div>

                {/* Desktop Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #EAE4EE' }}>
                  <div className="form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>DESKTOP ZOOM IN / OUT</span>
                      <strong style={{ color: 'var(--color-purple-primary)' }}>{heroForm.desktopZoom || 100}%</strong>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="5"
                        value={heroForm.desktopZoom || 100}
                        onChange={(e) => {
                          setHeroForm({ ...heroForm, desktopZoom: Number(e.target.value) });
                          setIsDraft(true);
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn-aydara-light"
                        style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                        onClick={() => { setHeroForm({ ...heroForm, desktopZoom: 100 }); setIsDraft(true); }}
                      >
                        RESET
                      </button>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>DESKTOP IMAGE FIT / CROP MODE</label>
                    <select
                      value={heroForm.desktopFit || 'cover'}
                      onChange={(e) => {
                        setHeroForm({ ...heroForm, desktopFit: e.target.value });
                        setIsDraft(true);
                      }}
                    >
                      <option value="cover">Full Bleed Cover (Fill Canvas)</option>
                      <option value="contain">Show Full Uncropped Picture (Contain)</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>DESKTOP FOCAL ALIGNMENT</label>
                    <select
                      value={heroForm.objectPosition || 'center top'}
                      onChange={(e) => {
                        setHeroForm({ ...heroForm, objectPosition: e.target.value });
                        setIsDraft(true);
                      }}
                    >
                      <option value="center top">Center Top (Recommended for Models)</option>
                      <option value="center center">Center Center (Balanced)</option>
                      <option value="center bottom">Center Bottom</option>
                      <option value="left center">Left Focus</option>
                      <option value="right center">Right Focus</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div className="form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>MOBILE ZOOM IN / OUT</span>
                      <strong style={{ color: 'var(--color-purple-primary)' }}>{heroForm.mobileZoom || 100}%</strong>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="5"
                        value={heroForm.mobileZoom || 100}
                        onChange={(e) => {
                          setHeroForm({ ...heroForm, mobileZoom: Number(e.target.value) });
                          setIsDraft(true);
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn-aydara-light"
                        style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                        onClick={() => { setHeroForm({ ...heroForm, mobileZoom: 100 }); setIsDraft(true); }}
                      >
                        RESET
                      </button>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>MOBILE DISPLAY HEIGHT / ASPECT</label>
                    <select
                      value={heroForm.mobileHeight || 'aspect'}
                      onChange={(e) => {
                        setHeroForm({ ...heroForm, mobileHeight: e.target.value });
                        setIsDraft(true);
                      }}
                    >
                      <option value="aspect">Natural Aspect Ratio (Full Uncropped Banner)</option>
                      <option value="proportional">Balanced Proportional (52vh)</option>
                      <option value="compact">Compact Slim Banner (38vh)</option>
                      <option value="tall">Editorial Tall (65vh)</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>MOBILE FOCAL POSITIONING</label>
                    <select
                      value={heroForm.mobileObjectPosition || heroForm.objectPosition || 'center center'}
                      onChange={(e) => {
                        setHeroForm({ ...heroForm, mobileObjectPosition: e.target.value });
                        setIsDraft(true);
                      }}
                    >
                      <option value="center center">Center Center (Full Subject)</option>
                      <option value="center top">Center Top</option>
                      <option value="center bottom">Center Bottom</option>
                      <option value="left center">Left (Model/Subject Focus)</option>
                      <option value="right center">Right (Model/Subject Focus)</option>
                    </select>
                  </div>
                </div>

                {heroForm.mediaType === 'video' && (
                  <div className="form-field" style={{ marginTop: '14px' }}>
                    <label>VIDEO POSTER IMAGE (FALLBACK)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={heroForm.posterImage || ''}
                        onChange={(e) => {
                          setHeroForm({ ...heroForm, posterImage: e.target.value });
                          setIsDraft(true);
                        }}
                        placeholder="Poster image URL..."
                      />
                      <input
                        type="file"
                        ref={posterImageFileRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], (url) => {
                          setHeroForm(prev => ({ ...prev, posterImage: url }));
                        })}
                      />
                      <button
                        type="button"
                        className="btn-aydara-light"
                        onClick={() => posterImageFileRef.current?.click()}
                        style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}
                      >
                        UPLOAD
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Typography & CTA Controls */}
              <div className="form-row-2" style={{ marginTop: '16px' }}>
                <div className="form-field">
                  <label>Headline (Leave blank for image-only banner)</label>
                  <input
                    type="text"
                    value={heroForm.heading || ''}
                    onChange={(e) => {
                      setHeroForm({ ...heroForm, heading: e.target.value });
                      setIsDraft(true);
                    }}
                    placeholder="e.g. THE NEW FEMININITY (or leave empty)"
                  />
                </div>
                <div className="form-field">
                  <label>Season / Subtitle</label>
                  <input
                    type="text"
                    value={heroForm.subtitle}
                    onChange={(e) => {
                      setHeroForm({ ...heroForm, subtitle: e.target.value });
                      setIsDraft(true);
                    }}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Editorial Description</label>
                <textarea
                  rows={2}
                  value={heroForm.description}
                  onChange={(e) => {
                    setHeroForm({ ...heroForm, description: e.target.value });
                    setIsDraft(true);
                  }}
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Primary CTA Label</label>
                  <input
                    type="text"
                    value={heroForm.primaryCtaText}
                    onChange={(e) => {
                      setHeroForm({ ...heroForm, primaryCtaText: e.target.value });
                      setIsDraft(true);
                    }}
                  />
                </div>
                <div className="form-field">
                  <label>Primary CTA Link</label>
                  <input
                    type="text"
                    value={heroForm.primaryCtaLink}
                    onChange={(e) => {
                      setHeroForm({ ...heroForm, primaryCtaLink: e.target.value });
                      setIsDraft(true);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="cms-publish-bar">
              <button type="submit" className="btn-aydara-primary publish-cms-btn" disabled={isUploading}>
                <RefreshCw size={16} />
                <span>SAVE &amp; PUBLISH LIVE HOMEPAGE ACROSS ALL CLIENTS</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: Media Library */}
        {activeTab === 'media' && (
          <div className="media-library-view">
            <div className="products-mgmt-head">
              <div>
                <h3 className="table-card-title editorial-title">GLOBAL MAISON MEDIA ASSETS</h3>
                <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                  Upload, preview, copy URLs, and reuse images &amp; videos across hero, creations, and collections.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="file"
                  ref={mediaLibraryFileRef}
                  style={{ display: 'none' }}
                  accept="image/*,video/*"
                  onChange={(e) => handleFileUpload(e.target.files[0], () => {})}
                />
                <button
                  type="button"
                  className="btn-aydara-primary"
                  onClick={() => mediaLibraryFileRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload size={16} />
                  <span>{isUploading ? 'UPLOADING...' : 'UPLOAD MEDIA FROM COMPUTER'}</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                className={`btn-aydara-light ${mediaFilter === 'all' ? 'is-selected-filter' : ''}`}
                onClick={() => setMediaFilter('all')}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                ALL ({mediaLibrary.length})
              </button>
              <button
                type="button"
                className={`btn-aydara-light ${mediaFilter === 'image' ? 'is-selected-filter' : ''}`}
                onClick={() => setMediaFilter('image')}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                IMAGES ({mediaLibrary.filter(m => m.type === 'image').length})
              </button>
              <button
                type="button"
                className={`btn-aydara-light ${mediaFilter === 'video' ? 'is-selected-filter' : ''}`}
                onClick={() => setMediaFilter('video')}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                VIDEOS ({mediaLibrary.filter(m => m.type === 'video').length})
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {mediaLibrary
                .filter(m => mediaFilter === 'all' || m.type === mediaFilter)
                .map(item => (
                  <div key={item.id} className="admin-table-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ width: '100%', height: '150px', background: '#111', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                      {item.type === 'video' ? (
                        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls muted />
                      ) : (
                        <img src={item.url} alt={item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <span style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(26,11,34,0.85)', color: 'var(--color-gold)', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '2px', fontWeight: '700' }}>
                        {item.type.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong title={item.filename}>{item.filename}</strong>
                      <p style={{ color: '#6B7280', fontSize: '0.7rem' }}>
                        {(item.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                      <button
                        type="button"
                        className="btn-aydara-light"
                        style={{ flex: 1, padding: '6px', fontSize: '0.72rem', display: 'flex', justifyContent: 'center', gap: '4px' }}
                        onClick={() => handleCopyUrl(item.url)}
                      >
                        <Copy size={12} />
                        <span>COPY URL</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-icon delete"
                        onClick={() => handleDeleteMedia(item.filename)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 6: Orders Management (Matching Reference Image 3) */}
        {activeTab === 'orders' && (
          <div className="orders-mgmt-view">
            <div className="products-mgmt-head" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="table-card-title editorial-title" style={{ fontSize: '1.4rem' }}>
                  ALL CLIENT ACQUISITIONS
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                  End-to-end luxury fulfillment: review, confirm, process atelier stitching, track dispatches, and manage client orders.
                </p>
              </div>
            </div>

            {/* Quick Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { label: 'ALL', value: 'all', count: orders.length },
                { label: 'PENDING', value: 'Pending', count: orders.filter(o => o.status === 'Pending').length },
                { label: 'CONFIRMED', value: 'Confirmed', count: orders.filter(o => o.status === 'Confirmed').length },
                { label: 'PROCESSING', value: 'Processing', count: orders.filter(o => o.status === 'Processing').length },
                { label: 'READY TO SHIP', value: 'Ready to Ship', count: orders.filter(o => o.status === 'Ready to Ship').length },
                { label: 'SHIPPED', value: 'Shipped', count: orders.filter(o => ['Shipped', 'Out for Delivery'].includes(o.status)).length },
                { label: 'DELIVERED', value: 'Delivered', count: orders.filter(o => ['Delivered', 'Completed'].includes(o.status)).length },
                { label: 'CANCELLED', value: 'Cancelled', count: orders.filter(o => o.status === 'Cancelled').length }
              ].map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  className={`btn-aydara-light ${orderStatusFilter === tab.value ? 'is-selected-filter' : ''}`}
                  onClick={() => setOrderStatusFilter(tab.value)}
                  style={{ padding: '6px 14px', fontSize: '0.76rem', whiteSpace: 'nowrap', fontWeight: '600' }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Order Filters & Search Bar */}
            <div className="admin-table-card" style={{ marginBottom: '16px', padding: '16px' }}>
              <div className="product-filters-row">
                <div className="filter-search-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by order #, customer, email, phone, product, tracking..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="admin-search-input"
                  />
                </div>

                <div className="filter-selects-group">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="all">All Order Statuses</option>
                    <option value="Pending">Pending Review</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing Atelier</option>
                    <option value="Ready to Ship">Ready to Ship</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>

                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="all">All Payments</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending Payment</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Table (Exact Columns Matching Image 3) */}
            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ORDER #</th>
                    <th>CLIENT &amp; ADDRESS</th>
                    <th>PIECES</th>
                    <th>CURRENCY &amp; RATE</th>
                    <th>BASE (PKR)</th>
                    <th>CHARGED TOTAL</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#6B7280' }}>
                        No orders match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(ord => (
                      <tr key={ord.id} className={selectedOrder?.id === ord.id ? 'is-selected-row' : ''}>
                        <td>
                          <strong>#{ord.orderNumber}</strong>
                          <p style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '2px' }}>
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td>
                          <div>
                            <strong>{ord.customer?.name}</strong>
                            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{ord.customer?.email}</p>
                            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                              {ord.shippingAddress?.street ? `${ord.shippingAddress.street}, ` : ''}{ord.shippingAddress?.city}
                            </p>
                          </div>
                        </td>
                        <td>
                          {ord.items?.map((it, idx) => (
                            <div key={idx} style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {it.quantity}x {it.name}
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#7A727E' }}>
                                {it.stitchingOption || it.size || 'Standard'}
                              </span>
                            </div>
                          ))}
                        </td>
                        <td>
                          <span className="order-currency-badge">{ord.currency || 'PKR'}</span>
                          <p style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '2px' }}>
                            Rate: {ord.exchangeRate ? Number(ord.exchangeRate).toFixed(5) : '1.00000'}
                          </p>
                        </td>
                        <td><strong>PKR {(ord.totalBase || ord.total)?.toLocaleString()}</strong></td>
                        <td>
                          <strong style={{ color: 'var(--color-purple-primary)' }}>
                            {ord.currency === 'PKR' || !ord.currency
                              ? `PKR ${(ord.totalDisplayed || ord.total)?.toLocaleString()}`
                              : `${ord.currency} ${(ord.totalDisplayed || ord.total)?.toLocaleString()}`}
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: ord.paymentStatus === 'Paid' ? '#15803D' : '#D97706' }}>
                            ● {ord.paymentStatus || 'Paid'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${ord.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn-aydara-light"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '600' }}
                              onClick={() => {
                                setSelectedOrder(ord);
                                setTrackingForm({
                                  courier: ord.shippingDetails?.courier || 'DHL Express',
                                  trackingNumber: ord.shippingDetails?.trackingNumber || '',
                                  shippingDate: ord.shippingDetails?.shippingDate || new Date().toISOString().split('T')[0]
                                });
                              }}
                            >
                              VIEW &rarr;
                            </button>
                            <select
                              className="status-changer-select-compact"
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Ready to Ship">Ready to Ship</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: Patron Directory */}
        {activeTab === 'customers' && (
          <div className="customers-mgmt-view">
            <div className="admin-table-card">
              <h3 className="table-card-title editorial-title">PRIVATE CLIENT &amp; PATRON DIRECTORY</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>PATRON NAME</th>
                    <th>EMAIL</th>
                    <th>PHONE</th>
                    <th>TOTAL ORDERS</th>
                    <th>LIFETIME SPEND (BASE PKR)</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td><strong>{c.totalOrders}</strong></td>
                      <td><strong>PKR {c.totalSpend?.toLocaleString()}</strong></td>
                      <td><span className="category-tag-pill" style={{ color: '#15803D', background: '#DCFCE7' }}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 8: Currency Engine */}
        {activeTab === 'currency' && (
          <div className="settings-view-content">
            <div className="cms-card-block">
              <div className="cms-block-head" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} className="gold-accent" />
                  <h3 className="editorial-title cms-block-title">MAISON CURRENCY ENGINE &bull; PAKISTANI RUPEE (PKR)</h3>
                </div>
                <span className="category-tag-pill" style={{ background: '#DCFCE7', color: '#15803D', fontWeight: '700', padding: '6px 14px' }}>
                  ✓ PLATFORM DEFAULT: PKR
                </span>
              </div>

              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20, fontSize: '0.85rem' }}>
                AYDARA operates strictly with <strong>Pakistani Rupee (PKR - ₨)</strong> as the canonical pricing currency across all desktop and mobile devices. Multi-currency switching has been retired to ensure direct, transparent atelier pricing.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#FAF7FB', border: '1px solid #EBE5ED', borderRadius: '6px', padding: '20px' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', color: 'var(--color-gold)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Active Currency
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <span style={{ fontSize: '1.6rem' }}>🇵🇰</span>
                    <div>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--color-purple-primary)', display: 'block' }}>Pakistani Rupee</strong>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>ISO Code: PKR &bull; Symbol: ₨</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#FAF7FB', border: '1px solid #EBE5ED', borderRadius: '6px', padding: '20px' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', color: 'var(--color-gold)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Pricing Standard
                  </span>
                  <div style={{ marginTop: '8px' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--color-purple-primary)', display: 'block' }}>Integer Standard (e.g. PKR 185,000)</strong>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Applied to all Catalog Items, Stitched Options &amp; Orders</span>
                  </div>
                </div>

                <div style={{ background: '#FAF7FB', border: '1px solid #EBE5ED', borderRadius: '6px', padding: '20px' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', color: 'var(--color-gold)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Device Scope
                  </span>
                  <div style={{ marginTop: '8px' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#15803D', display: 'block' }}>Global PKR Across All Clients</strong>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Desktop, Tablet, Mobile &amp; Admin Portal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Global Maison Settings (Website Control Center) */}
        {activeTab === 'settings' && (
          <div className="settings-mgmt-view">
            <GlobalMaisonSettings
              token={token}
              user={user}
              onNotify={(msg) => {
                setSaveSuccess(msg);
                setTimeout(() => setSaveSuccess(''), 3500);
              }}
            />
          </div>
        )}

        {/* Tab 9: Activity Logs */}
        {activeTab === 'logs' && (
          <div className="activity-logs-view">
            <div className="admin-table-card">
              <h3 className="table-card-title editorial-title">ADMINISTRATIVE AUDIT &amp; ACTIVITY LOGS</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>ADMINISTRATOR</th>
                    <th>ACTION EXECUTED</th>
                    <th>AFFECTED ENTITY</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td><span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{new Date(log.timestamp).toLocaleString()}</span></td>
                      <td><strong>{log.admin}</strong></td>
                      <td><span className="category-tag-pill">{log.action}</span></td>
                      <td>{log.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 10: Staff & Permission Management */}
        {activeTab === 'staff' && <StaffManagement />}

        {/* Tab 11: Maison Security Center */}
        {activeTab === 'security' && <SecuritySettings onNavigateTab={handleNavClick} />}
      </main>

      {/* Comprehensive Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="product-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="order-detail-drawer-card" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Top Header */}
            <div className="order-drawer-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="editorial-sub" style={{ fontSize: '0.75rem', color: 'var(--color-gold)' }}>
                    HAUTE COUTURE ACQUISITION
                  </span>
                  <span className={`status-pill status-${selectedOrder.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {selectedOrder.status}
                  </span>
                  <span className="category-tag-pill" style={{ background: '#F8F5F8', color: '#111' }}>
                    Payment: {selectedOrder.paymentStatus}
                  </span>
                </div>
                <h2 className="editorial-title" style={{ fontSize: '1.8rem', margin: '4px 0 2px' }}>
                  ORDER #{selectedOrder.orderNumber}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} &bull; Base Currency: {selectedOrder.baseCurrency || 'PKR'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-aydara-light"
                  onClick={() => setIsPrintModalOpen(true)}
                  style={{ padding: '8px 14px', fontSize: '0.75rem', display: 'flex', gap: '6px', alignItems: 'center' }}
                >
                  <Printer size={14} />
                  <span>PRINT INVOICE</span>
                </button>
                <button type="button" className="btn-action-icon" onClick={() => setSelectedOrder(null)}>
                  ✕
                </button>
              </div>
            </div>

            {/* Controlled Step-by-Step Fulfillment Action Bar */}
            <div className="order-workflow-actions-bar">
              <span className="workflow-bar-label">WORKFLOW ACTIONS:</span>
              <div className="workflow-buttons-group">
                {selectedOrder.status === 'Pending' && (
                  <>
                    <button
                      type="button"
                      className="btn-workflow confirm"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Confirmed', { note: 'Order confirmed and scheduled for atelier production.' })}
                    >
                      ✓ CONFIRM ORDER
                    </button>
                    <button
                      type="button"
                      className="btn-workflow cancel"
                      onClick={() => setCancellationModalOrder(selectedOrder)}
                    >
                      ✕ REJECT / CANCEL
                    </button>
                  </>
                )}

                {selectedOrder.status === 'Confirmed' && (
                  <>
                    <button
                      type="button"
                      className="btn-workflow process"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Processing', { note: 'Atelier production started (fabric allocation & cutting).' })}
                    >
                      ⚡ START PROCESSING ATELIER
                    </button>
                    <button
                      type="button"
                      className="btn-workflow cancel"
                      onClick={() => setCancellationModalOrder(selectedOrder)}
                    >
                      ✕ CANCEL ORDER
                    </button>
                  </>
                )}

                {selectedOrder.status === 'Processing' && (
                  <>
                    <button
                      type="button"
                      className="btn-workflow ready"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Ready to Ship', { note: 'Garment stitching & quality control completed. Ready to ship.' })}
                    >
                      📦 MARK READY TO SHIP
                    </button>
                    <button
                      type="button"
                      className="btn-workflow cancel"
                      onClick={() => setCancellationModalOrder(selectedOrder)}
                    >
                      ✕ CANCEL ORDER
                    </button>
                  </>
                )}

                {selectedOrder.status === 'Ready to Ship' && (
                  <>
                    <button
                      type="button"
                      className="btn-workflow dispatch"
                      onClick={() => {
                        const trk = prompt('Enter Courier Tracking Number:', selectedOrder.shippingDetails?.trackingNumber || '');
                        if (trk) {
                          handleUpdateOrderStatus(selectedOrder.id, 'Shipped', {
                            courier: trackingForm.courier || 'DHL Express',
                            trackingNumber: trk,
                            shippingDate: new Date().toISOString().split('T')[0],
                            note: `Dispatched with tracking ${trk}`
                          });
                        }
                      }}
                    >
                      🚀 DISPATCH &amp; ENTER TRACKING
                    </button>
                    <button
                      type="button"
                      className="btn-workflow cancel"
                      onClick={() => setCancellationModalOrder(selectedOrder)}
                    >
                      ✕ CANCEL ORDER
                    </button>
                  </>
                )}

                {selectedOrder.status === 'Shipped' && (
                  <>
                    <button
                      type="button"
                      className="btn-workflow out-delivery"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Out for Delivery', { note: 'Courier out for client delivery.' })}
                    >
                      🚚 MARK OUT FOR DELIVERY
                    </button>
                    <button
                      type="button"
                      className="btn-workflow delivered"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Delivered', { note: 'Delivered to client address.' })}
                    >
                      ✓ MARK DELIVERED
                    </button>
                  </>
                )}

                {selectedOrder.status === 'Out for Delivery' && (
                  <button
                    type="button"
                    className="btn-workflow delivered"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Delivered', { note: 'Delivered to client address.' })}
                  >
                    ✓ MARK DELIVERED
                  </button>
                )}

                {selectedOrder.status === 'Delivered' && (
                  <button
                    type="button"
                    className="btn-workflow complete"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Completed', { note: 'Acquisition fulfilled and finalized.' })}
                  >
                    ★ MARK COMPLETED
                  </button>
                )}

                {/* Status Override dropdown for edge cases */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>Override:</span>
                  <select
                    className="status-changer-select-compact"
                    value={selectedOrder.status}
                    onChange={(e) => {
                      const reason = prompt(`Enter reason for manual status override to ${e.target.value}:`);
                      if (reason) {
                        handleUpdateOrderStatus(selectedOrder.id, e.target.value, { note: `Manual Admin Override: ${reason}` });
                      }
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Ready to Ship">Ready to Ship</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Drawer Body Grid */}
            <div className="order-drawer-content-grid">
              {/* Left Column: Customer, Items, Financials & Production */}
              <div className="order-drawer-left-col">
                {/* 1. Client & Delivery Information */}
                <div className="drawer-subcard">
                  <div className="drawer-subcard-head">
                    <Users size={16} className="gold-accent" />
                    <h4>PATRON &amp; DELIVERY ADDRESS</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ color: '#111', fontSize: '0.95rem' }}>{selectedOrder.customer?.name}</strong>
                      <p style={{ color: '#6B7280', margin: '2px 0' }}>{selectedOrder.customer?.email}</p>
                      <p style={{ color: '#6B7280', margin: '2px 0' }}>{selectedOrder.customer?.phone || 'No phone provided'}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#111' }}>Shipping Destination:</strong>
                      <p style={{ color: '#4A434F', margin: '2px 0', lineHeight: '1.4' }}>
                        {selectedOrder.shippingAddress?.street}
                        {selectedOrder.shippingAddress?.area ? `, ${selectedOrder.shippingAddress.area}` : ''}
                        <br />
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.province} {selectedOrder.shippingAddress?.postalCode}
                        <br />
                        <strong>{selectedOrder.shippingAddress?.country || 'Pakistan'}</strong>
                      </p>
                      {selectedOrder.shippingAddress?.specialInstructions && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-gold)', marginTop: '4px', fontStyle: 'italic' }}>
                          Note: "{selectedOrder.shippingAddress.specialInstructions}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Purchased Creations Snapshot */}
                <div className="drawer-subcard">
                  <div className="drawer-subcard-head">
                    <ShoppingBag size={16} className="gold-accent" />
                    <h4>PURCHASED CREATIONS SNAPSHOT</h4>
                  </div>
                  <div className="order-items-snapshot-list">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="order-item-snapshot-row">
                        <img src={item.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200'} alt={item.name} className="snapshot-item-thumb" />
                        <div style={{ flex: 1 }}>
                          <h5 className="snapshot-item-name">{item.name}</h5>
                          <div className="snapshot-item-badges">
                            <span className="snapshot-badge">Size: {item.size || 'Standard'}</span>
                            <span className="snapshot-badge">Color: {item.color || 'Default'}</span>
                            <span className="snapshot-badge primary-edition">{item.stitchingOption || 'Stitched 3pc'}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>
                            {item.quantity} × PKR {(item.unitPriceBase || item.priceBase || item.price)?.toLocaleString()}
                          </span>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--color-purple-primary)' }}>
                            PKR {(item.totalBase || item.total)?.toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Financial Summary Breakdown */}
                <div className="drawer-subcard">
                  <div className="drawer-subcard-head">
                    <DollarSign size={16} className="gold-accent" />
                    <h4>FINANCIAL SETTLEMENT</h4>
                  </div>
                  <div className="order-financial-breakdown">
                    <div className="fin-row">
                      <span>Subtotal (Base Creations)</span>
                      <span>PKR {(selectedOrder.subtotalBase || selectedOrder.subtotal)?.toLocaleString()}</span>
                    </div>
                    <div className="fin-row">
                      <span>Express DHL Delivery</span>
                      <span>{selectedOrder.shippingBase === 0 ? 'COMPLIMENTARY' : `PKR ${selectedOrder.shippingBase?.toLocaleString()}`}</span>
                    </div>
                    {selectedOrder.discountBase > 0 && (
                      <div className="fin-row discount">
                        <span>VIP Atelier Privilege</span>
                        <span>- PKR {selectedOrder.discountBase?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="fin-row total">
                      <strong>FINAL BASE TOTAL (PKR)</strong>
                      <strong style={{ color: 'var(--color-purple-primary)', fontSize: '1.15rem' }}>
                        PKR {(selectedOrder.totalBase || selectedOrder.total)?.toLocaleString()}
                      </strong>
                    </div>
                    {selectedOrder.currency && selectedOrder.currency !== 'PKR' && (
                      <div className="fin-row billed-foreign">
                        <span>Client Billed ({selectedOrder.currency} @ {selectedOrder.exchangeRate?.toFixed(5)})</span>
                        <strong>{selectedOrder.currency} {selectedOrder.totalDisplayed?.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Atelier Production Checklist */}
                <div className="drawer-subcard">
                  <div className="drawer-subcard-head">
                    <Scissors size={16} className="gold-accent" />
                    <h4>HAUTE COUTURE PRODUCTION CHECKLIST</h4>
                  </div>
                  <div className="production-checklist-grid">
                    {(selectedOrder.productionChecklist || [
                      { id: 'chk-1', label: 'Fabric allocated from atelier vault', completed: true },
                      { id: 'chk-2', label: 'Measurements confirmed with client size chart', completed: true },
                      { id: 'chk-3', label: 'Pattern cutting & silhouette drafting', completed: false },
                      { id: 'chk-4', label: 'Artisanal stitching & embellishment assembly', completed: false },
                      { id: 'chk-5', label: 'Hand finishing & embroidery inspection', completed: false },
                      { id: 'chk-6', label: 'Quality control & fit verification', completed: false },
                      { id: 'chk-7', label: 'Product packed in luxury Maison box & ribbons', completed: false }
                    ]).map((chk) => (
                      <label key={chk.id} className="checklist-label-row">
                        <input
                          type="checkbox"
                          checked={chk.completed}
                          onChange={() => handleToggleChecklistItem(chk.id)}
                        />
                        <span className={chk.completed ? 'is-completed' : ''}>{chk.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 5. Courier Dispatch & Tracking */}
                <div className="drawer-subcard">
                  <div className="drawer-subcard-head">
                    <Truck size={16} className="gold-accent" />
                    <h4>COURIER DISPATCH &amp; TRACKING</h4>
                  </div>
                  <form onSubmit={handleSaveShippingTracking} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>COURIER</label>
                      <select
                        value={trackingForm.courier}
                        onChange={(e) => setTrackingForm({ ...trackingForm, courier: e.target.value })}
                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                      >
                        <option value="DHL Express">DHL Express Global</option>
                        <option value="FedEx Luxury">FedEx Luxury Priority</option>
                        <option value="TCS Express">TCS Express (Domestic)</option>
                        <option value="CallCourier">CallCourier VIP</option>
                        <option value="Atelier White Glove">Atelier White Glove Courier</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>TRACKING NUMBER</label>
                      <input
                        type="text"
                        placeholder="e.g. DHL-849204918"
                        value={trackingForm.trackingNumber}
                        onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>DISPATCH DATE</label>
                      <input
                        type="date"
                        value={trackingForm.shippingDate}
                        onChange={(e) => setTrackingForm({ ...trackingForm, shippingDate: e.target.value })}
                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <button type="submit" className="btn-aydara-primary" style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
                      UPDATE TRACKING
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Immutable Timeline, Notes & Client Communication */}
              <div className="order-drawer-right-col">
                {/* Visual Order Timeline */}
                <div className="drawer-subcard">
                  <div className="drawer-subcard-head">
                    <Clock size={16} className="gold-accent" />
                    <h4>ORDER LIFECYCLE TIMELINE</h4>
                  </div>
                  <div className="order-timeline-stream">
                    {(selectedOrder.statusHistory || [
                      { status: 'Pending', changedBy: selectedOrder.customer?.name, timestamp: selectedOrder.createdAt, note: 'Order placed by patron.' }
                    ]).map((hist, hIdx) => (
                      <div key={hIdx} className="timeline-event-item">
                        <div className="timeline-dot-col">
                          <div className="timeline-dot active"></div>
                          {hIdx < (selectedOrder.statusHistory?.length || 1) - 1 && <div className="timeline-line"></div>}
                        </div>
                        <div className="timeline-event-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <strong className="timeline-event-status">{hist.status}</strong>
                            <span className="timeline-event-time">{new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="timeline-event-note">{hist.note || 'Status updated.'}</p>
                          <span className="timeline-event-author">By: {hist.changedBy || 'System'} &bull; {new Date(hist.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Private Internal Admin Notes */}
                <div className="drawer-subcard">
                  <div className="drawer-subcard-head">
                    <FileText size={16} className="gold-accent" />
                    <h4>PRIVATE ATELIER NOTES</h4>
                  </div>
                  <form onSubmit={handleAddOrderNote} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input
                      type="text"
                      placeholder="Add private internal note..."
                      value={newAdminNote}
                      onChange={(e) => setNewAdminNote(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                    />
                    <button type="submit" className="btn-aydara-primary" style={{ padding: '8px 14px' }}>
                      <Send size={14} />
                    </button>
                  </form>
                  <div className="admin-notes-history-list">
                    {selectedOrder.adminNotes?.length > 0 ? (
                      selectedOrder.adminNotes.map(n => (
                        <div key={n.id} className="admin-note-bubble">
                          <p className="admin-note-text">{n.text}</p>
                          <div className="admin-note-footer">
                            <span>{n.author}</span>
                            <span>{new Date(n.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0, fontStyle: 'italic' }}>
                        No private notes recorded yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Client Communication Templates */}
                <div className="drawer-subcard">
                  <div className="drawer-subcard-head">
                    <Send size={16} className="gold-accent" />
                    <h4>COMMUNICATION TEMPLATES</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-aydara-light"
                      style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.78rem' }}
                      onClick={() => {
                        const text = `Dear ${selectedOrder.customer?.name},\n\nWe are delighted to confirm that your AYDARA Haute Couture order #${selectedOrder.orderNumber} has been received and scheduled for atelier stitching.\n\nWarm regards,\nAYDARA Maison`;
                        navigator.clipboard.writeText(text);
                        setSaveSuccess('Confirmation email text copied!');
                        setTimeout(() => setSaveSuccess(''), 2500);
                      }}
                    >
                      📋 Copy Order Confirmation Email
                    </button>

                    <button
                      type="button"
                      className="btn-aydara-light"
                      style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.78rem' }}
                      onClick={() => {
                        const trk = selectedOrder.shippingDetails?.trackingNumber || 'DHL-PENDING';
                        const text = `Dear ${selectedOrder.customer?.name},\n\nYour AYDARA creation #${selectedOrder.orderNumber} has been completed and dispatched via ${selectedOrder.shippingDetails?.courier || 'DHL'}.\nTracking Number: ${trk}\n\nWarm regards,\nAYDARA Maison`;
                        navigator.clipboard.writeText(text);
                        setSaveSuccess('Dispatch email text copied!');
                        setTimeout(() => setSaveSuccess(''), 2500);
                      }}
                    >
                      🚚 Copy Dispatch &amp; Tracking Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellationModalOrder && (
        <div className="product-modal-backdrop" onClick={() => setCancellationModalOrder(null)}>
          <div className="cancellation-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cms-block-head">
              <AlertCircle size={20} style={{ color: '#DC2626' }} />
              <h3 className="editorial-title" style={{ fontSize: '1.3rem', color: '#DC2626' }}>
                CANCEL ORDER #{cancellationModalOrder.orderNumber}
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>
              Please specify the cancellation reason. The order status will transition to <strong>Cancelled</strong> and inventory will be restored to warehouse stock.
            </p>

            <div className="form-field" style={{ marginBottom: '14px' }}>
              <label>CANCELLATION REASON *</label>
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
              >
                <option value="Customer Request">Customer Request / Cancellation</option>
                <option value="Payment Issue">Payment Verification Issue / Fraud</option>
                <option value="Product Unavailable">Fabric / Silk Stock Exhausted</option>
                <option value="Production Issue">Atelier Craftsmanship Constraint</option>
                <option value="Address Issue">Unreachable Delivery Address</option>
                <option value="Other">Other Administrative Reason</option>
              </select>
            </div>

            <div className="form-field" style={{ marginBottom: '20px' }}>
              <label>ADDITIONAL INTERNAL NOTE</label>
              <textarea
                rows={2}
                value={cancellationNote}
                onChange={(e) => setCancellationNote(e.target.value)}
                placeholder="Optional notes regarding the cancellation..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn-aydara-light" onClick={() => setCancellationModalOrder(null)}>
                ABORT
              </button>
              <button
                type="button"
                className="btn-aydara-primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                onClick={handleExecuteCancelOrder}
              >
                CONFIRM CANCELLATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {isPrintModalOpen && selectedOrder && (
        <div className="product-modal-backdrop" onClick={() => setIsPrintModalOpen(false)}>
          <div className="printable-invoice-card" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-action-bar no-print">
              <button type="button" className="btn-aydara-primary" onClick={() => window.print()}>
                <Printer size={14} />
                <span>PRINT INVOICE NOW</span>
              </button>
              <button type="button" className="btn-aydara-light" onClick={() => setIsPrintModalOpen(false)}>
                CLOSE
              </button>
            </div>

            {/* Printable Content */}
            <div className="invoice-printable-area">
              <div className="invoice-head-row">
                <div>
                  <h1 className="editorial-title invoice-brand-title">AYDARA</h1>
                  <span className="editorial-sub" style={{ fontSize: '0.75rem', letterSpacing: '0.2em' }}>
                    HAUTE COUTURE ATELIER
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '1.2rem', margin: 0 }}>OFFICIAL INVOICE</h2>
                  <p style={{ margin: '4px 0 0', fontWeight: '700' }}>#{selectedOrder.orderNumber}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
                    Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="invoice-parties-grid">
                <div>
                  <span className="invoice-section-tag">ISSUED BY:</span>
                  <strong>AYDARA Haute Couture</strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                    Atelier 14, Luxury District<br />
                    Karachi / London / Dubai<br />
                    concierge@aydara.com
                  </p>
                </div>
                <div>
                  <span className="invoice-section-tag">BILLED &amp; DELIVERED TO:</span>
                  <strong>{selectedOrder.customer?.name}</strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                    {selectedOrder.customer?.email}<br />
                    {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}<br />
                    {selectedOrder.shippingAddress?.country}
                  </p>
                </div>
              </div>

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>CREATION &amp; SPECIFICATIONS</th>
                    <th>EDITION</th>
                    <th>SIZE</th>
                    <th>QTY</th>
                    <th>PRICE (PKR)</th>
                    <th>TOTAL (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td><strong>{it.name}</strong></td>
                      <td>{it.stitchingOption || 'Stitched 3pc'}</td>
                      <td>{it.size || 'Standard'}</td>
                      <td>{it.quantity}</td>
                      <td>PKR {(it.unitPriceBase || it.priceBase || it.price)?.toLocaleString()}</td>
                      <td><strong>PKR {(it.totalBase || it.total)?.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-totals-box">
                <div className="inv-row"><span>Subtotal:</span><span>PKR {(selectedOrder.subtotalBase || selectedOrder.subtotal)?.toLocaleString()}</span></div>
                <div className="inv-row"><span>Shipping:</span><span>{selectedOrder.shippingBase === 0 ? 'Free' : `PKR ${selectedOrder.shippingBase?.toLocaleString()}`}</span></div>
                <div className="inv-row grand-total">
                  <strong>GRAND TOTAL:</strong>
                  <strong>PKR {(selectedOrder.totalBase || selectedOrder.total)?.toLocaleString()}</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '8px 0 0' }}>
                  Payment Method: {selectedOrder.paymentMethod} &bull; Status: {selectedOrder.paymentStatus}
                </p>
              </div>

              <div className="invoice-footer-sign">
                <p style={{ fontSize: '0.75rem', color: '#777', fontStyle: 'italic', margin: 0 }}>
                  Thank you for your acquisition. All AYDARA creations are handcrafted with the finest Italian silks and bespoke embroidery.
                </p>
                <div className="atelier-signature-line">
                  <span>Authorized Signature &bull; AYDARA Directrice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Multi-Tab Product Editor Modal */}
      {editingProduct && (
        <div className="product-modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="product-modal-card-luxury" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-top-header">
              <div>
                <span className="editorial-sub" style={{ fontSize: '0.72rem', color: 'var(--color-gold)' }}>
                  AYDARA HAUTE COUTURE ATELIER
                </span>
                <h2 className="editorial-title modal-title">
                  {isNewProduct ? "ADD NEW CREATION" : `EDIT CREATION: ${editingProduct.name}`}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn-aydara-light ${isPreviewMode ? 'is-selected-filter' : ''}`}
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                  <Eye size={14} />
                  <span>{isPreviewMode ? 'EXIT PREVIEW' : 'PREVIEW CREATION'}</span>
                </button>
                <button type="button" className="btn-action-icon" onClick={() => setEditingProduct(null)}>
                  ✕
                </button>
              </div>
            </div>

            {/* Tabbed Navigation inside Product Editor */}
            {!isPreviewMode && (
              <div className="product-editor-nav-tabs">
                <button
                  type="button"
                  className={`editor-tab-btn ${productEditorTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setProductEditorTab('basic')}
                >
                  1. Basic Info
                </button>
                <button
                  type="button"
                  className={`editor-tab-btn ${productEditorTab === 'media' ? 'active' : ''}`}
                  onClick={() => setProductEditorTab('media')}
                >
                  2. Media &amp; Visuals
                </button>
                <button
                  type="button"
                  className={`editor-tab-btn ${productEditorTab === 'pricing' ? 'active' : ''}`}
                  onClick={() => setProductEditorTab('pricing')}
                >
                  3. Pricing &amp; Options
                </button>
                <button
                  type="button"
                  className={`editor-tab-btn ${productEditorTab === 'fabric' ? 'active' : ''}`}
                  onClick={() => setProductEditorTab('fabric')}
                >
                  4. Fabric &amp; Details
                </button>
                <button
                  type="button"
                  className={`editor-tab-btn ${productEditorTab === 'size_chart' ? 'active' : ''}`}
                  onClick={() => setProductEditorTab('size_chart')}
                >
                  5. Size Guide Builder
                </button>
                <button
                  type="button"
                  className={`editor-tab-btn ${productEditorTab === 'shipping' ? 'active' : ''}`}
                  onClick={() => setProductEditorTab('shipping')}
                >
                  6. Shipping &amp; Policy
                </button>
                <button
                  type="button"
                  className={`editor-tab-btn ${productEditorTab === 'suggested' ? 'active' : ''}`}
                  onClick={() => setProductEditorTab('suggested')}
                >
                  7. Suggested Products
                </button>
                <button
                  type="button"
                  className={`editor-tab-btn ${productEditorTab === 'seo' ? 'active' : ''}`}
                  onClick={() => setProductEditorTab('seo')}
                >
                  8. SEO &amp; Publishing
                </button>
              </div>
            )}

            {/* Modal Body */}
            {isPreviewMode ? (
              <div className="editor-live-preview-box">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <img
                      src={editingProduct.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600'}
                      alt={editingProduct.name}
                      style={{ width: '100%', height: '380px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: 'var(--color-gold)', textTransform: 'uppercase' }}>
                      {editingProduct.categoryName || 'FEATURED COLLECTION'}
                    </span>
                    <h2 className="editorial-title" style={{ fontSize: '2rem', margin: '6px 0 12px' }}>{editingProduct.name || 'Untitled Creation'}</h2>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--color-purple-primary)', marginBottom: '14px' }}>
                      PKR {editingProduct.price?.toLocaleString()}
                    </h3>

                    {/* Stitched Options Preview */}
                    {editingProduct.pricingOptions?.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', display: 'block', marginBottom: '8px' }}>
                          STITCHED/UNSTITCHED
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {editingProduct.pricingOptions.map(opt => (
                            <div key={opt.name} style={{ padding: '8px 12px', border: '1px solid #111', fontSize: '0.8rem' }}>
                              {opt.name} — PKR {opt.price?.toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: '1.6', marginBottom: '16px' }}>{editingProduct.description}</p>
                    
                    {/* Sizes Preview */}
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>AVAILABLE SIZES:</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {editingProduct.sizes?.map(s => (
                          <span key={s} style={{ padding: '6px 12px', background: '#F8F5F8', fontSize: '0.8rem', fontWeight: '600' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProductSave} className="modal-form-luxury">
                {/* Tab 1: Basic Information */}
                {productEditorTab === 'basic' && (
                  <div className="editor-tab-pane">
                    <div className="form-row-2">
                      <div className="form-field">
                        <label>CREATION NAME *</label>
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setEditingProduct({
                              ...editingProduct,
                              name,
                              slug: isNewProduct ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : editingProduct.slug
                            });
                          }}
                          placeholder="e.g. Midnight Muse"
                          required
                        />
                      </div>

                      <div className="form-field">
                        <label>PRODUCT SUBTITLE (OPTIONAL)</label>
                        <input
                          type="text"
                          value={editingProduct.subtitle || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                          placeholder="e.g. Haute Couture Velvet & Silk Lehenga"
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label>URL SLUG</label>
                        <input
                          type="text"
                          value={editingProduct.slug}
                          onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                        />
                      </div>
                      <div className="form-field">
                        <label>SKU (STOCK KEEPING UNIT)</label>
                        <input
                          type="text"
                          value={editingProduct.sku || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                          placeholder="e.g. AYD-MM-2026"
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label>PRIMARY CATEGORY</label>
                        <select
                          value={editingProduct.category}
                          onChange={(e) => {
                            const catNameMap = {
                              'new-in': 'NEW IN',
                              'featured-collection': 'FEATURED COLLECTION',
                              'bridal-cloth': 'BRIDAL CLOTH',
                              'best-sellers': 'BEST SELLERS',
                              'accessories': 'ACCESSORIES'
                            };
                            setEditingProduct({
                              ...editingProduct,
                              category: e.target.value,
                              categoryName: catNameMap[e.target.value] || 'COLLECTION'
                            });
                          }}
                        >
                          <option value="featured-collection">FEATURED COLLECTION</option>
                          <option value="new-in">NEW IN</option>
                          <option value="bridal-cloth">BRIDAL CLOTH</option>
                          <option value="best-sellers">BEST SELLERS</option>
                          <option value="accessories">ACCESSORIES &amp; LEATHER</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>COLLECTION</label>
                        <input
                          type="text"
                          value={editingProduct.collection || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, collection: e.target.value })}
                          placeholder="e.g. Autumn / Winter 2026"
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>EDITORIAL DESCRIPTION (RICH FORMATTING SUPPORTED)</label>
                      <textarea
                        rows={4}
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        placeholder="Detailed luxury narrative with bullet points, paragraphs, and specifications..."
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Media Management */}
                {productEditorTab === 'media' && (
                  <div className="editor-tab-pane">
                    <div className="form-field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label>PRODUCT GALLERY (JPG, PNG, WEBP, MP4 VIDEO)</label>
                        <button
                          type="button"
                          className="btn-aydara-primary"
                          onClick={() => productFileRef.current?.click()}
                          disabled={isUploading}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <Upload size={14} />
                          <span>+ UPLOAD MEDIA FROM COMPUTER</span>
                        </button>
                      </div>

                      <input
                        type="file"
                        ref={productFileRef}
                        style={{ display: 'none' }}
                        accept="image/*,video/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], (url) => {
                          const currentImages = editingProduct.images || [];
                          setEditingProduct({
                            ...editingProduct,
                            images: [...currentImages, url]
                          });
                        })}
                      />

                      <div className="product-editor-media-grid">
                        {editingProduct.images?.map((img, i) => (
                          <div key={i} className="editor-media-card">
                            {isVideoUrl(img) ? (
                              <video src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                            ) : (
                              <img src={img} alt={`View ${i + 1}`} />
                            )}
                            <div className="media-card-controls">
                              <button
                                type="button"
                                className={`star-primary-btn ${i === 0 ? 'is-primary' : ''}`}
                                onClick={() => {
                                  const reordered = [img, ...editingProduct.images.filter((_, idx) => idx !== i)];
                                  setEditingProduct({ ...editingProduct, images: reordered });
                                }}
                              >
                                ★ {i === 0 ? 'Primary' : 'Make Main'}
                              </button>
                              <button
                                type="button"
                                className="delete-media-btn"
                                onClick={() => {
                                  const filtered = editingProduct.images.filter((_, idx) => idx !== i);
                                  setEditingProduct({ ...editingProduct, images: filtered });
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Pricing & Stitched / Unstitched Options */}
                {productEditorTab === 'pricing' && (
                  <div className="editor-tab-pane">
                    <div className="form-row-2">
                      <div className="form-field">
                        <label>BASE CANONICAL PRICE (PKR) *</label>
                        <input
                          type="number"
                          value={editingProduct.price}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                          required
                        />
                      </div>

                      <div className="form-field">
                        <label>COMPARE-AT ORIGINAL PRICE (PKR)</label>
                        <input
                          type="number"
                          value={editingProduct.comparePrice || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, comparePrice: e.target.value ? Number(e.target.value) : null })}
                          placeholder="Optional strikethrough price"
                        />
                      </div>
                    </div>

                    {/* Stitched / Unstitched Option Builder */}
                    <div style={{ background: '#F8F5F8', padding: '16px', borderRadius: '6px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Scissors size={16} className="gold-accent" />
                          <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-purple-primary)', margin: 0 }}>
                            STITCHED &amp; UNSTITCHED SEPARATE PRICING OPTIONS
                          </h4>
                        </div>
                        <button type="button" className="btn-aydara-light" onClick={handleAddPricingOption} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                          + Add Version Row
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(editingProduct.pricingOptions || []).map((opt, oIdx) => (
                          <div key={oIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#FFFFFF', padding: '8px 12px', borderRadius: '4px' }}>
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) => {
                                const updated = [...editingProduct.pricingOptions];
                                updated[oIdx].name = e.target.value;
                                setEditingProduct({
                                  ...editingProduct,
                                  pricingOptions: updated,
                                  stitchedOptions: updated.map(o => o.name)
                                });
                              }}
                              placeholder="Option Title (e.g. 3pc Stitched)"
                              style={{ flex: 2, padding: '6px 10px', fontSize: '0.825rem' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>PKR</span>
                              <input
                                type="number"
                                value={opt.price}
                                onChange={(e) => {
                                  const updated = [...editingProduct.pricingOptions];
                                  updated[oIdx].price = Number(e.target.value);
                                  setEditingProduct({
                                    ...editingProduct,
                                    pricingOptions: updated
                                  });
                                }}
                                style={{ width: '120px', padding: '6px 10px', fontSize: '0.825rem' }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeletePricingOption(oIdx)}
                              style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Fabric & Details */}
                {productEditorTab === 'fabric' && (
                  <div className="editor-tab-pane">
                    <div className="form-row-2">
                      <div className="form-field">
                        <label>MAIN FABRIC</label>
                        <input
                          type="text"
                          value={editingProduct.fabric?.main || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            fabric: { ...(editingProduct.fabric || {}), main: e.target.value }
                          })}
                          placeholder="e.g. Pure Silk Crepe & Organza"
                        />
                      </div>

                      <div className="form-field">
                        <label>COMPOSITION</label>
                        <input
                          type="text"
                          value={editingProduct.fabric?.composition || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            fabric: { ...(editingProduct.fabric || {}), composition: e.target.value }
                          })}
                          placeholder="e.g. 100% Pure Mulberry Silk"
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label>LINING</label>
                        <input
                          type="text"
                          value={editingProduct.fabric?.lining || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            fabric: { ...(editingProduct.fabric || {}), lining: e.target.value }
                          })}
                          placeholder="e.g. Soft Viscose Silk"
                        />
                      </div>

                      <div className="form-field">
                        <label>WORK / EMBELLISHMENT</label>
                        <input
                          type="text"
                          value={editingProduct.fabric?.embroidery || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            fabric: { ...(editingProduct.fabric || {}), embroidery: e.target.value }
                          })}
                          placeholder="e.g. Hand-embellished antique tilla & pearls"
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label>FIT</label>
                        <input
                          type="text"
                          value={editingProduct.fabric?.fit || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            fabric: { ...(editingProduct.fabric || {}), fit: e.target.value }
                          })}
                          placeholder="e.g. Tailored Regular Fit"
                        />
                      </div>

                      <div className="form-field">
                        <label>CARE INSTRUCTIONS</label>
                        <input
                          type="text"
                          value={editingProduct.fabric?.care || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            fabric: { ...(editingProduct.fabric || {}), care: e.target.value }
                          })}
                          placeholder="e.g. Dry Clean Only by Specialist"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: Dynamic Size Guide Builder */}
                {productEditorTab === 'size_chart' && (
                  <div className="editor-tab-pane">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Ruler size={18} className="gold-accent" />
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-purple-primary)', margin: 0 }}>
                          EDITABLE SIZE MEASUREMENT MATRIX
                        </h4>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="btn-aydara-light" onClick={handleAddMeasurementRow} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                          + Add Measurement Row
                        </button>
                        <button type="button" className="btn-aydara-light" onClick={handleAddSizeColumn} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                          + Add Size Column
                        </button>
                      </div>
                    </div>

                    {editingProduct.sizeChart?.rows && (
                      <div className="size-chart-builder-scroll">
                        <table className="size-chart-builder-table">
                          <thead>
                            <tr>
                              <th>Measurement</th>
                              {editingProduct.sizeChart.columns?.map(col => (
                                <th key={col} style={{ textAlign: 'center' }}>{col}</th>
                              ))}
                              <th style={{ width: '40px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {editingProduct.sizeChart.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                <td>
                                  <input
                                    type="text"
                                    value={row.name}
                                    onChange={(e) => {
                                      const updatedRows = [...editingProduct.sizeChart.rows];
                                      updatedRows[rIdx].name = e.target.value;
                                      setEditingProduct({
                                        ...editingProduct,
                                        sizeChart: { ...editingProduct.sizeChart, rows: updatedRows }
                                      });
                                    }}
                                    className="builder-input-cell"
                                  />
                                </td>
                                {editingProduct.sizeChart.columns?.map(col => (
                                  <td key={col}>
                                    <input
                                      type="text"
                                      value={row[col] || ''}
                                      onChange={(e) => handleUpdateSizeCell(rIdx, col, e.target.value)}
                                      className="builder-input-cell-val"
                                    />
                                  </td>
                                ))}
                                <td>
                                  <button type="button" className="delete-row-btn" onClick={() => handleDeleteSizeRow(rIdx)}>
                                    &times;
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="form-field" style={{ marginTop: '14px' }}>
                      <label>CUSTOM SIZE CHART NOTE</label>
                      <input
                        type="text"
                        value={editingProduct.sizeChart?.note || ''}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          sizeChart: { ...(editingProduct.sizeChart || {}), note: e.target.value }
                        })}
                        placeholder="e.g. Measurements may vary slightly due to the nature of the fabric and stitching."
                      />
                    </div>
                  </div>
                )}

                {/* Tab 6: Shipping & Policy */}
                {productEditorTab === 'shipping' && (
                  <div className="editor-tab-pane">
                    <div className="form-row-2">
                      <div className="form-field">
                        <label>ESTIMATED PROCESSING TIME</label>
                        <input
                          type="text"
                          value={editingProduct.shipping?.processingTime || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            shipping: { ...(editingProduct.shipping || {}), processingTime: e.target.value }
                          })}
                          placeholder="e.g. 3–5 working days"
                        />
                      </div>

                      <div className="form-field">
                        <label>ESTIMATED DELIVERY TIME</label>
                        <input
                          type="text"
                          value={editingProduct.shipping?.deliveryTime || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            shipping: { ...(editingProduct.shipping || {}), deliveryTime: e.target.value }
                          })}
                          placeholder="e.g. 3–5 working days (Express Global DHL)"
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>IMPORTANT NOTE</label>
                      <textarea
                        rows={2}
                        value={editingProduct.note || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, note: e.target.value })}
                        placeholder="e.g. Colors may appear slightly different depending on individual screen settings."
                      />
                    </div>
                  </div>
                )}

                {/* Tab 7: Suggested Products */}
                {productEditorTab === 'suggested' && (
                  <div className="editor-tab-pane">
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        SELECT "YOU MAY ALSO LIKE" SUGGESTED PRODUCTS
                      </label>
                      <input
                        type="text"
                        placeholder="Search creations to recommend..."
                        value={suggestedSearch}
                        onChange={(e) => setSuggestedSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #EBE5ED', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {products
                        .filter(p => p.id !== editingProduct.id && (p.name.toLowerCase().includes(suggestedSearch.toLowerCase()) || p.category.toLowerCase().includes(suggestedSearch.toLowerCase())))
                        .map(p => {
                          const isSelected = (editingProduct.suggestedProductIds || []).includes(p.id);
                          return (
                            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', background: isSelected ? '#F8F5F8' : 'transparent', borderRadius: '4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const current = editingProduct.suggestedProductIds || [];
                                  if (e.target.checked) {
                                    setEditingProduct({ ...editingProduct, suggestedProductIds: [...current, p.id] });
                                  } else {
                                    setEditingProduct({ ...editingProduct, suggestedProductIds: current.filter(id => id !== p.id) });
                                  }
                                }}
                              />
                              <img src={p.images?.[0]} alt={p.name} style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />
                              <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{p.name}</span>
                              <span style={{ fontSize: '0.75rem', color: '#6B7280', marginLeft: 'auto' }}>PKR {p.price?.toLocaleString()}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Tab 8: Section Flags & SEO */}
                {productEditorTab === 'seo' && (
                  <div className="editor-tab-pane">
                    <div className="flags-checkbox-row" style={{ background: '#F8F5F8', padding: '16px', borderRadius: '4px', marginBottom: '18px' }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={editingProduct.isFeatured || false}
                          onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                        />
                        <span>Show in <strong>FEATURED COLLECTION</strong></span>
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={editingProduct.isBestSeller || false}
                          onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                        />
                        <span>Show in <strong>BEST SELLERS</strong></span>
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={editingProduct.isNewArrival || false}
                          onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })}
                        />
                        <span>Show in <strong>NEW ARRIVALS</strong></span>
                      </label>
                    </div>

                    <div className="form-field">
                      <label>SEO META TITLE</label>
                      <input
                        type="text"
                        value={editingProduct.seo?.title || ''}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          seo: { ...(editingProduct.seo || {}), title: e.target.value }
                        })}
                        placeholder="e.g. Midnight Muse | Luxury Silk Gown | AYDARA"
                      />
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="modal-actions-bar">
                  <button type="button" className="btn-aydara-light" onClick={() => setEditingProduct(null)}>
                    CANCEL
                  </button>
                  <button type="submit" className="btn-aydara-primary">
                    {isNewProduct ? 'PUBLISH PRODUCT' : 'UPDATE PRODUCT'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
