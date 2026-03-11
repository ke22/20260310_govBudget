const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        preset: 'mobile',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      },
      url: [
        `${baseUrl}/index.html`,
        `${baseUrl}/budget.html?q=%E5%9C%8B%E9%98%B2`,
        `${baseUrl}/legislators.html`,
        `${baseUrl}/other.html`
      ]
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};

