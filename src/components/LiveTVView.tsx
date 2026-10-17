import React, { useState, useRef } from 'react';
import {
  Tv,
  Play,
  Volume2,
  ExternalLink,
  Sparkles,
  Search,
  Flame,
  Globe,
  Radio,
  Compass,
  Film,
  Eye,
  Maximize2,
  RefreshCw,
  Share2,
  Check,
} from 'lucide-react';

export interface TVChannel {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  category: 'music' | 'news' | 'nature' | 'space' | 'fashion' | 'sport';
  categoryLabel: string;
  description: string;
  logo: string;
  thumbnail: string;
  streamUrl?: string;
  youtubeLiveUrl: string;
  officialSiteUrl: string;
  quality: string;
  onlineViewers: string;
}

export const TV_CHANNELS_DATA: TVChannel[] = [
  // ================= МУЗЫКАЛЬНЫЕ ТЕЛЕКАНАЛЫ =================
  {
    id: 'mtv-live',
    name: 'MTV Live HD',
    country: 'Великобритания',
    countryCode: 'GB',
    flag: '🇬🇧',
    category: 'music',
    categoryLabel: 'Музыкальные',
    description: 'Легендарный музыкальный телеканал: живые концерты мировых звезд, фестивали и премьеры клипов 24/7.',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    streamUrl: 'https://stream.deluxemusic.tv/deluxemusic/live.m3u8',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=MTV+Live+Official+Stream',
    officialSiteUrl: 'https://www.mtv.com',
    quality: '1080p Full HD',
    onlineViewers: '24.8k онлайн',
  },
  {
    id: 'deluxe-music',
    name: 'Deluxe Music HD',
    country: 'Германия',
    countryCode: 'DE',
    flag: '🇩🇪',
    category: 'music',
    categoryLabel: 'Музыкальные',
    description: 'Лучшие мировые хиты, качественная поп-, рок- и диско-музыка без бесконечной рекламы.',
    logo: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
    streamUrl: 'https://stream.deluxemusic.tv/deluxemusic/live.m3u8',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=Deluxe+Music+Live',
    officialSiteUrl: 'https://deluxemusic.de',
    quality: '1080p Full HD',
    onlineViewers: '18.4k онлайн',
  },
  {
    id: 'clubbing-tv',
    name: 'Clubbing TV Live',
    country: 'Франция',
    countryCode: 'FR',
    flag: '🇫🇷',
    category: 'music',
    categoryLabel: 'Музыкальные',
    description: 'Первый мировой телеканал клубной музыки: EDM, House, Techno из лучших клубов Ибицы, Парижа и Майами.',
    logo: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@ClubbingTV/live',
    officialSiteUrl: 'https://www.clubbingtv.com',
    quality: '1080p 60FPS',
    onlineViewers: '31.2k онлайн',
  },
  {
    id: 'europa-plus-tv',
    name: 'Europa Plus TV',
    country: 'Россия',
    countryCode: 'RU',
    flag: '🇷🇺',
    category: 'music',
    categoryLabel: 'Музыкальные',
    description: 'Главный хит-парад стран СНГ и Европы, свежие треки ЕвроХит Топ 40 и эксклюзивные интервью артистов.',
    logo: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=Europa+Plus+TV+Live',
    officialSiteUrl: 'https://europaplustv.com',
    quality: '1080p HD',
    onlineViewers: '42.1k онлайн',
  },
  {
    id: 'bridge-tv',
    name: 'Bridge TV Classic',
    country: 'Россия',
    countryCode: 'RU',
    flag: '🇷🇺',
    category: 'music',
    categoryLabel: 'Музыкальные',
    description: 'Золотая коллекция зарубежной и отечественной поп- и рок-классики 80-х, 90-х и нулевых годов.',
    logo: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=Bridge+TV+Live',
    officialSiteUrl: 'https://bridgetv.ru',
    quality: '1080p HD',
    onlineViewers: '19.5k онлайн',
  },
  {
    id: 'music-box',
    name: 'Music Box Russia HD',
    country: 'Россия',
    countryCode: 'RU',
    flag: '🇷🇺',
    category: 'music',
    categoryLabel: 'Музыкальные',
    description: 'Популярный интерактивный музыкальный телеканал, лучшие клипы и интерактивные голосования зрителей.',
    logo: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=Music+Box+Russia+Live',
    officialSiteUrl: 'https://musicboxtv.ru',
    quality: '1080p HD',
    onlineViewers: '15.2k онлайн',
  },
  {
    id: 'qwest-tv',
    name: 'Qwest TV (by Quincy Jones)',
    country: 'Франция',
    countryCode: 'FR',
    flag: '🇫🇷',
    category: 'music',
    categoryLabel: 'Музыкальные',
    description: 'Телеканал Куинси Джонса: первоклассный джаз, соул, фанк, блюз и редкие концертные архивные записи.',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@QwestTV/live',
    officialSiteUrl: 'https://qwest.tv',
    quality: '1080p HD',
    onlineViewers: '11.8k онлайн',
  },

  // ================= НОВОСТНЫЕ ТЕЛЕКАНАЛЫ =================
  {
    id: 'euronews',
    name: 'Euronews HD (Русский)',
    country: 'Европа',
    countryCode: 'EU',
    flag: '🇪🇺',
    category: 'news',
    categoryLabel: 'Новости',
    description: 'Ведущий европейский информационный круглосуточный канал: мировые события, экономика, культура и наука.',
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@euronewsru/live',
    officialSiteUrl: 'https://ru.euronews.com',
    quality: '1080p Full HD',
    onlineViewers: '68.4k онлайн',
  },
  {
    id: 'bbc-news',
    name: 'BBC News Live',
    country: 'Великобритания',
    countryCode: 'GB',
    flag: '🇬🇧',
    category: 'news',
    categoryLabel: 'Новости',
    description: 'Британская телевещательная корпорация: оперативные мировые новости от глобальной сети журналистов.',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@BBCNews/live',
    officialSiteUrl: 'https://www.bbc.com/news',
    quality: '1080p HD',
    onlineViewers: '95.1k онлайн',
  },
  {
    id: 'dw-news',
    name: 'DW News (Deutsche Welle)',
    country: 'Германия',
    countryCode: 'DE',
    flag: '🇩🇪',
    category: 'news',
    categoryLabel: 'Новости',
    description: 'Голос Германии для всего мира: объективный глубокий анализ геополитики, инноваций и технологий.',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@dwnews/live',
    officialSiteUrl: 'https://www.dw.com',
    quality: '1080p HD',
    onlineViewers: '37.8k онлайн',
  },
  {
    id: 'france24',
    name: 'France 24 English / Français',
    country: 'Франция',
    countryCode: 'FR',
    flag: '🇫🇷',
    category: 'news',
    categoryLabel: 'Новости',
    description: 'Французский международный новостной телеканал с акцентом на европейские и ближневосточные процессы.',
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@FRANCE24English/live',
    officialSiteUrl: 'https://www.france24.com',
    quality: '1080p HD',
    onlineViewers: '29.3k онлайн',
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera English Live',
    country: 'Катар',
    countryCode: 'QA',
    flag: '🇶🇦',
    category: 'news',
    categoryLabel: 'Новости',
    description: 'Глобальный новостной канал с обширным освещением международных конфликтов и расследований.',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@aljazeeraenglish/live',
    officialSiteUrl: 'https://www.aljazeera.com',
    quality: '1080p Full HD',
    onlineViewers: '54.6k онлайн',
  },
  {
    id: 'nhk-world',
    name: 'NHK World-Japan',
    country: 'Япония',
    countryCode: 'JP',
    flag: '🇯🇵',
    category: 'news',
    categoryLabel: 'Новости',
    description: 'Японский национальный канал на английском: азиатские новости, культура самураев, хай-тек и туризм.',
    logo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@NHKWORLDJAPAN/live',
    officialSiteUrl: 'https://www3.nhk.or.jp/nhkworld/en/live/',
    quality: '1080p Full HD',
    onlineViewers: '22.7k онлайн',
  },
  {
    id: 'sky-news',
    name: 'Sky News UK Live',
    country: 'Великобритания',
    countryCode: 'GB',
    flag: '🇬🇧',
    category: 'news',
    categoryLabel: 'Новости',
    description: 'Круглосуточный прямой эфир экстренных мировых новостей от британского новостного лидера.',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@SkyNews/live',
    officialSiteUrl: 'https://news.sky.com',
    quality: '1080p HD',
    onlineViewers: '48.9k онлайн',
  },

  // ================= КОСМОС И NASA =================
  {
    id: 'nasa-tv',
    name: 'NASA TV Live (Public & Education)',
    country: 'США',
    countryCode: 'US',
    flag: '🇺🇸',
    category: 'space',
    categoryLabel: 'Космос NASA',
    description: 'Официальный прямой эфир NASA: запуски ракет SpaceX Falcon, выходы космонавтов в открытый космос, посадки на Луну и Марс.',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@NASA/live',
    officialSiteUrl: 'https://www.nasa.gov/live',
    quality: '4K Ultra HD',
    onlineViewers: '87.4k онлайн',
  },
  {
    id: 'iss-live',
    name: 'МКС (ISS) Live Earth Views 24/7',
    country: 'Космос',
    countryCode: 'UN',
    flag: '🪐',
    category: 'space',
    categoryLabel: 'Космос NASA',
    description: 'Прямая HD-трансляция с камер Международной Космической Станции: вид на планету Земля с высоты 420 км.',
    logo: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=ISS+Live+Earth+from+Space+Official',
    officialSiteUrl: 'https://eol.jsc.nasa.gov',
    quality: '1080p HD',
    onlineViewers: '112.3k онлайн',
  },
  {
    id: 'esa-tv',
    name: 'ESA TV (European Space Agency)',
    country: 'Европа',
    countryCode: 'EU',
    flag: '🇪🇺',
    category: 'space',
    categoryLabel: 'Космос NASA',
    description: 'Европейское космическое агентство: телескопы James Webb и Euclid, миссии Ariane 6 и изучение Солнечной системы.',
    logo: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@EuropeanSpaceAgency/live',
    officialSiteUrl: 'https://www.esa.int',
    quality: '1080p HD',
    onlineViewers: '14.5k онлайн',
  },

  // ================= ПРИРОДА И ЖИВОТНЫЙ МИР =================
  {
    id: 'nature-relax',
    name: 'Nature Relaxation 4K TV',
    country: 'США',
    countryCode: 'US',
    flag: '🇺🇸',
    category: 'nature',
    categoryLabel: 'Природа',
    description: 'Успокаивающие 4K видеопейзажи лесов, океанов, водопадов и закатов в сопровождении чистых звуков природы.',
    logo: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=Nature+Relaxation+Live+4K',
    officialSiteUrl: 'https://www.naturerelaxation.com',
    quality: '4K Ultra HD',
    onlineViewers: '39.4k онлайн',
  },
  {
    id: 'explore-nature',
    name: 'Explore Africa Wildlife Live',
    country: 'Кения',
    countryCode: 'KE',
    flag: '🇰🇪',
    category: 'nature',
    categoryLabel: 'Природа',
    description: 'Прямые трансляции с водопоев диких животных в саванне Африки: львы, слоны, жирафы и зебры в естественной среде.',
    logo: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@exploreLiveNatureCams/live',
    officialSiteUrl: 'https://explore.org/livecams',
    quality: '1080p HD',
    onlineViewers: '28.1k онлайн',
  },
  {
    id: 'coral-reef',
    name: 'Oceans & Coral Reef Live TV',
    country: 'Австралия',
    countryCode: 'AU',
    flag: '🇦🇺',
    category: 'nature',
    categoryLabel: 'Природа',
    description: 'Подводный мир Большого Барьерного рифа: коралловые сады, тропические рыбы, скаты и морские черепахи.',
    logo: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=Coral+Reef+Live+Cam',
    officialSiteUrl: 'https://explore.org',
    quality: '1080p HD',
    onlineViewers: '19.8k онлайн',
  },

  // ================= МОДА И СТИЛЬ =================
  {
    id: 'fashion-tv',
    name: 'Fashion TV Paris Live HD',
    country: 'Франция',
    countryCode: 'FR',
    flag: '🇫🇷',
    category: 'fashion',
    categoryLabel: 'Мода',
    description: 'Мировая столица моды 24/7: показы Недели моды в Париже, Милане и Нью-Йорке, топ-модели и кутюрные коллекции.',
    logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@fashiontv/live',
    officialSiteUrl: 'https://www.fashiontv.com',
    quality: '1080p 60FPS',
    onlineViewers: '34.2k онлайн',
  },
  {
    id: 'world-fashion',
    name: 'World Fashion Channel',
    country: 'Италия',
    countryCode: 'IT',
    flag: '🇮🇹',
    category: 'fashion',
    categoryLabel: 'Мода',
    description: 'Тренды высокой моды, закулисье дефиле, эксклюзивные фотосессии и советы стилистов со всего мира.',
    logo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=World+Fashion+Channel+Live',
    officialSiteUrl: 'https://wfc.tv',
    quality: '1080p HD',
    onlineViewers: '16.7k онлайн',
  },

  // ================= СПОРТ =================
  {
    id: 'redbull-tv',
    name: 'Red Bull TV Extreme Sports',
    country: 'Австрия',
    countryCode: 'AT',
    flag: '🇦🇹',
    category: 'sport',
    categoryLabel: 'Спорт',
    description: 'Экстремальный спорт номер один: мотокросс, даунхилл, прыжки с парашютом, серфинг на гигантских волнах и F1.',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@redbull/live',
    officialSiteUrl: 'https://www.redbull.com/tv',
    quality: '1080p 60FPS',
    onlineViewers: '51.3k онлайн',
  },
  {
    id: 'olympic-channel',
    name: 'Olympic Channel Live',
    country: 'Швейцария',
    countryCode: 'CH',
    flag: '🇨🇭',
    category: 'sport',
    categoryLabel: 'Спорт',
    description: 'Официальный олимпийский телеканал МОК: ретроспективы рекордов, квалификационные турниры и истории чемпионов.',
    logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/@Olympics/live',
    officialSiteUrl: 'https://olympics.com/en/channel',
    quality: '1080p HD',
    onlineViewers: '27.6k онлайн',
  },
  {
    id: 'fight-box',
    name: 'FightBox HD Live',
    country: 'США',
    countryCode: 'US',
    flag: '🇺🇸',
    category: 'sport',
    categoryLabel: 'Спорт',
    description: 'Боевые искусства без цензуры: MMA, кикбоксинг, муай-тай, армрестлинг и профессиональный бокс.',
    logo: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&auto=format&fit=crop&q=80',
    streamUrl: '',
    youtubeLiveUrl: 'https://www.youtube.com/results?search_query=FightBox+Live+MMA',
    officialSiteUrl: 'https://fightbox.com',
    quality: '1080p HD',
    onlineViewers: '33.9k онлайн',
  },
];

export const LiveTVView: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<TVChannel>(TV_CHANNELS_DATA[0]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const playerRef = useRef<HTMLDivElement | null>(null);

  const categories = [
    { id: 'all', label: 'Все каналы (35+)', icon: Flame },
    { id: 'music', label: '🎵 Музыкальные', icon: Volume2 },
    { id: 'news', label: '📰 Новости', icon: Globe },
    { id: 'nature', label: '🌿 Природа', icon: Compass },
    { id: 'space', label: '🪐 Космос NASA', icon: Tv },
    { id: 'fashion', label: '👗 Мода', icon: Sparkles },
    { id: 'sport', label: '⚡ Спорт', icon: Film },
  ];

  const filteredChannels = TV_CHANNELS_DATA.filter((channel) => {
    const matchesCat = activeCategory === 'all' || channel.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelectChannel = (channel: TVChannel) => {
    setSelectedChannel(channel);
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleShare = (channel: TVChannel) => {
    navigator.clipboard.writeText(`${channel.name} — ${channel.youtubeLiveUrl || channel.officialSiteUrl}`);
    setCopiedId(channel.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-zinc-950 via-[#0a192f] to-[#041d13] border border-cyan-500/30 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500/20 to-emerald-400/20 text-cyan-300 border border-cyan-400/30">
                SLYNET GLOBAL TV NETWORK
              </span>
              <span className="text-xs text-rose-400 font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                ПРЯМОЙ ЭФИР 24/7
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 text-zinc-950 shadow-lg shadow-cyan-500/30">
                <Tv className="w-7 h-7 stroke-[2.5]" />
              </span>
              <span>Телеканалы мира (Live TV)</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 mt-2 max-w-2xl leading-relaxed">
              Круглосуточные мировые и музыкальные телеканалы: MTV, Deluxe Music, Euronews, BBC, космические трансляции NASA, живая природа, мода и экстремальный спорт с официальным просмотром в 1 клик.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/70 border border-zinc-800 px-4 py-3 rounded-2xl shrink-0 self-start md:self-auto">
            <Tv className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-lg font-bold font-mono text-white">
                {filteredChannels.length}
              </div>
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                ТВ-каналов онлайн
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE TV CHANNEL STAGE PLAYER */}
      <div ref={playerRef} className="rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Stage Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-900/90 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedChannel.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {selectedChannel.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedChannel.categoryLabel}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedChannel.quality}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium truncate max-w-md sm:max-w-xl">
                {selectedChannel.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{selectedChannel.onlineViewers}</span>
            </span>

            <button
              onClick={() => handleShare(selectedChannel)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              title="Скопировать ссылку на канал"
            >
              {copiedId === selectedChannel.id ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Video Screen / Player Frame */}
        <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden flex items-center justify-center group">
          <img
            src={selectedChannel.thumbnail}
            alt={selectedChannel.name}
            className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

          {/* Top Live Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-rose-600/90 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-900/40">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              LIVE HD
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-[11px] font-mono text-zinc-300 border border-white/10">
              {selectedChannel.country}
            </span>
          </div>

          {/* Center Play Screen Action */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center p-6 max-w-lg">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-zinc-950 flex items-center justify-center shadow-2xl shadow-cyan-500/40 transition-transform hover:scale-110 active:scale-95 cursor-pointer">
              <Play className="w-9 h-9 fill-zinc-950 ml-1" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                {selectedChannel.name}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 drop-shadow">
                Прямая официальная трансляция высокой четкости без ограничений
              </p>
            </div>

            {/* Direct Dual Working Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <a
                href={selectedChannel.youtubeLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-rose-900/40 transition-all hover:scale-105 active:scale-95"
              >
                <span>▶️ Официальный Live на YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={selectedChannel.officialSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <span>🌐 Прямой эфир на сайте канала</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES & SEARCH FILTER */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-emerald-400" />
              <span>Каталог мировых телеканалов</span>
            </h2>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
              {filteredChannels.length} каналов
            </span>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск телеканала или страны..."
              className="w-full bg-zinc-900/80 text-xs text-zinc-200 placeholder-zinc-500 pl-8 pr-3 py-2 rounded-xl border border-zinc-800 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHANNELS GRID */}
      {filteredChannels.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 bg-zinc-950/40 rounded-3xl border border-zinc-900">
          <Tv className="w-12 h-12 mx-auto text-zinc-600 mb-3 opacity-50" />
          <h3 className="text-base font-bold text-white mb-1">Телеканал не найден</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Попробуйте изменить поисковое слово или переключить категорию
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredChannels.map((channel) => {
            const isSelected = selectedChannel.id === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => handleSelectChannel(channel)}
                className={`group relative rounded-3xl overflow-hidden cursor-pointer border transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-zinc-900 to-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/30 shadow-xl shadow-cyan-950/40'
                    : 'bg-zinc-950/80 hover:bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
                  <img
                    src={channel.thumbnail}
                    alt={channel.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                  {/* Badges on Thumbnail */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/90 text-white flex items-center gap-1 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-zinc-300 backdrop-blur-sm border border-white/10">
                      {channel.country}
                    </span>
                  </div>

                  {/* Play button overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform font-bold">
                      <Play className="w-6 h-6 ml-0.5 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{channel.flag}</span>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {channel.name}
                      </h3>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {channel.description}
                    </p>
                  </div>

                  {/* Dual Action Buttons on each Card */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="text-emerald-400 font-semibold">{channel.categoryLabel}</span>
                      <span>{channel.onlineViewers}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={channel.youtubeLiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                        title="Официальный прямой эфир на YouTube"
                      >
                        <span>▶️ YouTube</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <a
                        href={channel.officialSiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-semibold text-[10px] flex items-center justify-center gap-1 transition-all"
                        title="Прямой эфир на официальном сайте"
                      >
                        <span>🌐 Сайт</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
