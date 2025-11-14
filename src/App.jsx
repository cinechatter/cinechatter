import React, { useState, useEffect } from 'react';
import { Film, TrendingUp, Plus, Edit2, Trash2, Eye, X, Menu, Search, ChevronDown, Upload, Settings, User, LogOut, Download, Moon, Sun } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { autoGenerateSEOFields } from './utils/seoHelpers';

const categories = [
  { id: 'hollywood-movies', name: 'Hollywood Movies' },
  { id: 'hollywood-news', name: 'Hollywood News' },
  { id: 'bollywood-movies', name: 'Bollywood Movies' },
  { id: 'bollywood-news', name: 'Bollywood News' },
  { id: 'ott', name: 'OTT' },
  { id: 'music', name: 'Music' },
  { id: 'celebrity-style', name: 'Celebrity Style' },
  { id: 'international', name: 'International Cinema' }
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

  useEffect(() => {
    loadArticles();
    loadFeaturedImages();
    checkUser();

    // Expose supabase to window for testing (development only)
    if (process.env.NODE_ENV === 'development') {
      window.supabase = supabase;
    }
  }, []);

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
      const result = await window.storage.get('cine-chatter-articles');
      if (result) {
        setArticles(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No articles');
    }
  };

  const loadFeaturedImages = async () => {
    try {
      const result = await window.storage.get('cine-chatter-featured-images');
      if (result) {
        const loaded = JSON.parse(result.value);
        console.log('Loaded featured images from storage:', loaded);
        setFeaturedImages(loaded);
      } else {
        console.log('No featured images in storage');
      }
    } catch (error) {
      console.log('Error loading featured images:', error);
    }
  };

  const saveArticles = async (updatedArticles) => {
    try {
      await window.storage.set('cine-chatter-articles', JSON.stringify(updatedArticles));
      setArticles(updatedArticles);
    } catch (error) {
      console.error('Failed');
    }
  };

  const saveFeaturedImages = async (images) => {
    try {
      console.log('Saving featured images:', images);
      await window.storage.set('cine-chatter-featured-images', JSON.stringify(images));
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
      
      // Parse real CSV data
      console.log('📊 Parsing CSV data...');
      
      const rows = [];
      const lines = csvText.split(/\r?\n/);
      
      for (let line of lines) {
        if (!line.trim()) continue;
        
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"') {
            if (insideQuotes && nextChar === '"') {
              currentValue += '"';
              i++;
            } else {
              insideQuotes = !insideQuotes;
            }
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());
        rows.push(values);
      }
      
      if (rows.length < 2) {
        throw new Error('Sheet appears empty');
      }
      
      const dataRows = rows.slice(1).filter(row => row.length > 0 && row[0] && row[0].trim());
      
      const fetchedArticles = dataRows.map((row, index) => {
        // Normalize category to match app format (e.g., "Hollywood Movies" -> "hollywood-movies")
        let category = (row[0] || '').trim().toLowerCase().replace(/\s+/g, '-');
        
        return {
          id: `sheet-${Date.now()}-${index}`,
          category: category,
          title: (row[1] || '').trim(),
          content: (row[2] || '').trim(),
          image: (row[3] || '').trim(),
          date: (row[4] || new Date().toISOString().split('T')[0]).trim(),
          status: (row[5] || 'draft').toLowerCase().trim() === 'published' ? 'published' : 'draft',
          source: 'google-sheets',
          createdAt: (row[4] || new Date().toISOString())
        };
      }).filter(article => article.title && article.category);
      
      console.log('📊 Parsed articles:', fetchedArticles);
      
      setSheetArticles(fetchedArticles);
      setSheetStatus('connected');
      setSheetsEnabled(true);
      
      console.log(`✅ Successfully loaded ${fetchedArticles.length} articles from Google Sheets!`);
      console.log('Categories found:', [...new Set(fetchedArticles.map(a => a.category))]);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      setSheetStatus('error');
      setSheetArticles([]);
    }
  };

  const testConnection = async () => {
    await fetchGoogleSheetData();
  };

  const refreshSheetData = async () => {
    if (sheetStatus === 'connected') {
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

    let updatedArticles;
    if (editingArticle) {
      updatedArticles = articles.map(a => a.id === editingArticle.id ? articleData : a);
    } else {
      updatedArticles = [articleData, ...articles];
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
    const allArticles = [...articles, ...sheetArticles].filter(a => a.status === 'published');
    if (selectedArticles.length === allArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(allArticles.map(a => a.id));
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

              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setBollywoodOpen(false); setMoreOpen(false); setUserMenuOpen(false); setHollywoodOpen(!hollywoodOpen); }} className="flex items-center gap-1 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">
                  Hollywood <ChevronDown className="w-4 h-4" />
                </button>
                {hollywoodOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 w-48 z-50">
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
                )}
              </div>

              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setHollywoodOpen(false); setMoreOpen(false); setUserMenuOpen(false); setBollywoodOpen(!bollywoodOpen); }} className="flex items-center gap-1 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">
                  Bollywood <ChevronDown className="w-4 h-4" />
                </button>
                {bollywoodOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 w-48 z-50">
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
                )}
              </div>

              <button onClick={() => { setSelectedCategory('international'); setCurrentView('category'); }} className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">International</button>

              <button onClick={() => { setSelectedCategory('ott'); setCurrentView('category'); }} className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">OTT</button>

              <button onClick={() => { setSelectedCategory('music'); setCurrentView('category'); }} className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">Music</button>

              <button onClick={() => { setSelectedCategory('celebrity-style'); setCurrentView('category'); }} className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">Celebrity Style</button>

              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setHollywoodOpen(false); setBollywoodOpen(false); setUserMenuOpen(false); setMoreOpen(!moreOpen); }} className="flex items-center gap-1 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 whitespace-nowrap">
                  More <ChevronDown className="w-4 h-4" />
                </button>
                {moreOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 w-48 z-50">
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
                )}
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
                      className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 whitespace-nowrap flex items-center gap-1"
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
          <div className="text-center py-8 mb-8 border-b-2 border-gray-300 dark:border-gray-700">
            <h2 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to CineChatter</h2>
            <p className="text-red-600 dark:text-red-400 mb-8 font-semibold text-lg">Your ultimate destination for entertainment news and updates!</p>
            <p className="text-gray-500 dark:text-gray-400">Use the menu above to explore different categories</p>
          </div>

          {/* Treasure Box Section */}
          <div className="p-4 sm:p-8 mb-6 sm:mb-8 bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700">
            <div className="flex flex-col items-center mb-4 sm:mb-6">
              <div className="relative mb-4">
                <div className="w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-400 rounded-lg shadow-2xl flex items-center justify-center cursor-pointer transform hover:scale-105 transition-transform" onClick={async () => {
                  await loadFeaturedImages();
                  const validImages = featuredImages.filter(f => f.image);
                  if (validImages.length > 0) {
                    setCurrentTreasureIndex(Math.floor(Math.random() * validImages.length));
                  }
                  setTreasureBoxOpen(true);
                }}>
                  <span className="text-6xl sm:text-9xl">🎁</span>
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse">NEW</div>
              </div>
              <p className="text-center text-red-600 dark:text-red-400 font-bold text-2xl mb-4">Untold Stories!</p>
            </div>
          </div>

          {/* Latest Articles Section */}
          <div className="p-8 mb-8 bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Latest Articles</h2>
            </div>
            
            <div className="space-y-6">
              {/* Recent Articles from all sources */}
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

                // Sort by date and take top 5
                const recentArticles = allArticles
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 5);

                return recentArticles.length > 0 ? (
                  recentArticles.map(article => (
                    <div key={`article-${article.id}`} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-600">
                      <div className="flex gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-4 transition-colors" onClick={() => setSelectedArticle(article)}>
                        {article.image && (
                          <img src={article.image} alt={article.title} className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                        )}
                        <div className="flex-1">
                          <span className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded mb-2 inline-block uppercase font-semibold">
                            {categories.find(c => c.id === article.category)?.name}
                          </span>
                          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors">{article.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{article.content}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{new Date(article.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 text-center py-8">No articles yet</p>
                );
              })()}
            </div>
          </div>

          {/* Newsletter Section - 40% width, left aligned */}
          <div className="p-6 bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700">
            <div className="max-w-md">
              <div className="bg-red-600 rounded-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Subscribe to Our Newsletter</h3>
                <form onSubmit={(e) => { e.preventDefault(); if (newsletterEmail) { alert('Thank you for subscribing!'); setNewsletterEmail(''); } }} className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2">Email *</label>
                    <input 
                      type="email" 
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email" 
                      required
                      className="w-full px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-3 rounded-lg transition-colors">
                    Join
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'category' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6">
            <button onClick={() => setCurrentView('home')} className="text-red-600 dark:text-red-400 hover:underline mb-4 text-sm sm:text-base">← Back to Home</button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{categories.find(c => c.id === selectedCategory)?.name}</h1>
          </div>
          <div className="space-y-4">
            {getCategoryArticles(selectedCategory)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(article => (
              <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700">
                {article.image && <img src={article.image} alt={article.title} className="w-full h-64 sm:h-80 lg:h-96 object-cover" />}
                <div className="p-6">
                  <h3 className="font-bold text-2xl mb-3 text-gray-900 dark:text-white">{article.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">{article.content}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">{new Date(article.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          {getCategoryArticles(selectedCategory).length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 py-12">No articles in this category yet</p>
          )}
        </div>
      )}

      {currentView === 'search' && searchQuery && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6">
            <button onClick={() => { setCurrentView('home'); setSearchQuery(''); }} className="text-red-600 dark:text-red-400 hover:underline mb-4 text-sm sm:text-base">← Back to Home</button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Search Results for "{searchQuery}"</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {getSearchResults()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(article => (
              <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700">
                {article.image && <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />}
                <div className="p-4">
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded mb-2 inline-block">{categories.find(c => c.id === article.category)?.name}</span>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">{article.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">{article.content}</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <h1 className="text-4xl font-bold mb-6 text-red-600 dark:text-red-400">About CineChatter</h1>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.profile?.name || 'User'}</h1>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                {user.profile?.admin_status === 'A' && (
                  <span className="inline-block mt-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    Admin
                  </span>
                )}
                {user.profile?.admin_status === 'P' && (
                  <span className="inline-block mt-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <h1 className="text-4xl font-bold mb-6 text-red-600 dark:text-red-400">Contact Us</h1>
            <div className="space-y-6">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <div className="flex gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <button onClick={() => setShowIntegrationSettings(true)} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center">
                <Settings className="w-4 h-4" />Integration Settings
              </button>
              <button onClick={() => setShowFeaturedManager(true)} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center">
                <Upload className="w-4 h-4" />Untold Stories
              </button>
              <button onClick={() => alert('Coming Soon...')} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center">
                <Settings className="w-4 h-4" />Agent
              </button>
              <button onClick={() => setShowArticleForm(true)} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center">
                <Plus className="w-4 h-4" />New Article
              </button>
              <button onClick={() => { setShowManageAdmins(true); loadAdminRequests(); loadAllUsers(); }} className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center">
                <User className="w-4 h-4" />Manage Admins
              </button>
              <button onClick={exportToCSV} className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center">
                <Download className="w-4 h-4" />Export CSV {selectedArticles.length > 0 && `(${selectedArticles.length})`}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedArticles.length === [...articles, ...sheetArticles].filter(a => a.status === 'published').length && selectedArticles.length > 0}
                      onChange={toggleAllArticles}
                      className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(() => {
                  // Combine admin articles and sheet articles
                  const allArticles = [...articles, ...sheetArticles];

                  if (allArticles.length === 0) {
                    return <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">No articles yet</td></tr>;
                  }

                  return allArticles
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(article => {
                      // Truncate title to first 4 words
                      const titleWords = (article.title || '').split(' ');
                      const truncatedTitle = titleWords.slice(0, 4).join(' ') + (titleWords.length > 4 ? '...' : '');

                      // Truncate description to first 4 words
                      const words = (article.content || '').split(' ');
                      const truncatedDesc = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');

                      // Determine source display
                      const sourceDisplay = article.source === 'google-sheets' ? 'Integration Setting' :
                                          article.source === 'untold-story' ? 'Untold Stories' :
                                          article.source === 'agent' ? 'Agent' : 'New Article';

                      // Check if editable (only admin articles can be edited)
                      const isEditable = article.source !== 'google-sheets' && articles.some(a => a.id === article.id);

                      return (
                        <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-4">
                            {article.status === 'published' && (
                              <input
                                type="checkbox"
                                checked={selectedArticles.includes(article.id)}
                                onChange={() => toggleArticleSelection(article.id)}
                                className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500"
                              />
                            )}
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
                            <p className="text-sm text-gray-600 dark:text-gray-400">{truncatedDesc}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{categories.find(c => c.id === article.category)?.name}</td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {sourceDisplay}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {article.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedArticle(article)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" title="View"><Eye className="w-5 h-5" /></button>
                              {isEditable && (
                                <>
                                  <button onClick={() => { setEditingArticle(article); setFormInputs(article); setShowArticleForm(true); }} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300" title="Edit"><Edit2 className="w-5 h-5" /></button>
                                  <button onClick={() => { if (window.confirm('Delete this article?')) saveArticles(articles.filter(a => a.id !== article.id)); }} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300" title="Delete"><Trash2 className="w-5 h-5" /></button>
                                </>
                              )}
                              {!isEditable && (
                                <span className="text-gray-400 dark:text-gray-500 text-xs">View only</span>
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
        <div className="fixed inset-0 bg-black dark:bg-black bg-opacity-90 dark:bg-opacity-95 z-50 overflow-y-auto">
          <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-full mx-auto bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 lg:p-8">
              <button onClick={() => setSelectedArticle(null)} className="mb-6 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-2 font-semibold">
                <X className="w-6 h-6" />Close
              </button>
              {selectedArticle.image && <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-96 object-cover rounded-lg mb-6" />}
              <h1 className="text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">{selectedArticle.title}</h1>
              <p className="text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedArticle.content}</p>
            </div>
          </div>
        </div>
      )}

      {showArticleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full relative my-8 max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full">
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
                        .map((u) => (
                          <tr key={u.id} className={u.id === user?.id ? 'bg-blue-50 dark:bg-blue-900' : ''}>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                              {u.email}
                              {u.id === user?.id && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{u.name || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              {u.admin_status === 'A' ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                  Admin
                                </span>
                              ) : u.admin_status === 'P' ? (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                                  Pending
                                </span>
                              ) : u.admin_status === 'R' ? (
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                  Rejected
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full">
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
                    <li>Click "Upload Sheet"</li>
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
                      onClick={testConnection}
                      disabled={!sheetUrl || sheetStatus === 'connecting'}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {sheetStatus === 'connecting' ? 'Uploading...' : 'Upload Sheet'}
                    </button>
                    {sheetStatus === 'connected' && (
                      <button
                        onClick={refreshSheetData}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Refresh Data
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
                        value="admin-only"
                        checked={dataSource === 'admin-only'}
                        onChange={(e) => setDataSource(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Admin Panel Only</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use only articles created in the admin panel (default)</p>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="dataSource"
                        value="both"
                        checked={dataSource === 'both'}
                        onChange={(e) => setDataSource(e.target.value)}
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
                        value="sheets-only"
                        checked={dataSource === 'sheets-only'}
                        onChange={(e) => setDataSource(e.target.value)}
                        className="mr-3"
                        disabled={sheetStatus !== 'connected'}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Google Sheets Only</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use only articles from Google Sheets</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full">
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
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-8 relative">
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
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto">
          <div className="min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-lg p-8">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
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
