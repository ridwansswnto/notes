const config = {
  gatsby: {
    pathPrefix: '/',
    siteUrl: 'https://logbook.ridwan-siswanto.com',
    gaTrackingId: null,
    trailingSlash: false,
  },
  header: {
    logo: '',
    logoLink: '',
    title: "Ridwan Notes",
    githubUrl: 'https://github.com/ridwansswnto/logbook',
    helpUrl: '',
    tweetText: '',
    social: ``,
    links: [{ text: '', link: '' }],
    search: {
      enabled: false,
      indexName: '',
      algoliaAppId: process.env.GATSBY_ALGOLIA_APP_ID,
      algoliaSearchKey: process.env.GATSBY_ALGOLIA_SEARCH_KEY,
      algoliaAdminKey: process.env.ALGOLIA_ADMIN_KEY,
    },
  },
  sidebar: {
    forcedNavOrder: [
      '/introduction', 
      '/kubernetes',
      '/servicemesh-istio',
    ],
    collapsedNav: [
      '/introduction',
      '/kubernetes',
      '/servicemesh-istio',
    ],
    links: [{ text: 'Live is Changing', link: '' }],
    frontline: false,
    ignoreIndex: true,
    title:
      "Catatan Kaki",
  },
  siteMetadata: {
    title: 'Ridwan Notes | Hasura',
    description: 'Documentation built with learning ',
    ogImage: null,
    docsLocation: '',
    favicon: '',
  },
  pwa: {
    enabled: true, // disabling this will also remove the existing service worker.
    manifest: {
      name: 'Gatsby Gitbook Starter',
      short_name: 'GitbookStarter',
      start_url: '/',
      background_color: '#6b37bf',
      theme_color: '#6b37bf',
      display: 'standalone',
      crossOrigin: 'use-credentials',
      icons: [
        {
          src: 'src/pwa-512.png',
          sizes: `512x512`,
          type: `image/png`,
        },
      ],
    },
  },
};

module.exports = config;
