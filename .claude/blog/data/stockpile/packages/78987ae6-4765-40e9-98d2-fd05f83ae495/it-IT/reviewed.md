---
title: "Expo vs React Native Bare per App Aziendali: Guida per PMI Italiane con Costi 2026"
excerpt: "Expo Managed o React Native bare per la tua app aziendale? Criteri operativi, costi reali 2026 in €, distribuzione MDM e quando conviene davvero ognuno."
description: "Expo Managed o React Native bare per la tua app aziendale? Criteri operativi, costi reali 2026 in €, distribuzione MDM e quando conviene davvero ognuno."
slug: expo-react-native-app-aziendale-pmi-italia
locale: it-IT
date: "2026-06-08"
dateModified: "2026-06-08"
canonical: "https://systemforge.it/blog/expo-react-native-app-aziendale-pmi-italia"
published: false
tags: ["Expo", "React Native", "app aziendale PMI"]
relatedService: "sistemi-personalizzati"
stockpile_origin:
  equivalence_id: 78987ae6-4765-40e9-98d2-fd05f83ae495
  package_version: 1
  generated_at: "2026-06-08"
  promoted_at: null
  promoted_in_commit: null
---

# Expo vs React Native Bare per App Aziendali: Guida per PMI Italiane con Costi 2026

Per una PMI italiana, **Expo Managed Workflow** è la scelta giusta nel 2026 nel 70-80% dei casi: costa **10.000-45.000 €** per la build iniziale (contro 25.000-120.000 € per bare React Native o nativo), arriva in produzione in 4-12 settimane e copre le feature standard (auth, push, camera, GPS, deep link, biometria, in-app purchase) senza toccare codice nativo. Il **bare workflow** serve solo se hai un requisito tecnico concreto: moduli nativi custom non disponibili come Expo Module, performance estreme o SDK enterprise legacy. L'errore numero uno è scegliere bare "perché più professionale" senza un motivo reale: paghi 2-3 volte tanto e rallenti la roadmap.

Nei progetti su misura che costruiamo per PMI italiane, lo scenario si ripete: arriva un founder o un IT manager con un preventivo da 80K di un'agency che propone React Native bare, e quasi sempre l'app che vuole davvero costruire sta dentro Expo Managed a un terzo del costo. Questa guida ti dà i criteri per decidere da solo, con prezzi reali in € e senza marketing pro-Expo cieco.

## Expo Managed vs Bare Workflow: cosa cambia davvero

Expo non è un framework separato da React Native: è React Native con sopra un livello di tooling che ti evita di gestire a mano i progetti Xcode e Android Studio. La distinzione che conta per il tuo budget è tra Managed e bare.

### Expo Managed: l'80% delle feature aziendali senza toccare codice nativo

Con il Managed Workflow non apri mai Xcode o Android Studio. Scrivi TypeScript, usi le API Expo (camera, location, notifications, secure store, biometria) e la build avviene in cloud con EAS. Per un'app aziendale tipica (login, liste, dettagli, form, sincronizzazione, notifiche push) questo copre tutto. Aggiungi che puoi spedire aggiornamenti over-the-air senza passare dallo store, e capisci perché per la maggior parte delle PMI è la base di partenza corretta.

### Bare workflow: quando serve metterci le mani

Nel bare workflow hai accesso completo ai progetti nativi iOS e Android. Significa che puoi integrare qualsiasi SDK e scrivere moduli in Swift o Kotlin, ma erediti anche la complessità: gestione manuale delle dipendenze native, build più fragili, CI/CD da configurare. È potenza che paghi in tempo e manutenzione.

### Continuous Native Generation: il middle ground del 2026

La novità che cambia il discorso è la Continuous Native Generation. Con `npx expo prebuild` generi i progetti nativi dal tuo codice Managed quando ti serve. In pratica parti Managed e, se un giorno emerge un requisito che richiede codice nativo, fai il passaggio in poche ore invece di settimane. Non sei in lock-in: questo da solo demolisce l'argomento "meglio partire bare per sicurezza".

### Il mito "bare = più professionale"

Discord, Shopify, Bluesky, Pinterest e Microsoft hanno parti React Native in produzione, alcune con workflow Expo. "Professionale" non è il workflow che scegli: è se l'app fa quello che deve, è manutenibile e arriva in tempo. Un'agency che spinge bare senza saperti dire quale modulo nativo specifico le serve sta difendendo il proprio margine, non il tuo progetto.

## Quando Expo Managed è la scelta giusta

I criteri sono operativi, non ideologici. Se la tua app rientra in questo profilo, Managed è quasi sempre la risposta:

- **Feature standard**: auth, push, GPS, camera, biometria, deep link, in-app purchase, offline-first. Tutte coperte nativamente da Expo SDK 53.
- **Time-to-market sotto le 12 settimane**: EAS Build elimina il setup CI/CD mobile, che da solo vale settimane di lavoro.
- **Team piccolo (1-3 sviluppatori)**: meno superficie nativa da gestire significa che un full-stack solido basta.
- **Budget controllato 10-45K €**: il risparmio rispetto a bare o nativo è strutturale, non marginale.
- **Roadmap incrementale**: rilasci spesso, raccogli feedback, iteri. Gli OTA update di EAS premiano esattamente questo modo di lavorare.

Un dettaglio che spesso sblocca la decisione: se hai già un'app web in Next.js, l'app Expo può condividere i tipi TypeScript e parte della logica con il backend. Lo stesso vale per chi ha costruito una [dashboard KPI in React/Next.js](/blog/dashboard-kpi-aziendale-react-nextjs-costi) e vuole estenderla a mobile senza riscrivere il contratto dati.

## Quando Expo Managed NON basta

L'onestà funziona in entrambe le direzioni. Ci sono casi reali in cui bare è la scelta corretta, e sono identificabili:

1. **Modulo nativo custom non disponibile come Expo Module** — tipicamente un SDK proprietario legacy non più manutenuto, senza wrapper.
2. **Performance estreme** — gaming a 60fps con grafica complessa, realtà aumentata, editing video real-time.
3. **SDK enterprise specifico** — alcuni MDM proprietari o SDK bancari italiani legacy che richiedono integrazione nativa profonda.
4. **Patch su moduli React Native core** — necessità rara per un'app aziendale standard.

Se nessuno di questi quattro si applica, restare su Managed ti fa risparmiare il 30-50% del budget e accelera la roadmap del 30-40%. E grazie alla CNG, se uno di questi requisiti emerge dopo, fai il salto a bare allora, non in via precauzionale oggi.

## Stack Expo consolidato per app aziendali 2026

Lo stack che usiamo come default per le app PMI è maturo e ben supportato:

- **Expo SDK 53 + Expo Router v5**: routing file-based, concettualmente identico a Next.js. Chi conosce il web si orienta subito.
- **TypeScript end-to-end + EAS Build / Submit / Update**: tipi condivisi, build in cloud, OTA integrati.
- **Backend condiviso**: lo stesso Next.js/tRPC del web app, così i tipi del contratto dati vivono in un solo posto.
- **Auth**: Clerk Expo, Supabase Auth o Auth0. Nota importante, NextAuth non è supportato nativamente su React Native, quindi non basare il piano su quello.
- **Storage offline**: AsyncStorage per dati leggeri, `expo-sqlite` per offline-first serio.
- **Notifiche**: Expo Push Service (gratis fino a volumi alti) con fallback Firebase per scenari enterprise.

## Distribuzione: il punto che quasi tutti sottovalutano

Si parla sempre di sviluppo e quasi mai di come l'app arriva sui device. È il punto dove molti progetti si bloccano dopo la consegna. Le strade sono chiare:

- **App Store**: Apple Developer Program 99 €/anno, review tipicamente 24-72h.
- **Play Store**: Google Play Console, 25 € una tantum a vita.
- **TestFlight (iOS)** e **Internal App Sharing (Android)**: gratis con dev account, ideali per beta interne fino a migliaia di tester.
- **MDM** (Microsoft Intune, Jamf, VMware Workspace ONE): l'app viene push-installata sui device aziendali registrati, costi tipici 5-15 €/device/mese.
- **Apple Enterprise Distribution Program**: 299 USD/anno, solo per aziende oltre i 100 dipendenti, app distribuibile esclusivamente all'interno.

> **Da verificare prima di pagare:** Microsoft Intune è già incluso in molte licenze M365 Business. Se la tua azienda usa già Microsoft 365, probabilmente hai l'MDM senza costi aggiuntivi. Controlla prima di sottoscrivere un servizio MDM separato.

Per la maggior parte delle PMI italiane con un'app interna, la combinazione TestFlight + Internal App Sharing + Intune copre il 95% dei casi senza dover esporre l'app al pubblico.

## Costi reali: breakdown per fascia (mercato italiano)

Questi sono range realistici per il mercato italiano 2026, basati su progetti reali e non su listini da brochure:

| Tipo di app | Cosa include | Costo build | Tempi | Team |
|---|---|---|---|---|
| MVP semplice | Auth, lista, dettaglio, push, 1-2 form | 10-20K € | 4-8 sett. | 1 dev |
| Standard | + offline-first, sync, GPS, media, deep link, biometria, in-app purchase | 20-45K € | 8-14 sett. | 1-2 dev |
| Avanzata | + real-time, RBAC complesso, integrazioni custom, tablet, accessibility | 45-80K € | 14-22 sett. | 2 dev + designer |
| Bare custom | + moduli nativi Swift/Kotlin, SDK legacy, white-label multi-tenant | 80-150K € | 20-30+ sett. | 3-5 persone |

Ai costi di build aggiungi la distribuzione (Apple 99 €/anno, Google 25 € una tantum, EAS Production tier consigliato per uso aziendale) e soprattutto la **manutenzione annuale, tipicamente il 15-25% del costo build**. Questo è il numero sottovalutato nove volte su dieci: iOS e Android rilasciano nuove versioni ogni anno, le API si deprecano, e un'app "finita" che non viene aggiornata smette di funzionare nel giro di 12-18 mesi.

Un avvertimento utile: le offerte sotto i 5-8K € per "app aziendale React Native completa" sono quasi sempre template white-label senza un vero data layer né integrazioni. Funzionano nella prima demo e crollano in produzione.

## OTA Updates con EAS: il superpotere di Expo

Con **EAS Update** spedisci aggiornamenti di JavaScript, asset e configurazione direttamente agli utenti, senza passare dalla review dello store. Tempo tipico di un hotfix: 10 minuti contro le 24-72h di una review Apple.

Cosa NON puoi aggiornare via OTA: codice nativo, nuovi permessi (per esempio aggiungere l'accesso alla camera), `Info.plist` / `AndroidManifest`, versione dell'SDK. Quelli richiedono una nuova build e il passaggio dallo store.

> **Policy Apple e Google sugli OTA:** entrambe le piattaforme permettono esplicitamente gli aggiornamenti over-the-air. Apple lo dichiara nelle proprie linee guida. Il limite è non cambiare drasticamente scopo e funzionalità dell'app via OTA. Il pattern enterprise sicuro è il rollout canary: rilasci al 10% degli utenti, monitori i crash, poi porti al 100% in 24-48 ore.

## Caso reale: una PMI logistica del Nord Italia

Una PMI logistica del Nord aveva due app scollegate: una nativa iOS legacy, ormai costosa da manutenere, e un APK Android sviluppato separatamente con feature non allineate. I tecnici in field usavano versioni diverse, e ogni fix richiedeva due interventi e due cicli di review.

Abbiamo sostituito entrambe con un'unica app Expo Managed: codebase singola, tipi condivisi con il backend esistente, distribuzione interna via TestFlight e Intune. Risultato indicativo: gli hotfix che prima richiedevano giorni ora escono via OTA in circa 10 minuti, e il costo di manutenzione annuo si è ridotto in modo sostanziale rispetto a mantenere due basi di codice native parallele. Nessun requisito ha mai richiesto il passaggio a bare.

## Come SystemForge affronta una decisione del genere

Non partiamo dal workflow, partiamo dai requisiti. Il nostro processo per un'app aziendale segue passi precisi, pensati per evitare che tu paghi complessità che non ti serve.

**1. Diagnosi dei requisiti.** Mettiamo nero su bianco le feature reali e le confrontiamo con la copertura nativa di Expo Managed. La domanda chiave è una sola: esiste un requisito tecnico concreto che Managed non copre? Se la risposta è no, la decisione è presa.

**2. Piano di distribuzione fin dall'inizio.** Definiamo prima di scrivere codice come l'app arriverà sui device: store pubblico, TestFlight, Intune o Enterprise Distribution. È la parte che fa fallire i progetti quando viene rimandata.

**3. Stack e codebase condivisa.** Se hai già un web app Next.js, riusiamo tipi e logica per ridurre il lavoro e il rischio di drift tra web e mobile.

**4. Build e roadmap evolutiva.** Consegniamo in fasi con EAS, così vedi l'app crescere e puoi iterare con gli OTA invece di aspettare release monolitiche.

Per orientarti sui costi: una **app standard Expo Managed per PMI si colloca tipicamente nella fascia 20-45.000 €**, con manutenzione annuale tra il 15% e il 25% della build. Ti diamo sempre un breakdown per fase, non un numero unico opaco.

**[Richiedi un preventivo senza impegno](/servizi/sistemi-personalizzati):** se hai già chiaro cosa deve fare la tua app, definiamo insieme feature, target di distribuzione e un range realistico con roadmap evolutiva.

**[Richiedi una diagnosi gratuita](/servizi/sistemi-personalizzati):** se invece non sai ancora se ti serve Expo Managed, bare workflow o magari una PWA, in 30 minuti analizziamo requisiti e budget e ti diciamo cosa ha davvero senso costruire, senza spingerti verso il preventivo più alto.

## Confronto onesto: Expo vs alternative

Per un'app aziendale standard, ecco come si posizionano le opzioni reali sul mercato:

| Opzione | Build | Time-to-market | Team | OTA |
|---|---|---|---|---|
| Expo Managed | 20-45K € | 8-14 sett. | 1-2 dev | Integrato (EAS Update) |
| React Native bare | 30-70K € | 12-20 sett. | 2-3 dev | Via CodePush o EAS bare |
| Flutter | 25-60K € | 10-18 sett. | 1-2 dev | Via terze parti |
| Nativo iOS + Android | 60-120K € | 16-26 sett. | 2-4 dev | No OTA reale |
| PWA | 8-25K € | 4-10 sett. | 1 dev | Web, ma no push iOS robusto |

La PWA merita una nota: è ottima quando ti basta un'esperienza web installabile e non hai bisogno di push iOS affidabili, App Store visibility o integrazioni native ricche. Per un'app interna di sola consultazione può bastare; per la forza vendita in field con notifiche e accesso hardware, no.

## Gli errori più comuni nei progetti app aziendali

1. **Scegliere bare "perché più professionale"** senza un requisito tecnico concreto. Paghi il 30-50% in più senza beneficio.
2. **Ignorare le policy Apple/Google sugli OTA**, rischiando il rifiuto dallo store con aggiornamenti che cambiano troppo l'app.
3. **Non avere un piano di distribuzione**: l'app viene costruita ma poi nessuno sa come installarla sui device aziendali.
4. **Sottostimare la manutenzione**: gli aggiornamenti OS sono obbligatori e le API si deprecano in continuazione.
5. **Promettere "una codebase unica senza compromessi"**: iOS e Android hanno differenze inevitabili, ed è un falso parziale venderlo come slogan.

## Quando affidarsi a un partner e quando farlo in casa

Il criterio è misurabile, non emotivo. Ha senso costruire in casa se hai già un team mobile con esperienza React Native, una pipeline EAS funzionante e qualcuno che conosce le policy degli store. In quel caso un partner serve al massimo per picchi o consulenza puntuale.

Conviene affidarsi a un partner se: è la tua prima app, non hai sviluppatori mobile interni, hai un deadline commerciale (per esempio un deal enterprise bloccato dalla mancanza dell'app), oppure se la decisione Managed-vs-bare ha un impatto da decine di migliaia di euro e vuoi che la prenda chi l'ha già presa decine di volte. La regola pratica: se un errore di architettura ti costa più del compenso del partner, esternalizza la decisione.

## Conclusione

Nel 2026, per la stragrande maggioranza delle PMI italiane, Expo Managed non è un compromesso: è la scelta tecnica corretta che costa meno e arriva prima. Il bare workflow esiste per requisiti precisi, e la Continuous Native Generation ti permette di arrivarci quando serve, senza pagarne il prezzo in anticipo.

Se hai un preventivo da 80K sul tavolo e il dubbio che 25K Expo Managed bastino, [chiedi un preventivo senza impegno](/servizi/sistemi-personalizzati): ti diamo un range onesto con breakdown per fase.

## Domande frequenti

**Expo Managed va bene per un'app aziendale vera o è solo per prototipi?**
Nel 2026 è una scelta enterprise legittima. Aziende come Discord, Shopify e Microsoft usano React Native in produzione, in parte con workflow Expo. Per il 70-80% delle app PMI le feature standard sono coperte nativamente.

**Quanto costa davvero un'app aziendale Expo per una PMI in Italia?**
Range realistico: 10-20K € per un MVP, 20-45K € per un'app standard, 45-80K € per una avanzata. Aggiungi manutenzione annuale del 15-25% e costi di distribuzione (Apple 99 €/anno, Google 25 € una tantum).

**Quando devo passare davvero a React Native bare?**
Solo per quattro motivi concreti: modulo nativo custom non disponibile come Expo Module, performance estreme, SDK enterprise legacy, o patch su moduli core. Se nessuno si applica, resta su Managed e risparmia il 30-50%.

**Posso aggiornare l'app senza passare ogni volta dalla review dello store?**
Sì, con EAS Update spedisci aggiornamenti di JavaScript, asset e configurazione in circa 10 minuti, senza review. Non puoi aggiornare via OTA codice nativo, permessi nuovi o la versione SDK.

**Come distribuisco un'app interna senza App Store pubblico?**
Tre strade: TestFlight (iOS) e Internal App Sharing (Android) gratis con dev account; MDM come Microsoft Intune, spesso già incluso nelle licenze M365; oppure Apple Enterprise Distribution per aziende oltre i 100 dipendenti.

**E se Expo cambia pricing o chiude EAS?**
Rischio gestibile. Con la Continuous Native Generation l'app è portabile a bare in poche ore, EAS Build è sostituibile con CI/CD self-hosted ed EAS Update con CodePush. Non c'è lock-in tecnologico reale.
