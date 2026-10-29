# Что станции пишут о своих потоках

Отчёт робота `scripts/permission-scan.mjs` от 2026-10-29.
Проверено станций: 300, их сайтов: 212.

| Итог | Сайтов |
|---|---|
| ✅ Прямо разрешают сторонние приложения/плееры | 0 |
| ❌ Прямо запрещают (кандидаты в data/stream-policy.json) | 4 |
| 🟡 Сами дают адрес потока «для вашего плеера» | 28 |
| ❓ Ничего не написано | 143 |
| — Сайт не открылся / закрыт для роботов | 37 |

> Робот ищет фразы автоматически и может ошибаться — перед решением открывайте страницу по ссылке.
> Запреты в приложении не применяются сами: проверяем и переносим в `data/stream-policy.json`.

## ❌ Запрещают
| Сайт | Станции | Цитата (страница) |
|---|---|---|
| somafm.com | SomaFM Groove Salad (128k MP3), SomaFM Secret Agent (128k MP3), SomaFM Indie Pop Rocks! (128k AAC) | «We can't grant permission for third-party SomaFM clients or applications, even noncommercial ones.» ([страница](https://somafm.com/contact/tos.html)) |
| inforadio.de | Inforadio | «Am Berliner Hauptbahnhof und knapp 40 weiteren Stationen war Alkohol trinken bereits seit mehreren Wochen verboten.» ([страница](https://www.inforadio.de/)) |
| dfm.ru | DFM Дискач 90-х, DFM RUSSIAN DANCE | «Администратор также оставляет за собой одностороннее право удалить с Сайта материалы и/или информацию, не запрещенные напрямую условиями Соглашения, однако признанные Администратором несоответствующими политике Администратора в отношении содержания материалов и/или информации, либо неоднозначными, в» ([страница](https://dfm.ru/page/license-agreement)) |
| bigrradio.com | Big R Radio - 80s Metal FM | «Please don't record, rebroadcast, re-stream, play our streams in a business as background music for customers, or put our streams in another app, site or player without our written permission.» ([страница](https://www.bigrradio.com/terms/)) |

## ✅ Разрешают
_нет_

## 🟡 Дают адрес потока для плееров
| Сайт | Станции | Цитата (страница) |
|---|---|---|
| radiofrance.fr | France Inter | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| 101smoothjazz.com | 101 SMOOTH JAZZ | «101 Smooth Jazz Internet Radio» ([страница](http://101smoothjazz.com/)) |
| swr3.de | SWR3 | «Ihr wollt SWR3 direkt über einen externen Player oder ein Internetradio abrufen? Hier findet ihr alle Infos» ([страница](https://www.swr3.de/musik/webradio/index.html)) |
| esradio.libertaddigital.com | esRadio | «iTunes» ([страница](https://esradio.libertaddigital.com/)) |
| heart.co.uk | Heart 80s, Heart London 106.2 [MP3], Heart 90s, Heart Dance | «Download 'Sugar' on iTunes» ([страница](https://www.heart.co.uk/80s/)) |
| dancewave.online | Dance Wave! | «If your player supports the OGG/Vorbis format, it is recommended to listen to this» ([страница](https://dancewave.online/)) |
| lbc.co.uk | LBC UK | «How To Listen to LBC On Sonos» ([страница](https://www.lbc.co.uk/article/getting-started-DWyqT6_2/)) |
| einslive.de | 1LIVE, 1LIVE | «Von Kiew auf die Tomorrowland Mainstage: Miss Monique muss man einfach auf dem Schirm haben, wenn es um Progressive House und Melodic Techno geht» ([страница](https://www1.wdr.de/radio/1live/musik/1live-streams/index.html)) |
| capitalfm.com |  CAPITAL - The UK's No.1 Hit Music Station, Capital FM London | «Download 'Undressed' on iTunes» ([страница](https://www.capitalfm.com/)) |
| classicfm.com | Classic FM UK | «Download ''Una furtiva lagrima'' on iTunes» ([страница](https://www.classicfm.com/faq/)) |
| franceculture.fr | France Culture | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| fip.fr | FIP | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| europaplus.ru | Europa Plus | «Слушай любимое радио где угодно и когда угодно с новым официальным приложением Европы Плюс! Никаких регистраций, подписок и рекламы — просто скачивай и включай плеер в один клик» ([страница](https://europaplus.ru/app)) |
| radiodimensionemix.torontocast.stream |  # RdMix Classic Rock 70s 80s 90s | «Categories: Info Tags: android &#183; app &#183; apple &#183; internetradio &#183; ipad &#183; iphone &#183; onlineradio &#183; radioapp &#183; smartphone &#183; tablet» ([страница](https://radiodimensionemix.torontocast.stream/tag/app/)) |
| radyo7.com | Radyo 7 | «(Winamp)» ([страница](https://www.radyo7.com/)) |
| rac1.cat | RAC1 | «Detingut el menor de 17 anys que va crear el canal 'Blocus Vlc' i que incitava a saquejar comerços» ([страница](https://www.rac1.cat/)) |
| ambientsleepingpill.com | Ambient Sleeping Pill | «Ambient Sleeping Pill - Internet Radio for Sleep, Meditation & Relaxation» ([страница](https://ambientsleepingpill.com/stream-links)) |
| mygoldmusic.co.uk | Gold | «Download 'Killing Me Softly' on iTunes» ([страница](https://www.goldradio.com/)) |
| radioshanson.ru | Шансон без цензуры | «png","Ios","ios","https://itunes» ([страница](https://radioshanson.ru/)) |
| franceinter.fr | France Inter | «Du contrepoint sacré de Cererols à la poésie intime de Dowland, Clément Rochefort réunit onze jalons emblématiques du répertoire baroque» ([страница](https://www.radiofrance.fr/ecouter-musique/classique)) |
| z100.iheart.com | Z100 - New York's #1 Hit Music Station WHTZ | «Sonos» ([страница](https://z100.iheart.com/apps/)) |
| radioclassique.fr | Radio Classique | «sur Itunes» ([страница](https://www.radioclassique.fr/comment-ecouter-radio-classique-frequence-appli/)) |
| fm4.orf.at | FM4 \| ORF \| HQ | «Du willst Radio FM4 über dein Badezimmerradio, im Auto, mit Internetradio oder einem externen Player empfangen? Hier findest du alle Frequenzen und Streams, die zu Radio FM4 führen» ([страница](https://fm4.orf.at/story/frequenzen-streams100)) |
| br.de | BR24, Bayern 1 Oberbayern | «Webradio im eigenen Player starten:» ([страница](https://www.br.de/radio/br24/service/sendefrequenzen/index.html)) |
| smoothradio.com | Smooth Radio | «Download 'It Must Have Been Love' on iTunes» ([страница](https://www.smoothradio.com/)) |
| oldie-antenne.de | OLDIE ANTENNE | «80er 90er OLDIE ANTENNE Internetradio \| 80er 90er OLDIE ANTENNE» ([страница](https://www.oldie-antenne.de/programm/so-hoert-ihr-uns/internet-radio)) |
| bossajazzbrasil.com | Bossa Jazz Brasil | «I live between Switzerland and Panama and in both places, I always have it on SONOS, throughout the house» ([страница](https://bossajazzbrasil.com/)) |
| hellorayo.co.uk |  KISSTORY: Non-Stop Old Skool & Anthems | «com/559859956","is_featured":false,"showId":18586,"title":"KISS Dance at Tomorrowland","description":"Mixes and highlights direct from one of the most iconic dance music festivals in the world» ([страница](https://www.hellorayo.co.uk/kisstory)) |
