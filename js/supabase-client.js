// Supabase Client Setup
let supabaseClient = null;

// Mock Supabase Client for demo (works without actual Supabase)
class MockSupabaseClient {
  constructor() {
    this.initMockDB();
  }

  initMockDB() {
    if (!localStorage.getItem('mock_users')) {
      localStorage.setItem('mock_users', JSON.stringify([
        {
          id: 'admin123',
          email: 'admin@creatorvault.com',
          password: 'password123',
          full_name: 'Admin User',
          membership_status: 'premium',
          membership_expiry: new Date(Date.now() + 30 * 86400000).toISOString(),
          role: 'admin'
        }
      ]));
    }
    if (!localStorage.getItem('mock_payments')) {
      localStorage.setItem('mock_payments', JSON.stringify([]));
    }
    if (!localStorage.getItem('mock_photos')) {
      localStorage.setItem('mock_photos', JSON.stringify([
        {
          id: '1',
          title: 'Golden Hour Dreams',
          description: 'Beautiful sunset photography',
          thumbnail_url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=400',
          category: 'Photography',
          premium: false,
          views: 1240
        },
        {
          id: '2',
          title: 'Neon Tokyo Nights',
          description: 'Urban street photography',
          thumbnail_url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
          category: 'Urban',
          premium: true,
          views: 3400
        },
        {
          id: '3',
          title: 'Watercolor Masterclass',
          description: 'Digital art tutorial',
          thumbnail_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
          category: 'Tutorial',
          premium: true,
          views: 890
        }
      ]));
    }
    if (!localStorage.getItem('mock_videos')) {
      localStorage.setItem('mock_videos', JSON.stringify([
        {
          id: 'v1',
          title: 'Cinematic Lighting Setup',
          description: 'Pro lighting tutorial',
          thumbnail_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400',
          category: 'Tutorial',
          duration: '12:34',
          premium: true,
          views: 2300
        },
        {
          id: 'v2',
          title: 'Behind the Scenes',
          description: 'Creative process vlog',
          thumbnail_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
          category: 'Vlog',
          duration: '8:22',
          premium: false,
          views: 4100
        }
      ]));
    }
    if (!localStorage.getItem('mock_collections')) {
      localStorage.setItem('mock_collections', JSON.stringify([
        {
          id: 'c1',
          name: 'Summer Vibes Collection',
          description: 'Bright and warm content',
          cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'
        }
      ]));
    }
    if (!localStorage.getItem('mock_favorites')) {
      localStorage.setItem('mock_favorites', JSON.stringify([]));
    }
    if (!localStorage.getItem('current_session')) {
      localStorage.setItem('current_session', 'null');
    }
  }

  auth = {
    signUp: async ({ email, password, options }) => {
      const users = JSON.parse(localStorage.getItem('mock_users'));
      if (users.find(u => u.email === email)) {
        return { error: { message: 'User already exists' }, data: null };
      }
      const newUser = {
        id: Date.now().toString(),
        email,
        password,
        full_name: options?.data?.full_name || email.split('@')[0],
        membership_status: 'free',
        membership_expiry: null,
        role: 'user',
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(users));
      return { data: { user: newUser, session: {} }, error: null };
    },

    signInWithPassword: async ({ email, password }) => {
      const users = JSON.parse(localStorage.getItem('mock_users'));
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        return { error: { message: 'Invalid email or password' }, data: null };
      }
      localStorage.setItem('current_session', JSON.stringify(user));
      return { data: { user, session: {} }, error: null };
    },

    signOut: async () => {
      localStorage.setItem('current_session', 'null');
      return { error: null };
    },

    getUser: () => {
      const session = localStorage.getItem('current_session');
      if (session && session !== 'null') {
        return JSON.parse(session);
      }
      return null;
    },

    onAuthStateChange: (callback) => {
      callback('SIGNED_IN', this.getUser());
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  };

  from(table) {
    return {
      select: () => ({
        eq: (field, value) => ({
          single: () => {
            const data = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
            return { data: data.find(item => item[field] == value), error: null };
          },
          data: JSON.parse(localStorage.getItem(`mock_${table}`) || '[]')
        }),
        order: () => ({
          data: JSON.parse(localStorage.getItem(`mock_${table}`) || '[]')
        })
      }),
      insert: (data) => {
        const arr = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
        const newItem = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
        arr.push(newItem);
        localStorage.setItem(`mock_${table}`, JSON.stringify(arr));
        return { error: null, data: newItem };
      },
      update: (updateData) => ({
        eq: (field, value) => {
          const arr = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
          const index = arr.findIndex(i => i[field] == value);
          if (index !== -1) {
            arr[index] = { ...arr[index], ...updateData };
            localStorage.setItem(`mock_${table}`, JSON.stringify(arr));
          }
          return { error: null };
        }
      }),
      delete: () => ({
        eq: (field, value) => {
          let arr = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
          arr = arr.filter(i => i[field] != value);
          localStorage.setItem(`mock_${table}`, JSON.stringify(arr));
          return { error: null };
        }
      })
    };
  }

  storage = {
    from: () => ({
      upload: async () => ({ data: { publicUrl: 'https://picsum.photos/200' }, error: null })
    })
  };
}

// Initialize Supabase
function initSupabase() {
  if (USE_MOCK_MODE) {
    supabaseClient = new MockSupabaseClient();
    console.log('Using Mock Supabase Client (Demo Mode)');
  } else {
    // For real Supabase integration
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// Helper Functions
async function getCurrentUser() {
  if (!supabaseClient) initSupabase();
  return supabaseClient.auth.getUser();
}

async function isPremiumMember() {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.membership_status === 'premium' || user.membership_status === 'VIP') {
    if (user.membership_expiry && new Date(user.membership_expiry) > new Date()) {
      return true;
    }
  }
  return false;
}

function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Load common components
async function loadNavAndFooter() {
  const user = await getCurrentUser();
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Navbar
  const navHtml = `
    <nav class="navbar">
      <a href="index.html" class="logo">CreatorVault</a>
      <div class="hamburger" id="hamburgerBtn">
        <i class="fas fa-bars"></i>
      </div>
      <div class="nav-links" id="navLinks">
        <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Home</a>
        <a href="explore.html" class="${currentPage === 'explore.html' ? 'active' : ''}">Explore</a>
        <a href="gallery.html" class="${currentPage === 'gallery.html' ? 'active' : ''}">Gallery</a>
        <a href="videos.html" class="${currentPage === 'videos.html' ? 'active' : ''}">Videos</a>
        <a href="membership.html" class="${currentPage === 'membership.html' ? 'active' : ''}">Membership</a>
        <a href="contact.html" class="${currentPage === 'contact.html' ? 'active' : ''}">Contact</a>
        ${user ? `<a href="dashboard.html">Dashboard</a>` : ''}
        ${user?.role === 'admin' ? `<a href="admin.html">Admin</a>` : ''}
        <div class="nav-buttons">
          ${!user ? `
            <a href="login.html"><button class="btn-outline">Login</button></a>
            <a href="register.html"><button class="btn-primary">Join Now</button></a>
          ` : `
            <span style="font-weight: 500;">✨ ${user.full_name}</span>
            <button class="btn-outline" id="logoutBtn">Logout</button>
          `}
        </div>
      </div>
    </nav>
  `;
  
  document.getElementById('navbar-container').innerHTML = navHtml;
  
  // Footer
  const footerHtml = `
    <footer class="footer">
      <div class="container">
        <p style="color: #EC4899;">&copy; 2025 CreatorVault — Premium Creator Community</p>
        <div style="margin-top: 16px;">
          <a href="privacy.html" style="margin: 0 12px; text-decoration: none; color: #666;">Privacy Policy</a>
          <a href="terms.html" style="margin: 0 12px; text-decoration: none; color: #666;">Terms of Service</a>
        </div>
      </div>
    </footer>
  `;
  
  document.getElementById('footer-container').innerHTML = footerHtml;
  
  // Event Listeners
  document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
    document.getElementById('navLinks')?.classList.toggle('mobile-open');
  });
  
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    showToast('Logged out successfully');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  loadNavAndFooter();
});
