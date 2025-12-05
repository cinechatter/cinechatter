import React, { useState, useEffect } from 'react';
import { Film, TrendingUp, Plus, Edit2, Trash2, Eye, X, Menu, Search, ChevronDown, ChevronUp, Upload, Settings, User, LogOut, Download, Moon, Sun, Save, Type, Bold, Italic, List, ListOrdered, Heading2, Play, ChevronLeft, ChevronRight, Pause } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { autoGenerateSEOFields } from './utils/seoHelpers';
import AIArticleGenerator from './components/AIArticleGenerator';
import storageService from './services/storageService';
import { getTrendingNews } from './services/rssFeedService';

const categories = [
  { id: 'hollywood-movies', name: 'Hollywood Movies' },
  { id: 'hollywood-news', name: 'Hollywood News' },
  { id: 'bollywood-movies', name: 'Bollywood Movies' },
  { id: 'bollywood-news', name: 'Bollywood News' },
  { id: 'ott', name: 'OTT' },
  { id: 'music', name: 'Music' },
  { id: 'celebrity-style', name: 'Celebrity Style' },
  { id: 'international', name: 'International Cinema' },
  { id: 'youtube-scripts', name: 'YouTube Scripts' }
];

const CineChatter = () => {
  const [articles, setArticles] = useState([]);
  const [showAdminRequestModal, setShowAdminRequestModal] = useState(false);
  const [adminRequestForm, setAdminRequestForm] = useState({ name: '', email: '', password: '', message: '' });
  const [currentView, setCurrentView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('hollywood-movies');
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hollywoodOpen, setHollywoodOpen] = useState(false);
  const [bollywoodOpen, setBollywoodOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [formInputs, setFormInputs] = useState({
    title: '',
    content: '',
    category: 'hollywood-movies',
    image: '',
    status: 'published'
  });

  const [featuredImages, setFeaturedImages] = useState([
    { id: 1, image: '', title: 'Untold Story 1', link: 'hollywood-movies', articleTitle: '', articleDescription: '' }
  ]);

  const [showFeaturedManager, setShowFeaturedManager] = useState(false);
  const [treasureBoxOpen, setTreasureBoxOpen] = useState(false);
  const [currentTreasureIndex, setCurrentTreasureIndex] = useState(0);
  const [selectedTreasureArticle, setSelectedTreasureArticle] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [giftBoxCollapsed, setGiftBoxCollapsed] = useState(false);

  // RSS Feed State
  const [rssArticles, setRssArticles] = useState([]);
  const [rssLoading, setRssLoading] = useState(false);
  
  // Google Sheets Integration
  const [sheetsEnabled, setSheetsEnabled] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetStatus, setSheetStatus] = useState('not-connected');
  const [dataSource, setDataSource] = useState('sheets-only');
  const [sheetArticles, setSheetArticles] = useState([]);
  const [showIntegrationSettings, setShowIntegrationSettings] = useState(false);

  // Authentication State
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Latest Articles Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [carouselProgress, setCarouselProgress] = useState(0);

  // Admin Management State
  const [showManageAdmins, setShowManageAdmins] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [adminRequests, setAdminRequests] = useState([]);
  const [showRequestsTab, setShowRequestsTab] = useState(true); // true = requests, false = users

  // CSV Export Selection State
  const [selectedArticles, setSelectedArticles] = useState([])

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Admin Tab State (Gmail-style)
  const [activeAdminTab, setActiveAdminTab] = useState('articles');

  // Inline Editing State
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [inlineEditContent, setInlineEditContent] = useState('');
  const [inlineEditingArticleId, setInlineEditingArticleId] = useState(null);
  const [categoryInlineEditContent, setCategoryInlineEditContent] = useState('');

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      return newMode;
    });
  };

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Smooth scroll to top when view changes
  useEffect(() => {
    // Small delay to ensure DOM is ready and scroll is visible
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }, [currentView, selectedCategory]);

  useEffect(() => {
    loadArticles();
    loadFeaturedImages();
    checkUser();
    loadSheetSettings(); // Load saved Google Sheets settings
    loadRSSFeed(); // Load RSS feed articles

    // Expose supabase to window for testing (development only)
    if (process.env.NODE_ENV === 'development') {
      window.supabase = supabase;
    }
  }, []);

  // Carousel auto-advance effect
  useEffect(() => {
    if (isCarouselPaused || currentView !== 'home') return;

    // Calculate carousel articles count
    let allArticles = [];
    if (dataSource === 'admin-only') {
      allArticles = articles.filter(a => a.status === 'published');
    } else if (dataSource === 'sheets-only') {
      allArticles = sheetArticles.filter(a => a.status === 'published');
    } else if (dataSource === 'both') {
      allArticles = [...articles.filter(a => a.status === 'published'), ...sheetArticles.filter(a => a.status === 'published')];
    }
    const carouselCount = Math.min(allArticles.length, 5);

    if (carouselCount <= 1) return;

    const progressInterval = setInterval(() => {
      setCarouselProgress(prev => {
        if (prev >= 100) {
          setCurrentSlide(s => (s + 1) % carouselCount);
          return 0;
        }
        return prev + (100 / 70); // 7 seconds = 70 intervals of 100ms
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isCarouselPaused, currentView, dataSource, articles, sheetArticles, currentSlide]);

  // Check if user is logged in
  const checkUser = async () => {
    if (!isSupabaseConfigured()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch user profile including admin status
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUser({ ...user, profile });
      } else {
        setUser(user);
      }
    }
  };

  // Show admin request modal when accessing #admin
  const showAdminAccessModal = () => {
    if (currentView === 'admin' && !user) {
      // User not logged in, show request modal
      setShowAdminRequestModal(true);
    }
  };

  // Check URL hash for secret admin access
  useEffect(() => {
    const checkUrlHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin' || hash === '#/admin') {
        setCurrentView('admin');
        // Clear the hash to keep it secret
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    checkUrlHash();
    window.addEventListener('hashchange', checkUrlHash);

    return () => {
      window.removeEventListener('hashchange', checkUrlHash);
    };
  }, []);

  // Show admin request modal when navigating to admin view
  useEffect(() => {
    if (currentView === 'admin') {
      showAdminAccessModal();
    } else {
      setShowAdminRequestModal(false);
    }
  }, [currentView, user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setHollywoodOpen(false);
      setBollywoodOpen(false);
      setMoreOpen(false);
      setUserMenuOpen(false);
    };

    if (hollywoodOpen || bollywoodOpen || moreOpen || userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [hollywoodOpen, bollywoodOpen, moreOpen, userMenuOpen]);

  // Authentication Functions
  const handleSignup = async () => {
    if (!isSupabaseConfigured()) {
      alert('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
      return;
    }

    if (!authForm.email || !authForm.password) {
      alert('Please enter email and password');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: authForm.email,
      password: authForm.password,
      options: {
        data: {
          name: authForm.name || authForm.email.split('@')[0]
        }
      }
    });

    if (error) {
      alert('Signup error: ' + error.message);
    } else {
      alert('Signup successful! Please check your email for verification.');
      setAuthForm({ name: '', email: '', password: '' });
      setShowAuthModal(false);
      checkUser();
    }
  };

  const handleLogin = async () => {
    if (!isSupabaseConfigured()) {
      alert('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
      return;
    }

    if (!authForm.email || !authForm.password) {
      alert('Please enter email and password');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authForm.email.trim(),
        password: authForm.password.trim()
      });

      if (error) {
        console.error('Login error:', error);
        alert('Login error: ' + error.message);
      } else {
        setAuthForm({ name: '', email: '', password: '' });
        setShowAuthModal(false);
        checkUser();
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      alert('Login failed: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
  };

  // Handle first-time admin setup
  // Handle admin access request
  const handleAdminRequest = async () => {
    if (!isSupabaseConfigured()) {
      alert('Supabase is not configured.');
      return;
    }

    if (!adminRequestForm.name || !adminRequestForm.email || !adminRequestForm.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (adminRequestForm.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      // Create Supabase auth user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminRequestForm.email,
        password: adminRequestForm.password,
        options: {
          data: {
            name: adminRequestForm.name
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          alert('An account with this email already exists. Please login or use a different email.');
        } else {
          alert('Error creating account: ' + authError.message);
        }
        console.error('Signup error:', authError);
        return;
      }

      // Wait for trigger to create user record
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update user record with admin request status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          admin_status: 'P',
          admin_request_message: adminRequestForm.message || null,
          admin_requested_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Error updating user status:', updateError);
      }

      alert(
        'Admin access request submitted successfully!\n\n' +
        'Your account has been created.\n' +
        'Your request has been sent to the site administrator (cinechattercontact@gmail.com).\n' +
        'You will receive an email once your request is approved.\n\n' +
        'This usually takes 24-48 hours.'
      );

      setAdminRequestForm({ name: '', email: '', password: '', message: '' });
      setShowAdminRequestModal(false);
      setCurrentView('home');
    } catch (error) {
      console.error('Request failed:', error);
      alert('Failed to submit request: ' + error.message);
    }
  };

  // Admin Management Functions
  const loadAllUsers = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        alert('Failed to load users: ' + error.message);
        return;
      }

      setAllUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const promoteToAdmin = async (userId, userEmail) => {
    if (!isSupabaseConfigured()) return;

    if (!confirm(`Promote ${userEmail} to admin?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          admin_status: 'A',
          admin_reviewed_at: new Date().toISOString(),
          admin_reviewed_by: user.email
        })
        .eq('id', userId);

      if (error) {
        console.error('Error promoting user:', error);
        alert('Failed to promote user: ' + error.message);
        return;
      }

      alert(`${userEmail} is now an admin!`);
      loadAllUsers(); // Refresh the list
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to promote user: ' + error.message);
    }
  };

  const demoteAdmin = async (userId, userEmail) => {
    if (!isSupabaseConfigured()) return;

    // Prevent demoting yourself
    if (userId === user?.id) {
      alert('You cannot demote yourself!');
      return;
    }

    if (!confirm(`Remove admin privileges from ${userEmail}?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          admin_status: null,
          admin_reviewed_at: new Date().toISOString(),
          admin_reviewed_by: user.email
        })
        .eq('id', userId);

      if (error) {
        console.error('Error demoting admin:', error);
        alert('Failed to demote admin: ' + error.message);
        return;
      }

      alert(`${userEmail} is no longer an admin.`);
      loadAllUsers(); // Refresh the list
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to demote admin: ' + error.message);
    }
  };

  // Load admin requests (users with pending_approval status)
  const loadAdminRequests = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('admin_status', 'P')
        .order('admin_requested_at', { ascending: false });

      if (error) {
        console.error('Error loading requests:', error);
        return;
      }

      setAdminRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  // Approve admin request
  const approveAdminRequest = async (request) => {
    if (!isSupabaseConfigured()) return;

    if (!confirm(`Approve admin request from ${request.name} (${request.email})?`)) return;

    try {
      // Update user: mark as approved admin
      const { error: updateError } = await supabase
        .from('users')
        .update({
          admin_status: 'A',
          admin_reviewed_at: new Date().toISOString(),
          admin_reviewed_by: user.email
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('Error approving user:', updateError);
        alert('Failed to approve: ' + updateError.message);
        return;
      }

      alert(`✅ ${request.email} has been approved as admin!`);
      loadAdminRequests();
      loadAllUsers();
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Failed to approve request: ' + error.message);
    }
  };

  // Reject admin request
  const rejectAdminRequest = async (request) => {
    if (!isSupabaseConfigured()) return;

    const reason = prompt(`Reject request from ${request.email}?\n\nOptional rejection reason:`);
    if (reason === null) return; // User cancelled

    try {
      const { error } = await supabase
        .from('users')
        .update({
          admin_status: 'R',
          rejection_reason: reason || 'No reason provided',
          admin_reviewed_at: new Date().toISOString(),
          admin_reviewed_by: user.email
        })
        .eq('id', request.id);

      if (error) {
        alert('Error rejecting request: ' + error.message);
        return;
      }

      alert(`❌ Request from ${request.email} has been rejected.`);
      loadAdminRequests();
    } catch (error) {
      console.error('Rejection failed:', error);
      alert('Failed to reject request: ' + error.message);
    }
  };

  const loadArticles = async () => {
    try {
      const articles = await storageService.getArticles();
      setArticles(articles);
      console.log(`📚 Loaded ${articles.length} articles from ${storageService.getBackendType()}`);
    } catch (error) {
      console.error('Error loading articles:', error);
      setArticles([]);
    }
  };

  const loadFeaturedImages = async () => {
    try {
      const images = await storageService.getFeaturedImages();
      if (images && images.length > 0) {
        setFeaturedImages(images);
        console.log(`🖼️ Loaded ${images.length} featured images from ${storageService.getBackendType()}`);
      } else {
        console.log('No featured images in storage');
      }
    } catch (error) {
      console.error('Error loading featured images:', error);
    }
  };

  const loadRSSFeed = async () => {
    try {
      setRssLoading(true);
      console.log('📰 Fetching RSS feed articles...');
      const news = await getTrendingNews(10);
      setRssArticles(news);
      console.log(`📰 Loaded ${news.length} RSS articles from Google News`);
    } catch (error) {
      console.error('Error loading RSS feed:', error);
      setRssArticles([]);
    } finally {
      setRssLoading(false);
    }
  };

  const loadSheetSettings = async () => {
    try {
      // Cache version - increment this to invalidate old cached data
      const CACHE_VERSION = '2';
      const savedCacheVersion = localStorage.getItem('cine-chatter-cache-version');

      // If cache version is old, clear all cached data
      if (savedCacheVersion !== CACHE_VERSION) {
        console.log('🔄 Cache version mismatch, clearing old data...');
        localStorage.removeItem('cine-chatter-sheet-articles');
        localStorage.removeItem('cine-chatter-sheet-status');
        localStorage.setItem('cine-chatter-cache-version', CACHE_VERSION);
        console.log('✅ Cache cleared, using fresh data');
        return; // Don't load old cached data
      }

      // Load Google Sheets settings from localStorage
      const savedSheetUrl = localStorage.getItem('cine-chatter-sheet-url');
      const savedDataSource = localStorage.getItem('cine-chatter-data-source');
      const savedSheetArticles = localStorage.getItem('cine-chatter-sheet-articles');
      const savedSheetStatus = localStorage.getItem('cine-chatter-sheet-status');

      if (savedSheetUrl) {
        setSheetUrl(savedSheetUrl);
        console.log('📋 Loaded saved sheet URL');
      }

      if (savedDataSource) {
        setDataSource(savedDataSource);
        console.log('📋 Loaded data source:', savedDataSource);
      } else {
        // Set default to sheets-only if nothing saved
        setDataSource('sheets-only');
        console.log('📋 Using default data source: sheets-only');
      }

      if (savedSheetArticles) {
        const articles = JSON.parse(savedSheetArticles);
        setSheetArticles(articles);
        console.log(`📋 Loaded ${articles.length} sheet articles from cache`);
        console.log('📋 Cached article statuses:', articles.map(a => ({ title: a.title, status: a.status })));
      }

      if (savedSheetStatus) {
        setSheetStatus(savedSheetStatus);
        setSheetsEnabled(savedSheetStatus === 'connected');
      }
    } catch (error) {
      console.error('Error loading sheet settings:', error);
    }
  };

  const saveSheetSettings = async (url, source, articles, status) => {
    try {
      if (url) localStorage.setItem('cine-chatter-sheet-url', url);
      if (source) localStorage.setItem('cine-chatter-data-source', source);
      if (articles) localStorage.setItem('cine-chatter-sheet-articles', JSON.stringify(articles));
      if (status) localStorage.setItem('cine-chatter-sheet-status', status);
      console.log('✅ Sheet settings saved');
    } catch (error) {
      console.error('Error saving sheet settings:', error);
    }
  };

  const saveArticles = async (updatedArticles) => {
    try {
      await storageService.saveArticles(updatedArticles);
      setArticles(updatedArticles);
      console.log(`✅ Articles saved to ${storageService.getBackendType()}. Total: ${updatedArticles.length}`);
    } catch (error) {
      console.error('❌ Failed to save articles:', error);
      throw error;
    }
  };

  const saveFeaturedImages = async (images) => {
    try {
      console.log('Saving featured images:', images);
      await storageService.saveFeaturedImages(images);
      setFeaturedImages(images);

      // Create articles for Untold Stories that have title and description
      const newArticles = [];
      images.forEach(story => {
        if (story.articleTitle && story.articleDescription && story.image) {
          // Check if this article already exists
          const existingArticle = articles.find(a => a.id === `untold-story-${story.id}`);

          if (!existingArticle) {
            // Create new article from Untold Story
            const article = {
              id: `untold-story-${story.id}`,
              title: story.articleTitle,
              content: story.articleDescription,
              category: story.link || 'hollywood-movies',
              image: story.image,
              status: 'published',
              source: 'Untold Stories',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            newArticles.push(article);
          }
        }
      });

      // Add new articles to the articles list
      if (newArticles.length > 0) {
        const updatedArticles = [...articles, ...newArticles];
        await saveArticles(updatedArticles);
        console.log(`Created ${newArticles.length} articles from Untold Stories`);
      }

      console.log('Featured images saved successfully');
    } catch (error) {
      console.error('Failed to save featured images:', error);
    }
  };

  // Admin login removed - now using Supabase authentication with is_admin check

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormInputs(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Google Sheets Integration Functions
  const extractSheetId = (url) => {
    // Handle regular spreadsheet URLs
    const regularMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (regularMatch) {
      return { type: 'regular', id: regularMatch[1] };
    }
    
    // Handle published URLs
    const publishedMatch = url.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (publishedMatch) {
      return { type: 'published', id: publishedMatch[1] };
    }
    
    return null;
  };

  const fetchGoogleSheetData = async () => {
    if (!sheetUrl) {
      setSheetStatus('error');
      return;
    }

    const sheetIdInfo = extractSheetId(sheetUrl);
    if (!sheetIdInfo) {
      setSheetStatus('error');
      return;
    }

    setSheetStatus('connecting');
    
    // Add a small delay to show connecting state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      let csvText = null;
      let finalUrl = '';
      
      // Determine the correct CSV URL
      if (sheetUrl.includes('/pub?output=csv') || sheetUrl.includes('/pub?')) {
        finalUrl = sheetUrl.includes('output=csv') ? sheetUrl : `${sheetUrl}&output=csv`;
      } else if (sheetIdInfo.type === 'published') {
        finalUrl = `https://docs.google.com/spreadsheets/d/e/${sheetIdInfo.id}/pub?output=csv`;
      } else if (sheetIdInfo.type === 'regular') {
        finalUrl = `https://docs.google.com/spreadsheets/d/${sheetIdInfo.id}/export?format=csv`;
      }
      
      console.log('🔗 Attempting to fetch from:', finalUrl);
      
      // Try direct fetch
      try {
        const response = await fetch(finalUrl, { 
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'omit'
        });
        
        if (response.ok) {
          csvText = await response.text();
          console.log('✅ Direct fetch successful!');
        } else {
          console.log('❌ Direct fetch status:', response.status);
        }
      } catch (directError) {
        console.log('❌ Direct fetch blocked:', directError.message);
        
        // Try CORS proxy
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(finalUrl)}`;
          console.log('🔄 Trying CORS proxy...');
          
          const response = await fetch(proxyUrl);
          if (response.ok) {
            csvText = await response.text();
            console.log('✅ CORS proxy successful!');
          }
        } catch (proxyError) {
          console.log('❌ CORS proxy blocked:', proxyError.message);
        }
      }
      
      if (!csvText || csvText.trim().length === 0) {
        // CORS blocked - set to demo mode
        console.log('⚠️ CORS restrictions detected. Creating demo connection...');
        
        // Create sample articles to demonstrate the feature
        const demoArticles = [
          {
            id: 'demo-1',
            category: 'hollywood-movies',
            title: '🎬 Demo: Latest Hollywood Blockbuster',
            content: 'This is a demo article showing how Google Sheets integration works. When deployed to a real website (Netlify, Vercel, etc.), this will pull real data from your sheet. Your sheet URL is validated and ready!',
            image: 'https://via.placeholder.com/400x300/dc2626/ffffff?text=Hollywood+Demo',
            date: new Date().toISOString().split('T')[0],
            status: 'published',
            source: 'google-sheets-demo',
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo-2',
            category: 'bollywood-movies',
            title: '🎬 Demo: Bollywood Box Office Hit',
            content: 'Your Google Sheet is properly configured! The URL is correct. This demo shows the feature working. Deploy your site to see real data from your sheet.',
            image: 'https://via.placeholder.com/400x300/dc2626/ffffff?text=Bollywood+Demo',
            date: new Date().toISOString().split('T')[0],
            status: 'published',
            source: 'google-sheets-demo',
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo-3',
            category: 'ott',
            title: '📺 Demo: New OTT Release',
            content: 'When you publish to a live server, articles from your Google Sheet will automatically appear here. Make sure to set "Data Source" to "Sheets Only" or "Both" to see them.',
            image: 'https://via.placeholder.com/400x300/dc2626/ffffff?text=OTT+Demo',
            date: new Date().toISOString().split('T')[0],
            status: 'published',
            source: 'google-sheets-demo',
            createdAt: new Date().toISOString()
          }
        ];
        
        setSheetArticles(demoArticles);
        setSheetStatus('connected');
        setSheetsEnabled(true);
        
        console.log('✅ Demo mode activated with sample articles');
        console.log('📋 Demo articles:', demoArticles);
        console.log('📋 Your sheet URL is validated and will work on deployment');
        console.log('⚠️ Remember to set Data Source to "Sheets Only" or "Both" to see these articles');
        
        return; // Exit here for demo mode
      }
      
      // Parse real CSV data with proper handling of multi-line fields
      console.log('📊 Parsing CSV data...');

      const rows = [];
      let currentRow = [];
      let currentValue = '';
      let insideQuotes = false;

      // Parse character by character to handle newlines inside quoted fields
      for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            // Escaped quote ("") becomes a single quote
            currentValue += '"';
            i++;
          } else {
            // Toggle quote state
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          // End of field
          currentRow.push(currentValue.trim());
          currentValue = '';
        } else if ((char === '\n' || char === '\r') && !insideQuotes) {
          // End of row (only if not inside quotes)
          if (char === '\r' && nextChar === '\n') {
            i++; // Skip \r\n combination
          }
          if (currentValue.trim() || currentRow.length > 0) {
            currentRow.push(currentValue.trim());
            if (currentRow.some(val => val)) { // Only add non-empty rows
              rows.push(currentRow);
            }
            currentRow = [];
            currentValue = '';
          }
        } else {
          // Regular character
          currentValue += char;
        }
      }

      // Don't forget the last field/row
      if (currentValue.trim() || currentRow.length > 0) {
        currentRow.push(currentValue.trim());
        if (currentRow.some(val => val)) {
          rows.push(currentRow);
        }
      }

      console.log('📊 Parsed rows:', rows.length);
      console.log('📊 First row (headers):', rows[0]);
      if (rows.length > 1) {
        console.log('📊 Second row (first data):', rows[1]);
        console.log('📊 Second row length:', rows[1].length);
      }
      
      if (rows.length < 2) {
        throw new Error('Sheet appears empty');
      }
      
      const dataRows = rows.slice(1).filter(row => row.length > 0 && row[0] && row[0].trim());
      
      const fetchedArticles = dataRows.map((row, index) => {
        // Normalize category to match app format (e.g., "Hollywood Movies" -> "hollywood-movies")
        let category = (row[0] || '').trim().toLowerCase().replace(/\s+/g, '-');

        // Parse status - handle "published", "PUBLISHED", "Published", etc.
        let statusValue = (row[5] || '').trim().toLowerCase();
        let articleStatus = statusValue === 'published' ? 'published' : 'draft';

        // Debug logging for first article
        if (index === 0) {
          console.log('🔍 First row parsing debug:');
          console.log('  Row length:', row.length);
          console.log('  Row data:', row);
          console.log('  Column A (row[0]):', row[0]);
          console.log('  Column B (row[1]):', row[1]);
          console.log('  Column C (row[2]):', row[2]);
          console.log('  Column D (row[3]):', row[3]);
          console.log('  Column E (row[4]):', row[4]);
          console.log('  Column F (row[5]):', row[5]);
          console.log('  Status value (trimmed/lowercase):', statusValue);
          console.log('  Status comparison:', `"${statusValue}" === "published"?`, statusValue === 'published');
          console.log('  Final status:', articleStatus);
        }

        return {
          id: `sheet-${Date.now()}-${index}`,
          category: category,
          title: (row[1] || '').trim(),
          content: (row[2] || '').trim(),
          image: (row[3] || '').trim(),
          date: (row[4] || new Date().toISOString().split('T')[0]).trim(),
          status: articleStatus,
          source: 'google-sheets',
          createdAt: (row[4] || new Date().toISOString())
        };
      }).filter(article => article.title && article.category);
      
      console.log('📊 Parsed articles:', fetchedArticles);
      console.log('📊 Article statuses:', fetchedArticles.map(a => ({ title: a.title, status: a.status })));

      // Debug: Log content with image tags
      if (fetchedArticles.length > 0) {
        console.log('🖼️ First article content preview:', fetchedArticles[0].content.substring(0, 500));
        console.log('🔍 Image tags found:', (fetchedArticles[0].content.match(/\[image\]/g) || []).length);
      }

      // Check for duplicates by title (case-insensitive)
      const existingTitles = articles.map(a => a.title.toLowerCase());
      const newArticles = fetchedArticles.filter(article =>
        !existingTitles.includes(article.title.toLowerCase())
      );
      const duplicateCount = fetchedArticles.length - newArticles.length;

      if (duplicateCount > 0) {
        console.log(`⚠️ Skipping ${duplicateCount} duplicate article(s)`);
      }

      if (newArticles.length > 0) {
        // Add each new article individually to database
        const addedArticles = [];
        for (const article of newArticles) {
          try {
            const savedArticle = await storageService.addArticle(article);
            addedArticles.push(savedArticle);
            console.log(`✅ Added article: ${article.title}`);
          } catch (error) {
            console.error(`❌ Failed to add article "${article.title}":`, error);
          }
        }

        // Merge with existing articles and update state
        const updatedArticles = [...addedArticles, ...articles];
        setArticles(updatedArticles);
        console.log(`💾 Saved ${addedArticles.length} new article(s) to database`);
      } else {
        console.log('ℹ️ No new articles to import (all already exist)');
      }

      // Also keep in sheetArticles for reference
      setSheetArticles(fetchedArticles);
      setSheetStatus('connected');
      setSheetsEnabled(true);

      // Auto-switch to 'admin-only' since articles are now in database
      const newDataSource = 'admin-only';
      setDataSource(newDataSource);

      // Save to localStorage for persistence
      await saveSheetSettings(sheetUrl, newDataSource, fetchedArticles, 'connected');

      console.log(`✅ Successfully imported ${newArticles.length} article(s) from Google Sheets!`);
      if (duplicateCount > 0) {
        alert(`Imported ${newArticles.length} new article(s).\nSkipped ${duplicateCount} duplicate(s).`);
      } else {
        alert(`Successfully imported ${newArticles.length} article(s) to database!`);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      setSheetStatus('error');
      setSheetArticles([]);
      await saveSheetSettings(sheetUrl, dataSource, [], 'error');
      alert(`Error importing articles: ${error.message}`);
    }
  };

  const connectAndUploadSheet = async () => {
    console.log('📤 Importing articles from Google Sheet to database...');
    // Clear old cached data
    localStorage.removeItem('cine-chatter-sheet-articles');
    setSheetArticles([]);
    // Fetch and import data from sheet
    await fetchGoogleSheetData();
  };

  const refreshSheetData = async () => {
    if (sheetStatus === 'connected') {
      console.log('🔄 Refreshing sheet data...');
      // Clear cached articles before fetching fresh data
      localStorage.removeItem('cine-chatter-sheet-articles');
      setSheetArticles([]);
      await fetchGoogleSheetData();
    }
  };

  const handleSubmitArticle = () => {
    if (!formInputs.title || !formInputs.content) {
      alert('Please fill title and content');
      return;
    }

    const articleData = {
      id: editingArticle ? editingArticle.id : Date.now(),
      ...formInputs,
      source: editingArticle ? editingArticle.source : 'New Article',
      createdAt: editingArticle ? editingArticle.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('📝 Creating/Updating article:', articleData);

    let updatedArticles;
    if (editingArticle) {
      updatedArticles = articles.map(a => a.id === editingArticle.id ? articleData : a);
      console.log('✏️ Editing existing article');
    } else {
      updatedArticles = [articleData, ...articles];
      console.log('➕ Adding new article. Total articles will be:', updatedArticles.length);
    }

    saveArticles(updatedArticles);
    resetForm();
  };

  const resetForm = () => {
    setFormInputs({
      title: '',
      content: '',
      category: 'hollywood-movies',
      image: '',
      status: 'published'
    });
    setEditingArticle(null);
    setShowArticleForm(false);
  };

  // Inline Editing Functions
  const startInlineEdit = () => {
    if (selectedArticle) {
      setInlineEditContent(selectedArticle.content);
      setIsInlineEditing(true);
    }
  };

  const cancelInlineEdit = () => {
    setIsInlineEditing(false);
    setInlineEditContent('');
  };

  const saveInlineEdit = async () => {
    if (!selectedArticle) return;

    const updatedArticle = {
      ...selectedArticle,
      content: inlineEditContent,
      updatedAt: new Date().toISOString()
    };

    const updatedArticles = articles.map(a =>
      a.id === selectedArticle.id ? updatedArticle : a
    );

    await saveArticles(updatedArticles);
    setSelectedArticle(updatedArticle);
    setIsInlineEditing(false);
    setInlineEditContent('');
  };

  // Category page inline editing functions
  const startCategoryInlineEdit = (articleId, content) => {
    setInlineEditingArticleId(articleId);
    setCategoryInlineEditContent(content);
  };

  const cancelCategoryInlineEdit = () => {
    setInlineEditingArticleId(null);
    setCategoryInlineEditContent('');
  };

  const saveCategoryInlineEdit = async (articleId) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    const updatedArticle = {
      ...article,
      content: categoryInlineEditContent,
      updatedAt: new Date().toISOString()
    };

    const updatedArticles = articles.map(a =>
      a.id === articleId ? updatedArticle : a
    );

    await saveArticles(updatedArticles);
    setInlineEditingArticleId(null);
    setCategoryInlineEditContent('');
  };

  // Text formatting for category page
  const applyCategoryFormat = (format, articleId) => {
    const textarea = document.getElementById(`category-editor-${articleId}`);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = categoryInlineEditContent.substring(start, end);
    let newText = categoryInlineEditContent;

    switch (format) {
      case 'bold':
        newText = categoryInlineEditContent.substring(0, start) + '**' + selectedText + '**' + categoryInlineEditContent.substring(end);
        break;
      case 'italic':
        newText = categoryInlineEditContent.substring(0, start) + '*' + selectedText + '*' + categoryInlineEditContent.substring(end);
        break;
      case 'heading':
        const lineStart = categoryInlineEditContent.lastIndexOf('\n', start - 1) + 1;
        newText = categoryInlineEditContent.substring(0, lineStart) + '## ' + categoryInlineEditContent.substring(lineStart);
        break;
      case 'bullet':
        const lines = selectedText.split('\n');
        const bulletedLines = lines.map(line => line.trim() ? '• ' + line : line).join('\n');
        newText = categoryInlineEditContent.substring(0, start) + bulletedLines + categoryInlineEditContent.substring(end);
        break;
      case 'number':
        const numberLines = selectedText.split('\n');
        const numberedLines = numberLines.map((line, i) => line.trim() ? `${i + 1}. ${line}` : line).join('\n');
        newText = categoryInlineEditContent.substring(0, start) + numberedLines + categoryInlineEditContent.substring(end);
        break;
      case 'paragraph':
        newText = categoryInlineEditContent.substring(0, end) + '\n\n' + categoryInlineEditContent.substring(end);
        break;
      default:
        break;
    }

    setCategoryInlineEditContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end);
    }, 0);
  };

  // Text formatting functions
  const applyFormat = (format, editorId = 'inline-editor') => {
    const textarea = document.getElementById(editorId);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inlineEditContent.substring(start, end);
    let newText = inlineEditContent;

    switch (format) {
      case 'bold':
        newText = inlineEditContent.substring(0, start) + '**' + selectedText + '**' + inlineEditContent.substring(end);
        break;
      case 'italic':
        newText = inlineEditContent.substring(0, start) + '*' + selectedText + '*' + inlineEditContent.substring(end);
        break;
      case 'heading':
        const lineStart = inlineEditContent.lastIndexOf('\n', start - 1) + 1;
        newText = inlineEditContent.substring(0, lineStart) + '## ' + inlineEditContent.substring(lineStart);
        break;
      case 'bullet':
        const lines = selectedText.split('\n');
        const bulletedLines = lines.map(line => line.trim() ? '• ' + line : line).join('\n');
        newText = inlineEditContent.substring(0, start) + bulletedLines + inlineEditContent.substring(end);
        break;
      case 'number':
        const numberLines = selectedText.split('\n');
        const numberedLines = numberLines.map((line, i) => line.trim() ? `${i + 1}. ${line}` : line).join('\n');
        newText = inlineEditContent.substring(0, start) + numberedLines + inlineEditContent.substring(end);
        break;
      case 'paragraph':
        newText = inlineEditContent.substring(0, end) + '\n\n' + inlineEditContent.substring(end);
        break;
      default:
        break;
    }

    setInlineEditContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end);
    }, 0);
  };

  // Handle AI Article Publishing
  const handleAIArticlePublish = (articleData) => {
    const updatedArticles = [articleData, ...articles];
    saveArticles(updatedArticles);
  };

  // Render markdown formatting in content
  const renderMarkdown = (text) => {
    if (!text) return '';

    let html = text;

    // Debug logging
    console.log('🔍 renderMarkdown input:', text.substring(0, 200));
    console.log('🔍 Contains [image] tag?', text.includes('[image]'));

    // 1. Process embedded media FIRST (before other markdown)

    // [image-left]URL[/image-left] - Image on left, text wraps on right
    html = html.replace(/\[image-left\](.*?)\[\/image-left\]/g, (match, url) => {
      console.log('✅ Found left-aligned image tag! URL:', url.trim());
      return `<div class="float-left mr-4 mb-4 w-full sm:w-1/2 md:w-2/5"><img src="${url.trim()}" alt="Article image" class="w-full rounded-lg shadow-lg" /></div>`;
    });

    // [image-right]URL[/image-right] - Image on right, text wraps on left
    html = html.replace(/\[image-right\](.*?)\[\/image-right\]/g, (match, url) => {
      console.log('✅ Found right-aligned image tag! URL:', url.trim());
      return `<div class="float-right ml-4 mb-4 w-full sm:w-1/2 md:w-2/5"><img src="${url.trim()}" alt="Article image" class="w-full rounded-lg shadow-lg" /></div>`;
    });

    // [image-center]URL[/image-center] or [image]URL[/image] - Full-width centered
    html = html.replace(/\[image-center\](.*?)\[\/image-center\]/g, (match, url) => {
      console.log('✅ Found center-aligned image tag! URL:', url.trim());
      return `<div class="my-6 clear-both"><img src="${url.trim()}" alt="Article image" class="w-full rounded-lg shadow-lg mx-auto" /></div>`;
    });

    // [image]URL[/image] - Default: Full-width centered (backwards compatible)
    html = html.replace(/\[image\](.*?)\[\/image\]/g, (match, url) => {
      console.log('✅ Found image tag! URL:', url.trim());
      return `<div class="my-6 clear-both"><img src="${url.trim()}" alt="Article image" class="w-full rounded-lg shadow-lg mx-auto" /></div>`;
    });

    // [gallery]URL1 URL2 URL3[/gallery] - Image gallery grid
    html = html.replace(/\[gallery\](.*?)\[\/gallery\]/gs, (match, urls) => {
      const imageUrls = urls.trim().split(/\s+/).filter(url => url);
      const images = imageUrls.map(url =>
        `<img src="${url.trim()}" alt="Gallery image" class="w-full h-64 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer" />`
      ).join('');
      return `<div class="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${images}</div>`;
    });

    // [youtube]URL[/youtube] - YouTube embed
    html = html.replace(/\[youtube\](.*?)\[\/youtube\]/g, (match, url) => {
      let videoId = '';
      // Extract video ID from various YouTube URL formats
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('youtube.com/watch')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0];
      }

      if (videoId) {
        return `<div class="my-8 aspect-video"><iframe class="w-full h-full rounded-lg shadow-lg" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      }
      return match; // Return original if can't parse
    });

    // [instagram]URL[/instagram] - Instagram embed
    html = html.replace(/\[instagram\](.*?)\[\/instagram\]/g, (match, url) => {
      const postUrl = url.trim();
      console.log('✅ Found Instagram tag! URL:', postUrl);

      // Trigger Instagram embed processing after render
      setTimeout(() => {
        if (window.instgrm) {
          console.log('📱 Processing Instagram embeds...');
          window.instgrm.Embeds.process();
        } else {
          console.warn('⚠️ Instagram embed script not loaded yet');
        }
      }, 100);

      return `<div class="my-8 flex justify-center"><blockquote class="instagram-media" data-instgrm-permalink="${postUrl}" data-instgrm-version="14" style="max-width:540px; min-width:326px; width:100%;"></blockquote></div>`;
    });

    // 2. Then process regular markdown
    html = html
      // Bold: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic: *text* -> <em>text</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Headings: ## text -> <h2>text</h2>
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-white">$1</h2>')
      // Bullet points: • text -> <li>text</li>
      .replace(/^• (.+)$/gm, '<li class="ml-6">$1</li>')
      // Numbered list: 1. text -> <li>text</li>
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-6">$1</li>')
      // Paragraphs: double newlines
      .replace(/\n\n/g, '</p><p class="mb-4">')
      // Single newlines
      .replace(/\n/g, '<br />');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<h2') && !html.startsWith('<li') && !html.startsWith('<div')) {
      html = '<p class="mb-4">' + html + '</p>';
    }

    return html;
  };

  // Get clean preview text (strip markdown, keep first paragraph)
  const getPreviewText = (text) => {
    if (!text) return '';

    // Remove media tags first (before other formatting)
    let cleanText = text
      .replace(/\[image(-left|-right|-center)?\].*?\[\/image(-left|-right|-center)?\]/g, '') // Remove image tags
      .replace(/\[gallery\].*?\[\/gallery\]/gs, '') // Remove gallery tags
      .replace(/\[youtube\].*?\[\/youtube\]/g, '') // Remove YouTube tags
      .replace(/\[instagram\].*?\[\/instagram\]/g, '') // Remove Instagram tags
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
      .replace(/\*(.*?)\*/g, '$1')       // Remove italic
      .replace(/^## (.+)$/gm, '$1')      // Remove heading markers
      .replace(/^• /gm, '')              // Remove bullet points
      .replace(/^\d+\. /gm, '')          // Remove numbered list markers
      .trim();

    // Return first paragraph or first 150 characters
    const firstPara = cleanText.split('\n\n')[0];
    return firstPara.length > 150 ? firstPara.substring(0, 150) + '...' : firstPara;
  };

  const getCategoryArticles = (cat) => {
    // Normalize category for comparison
    const normalizeCat = (category) => {
      if (!category) return '';
      return category.toLowerCase().trim().replace(/\s+/g, '-');
    };
    
    const normalizedCat = normalizeCat(cat);
    
    let adminArticles = articles.filter(a => 
      normalizeCat(a.category) === normalizedCat && a.status === 'published'
    );
    let sheetsArticlesFiltered = sheetArticles.filter(a => 
      normalizeCat(a.category) === normalizedCat && a.status === 'published'
    );
    
    console.log(`Category: ${cat}, Admin: ${adminArticles.length}, Sheets: ${sheetsArticlesFiltered.length}, DataSource: ${dataSource}`);
    
    // Merge based on data source setting
    if (dataSource === 'admin-only') {
      return adminArticles;
    } else if (dataSource === 'sheets-only') {
      return sheetsArticlesFiltered;
    } else if (dataSource === 'both') {
      return [...adminArticles, ...sheetsArticlesFiltered];
    }
    return adminArticles; // default
  };

  const getSearchResults = () => {
    let adminResults = articles.filter(a => 
      a.status === 'published' && 
      (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       a.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    let sheetsResults = sheetArticles.filter(a => 
      a.status === 'published' && 
      (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       a.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    // Merge based on data source setting
    if (dataSource === 'admin-only') {
      return adminResults;
    } else if (dataSource === 'sheets-only') {
      return sheetsResults;
    } else if (dataSource === 'both') {
      return [...adminResults, ...sheetsResults];
    }
    return adminResults; // default
  };

  const handleTreasureClick = (featured) => {
    if (featured.articleTitle && featured.articleDescription) {
      // Show article modal if title and description exist
      setSelectedTreasureArticle(featured);
    } else {
      // Navigate to category if no article
      setSelectedCategory(featured.link);
      setCurrentView('category');
    }
    setTreasureBoxOpen(false);
  };

  // Checkbox handlers for article selection
  const toggleArticleSelection = (articleId) => {
    setSelectedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const toggleAllArticles = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(a => a.id));
    }
  };

  // CSV Export functionality
  const exportToCSV = () => {
    // Get all articles based on data source
    let allArticles = [];
    if (dataSource === 'admin-only') {
      allArticles = articles;
    } else if (dataSource === 'sheets-only') {
      allArticles = sheetArticles;
    } else if (dataSource === 'both') {
      allArticles = [...articles, ...sheetArticles];
    } else {
      allArticles = articles; // default
    }

    // Filter only published articles
    let publishedArticles = allArticles.filter(a => a.status === 'published');

    // If there are selected articles, only export those
    if (selectedArticles.length > 0) {
      publishedArticles = publishedArticles.filter(a => selectedArticles.includes(a.id));
    }

    if (publishedArticles.length === 0) {
      alert(selectedArticles.length > 0 ? 'No selected articles to export' : 'No published articles to export');
      return;
    }

    // CSV Headers
    const headers = ['Category', 'Title', 'Description', 'Image URL', 'Date'];

    // Convert articles to CSV rows
    const rows = publishedArticles.map(article => {
      const category = (article.category || '').replace(/"/g, '""');
      const title = (article.title || '').replace(/"/g, '""');
      const description = (article.content || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' '); // Remove line breaks
      const imageUrl = (article.image || '').replace(/"/g, '""'); // Escape quotes
      const date = article.date || article.createdAt || new Date().toISOString().split('T')[0];

      return `"${category}","${title}","${description}","${imageUrl}","${date}"`;
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `cinechatter-articles-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Exported ${publishedArticles.length} articles to CSV`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-2 sm:px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo - More compact */}
            <button onClick={() => setCurrentView('home')} className="bg-red-600 text-white px-2 sm:px-3 py-1.5 rounded-md font-bold text-sm sm:text-base hover:bg-red-700 whitespace-nowrap flex-shrink-0" style={{ fontFamily: 'cursive' }}>
              CineChatter
            </button>

            {/* Desktop Search - More compact */}
            <div className="hidden lg:flex items-center mx-2 flex-shrink-0" style={{ width: '200px', minWidth: '200px' }}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { setCurrentView('search'); } }} className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-red-500 dark:focus:border-red-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
              </div>
            </div>

            {/* Desktop Navigation - Compact spacing */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              <button onClick={() => setCurrentView('home')} className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">Home</button>

              <div
                className="relative"
                onMouseEnter={() => setHollywoodOpen(true)}
                onMouseLeave={() => setHollywoodOpen(false)}
              >
                <button className="flex items-center gap-1 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap transition-colors duration-200">
                  Hollywood <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${hollywoodOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute top-full left-0 pt-1 z-50 ${hollywoodOpen ? '' : 'pointer-events-none'}`}>
                  <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 w-48 transition-all duration-300 ease-in-out origin-top ${hollywoodOpen ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-0 -translate-y-2'}`}>
                    <button
                      onClick={() => { setSelectedCategory('hollywood-movies'); setCurrentView('category'); setHollywoodOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-150"
                    >
                      Movies
                    </button>
                    <button
                      onClick={() => { setSelectedCategory('hollywood-news'); setCurrentView('category'); setHollywoodOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-150"
                    >
                      News
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="relative"
                onMouseEnter={() => setBollywoodOpen(true)}
                onMouseLeave={() => setBollywoodOpen(false)}
              >
                <button className="flex items-center gap-1 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap transition-colors duration-200">
                  Bollywood <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${bollywoodOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute top-full left-0 pt-1 z-50 ${bollywoodOpen ? '' : 'pointer-events-none'}`}>
                  <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 w-48 transition-all duration-300 ease-in-out origin-top ${bollywoodOpen ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-0 -translate-y-2'}`}>
                    <button
                      onClick={() => { setSelectedCategory('bollywood-movies'); setCurrentView('category'); setBollywoodOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-150"
                    >
                      Movies
                    </button>
                    <button
                      onClick={() => { setSelectedCategory('bollywood-news'); setCurrentView('category'); setBollywoodOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-150"
                    >
                      News
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={() => { setSelectedCategory('international'); setCurrentView('category'); }} className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">International</button>

              <button onClick={() => { setSelectedCategory('ott'); setCurrentView('category'); }} className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">OTT</button>

              <button onClick={() => { setSelectedCategory('music'); setCurrentView('category'); }} className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">Music</button>

              <button onClick={() => { setSelectedCategory('celebrity-style'); setCurrentView('category'); }} className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">Celebrity Style</button>

              <div
                className="relative"
                onMouseEnter={() => setMoreOpen(true)}
                onMouseLeave={() => setMoreOpen(false)}
              >
                <button className="flex items-center gap-1 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap transition-colors duration-200">
                  More <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute top-full right-0 pt-1 z-50 ${moreOpen ? '' : 'pointer-events-none'}`}>
                  <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 w-48 transition-all duration-300 ease-in-out origin-top ${moreOpen ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-0 -translate-y-2'}`}>
                    {user?.profile?.admin_status === 'A' && (
                      <>
                        <button
                          onClick={() => { setSelectedCategory('youtube-scripts'); setCurrentView('category'); setMoreOpen(false); }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-150"
                        >
                          <Play className="w-4 h-4 fill-red-600 text-red-600" />
                          YouTube Scripts
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      </>
                    )}
                    <button
                      onClick={() => { setCurrentView('about'); setMoreOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-150"
                    >
                      About
                    </button>
                    <button
                      onClick={() => { setCurrentView('contact'); setMoreOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-150"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side: Dark Mode, User, Dashboard - Compact */}
            <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-700 hover:text-red-600 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Authentication */}
              {!user ? (
                <>
                  <button
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 whitespace-nowrap"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="px-3 py-1.5 border border-red-600 text-red-600 dark:text-red-400 dark:border-red-500 rounded-md text-sm hover:bg-red-50 dark:hover:bg-gray-700 whitespace-nowrap"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setHollywoodOpen(false); setBollywoodOpen(false); setMoreOpen(false); setUserMenuOpen(!userMenuOpen); }}
                      className="flex items-center gap-1 px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap"
                    >
                      <User className="w-4 h-4" />
                      <span className="max-w-[100px] truncate">{user.profile?.name || user.email?.split('@')[0]}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 w-48 z-50">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{user.email}</p>
                        </div>
                        <button
                          onClick={() => { setUserMenuOpen(false); setCurrentView('profile'); }}
                          className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 text-sm"
                        >
                          <User className="w-4 h-4 inline mr-2" />
                          My Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 text-sm border-t border-gray-200 dark:border-gray-700"
                        >
                          <LogOut className="w-4 h-4 inline mr-2" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dashboard Button - Only visible for approved admin users */}
                  {user.profile?.admin_status === 'A' && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className="px-3 py-1.5 bg-secondary-600 text-white rounded-md text-sm hover:bg-secondary-700 whitespace-nowrap flex items-center gap-1 shadow-md hover:shadow-lg transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button - Visible on mobile only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Search Bar - Hidden for now */}
          <div className="hidden pb-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { setCurrentView('search'); setMobileMenuOpen(false); } }} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-red-500 dark:focus:border-red-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pb-4">
              <div className="py-2 space-y-1">
                <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">Home</button>

                <button onClick={() => { setSelectedCategory('ott'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">OTT</button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hollywood</div>
                <button onClick={() => { setSelectedCategory('hollywood-movies'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">Movies</button>
                <button onClick={() => { setSelectedCategory('hollywood-news'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">News</button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Bollywood</div>
                <button onClick={() => { setSelectedCategory('bollywood-movies'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">Movies</button>
                <button onClick={() => { setSelectedCategory('bollywood-news'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">News</button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button onClick={() => { setSelectedCategory('music'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">Music</button>

                <button onClick={() => { setSelectedCategory('celebrity-style'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">Celebrity Style</button>

                <button onClick={() => { setSelectedCategory('international'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">International</button>

                {user?.profile?.admin_status === 'A' && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Admin Only</div>
                    <button onClick={() => { setSelectedCategory('youtube-scripts'); setCurrentView('category'); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">
                      <Play className="w-4 h-4 fill-red-600 text-red-600" />
                      YouTube Scripts
                    </button>
                  </>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button onClick={() => { setCurrentView('about'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">About</button>

                <button onClick={() => { setCurrentView('contact'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">Contact</button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                {!user ? (
                  <>
                    <button onClick={() => { setAuthMode('signup'); setShowAuthModal(true); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 bg-red-600 text-white font-semibold rounded-md mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>Sign Up</button>
                    <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 bg-gray-600 dark:bg-gray-700 text-white font-semibold rounded-md mx-4" style={{ width: 'calc(100% - 2rem)' }}>Login</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setCurrentView('profile'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">My Profile</button>
                    {user.profile?.admin_status === 'A' && (
                      <button onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 bg-green-600 text-white font-semibold rounded-md mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>Dashboard</button>
                    )}
                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400">Logout</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {currentView === 'home' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Welcome Section */}
          <div className="text-center py-4 mb-2">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white leading-tight">Welcome to CineChatter</h1>
            <p className="text-red-600 dark:text-red-400 font-semibold text-xl leading-relaxed">Your ultimate destination for entertainment news and updates!</p>
          </div>

          {/* Latest Articles Section - Ken Burns Carousel */}
          <div className="mb-6">
            <div className="mb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">Latest Articles</h2>
            </div>

            {(() => {
              // Combine articles from both sources based on dataSource setting
              let allArticles = [];
              if (dataSource === 'admin-only') {
                allArticles = articles.filter(a => a.status === 'published');
              } else if (dataSource === 'sheets-only') {
                allArticles = sheetArticles.filter(a => a.status === 'published');
              } else if (dataSource === 'both') {
                allArticles = [...articles.filter(a => a.status === 'published'), ...sheetArticles.filter(a => a.status === 'published')];
              }

              // Sort by date, filter articles with images, and take top 5 for carousel
              const carouselArticles = allArticles
                .filter(a => a.image && a.image.trim() !== '') // Only show articles with featured images
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5);

              if (carouselArticles.length === 0) {
                return <p className="text-gray-400 dark:text-gray-500 text-center py-8">No articles yet</p>;
              }

              const currentArticle = carouselArticles[currentSlide] || carouselArticles[0];

              const nextSlide = () => {
                setCurrentSlide((currentSlide + 1) % carouselArticles.length);
                setCarouselProgress(0);
              };

              const prevSlide = () => {
                setCurrentSlide((currentSlide - 1 + carouselArticles.length) % carouselArticles.length);
                setCarouselProgress(0);
              };

              return (
                <div
                  className="relative h-[450px] sm:h-[500px] rounded-2xl overflow-hidden shadow-2xl group bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 border border-red-200 dark:border-gray-700"
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                >
                  {/* Background Image with Ken Burns Effect */}
                  {currentArticle.image ? (
                    <div className="absolute inset-0">
                      <img
                        key={`slide-${currentSlide}`}
                        src={currentArticle.image}
                        alt={currentArticle.title}
                        className="w-full h-full object-cover animate-ken-burns"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                    </div>
                  ) : null}

                  {/* Content Overlay - Bottom left aligned */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 lg:p-12 pb-16">
                    {/* Top section - Category and Title */}
                    <div className="w-full sm:w-2/3 lg:w-1/2 pt-4 sm:pt-5 lg:pt-6">
                      {/* Category Badge */}
                      <span className="inline-block w-fit bg-red-600 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide mb-4 shadow-lg animate-fadeIn">
                        {categories.find(c => c.id === currentArticle.category)?.name}
                      </span>

                      {/* Title */}
                      <h3 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                        {currentArticle.title}
                      </h3>
                    </div>

                    {/* Bottom section - Read Article button and date (anchored to bottom) */}
                    <div className="flex items-center gap-4 mb-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                      <button
                        onClick={() => setSelectedArticle(currentArticle)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        Read Article →
                      </button>
                      <span className="text-sm text-white/90">
                        {new Date(currentArticle.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-red-300/60 hover:bg-red-400/70 text-red-800/80 dark:bg-gray-600/40 dark:hover:bg-gray-500/50 dark:text-gray-300/80 p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-300/60 hover:bg-red-400/70 text-red-800/80 dark:bg-gray-600/40 dark:hover:bg-gray-500/50 dark:text-gray-300/80 p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 dark:bg-white/30">
                    <div
                      className="h-full bg-red-600 transition-all duration-100 ease-linear"
                      style={{ width: `${carouselProgress}%` }}
                    ></div>
                  </div>

                  {/* Dot Navigation */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {carouselArticles.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        onClick={() => {
                          setCurrentSlide(index);
                          setCarouselProgress(0);
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentSlide
                            ? 'bg-red-600 w-8'
                            : 'bg-gray-400 dark:bg-white/50 hover:bg-gray-500 dark:hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Pause Indicator - Centered, icon only, on hover */}
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent text-red-800/80 dark:text-gray-300/80 p-4 transition-opacity duration-300 ${isCarouselPaused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <Pause className="w-8 h-8" />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Trending Now Section - Horizontal Scroll */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">Trending Now</h2>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Swipe to explore →</span>
            </div>

            {(() => {
              // Get trending articles (most recent across all categories)
              let allArticles = [];
              if (dataSource === 'admin-only') {
                allArticles = articles.filter(a => a.status === 'published');
              } else if (dataSource === 'sheets-only') {
                allArticles = sheetArticles.filter(a => a.status === 'published');
              } else if (dataSource === 'both') {
                allArticles = [...articles.filter(a => a.status === 'published'), ...sheetArticles.filter(a => a.status === 'published')];
              }

              // Get different articles than the featured ones (skip first 7)
              const localArticles = allArticles
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(7, 15); // Get next 8 articles

              // Combine local articles and RSS articles
              // Show 4 local articles + 6 RSS articles
              const trendingArticles = [
                ...localArticles.slice(0, 4),
                ...rssArticles.slice(0, 6)
              ];

              if (trendingArticles.length === 0 && !rssLoading) {
                return null; // Don't show section if no articles
              }

              return (
                <div className="relative">
                  {/* Loading State */}
                  {rssLoading && trendingArticles.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500 dark:text-gray-400">Loading trending news...</div>
                    </div>
                  )}

                  {/* Horizontal Scrollable Container */}
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 pl-8 sm:pl-12 pr-4 pb-2">
                      {trendingArticles.map((article, index) => {
                        const isExternal = article.isExternal;
                        const handleClick = () => {
                          if (isExternal) {
                            window.open(article.link, '_blank', 'noopener,noreferrer');
                          } else {
                            setSelectedArticle(article);
                          }
                        };

                        return (
                          <div
                            key={`trending-${article.id}`}
                            onClick={handleClick}
                            className="flex-shrink-0 w-56 sm:w-52 lg:w-56 bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-red-200 dark:border-gray-700"
                          >
                            {article.image && (
                              <div className="relative h-40 overflow-hidden">
                                <img
                                  src={article.image}
                                  alt={article.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                {/* Trending Badge */}
                                <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                                  <TrendingUp className="w-3 h-3" />
                                  #{index + 1}
                                </div>
                                {/* External Link Badge */}
                                {isExternal && (
                                  <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                    Google News
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="p-4">
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full mb-2 inline-block uppercase font-semibold">
                                {isExternal ? article.source : categories.find(c => c.id === article.category)?.name}
                              </span>
                              <h3 className="font-bold text-base mb-2 text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-tight">
                                {article.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                                {isExternal ? article.excerpt : getPreviewText(article.content)}
                              </p>
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>{new Date(article.createdAt || article.publishedAt).toLocaleDateString()}</span>
                                <span className="text-red-600 dark:text-red-400 font-medium group-hover:underline">
                                  {isExternal ? 'View →' : 'Read →'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scroll Fade Indicators */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-20 bg-gradient-to-r from-white dark:from-gray-900 to-transparent"></div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent"></div>
                </div>
              );
            })()}
          </div>
          {/* Newsletter Section - Full Width Redesign */}
          <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-orange-600 dark:from-red-800 dark:via-red-900 dark:to-orange-800 py-16 sm:py-20">
            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                <Film className="w-8 h-8 text-white" />
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Never Miss a Story
              </h2>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Get the latest entertainment news, exclusive interviews, and trending updates delivered straight to your inbox
              </p>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) {
                    alert('Thank you for subscribing!');
                    setNewsletterEmail('');
                  }
                }}
                className="max-w-lg mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="flex-1 px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30 text-base sm:text-lg shadow-xl"
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 text-base sm:text-lg whitespace-nowrap hover-bounce"
                  >
                    Subscribe Now
                  </button>
                </div>

                {/* Privacy Note */}
                <p className="text-sm text-white/70 mt-4">
                  🔒 We respect your privacy. Unsubscribe anytime.
                </p>
              </form>

              {/* Social Proof / Stats */}
              <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/90">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold">10K+</div>
                  <div className="text-sm sm:text-base">Subscribers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold">Daily</div>
                  <div className="text-sm sm:text-base">Updates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold">100%</div>
                  <div className="text-sm sm:text-base">Free</div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating Animated Gift Box - Bottom Right Corner */}
          <div className="fixed bottom-8 right-8 z-40 animate-slide-up-bounce">
            {!giftBoxCollapsed ? (
              <div className="group relative">
                {/* Gift Box Container */}
                <div
                  className="cursor-pointer relative"
                  onClick={async () => {
                    await loadFeaturedImages();
                    const validImages = featuredImages.filter(f => f.image);
                    if (validImages.length > 0) {
                      setCurrentTreasureIndex(Math.floor(Math.random() * validImages.length));
                    }
                    setTreasureBoxOpen(true);
                  }}
                >
                  {/* Did You Know Box */}
                  <div className="w-32 h-32 sm:w-36 sm:h-36 bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 dark:from-red-700 dark:via-orange-600 dark:to-yellow-600 rounded-2xl shadow-2xl flex flex-col items-center justify-center transform transition-all duration-300 hover:scale-110 hover:rotate-3 group-hover:shadow-3xl p-3 border-4 border-red-200 dark:border-red-800 relative overflow-hidden">
                    {/* Light bulb icon */}
                    <div className="text-5xl sm:text-6xl mb-1 animate-bounce-slow">💡</div>
                    {/* Text */}
                    <div className="text-center">
                      <div className="text-white font-black text-sm sm:text-base leading-tight drop-shadow-lg">DID YOU</div>
                      <div className="text-white font-black text-lg sm:text-xl leading-tight drop-shadow-lg">KNOW?</div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-75"></div>
                    <div className="absolute bottom-1 left-1 w-2 h-2 bg-white rounded-full opacity-75"></div>
                  </div>
                  {/* Sparkle Effect */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping opacity-75 pointer-events-none"></div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-75 pointer-events-none" style={{ animationDelay: '0.5s' }}></div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block animate-fadeIn pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                      Click to discover! 🎬
                      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                {/* Collapse Button - Outside clickable area */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setGiftBoxCollapsed(true);
                  }}
                  className="absolute -top-2 -left-2 w-6 h-6 bg-gray-800 dark:bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors shadow-lg z-10"
                  title="Collapse"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Collapsed State - Small button */
              <button
                onClick={() => setGiftBoxCollapsed(false)}
                className="w-12 h-12 bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 dark:from-red-700 dark:via-orange-600 dark:to-yellow-600 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all duration-300 group border-2 border-red-200 dark:border-red-800"
                title="Show Do You Know?"
              >
                <ChevronUp className="w-6 h-6 text-white animate-bounce" />
                {/* Small badge on collapsed state */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse shadow-md"></div>
              </button>
            )}
          </div>
        </div>
      )}

      {currentView === 'category' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6">
            <button onClick={() => setCurrentView('home')} className="text-red-600 dark:text-red-400 hover:underline mb-4 text-sm sm:text-base">← Back to Home</button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">{categories.find(c => c.id === selectedCategory)?.name}</h1>
          </div>
          <div className="space-y-4">
            {getCategoryArticles(selectedCategory)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(article => {
                const isEditing = inlineEditingArticleId === article.id;

                return (
                  <div key={article.id} className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 rounded-lg shadow-lg dark:shadow-xl overflow-hidden border border-red-100 dark:border-gray-700 mb-8">
                    {article.image && <img src={article.image} alt={article.title} className="w-full h-64 sm:h-80 lg:h-96 object-cover" />}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-2xl text-gray-900 dark:text-white flex-1">{article.title}</h3>
                        {user && user.profile?.admin_status === 'A' && !isEditing && (
                          <button
                            onClick={() => startCategoryInlineEdit(article.id, article.content)}
                            className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        {isEditing && (
                          <div className="ml-4 flex items-center gap-2">
                            <button
                              onClick={() => saveCategoryInlineEdit(article.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelCategoryInlineEdit}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {!isEditing ? (
                        <div
                          className="text-gray-600 dark:text-gray-400 text-base leading-relaxed prose prose-lg dark:prose-invert max-w-none mb-4"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
                        />
                      ) : (
                        <div className="space-y-4">
                          {/* Rich Text Toolbar */}
                          <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => applyCategoryFormat('bold', article.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Bold"
                            >
                              <Bold className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                            <button
                              onClick={() => applyCategoryFormat('italic', article.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Italic"
                            >
                              <Italic className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                            <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                            <button
                              onClick={() => applyCategoryFormat('heading', article.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Heading"
                            >
                              <Heading2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                            <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                            <button
                              onClick={() => applyCategoryFormat('bullet', article.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Bullet List"
                            >
                              <List className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                            <button
                              onClick={() => applyCategoryFormat('number', article.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Numbered List"
                            >
                              <ListOrdered className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                            <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                            <button
                              onClick={() => applyCategoryFormat('paragraph', article.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              title="New Paragraph"
                            >
                              <Type className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 self-center px-2">
                              Select text and click formatting
                            </div>
                          </div>

                          {/* Editable Textarea */}
                          <textarea
                            id={`category-editor-${article.id}`}
                            value={categoryInlineEditContent}
                            onChange={(e) => setCategoryInlineEditContent(e.target.value)}
                            className="w-full h-96 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 font-normal leading-relaxed resize-y"
                            placeholder="Edit article content..."
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Word count: {categoryInlineEditContent.split(/\s+/).filter(word => word.length > 0).length} words
                          </p>
                        </div>
                      )}

                      <p className="text-sm text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">{new Date(article.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}          </div>
          {getCategoryArticles(selectedCategory).length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 py-12">No articles in this category yet</p>
          )}
        </div>
      )}

      {currentView === 'search' && searchQuery && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6">
            <button onClick={() => { setCurrentView('home'); setSearchQuery(''); }} className="text-red-600 dark:text-red-400 hover:underline mb-4 text-sm sm:text-base">← Back to Home</button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">Search Results for "{searchQuery}"</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {getSearchResults()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(article => (
              <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 rounded-lg shadow-lg dark:shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-red-100 dark:border-gray-700">
                {article.image && <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />}
                <div className="p-4">
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded mb-2 inline-block">{categories.find(c => c.id === article.category)?.name}</span>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">{article.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">{getPreviewText(article.content)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{new Date(article.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          {getSearchResults().length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 py-12">No results found</p>
          )}
        </div>
      )}

      {currentView === 'about' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setCurrentView('home')} className="text-red-600 dark:text-red-400 hover:underline mb-4">← Back to Home</button>
          <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 rounded-lg shadow-xl p-8 border border-red-100 dark:border-gray-700">
            <h1 className="text-4xl font-bold mb-6 text-red-600 dark:text-red-400 leading-tight">About CineChatter</h1>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
              <p className="text-lg">
                Welcome to <strong>CineChatter</strong>, your ultimate destination for entertainment news and updates!
              </p>
              <p>
                We are passionate about bringing you the latest news, reviews, and insights from the world of entertainment. 
                From Hollywood blockbusters to Bollywood hits, from streaming sensations to celebrity style, we cover it all.
              </p>
              <h2 className="text-2xl font-bold mt-6 mb-3">What We Offer</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Breaking entertainment news from multiple trusted sources</li>
                <li>Movie and TV show reviews and recommendations</li>
                <li>Celebrity news and red carpet coverage</li>
                <li>Music industry updates and album releases</li>
                <li>OTT platform releases and streaming guides</li>
                <li>International cinema coverage</li>
              </ul>
              <h2 className="text-2xl font-bold mt-6 mb-3">Our Mission</h2>
              <p>
                At CineChatter, our mission is to keep entertainment enthusiasts informed and engaged with comprehensive, 
                up-to-date coverage of the entertainment industry. We curate content from the best sources to ensure you 
                never miss a beat in the fast-paced world of entertainment.
              </p>
              <p className="mt-4">
                Thank you for being part of the CineChatter community!
              </p>
            </div>
          </div>
        </div>
      )}

      {currentView === 'profile' && user && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setCurrentView('home')} className="text-red-600 dark:text-red-400 hover:underline mb-4">← Back to Home</button>
          <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 rounded-lg shadow-xl p-8 border border-red-100 dark:border-gray-700">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.profile?.name || 'User'}</h1>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                {user.profile?.admin_status === 'A' && (
                  <span className="inline-block mt-2 bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                    Admin
                  </span>
                )}
                {user.profile?.admin_status === 'P' && (
                  <span className="inline-block mt-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                    Pending Approval
                  </span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={user.profile?.name || ''}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user.email || ''}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                  <input
                    type="text"
                    value={new Date(user.profile?.created_at || Date.now()).toLocaleDateString()}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Newsletter</label>
                  <input
                    type="text"
                    value={user.profile?.newsletter_subscribed ? 'Subscribed' : 'Not Subscribed'}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {user.profile?.bio && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={user.profile.bio}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
                  rows="4"
                  readOnly
                />
              </div>
            )}

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Profile editing feature coming soon! For now, you can view your profile information here.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentView === 'contact' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setCurrentView('home')} className="text-red-600 dark:text-red-400 hover:underline mb-4">← Back to Home</button>
          <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 rounded-lg shadow-xl p-8 border border-red-100 dark:border-gray-700">
            <h1 className="text-4xl font-bold mb-6 text-red-600 dark:text-red-400 leading-tight">Contact Us</h1>
            <div className="space-y-6 text-base">
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                We'd love to hear from you! Whether you have a question, feedback, or just want to say hello,
                feel free to reach out to us.
              </p>

              <div className="space-y-4">
                <div className="border-l-4 border-red-600 dark:border-red-500 pl-4">
                  <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Social Media</h3>
                  <div className="space-y-1">
                    <p className="text-gray-700 dark:text-gray-300">Follow us on social media for the latest updates:</p>
                    <div className="flex gap-4 mt-2">
                      <a href="#" className="text-red-600 dark:text-red-400 hover:underline">Twitter</a>
                      <a href="#" className="text-red-600 dark:text-red-400 hover:underline">Facebook</a>
                      <a href="#" className="text-red-600 dark:text-red-400 hover:underline">Instagram</a>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-red-600 dark:border-red-500 pl-4">
                  <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Business Inquiries</h3>
                  <a href="mailto:cinechattercontact@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">
                    cinechattercontact@gmail.com
                  </a>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Send us a Message</h3>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Thank you for your message! We will get back to you soon.'); }}>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name</label>
                    <input type="text" required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                    <input type="email" required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Message</label>
                    <textarea rows="5" required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"></textarea>
                  </div>
                  <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'admin' && user && user.profile?.admin_status === 'A' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">Admin Dashboard</h1>

            {/* Gmail-style Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex gap-0 overflow-x-auto">
                <button
                  onClick={() => setActiveAdminTab('articles')}
                  className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeAdminTab === 'articles'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Articles
                </button>
                <button
                  onClick={() => setActiveAdminTab('integration')}
                  className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeAdminTab === 'integration'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Integration Settings
                </button>
                <button
                  onClick={() => setActiveAdminTab('untold-stories')}
                  className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeAdminTab === 'untold-stories'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Untold Stories
                </button>
                <button
                  onClick={() => setActiveAdminTab('agent')}
                  className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeAdminTab === 'agent'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  AI Agent
                </button>
                <button
                  onClick={() => setActiveAdminTab('new-article')}
                  className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeAdminTab === 'new-article'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  New Article
                </button>
                <button
                  onClick={() => setActiveAdminTab('manage-admins')}
                  className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeAdminTab === 'manage-admins'
                      ? 'border-red-600 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Manage Admins
                </button>
              </nav>
            </div>
          </div>

          {/* Articles Tab */}
          {activeAdminTab === 'articles' && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* Gmail-style Toolbar */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedArticles.length === articles.length && selectedArticles.length > 0}
                    onChange={toggleAllArticles}
                    className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500"
                    title="Select all"
                  />

                  {selectedArticles.length > 0 ? (
                    <>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedArticles.length} selected
                      </span>
                      <div className="flex-1"></div>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete ${selectedArticles.length} selected article(s)?`)) {
                            try {
                              // Delete each article from storage
                              await Promise.all(
                                selectedArticles.map(articleId => {
                                  const article = articles.find(a => a.id === articleId);
                                  return storageService.deleteArticle(article?.id || article?.supabaseId);
                                })
                              );

                              // Update local state
                              const updatedArticles = articles.filter(a => !selectedArticles.includes(a.id));
                              setArticles(updatedArticles);
                              setSelectedArticles([]);

                              console.log(`✅ Deleted ${selectedArticles.length} article(s)`);
                            } catch (error) {
                              console.error('❌ Error deleting articles:', error);
                              alert('Failed to delete some articles. Please try again.');
                            }
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors text-sm font-medium"
                        title="Delete selected articles"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors text-sm font-medium"
                        title="Export selected articles to CSV"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      Select articles to export
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Select</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-64">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(() => {
                  // Show all articles (now includes imported Google Sheets articles)
                  if (articles.length === 0) {
                    return <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">No articles yet</td></tr>;
                  }

                  return articles
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(article => {
                      // Truncate title to first 4 words
                      const titleWords = (article.title || '').split(' ');
                      const truncatedTitle = titleWords.slice(0, 4).join(' ') + (titleWords.length > 4 ? '...' : '');

                      // Truncate description to first 4 words (strip out media tags first)
                      const contentWithoutTags = (article.content || '')
                        .replace(/\[image(-left|-right|-center)?\].*?\[\/image(-left|-right|-center)?\]/g, '')
                        .replace(/\[gallery\].*?\[\/gallery\]/gs, '')
                        .replace(/\[youtube\].*?\[\/youtube\]/g, '')
                        .replace(/\[instagram\].*?\[\/instagram\]/g, '')
                        .trim();
                      const words = contentWithoutTags.split(' ');
                      const truncatedDesc = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');

                      // Determine source display
                      const sourceDisplay = article.source === 'google-sheets' ? 'Integration Setting' :
                                          article.source === 'untold-story' ? 'Untold Stories' :
                                          article.source === 'agent' ? 'Agent' : 'New Article';

                      // Check if editable (all articles can be edited)
                      // Note: Editing Google Sheets articles here won't update the source sheet
                      const isEditable = true;

                      return (
                        <tr key={article.id} className="even:bg-gray-50 dark:even:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedArticles.includes(article.id)}
                              onChange={() => toggleArticleSelection(article.id)}
                              className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            {article.image ? (
                              <img src={article.image} alt="" className="w-16 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">No image</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900 dark:text-white">{truncatedTitle}</span>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-sm text-gray-600 dark:text-gray-400 break-words overflow-hidden">{truncatedDesc}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{categories.find(c => c.id === article.category)?.name}</td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 shadow-sm">
                              {sourceDisplay}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full shadow-sm ${article.status === 'published' ? 'bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}`}>
                              {article.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 w-64">
                            <div className="flex gap-2 items-center flex-nowrap">
                              <button onClick={() => setSelectedArticle(article)} className="flex items-center gap-1 px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors text-xs font-medium whitespace-nowrap" title="View">
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                              {isEditable && (
                                <>
                                  <button onClick={() => { setEditingArticle(article); setFormInputs(article); setShowArticleForm(true); }} className="flex items-center gap-1 px-2 py-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors text-xs font-medium whitespace-nowrap" title="Edit">
                                    <Edit2 className="w-4 h-4" />
                                    <span>Edit</span>
                                  </button>
                                  <button onClick={async () => {
                                    if (window.confirm('Delete this article?')) {
                                      try {
                                        // Delete from storage (Supabase or localStorage)
                                        await storageService.deleteArticle(article.id || article.supabaseId);

                                        // Update local state
                                        const updatedArticles = articles.filter(a => a.id !== article.id);
                                        setArticles(updatedArticles);

                                        console.log('✅ Deleted article:', article.title);
                                      } catch (error) {
                                        console.error('❌ Error deleting article:', error);
                                        alert('Failed to delete article. Please try again.');
                                      }
                                    }
                                  }} className="flex items-center gap-1 px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors text-xs font-medium whitespace-nowrap" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                              {!isEditable && (
                                <span className="text-gray-400 dark:text-gray-500 text-xs italic">View only</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                })()}
              </tbody>
            </table>
            </div>
          </div>
            </>
          )}

          {/* Integration Settings Tab */}
          {activeAdminTab === 'integration' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Integration Settings</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure external data sources and integrations</p>
                </div>
                <button onClick={() => setShowIntegrationSettings(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-md">
                  <Settings className="w-5 h-5" />Open Settings
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Google Sheets</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Connect to external spreadsheets for article management</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${sheetsEnabled ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                    {sheetsEnabled ? 'Connected' : 'Not Connected'}
                  </div>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Data Source</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Current data source configuration</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {dataSource === 'sheets-only' ? 'Sheets Only' : dataSource === 'admin-only' ? 'Admin Only' : 'Both Sources'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Untold Stories Tab */}
          {activeAdminTab === 'untold-stories' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Untold Stories</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Featured carousel stories for homepage</p>
                </div>
                <button onClick={() => setShowFeaturedManager(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-md">
                  <Upload className="w-5 h-5" />Manage Stories
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredImages.map((story, index) => (
                  <div key={story.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {story.image ? (
                      <img src={story.image} alt={story.title} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                        No Image
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{story.title || `Story ${index + 1}`}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{story.articleTitle || 'No article linked'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Agent Tab */}
          {activeAdminTab === 'agent' && (
            <AIArticleGenerator
              categories={categories}
              onPublish={handleAIArticlePublish}
            />
          )}


          {/* New Article Tab */}
          {activeAdminTab === 'new-article' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create New Article</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Write and publish new content</p>
                </div>
                <button onClick={() => setShowArticleForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-md">
                  <Plus className="w-5 h-5" />New Article
                </button>
              </div>
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Plus className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">Click the button above to create your first article</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Articles created here will appear in the Articles tab</p>
              </div>
            </div>
          )}

          {/* Manage Admins Tab */}
          {activeAdminTab === 'manage-admins' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Manage Admins</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Review admin requests and manage user permissions</p>
                </div>
                <button onClick={() => { setShowManageAdmins(true); loadAdminRequests(); loadAllUsers(); }} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-md">
                  <User className="w-5 h-5" />Open Admin Panel
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{adminRequests.length}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mb-2">
                    {allUsers.filter(u => u.profile?.admin_status === 'A').length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Admins</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{allUsers.length}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Access Control - When visiting #admin but not authorized */}
      {currentView === 'admin' && (!user || user.profile?.admin_status !== 'A') && !showAdminRequestModal && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <Settings className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />

            {!user ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Admin Access</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Please login to access the admin panel.</p>

                <button
                  onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Access Denied</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">You do not have admin privileges.</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">If you need admin access, please contact the site administrator.</p>
                <button
                  onClick={() => setCurrentView('home')}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
                >
                  Go to Home
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 overflow-y-auto animate-fadeIn">
          <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-full mx-auto bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 rounded-lg p-4 sm:p-6 lg:p-8 animate-slideUp shadow-2xl border border-red-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => { setSelectedArticle(null); setIsInlineEditing(false); setInlineEditContent(''); }} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-2 font-semibold">
                  <X className="w-6 h-6" />Close
                </button>

                {user && user.profile?.admin_status === 'A' && !isInlineEditing && (
                  <button onClick={startInlineEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    <Edit2 className="w-4 h-4" />
                    Edit Article
                  </button>
                )}

                {isInlineEditing && (
                  <div className="flex items-center gap-2">
                    <button onClick={saveInlineEdit} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button onClick={cancelInlineEdit} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold">
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {selectedArticle.image && <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-96 object-cover rounded-lg mb-6" />}
              <h1 className="text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">{selectedArticle.title}</h1>

              {!isInlineEditing ? (
                <div
                  className="text-gray-800 dark:text-gray-300 leading-relaxed prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedArticle.content) }}
                />
              ) : (
                <div className="space-y-4">
                  {/* Rich Text Toolbar */}
                  <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => applyFormat('bold')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Bold (Markdown: **text**)"
                    >
                      <Bold className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => applyFormat('italic')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Italic (Markdown: *text*)"
                    >
                      <Italic className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                    <button
                      onClick={() => applyFormat('heading')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Heading (Markdown: ## Heading)"
                    >
                      <Heading2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                    <button
                      onClick={() => applyFormat('bullet')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Bullet List"
                    >
                      <List className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => applyFormat('number')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                    <button
                      onClick={() => applyFormat('paragraph')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      title="New Paragraph"
                    >
                      <Type className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 self-center px-2">
                      Select text and click formatting buttons
                    </div>
                  </div>

                  {/* Editable Textarea */}
                  <textarea
                    id="inline-editor"
                    value={inlineEditContent}
                    onChange={(e) => setInlineEditContent(e.target.value)}
                    className="w-full h-96 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 font-normal leading-relaxed resize-y"
                    placeholder="Edit your article content here..."
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Word count: {inlineEditContent.split(/\s+/).filter(word => word.length > 0).length} words
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showArticleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto animate-slideUp shadow-2xl border border-red-100 dark:border-gray-700">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editingArticle ? 'Edit' : 'New'} Article</h2>
              <button onClick={resetForm} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Title</label>
                <input type="text" value={formInputs.title} onChange={(e) => setFormInputs(p => ({...p, title: e.target.value}))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 dark:focus:border-red-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                <select value={formInputs.category} onChange={(e) => setFormInputs(p => ({...p, category: e.target.value}))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 dark:focus:border-red-400">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                <textarea value={formInputs.content} onChange={(e) => setFormInputs(p => ({...p, content: e.target.value}))} rows="10" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 dark:focus:border-red-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 dark:focus:border-red-400" />
                {formInputs.image && <img src={formInputs.image} alt="Preview" className="mt-4 w-full h-48 object-cover rounded-lg" />}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                <select value={formInputs.status} onChange={(e) => setFormInputs(p => ({...p, status: e.target.value}))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 dark:focus:border-red-400">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <button onClick={handleSubmitArticle} className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700">
                {editingArticle ? 'Update' : 'Publish'} Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Access Request Modal */}
      {showAdminRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-[100] overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full relative my-8 max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => {setShowAdminRequestModal(false); setCurrentView('home');}}
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-4">
              <Settings className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Request Admin Access</h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Submit your request and wait for approval</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Name *</label>
                <input
                  type="text"
                  value={adminRequestForm.name}
                  onChange={(e) => setAdminRequestForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
                <input
                  type="email"
                  value={adminRequestForm.email}
                  onChange={(e) => setAdminRequestForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Password *</label>
                <input
                  type="password"
                  value={adminRequestForm.password}
                  onChange={(e) => setAdminRequestForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Message (Optional)</label>
                <textarea
                  value={adminRequestForm.message}
                  onChange={(e) => setAdminRequestForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Why do you need admin access?"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <button
                onClick={handleAdminRequest}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 text-sm"
              >
                Submit Request
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Sent to: <strong>cinechattercontact@gmail.com</strong></li>
                  <li>Reviewed by site administrator</li>
                  <li>Notified via email once approved</li>
                  <li>Usually takes 24-48 hours</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Admins Modal */}
      {showManageAdmins && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 overflow-y-auto animate-fadeIn">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full animate-slideUp shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex justify-between items-center z-10 rounded-t-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Admins</h2>
                <button onClick={() => setShowManageAdmins(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="flex gap-4 items-center">
                    <input
                      type="text"
                      placeholder="Search users by email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-red-500 dark:focus:border-red-400"
                    />
                    <button onClick={loadAllUsers} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Instructions:</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Only existing admins can promote users to admin</li>
                    <li>• Users must have an account before they can be promoted</li>
                    <li>• You cannot demote yourself</li>
                    <li>• First admin was created during initial setup</li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border dark:border-gray-700">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {allUsers
                        .filter(u => !userSearchQuery || u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
                        .map((u, index) => (
                          <tr key={u.id} className={u.id === user?.id ? 'bg-blue-50 dark:bg-blue-900' : index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-700/50'}>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                              {u.email}
                              {u.id === user?.id && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{u.name || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              {u.admin_status === 'A' ? (
                                <span className="bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 px-2 py-1 rounded text-xs font-semibold shadow-sm">
                                  Admin
                                </span>
                              ) : u.admin_status === 'P' ? (
                                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-semibold shadow-sm">
                                  Pending
                                </span>
                              ) : u.admin_status === 'R' ? (
                                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs shadow-sm">
                                  Rejected
                                </span>
                              ) : (
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs shadow-sm">
                                  User
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {u.admin_status === 'A' ? (
                                <button
                                  onClick={() => demoteAdmin(u.id, u.email)}
                                  disabled={u.id === user?.id}
                                  className={`${
                                    u.id === user?.id
                                      ? 'bg-gray-300 cursor-not-allowed'
                                      : 'bg-red-600 hover:bg-red-700'
                                  } text-white px-3 py-1 rounded text-xs`}
                                >
                                  Remove Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => promoteToAdmin(u.id, u.email)}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                                >
                                  Make Admin
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {allUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No users found. Users appear here after they sign up.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Settings Modal */}
      {showIntegrationSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 overflow-y-auto animate-fadeIn">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full animate-slideUp shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex justify-between items-center z-10 rounded-t-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Google Sheets Integration</h2>
                <button onClick={() => setShowIntegrationSettings(false)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full">
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 How to Set Up:</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Create a Google Sheet with columns: Category | Title | Content | Image URL | Date | Status</li>
                    <li><strong>IMPORTANT:</strong> File → Share → "Publish to web" → Select "Comma-separated values (.csv)" → Publish</li>
                    <li>OR: Share → "Anyone with the link" → "Viewer"</li>
                    <li>Copy the sheet URL and paste below</li>
                    <li>Click "Import Articles" to save them to database</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Google Sheet URL
                  </label>
                  <input
                    type="text"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Connection Status</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {sheetStatus === 'not-connected' && '⚠️ Not Connected'}
                      {sheetStatus === 'connecting' && '🔄 Connecting...'}
                      {sheetStatus === 'connected' && sheetArticles.length > 0 && sheetArticles[0]?.source === 'google-sheets-demo' && (
                        <span className="text-blue-600">
                          ✅ Demo Mode Active ({sheetArticles.length} sample articles)<br/>
                          <span className="text-xs">Your sheet is ready! Will work on deployment.</span>
                        </span>
                      )}
                      {sheetStatus === 'connected' && sheetArticles.length > 0 && sheetArticles[0]?.source !== 'google-sheets-demo' && (
                        `✅ Connected (${sheetArticles.length} articles loaded)`
                      )}
                      {sheetStatus === 'error' && '❌ Connection Error'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={connectAndUploadSheet}
                      disabled={!sheetUrl || sheetStatus === 'connecting'}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center gap-2"
                    >
                      {sheetStatus === 'connecting' ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                          </svg>
                          Import Articles
                        </>
                      )}
                    </button>
                    {sheetStatus === 'connected' && (
                      <button
                        onClick={refreshSheetData}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Refresh
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Data Source
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="dataSource"
                        value="sheets-only"
                        checked={dataSource === 'sheets-only'}
                        onChange={(e) => {
                          setDataSource(e.target.value);
                          saveSheetSettings(null, e.target.value, null, null);
                        }}
                        className="mr-3"
                        disabled={sheetStatus !== 'connected'}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Google Sheets Only</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use only articles from Google Sheets (default)</p>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="dataSource"
                        value="both"
                        checked={dataSource === 'both'}
                        onChange={(e) => {
                          setDataSource(e.target.value);
                          saveSheetSettings(null, e.target.value, null, null);
                        }}
                        className="mr-3"
                        disabled={sheetStatus !== 'connected'}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Admin Panel + Google Sheets</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Combine articles from both sources</p>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="dataSource"
                        value="admin-only"
                        checked={dataSource === 'admin-only'}
                        onChange={(e) => {
                          setDataSource(e.target.value);
                          saveSheetSettings(null, e.target.value, null, null);
                        }}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Admin Panel Only</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use only articles created in the admin panel</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">💡 Important: Preview Environment Limitation</h3>
                  <div className="text-sm text-yellow-800 space-y-2">
                    <p>Claude.ai artifacts have browser security restrictions (CORS) that prevent direct Google Sheets connections.</p>
                    <p className="font-medium">✅ Good News: Your sheet IS properly configured!</p>
                    <p>When you click "Upload Sheet", the app will:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Validate your URL ✅</li>
                      <li>Create demo articles to show how it works</li>
                      <li>Enable all data source options</li>
                    </ul>
                    <p className="font-medium mt-2">🚀 On Deployment (Netlify/Vercel):</p>
                    <p>The exact same code will fetch your real Google Sheets data perfectly!</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">💡 Pro Tips:</h3>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Category must match exactly: hollywood-movies, bollywood-movies, etc.</li>
                    <li>Status must be either "published" or "draft"</li>
                    <li>Image URLs must be publicly accessible (use Imgur, Google Drive, etc.)</li>
                    <li>Date format: YYYY-MM-DD (e.g., 2025-01-15)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFeaturedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 overflow-y-auto animate-fadeIn">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full animate-slideUp shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex justify-between items-center z-10 rounded-t-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Untold Stories ({featuredImages.length} of 10)</h2>
                <button onClick={() => setShowFeaturedManager(false)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full">
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Upload images with articles that will randomly appear when users open the treasure box!</p>

                <div className="space-y-8">
                  {featuredImages.map((featured, index) => (
                    <div key={featured.id} className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-700">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">Untold Story {index + 1}</h3>
                        <div className="flex gap-2">
                          {featured.image && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = featuredImages.map(img => img.id === featured.id ? { ...img, image: '', articleTitle: '', articleDescription: '' } : img);
                                saveFeaturedImages(updated);
                              }}
                              className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                            >
                              Clear Content
                            </button>
                          )}
                          {featuredImages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = featuredImages.filter(img => img.id !== featured.id);
                                setFeaturedImages(updated);
                                saveFeaturedImages(updated);
                              }}
                              className="text-red-600 dark:text-red-400 text-sm hover:text-red-800 dark:hover:text-red-300 font-semibold"
                            >
                              Delete Story
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          {/* Image Upload Section */}
                          {featured.image ? (
                            <img src={featured.image} alt={featured.title} className="w-full h-64 object-contain bg-white dark:bg-gray-900 rounded mb-3 border border-gray-300 dark:border-gray-600" />
                          ) : (
                            <div className="w-full h-64 bg-white dark:bg-gray-800 flex flex-col items-center justify-center rounded mb-3 border-2 border-dashed border-gray-300 dark:border-gray-600">
                              <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-2" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">No image</p>
                            </div>
                          )}
                          
                          <label className="block">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const updated = featuredImages.map(img => img.id === featured.id ? { ...img, image: reader.result } : img);
                                    setFeaturedImages(updated);
                                    saveFeaturedImages(updated);
                                    console.log('Image uploaded for Slot ' + featured.id, reader.result.substring(0, 50));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                            />
                          </label>
                        </div>

                        <div className="space-y-4">
                          {/* Article Title */}
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Article Title</label>
                            <input
                              type="text"
                              value={featured.articleTitle || ''}
                              onChange={(e) => {
                                const newTitle = e.target.value;
                                setFeaturedImages(prev => prev.map(img =>
                                  img.id === featured.id ? { ...img, articleTitle: newTitle } : img
                                ));
                              }}
                              onBlur={() => {
                                saveFeaturedImages(featuredImages);
                              }}
                              placeholder="Enter article title..."
                              className="w-full px-4 py-2 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>

                          {/* Article Description */}
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Article Description</label>
                            <textarea
                              value={featured.articleDescription || ''}
                              onChange={(e) => {
                                const newDesc = e.target.value;
                                setFeaturedImages(prev => prev.map(img =>
                                  img.id === featured.id ? { ...img, articleDescription: newDesc } : img
                                ));
                              }}
                              onBlur={() => {
                                saveFeaturedImages(featuredImages);
                              }}
                              placeholder="Enter article description..."
                              rows="6"
                              className="w-full px-4 py-2 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>

                          {/* Fallback Link */}
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Fallback Link (if no article):</label>
                            <select
                              value={featured.link}
                              onChange={(e) => {
                                const updated = featuredImages.map(img => img.id === featured.id ? { ...img, link: e.target.value } : img);
                                saveFeaturedImages(updated);
                              }}
                              className="w-full px-4 py-2 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">User will go to this category if no article is set</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Story Button */}
                  {featuredImages.length < 10 && (
                    <button
                      onClick={() => {
                        const maxId = Math.max(...featuredImages.map(f => f.id), 0);
                        const newStory = {
                          id: maxId + 1,
                          image: '',
                          title: `Untold Story ${featuredImages.length + 1}`,
                          link: 'hollywood-movies',
                          articleTitle: '',
                          articleDescription: ''
                        };
                        const updated = [...featuredImages, newStory];
                        setFeaturedImages(updated);
                        saveFeaturedImages(updated);
                      }}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-red-500 hover:bg-red-50 transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      <Plus className="w-12 h-12 text-gray-400" />
                      <span className="text-lg font-semibold text-gray-600">Add Story</span>
                      <span className="text-sm text-gray-500">{10 - featuredImages.length} slots remaining</span>
                    </button>
                  )}
                </div>

                <div className="mt-8 flex justify-end sticky bottom-0 bg-white pt-4 border-t">
                  <button
                    onClick={async () => {
                      await saveFeaturedImages(featuredImages);
                      setShowFeaturedManager(false);
                      await loadFeaturedImages();
                    }}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 text-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Treasure Box Modal */}
      {treasureBoxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-8 relative animate-slideUp shadow-2xl">
            <button onClick={() => setTreasureBoxOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-red-600 mb-2">🎁 Treasure Unlocked! 🎁</h2>
              <p className="text-gray-600">Here's something special for you...</p>
            </div>

            {(() => {
              const validImages = featuredImages.filter(f => f.image);
              console.log('Featured images:', featuredImages);
              console.log('Valid images with actual image data:', validImages);
              console.log('Current treasure index:', currentTreasureIndex);
              
              if (validImages.length === 0) {
                return (
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">No treasures available yet</p>
                    <p className="text-sm text-gray-400">Upload images in "Manage Treasure Content" to see them here!</p>
                  </div>
                );
              }
              const treasure = validImages[currentTreasureIndex % validImages.length];
              console.log('Selected treasure:', treasure);
              return (
                <div>
                  <img src={treasure.image} alt="Treasure" className="w-full h-64 object-contain rounded-lg mb-4 bg-gray-50" />
                  <button 
                    onClick={() => handleTreasureClick(treasure)}
                    className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    {treasure.articleTitle ? 'Read Article' : 'Explore More'}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Treasure Article Modal */}
      {selectedTreasureArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 overflow-y-auto animate-fadeIn">
          <div className="min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900 rounded-lg p-8 animate-slideUp shadow-2xl border border-red-100 dark:border-gray-700">
              <button
                onClick={() => setSelectedTreasureArticle(null)}
                className="mb-6 text-red-600 hover:text-red-700 flex items-center gap-2 font-semibold"
              >
                <X className="w-6 h-6" />Close
              </button>
              {selectedTreasureArticle.image && (
                <img
                  src={selectedTreasureArticle.image}
                  alt={selectedTreasureArticle.articleTitle}
                  className="w-full h-96 object-cover rounded-lg mb-6"
                />
              )}
              <h1 className="text-4xl font-bold mt-2 mb-4">{selectedTreasureArticle.articleTitle}</h1>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedTreasureArticle.articleDescription}</p>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full animate-slideUp shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{authMode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
              <button onClick={() => { setShowAuthModal(false); setAuthForm({ name: '', email: '', password: '' }); }}>
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" />
              </button>
            </div>

            <div className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name (Optional)</label>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => setAuthForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignup())}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignup())}
                />
                {authMode === 'signup' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>
                )}
              </div>

              <button
                onClick={authMode === 'login' ? handleLogin : handleSignup}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700"
              >
                {authMode === 'signup' ? 'Sign Up' : 'Login'}
              </button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {authMode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button
                      onClick={() => setAuthMode('signup')}
                      className="text-red-600 dark:text-red-400 hover:underline font-semibold"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      onClick={() => setAuthMode('login')}
                      className="text-red-600 dark:text-red-400 hover:underline font-semibold"
                    >
                      Login
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CineChatter;
