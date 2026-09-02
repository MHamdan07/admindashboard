import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useCMS } from '../../context/CMSContext';
import {
  Globe,
  Sliders,
  Image,
  Store,
  Navigation,
  Film,
  DollarSign,
  Tag,
  Scissors,
  CreditCard,
  Truck,
  Package,
  Users,
  Search,
  Bell,
  History,
  AlertTriangle,
  Check,
  RefreshCw,
  Upload,
  Trash2,
  Copy,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Layers,
  FileText,
  Plus,
  ArrowUp,
  ArrowDown,
  Mail,
  Phone,
  MapPin,
  Send,
  Link as LinkIcon
} from 'lucide-react';
import './GlobalMaisonSettings.css';

export default function GlobalMaisonSettings({ token, user, onNotify }) {
  const { triggerGlobalBroadcast } = useCMS();
  const [settings, setSettings] = useState(null);
  const [draftSettings, setDraftSettings] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastPublished, setLastPublished] = useState(null);
  const [lastPublishedBy, setLastPublishedBy] = useState('');
  const [syncTimestamp, setSyncTimestamp] = useState(new Date().toLocaleTimeString());
  const [uploadingField, setUploadingField] = useState(null);

  const fileInputRef = useRef(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState(null);

  // Social Media Management CMS Modal State
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialModalEditIndex, setSocialModalEditIndex] = useState(-1);
  const [socialModalForm, setSocialModalForm] = useState({
    id: '',
    platform: 'instagram',
    displayName: 'Instagram',
    icon: 'instagram',
    url: '',
    isActive: true,
    sortOrder: 1,
    openInNewTab: true,
    ariaLabel: 'Visit AYDARA on Instagram'
  });
  const [socialModalError, setSocialModalError] = useState('');

  // Load settings on mount
  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminSettings(token);
      if (res.success && res.settings) {
        setSettings(res.settings);
        setDraftSettings(res.draftSettings || null);
        setHistory(res.history || []);
        setLastPublished(res.lastPublished || res.settings.updatedAt);
        setLastPublishedBy(res.lastPublishedBy || 'AYDARA Directrice');
        setSyncTimestamp(new Date().toLocaleTimeString());
      }
    } catch (err) {
      if (onNotify) onNotify('Failed to connect to Maison Settings backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadSettingsData();
    }
  }, [token]);

  // Current active working state (prefers draft if draft exists, or working settings)
  const currentWorkingData = draftSettings || settings;

  // Handle generic scalar field update
  const handleFieldChange = (field, value) => {
    setDraftSettings(prev => ({
      ...(prev || settings),
      [field]: value
    }));
  };

  // Handle nested object field update
  const handleNestedFieldChange = (parentKey, childKey, value) => {
    setDraftSettings(prev => {
      const base = prev || settings;
      return {
        ...base,
        [parentKey]: {
          ...(base[parentKey] || {}),
          [childKey]: value
        }
      };
    });
  };

  // Handle direct computer file upload for any logo/image field
  const handleTriggerUpload = (targetFieldPath) => {
    setActiveUploadTarget(targetFieldPath);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTarget) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingField(activeUploadTarget);
    try {
      const res = await api.uploadMedia(formData, token);
      if (res.success && res.media?.url) {
        const uploadedUrl = res.media.url;
        
        if (activeUploadTarget.includes('.')) {
          const [parent, child] = activeUploadTarget.split('.');
          handleNestedFieldChange(parent, child, uploadedUrl);
        } else {
          handleFieldChange(activeUploadTarget, uploadedUrl);
        }

        if (onNotify) onNotify(`Asset uploaded and linked to ${activeUploadTarget}`);
      } else {
        alert(res.message || 'Upload failed');
      }
    } catch (err) {
      alert('Error uploading asset from computer.');
    } finally {
      setUploadingField(null);
      setActiveUploadTarget(null);
    }
  };

  // Save Draft (does not affect public website until published)
  const handleSaveDraft = async () => {
    if (!draftSettings) {
      if (onNotify) onNotify('No pending changes to save as draft.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.saveDraftSettings(draftSettings, token);
      if (res.success) {
        setDraftSettings(res.draftSettings);
        if (onNotify) onNotify('✓ Draft configuration saved successfully.');
      } else {
        alert(res.message || 'Failed to save draft');
      }
    } catch (err) {
      alert('Network error saving draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish to Live Storefront
  const handlePublishSettings = async () => {
    setIsPublishing(true);
    try {
      const payload = draftSettings || settings;
      const res = await api.publishSettings(payload, token);
      if (res.success) {
        setSettings(res.settings);
        setDraftSettings(null);
        setHistory(res.history || []);
        setLastPublished(res.lastPublished);
        setLastPublishedBy(res.lastPublishedBy);
        setSyncTimestamp(new Date().toLocaleTimeString());
        triggerGlobalBroadcast();
        if (onNotify) onNotify('🚀 All Maison settings published live across all devices!');
      } else {
        alert(res.message || 'Failed to publish settings');
      }
    } catch (err) {
      alert('Error publishing settings');
    } finally {
      setIsPublishing(false);
    }
  };

  // Discard Draft
  const handleDiscardDraft = async () => {
    if (!confirm('Are you sure you want to discard all draft changes? The active published configuration will be restored.')) return;
    try {
      const res = await api.discardDraftSettings(token);
      if (res.success) {
        setDraftSettings(null);
        triggerGlobalBroadcast();
        if (onNotify) onNotify('Draft changes discarded.');
      }
    } catch {
      alert('Error discarding draft');
    }
  };

  // Rollback to a specific Version Snapshot
  const handleRestoreVersion = async (versionId) => {
    if (!confirm('Are you sure you want to restore this historical configuration? It will immediately become the active published settings.')) return;
    try {
      const res = await api.restoreSettingsVersion(versionId, token);
      if (res.success) {
        setSettings(res.settings);
        setDraftSettings(null);
        setHistory(res.history || []);
        triggerGlobalBroadcast();
        if (onNotify) onNotify(`✓ ${res.message}`);
      }
    } catch {
      alert('Failed to rollback settings version');
    }
  };

  // Clear Server & CDN Cache
  const handleFlushCache = async () => {
    try {
      const res = await api.flushCache(token);
      if (res.success) {
        setSyncTimestamp(new Date().toLocaleTimeString());
        triggerGlobalBroadcast();
        if (onNotify) onNotify('✓ ' + res.message);
      }
    } catch {
      alert('Failed to clear cache');
    }
  };

  // Factory Reset
  const handleResetDefaults = async () => {
    const conf = prompt('Type "RESET" to confirm resetting all Maison settings to pristine curated luxury defaults:');
    if (conf !== 'RESET') return;

    try {
      const res = await api.resetSettingsToDefault(token);
      if (res.success) {
        setSettings(res.settings);
        setDraftSettings(null);
        setHistory(res.history || []);
        triggerGlobalBroadcast();
        if (onNotify) onNotify('✓ Maison configuration reset to pristine defaults.');
      }
    } catch {
      alert('Failed to reset defaults');
    }
  };

  if (loading || !currentWorkingData) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#7A727E' }}>
        <RefreshCw size={24} className="spinning gold-accent" style={{ margin: '0 auto 12px' }} />
        <p>Loading Global Maison Control Center...</p>
      </div>
    );
  }

  // Count pending draft modifications
  const hasDraft = !!draftSettings;

  // Sub-tab definitions
  const SUB_TABS = [
    { id: 'general', label: 'General & Brand', icon: Globe },
    { id: 'logos', label: 'Brand Logos & Favicon', icon: Image },
    { id: 'storefront', label: 'Storefront & Status', icon: Store },
    { id: 'homepage', label: 'Homepage Layout', icon: Layers },
    { id: 'navigation', label: 'Header Navigation', icon: Navigation },
    { id: 'footer', label: 'Footer & Legal Links', icon: FileText },
    { id: 'media', label: 'Media & Video Defaults', icon: Film },
    { id: 'currency', label: 'Currency & Rounding', icon: DollarSign },
    { id: 'pricing', label: 'Product & Pricing Rules', icon: Tag },
    { id: 'stitching', label: 'Stitched Options Engine', icon: Scissors },
    { id: 'checkout', label: 'Checkout & Payments', icon: CreditCard },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'orders', label: 'Orders & Invoicing', icon: Package },
    { id: 'customers', label: 'Customer Accounts', icon: Users },
    { id: 'seo', label: 'SEO & Social Graph', icon: Search },
    { id: 'notifications', label: 'Email Notifications', icon: Bell },
    { id: 'publishing', label: 'Publishing & History', icon: History },
    { id: 'danger', label: 'Danger Zone & Cache', icon: AlertTriangle }
  ];

  // Filter tabs if user searches
  const filteredTabs = searchQuery.trim()
    ? SUB_TABS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.includes(searchQuery.toLowerCase()))
    : SUB_TABS;

  return (
    <div className="maison-settings-root">
      {/* Hidden File Input for Direct Computer Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*,video/*"
        style={{ display: 'none' }}
      />

      {/* Top Header & Subtitle */}
      <div className="settings-control-header">
        <div className="settings-header-titles">
          <span className="editorial-sub" style={{ fontSize: '0.72rem', letterSpacing: '0.2em' }}>
            MAISON CENTRAL CONTROL
          </span>
          <h1 className="editorial-title settings-main-title">GLOBAL MAISON SETTINGS</h1>
          <p className="settings-subtitle">
            Control the storefront, commerce, media, localization and website experience from one place.
          </p>
        </div>

        {/* Action Controls */}
        <div className="settings-top-actions-bar">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn-settings-action preview">
            <Eye size={15} />
            <span>LIVE STOREFRONT</span>
          </a>

          {hasDraft && (
            <button
              type="button"
              className="btn-settings-action discard"
              onClick={handleDiscardDraft}
              title="Discard unpublished draft changes"
            >
              <RotateCcw size={14} />
              <span>DISCARD DRAFT</span>
            </button>
          )}

          <button
            type="button"
            className="btn-settings-action draft"
            onClick={handleSaveDraft}
            disabled={isSaving || !hasDraft}
          >
            <Save size={14} />
            <span>{isSaving ? 'SAVING DRAFT...' : 'SAVE DRAFT'}</span>
          </button>

          <button
            type="button"
            className="btn-settings-action publish"
            onClick={handlePublishSettings}
            disabled={isPublishing}
          >
            <Sparkles size={14} />
            <span>{isPublishing ? 'PUBLISHING...' : 'PUBLISH CHANGES'}</span>
          </button>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="settings-status-strip">
        <div className="status-mini-card">
          <span className="status-mini-label">STOREFRONT</span>
          <span className="status-mini-val">
            <span className={`status-pill-indicator ${currentWorkingData.storefrontStatus === 'OPEN' ? 'live' : 'maint'}`}></span>
            {currentWorkingData.storefrontStatus || 'OPEN'}
          </span>
        </div>

        <div className="status-mini-card">
          <span className="status-mini-label">CANONICAL CURRENCY</span>
          <span className="status-mini-val">
            {currentWorkingData.currency || 'PKR'} ({currentWorkingData.currencySymbol || 'Rs'})
          </span>
        </div>

        <div className="status-mini-card">
          <span className="status-mini-label">REAL-TIME SYNC</span>
          <span className="status-mini-val">
            <span className="status-pill-indicator live"></span> Connected ({syncTimestamp})
          </span>
        </div>

        <div className="status-mini-card">
          <span className="status-mini-label">DRAFT STATUS</span>
          <span className="status-mini-val" style={{ color: hasDraft ? '#9333EA' : 'inherit' }}>
            {hasDraft ? 'Pending Draft Changes' : 'All Changes Published'}
          </span>
        </div>

        <div className="status-mini-card">
          <span className="status-mini-label">LAST PUBLISHED</span>
          <span className="status-mini-val" style={{ fontSize: '0.85rem' }}>
            {lastPublished ? new Date(lastPublished).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="settings-search-container">
        <Search size={16} className="settings-search-icon" />
        <input
          type="text"
          placeholder="Search settings (e.g. currency, logo, hero, shipping, checkout, maintenance, seo, stitching)..."
          className="settings-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Two-Column Master Control Workspace */}
      <div className="settings-workspace-layout">
        {/* Left Sub-Navigation */}
        <div className="settings-subnav-panel">
          <div className="subnav-category-header">SETTING CATEGORIES</div>
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`subnav-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveSubTab(tab.id)}
              >
                <div className="subnav-item-left">
                  <Icon size={16} className={isActive ? 'gold-accent' : ''} />
                  <span>{tab.label}</span>
                </div>
                <ChevronRight size={14} style={{ opacity: isActive ? 1 : 0.3 }} />
              </button>
            );
          })}
        </div>

        {/* Right Section Content Workspace */}
        <div className="settings-section-view">
          {/* SECTION 1: GENERAL & BRAND */}
          {activeSubTab === 'general' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">GENERAL &amp; BRAND IDENTITY</h3>
                  <p className="section-head-desc">Configure foundational Maison naming, concierge contact channels, and localization defaults.</p>
                </div>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>BRAND NAME</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={currentWorkingData.brandName || ''}
                    onChange={(e) => handleFieldChange('brandName', e.target.value)}
                  />
                </div>
                <div className="settings-field-group">
                  <label>BRAND TAGLINE</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={currentWorkingData.tagline || ''}
                    onChange={(e) => handleFieldChange('tagline', e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-field-group">
                <label>STOREFRONT TITLE</label>
                <input
                  type="text"
                  className="settings-input"
                  value={currentWorkingData.storeName || ''}
                  onChange={(e) => handleFieldChange('storeName', e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>CONCIERGE CONTACT EMAIL</label>
                  <input
                    type="email"
                    className="settings-input"
                    value={currentWorkingData.contactEmail || ''}
                    onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                  />
                </div>
                <div className="settings-field-group">
                  <label>CLIENT CARE PHONE</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={currentWorkingData.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>BUSINESS LOCATION</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={currentWorkingData.businessLocation || ''}
                    onChange={(e) => handleFieldChange('businessLocation', e.target.value)}
                  />
                </div>
                <div className="settings-field-group">
                  <label>TIMEZONE</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={currentWorkingData.timezone || ''}
                    onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-field-group">
                <label>REGISTERED ATELIER ADDRESS</label>
                <textarea
                  rows={2}
                  className="settings-textarea"
                  value={currentWorkingData.address || ''}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SECTION 2: BRAND LOGOS & FAVICON */}
          {activeSubTab === 'logos' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">BRAND LOGOS &amp; FAVICON</h3>
                  <p className="section-head-desc">
                    Upload official SVG, PNG, or WebP brand insignia directly from your computer. Updates deploy instantly across all client devices.
                  </p>
                </div>
              </div>

              <div className="logo-uploaders-grid">
                {/* Main Logo */}
                <div className="logo-uploader-card">
                  <div className="logo-uploader-head">
                    <span className="logo-uploader-title">MAIN GOLD LOGO (DARK THEMES)</span>
                  </div>
                  <div className="logo-preview-box">
                    <img src={currentWorkingData.logoUrl || '/brand/aydara-logo-gold.svg'} alt="Main Logo" className="logo-preview-img" />
                  </div>
                  <input
                    type="text"
                    className="settings-input"
                    style={{ fontSize: '0.75rem' }}
                    value={currentWorkingData.logoUrl || ''}
                    onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                    placeholder="URL or upload from computer..."
                  />
                  <div className="logo-actions-row">
                    <button type="button" className="btn-upload-sub" onClick={() => handleTriggerUpload('logoUrl')}>
                      <Upload size={13} />
                      <span>{uploadingField === 'logoUrl' ? 'UPLOADING...' : 'UPLOAD FILE'}</span>
                    </button>
                  </div>
                </div>

                {/* Light White Logo */}
                <div className="logo-uploader-card">
                  <div className="logo-uploader-head">
                    <span className="logo-uploader-title">WHITE LOGO (TRANSPARENT HERO)</span>
                  </div>
                  <div className="logo-preview-box">
                    <img src={currentWorkingData.logoLightUrl || '/brand/aydara-logo-white.svg'} alt="Light Logo" className="logo-preview-img" />
                  </div>
                  <input
                    type="text"
                    className="settings-input"
                    style={{ fontSize: '0.75rem' }}
                    value={currentWorkingData.logoLightUrl || ''}
                    onChange={(e) => handleFieldChange('logoLightUrl', e.target.value)}
                    placeholder="URL or upload from computer..."
                  />
                  <div className="logo-actions-row">
                    <button type="button" className="btn-upload-sub" onClick={() => handleTriggerUpload('logoLightUrl')}>
                      <Upload size={13} />
                      <span>{uploadingField === 'logoLightUrl' ? 'UPLOADING...' : 'UPLOAD FILE'}</span>
                    </button>
                  </div>
                </div>

                {/* Dark Logo for White Surfaces */}
                <div className="logo-uploader-card">
                  <div className="logo-uploader-head">
                    <span className="logo-uploader-title">DARK / NOIR LOGO (WHITE PAGES)</span>
                  </div>
                  <div className="logo-preview-box light-bg">
                    <img src={currentWorkingData.logoDarkUrl || '/brand/aydara-logo-gold.svg'} alt="Dark Logo" className="logo-preview-img" />
                  </div>
                  <input
                    type="text"
                    className="settings-input"
                    style={{ fontSize: '0.75rem' }}
                    value={currentWorkingData.logoDarkUrl || ''}
                    onChange={(e) => handleFieldChange('logoDarkUrl', e.target.value)}
                    placeholder="URL or upload from computer..."
                  />
                  <div className="logo-actions-row">
                    <button type="button" className="btn-upload-sub" onClick={() => handleTriggerUpload('logoDarkUrl')}>
                      <Upload size={13} />
                      <span>{uploadingField === 'logoDarkUrl' ? 'UPLOADING...' : 'UPLOAD FILE'}</span>
                    </button>
                  </div>
                </div>

                {/* Favicon */}
                <div className="logo-uploader-card">
                  <div className="logo-uploader-head">
                    <span className="logo-uploader-title">BROWSER FAVICON</span>
                  </div>
                  <div className="logo-preview-box light-bg" style={{ height: '70px' }}>
                    <img src={currentWorkingData.faviconUrl || '/favicon.svg'} alt="Favicon" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                  </div>
                  <input
                    type="text"
                    className="settings-input"
                    style={{ fontSize: '0.75rem' }}
                    value={currentWorkingData.faviconUrl || ''}
                    onChange={(e) => handleFieldChange('faviconUrl', e.target.value)}
                    placeholder="Favicon URL or upload..."
                  />
                  <div className="logo-actions-row">
                    <button type="button" className="btn-upload-sub" onClick={() => handleTriggerUpload('faviconUrl')}>
                      <Upload size={13} />
                      <span>{uploadingField === 'faviconUrl' ? 'UPLOADING...' : 'UPLOAD FAVICON'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: STOREFRONT & STATUS */}
          {activeSubTab === 'storefront' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">STOREFRONT STATUS &amp; ANNOUNCEMENTS</h3>
                  <p className="section-head-desc">Control public storefront availability, maintenance mode, and luxury announcement bar.</p>
                </div>
              </div>

              <div className="settings-field-group">
                <label>STOREFRONT OPERATING STATUS</label>
                <select
                  className="settings-select"
                  value={currentWorkingData.storefrontStatus || 'OPEN'}
                  onChange={(e) => handleFieldChange('storefrontStatus', e.target.value)}
                >
                  <option value="OPEN">OPEN &bull; Storefront Live for Public Shopping</option>
                  <option value="MAINTENANCE">MAINTENANCE &bull; Display Elegant Maintenance Screen</option>
                  <option value="CLOSED">CLOSED &bull; Private Atelier Viewings Only</option>
                </select>
              </div>

              {/* Maintenance Configuration */}
              <div style={{ background: '#FAF7FB', padding: '18px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--color-purple-primary)' }}>
                  MAINTENANCE / PRIVATE SALON DISPLAY CONFIGURATION
                </h4>
                <div className="settings-form-grid">
                  <div className="settings-field-group">
                    <label>MAINTENANCE HEADLINE</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={currentWorkingData.maintenanceHeading || ''}
                      onChange={(e) => handleFieldChange('maintenanceHeading', e.target.value)}
                    />
                  </div>

                  <div className="settings-field-group">
                    <label>MAINTENANCE MESSAGE</label>
                    <textarea
                      rows={2}
                      className="settings-textarea"
                      value={currentWorkingData.maintenanceMessage || ''}
                      onChange={(e) => handleFieldChange('maintenanceMessage', e.target.value)}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="settings-field-group">
                      <label>EXPECTED RETURN TEXT</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={currentWorkingData.expectedReturnMessage || ''}
                        onChange={(e) => handleFieldChange('expectedReturnMessage', e.target.value)}
                      />
                    </div>
                    <div className="settings-field-group">
                      <label>MAINTENANCE HERO IMAGE URL</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="settings-input"
                          value={currentWorkingData.maintenanceImage || ''}
                          onChange={(e) => handleFieldChange('maintenanceImage', e.target.value)}
                        />
                        <button type="button" className="btn-upload-sub" onClick={() => handleTriggerUpload('maintenanceImage')}>
                          <Upload size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcement Bar */}
              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">TOP ANNOUNCEMENT BAR</span>
                  <span className="toggle-desc">Displays a subtle luxury banner above the main navbar.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={!!currentWorkingData.announcementBarEnabled}
                    onChange={(e) => handleFieldChange('announcementBarEnabled', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {currentWorkingData.announcementBarEnabled && (
                <div className="settings-field-group">
                  <label>ANNOUNCEMENT BANNER TEXT</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={currentWorkingData.announcementText || ''}
                    onChange={(e) => handleFieldChange('announcementText', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: HOMEPAGE LAYOUT */}
          {activeSubTab === 'homepage' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">HOMEPAGE SECTION MANAGER</h3>
                  <p className="section-head-desc">
                    Control the display and titles of the 5 approved homepage sections. Sections appear strictly in the approved luxury flow.
                  </p>
                </div>
              </div>

              <div className="sections-order-list">
                {(currentWorkingData.homepageSections || [
                  { id: 'hero', name: 'Hero Section', enabled: true, title: 'THE NEW FEMININITY', order: 1 },
                  { id: 'featured', name: 'Featured Collection', enabled: true, title: 'FEATURED COLLECTION', order: 2 },
                  { id: 'best-sellers', name: 'Best Sellers', enabled: true, title: 'BEST SELLERS', order: 3 },
                  { id: 'new-arrivals', name: 'New Arrivals', enabled: true, title: 'NEW ARRIVALS', order: 4 },
                  { id: 'accessories', name: 'Accessories', enabled: true, title: 'ACCESSORIES', order: 5 }
                ]).map((sec, idx) => (
                  <div key={sec.id} className="section-order-row">
                    <div className="section-order-left">
                      <span className="section-order-num">{idx + 1}</span>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#111' }}>{sec.name}</strong>
                        <div style={{ marginTop: '4px' }}>
                          <input
                            type="text"
                            className="settings-input"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', width: '220px' }}
                            value={sec.title || ''}
                            onChange={(e) => {
                              const updated = [...(currentWorkingData.homepageSections || [])];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              handleFieldChange('homepageSections', updated);
                            }}
                            placeholder="Section Heading..."
                          />
                        </div>
                      </div>
                    </div>

                    <label className="switch-control">
                      <input
                        type="checkbox"
                        checked={sec.enabled !== false}
                        onChange={(e) => {
                          const updated = [...(currentWorkingData.homepageSections || [])];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          handleFieldChange('homepageSections', updated);
                        }}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: HEADER NAVIGATION */}
          {activeSubTab === 'navigation' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">HEADER &amp; NAVBAR CONTROLS</h3>
                  <p className="section-head-desc">
                    Manage approved customer navbar categories and header utility toggles.
                  </p>
                </div>
              </div>

              <div className="sections-order-list">
                {(currentWorkingData.navigation || [
                  { id: 'new-in', name: 'NEW IN', path: '/new-in', enabled: true, order: 1 },
                  { id: 'featured-collection', name: 'FEATURED COLLECTION', path: '/featured-collection', enabled: true, order: 2 },
                  { id: 'bridal-cloth', name: 'BRIDAL CLOTH', path: '/bridal-cloth', enabled: true, order: 3 },
                  { id: 'best-sellers', name: 'BEST SELLERS', path: '/best-sellers', enabled: true, order: 4 },
                  { id: 'accessories', name: 'ACCESSORIES', path: '/accessories', enabled: true, order: 5 }
                ]).map((navItem, idx) => (
                  <div key={navItem.id} className="section-order-row">
                    <div className="section-order-left">
                      <span className="section-order-num">{idx + 1}</span>
                      <div>
                        <input
                          type="text"
                          className="settings-input"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', width: '220px', fontWeight: '700' }}
                          value={navItem.name}
                          onChange={(e) => {
                            const updated = [...(currentWorkingData.navigation || [])];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            handleFieldChange('navigation', updated);
                          }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#7A727E', marginLeft: '10px' }}>
                          Destination: {navItem.path}
                        </span>
                      </div>
                    </div>

                    <label className="switch-control">
                      <input
                        type="checkbox"
                        checked={navItem.enabled !== false}
                        onChange={(e) => {
                          const updated = [...(currentWorkingData.navigation || [])];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          handleFieldChange('navigation', updated);
                        }}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Utility Toggles */}
              <div style={{ marginTop: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--color-purple-primary)' }}>
                  HEADER UTILITY BUTTONS
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {[
                    { key: 'showSearch', label: 'Search Icon' },
                    { key: 'showWishlist', label: 'Wishlist Icon' },
                    { key: 'showAccount', label: 'Account Icon' },
                    { key: 'showBag', label: 'Shopping Bag Drawer' },
                    { key: 'showCurrencySelector', label: 'Currency Selector (PKR/USD)' }
                  ].map(u => (
                    <div key={u.key} className="settings-toggle-row" style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{u.label}</span>
                      <label className="switch-control">
                        <input
                          type="checkbox"
                          checked={currentWorkingData.headerControls?.[u.key] !== false}
                          onChange={(e) => handleNestedFieldChange('headerControls', u.key, e.target.checked)}
                        />
                        <span className="switch-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5B: FOOTER, SOCIAL MEDIA & CLIENT SERVICES CMS */}
          {activeSubTab === 'footer' && (() => {
            const footerData = currentWorkingData.footer || {
              showBrandStatement: true,
              manifestoTagline: currentWorkingData.tagline || 'LUXURY WITHOUT EXCESS.',
              manifestoText: 'Sculptural silhouettes, noble silk fabrics, and timeless modern femininity crafted for women who define their own elegance.',
              footerLogoUrl: currentWorkingData.footerLogoUrl || currentWorkingData.logoUrl || '/brand/aydara-logo-gold.svg',
              showNewsletter: true,
              newsletterTitle: 'THE ATELIER DISPATCH',
              newsletterSubtitle: 'Receive private invitations to couture salons and seasonal preview collections.',
              newsletterPlaceholder: 'Enter your email address...',
              newsletterButtonText: 'SUBSCRIBE',
              columns: [
                {
                  id: 'the-house',
                  title: 'THE HOUSE',
                  type: 'info',
                  enabled: true,
                  customAddress: '',
                  customEmail: '',
                  customPhone: '',
                  showSocialIcons: true
                },
                {
                  id: 'collections',
                  title: 'COLLECTIONS',
                  type: 'links',
                  enabled: true,
                  links: [
                    { id: 'c1', label: 'New In', path: '/new-in', enabled: true },
                    { id: 'c2', label: 'Featured Collection', path: '/featured-collection', enabled: true },
                    { id: 'c3', label: 'Bridal Cloth', path: '/bridal-cloth', enabled: true },
                    { id: 'c4', label: 'Best Sellers', path: '/best-sellers', enabled: true },
                    { id: 'c5', label: 'Accessories & Leather Goods', path: '/accessories', enabled: true }
                  ]
                },
                {
                  id: 'client-services',
                  title: 'CLIENT SERVICES',
                  type: 'links',
                  enabled: true,
                  links: [
                    { id: 's1', label: 'Private Client Account', path: '/client-services/private-client-account', enabled: true },
                    { id: 's2', label: 'Order & Dispatch Tracking', path: '/client-services/order-tracking', enabled: true },
                    { id: 's3', label: 'Complimentary Shipping', path: '/client-services/shipping', enabled: true },
                    { id: 's4', label: 'Bespoke Fitting & Sizing', path: '/client-services/bespoke-fitting', enabled: true },
                    { id: 's5', label: 'Atelier Care & Preservation', path: '/client-services/atelier-care', enabled: true }
                  ]
                }
              ],
              copyrightText: '© {year} AYDARA. All Rights Reserved. Pure Luxury Fashion.',
              bottomLinks: [
                { id: 'b1', label: 'Privacy Policy', path: '/about', enabled: true },
                { id: 'b2', label: 'Terms of Service', path: '/about', enabled: true },
                { id: 'b3', label: 'Shipping & Returns', path: '/client-services/shipping', enabled: true }
              ]
            };

            // Clean any editorial from columns
            const cleanColumns = (footerData.columns || []).filter(
              c => c.id !== 'editorial' && c.title?.toUpperCase() !== 'EDITORIAL'
            );

            const socialMediaList = Array.isArray(currentWorkingData.socialMedia)
              ? currentWorkingData.socialMedia
              : [
                  { id: 'instagram', platform: 'instagram', displayName: 'Instagram', icon: 'instagram', url: 'https://instagram.com/aydara.official', isActive: true, sortOrder: 1, openInNewTab: true, ariaLabel: 'Visit AYDARA on Instagram' },
                  { id: 'pinterest', platform: 'pinterest', displayName: 'Pinterest', icon: 'pinterest', url: 'https://pinterest.com/aydara', isActive: true, sortOrder: 2, openInNewTab: true, ariaLabel: 'Visit AYDARA on Pinterest' },
                  { id: 'tiktok', platform: 'tiktok', displayName: 'TikTok', icon: 'tiktok', url: 'https://tiktok.com/@aydara', isActive: true, sortOrder: 3, openInNewTab: true, ariaLabel: 'Visit AYDARA on TikTok' },
                  { id: 'whatsapp', platform: 'whatsapp', displayName: 'WhatsApp Concierge', icon: 'whatsapp', url: 'https://wa.me/923287567873', isActive: true, sortOrder: 4, openInNewTab: true, ariaLabel: 'Contact AYDARA Concierge on WhatsApp' }
                ];

            const clientServicesData = currentWorkingData.clientServices || {};

            const updateFooter = (newFooter) => {
              handleFieldChange('footer', newFooter);
            };

            const updateFooterField = (field, value) => {
              updateFooter({ ...footerData, columns: cleanColumns, [field]: value });
            };

            const handleColChange = (colIdx, field, value) => {
              const updatedCols = [...cleanColumns];
              updatedCols[colIdx] = { ...updatedCols[colIdx], [field]: value };
              updateFooterField('columns', updatedCols);
            };

            const handleAddColumn = () => {
              const newCol = {
                id: 'col-' + Date.now(),
                title: 'NEW COLUMN',
                type: 'links',
                enabled: true,
                links: [
                  { id: 'l1', label: 'New Link', path: '/new-in', enabled: true }
                ]
              };
              updateFooterField('columns', [...cleanColumns, newCol]);
            };

            const handleDeleteColumn = (colIdx) => {
              if (!confirm('Remove this footer column?')) return;
              const updatedCols = cleanColumns.filter((_, idx) => idx !== colIdx);
              updateFooterField('columns', updatedCols);
            };

            const handleAddLink = (colIdx) => {
              const updatedCols = [...cleanColumns];
              const targetCol = updatedCols[colIdx];
              const newLink = {
                id: 'l-' + Date.now(),
                label: 'New Link Item',
                path: '/new-in',
                enabled: true
              };
              updatedCols[colIdx] = {
                ...targetCol,
                links: [...(targetCol.links || []), newLink]
              };
              updateFooterField('columns', updatedCols);
            };

            const handleLinkChange = (colIdx, linkIdx, field, value) => {
              const updatedCols = [...cleanColumns];
              const targetCol = updatedCols[colIdx];
              const updatedLinks = [...(targetCol.links || [])];
              updatedLinks[linkIdx] = { ...updatedLinks[linkIdx], [field]: value };
              updatedCols[colIdx] = { ...targetCol, links: updatedLinks };
              updateFooterField('columns', updatedCols);
            };

            const handleDeleteLink = (colIdx, linkIdx) => {
              const updatedCols = [...cleanColumns];
              const targetCol = updatedCols[colIdx];
              const updatedLinks = targetCol.links.filter((_, idx) => idx !== linkIdx);
              updatedCols[colIdx] = { ...targetCol, links: updatedLinks };
              updateFooterField('columns', updatedCols);
            };

            const handleMoveLink = (colIdx, linkIdx, direction) => {
              const updatedCols = [...cleanColumns];
              const targetCol = updatedCols[colIdx];
              const updatedLinks = [...(targetCol.links || [])];
              const targetIndex = direction === 'up' ? linkIdx - 1 : linkIdx + 1;
              if (targetIndex < 0 || targetIndex >= updatedLinks.length) return;
              const temp = updatedLinks[linkIdx];
              updatedLinks[linkIdx] = updatedLinks[targetIndex];
              updatedLinks[targetIndex] = temp;
              updatedCols[colIdx] = { ...targetCol, links: updatedLinks };
              updateFooterField('columns', updatedCols);
            };

            // Social Media Management Handlers
            const updateSocialList = (newList) => {
              handleFieldChange('socialMedia', newList);
            };

            const handleOpenAddSocial = () => {
              setSocialModalEditIndex(-1);
              setSocialModalError('');
              setSocialModalForm({
                id: 'social-' + Date.now(),
                platform: 'instagram',
                displayName: 'Instagram',
                icon: 'instagram',
                url: '',
                isActive: true,
                sortOrder: socialMediaList.length + 1,
                openInNewTab: true,
                ariaLabel: 'Visit AYDARA on Instagram'
              });
              setSocialModalOpen(true);
            };

            const handleOpenEditSocial = (idx) => {
              const item = socialMediaList[idx];
              setSocialModalEditIndex(idx);
              setSocialModalError('');
              setSocialModalForm({
                id: item.id || 'social-' + Date.now(),
                platform: item.platform || 'instagram',
                displayName: item.displayName || item.platform || 'Instagram',
                icon: item.icon || item.platform || 'instagram',
                url: item.url || '',
                isActive: item.isActive !== false,
                sortOrder: Number(item.sortOrder) || idx + 1,
                openInNewTab: item.openInNewTab !== false,
                ariaLabel: item.ariaLabel || `Visit AYDARA on ${item.displayName || item.platform}`
              });
              setSocialModalOpen(true);
            };

            const handleSaveSocialModal = (e) => {
              e.preventDefault();
              if (!socialModalForm.displayName?.trim()) {
                setSocialModalError('Platform display name is required.');
                return;
              }
              if (!socialModalForm.url?.trim()) {
                setSocialModalError('Social media URL is required.');
                return;
              }

              const updatedList = [...socialMediaList];
              if (socialModalEditIndex >= 0) {
                updatedList[socialModalEditIndex] = {
                  ...socialModalForm,
                  sortOrder: Number(socialModalForm.sortOrder) || 1
                };
              } else {
                updatedList.push({
                  ...socialModalForm,
                  id: socialModalForm.id || 'social-' + Date.now(),
                  sortOrder: Number(socialModalForm.sortOrder) || updatedList.length + 1
                });
              }

              // Re-sort list by sortOrder ASC
              updatedList.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
              updateSocialList(updatedList);
              setSocialModalOpen(false);
            };

            const handleDeleteSocial = (idx) => {
              const item = socialMediaList[idx];
              if (!confirm(`Are you sure you want to remove ${item.displayName || item.platform} from social channels?`)) return;
              const updatedList = socialMediaList.filter((_, i) => i !== idx);
              updateSocialList(updatedList);
            };

            const handleToggleSocialActive = (idx) => {
              const updatedList = [...socialMediaList];
              updatedList[idx] = {
                ...updatedList[idx],
                isActive: !updatedList[idx].isActive
              };
              updateSocialList(updatedList);
            };

            const handleMoveSocial = (idx, direction) => {
              const updatedList = [...socialMediaList];
              const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
              if (targetIdx < 0 || targetIdx >= updatedList.length) return;
              
              const currentOrder = updatedList[idx].sortOrder || idx + 1;
              const targetOrder = updatedList[targetIdx].sortOrder || targetIdx + 1;
              
              updatedList[idx].sortOrder = targetOrder;
              updatedList[targetIdx].sortOrder = currentOrder;

              const temp = updatedList[idx];
              updatedList[idx] = updatedList[targetIdx];
              updatedList[targetIdx] = temp;

              updateSocialList(updatedList);
            };

            // Client Services Editor Handlers
            const handleUpdateClientService = (serviceKey, field, val) => {
              const updated = {
                ...clientServicesData,
                [serviceKey]: {
                  ...(clientServicesData[serviceKey] || {}),
                  [field]: val
                }
              };
              handleFieldChange('clientServices', updated);
            };

            const handleAddBottomLink = () => {
              const newL = {
                id: 'bot-' + Date.now(),
                label: 'New Policy / Page',
                path: '/about',
                enabled: true
              };
              updateFooterField('bottomLinks', [...(footerData.bottomLinks || []), newL]);
            };

            const handleBottomLinkChange = (idx, field, value) => {
              const updated = [...(footerData.bottomLinks || [])];
              updated[idx] = { ...updated[idx], [field]: value };
              updateFooterField('bottomLinks', updated);
            };

            const handleDeleteBottomLink = (idx) => {
              const updated = (footerData.bottomLinks || []).filter((_, i) => i !== idx);
              updateFooterField('bottomLinks', updated);
            };

            return (
              <div className="settings-form-grid">
                <div className="section-head-bar">
                  <div>
                    <h3 className="editorial-title section-head-title">GLOBAL FOOTER &amp; SOCIAL MEDIA CMS</h3>
                    <p className="section-head-desc">
                      Configure the compact 3-column footer structure, brand statement, Client Services content, and live CMS-driven social media channels.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-settings-action save"
                      onClick={handleOpenAddSocial}
                    >
                      <Plus size={14} />
                      <span>+ ADD SOCIAL MEDIA</span>
                    </button>
                    <a href="/" target="_blank" rel="noreferrer" className="btn-settings-action preview">
                      <Eye size={14} />
                      <span>PREVIEW FOOTER</span>
                    </a>
                  </div>
                </div>

                {/* 1. Brand Statement & Manifesto */}
                <div style={{ background: '#FAF7FB', padding: '20px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-purple-primary)', fontWeight: '700' }}>
                      BRAND MANIFESTO &amp; COMPACT BANNER
                    </h4>
                    <label className="switch-control">
                      <input
                        type="checkbox"
                        checked={footerData.showBrandStatement !== false}
                        onChange={(e) => updateFooterField('showBrandStatement', e.target.checked)}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>

                  {footerData.showBrandStatement !== false && (
                    <div className="settings-form-grid">
                      <div className="form-row-2">
                        <div className="settings-field-group">
                          <label>FOOTER BRAND TAGLINE</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={footerData.manifestoTagline || ''}
                            onChange={(e) => updateFooterField('manifestoTagline', e.target.value)}
                            placeholder="e.g. LUXURY WITHOUT EXCESS."
                          />
                        </div>
                        <div className="settings-field-group">
                          <label>FOOTER LOGO URL</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              className="settings-input"
                              value={footerData.footerLogoUrl || ''}
                              onChange={(e) => updateFooterField('footerLogoUrl', e.target.value)}
                              placeholder="/brand/aydara-logo-gold.svg"
                            />
                            <button
                              type="button"
                              className="btn-upload-sub"
                              onClick={() => handleTriggerUpload('footer.footerLogoUrl')}
                            >
                              <Upload size={13} />
                              <span>{uploadingField === 'footer.footerLogoUrl' ? '...' : 'UPLOAD'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="settings-field-group">
                        <label>BRAND MANIFESTO / MISSION STATEMENT</label>
                        <textarea
                          rows={2}
                          className="settings-textarea"
                          value={footerData.manifestoText || ''}
                          onChange={(e) => updateFooterField('manifestoText', e.target.value)}
                          placeholder="Crafted for women who define their own elegance..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. VIP Newsletter & Atelier Dispatch */}
                <div style={{ background: '#FAF7FB', padding: '20px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-purple-primary)', fontWeight: '700' }}>
                        ATELIER NEWSLETTER / VIP SUBSCRIPTION BAR
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#7A727E' }}>
                        Compact email dispatch bar positioned directly above the navigation columns.
                      </p>
                    </div>
                    <label className="switch-control">
                      <input
                        type="checkbox"
                        checked={footerData.showNewsletter !== false}
                        onChange={(e) => updateFooterField('showNewsletter', e.target.checked)}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>

                  {footerData.showNewsletter !== false && (
                    <div className="settings-form-grid">
                      <div className="form-row-2">
                        <div className="settings-field-group">
                          <label>NEWSLETTER HEADLINE</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={footerData.newsletterTitle || ''}
                            onChange={(e) => updateFooterField('newsletterTitle', e.target.value)}
                          />
                        </div>
                        <div className="settings-field-group">
                          <label>BUTTON TEXT</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={footerData.newsletterButtonText || ''}
                            onChange={(e) => updateFooterField('newsletterButtonText', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row-2">
                        <div className="settings-field-group">
                          <label>SUBTITLE / DESCRIPTION</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={footerData.newsletterSubtitle || ''}
                            onChange={(e) => updateFooterField('newsletterSubtitle', e.target.value)}
                          />
                        </div>
                        <div className="settings-field-group">
                          <label>INPUT PLACEHOLDER TEXT</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={footerData.newsletterPlaceholder || ''}
                            onChange={(e) => updateFooterField('newsletterPlaceholder', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. 3-Column Navigation Structure (The House, Collections, Client Services) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-purple-primary)', fontWeight: '700' }}>
                        3-COLUMN LUXURY NAVIGATION STRUCTURE ({cleanColumns.length})
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#7A727E' }}>
                        Manage columns and links. Note: Editorial has been removed from the global footer per requirements.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-aydara-light"
                      onClick={handleAddColumn}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: '700' }}
                    >
                      <Plus size={14} />
                      <span>ADD COLUMN</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {cleanColumns.map((col, colIdx) => (
                      <div
                        key={col.id || colIdx}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #EBE5ED',
                          borderRadius: '6px',
                          padding: '18px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                      >
                        {/* Column Header Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #F0EBF3', paddingBottom: '14px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--color-purple-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                              {colIdx + 1}
                            </span>
                            <div>
                              <input
                                type="text"
                                className="settings-input"
                                style={{ width: '200px', fontWeight: '700', padding: '6px 10px', fontSize: '0.85rem' }}
                                value={col.title || ''}
                                onChange={(e) => handleColChange(colIdx, 'title', e.target.value)}
                                placeholder="COLUMN TITLE..."
                              />
                            </div>
                            <select
                              className="settings-select"
                              style={{ width: '180px', padding: '6px 10px', fontSize: '0.8rem' }}
                              value={col.type || 'links'}
                              onChange={(e) => handleColChange(colIdx, 'type', e.target.value)}
                            >
                              <option value="links">Navigation Links List</option>
                              <option value="info">The House Contact Info</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <label className="switch-control" title="Enable/Disable this column">
                              <input
                                type="checkbox"
                                checked={col.enabled !== false}
                                onChange={(e) => handleColChange(colIdx, 'enabled', e.target.checked)}
                              />
                              <span className="switch-slider"></span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(colIdx)}
                              style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                              title="Delete column"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* If Column Type is Contact Info */}
                        {col.type === 'info' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#FAF7FB', padding: '14px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-purple-primary)' }}>
                              THE HOUSE BOUTIQUE &amp; CONCIERGE INFORMATION
                            </span>
                            <div className="form-row-3">
                              <div className="settings-field-group">
                                <label>OVERRIDE LOCATION (LEAVE EMPTY FOR DEFAULT)</label>
                                <input
                                  type="text"
                                  className="settings-input"
                                  value={col.customAddress || ''}
                                  onChange={(e) => handleColChange(colIdx, 'customAddress', e.target.value)}
                                  placeholder={currentWorkingData.address || 'Faisalabad / London / New York'}
                                />
                              </div>
                              <div className="settings-field-group">
                                <label>OVERRIDE EMAIL</label>
                                <input
                                  type="email"
                                  className="settings-input"
                                  value={col.customEmail || ''}
                                  onChange={(e) => handleColChange(colIdx, 'customEmail', e.target.value)}
                                  placeholder={currentWorkingData.contactEmail || 'concierge@aydara.com'}
                                />
                              </div>
                              <div className="settings-field-group">
                                <label>OVERRIDE PHONE</label>
                                <input
                                  type="text"
                                  className="settings-input"
                                  value={col.customPhone || ''}
                                  onChange={(e) => handleColChange(colIdx, 'customPhone', e.target.value)}
                                  placeholder={currentWorkingData.phone || '+92 3287567873'}
                                />
                              </div>
                            </div>
                            <div className="settings-toggle-row" style={{ padding: '8px 12px', background: '#FFFFFF', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>Show Social Media Strip Under The House</span>
                              <label className="switch-control">
                                <input
                                  type="checkbox"
                                  checked={col.showSocialIcons !== false}
                                  onChange={(e) => handleColChange(colIdx, 'showSocialIcons', e.target.checked)}
                                />
                                <span className="switch-slider"></span>
                              </label>
                            </div>
                          </div>
                        ) : (
                          /* If Column Type is Links List */
                          <div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                              {(col.links || []).map((linkItem, linkIdx) => (
                                <div
                                  key={linkItem.id || linkIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: '#FAF7FB',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #EBE5ED'
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <button
                                      type="button"
                                      disabled={linkIdx === 0}
                                      onClick={() => handleMoveLink(colIdx, linkIdx, 'up')}
                                      style={{ background: 'none', border: 'none', cursor: linkIdx === 0 ? 'default' : 'pointer', color: linkIdx === 0 ? '#CCC' : '#555', padding: 0 }}
                                      title="Move Up"
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={linkIdx === (col.links.length - 1)}
                                      onClick={() => handleMoveLink(colIdx, linkIdx, 'down')}
                                      style={{ background: 'none', border: 'none', cursor: linkIdx === (col.links.length - 1) ? 'default' : 'pointer', color: linkIdx === (col.links.length - 1) ? '#CCC' : '#555', padding: 0 }}
                                      title="Move Down"
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                  </div>

                                  <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      className="settings-input"
                                      style={{ width: '45%', padding: '6px 10px', fontSize: '0.8rem', fontWeight: '600' }}
                                      value={linkItem.label || ''}
                                      onChange={(e) => handleLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                                      placeholder="Link Title (e.g. New In)..."
                                    />
                                    <input
                                      type="text"
                                      className="settings-input"
                                      style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                                      value={linkItem.path || ''}
                                      onChange={(e) => handleLinkChange(colIdx, linkIdx, 'path', e.target.value)}
                                      placeholder="/path or https://..."
                                    />
                                  </div>

                                  <label className="switch-control" title="Enable / Disable this link">
                                    <input
                                      type="checkbox"
                                      checked={linkItem.enabled !== false}
                                      onChange={(e) => handleLinkChange(colIdx, linkIdx, 'enabled', e.target.checked)}
                                    />
                                    <span className="switch-slider"></span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLink(colIdx, linkIdx)}
                                    style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                                    title="Delete link"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              className="btn-aydara-light"
                              onClick={() => handleAddLink(colIdx)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', fontSize: '0.75rem', fontWeight: '600' }}
                            >
                              <Plus size={13} />
                              <span>ADD LINK ITEM</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. SOCIAL MEDIA MANAGEMENT CMS */}
                <div style={{ background: '#FAF7FB', padding: '22px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-purple-primary)', fontWeight: '700' }}>
                        SOCIAL MEDIA LINKS CMS ({socialMediaList.length})
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#7A727E' }}>
                        Full database-backed social media manager. Add, edit, reorder, toggle status, and configure accessible links.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-aydara-gold"
                      onClick={handleOpenAddSocial}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.75rem', fontWeight: '700' }}
                    >
                      <Plus size={14} />
                      <span>+ ADD SOCIAL MEDIA</span>
                    </button>
                  </div>

                  {socialMediaList.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#FFFFFF', borderRadius: '6px', color: '#7A727E', fontSize: '0.85rem' }}>
                      No social media channels added yet. Click "+ ADD SOCIAL MEDIA" above to add Instagram, TikTok, WhatsApp, etc.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {socialMediaList.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#FFFFFF',
                            padding: '12px 16px',
                            borderRadius: '6px',
                            border: '1px solid #EBE5ED',
                            gap: '16px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                            {/* Reorder Arrows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveSocial(idx, 'up')}
                                style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#CCC' : '#555', padding: 0 }}
                                title="Move Up"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === socialMediaList.length - 1}
                                onClick={() => handleMoveSocial(idx, 'down')}
                                style={{ background: 'none', border: 'none', cursor: idx === socialMediaList.length - 1 ? 'default' : 'pointer', color: idx === socialMediaList.length - 1 ? '#CCC' : '#555', padding: 0 }}
                                title="Move Down"
                              >
                                <ArrowDown size={13} />
                              </button>
                            </div>

                            {/* Icon Pill */}
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--color-purple-primary)', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }}>
                              {item.platform?.charAt(0).toUpperCase() || 'S'}
                            </div>

                            {/* Details */}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-purple-primary)' }}>
                                  {item.displayName || item.platform}
                                </span>
                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: item.isActive !== false ? '#E6F4EA' : '#FCE8E6', color: item.isActive !== false ? '#137333' : '#C5221F', fontWeight: '700' }}>
                                  {item.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <a
                                href={item.url?.startsWith('http') ? item.url : `https://${item.url}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '0.78rem', color: '#7A727E', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                              >
                                <span>{item.url}</span>
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          </div>

                          {/* Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: '600' }}>
                              Order: {item.sortOrder || idx + 1}
                            </span>
                            <label className="switch-control" title="Toggle active status">
                              <input
                                type="checkbox"
                                checked={item.isActive !== false}
                                onChange={() => handleToggleSocialActive(idx)}
                              />
                              <span className="switch-slider"></span>
                            </label>
                            <button
                              type="button"
                              className="btn-aydara-light"
                              onClick={() => handleOpenEditSocial(idx)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '600' }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSocial(idx)}
                              style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                              title="Delete social channel"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. CLIENT SERVICES PAGES CMS */}
                <div style={{ background: '#FAF7FB', padding: '22px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: 'var(--color-purple-primary)', fontWeight: '700' }}>
                    CLIENT SERVICES PAGES CONTENT CMS
                  </h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: '#7A727E' }}>
                    Customize subtitles, policy explanations, and concierge texts for all 5 dedicated Client Services public pages.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Private Client Account */}
                    <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-purple-primary)' }}>
                        1. PRIVATE CLIENT ACCOUNT (/client-services/private-client-account)
                      </span>
                      <div className="form-row-2" style={{ marginTop: '10px' }}>
                        <div className="settings-field-group">
                          <label>SUBTITLE</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={clientServicesData.privateClientAccount?.subtitle || ''}
                            onChange={(e) => handleUpdateClientService('privateClientAccount', 'subtitle', e.target.value)}
                            placeholder="A more personal way to experience AYDARA."
                          />
                        </div>
                        <div className="settings-field-group">
                          <label>PRIMARY CTA LABEL</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={clientServicesData.privateClientAccount?.primaryCtaText || 'ENTER MY ACCOUNT'}
                            onChange={(e) => handleUpdateClientService('privateClientAccount', 'primaryCtaText', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Order Tracking */}
                    <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-purple-primary)' }}>
                        2. ORDER &amp; DISPATCH TRACKING (/client-services/order-tracking)
                      </span>
                      <div className="settings-field-group" style={{ marginTop: '10px' }}>
                        <label>SUBTITLE</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={clientServicesData.orderTracking?.subtitle || ''}
                          onChange={(e) => handleUpdateClientService('orderTracking', 'subtitle', e.target.value)}
                          placeholder="Real-time visibility into your haute couture and ready-to-wear journey."
                        />
                      </div>
                    </div>

                    {/* Complimentary Shipping */}
                    <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-purple-primary)' }}>
                        3. COMPLIMENTARY SHIPPING (/client-services/shipping)
                      </span>
                      <div className="form-row-2" style={{ marginTop: '10px' }}>
                        <div className="settings-field-group">
                          <label>DOMESTIC TIMELINE (PAKISTAN)</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={clientServicesData.shipping?.domesticTimeline || ''}
                            onChange={(e) => handleUpdateClientService('shipping', 'domesticTimeline', e.target.value)}
                            placeholder="2 to 4 Business Days"
                          />
                        </div>
                        <div className="settings-field-group">
                          <label>INTERNATIONAL TIMELINE</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={clientServicesData.shipping?.internationalTimeline || ''}
                            onChange={(e) => handleUpdateClientService('shipping', 'internationalTimeline', e.target.value)}
                            placeholder="4 to 7 Business Days"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bespoke Fitting */}
                    <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-purple-primary)' }}>
                        4. BESPOKE FITTING &amp; SIZING (/client-services/bespoke-fitting)
                      </span>
                      <div className="settings-field-group" style={{ marginTop: '10px' }}>
                        <label>SUBTITLE</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={clientServicesData.bespokeFitting?.subtitle || ''}
                          onChange={(e) => handleUpdateClientService('bespokeFitting', 'subtitle', e.target.value)}
                          placeholder="Master craftsmanship tailored to your precise silhouettes."
                        />
                      </div>
                    </div>

                    {/* Atelier Care */}
                    <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-purple-primary)' }}>
                        5. ATELIER CARE &amp; PRESERVATION (/client-services/atelier-care)
                      </span>
                      <div className="settings-field-group" style={{ marginTop: '10px' }}>
                        <label>ATELIER CARE NOTE / QUOTE</label>
                        <textarea
                          rows={2}
                          className="settings-textarea"
                          value={clientServicesData.atelierCare?.atelierNote || ''}
                          onChange={(e) => handleUpdateClientService('atelierCare', 'atelierNote', e.target.value)}
                          placeholder="Because each AYDARA piece represents hours of hand-guided needlework..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Bottom Legal Bar & Copyright */}
                <div style={{ background: '#FAF7FB', padding: '20px', borderRadius: '6px', border: '1px solid #EBE5ED' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: 'var(--color-purple-primary)', fontWeight: '700' }}>
                    BOTTOM LEGAL BAR &amp; COPYRIGHT
                  </h4>
                  <div className="settings-field-group">
                    <label>COPYRIGHT NOTICE (SUPPORT &#123;year&#125; AND &#123;brand&#125; PLACEHOLDERS)</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={footerData.copyrightText || ''}
                      onChange={(e) => updateFooterField('copyrightText', e.target.value)}
                      placeholder="© {year} AYDARA. All Rights Reserved. Pure Luxury Fashion."
                    />
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-purple-primary)' }}>
                        LEGAL &amp; COMPLIANCE LINKS ({footerData.bottomLinks?.length || 0})
                      </span>
                      <button
                        type="button"
                        className="btn-aydara-light"
                        onClick={handleAddBottomLink}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '600' }}
                      >
                        <Plus size={12} />
                        <span>ADD LEGAL LINK</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(footerData.bottomLinks || []).map((botLink, idx) => (
                        <div
                          key={botLink.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: '#FFFFFF',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid #EBE5ED'
                          }}
                        >
                          <input
                            type="text"
                            className="settings-input"
                            style={{ width: '40%', padding: '6px 10px', fontSize: '0.8rem', fontWeight: '600' }}
                            value={botLink.label || ''}
                            onChange={(e) => handleBottomLinkChange(idx, 'label', e.target.value)}
                            placeholder="Link Title (e.g. Privacy Policy)..."
                          />
                          <input
                            type="text"
                            className="settings-input"
                            style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                            value={botLink.path || ''}
                            onChange={(e) => handleBottomLinkChange(idx, 'path', e.target.value)}
                            placeholder="/about or https://..."
                          />
                          <label className="switch-control" title="Enable / Disable this link">
                            <input
                              type="checkbox"
                              checked={botLink.enabled !== false}
                              onChange={(e) => handleBottomLinkChange(idx, 'enabled', e.target.checked)}
                            />
                            <span className="switch-slider"></span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteBottomLink(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                            title="Delete link"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MODAL: ADD / EDIT SOCIAL MEDIA LINK */}
                {socialModalOpen && (
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(26, 15, 33, 0.75)',
                      backdropFilter: 'blur(6px)',
                      zIndex: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px'
                    }}
                    onClick={() => setSocialModalOpen(false)}
                  >
                    <div
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '30px',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                        position: 'relative'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSocialModalOpen(false)}
                        style={{
                          position: 'absolute',
                          top: '18px',
                          right: '18px',
                          background: 'transparent',
                          border: 'none',
                          color: '#999',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={18} />
                      </button>

                      <div style={{ marginBottom: '20px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-gold)', letterSpacing: '0.12em' }}>
                          SOCIAL MEDIA CHANNELS CMS
                        </span>
                        <h3 className="editorial-title" style={{ margin: '4px 0 0', fontSize: '1.3rem', color: 'var(--color-purple-primary)' }}>
                          {socialModalEditIndex >= 0 ? 'EDIT SOCIAL MEDIA LINK' : 'ADD NEW SOCIAL MEDIA LINK'}
                        </h3>
                      </div>

                      {socialModalError && (
                        <div style={{ background: '#FCE8E6', color: '#C5221F', padding: '8px 14px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '16px' }}>
                          {socialModalError}
                        </div>
                      )}

                      <form onSubmit={handleSaveSocialModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="form-row-2">
                          <div className="settings-field-group">
                            <label>PLATFORM PRESET</label>
                            <select
                              className="settings-select"
                              value={socialModalForm.platform}
                              onChange={(e) => {
                                const plat = e.target.value;
                                const displayNames = {
                                  instagram: 'Instagram',
                                  pinterest: 'Pinterest',
                                  tiktok: 'TikTok',
                                  whatsapp: 'WhatsApp Concierge',
                                  facebook: 'Facebook',
                                  youtube: 'YouTube',
                                  x: 'X (Twitter)',
                                  linkedin: 'LinkedIn',
                                  custom: 'Custom Channel'
                                };
                                setSocialModalForm({
                                  ...socialModalForm,
                                  platform: plat,
                                  icon: plat,
                                  displayName: displayNames[plat] || plat,
                                  ariaLabel: `Visit AYDARA on ${displayNames[plat] || plat}`
                                });
                              }}
                            >
                              <option value="instagram">Instagram</option>
                              <option value="pinterest">Pinterest</option>
                              <option value="tiktok">TikTok</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="facebook">Facebook</option>
                              <option value="youtube">YouTube</option>
                              <option value="x">X (Twitter)</option>
                              <option value="linkedin">LinkedIn</option>
                              <option value="custom">Other / Custom</option>
                            </select>
                          </div>

                          <div className="settings-field-group">
                            <label>DISPLAY NAME</label>
                            <input
                              type="text"
                              required
                              className="settings-input"
                              value={socialModalForm.displayName}
                              onChange={(e) => setSocialModalForm({ ...socialModalForm, displayName: e.target.value })}
                              placeholder="e.g. Instagram"
                            />
                          </div>
                        </div>

                        <div className="settings-field-group">
                          <label>SOCIAL MEDIA URL / LINK</label>
                          <input
                            type="text"
                            required
                            className="settings-input"
                            value={socialModalForm.url}
                            onChange={(e) => setSocialModalForm({ ...socialModalForm, url: e.target.value })}
                            placeholder="https://instagram.com/aydara.official or +923287567873"
                          />
                        </div>

                        <div className="form-row-2">
                          <div className="settings-field-group">
                            <label>DISPLAY ORDER</label>
                            <input
                              type="number"
                              min="1"
                              className="settings-input"
                              value={socialModalForm.sortOrder}
                              onChange={(e) => setSocialModalForm({ ...socialModalForm, sortOrder: parseInt(e.target.value, 10) || 1 })}
                            />
                          </div>

                          <div className="settings-field-group">
                            <label>ICON IDENTIFIER</label>
                            <select
                              className="settings-select"
                              value={socialModalForm.icon}
                              onChange={(e) => setSocialModalForm({ ...socialModalForm, icon: e.target.value })}
                            >
                              <option value="instagram">Instagram Icon</option>
                              <option value="pinterest">Pinterest Icon</option>
                              <option value="tiktok">TikTok Icon</option>
                              <option value="whatsapp">WhatsApp Icon</option>
                              <option value="facebook">Facebook Icon</option>
                              <option value="youtube">YouTube Icon</option>
                              <option value="x">X / Twitter Icon</option>
                              <option value="linkedin">LinkedIn Icon</option>
                              <option value="custom">Generic Globe Icon</option>
                            </select>
                          </div>
                        </div>

                        <div className="settings-field-group">
                          <label>ACCESSIBLE ARIA LABEL</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={socialModalForm.ariaLabel}
                            onChange={(e) => setSocialModalForm({ ...socialModalForm, ariaLabel: e.target.value })}
                            placeholder="e.g. Visit AYDARA on Instagram"
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '20px', padding: '10px 0', borderTop: '1px solid #F0EBF3', borderBottom: '1px solid #F0EBF3' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={socialModalForm.isActive}
                              onChange={(e) => setSocialModalForm({ ...socialModalForm, isActive: e.target.checked })}
                            />
                            <span>Active / Visible in Footer</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={socialModalForm.openInNewTab}
                              onChange={(e) => setSocialModalForm({ ...socialModalForm, openInNewTab: e.target.checked })}
                            />
                            <span>Open in New Tab</span>
                          </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                          <button
                            type="button"
                            className="btn-aydara-light"
                            onClick={() => setSocialModalOpen(false)}
                          >
                            CANCEL
                          </button>
                          <button
                            type="submit"
                            className="btn-aydara-gold"
                            style={{ padding: '8px 20px' }}
                          >
                            SAVE SOCIAL MEDIA
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* SECTION 6: MEDIA & VIDEO DEFAULTS */}
          {activeSubTab === 'media' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">MEDIA &amp; VIDEO PLAYBACK DEFAULTS</h3>
                  <p className="section-head-desc">
                    Default playback behavior for Hero cinematic videos, lookbook clips, and high-resolution imagery.
                  </p>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">VIDEO AUTOPLAY</span>
                  <span className="toggle-desc">Automatically play video loops when client enters the storefront.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={currentWorkingData.mediaDefaults?.videoAutoplay !== false}
                    onChange={(e) => handleNestedFieldChange('mediaDefaults', 'videoAutoplay', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">ALWAYS MUTED BY DEFAULT (LUXURY STANDARD)</span>
                  <span className="toggle-desc">Ensures background video audio is muted by default to comply with browser autoplay policies.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={currentWorkingData.mediaDefaults?.videoMuted !== false}
                    onChange={(e) => handleNestedFieldChange('mediaDefaults', 'videoMuted', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">INFINITE VIDEO LOOP</span>
                  <span className="toggle-desc">Seamlessly repeat hero video clips without stopping.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={currentWorkingData.mediaDefaults?.videoLoop !== false}
                    onChange={(e) => handleNestedFieldChange('mediaDefaults', 'videoLoop', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>MAXIMUM MEDIA UPLOAD SIZE (MB)</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={currentWorkingData.mediaDefaults?.maxUploadSizeMb || 100}
                    onChange={(e) => handleNestedFieldChange('mediaDefaults', 'maxUploadSizeMb', Number(e.target.value))}
                  />
                </div>
                <div className="settings-field-group">
                  <label>WEBP CONVERSION OPTIMIZATION</label>
                  <select
                    className="settings-select"
                    value={currentWorkingData.mediaDefaults?.enableWebpOptimization ? 'true' : 'false'}
                    onChange={(e) => handleNestedFieldChange('mediaDefaults', 'enableWebpOptimization', e.target.value === 'true')}
                  >
                    <option value="true">Enabled (Faster loading &amp; bandwidth savings)</option>
                    <option value="false">Disabled (Original uncompressed formats)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: CURRENCY & ROUNDING */}
          {activeSubTab === 'currency' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">MAISON CURRENCY &amp; PRICE ROUNDING</h3>
                  <p className="section-head-desc">
                    AYDARA operates strictly in Pakistani Rupee (PKR - ₨) across all desktop, tablet, and mobile devices.
                  </p>
                </div>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>CANONICAL STORE CURRENCY (FIXED)</label>
                  <input
                    type="text"
                    className="settings-input"
                    value="🇵🇰 PKR (Pakistani Rupee &bull; ₨)"
                    disabled
                    style={{ background: '#FAF7FB', fontWeight: '700', color: 'var(--color-purple-primary)' }}
                  />
                </div>
                <div className="settings-field-group">
                  <label>PRICE DISPLAY FORMATTING</label>
                  <select
                    className="settings-select"
                    value={currentWorkingData.priceRounding || 'nearest-100'}
                    onChange={(e) => handleFieldChange('priceRounding', e.target.value)}
                  >
                    <option value="nearest-100">Standard Integer (e.g. PKR 185,000)</option>
                    <option value="nearest-50">Nearest 50 (e.g. PKR 18,750)</option>
                    <option value="nearest-10">Nearest 10 (e.g. PKR 18,710)</option>
                    <option value="nearest-1">Exact Integer (e.g. PKR 18,705)</option>
                  </select>
                </div>
              </div>

              <div style={{ background: '#FAF7FB', border: '1px solid #EBE5ED', borderRadius: '6px', padding: '16px' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-purple-primary)' }}>✓ SINGLE CURRENCY STANDARD ACTIVE</strong>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                  All product catalogs, category listings, custom stitching options, cart totals, invoices, and patron accounts operate exclusively in Pakistani Rupee (PKR).
                </p>
              </div>
            </div>
          )}

          {/* SECTION 8: PRODUCT & PRICING RULES */}
          {activeSubTab === 'pricing' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">PRODUCT &amp; PRICING RULES</h3>
                  <p className="section-head-desc">
                    Global defaults for taxation, compare-at markdown visibility, low stock warnings, and backorder policies.
                  </p>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">ALL TAXES INCLUDED IN DISPLAYED PRICES</span>
                  <span className="toggle-desc">When enabled, prices shown on storefront include all applicable duties &amp; GST.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={currentWorkingData.pricingRules?.taxIncluded !== false}
                    onChange={(e) => handleNestedFieldChange('pricingRules', 'taxIncluded', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">DISPLAY COMPARE-AT (ORIGINAL) PRICES</span>
                  <span className="toggle-desc">Shows strikethrough original prices on sale/promotional creations.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={currentWorkingData.pricingRules?.showCompareAtPrices !== false}
                    onChange={(e) => handleNestedFieldChange('pricingRules', 'showCompareAtPrices', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>LOW-STOCK THRESHOLD WARNING</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={currentWorkingData.pricingRules?.lowStockThreshold || 5}
                    onChange={(e) => handleNestedFieldChange('pricingRules', 'lowStockThreshold', Number(e.target.value))}
                  />
                  <span className="field-hint">Triggers low-stock badges in inventory manager.</span>
                </div>
                <div className="settings-field-group">
                  <label>ALLOW BACKORDERS ON BESPOKE SILKS</label>
                  <select
                    className="settings-select"
                    value={currentWorkingData.pricingRules?.allowBackorders ? 'true' : 'false'}
                    onChange={(e) => handleNestedFieldChange('pricingRules', 'allowBackorders', e.target.value === 'true')}
                  >
                    <option value="false">Disallow (Pieces mark as Out of Stock)</option>
                    <option value="true">Allow (Pre-order / Made-to-order)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: STITCHED / UNSTITCHED OPTIONS ENGINE */}
          {activeSubTab === 'stitching' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">STITCHED / UNSTITCHED OPTIONS ENGINE</h3>
                  <p className="section-head-desc">
                    Configure default stitching options and price deltas. The customer product page recalculates pricing dynamically based on selection.
                  </p>
                </div>
              </div>

              <div className="sections-order-list">
                {(currentWorkingData.stitchingEngine?.options || [
                  { id: 'stitched-3pc', name: '3pc Stitched (Frock + Lehenga + Dupatta)', priceDelta: 0, isDefault: true },
                  { id: 'stitched-2pc', name: '2pc Stitched (Frock + Lehenga)', priceDelta: -5000, isDefault: false },
                  { id: 'unstitched-3pc', name: '3pc Unstitched (Fabric Only)', priceDelta: -7000, isDefault: false }
                ]).map((opt, idx) => (
                  <div key={opt.id} className="section-order-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--color-purple-primary)' }}>
                        OPTION #{idx + 1} {opt.isDefault && '(DEFAULT SELECTION)'}
                      </strong>
                    </div>

                    <div className="form-row-2">
                      <div className="settings-field-group">
                        <label>OPTION DISPLAY NAME</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={opt.name}
                          onChange={(e) => {
                            const updated = [...(currentWorkingData.stitchingEngine?.options || [])];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            handleNestedFieldChange('stitchingEngine', 'options', updated);
                          }}
                        />
                      </div>
                      <div className="settings-field-group">
                        <label>PRICE DELTA VS BASE (PKR)</label>
                        <input
                          type="number"
                          className="settings-input"
                          value={opt.priceDelta}
                          onChange={(e) => {
                            const updated = [...(currentWorkingData.stitchingEngine?.options || [])];
                            updated[idx] = { ...updated[idx], priceDelta: Number(e.target.value) };
                            handleNestedFieldChange('stitchingEngine', 'options', updated);
                          }}
                          placeholder="e.g. -5000 for unstitched discount"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 10: CHECKOUT & PAYMENTS */}
          {activeSubTab === 'checkout' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">CHECKOUT &amp; PAYMENT GATEWAYS</h3>
                  <p className="section-head-desc">
                    Control guest shopping rules, account enforcement at final checkout, and active payment channels.
                  </p>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">GUEST BROWSING &amp; CART ALLOWED</span>
                  <span className="toggle-desc">Visitors can freely view creations and add to bag without signing in.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={currentWorkingData.checkoutRules?.allowGuestBrowsing !== false}
                    onChange={(e) => handleNestedFieldChange('checkoutRules', 'allowGuestBrowsing', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">REQUIRE CUSTOMER LOGIN BEFORE FINAL ORDER PLACEMENT</span>
                  <span className="toggle-desc">Enforces sign-in / registration when clicking Place Order at checkout.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={currentWorkingData.checkoutRules?.requireAccountForOrder !== false}
                    onChange={(e) => handleNestedFieldChange('checkoutRules', 'requireAccountForOrder', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>MINIMUM ORDER VALUE (PKR)</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={currentWorkingData.checkoutRules?.minimumOrderAmount || 5000}
                    onChange={(e) => handleNestedFieldChange('checkoutRules', 'minimumOrderAmount', Number(e.target.value))}
                  />
                </div>
                <div className="settings-field-group">
                  <label>MAXIMUM SINGLE ORDER VALUE (PKR)</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={currentWorkingData.checkoutRules?.maximumOrderAmount || 5000000}
                    onChange={(e) => handleNestedFieldChange('checkoutRules', 'maximumOrderAmount', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div style={{ marginTop: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--color-purple-primary)' }}>
                  ACTIVE PAYMENT METHODS
                </h4>
                {(currentWorkingData.checkoutRules?.enabledPaymentMethods || [
                  { id: 'online_card', name: 'Online Card Payment (Visa / Mastercard)', enabled: true },
                  { id: 'bank_wire', name: 'Direct Atelier Bank Transfer / Wire', enabled: true },
                  { id: 'cod', name: 'Cash on Delivery (Pakistan Only)', enabled: true }
                ]).map((pm, idx) => (
                  <div key={pm.id} className="settings-toggle-row" style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{pm.name}</span>
                    <label className="switch-control">
                      <input
                        type="checkbox"
                        checked={pm.enabled !== false}
                        onChange={(e) => {
                          const updated = [...(currentWorkingData.checkoutRules?.enabledPaymentMethods || [])];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          handleNestedFieldChange('checkoutRules', 'enabledPaymentMethods', updated);
                        }}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 11: SHIPPING & DELIVERY */}
          {activeSubTab === 'shipping' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">SHIPPING &amp; GLOBAL FULFILLMENT</h3>
                  <p className="section-head-desc">
                    Configure complimentary shipping thresholds, international courier defaults, and dispatch estimates.
                  </p>
                </div>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>COMPLIMENTARY / FREE SHIPPING THRESHOLD (PKR)</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={currentWorkingData.shipping?.freeShippingThreshold || 50000}
                    onChange={(e) => handleNestedFieldChange('shipping', 'freeShippingThreshold', Number(e.target.value))}
                  />
                  <span className="field-hint">Orders meeting or exceeding this base amount receive free express delivery.</span>
                </div>
                <div className="settings-field-group">
                  <label>STANDARD EXPRESS SHIPPING FEE (PKR)</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={currentWorkingData.shipping?.standardFee || 3500}
                    onChange={(e) => handleNestedFieldChange('shipping', 'standardFee', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>DEFAULT COURIER PARTNER</label>
                  <select
                    className="settings-select"
                    value={currentWorkingData.shipping?.defaultCourier || 'DHL Express Global'}
                    onChange={(e) => handleNestedFieldChange('shipping', 'defaultCourier', e.target.value)}
                  >
                    <option value="DHL Express Global">DHL Express Global</option>
                    <option value="FedEx Luxury Logistics">FedEx Luxury Logistics</option>
                    <option value="TCS Priority Express">TCS Priority Express</option>
                    <option value="Emirates Post Concierge">Emirates Post Concierge</option>
                  </select>
                </div>
                <div className="settings-field-group">
                  <label>ESTIMATED DELIVERY TIMEFRAME TEXT</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={currentWorkingData.shipping?.estimatedDeliveryText || '2–5 Business Days Worldwide'}
                    onChange={(e) => handleNestedFieldChange('shipping', 'estimatedDeliveryText', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 12: ORDERS & INVOICING */}
          {activeSubTab === 'orders' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">ORDERS &amp; INVOICE DISCLAIMERS</h3>
                  <p className="section-head-desc">
                    Configure order number formatting, auto-confirmation settings, and official printable invoice disclaimers.
                  </p>
                </div>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>ORDER NUMBER PREFIX</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={currentWorkingData.ordersConfig?.orderPrefix || 'AYD-'}
                    onChange={(e) => handleNestedFieldChange('ordersConfig', 'orderPrefix', e.target.value)}
                    placeholder="AYD-"
                  />
                </div>
                <div className="settings-field-group">
                  <label>STARTING NUMBER SEQUENCE</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={currentWorkingData.ordersConfig?.startingOrderNumber || 1001}
                    onChange={(e) => handleNestedFieldChange('ordersConfig', 'startingOrderNumber', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">AUTO-CONFIRM PAID ORDERS</span>
                  <span className="toggle-desc">Automatically move orders to 'Confirmed' status upon online card payment authorization.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={currentWorkingData.ordersConfig?.autoConfirmPaidOrders !== false}
                    onChange={(e) => handleNestedFieldChange('ordersConfig', 'autoConfirmPaidOrders', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="settings-field-group">
                <label>PRINTABLE INVOICE LEGAL DISCLAIMER</label>
                <textarea
                  rows={3}
                  className="settings-textarea"
                  value={currentWorkingData.ordersConfig?.invoiceDisclaimer || ''}
                  onChange={(e) => handleNestedFieldChange('ordersConfig', 'invoiceDisclaimer', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SECTION 13: CUSTOMER ACCOUNTS */}
          {activeSubTab === 'customers' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">CUSTOMER ACCOUNTS &amp; SECURITY POLICY</h3>
                  <p className="section-head-desc">
                    Manage client account creation rules, minimum password strength, and session expiration duration.
                  </p>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">ALLOW NEW CLIENT REGISTRATIONS</span>
                  <span className="toggle-desc">Permit visitors to create accounts via /register.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={currentWorkingData.customerAccounts?.allowRegistration !== false}
                    onChange={(e) => handleNestedFieldChange('customerAccounts', 'allowRegistration', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>MINIMUM PASSWORD LENGTH</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={currentWorkingData.customerAccounts?.minPasswordLength || 6}
                    onChange={(e) => handleNestedFieldChange('customerAccounts', 'minPasswordLength', Number(e.target.value))}
                  />
                </div>
                <div className="settings-field-group">
                  <label>SESSION EXPIRATION DURATION (DAYS)</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={currentWorkingData.customerAccounts?.sessionDurationDays || 30}
                    onChange={(e) => handleNestedFieldChange('customerAccounts', 'sessionDurationDays', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 14: SEO & SOCIAL GRAPH */}
          {activeSubTab === 'seo' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">GLOBAL SEO &amp; SOCIAL GRAPH</h3>
                  <p className="section-head-desc">
                    Optimize search engine rankings, Google indexing metadata, and OpenGraph social share previews.
                  </p>
                </div>
              </div>

              <div className="settings-field-group">
                <label>GLOBAL SITE TITLE</label>
                <input
                  type="text"
                  className="settings-input"
                  value={currentWorkingData.seo?.siteTitle || ''}
                  onChange={(e) => handleNestedFieldChange('seo', 'siteTitle', e.target.value)}
                />
              </div>

              <div className="settings-field-group">
                <label>META DESCRIPTION (FOR GOOGLE SEARCH SNIPPETS)</label>
                <textarea
                  rows={2}
                  className="settings-textarea"
                  value={currentWorkingData.seo?.metaDescription || ''}
                  onChange={(e) => handleNestedFieldChange('seo', 'metaDescription', e.target.value)}
                />
              </div>

              <div className="settings-field-group">
                <label>KEYWORDS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  className="settings-input"
                  value={currentWorkingData.seo?.keywords || ''}
                  onChange={(e) => handleNestedFieldChange('seo', 'keywords', e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="settings-field-group">
                  <label>CANONICAL STOREFRONT URL</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={currentWorkingData.seo?.canonicalUrl || 'https://aydara.com'}
                    onChange={(e) => handleNestedFieldChange('seo', 'canonicalUrl', e.target.value)}
                  />
                </div>
                <div className="settings-field-group">
                  <label>OPEN GRAPH SOCIAL SHARING IMAGE</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="settings-input"
                      value={currentWorkingData.seo?.ogImage || ''}
                      onChange={(e) => handleNestedFieldChange('seo', 'ogImage', e.target.value)}
                    />
                    <button type="button" className="btn-upload-sub" onClick={() => handleTriggerUpload('seo.ogImage')}>
                      <Upload size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 15: NOTIFICATIONS */}
          {activeSubTab === 'notifications' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">EMAIL NOTIFICATION TRIGGERS</h3>
                  <p className="section-head-desc">
                    Control automatic transactional emails dispatched to clients and administrative staff.
                  </p>
                </div>
              </div>

              <div className="settings-field-group">
                <label>ADMIN ORDER ALERT RECIPIENT EMAIL</label>
                <input
                  type="email"
                  className="settings-input"
                  value={currentWorkingData.notifications?.adminAlertsEmail || 'admin@aydara.com'}
                  onChange={(e) => handleNestedFieldChange('notifications', 'adminAlertsEmail', e.target.value)}
                />
              </div>

              {[
                { key: 'orderConfirmationEmail', label: 'Order Confirmed Email', desc: 'Dispatched to customer immediately upon placing an order.' },
                { key: 'orderShippedEmail', label: 'Dispatch & Courier Tracking Email', desc: 'Dispatched when tracking number is assigned.' },
                { key: 'orderDeliveredEmail', label: 'Delivery Receipt Email', desc: 'Dispatched when courier delivers parcel.' },
                { key: 'accountWelcomeEmail', label: 'Client Registration Welcome Email', desc: 'Dispatched when a customer creates an account.' },
                { key: 'sendAdminNewOrderAlert', label: 'Admin Staff New Order Alert', desc: 'Dispatched to Maison Directrice when a new acquisition arrives.' }
              ].map(n => (
                <div key={n.key} className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">{n.label}</span>
                    <span className="toggle-desc">{n.desc}</span>
                  </div>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={currentWorkingData.notifications?.[n.key] !== false}
                      onChange={(e) => handleNestedFieldChange('notifications', n.key, e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 16: PUBLISHING & VERSION HISTORY */}
          {activeSubTab === 'publishing' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title">PUBLISHING CENTER &amp; VERSION HISTORY</h3>
                  <p className="section-head-desc">
                    Review published change history, inspect previous snapshots, and rollback to any earlier version with one click.
                  </p>
                </div>
              </div>

              <div style={{ background: '#FAF7FB', padding: '16px', borderRadius: '6px', border: '1px solid #EBE5ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--color-purple-primary)' }}>PUBLISHING STATUS:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#5E5861' }}>
                    {hasDraft ? '⚠️ You have unsaved / unpublished draft changes.' : '✓ Storefront is synchronized with the latest published version.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-settings-action draft" onClick={handleSaveDraft} disabled={!hasDraft}>
                    SAVE DRAFT
                  </button>
                  <button type="button" className="btn-settings-action publish" onClick={handlePublishSettings}>
                    PUBLISH NOW
                  </button>
                </div>
              </div>

              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>VERSION ID</th>
                      <th>PUBLISHED DATE &amp; TIME</th>
                      <th>PUBLISHED BY</th>
                      <th>NOTE / SUMMARY</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#7A727E' }}>
                          No previous version snapshots stored yet. Version history is recorded each time you publish.
                        </td>
                      </tr>
                    ) : (
                      history.map((ver) => (
                        <tr key={ver.versionId}>
                          <td><strong>{ver.versionId}</strong></td>
                          <td>{new Date(ver.publishedAt).toLocaleString()}</td>
                          <td>{ver.publishedBy || 'Admin'}</td>
                          <td>{ver.note || 'Published via Control Center'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-aydara-light"
                              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                              onClick={() => handleRestoreVersion(ver.versionId)}
                            >
                              ROLLBACK
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 17: DANGER ZONE & CACHE */}
          {activeSubTab === 'danger' && (
            <div className="settings-form-grid">
              <div className="section-head-bar">
                <div>
                  <h3 className="editorial-title section-head-title" style={{ color: '#DC2626' }}>
                    DANGER ZONE &amp; SYSTEM CACHE
                  </h3>
                  <p className="section-head-desc">
                    System maintenance actions. Proceed with caution when clearing caches or resetting configurations.
                  </p>
                </div>
              </div>

              <div className="danger-zone-box">
                <div className="danger-action-row">
                  <div>
                    <strong style={{ color: '#111', fontSize: '0.9rem' }}>CLEAR GLOBAL API CACHE &amp; CDN BUFFERS</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#5E5861' }}>
                      Purges cached responses and forces all client browsers to retrieve the freshest store configuration.
                    </p>
                  </div>
                  <button type="button" className="btn-aydara-primary" onClick={handleFlushCache} style={{ whiteSpace: 'nowrap' }}>
                    CLEAR CACHE
                  </button>
                </div>

                <div className="danger-action-row">
                  <div>
                    <strong style={{ color: '#DC2626', fontSize: '0.9rem' }}>RESET MAISON SETTINGS TO PRISTINE DEFAULTS</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#5E5861' }}>
                      Restores all brand settings, navigation, shipping, and currencies to the initial curated AYDARA standard. A backup snapshot is automatically created.
                    </p>
                  </div>
                  <button type="button" className="btn-danger-action" onClick={handleResetDefaults} style={{ whiteSpace: 'nowrap' }}>
                    RESET TO DEFAULTS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Section Save Bar */}
          <div className="section-save-footer">
            <span style={{ fontSize: '0.78rem', color: '#7A727E' }}>
              {hasDraft ? '● Unsaved changes in draft' : '✓ All changes synchronized with backend'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-settings-action draft"
                onClick={handleSaveDraft}
                disabled={isSaving || !hasDraft}
              >
                <Save size={13} />
                <span>SAVE DRAFT</span>
              </button>
              <button
                type="button"
                className="btn-settings-action publish"
                onClick={handlePublishSettings}
                disabled={isPublishing}
              >
                <Sparkles size={13} />
                <span>PUBLISH ALL CHANGES</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
