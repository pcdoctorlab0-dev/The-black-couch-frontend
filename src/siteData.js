import logo from './assets/tbclogo.jpg';
import hero from './assets/ssstik.io_1789261985840.webp';
import studio from './assets/ssstik.io_1789261994719.webp';
import panel from './assets/ssstik.io_1789262004188.webp';
import merch from './assets/ssstik.io_1789262018135.webp';
import hoodie from './assets/ssstik.io_1789262010926.webp';
import tumbler from './assets/ssstik.io_1789262025526.webp';

export const assets = {
  logo,
  hero,
  studio,
  panel,
  merch,
  hoodie,
  tumbler,
};

const youtubeSearch = (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`The Black Couch Network ${query}`)}`;

export const episodes = [
  { number: 91, guest: 'Metro CMG', category: 'Music', date: '23 Jun 2026', duration: '1h 16m', title: 'Gidi Boy, Mizo Phyll, Gatekeeping, Venda Rap', description: 'Matodzi Maphiri joins Kingsley Mudau for a conversation about Venda music, gatekeeping and life in the industry.' },
  { number: 90, guest: 'HvrdKO', category: 'Culture', date: '14 Jun 2026', duration: '1h 29m', title: 'TheGyad, IG Lunar, Venda Creators', description: 'A wide-ranging exchange on music, content creators, social media and the people shaping the local creative scene.' },
  { number: 89, guest: 'Eleh', category: 'Entertainment', date: 'Jun 2026', duration: 'Full episode', title: 'Kwesta, Venda Music, Vusi Nova', description: 'A conversation about creative industry paths, music and making a way through the culture.' },
  { number: 88, guest: 'Muthuhadini Maboho', category: 'Social', date: 'May 2026', duration: 'Full episode', title: 'Poetry, Xenophobia, Radio, Yano', description: 'A candid conversation spanning poetry, radio, Yano and working in media.' },
  { number: 85, guest: 'Hulisani Mani', category: 'Current affairs', date: '11 May 2026', duration: 'Full episode', title: 'VBS, Thulamela, Unemployment', description: 'A current-affairs conversation about local government and issues affecting communities around Venda.' },
  { number: 84, guest: 'Racha Kill', category: 'Music', date: '2026', duration: 'Full episode', title: 'VenRap, Content Creators’ Music', description: 'A deep dive into VenRap, music made by content creators and the artists moving the culture forward.' },
  { number: 83, guest: 'MickeyBlack', category: 'Life', date: '13 Mar 2026', duration: '1h 21m', title: 'VanGee, Gospel, King Monada, Mom Loss', description: 'A music journey, personal loss and creative ambitions shared openly on the couch.' },
  { number: 80, guest: 'Humbelani Netshandama', category: 'Social', date: '20 Feb 2026', duration: '2h 26m', title: 'Marriage, Polygamy, Lobola Prices', description: 'An open conversation about marriage, family and social expectations.' },
];
 
export const episodeFromApi = (episode) => ({
  number: Number(episode.episode_number),
  guest: episode.guest_name,
  category: episode.category,
  date: new Date(`${episode.publish_date}T00:00:00`).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  duration: 'Full episode',
  title: episode.title,
  description: episode.description,
  youtube_url: episode.youtube_url,
  cover_image_url: episode.cover_image_url,
});

export const shows = [
  { name: 'The Black Couch', strapline: 'The flagship conversation.', description: 'Relaxed, probing conversations with artists, entrepreneurs, public voices and local personalities.', image: assets.studio },
  { name: 'The Black Couch Diaries', strapline: 'Current events. Social commentary.', description: 'Stories, social issues and cultural conversations moving through the community right now.', image: assets.panel },
  { name: 'The Unscripted Hour', strapline: 'Nothing rehearsed. Nothing forced.', description: 'An open-format extension built for candid and spontaneous conversation.', image: assets.hero },
];

export const guests = episodes.slice(0, 8).map((episode) => ({ name: episode.guest, detail: `${episode.category} guest`, episode: `Episode ${episode.number}` }));

export const products = [
  { id: 'classic-tee', name: 'The Black Couch Classic Tee', type: 'T-shirts', price: 399, description: 'A proposed heavyweight cotton tee featuring the network mark.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], image: assets.merch },
  { id: 'studio-hoodie', name: 'Studio Hoodie', type: 'Hoodies', price: 699, description: 'A proposed relaxed hoodie inspired by the pieces worn on set.', sizes: ['S', 'M', 'L', 'XL'], image: assets.hoodie },
  { id: 'couch-tumbler', name: 'Couch Tumbler', type: 'Accessories', price: 249, description: 'A proposed insulated tumbler for long-form couch conversations.', sizes: ['One size'], image: assets.tumbler },
];

export const socialLinks = [
  ['YouTube', youtubeSearch('Kingsley Mudau')],
  ['Apple Podcasts', 'https://podcasts.apple.com/in/podcast/the-black-couch-network/id1706011880'],
  ['Instagram', 'https://www.instagram.com/kingsley_mudau/'],
];

export const formatRand = (amount) => `R${amount.toLocaleString('en-ZA')}`;
export const episodeUrl = (episode) => youtubeSearch(`Episode ${episode.number} ${episode.guest}`);
