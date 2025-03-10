import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Contingut',
      links: [
        {
          text: 'Turisme 2025 valencià',
          href: getPermalink('/turisme-2025-va'),
        },
        {
          text: 'Turisme 2025 castellà',
          href: getPermalink('/turisme-2025-es'),
        },
        {
          text: 'Turisme 2025 anglès',
          href: getPermalink('/turisme-2025-en'),
        },
        {
          text: 'Turisme 2025 francès',
          href: getPermalink('/turisme-2025-fr'),
        },
        {
          text: 'Turisme 2025 alemany',
          href: getPermalink('/turisme-2025-de'),
        },
        {
          text: 'Llibret 2024',
          href: getPermalink('/llibret-2024'),
        },
      ],
    },
  ]
};

export const footerData = {
  links: [

  ],
  secondaryLinks: [
  ],
  socialLinks: [
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: 'https://twitter.com/FallaPasseig' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/fallapasseigtavernes/' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://www.facebook.com/FallaPasseigTavernes/' },
    // { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  footNote: `
    Tots els drets reservats.
  `,
};
