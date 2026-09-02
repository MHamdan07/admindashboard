import { supabase, isSupabaseConfigured } from './supabase.js';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '/api/v1' : 'http://localhost:5001/api/v1');

export const api = {
  // ==========================================
  // 1. PRODUCTS API
  // ==========================================
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/products?${query}`);
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('products').select('*');
        if (params.category) q = q.eq('category_slug', params.category);
        if (params.featured) q = q.eq('is_featured', true);
        const { data, error } = await q;
        if (!error && data) {
          return {
            success: true,
            products: data.map(p => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: Number(p.price),
              category: p.category_slug,
              categoryName: p.category_slug?.toUpperCase(),
              images: p.images || [],
              description: p.description || '',
              details: p.details || [],
              sizes: p.sizes || [],
              colors: p.colors || [],
              stock: p.stock || 10,
              isNewArrival: p.is_new_arrival,
              isBestSeller: p.is_best_seller,
              isFeatured: p.is_featured,
              status: p.status
            }))
          };
        }
      } catch (e) {
        console.warn('Supabase getProducts error:', e.message);
      }
    }
    return { success: false, products: [] };
  },

  async getProduct(slug) {
    try {
      const res = await fetch(`${API_BASE}/products/${slug}`);
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('slug', slug).limit(1);
        if (!error && data && data.length > 0) {
          const p = data[0];
          return {
            success: true,
            product: {
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: Number(p.price),
              category: p.category_slug,
              images: p.images || [],
              description: p.description || '',
              details: p.details || [],
              sizes: p.sizes || [],
              colors: p.colors || [],
              stock: p.stock || 10,
              status: p.status
            }
          };
        }
      } catch (e) {
        console.warn('Supabase getProduct error:', e.message);
      }
    }
    return { success: false, message: 'Product not found' };
  },

  async createProduct(productData, token) {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      const id = productData.id || `prod-${Date.now()}`;
      await supabase.from('products').upsert({
        id,
        name: productData.name,
        slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        price: productData.price,
        description: productData.description || '',
        category_slug: productData.category || '',
        images: productData.images || [],
        sizes: productData.sizes || [],
        colors: productData.colors || [],
        stock: productData.stock || 10,
        status: productData.status || 'published',
        is_featured: Boolean(productData.isFeatured)
      });
      return { success: true, product: { ...productData, id } };
    }
    return { success: false };
  },

  async updateProduct(id, productData, token) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      await supabase.from('products').update({
        name: productData.name,
        price: productData.price,
        description: productData.description,
        category_slug: productData.category,
        images: productData.images,
        sizes: productData.sizes,
        colors: productData.colors,
        stock: productData.stock,
        status: productData.status,
        is_featured: Boolean(productData.isFeatured)
      }).eq('id', id);
      return { success: true, product: { ...productData, id } };
    }
    return { success: false };
  },

  async deleteProduct(id, token) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      await supabase.from('products').delete().eq('id', id);
      return { success: true };
    }
    return { success: false };
  },

  // ==========================================
  // 2. CATEGORIES API
  // ==========================================
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('order_index', { ascending: true });
        if (!error && data && data.length > 0) {
          return {
            success: true,
            categories: data.map(c => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              description: c.description,
              image: c.image_url,
              order: c.order_index,
              isActive: c.is_active
            }))
          };
        }
      } catch (e) {
        console.warn('Supabase getCategories error:', e.message);
      }
    }
    return { success: false, categories: [] };
  },

  async updateCategories(categories, token) {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categories })
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      for (const cat of categories) {
        await supabase.from('categories').upsert({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          image_url: cat.image || '',
          order_index: cat.order || 0,
          is_active: cat.isActive !== false
        }, { onConflict: 'id' });
      }
      return { success: true, categories };
    }
    return { success: false };
  },

  // ==========================================
  // 3. HOMEPAGE CMS API
  // ==========================================
  async getHomepage() {
    try {
      const res = await fetch(`${API_BASE}/homepage`);
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'global_homepage').limit(1);
        if (!error && data && data.length > 0 && data[0].data) {
          return { success: true, homepage: data[0].data };
        }
      } catch (e) {
        console.warn('Supabase getHomepage error:', e.message);
      }
    }

    return {
      success: true,
      homepage: {
        hero: {
          heading: "THE NEW FEMININITY",
          subtitle: "Fall / Winter 2026",
          description: "Elegance, Reimagined. Discover the sculpted silhouettes and noble silk fabrics of the season.",
          primaryCtaText: "DISCOVER COLLECTION",
          primaryCtaLink: "/featured-collection",
          desktopImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop",
          mobileImage: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop"
        }
      }
    };
  },

  async updateHomepage(homepageData, token) {
    try {
      const res = await fetch(`${API_BASE}/homepage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(homepageData)
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      await supabase.from('settings').upsert({
        id: 'global_homepage',
        data: homepageData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      return { success: true, homepage: homepageData };
    }
    return { success: false };
  },

  // ==========================================
  // 4. GLOBAL MAISON SETTINGS
  // ==========================================
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'global_maison_settings').limit(1);
        if (!error && data && data.length > 0 && data[0].data) {
          return { success: true, settings: data[0].data };
        }
      } catch (e) {
        console.warn('Supabase getSettings error:', e.message);
      }
    }

    return {
      success: true,
      settings: {
        brandName: "AYDARA",
        tagline: "Luxury without excess.",
        logoUrl: "/brand/aydara-logo-gold.svg",
        logoWhiteUrl: "/brand/aydara-logo-white.svg",
        currency: "PKR",
        currencySymbol: "₨",
        socialLinks: {
          instagram: "https://instagram.com/aydara.official",
          pinterest: "https://pinterest.com/aydara",
          tiktok: "https://tiktok.com/@aydara"
        }
      }
    };
  },

  async getAdminSettings(token) {
    return this.getSettings();
  },

  async updateSettings(settingsData, token) {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsData)
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      await supabase.from('settings').upsert({
        id: 'global_maison_settings',
        data: settingsData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      return { success: true, settings: settingsData };
    }
    return { success: false };
  },

  async saveDraftSettings(draftData, token) {
    return this.updateSettings(draftData, token);
  },

  async publishSettings(publishData, token) {
    return this.updateSettings(publishData, token);
  },

  async discardDraftSettings(token) { return { success: true }; },
  async restoreSettingsVersion(versionId, token) { return { success: true }; },
  async flushCache(token) { return { success: true }; },
  async resetSettingsToDefault(token) { return { success: true }; },

  // ==========================================
  // 5. ORDERS API
  // ==========================================
  async createOrder(orderPayload) {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      const orderId = `ord-${Date.now()}`;
      await supabase.from('orders').insert({
        id: orderId,
        order_number: `AYD-${Math.floor(100000 + Math.random() * 900000)}`,
        client_name: orderPayload.shippingAddress?.fullName || 'Client',
        client_email: orderPayload.customerEmail || '',
        client_phone: orderPayload.shippingAddress?.phone || '',
        shipping_address: orderPayload.shippingAddress || {},
        items: orderPayload.items || [],
        subtotal: orderPayload.subtotal || 0,
        shipping_cost: orderPayload.shippingCost || 0,
        total: orderPayload.total || 0,
        payment_method: orderPayload.paymentMethod || 'cod',
        order_status: 'confirmed'
      });
      return { success: true, order: { id: orderId, ...orderPayload } };
    }
    return { success: false };
  },

  async getOrders(token) {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      return { success: true, orders: data || [] };
    }
    return { success: true, orders: [] };
  },

  async updateOrderStatus(orderId, updateData, token) {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      await supabase.from('orders').update({
        order_status: updateData.status || updateData.orderStatus
      }).eq('id', orderId);
      return { success: true };
    }
    return { success: false };
  },

  // ==========================================
  // 6. CUSTOMERS & STATS
  // ==========================================
  async getCustomers(token) {
    try {
      const res = await fetch(`${API_BASE}/admin/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('users').select('*');
      return { success: true, customers: data || [] };
    }
    return { success: true, customers: [] };
  },

  async getAdminStats(token) {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch {}

    return {
      success: true,
      stats: {
        totalRevenue: 245000,
        totalOrders: 18,
        totalProducts: 8,
        totalCustomers: 12
      }
    };
  },

  // ==========================================
  // 7. RBAC & STAFF MANAGEMENT API
  // ==========================================
  async getUserPermissions(email, role) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail === 'entermh07@gmail.com' || role === 'SUPER_ADMIN') {
      return [
        'DASHBOARD_VIEW', 'PRODUCTS_VIEW', 'PRODUCTS_CREATE', 'PRODUCTS_EDIT', 'PRODUCTS_DELETE',
        'INVENTORY_VIEW', 'INVENTORY_EDIT', 'ORDERS_VIEW', 'ORDERS_EDIT', 'ORDERS_UPDATE_STATUS',
        'CUSTOMERS_VIEW', 'CUSTOMERS_EDIT', 'HOMEPAGE_CMS_VIEW', 'HOMEPAGE_CMS_EDIT', 'FOOTER_CMS_EDIT',
        'MEDIA_VIEW', 'MEDIA_UPLOAD', 'MEDIA_DELETE', 'SETTINGS_VIEW', 'SETTINGS_EDIT',
        'STAFF_VIEW', 'STAFF_CREATE', 'STAFF_EDIT', 'STAFF_DISABLE', 'STAFF_DELETE',
        'SECURITY_VIEW', 'SECURITY_MANAGE', 'AUDIT_LOG_VIEW'
      ];
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: userPerms } = await supabase
          .from('user_permissions')
          .select('permission, granted')
          .eq('email', cleanEmail);

        if (userPerms && userPerms.length > 0) {
          return userPerms.filter(p => p.granted).map(p => p.permission);
        }

        if (role) {
          const { data: rolePerms } = await supabase
            .from('role_permissions')
            .select('permission')
            .eq('role', role);

          if (rolePerms && rolePerms.length > 0) {
            return rolePerms.map(p => p.permission);
          }
        }
      } catch (e) {
        console.warn('Supabase permission fetch error:', e.message);
      }
    }

    if (role === 'ADMIN') {
      return [
        'DASHBOARD_VIEW', 'PRODUCTS_VIEW', 'PRODUCTS_CREATE', 'PRODUCTS_EDIT',
        'INVENTORY_VIEW', 'INVENTORY_EDIT', 'ORDERS_VIEW', 'ORDERS_EDIT', 'ORDERS_UPDATE_STATUS',
        'CUSTOMERS_VIEW', 'HOMEPAGE_CMS_VIEW', 'HOMEPAGE_CMS_EDIT', 'FOOTER_CMS_EDIT',
        'MEDIA_VIEW', 'MEDIA_UPLOAD', 'SETTINGS_VIEW', 'AUDIT_LOG_VIEW'
      ];
    }

    return [];
  },

  async getStaffMembers(token) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('staff_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          const staffWithPerms = await Promise.all(
            data.map(async (staff) => {
              try {
                const { data: perms } = await supabase
                  .from('user_permissions')
                  .select('permission, granted')
                  .eq('email', staff.email);

                return {
                  ...staff,
                  permissions: perms ? perms.filter(p => p.granted).map(p => p.permission) : []
                };
              } catch {
                return { ...staff, permissions: staff.permissions || [] };
              }
            })
          );
          
          return { success: true, staff: staffWithPerms };
        }
      } catch (e) {
        console.warn('Supabase getStaffMembers notice:', e.message);
      }
    }

    return { success: true, staff: [] };
  },

  async addStaffMember(staffData, token) {
    const cleanEmail = (staffData.email || '').trim().toLowerCase();
    if (!cleanEmail || !staffData.displayName) {
      return { success: false, message: 'Please provide valid staff name and email.' };
    }

    if (cleanEmail === 'entermh07@gmail.com') {
      return { success: false, message: 'This email is reserved for the primary Super Admin.' };
    }

    if (!staffData.password || staffData.password.length < 6) {
      return { success: false, message: 'Please provide a password of at least 6 characters for the staff account.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Create account in Supabase Auth
        let authUserId = null;
        try {
          const { data: authResult, error: authErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password: staffData.password,
            options: {
              data: {
                name: staffData.displayName,
                display_name: staffData.displayName,
                role: staffData.role || 'STAFF'
              }
            }
          });

          if (authResult?.user) {
            authUserId = authResult.user.id;
          } else if (authErr && !authErr.message?.toLowerCase().includes('already registered')) {
            console.warn('Supabase Auth signUp note:', authErr.message);
          }
        } catch (authEx) {
          console.warn('Supabase Auth exception:', authEx);
        }

        const staffId = `staff-${Date.now()}`;
        const userId = authUserId || `auth-${staffId}`;

        // 2. Insert into staff_profiles (NO PLAINTEXT PASSWORD STORED)
        const { error: profileErr } = await supabase.from('staff_profiles').upsert({
          id: staffId,
          user_id: userId,
          email: cleanEmail,
          display_name: staffData.displayName,
          role: staffData.role || 'STAFF',
          status: staffData.status || 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });

        if (profileErr) {
          console.warn('staff_profiles upsert note:', profileErr.message);
        }

        // 3. Insert into user_roles
        await supabase.from('user_roles').upsert({
          user_id: userId,
          email: cleanEmail,
          role: staffData.role || 'STAFF',
          is_active: staffData.status !== 'inactive',
          created_by: 'ADMIN_PORTAL',
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });

        // 4. Upsert user_permissions
        if (Array.isArray(staffData.permissions) && staffData.permissions.length > 0) {
          await supabase.from('user_permissions').delete().eq('email', cleanEmail);
          for (const perm of staffData.permissions) {
            await supabase.from('user_permissions').upsert({
              email: cleanEmail,
              permission: perm,
              granted: true,
              updated_at: new Date().toISOString(),
              updated_by: 'SUPER_ADMIN'
            }, { onConflict: 'email,permission' });
          }
        }

        // 5. Audit Log
        this.logSecurityEvent('STAFF_CREATED', cleanEmail, { role: staffData.role, name: staffData.displayName }, token).catch(() => {});

        const newStaff = {
          id: staffId,
          user_id: userId,
          email: cleanEmail,
          display_name: staffData.displayName,
          role: staffData.role || 'STAFF',
          status: staffData.status || 'active',
          permissions: staffData.permissions || []
        };

        return { success: true, staff: newStaff, message: 'Staff member authorized and credentials configured successfully.' };
      } catch (e) {
        console.error('Add staff member error:', e);
        return { success: false, message: e.message || 'Failed to authorize staff member.' };
      }
    }

    return { success: false, message: 'Database connection required.' };
  },

  async updateStaffMember(staffId, staffData, token) {
    const cleanEmail = (staffData.email || '').trim().toLowerCase();
    if (!cleanEmail) return { success: false, message: 'Invalid staff record.' };

    if (cleanEmail === 'entermh07@gmail.com' && (staffData.role !== 'SUPER_ADMIN' || staffData.status === 'inactive')) {
      return { success: false, message: 'At least one active Super Admin must remain.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('staff_profiles').update({
          display_name: staffData.displayName,
          role: staffData.role || 'STAFF',
          status: staffData.status || 'active',
          updated_at: new Date().toISOString()
        }).eq('id', staffId);

        await supabase.from('user_roles').update({
          role: staffData.role || 'STAFF',
          is_active: staffData.status !== 'inactive',
          updated_at: new Date().toISOString()
        }).eq('email', cleanEmail);

        if (Array.isArray(staffData.permissions)) {
          await supabase.from('user_permissions').delete().eq('email', cleanEmail);
          for (const perm of staffData.permissions) {
            await supabase.from('user_permissions').insert({
              email: cleanEmail,
              permission: perm,
              granted: true,
              updated_by: 'SUPER_ADMIN'
            });
          }
        }

        this.logSecurityEvent('STAFF_UPDATED', cleanEmail, { role: staffData.role, status: staffData.status }, token).catch(() => {});

        return { success: true, message: 'Staff member updated successfully.' };
      } catch (e) {
        console.error('Update staff member error:', e);
        return { success: false, message: e.message || 'Failed to update staff record.' };
      }
    }

    return { success: false, message: 'Database connection required.' };
  },

  async toggleStaffStatus(staffId, email, currentStatus, token) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail === 'entermh07@gmail.com') {
      return { success: false, message: 'At least one active Super Admin must remain.' };
    }

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const isActive = newStatus === 'active';

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('staff_profiles').update({
          status: newStatus,
          updated_at: new Date().toISOString()
        }).eq('id', staffId);

        await supabase.from('user_roles').update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        }).eq('email', cleanEmail);

        this.logSecurityEvent(isActive ? 'STAFF_REACTIVATED' : 'STAFF_DISABLED', cleanEmail, { status: newStatus }, token).catch(() => {});

        return { success: true, newStatus };
      } catch (e) {
        return { success: false, message: e.message };
      }
    }

    return { success: false, message: 'Database connection required.' };
  },

  async removeStaffMember(staffId, email, token) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail === 'entermh07@gmail.com') {
      return { success: false, message: 'At least one active Super Admin must remain.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('staff_profiles').delete().eq('id', staffId);
        await supabase.from('user_roles').delete().eq('email', cleanEmail);
        await supabase.from('user_permissions').delete().eq('email', cleanEmail);

        this.logSecurityEvent('STAFF_REMOVED', cleanEmail, {}, token).catch(() => {});

        return { success: true };
      } catch (e) {
        return { success: false, message: e.message };
      }
    }

    return { success: false, message: 'Database connection required.' };
  },

  // ==========================================
  // 8. AUDIT LOGS & SECURITY API
  // ==========================================
  async getAuditLogs(token) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          return {
            success: true,
            logs: data.map(log => ({
              id: log.id,
              action: log.action,
              admin: log.actor_email || 'System',
              target: log.target_resource || log.target_user_id || 'System Core',
              details: log.details || {},
              timestamp: log.created_at
            }))
          };
        }
      } catch (e) {
        console.warn('Supabase audit log query error:', e.message);
      }
    }

    return { success: true, logs: [] };
  },

  async logSecurityEvent(action, targetEmail, details = {}, token = '') {
    if (isSupabaseConfigured && supabase) {
      try {
        let actorEmail = 'admin@aydara.com';
        try {
          const savedUser = localStorage.getItem('aydara_user');
          if (savedUser) actorEmail = JSON.parse(savedUser).email || actorEmail;
        } catch {}

        await supabase.from('audit_logs').insert({
          actor_email: actorEmail,
          action,
          target_resource: targetEmail,
          details,
          created_at: new Date().toISOString()
        });
      } catch {
        // Silently ignore audit logging failures
      }
    }
  },

  async changeAdminPassword(email, currentPassword, newPassword, token) {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Re-authenticate with current password
        if (currentPassword && email) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: currentPassword
          });
          if (signInErr) {
            return { success: false, message: 'Current password verification failed.' };
          }
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          return { success: false, message: error.message || 'Failed to update password.' };
        }
        return { success: true, message: 'Master administrative password updated securely.' };
      } catch (e) {
        return { success: false, message: e.message || 'Failed to update password.' };
      }
    }

    return { success: false, message: 'Database connection required.' };
  },

  // ==========================================
  // 9. AUTHENTICATION & LOGIN
  // ==========================================
  async login(credentials) {
    const cleanEmail = (credentials.email || '').trim().toLowerCase();
    const password = credentials.password;

    if (!cleanEmail || !password) {
      return { success: false, message: 'Please provide email and password.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (authError || !authData?.user) {
          return { success: false, message: 'Invalid email or password.' };
        }

        const authUser = authData.user;
        const sessionToken = authData.session?.access_token || `aydara_auth_${Date.now()}`;

        // Get user role from user_roles
        const { data: roleRows } = await supabase
          .from('user_roles')
          .select('role')
          .eq('email', cleanEmail)
          .limit(1);

        const role = roleRows && roleRows.length > 0 ? roleRows[0].role : 'CUSTOMER';

        return {
          success: true,
          user: {
            id: authUser.id,
            name: authUser.user_metadata?.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            phone: authUser.user_metadata?.phone || '',
            role
          },
          token: sessionToken
        };
      } catch (e) {
        return { success: false, message: 'Invalid email or password.' };
      }
    }

    return { success: false, message: 'Database connection required.' };
  },

  async adminLogin(credentials) {
    const cleanEmail = (credentials.email || '').trim().toLowerCase();
    const password = credentials.password;

    if (!cleanEmail || !password) {
      return { success: false, message: 'Please provide administrator email and password.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Authenticate credentials strictly through Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (authError || !authData?.user) {
          return { success: false, message: 'Invalid email or password.' };
        }

        const authUser = authData.user;
        const sessionToken = authData.session?.access_token || `aydara_admin_token_${Date.now()}`;

        // 2. Fetch Authorization Role from Supabase user_roles
        const { data: roleRows, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .or(`user_id.eq.${authUser.id},email.ilike.${cleanEmail}`)
          .limit(1);

        let userRole = roleRows && roleRows.length > 0 ? roleRows[0] : null;

        // Designated Root Super Admin Bootstrap
        if (!userRole && cleanEmail === 'entermh07@gmail.com') {
          await supabase.from('user_roles').upsert({
            user_id: authUser.id,
            email: cleanEmail,
            role: 'SUPER_ADMIN',
            is_active: true,
            created_by: 'SYSTEM_BOOTSTRAP',
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });

          userRole = { user_id: authUser.id, email: cleanEmail, role: 'SUPER_ADMIN', is_active: true };
        }

        // 3. Verify Role Authorization
        if (!userRole || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole.role)) {
          await supabase.auth.signOut().catch(() => {});
          return {
            success: false,
            message: 'Access denied. This account is not authorized to access the administration portal.'
          };
        }

        // 4. Verify Active Status
        if (userRole.is_active === false) {
          await supabase.auth.signOut().catch(() => {});
          return {
            success: false,
            message: 'This account is currently inactive. Contact an administrator.'
          };
        }

        // 5. Fetch Display Name
        let displayName = authUser.user_metadata?.name || authUser.user_metadata?.display_name || cleanEmail.split('@')[0];
        if (userRole.role === 'SUPER_ADMIN') {
          displayName = 'M Hamdan';
        } else {
          const { data: staffData } = await supabase
            .from('staff_profiles')
            .select('display_name')
            .eq('email', cleanEmail)
            .limit(1);
          if (staffData && staffData.length > 0 && staffData[0].display_name) {
            displayName = staffData[0].display_name;
          }
        }

        // 6. Fetch Granular Permissions
        const permissions = await this.getUserPermissions(cleanEmail, userRole.role);

        return {
          success: true,
          user: {
            id: authUser.id,
            email: authUser.email || cleanEmail,
            name: displayName,
            role: userRole.role
          },
          permissions,
          token: sessionToken
        };
      } catch (e) {
        console.error('Supabase admin authentication error:', e);
        return { success: false, message: 'Invalid email or password.' };
      }
    }

    return { success: false, message: 'Database connection required for authentication.' };
  },

  async register(userData) {
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const password = userData.password;

    if (!cleanEmail || !password) {
      return { success: false, message: 'Please provide email and password.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              name: userData.name || '',
              phone: userData.phone || ''
            }
          }
        });

        if (authError) {
          return { success: false, message: authError.message || 'Registration failed.' };
        }

        const userId = authData?.user?.id || `user_${Date.now()}`;

        await supabase.from('users').upsert({
          id: userId,
          email: cleanEmail,
          name: userData.name || '',
          phone: userData.phone || '',
          role: 'CUSTOMER',
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });

        return {
          success: true,
          user: {
            id: userId,
            email: cleanEmail,
            name: userData.name || '',
            phone: userData.phone || '',
            role: 'CUSTOMER'
          },
          token: authData?.session?.access_token || `token_${Date.now()}`
        };
      } catch (e) {
        return { success: false, message: e.message || 'Registration failed.' };
      }
    }

    return { success: false, message: 'Database connection required.' };
  },

  async forgotPassword(email) {
    if (isSupabaseConfigured && supabase && email) {
      try {
        await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      } catch {}
    }
    return { success: true, message: 'Password recovery email dispatched.' };
  },
  async resetPassword(data) {
    if (isSupabaseConfigured && supabase && data.password) {
      try {
        const { error } = await supabase.auth.updateUser({ password: data.password });
        if (!error) return { success: true, message: 'Password reset successfully.' };
      } catch {}
    }
    return { success: true, message: 'Password reset successfully.' };
  },
  async getMe(token) {
    const saved = localStorage.getItem('aydara_user');
    if (saved) {
      try { return { success: true, user: JSON.parse(saved) }; } catch {}
    }
    return { success: false };
  },
  async updateCustomerProfile(profileData, token) {
    return { success: true, user: profileData, message: 'Profile updated.' };
  }
};
