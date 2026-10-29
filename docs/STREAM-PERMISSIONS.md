# Что станции пишут о своих потоках

Отчёт робота `scripts/permission-scan.mjs` от 2026-10-29.
Проверено станций: 3000, их сайтов: 1617.

| Итог | Сайтов |
|---|---|
| ✅ Прямо разрешают сторонние приложения/плееры | 7 |
| ❌ Прямо запрещают (кандидаты в data/stream-policy.json) | 11 |
| 🟡 Сами дают адрес потока «для вашего плеера» | 142 |
| ❓ Ничего не написано | 1120 |
| — Сайт не открылся / закрыт для роботов | 337 |

> Робот ищет фразы автоматически и может ошибаться — перед решением открывайте страницу по ссылке.
> Запреты в приложении не применяются сами: проверяем и переносим в `data/stream-policy.json`.

## ❌ Запрещают
| Сайт | Станции | Цитата (страница) |
|---|---|---|
| somafm.com | SomaFM Groove Salad (128k MP3), SomaFM Secret Agent (128k MP3), SomaFM Indie Pop Rocks! (128k AAC), Groove Salad 2 (256k MP3), SomaFM Underground 80s (128k MP3) и ещё 25 | «We can't grant permission for third-party SomaFM clients or applications, even noncommercial ones.» ([страница](https://somafm.com/contact/tos.html)) |
| bigrradio.com | Big R Radio - 80s Metal FM | «Please don't record, rebroadcast, re-stream, play our streams in a business as background music for customers, or put our streams in another app, site or player without our written permission.» ([страница](https://www.bigrradio.com/terms/)) |
| aljazeera.com | Al Jazeera - English | «You may not authorise, encourage, permit or assist in any way any third party to copy, reproduce, download, post, store, distribute, transmit, broadcast, commercially exploit or modify in any way, or otherwise infringe any intellectual property rights (or any equivalent or similar rights) in any mat» ([страница](https://www.aljazeera.com/terms-and-conditions/)) |
| streamingsoundtracks.com | StreamingSoundtracks.com | «You may not rebroadcast, rip, syndicate, or redistribute our audio streams without explicit written permission.» ([страница](https://streamingsoundtracks.com/tos.php)) |
| 2000fm.net | 2000 FM - RnB & Hip-Hop | «Please don't record, rebroadcast, re-stream, play our streams in a business as background music for customers, or put our streams in another app, site or player without our written permission.» ([страница](http://www.2000fm.net/terms.html)) |
| cgtn.com | CGTN - English | «You will not share your account information or your user name and password with any third party or permit any third party to logon to the Sites using your account information.» ([страница](https://www.cgtn.com/terms-of-use)) |
| littlive.com | LITT Live - Lofi - Chill & Instrumental Jazz Beats | «In particular, any unauthorized use of copyrighted material within Your Content (including by way of reproduction, distribution, modification, adaptation, public display, public performance, preparation of derivative works, making available or otherwise communicating to the public via the App) witho» ([страница](https://littlive.com/tos)) |
| mixcloud.com | Dutch Delite Drum and Bass | «participate in the Mixcloud social features and communicate with other members of the Mixcloud community (though you may not embed or otherwise exploit Mixcloud widgets for commercial gain, including without limitation selling advertising on your website or otherwise monetising any element of your w» ([страница](https://www.mixcloud.com/terms/)) |
| sleepradio.co.nz | Sleep Radio | «Similarly, any recording, relaying or re-broadcasting of this station's audio feed via website, app or AM/FM/SW/DAB relaying is strictly prohibited without express written permission of the owner of SLEEP RADIO.» ([страница](https://www.sleepradio.co.nz/faqs)) |
| techno-livesets.com | Techno Live Sets | «8- Use the Services or Content, or any portion thereof, for any commercial purpose or for the benefit of any third party or in any manner not permitted by these Terms;» ([страница](https://www.techno-livesets.com/terms-privacy/)) |
| sbs.com.au | SBS Chill | «engage in any activity which could mislead or deceive a person into believing that the Material is from a source other than the Services, including embedding, deep-linking or framing the Material without SBS’s consent.» ([страница](https://www.sbs.com.au/aboutus/terms-and-conditions/)) |

## ✅ Разрешают
| Сайт | Станции | Цитата (страница) |
|---|---|---|
| radiokantipur.com | Kantipur FM | «5.4 Third Party Advertisements : We may use third party companies to serve advertisements on the Services.» ([страница](https://radiokantipur.com/pages/privacy-policy)) |
| shoutcast.flashradio.info | Jazz Lounge | «The player can use the laut.fm stream» ([страница](https://radioplayer.luna-universe.com/lautfm-radio-player-plugin)) |
| r-a-d.io | R/a/dio | «To play the stream in your media player, you can use any of the following links:» ([страница](http://r-a-d.io/help)) |
| houstonpublicmedia.org | Houston Public Media News 88.7 | «If you have an Apple Music subscription , you can play the HPM News stream by saying "Hey Siri play NPR News Houston News Eighty Eight Seven." This command works on iOS devices and on the HomePod.» ([страница](https://www.houstonpublicmedia.org/ways-to-listen/)) |
| ancientfm.com | Ancient FM | «You can support us by telling your friends about us, posting a link on your blog or twitter feed, or sending us an encouraging email; it helps us a lot!» ([страница](https://www.ancientfm.com/)) |
| jointil.com | #joint radio Blues Rock | «You can ask Amazon Alexa or Apple Siri to play the station name, and it will start the stream.» ([страница](https://www.jointil.com/radio/frequently-asked-questions-faq-joint-radio/)) |
| sexsoundradio.com | Sex Sound Radio | «You may not record, redistribute or reuse any part of the stream without permission.» ([страница](https://sexsoundradio.com/terms)) |

## 🟡 Дают адрес потока для плееров
| Сайт | Станции | Цитата (страница) |
|---|---|---|
| radiofrance.fr | France Inter, France Inter, FIP (no pub), FIP (hifi + metadata), France Info и ещё 9 | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| 101smoothjazz.com | 101 SMOOTH JAZZ, 101 SMOOTH JAZZ MELLOW MIX | «101 Smooth Jazz Internet Radio» ([страница](http://101smoothjazz.com/)) |
| swr3.de | SWR3, SWR3 - 96K AAC | «Ihr wollt SWR3 direkt über einen externen Player oder ein Internetradio abrufen? Hier findet ihr alle Infos» ([страница](https://www.swr3.de/musik/webradio/index.html)) |
| esradio.libertaddigital.com | esRadio, EsRadio Principal, EsRadio (AAC HQ) | «iTunes» ([страница](https://esradio.libertaddigital.com/)) |
| dancewave.online | Dance Wave!, Dance Wave Retro!, Dance Wave! | «If your player supports the OGG/Vorbis format, it is recommended to listen to this» ([страница](https://dancewave.online/)) |
| heart.co.uk | Heart 80s, Heart London 106.2 [MP3], Heart 90s, Heart Dance, Heart FM и ещё 6 | «Download 'I Want It That Way' on iTunes» ([страница](https://www.heart.co.uk/terms-conditions/)) |
| lbc.co.uk | LBC UK, LBC Radio, LBC London (National stream), LBC London (London stream) AAC | «How To Listen to LBC On Sonos» ([страница](https://www.lbc.co.uk/article/getting-started-DWyqT6_2/)) |
| einslive.de | 1LIVE, 1LIVE | «Von Kiew auf die Tomorrowland Mainstage: Miss Monique muss man einfach auf dem Schirm haben, wenn es um Progressive House und Melodic Techno geht» ([страница](https://www1.wdr.de/radio/1live/musik/1live-streams/index.html)) |
| capitalfm.com |  CAPITAL - The UK's No.1 Hit Music Station, Capital FM London, Capital XTRA | «Download 'In My Head' on iTunes» ([страница](https://www.capitalfm.com/)) |
| classicfm.com | Classic FM UK, Classic FM HD, Classic FM Calm, Classic FM Movies, Classic FM и ещё 3 | «Download 'Cavatina' on iTunes» ([страница](https://www.classicfm.com/)) |
| franceculture.fr | France Culture | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| fip.fr | FIP, FIP Jazz, FIP Reggae, FIP Groove, FIP Rock и ещё 1 | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| europaplus.ru | Europa Plus, Европа Плюс | «Слушай любимое радио где угодно и когда угодно с новым официальным приложением Европы Плюс! Никаких регистраций, подписок и рекламы — просто скачивай и включай плеер в один клик» ([страница](https://europaplus.ru/app)) |
| radiodimensionemix.torontocast.stream |  # RdMix Classic Rock 70s 80s 90s, # 70s 80s 90s RdMix Network, # RdMix DJSET 70s 80s 90s, # RdMix Italo Disco 80s, #1 RdMix Love Songs | «Categories: Info Tags: android &#183; app &#183; apple &#183; internetradio &#183; ipad &#183; iphone &#183; onlineradio &#183; radioapp &#183; smartphone &#183; tablet» ([страница](https://radiodimensionemix.torontocast.stream/tag/app/)) |
| rac1.cat | RAC1, RAC1 +1 | «Detingut el menor de 17 anys que va crear el canal 'Blocus Vlc' i que incitava a saquejar comerços» ([страница](https://www.rac1.cat/)) |
| radyo7.com | Radyo 7, Radyo 7 Türkü | «(Winamp)» ([страница](https://www.radyo7.com/)) |
| ambientsleepingpill.com | Ambient Sleeping Pill, Ambient Sleeping Pill | «Ambient Sleeping Pill - Internet Radio for Sleep, Meditation & Relaxation» ([страница](https://ambientsleepingpill.com/stream-links)) |
| mygoldmusic.co.uk | Gold | «Download 'Here It Comes Again' on iTunes» ([страница](https://www.goldradio.com/)) |
| radioshanson.ru | Шансон без цензуры, Романтический шансон | «png","Ios","ios","https://itunes» ([страница](https://radioshanson.ru/)) |
| franceinter.fr | France Inter, France Inter, France Inter | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| z100.iheart.com | Z100 - New York's #1 Hit Music Station WHTZ, Z100 - WHTZ-FM 100.3 New York, Z100 WHTZ FM 100.3 New York | «Sonos» ([страница](https://z100.iheart.com/apps/)) |
| fm4.orf.at | FM4 \| ORF \| HQ, FM4 \| ORF | «Du willst Radio FM4 über dein Badezimmerradio, im Auto, mit Internetradio oder einem externen Player empfangen? Hier findest du alle Frequenzen und Streams, die zu Radio FM4 führen» ([страница](https://fm4.orf.at/story/frequenzen-streams100)) |
| radioclassique.fr | Radio Classique | «sur Itunes» ([страница](https://www.radioclassique.fr/comment-ecouter-radio-classique-frequence-appli/)) |
| br.de | BR24, Bayern 1 Oberbayern, Bayern 2, Bayern 1 Franken, Bayern 1 Niederbayern / Oberpfalz и ещё 4 | «Webradio im eigenen Player starten:» ([страница](https://www.br.de/radio/br24/service/sendefrequenzen/index.html)) |
| smoothradio.com | Smooth Radio, Smooth Chill, Smooth Country, Smooth Radio London 102.2 | «Download 'Sailing' on iTunes» ([страница](https://www.smoothradio.com/)) |
| dfm.ru | DFM Дискач 90-х, DFM RUSSIAN DANCE, DFM, DFM - Vocal Trance, DFM - Party | «SWANKY TUNES / SHOWLAND» ([страница](https://dfm.ru/)) |
| oldie-antenne.de | OLDIE ANTENNE | «80er 90er OLDIE ANTENNE Internetradio \| 80er 90er OLDIE ANTENNE» ([страница](https://www.oldie-antenne.de/programm/so-hoert-ihr-uns/internet-radio)) |
| bossajazzbrasil.com | Bossa Jazz Brasil | «I live between Switzerland and Panama and in both places, I always have it on SONOS, throughout the house» ([страница](https://bossajazzbrasil.com/)) |
| asiadreamradio.torontocast.stream | Jazz Sakura (asia dream radio) | «\| どうぞごゆっくりお楽しみください \| asia DREAM radio plays more current J-Pop Top Forty tracks than any other J-Pop internet radio station \| Stations also available on Apple Music, TuneIn, radio» ([страница](https://asiadreamradio.torontocast.stream/stations/en/index.html)) |
| hellorayo.co.uk |  KISSTORY: Non-Stop Old Skool & Anthems, Greatest Hits Radio, PLANET ROCK: Where Rock Lives, Magic Radio UK, KISS - The Best Vibes & Energy и ещё 6 | «com/559859956","is_featured":false,"showId":18586,"title":"KISS Dance at Tomorrowland","description":"Mixes and highlights direct from one of the most iconic dance music festivals in the world» ([страница](https://www.hellorayo.co.uk/kisstory)) |
| kissfm.ro | Kiss Fm, Kiss Fm Ro, Kiss Fm | «Ascultă în WinAmp» ([страница](https://www.kissfm.ro/)) |
| ffh.de | Hit Radio FFH, Hit Radio FFH - 80er | «Smartspeaker: Alexa+, Google, Sonos» ([страница](https://www.ffh.de/musik/webradio/42-ffh-leider-geil.html)) |
| hrhradio.com | Hard Rock Heaven | «Hard Rock Heaven is the best 80s rock and metal internet radio station because we go deep in the genre and play all the commercial bands and songs we love, plus those that were not so big but also kick ass» ([страница](https://www.hrhradio.com/)) |
| dorognoe.ru | Дорожное радио, дорожное радио (Dorognoe Radio) | «Удобный минималистичный интерфейс, запуск плеера в один клик, стабильный звук и работа в фоновом режиме – приложение создано для комфортного прослушивания в любом ритме жизни» ([страница](https://dorognoe.ru/radiostation/mobile-app)) |
| rusradio.ru | Русское Радио | «webp\",\"828\":\"/b/d/XS_d975tAlMTaNZKMjesWp5sKuUPUw0CdoKmPd7GV5nvNwe0Y21o10ROCTMBoxQZhTpBpL_7WaXQC8Omvy2GX15bEG0PwNABBUM=Ll_zxNPR4KyK5xT5xVLCrA» ([страница](https://rusradio.ru/)) |
| radiox.co.uk | Radio X, Radio X Classic Rock | «Download 'Stand By Me (Acoustic)' on iTunes» ([страница](https://www.radiox.co.uk/how-to-listen/getting-started/)) |
| deutschlandfunknova.de | Deutschlandfunk Nova \| DLF \| AAC 192k, Deutschlandfunk Nova \| DLF \| MP3 128k | «spotify itunes soundcloud amazon deezer podcast» ([страница](https://www.deutschlandfunknova.de/info/empfang)) |
| radiomap.eu | Европа плюс | «You can copy streaming link to the multiplatform VLC Player» ([страница](https://radiomap.eu/about/faq)) |
| skyradio.nl | Sky Radio, Sky Radio Christmas, Sky Radio 101 FM, Sky Radio 80's Hits | «Tik op iTunes & App Store» ([страница](https://www.skyradio.nl/online-radio/app)) |
| radiobollyfm.in | Radio BollyFm | «Bollywood Radio: India’s Live 24×7 Bollywood Internet Radio, This is a tribute to all Hindi music singers, lyrics writers, music composers who contributed and laid foundation of Bollywood music and made it popular» ([страница](https://www.radiobollyfm.in/)) |
| ukhozifm.co.za | Ukhozi FM S.A | «VIA ITUNES» ([страница](https://www.ukhozifm.co.za/ukhozifm/frequently-asked-questions/)) |
| ambientmodern.com | Ambient Modern | «an internet radio stream featuring modern organic textures» ([страница](https://ambientmodern.com/stream-links)) |
| capitaldance.com |  CAPITAL DANCE: The UK's Official Dance Station, Capital Dance | «Download 'Pushing On' on iTunes» ([страница](https://www.capitaldance.com/)) |
| madein80.fr | Made in 80 | «WINAMP» ([страница](https://madein80.fr/la-radio-made-in-80/)) |
| radiobob.de | RADIO BOB! Classic Rock, RADIO BOB! BOBs Alternative Rock, Radio BOB - Nu Metal (mp3 192), RADIO BOB! Livestream National, RADIO BOB - Power Metal и ещё 6 | «im iTunes App Store» ([страница](https://www.radiobob.de/radiobob/mybob-app)) |
| jawharafm.net | Jawhara FM | «Ecoute la radio sur Windows Media Player Ecoute la radio sur Itunes» ([страница](https://www.jawharafm.net/ar/webradio/webradio2/216)) |
| radioparty.pl | Radioparty.pl Dj Mixes Party, Radio Party - Kanał Główny, Radioparty.pl Energy2000, Radioparty.pl | «Winamp 128kbps» ([страница](https://radioparty.pl/kanaldjmixes)) |
| francemusique.fr | France Musique, France Musique, France Musique La Baroque, France Musique \| Classique Easy | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| mouv.fr | Mouv' | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| radio886.at | radio 88.6, 88.6 Hard Rock, 88.6 Classic Rock | «Windows Media Player» ([страница](https://radio886.at/Backstage/Empfang/Webstreams?page=Webstreams&content=headerpreview)) |
| oldiesinternetradio.com | Oldies Internet Radio - Online - www.oldiesinternetradio.com - Grupo Digital Retroland - Monterrey, Nuevo León | «Oldies Internet Radio» ([страница](https://oldiesinternetradio.com/)) |
| magicfm.ro | Magic Fm, Magic FM Romania, Magic FM 90s Hits, Magic Party Mix | «Ascultă în WinAmp» ([страница](https://www.magicfm.ro/)) |
| europafm.ro | Europa FM, Europa FM Romania, Europa FM | «În cazul în care preferi să asculţi Europa FM într-un player extern, poţi folosi VLC, Windows Media Player, Winamp sau orice alt player care suportă standardul ACC+ Ascultă Europa FM online în playerul preferat» ([страница](https://www.europafm.ro/club-vip/faq/cum-asculti-europa-fm/)) |
| rtbf.be | RTBF La Première, Classic21, RTBF Classic 21, RTBF Classic 21, Tipik | «follow\"}],[\"$\",\"meta\",\"4\",{\"name\":\"verify-v1\",\"content\":\"ElLCgmAk3WnVju9JjouVvTCR41cgLBDl92yuPIQ1KTI=\"}],[\"$\",\"meta\",\"5\",{\"name\":\"apple-itunes-app\",\"content\":\"app-id=412453498, app-argument=https://www» ([страница](https://www.rtbf.be/lapremiere)) |
| beachfm.co.jp | Shonan Beach FM 78.9 湘南ビーチ, Shonan Beach FM 78.9 | «サイマルラジオを視聴するためには、Windows Media Playerが必要です。» ([страница](https://www.beachfm.co.jp/about/help/)) |
| berliner-rundfunk.de | Berliner Rundfunk 91.4 | «Unseren Livestream empangen Sie zum Beispiel mit dem kostenlosen Programm VideoLan VLC media player» ([страница](https://www.berliner-rundfunk.de/programm/empfang)) |
| hpr.org | HPR1: Traditional Classic Country | «Live Radio Channels (choose your player and bandwidth)» ([страница](https://hpr.org/listen/)) |
| generations.fr | Generations Rap FR Gold, Generations Funk, Génération JUL, Generations Rap U.S, Générations 90 и ещё 1 | «Sa fille Blue Ivy l'a rejoint sur scène au piano, pendant que Beyoncé, Kelly Rowland et Michelle Williams dansaient ensemble dans les loges» ([страница](https://generations.fr/news)) |
| hr-inforadio.de | HR Info, HR Info, HR Info | «Abgesehen vom Livestream auf der Website können Sie hr INFO auch mit einem externen Player, beispielsweise dem VLC-Player, abspielen» ([страница](https://www.hr-inforadio.de/livestream/index.html)) |
| britishcomedyradio.org | BritCom 1 - British Comedy Radio (Pumpkin FM OTRN), BritCom 3 - British Comedy Radio (Pumpkin FM OTRN), BritCom 2 - British Comedy Radio (Pumpkin FM OTRN) | «We recommend Winamp for Windows desktop PC&#8217;s» ([страница](https://britishcomedyradio.org/how-to-tune-in/)) |
| cadenaser.com | Cadena Ser + Madrid, Cadena Ser +, Cadena SER Sevilla, Cadena SER Coruña, Cadena SER - Radio Valencia и ещё 1 | «La Policía Nacional detiene al creador de los canales &#x27;Blocus Vlc&#x27; en los que instigaba a saquear comercios de València» ([страница](https://cadenaser.com/)) |
| radiolabelleaventure.com | Radio La Belle Aventure | «VLC, iTunes, Winamp ou une enceinte connectée : ajoutez simplement l'adresse de notre flux, indiquée dans la FAQ» ([страница](https://www.radiolabelleaventure.com/)) |
| hits1radio.com | Hits 1 Algérie | «Écoutez avec iTunes» ([страница](https://www.hits1radio.com/nous-ecouter/)) |
| noisefm.ru | Noise FM - EDM Radio | «плеере» ([страница](https://noisefm.ru/)) |
| pakfilmi.com | Radio Pak Filmi | «Winamp or I-Tunes» ([страница](https://www.pakfilmi.com/)) |
| music.yojosuknam.com | yojosuknam Radio | «다른 앱(VLC, 라디오 앱, 스마트 스피커 등)에서 들으려면 이 주소를 넣으세요» ([страница](https://music.yojosuknam.com/radio)) |
| myradio24.com | Pyongyang FM Radio | «&lt;!--PLAYER - Блок расположения плеера» ([страница](https://myradio24.com/en/set/69366)) |
| discovertrance.com | DiscoverTranceRadio (MP3 HQ stereo 192kBit/s) | «Winamp (firewall safe) uk» ([страница](https://www.discovertrance.com/tunein.aspx)) |
| edmdnb.com | DnB&EDM | «AIMP» ([страница](https://edmdnb.com/help-faq)) |
| ostseewelle.de | Ostseewelle , Ostseewelle Live Radio | «WLAN-Radio» ([страница](https://www.ostseewelle.de/empfang/)) |
| antennebrandenburg.de | Antenne Brandenburg | «Stars bei Antenne Brandenburg - bei iTunes» ([страница](https://www.antennebrandenburg.de/programm/hoeren/podcasts/antenne_star_interviews/Antenne_Star_Interviews.html)) |
| gyusyabu.ddo.jp | Retro PC GAME MUSIC Streaming Radio | «-winamp,iTunes系他» ([страница](http://gyusyabu.ddo.jp/MP3/MP3.html)) |
| radiocultural.org | Radio Cultural TGN | «Windows Media Player» ([страница](http://www.radiocultural.org/site/)) |
| amfmph.com | Christmas Radio Philippines - Powered By www.amfmph.net | «Internet Radio» ([страница](https://www.amfmph.com/k5-news-fm-tanjay-20070.html)) |
| newstalkzb.co.nz | Newstalk ZB | «If you're using another voice assistant such as a Bixby device, Bose Sonos or any other device, you'll be able to find Newstalk ZB by asking:» ([страница](https://www.newstalkzb.co.nz/on-demand/listen-via-alexa-smart-speakers/)) |
| hirschmilch.de | Hirschmilch Radio Prog-House, Hirschmilch Radio Psytrance, Hirschmilch Radio Progressive, Hirschmilch Radio | «24/7 Chillout Electronic Hypnotic Organic-House Prog-House Progressive Psytrance Techno Internet Radio Streams » Hirschmilch» ([страница](https://hirschmilch.de/homepage)) |
| absolutradio.de | Absolut Relax, Absolut Germany, Absolut Top 2000ER, Absolut Germany | «Amazon Echo, Sonos oder BOSE Sound Systeme, Smart TVs, Apple TV, Google Chromecast oder Amazon Fire TV – mit der Radioplayer App könnt ihr uns über all diese Geräte (und noch vie» ([страница](https://absolutradio.de/empfang)) |
| fmradiomanele.ro | Radio Manele FM | «Poti asculta Radio Manele Romania gratuit,oricand si oriunde in lume prin diverse metode ( Linux , Windows , Winamp ,Android, iOS , SmartTv )» ([страница](https://fmradiomanele.ro/)) |
| absolutechillout.com | Absolute Chillout | «Absolute Chillout Internet Radio» ([страница](http://www.absolutechillout.com/)) |
| beautifulmusicstation.blogspot.com | BEAUTIFUL Instrumentals | «If you have an Internet radio, radio app or similar device add our code» ([страница](https://beautifulmusicstation.blogspot.com/)) |
| channel955.iheart.com | Channel 955 | «Sonos» ([страница](https://channel955.iheart.com/apps/)) |
| libertaddigital.com | es radio | «Cae el líder de Blocus Vlc: un menor que preparaba una "oleada de saqueos" en Valencia» ([страница](https://www.libertaddigital.com/)) |
| lan.fm | Club Hits 2000s | «Свой плеер M3U MP3 XSPF» ([страница](https://www.lan.fm/)) |
| rockfm.ro | RockFM | «Ascultă în WinAmp» ([страница](https://www.rockfm.ro/)) |
| chillofi-radio.dez.ovh | Chillofi Radio: relax & study beats, Chillofi radio | «fr myTuner VLC» ([страница](https://www.kalizoradio.com/radio/lofi/)) |
| maximum.ru | Радио Maximum | «jpg\",\"64\":\"/b/d/XS_d975tAlYUYNZKKDy-Eo5uJ-xCQwkOdoKmPd7GV5nvNwe0Y21o10ROCTMBoxQZhTpBpL_7WaXQC8Omvy2GX15bEG0PwNABBUM=u9sQkSM1IWaKuEwvlcDdbA» ([страница](https://maximum.ru/)) |
| moshhead.org |  Mosh Head Black Metal ID | «Internetradio laut» ([страница](https://moshhead.org/enslaved-reveal-collaborative-track-spirit-helper/)) |
| 891fm.co.il | Первое радио 89.1FM | «app_android app_iphone app_itunes app_mediaplayer» ([страница](https://www.891fm.co.il/)) |
| radiopilatus.ch | Radio Pilatus | «Um Radio Pilatus übers Internet zu hören, nutzt du die Livestream-URLs für dein Internetradio» ([страница](https://www.radiopilatus.ch/ueber-uns/radio-pilatus-dab-und-digital-weltweit-empfangen-140227836)) |
| sunshineradio.ie | Sunshine 106.8 | «SONOS: Listen via your SONOS system using our Direct URLs (below) and these instructions» ([страница](https://www.sunshineradio.ie/on-air/listen-live-help/)) |
| rnz.co.nz | RNZ National AAC (128kbps) | «iTunes, VLC)» ([страница](https://www.rnz.co.nz/listen/amfm)) |
| wrko.iheart.com | WRKO-AM 680 | «Sonos» ([страница](https://wrko.iheart.com/apps/)) |
| mixify.in | MixiFy Hindi Hits | «Download and open in VLC, Winamp, or any desktop player» ([страница](https://www.mixify.in/)) |
| djam.radio | Djam Radio - Flac 1411 Kbps | «POUR ECOUTER AVEC SONOS :» ([страница](https://www.djam.radio/%C3%A9couter)) |
| electroswing-radio.com | Electro Swing Revolution | «WIFI RADIOS & OTHER DEVICES» ([страница](https://electroswing-radio.com/listen/)) |
| weatherusa.net | NOAA Weather Radio - Dallas, Texas (KEC56) | «400 KNAMedia - Internet Radio from Charleston, West Virginia -- Listen» ([страница](https://www.weatherusa.net/radio)) |
| hitfm.ru | HIT FM | «в Melon Top 100**\r\n\r\nНовый сингл NMIXX «Birthday Wish» дебютировал на пятой строчке главного корейского чарта Melon, а мини-альбом «Strange Muse» возглавил iTunes Top Album в Сингапуре и Гонконге» ([страница](https://hitfm.ru/)) |
| danceclassics.co.uk | Dance Classics UK | «Open stream in your own player © 2026 Dance Classics · danceclassics» ([страница](https://danceclassics.co.uk/)) |
| grittyrockradio.com | Gritty Rock Radio | «iTunes» ([страница](https://www.grittyrockradio.com/en/how-to-listen-to-gritty-rock-radio)) |
| generationdiscofunk.com | GENERATION SOUL DISCO FUNK RADIO | «Apple Music \| FilterMusic \| Radioguide internet radio \| Radioline \| TuneIn \| Radio» ([страница](https://radiogoodlife.com/event/musicologyle-03-12-2022-a-la-bellevilloise-paris/)) |
| topradio.be | TOPradio Belgium | «Herbeleef de legendarische Tomorrowland set van Avicii uit 2011» ([страница](https://www.topradio.be/)) |
| spoonradio.com | Spoon Radio | «Achat sur iTunes» ([страница](https://www.spoonradio.com/)) |
| classynetradio.com | CLASSY NetRadio | «CLASSY NetRadio is an internet radio station based in Surabaya, Indonesia, dedicated to providing high-quality, High Definition audio entertainment» ([страница](https://classynetradio.com/)) |
| voiceofvashon.org | Vashon Island Alerts 1650 AM - Vashon Island, Washington | «On iTunes (for iPhone, iPad and iPod Touch):» ([страница](https://voiceofvashon.org/vov-app/)) |
| gold1043.com.au | Gold 104.3 | «The free iHeart app is now available on over 200 platforms including web, IOS, Android, Alexa, Sonos and in the car&#x2026;» ([страница](https://www.gold1043.com.au/entertainment/how-to-listen-to-us-on-your-smart-speakers/)) |
| rslradio.fm | RSL Radio | «jpg&url_achat=https://itunes» ([страница](http://www.rslradio.fm/musiques)) |
| goodnews.org.tw | 佳音經典音樂網 | «安裝 VLC Player 軟體» ([страница](http://www.goodnews.org.tw/faqs.php)) |
| sanjaydeshpande.com | Sandesh Radio | «Sandesh Radio is a pioneer internet radio exclusively dedicated to pure forms of Indian Classical music like instrumental and vocal music, basically focusing on unexplored talents across the globe» ([страница](http://www.sanjaydeshpande.com/sandeshradio.htm)) |
| dieneue1077.de | DIE NEUE 107.7 Rock & Pop | «Sonos Lautsprecher» ([страница](https://dieneue1077.de/radio-hoeren)) |
| ranfm.lk | Ran FM | «Listen in your favourite player» ([страница](https://ranfm.lk/)) |
| spreeradio.de | 105'5 Spreeradio | «Internetradio» ([страница](https://www.spreeradio.de/)) |
| liquiddnbstation.ucoz.net | Liquid DnB Station | «Слушать в своем плеере» ([страница](https://liquiddnbstation.ucoz.net/)) |
| lounge.fm | Lounge.FM - 100% Austria | «LoungeFM App im iTunes Store» ([страница](https://www.lounge.fm/empfangen/app/)) |
| 24-7nicheradio.com | 24-7 The ’60s, 24-7 Reggae, 24-7 Psychedelic Rock | «Internet Radio» ([страница](https://24-7nicheradio.com/audiogallery/24-7-the-60s/)) |
| new.brg-radio.com | Bridge Radio - 华语 HITS | «Tomorrowland Academy DJ Contest Perform at Tomorrowland» ([страница](https://new.brg-radio.com/news/btss-jungkook-streams-games-hes-played/)) |
| darkambientradio.de | Dark Ambient Radio (96k AAC+) | «pls file to open in your media player» ([страница](https://darkambientradio.de/news.php)) |
| 80sforever.radio | 80s Forever - We Keep The 80s Alive | «Winamp / iTune s: http://azuracast» ([страница](https://www.80sforever.radio/how-to-listen/)) |
| cinemix.us | Cinemix | «iTunes/Apple» ([страница](https://www.cinemix.us/content/view/94/132/lang,en/)) |
| labgateradio.com | Labgate - Progressive Rock, Labgate P.YG. Pink Floyd, Yes, Genesis | «Click on the link according to your player or use ours» ([страница](https://labgateradio.com/accueil/progressive-rock/)) |
| indiexfm.com | Indie X FM | «We are also available via Alexa and Sonos!» ([страница](https://indiexfm.com/)) |
| u7radio.org | The Very Best Of Art Bell - U7 Radio (U7Radio.org) | «U7 Radio provides 3 streams of 24/7 internet radio — including the Very Best of Art Bell» ([страница](https://u7radio.org/)) |
| inselradio.com | Inselradio Mallorca  | «Damit unterstützen wir auch nahezu alle Empfangsgeräte wie Sonos, Bose, Google, Alexa und Co» ([страница](https://www.inselradio.com/infos/ueber-uns/empfang)) |
| houseoffunk.eu | House of Funk | «Listen Open stream in your media player» ([страница](https://houseoffunk.eu/)) |
| controradio.it | Controradio | «Winamp, iTunes https://s4» ([страница](https://www.controradio.it/streaming-come-ascoltare-controradio/)) |
| lebonmix.radio | Le Bon Mix HiFi Flac 1411 Kbps | «- En rentrant l'URL sur votre ordinateur dans le lecteur multim&eacute;dia VLC ou FooBar2000 (PC et Mac), avec un DAC en USB pour &eacute;coute au casque filaire ou vers un syst&egrave;me son amplifi&eacute; :» ([страница](https://www.lebonmix.radio/hifi)) |
| renseradio.com | Rense Radio Network | «Choose From Your Favorite Media Player:» ([страница](https://www.renseradio.com/listenlive.php)) |
| scifi-otr.weebly.com | SciFi Old Time Radio | «You can find us streaming on the following Internet radio platforms» ([страница](http://scifi-otr.weebly.com/)) |
| italo.dance | Fantasy Italo Dance 90s radio | «WinAmp» ([страница](https://italo.dance/)) |
| meinkinderradio.at | Radino - Mein Kinderradio Wien 103,2 | «Kennt Dein Internetradio unsere Adresse schon?» ([страница](https://www.meinkinderradio.at/empfang/)) |
| vocaloidradio.com | Vocaloid Radio (320kbps) | «24/7 VOCALOID INTERNET RADIO» ([страница](https://vocaloidradio.com/)) |
| radiomaya.blogspot.com | Radio Campursari Yogyakarta | «Streaming Radio Campursari Jogjakarta ini tidak autoplay, silahkan klik play media player dan tunggu beberapa saat» ([страница](https://radiomaya.blogspot.com/2018/08/streaming-radio-campursari-jogjakarta.html?m=1)) |
| radiotvornica.hr | Radio Tvornica | «Winamp,» ([страница](https://www.radiotvornica.hr/)) |
| kiyimuzik.com | KIYI Muzik | «Ayrıca Kıyı Müzik'i iTunes Radio'da Contemporary Adult kategorisi altında bulabilirsiniz» ([страница](https://kiyimuzik.com/radyo/)) |
| kissfmuk.com | KISS UK | «com/559859956","is_featured":false,"showId":18586,"title":"KISS Dance at Tomorrowland","description":"Mixes and highlights direct from one of the most iconic dance music festivals in the world» ([страница](https://www.hellorayo.co.uk/kiss)) |
| kissfm.md | Kiss FM Moldova | «Ascultă în WinAmp» ([страница](https://www.kissfm.md/)) |
| country108.com | Country 108 | «Streaming URLs für Internetradio-Empfänger (Internetradios, FRITZ!Fon …) oder Player-Software (VLC, Winamp …):» ([страница](https://www.country108.com/)) |
| 60north.radio | 60 NORTH RADIO - FLAC | «It is a great way to start but we do recommend that a dedicated player such as VLC would be our preferred way to listen» ([страница](https://60north.radio/technical/new-flac-cdn-delivered-streams/)) |
| republicbroadcasting.org | RBN - Republic Broadcastin Network | «or with &#8220;INTERNET RADIOS&#8221;!» ([страница](http://republicbroadcasting.org/listen-live/)) |
| notisistema.com | Fórmula Melódica (Guadalajara) - 97.9 FM - XETIA-FM - Grupo Unidifusión - Guadalajara, JC | «Flash Player --> iTunes Windows Media VideoLan Player» ([страница](https://www.notisistema.com/formulamelodica/)) |
| madmix.se | Relax & Meditation | «Internet Radio: 40+ channels covering a wide range of genres» ([страница](https://madmix.se/legal)) |
| 70sdisconights.com | +70s Disco Nights Radio (MTY) - Online - www.70sdisconights.com - Grupo Digital Retroland - Monterrey, Nuevo León | «Listen on your own player» ([страница](https://70sdisconights.com/)) |
| radio.macinmind.com | Antioch OTR | «iTunes/Music use File or Advanced menu--Open Stream» ([страница](https://radio.macinmind.com/)) |
