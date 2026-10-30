/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://boxgoods-guinee.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: ['/server-sitemap.xml', '/api/*', '/auth/*', '/login', '/account*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/auth/', '/login', '/account'] },
    ],
    additionalSitemaps: [
      'https://boxgoods-guinee.com/sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    const localeMap = {
      '/': { fr: '/fr', zh: '/zh' },
      '/categories': { fr: '/fr/categories', zh: '/zh/categories' },
      '/inquiry': { fr: '/fr/inquiry', zh: '/zh/inquiry' },
      '/search': { fr: '/fr/search', zh: '/zh/search' },
    };

    const alternates = localeMap[path] ? { languages: { ...localeMap[path], 'x-default': config.siteUrl + path } } : undefined;

    return {
      loc: path,
      changefreq: path === '/' ? 'daily' : 'weekly',
      priority: path === '/' ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
      alternateRefs: alternates ? Object.values(alternates.languages) : undefined,
    };
  },
  additionalPaths: async (config) => [
    { loc: '/fr', changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString() },
    { loc: '/zh', changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString() },
    { loc: '/fr/categories', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },
    { loc: '/zh/categories', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },
    { loc: '/fr/inquiry', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },
    { loc: '/zh/inquiry', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },
    { loc: '/fr/search', changefreq: 'weekly', priority: 0.5, lastmod: new Date().toISOString() },
    { loc: '/zh/search', changefreq: 'weekly', priority: 0.5, lastmod: new Date().toISOString() },
  ],
};