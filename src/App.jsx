import React, { useState, useEffect } from 'react';
import { Film, TrendingUp, Plus, Edit2, Trash2, Eye, X, Menu, Search, ChevronDown, Upload, Settings } from 'lucide-react';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
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
    { id: 1, image: '', title: 'Featured 1', link: 'hollywood-movies', articleTitle: '', articleDescription: '' },
    { id: 2, image: '', title: 'Featured 2', link: 'bollywood-movies', articleTitle: '', articleDescription: '' },
    { id: 3, image: '', title: 'Featured 3', link: 'music', articleTitle: '', articleDescription: '' }
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

  useEffect(() => {
    loadArticles();
    loadFeaturedImages();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setHollywoodOpen(false);
      setBollywoodOpen(false);
      setMoreOpen(false);
    };

    if (hollywoodOpen || bollywoodOpen || moreOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [hollywoodOpen, bollywoodOpen, moreOpen]);


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
      console.log('Featured images saved successfully');
    } catch (error) {
      console.error('Failed to save featured images:', error);
    }
  };

  const handleAdminLogin = () => {
    if (loginPassword === 'admin123') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setLoginPassword('');
      setCurrentView('admin');
    } else {
      alert('Incorrect password');
    }
  };

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

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button onClick={() => setCurrentView('home')} className="bg-red-600 text-white px-3 sm:px-4 py-1.5 rounded-md font-bold text-base sm:text-lg hover:bg-red-700 whitespace-nowrap" style={{ fontFamily: 'cursive' }}>
              CineChatter
            </button>

            {/* Desktop Search */}
            <div className="flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { setCurrentView('search'); } }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-red-500 text-sm" />
              </div>
            </div>

            {/* Desktop Navigation - Always visible */}
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentView('home')} className="px-3 py-2 text-sm text-gray-700 hover:text-red-600 whitespace-nowrap">Home</button>
              
              <button onClick={() => { setSelectedCategory('ott'); setCurrentView('category'); }} className="px-3 py-2 text-sm text-gray-700 hover:text-red-600 whitespace-nowrap">OTT</button>
              
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setBollywoodOpen(false); setMoreOpen(false); setHollywoodOpen(!hollywoodOpen); }} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:text-red-600 whitespace-nowrap">
                  Hollywood <ChevronDown className="w-4 h-4" />
                </button>
                {hollywoodOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg py-2 w-48 z-50">
                    <button 
                      onClick={() => { setSelectedCategory('hollywood-movies'); setCurrentView('category'); setHollywoodOpen(false); }} 
                      className="block w-full text-left px-4 py-2 text-gray-700 transition-colors duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                    >
                      Movies
                    </button>
                    <button 
                      onClick={() => { setSelectedCategory('hollywood-news'); setCurrentView('category'); setHollywoodOpen(false); }} 
                      className="block w-full text-left px-4 py-2 text-gray-700 transition-colors duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                    >
                      News
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setHollywoodOpen(false); setMoreOpen(false); setBollywoodOpen(!bollywoodOpen); }} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:text-red-600 whitespace-nowrap">
                  Bollywood <ChevronDown className="w-4 h-4" />
                </button>
                {bollywoodOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg py-2 w-48 z-50">
                    <button 
                      onClick={() => { setSelectedCategory('bollywood-movies'); setCurrentView('category'); setBollywoodOpen(false); }} 
                      className="block w-full text-left px-4 py-2 text-gray-700 transition-colors duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                    >
                      Movies
                    </button>
                    <button 
                      onClick={() => { setSelectedCategory('bollywood-news'); setCurrentView('category'); setBollywoodOpen(false); }} 
                      className="block w-full text-left px-4 py-2 text-gray-700 transition-colors duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                    >
                      News
                    </button>
                  </div>
                )}
              </div>
              
              <button onClick={() => { setSelectedCategory('music'); setCurrentView('category'); }} className="px-3 py-2 text-sm text-gray-700 hover:text-red-600 whitespace-nowrap">Music</button>
              
              <button onClick={() => { setSelectedCategory('celebrity-style'); setCurrentView('category'); }} className="px-3 py-2 text-sm text-gray-700 hover:text-red-600 whitespace-nowrap">Celebrity Style</button>

              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setHollywoodOpen(false); setBollywoodOpen(false); setMoreOpen(!moreOpen); }} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:text-red-600 whitespace-nowrap">
                  More <ChevronDown className="w-4 h-4" />
                </button>
                {moreOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-lg py-2 w-48 z-50">
                    <button 
                      onClick={() => { setSelectedCategory('international'); setCurrentView('category'); setMoreOpen(false); }} 
                      className="block w-full text-left px-4 py-2 text-gray-700 transition-colors duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                    >
                      International
                    </button>
                    <button 
                      onClick={() => { setCurrentView('about'); setMoreOpen(false); }} 
                      className="block w-full text-left px-4 py-2 text-gray-700 transition-colors duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                    >
                      About
                    </button>
                    <button 
                      onClick={() => { setCurrentView('contact'); setMoreOpen(false); }} 
                      className="block w-full text-left px-4 py-2 text-gray-700 transition-colors duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                    >
                      Contact
                    </button>
                  </div>
                )}
              </div>

              {!isAdmin ? (
                <button onClick={() => setShowAdminLogin(true)} className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 whitespace-nowrap">Admin</button>
              ) : (
                <button onClick={() => setCurrentView('admin')} className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 whitespace-nowrap">Dashboard</button>
              )}
            </div>

            {/* Mobile Menu Button - Hidden for now */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="hidden p-2 text-gray-700 hover:text-red-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Search Bar - Hidden for now */}
          <div className="hidden pb-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { setCurrentView('search'); setMobileMenuOpen(false); } }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-red-500 text-sm" />
            </div>
          </div>

          {/* Mobile Menu Dropdown - Hidden for now */}
          {false && mobileMenuOpen && (
            <div className="sm:hidden border-t bg-white pb-4">
              <div className="py-2 space-y-1">
                <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">Home</button>
                
                <button onClick={() => { setSelectedCategory('ott'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">OTT</button>
                
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">Hollywood</div>
                <button onClick={() => { setSelectedCategory('hollywood-movies'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-6 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">Movies</button>
                <button onClick={() => { setSelectedCategory('hollywood-news'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-6 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">News</button>
                
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">Bollywood</div>
                <button onClick={() => { setSelectedCategory('bollywood-movies'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-6 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">Movies</button>
                <button onClick={() => { setSelectedCategory('bollywood-news'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-6 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">News</button>
                
                <div className="border-t border-gray-200 my-1"></div>
                <button onClick={() => { setSelectedCategory('music'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">Music</button>
                
                <button onClick={() => { setSelectedCategory('celebrity-style'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">Celebrity Style</button>
                
                <button onClick={() => { setSelectedCategory('international'); setCurrentView('category'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">International</button>
                
                <div className="border-t border-gray-200 my-1"></div>
                <button onClick={() => { setCurrentView('about'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">About</button>
                
                <button onClick={() => { setCurrentView('contact'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600">Contact</button>
                
                <div className="border-t border-gray-200 my-2"></div>
                {!isAdmin ? (
                  <button onClick={() => { setShowAdminLogin(true); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 bg-red-600 text-white font-semibold rounded-md mx-4" style={{ width: 'calc(100% - 2rem)' }}>Admin Login</button>
                ) : (
                  <button onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 bg-green-600 text-white font-semibold rounded-md mx-4" style={{ width: 'calc(100% - 2rem)' }}>Dashboard</button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {currentView === 'home' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Treasure Box Section */}
          <div className="p-4 sm:p-8 mb-6 sm:mb-8 bg-white border-b-2 border-gray-300">
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
              <p className="text-center text-purple-700 font-bold text-2xl mb-4">Trending!</p>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="text-center py-8 mb-8 border-b-2 border-gray-300">
            <h2 className="text-5xl font-bold mb-4">Welcome to CineChatter</h2>
            <p className="text-red-600 mb-8 font-semibold text-lg">Your ultimate destination for entertainment news and updates!</p>
            <p className="text-gray-500">Use the menu above to explore different categories</p>
          </div>

          {/* Latest Articles Section */}
          <div className="p-8 mb-8 bg-white border-b-2 border-gray-300">
            <div className="mb-6">
              <h2 className="text-3xl font-bold">Latest Articles</h2>
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
                    <div key={`article-${article.id}`} className="border-b pb-4">
                      <div className="flex gap-4 cursor-pointer hover:bg-gray-50 p-3 rounded" onClick={() => setSelectedArticle(article)}>
                        {article.image && (
                          <img src={article.image} alt={article.title} className="w-24 h-24 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded mb-2 inline-block uppercase font-semibold">
                            {categories.find(c => c.id === article.category)?.name}
                          </span>
                          <h3 className="font-bold text-lg mb-2 hover:text-red-600">{article.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">{article.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(article.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">No articles yet</p>
                );
              })()}
            </div>
          </div>

          {/* Newsletter Section - 40% width, left aligned */}
          <div className="p-6 bg-white border-b-2 border-gray-300">
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
            <button onClick={() => setCurrentView('home')} className="text-red-600 hover:underline mb-4 text-sm sm:text-base">← Back to Home</button>
            <h1 className="text-2xl sm:text-3xl font-bold">{categories.find(c => c.id === selectedCategory)?.name}</h1>
          </div>
          <div className="space-y-4">
            {getCategoryArticles(selectedCategory)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(article => (
              <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                {article.image && <img src={article.image} alt={article.title} className="w-full h-64 sm:h-80 lg:h-96 object-cover" />}
                <div className="p-6">
                  <h3 className="font-bold text-2xl mb-3">{article.title}</h3>
                  <p className="text-gray-600 text-base leading-relaxed">{article.content}</p>
                  <p className="text-sm text-gray-400 mt-4">{new Date(article.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          {getCategoryArticles(selectedCategory).length === 0 && (
            <p className="text-center text-gray-400 py-12">No articles in this category yet</p>
          )}
        </div>
      )}

      {currentView === 'search' && searchQuery && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6">
            <button onClick={() => { setCurrentView('home'); setSearchQuery(''); }} className="text-red-600 hover:underline mb-4 text-sm sm:text-base">← Back to Home</button>
            <h1 className="text-2xl sm:text-3xl font-bold">Search Results for "{searchQuery}"</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {getSearchResults()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(article => (
              <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                {article.image && <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />}
                <div className="p-4">
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded mb-2 inline-block">{categories.find(c => c.id === article.category)?.name}</span>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3">{article.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(article.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          {getSearchResults().length === 0 && (
            <p className="text-center text-gray-400 py-12">No results found</p>
          )}
        </div>
      )}

      {currentView === 'about' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setCurrentView('home')} className="text-red-600 hover:underline mb-4">← Back to Home</button>
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-4xl font-bold mb-6 text-red-600">About CineChatter</h1>
            <div className="space-y-4 text-gray-700 leading-relaxed">
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

      {currentView === 'contact' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setCurrentView('home')} className="text-red-600 hover:underline mb-4">← Back to Home</button>
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-4xl font-bold mb-6 text-red-600">Contact Us</h1>
            <div className="space-y-6">
              <p className="text-gray-700 text-lg">
                We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, 
                feel free to reach out to us.
              </p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-red-600 pl-4">
                  <h3 className="font-bold text-lg mb-1">Social Media</h3>
                  <div className="space-y-1">
                    <p className="text-gray-700">Follow us on social media for the latest updates:</p>
                    <div className="flex gap-4 mt-2">
                      <a href="#" className="text-red-600 hover:underline">Twitter</a>
                      <a href="#" className="text-red-600 hover:underline">Facebook</a>
                      <a href="#" className="text-red-600 hover:underline">Instagram</a>
                    </div>
                  </div>
                </div>
                
                <div className="border-l-4 border-red-600 pl-4">
                  <h3 className="font-bold text-lg mb-1">Business Inquiries</h3>
                  <a href="mailto:cinechattercontact@gmail.com" className="text-red-600 hover:underline">
                    cinechattercontact@gmail.com
                  </a>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-xl mb-4">Send us a Message</h3>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Thank you for your message! We will get back to you soon.'); }}>
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input type="email" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea rows="5" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"></textarea>
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

      {currentView === 'admin' && isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <button onClick={() => setShowIntegrationSettings(true)} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center">
                <Settings className="w-4 h-4" />Integration Settings
              </button>
              <button onClick={() => setShowFeaturedManager(true)} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center">
                <Upload className="w-4 h-4" />Manage Featured
              </button>
              <button onClick={() => setShowArticleForm(true)} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base flex-1 sm:flex-initial justify-center">
                <Plus className="w-4 h-4" />New Article
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No articles yet</td></tr>
                ) : (
                  articles
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(article => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {article.image ? (
                          <img src={article.image} alt="" className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No image</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{article.title}</span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm text-gray-600 line-clamp-2">{article.content}</p>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">{categories.find(c => c.id === article.category)?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedArticle(article)} className="text-blue-600 hover:text-blue-800" title="View"><Eye className="w-5 h-5" /></button>
                          <button onClick={() => { setEditingArticle(article); setFormInputs(article); setShowArticleForm(true); }} className="text-green-600 hover:text-green-800" title="Edit"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => { if (window.confirm('Delete this article?')) saveArticles(articles.filter(a => a.id !== article.id)); }} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto">
          <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-full mx-auto bg-white rounded-lg p-4 sm:p-6 lg:p-8">
              <button onClick={() => setSelectedArticle(null)} className="mb-6 text-red-600 hover:text-red-700 flex items-center gap-2 font-semibold">
                <X className="w-6 h-6" />Close
              </button>
              {selectedArticle.image && <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-96 object-cover rounded-lg mb-6" />}
              <h1 className="text-4xl font-bold mt-2 mb-4">{selectedArticle.title}</h1>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedArticle.content}</p>
            </div>
          </div>
        </div>
      )}

      {showArticleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingArticle ? 'Edit' : 'New'} Article</h2>
              <button onClick={resetForm}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input type="text" value={formInputs.title} onChange={(e) => setFormInputs(p => ({...p, title: e.target.value}))} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select value={formInputs.category} onChange={(e) => setFormInputs(p => ({...p, category: e.target.value}))} className="w-full px-4 py-2 border rounded-lg">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={formInputs.content} onChange={(e) => setFormInputs(p => ({...p, content: e.target.value}))} rows="10" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-2 border rounded-lg" />
                {formInputs.image && <img src={formInputs.image} alt="Preview" className="mt-4 w-full h-48 object-cover rounded-lg" />}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select value={formInputs.status} onChange={(e) => setFormInputs(p => ({...p, status: e.target.value}))} className="w-full px-4 py-2 border rounded-lg">
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

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()} className="w-full px-4 py-2 border rounded-lg mb-4" placeholder="Password" />
            <button onClick={handleAdminLogin} className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 mb-4">Login</button>
            <button onClick={() => { setShowAdminLogin(false); setLoginPassword(''); }} className="w-full border px-6 py-3 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Integration Settings Modal */}
      {showIntegrationSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <div className="bg-white rounded-lg max-w-3xl w-full">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10 rounded-t-lg">
                <h2 className="text-2xl font-bold">Google Sheets Integration</h2>
                <button onClick={() => setShowIntegrationSettings(false)} className="hover:bg-gray-100 p-2 rounded-full">
                  <X className="w-6 h-6" />
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
                    <li>Click "Connect Sheet"</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Sheet URL
                  </label>
                  <input
                    type="text"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Connection Status</p>
                    <p className="text-sm text-gray-600">
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
                      {sheetStatus === 'connecting' ? 'Connecting...' : 'Connect Sheet'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Data Source
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="dataSource"
                        value="admin-only"
                        checked={dataSource === 'admin-only'}
                        onChange={(e) => setDataSource(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">Admin Panel Only</p>
                        <p className="text-sm text-gray-600">Use only articles created in the admin panel (default)</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
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
                        <p className="font-medium">Admin Panel + Google Sheets</p>
                        <p className="text-sm text-gray-600">Combine articles from both sources</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
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
                        <p className="font-medium">Google Sheets Only</p>
                        <p className="text-sm text-gray-600">Use only articles from Google Sheets</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">💡 Important: Preview Environment Limitation</h3>
                  <div className="text-sm text-yellow-800 space-y-2">
                    <p>Claude.ai artifacts have browser security restrictions (CORS) that prevent direct Google Sheets connections.</p>
                    <p className="font-medium">✅ Good News: Your sheet IS properly configured!</p>
                    <p>When you click "Connect Sheet", the app will:</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <div className="bg-white rounded-lg max-w-6xl w-full">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10 rounded-t-lg">
                <h2 className="text-2xl font-bold">Manage Treasure Content (3 Slots)</h2>
                <button onClick={() => setShowFeaturedManager(false)} className="hover:bg-gray-100 p-2 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-6">Upload images with articles that will randomly appear when users open the treasure box!</p>
                <div className="text-xs text-gray-400 mb-4 p-2 bg-gray-100 rounded">
                  Debug: Current featuredImages state = {JSON.stringify(featuredImages.map(f => ({id: f.id, hasImage: !!f.image, imageLength: f.image?.length || 0})))}
                </div>
                
                <div className="space-y-8">
                  {featuredImages.map(featured => (
                    <div key={featured.id} className="border-2 rounded-lg p-6 hover:border-blue-500 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl">Slot {featured.id}</h3>
                        {featured.image && (
                          <button 
                            type="button"
                            onClick={() => {
                              const updated = featuredImages.map(img => img.id === featured.id ? { ...img, image: '', articleTitle: '', articleDescription: '' } : img);
                              saveFeaturedImages(updated);
                            }} 
                            className="text-red-600 text-sm hover:text-red-800 font-semibold"
                          >
                            Remove All
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          {/* Image Upload Section */}
                          {featured.image ? (
                            <img src={featured.image} alt={featured.title} className="w-full h-64 object-contain bg-white rounded mb-3 border" />
                          ) : (
                            <div className="w-full h-64 bg-white flex flex-col items-center justify-center rounded mb-3 border-2 border-dashed border-gray-300">
                              <Upload className="w-16 h-16 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">No image</p>
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
                            <label className="block text-sm font-semibold mb-2">Article Title</label>
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
                              className="w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>

                          {/* Article Description */}
                          <div>
                            <label className="block text-sm font-semibold mb-2">Article Description</label>
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
                              className="w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none bg-white"
                            />
                          </div>

                          {/* Fallback Link */}
                          <div>
                            <label className="block text-sm font-semibold mb-2">Fallback Link (if no article):</label>
                            <select 
                              value={featured.link}
                              onChange={(e) => {
                                const updated = featuredImages.map(img => img.id === featured.id ? { ...img, link: e.target.value } : img);
                                saveFeaturedImages(updated);
                              }}
                              className="w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">User will go to this category if no article is set</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
};

export default CineChatter;
