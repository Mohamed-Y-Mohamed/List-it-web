// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://list-it-dom.netlify.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false, // This should create sitemap.xml directly
  sitemapSize: 7000,
  
  // Exclude protected routes - use exact paths
  exclude: [
    '/dashboard',
    '/today', 
    '/tomorrow',
    '/priority',
    '/completed',
    '/notcomplete', 
    '/overdue',
    '/scheduled',
    '/api/*'
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/today', '/tomorrow', '/priority', '/completed', '/notcomplete', '/overdue', '/scheduled', '/api/']
      }
    ]
  },

  transform: async (config, path) => {
    // Only include public routes.
    //
    // /privacy and /data-deletion are listed because Google Play points at both
    // and expects them publicly reachable. Leaving them out of the sitemap does
    // not hide them, but a policy URL the site itself declines to list is the
    // wrong signal to send about a page that is meant to be found.
    const publicRoutes = ['/', '/landingpage', '/aboutus', '/login', '/register', '/forgotPassword', '/resetPassword', '/privacy', '/data-deletion'];

    if (!publicRoutes.includes(path)) {
      return null; // This excludes the route
    }

    let priority = 0.7;
    let changefreq = 'weekly';

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path === '/landingpage') {
      priority = 0.9; 
      changefreq = 'weekly';
    } else if (path === '/aboutus') {
      priority = 0.8;
      changefreq = 'monthly';
    } else if (path.includes('/login') || path.includes('/register')) {
      priority = 0.7;
      changefreq = 'monthly';
    } else if (path.includes('Password')) {
      priority = 0.5;
      changefreq = 'yearly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  }
}