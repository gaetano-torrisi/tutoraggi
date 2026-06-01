# CLAUDE.md — TutorIA

Guida operativa per lo sviluppo assistito da Claude Code. Questo file viene letto
automaticamente all'inizio di ogni sessione: contiene le regole, l'architettura e
le convenzioni del progetto. **Tienilo aggiornato quando l'architettura cambia.**

---

## Cos'è TutorIA

Applicazione web per la pianificazione e il monitoraggio di progetti formativi
finanziati (tutoraggi, corsi, avvisi/progetti). Stack:

- **Frontend**: React 18 (UMD), JSX transpilato con esbuild
- **Backend**: Firebase Auth + Firestore (Google Cloud)
- **Hosting**: GitHub Pages (HTTPS)
- **Grafici**: Recharts (UMD)
- **Cliente**: EHT — A Harmonic Innovation Group Company

---

## ⚠️ Regole fondamentali

1. **Sviluppo su `test/`, mai modificare `root/` direttamente.** Si lavora e si
   sperimenta nei file dentro `test/`. La promozione a root avviene solo su
   richiesta esplicita dell'utente, copiando i file verificati.
2. **Branch**: si lavora su `main`. Commit con messaggi chiari. Push solo quando
   richiesto / a lavoro completato.
3. **Non si crea una PR** se non esplicitamente richiesto.
4. **Verificare sempre** che il codice non si rompa prima di promuovere (vedi
   sezione "Verifica").

---

## Struttura dei file

Root e `test/` contengono la stessa app; `test/` è la copia di staging.

| File | Ruolo |
|---|---|
| `index.html` | Shell: splash, login, config Firebase, caricamento bundle, registrazione service worker |
| `app.jsx` | App desktop principale. Rileva `isMobile` (≤768px) e fa early-return a `<MobileApp>` |
| `mobile.jsx` | **Albero React separato per smartphone** (sola consultazione). Vedi sezione Mobile |
| `mobile.css` | Stili mobile, tutte le classi con prefisso `.m-` |
| `calendar.jsx` | Calendario desktop (griglia giorno/settimana/mese) |
| `screens.jsx` | Schermate desktop (anagrafiche, insights, impostazioni, AI import) |
| `components.jsx` | Componenti UI condivisi |
| `icons.jsx` | Set di icone SVG (`<Icon name=... />`) |
| `utils.jsx` | Costanti e helper globali (vedi sotto) |
| `tokens.css` | Design token CSS (`--accent`, `--bg-elev`, temi light/dark) |
| `style.css` | Stili desktop |
| `app.bundle.js` | **Generato** da `build.mjs`. È ciò che `index.html` carica in produzione |
| `build.mjs` | Build: concatena e transpila i 7 `.jsx` in `app.bundle.js` (esbuild) |
| `sw.js` | Service worker: cache asset statici |
| `test/mockup-*.html` | Mockup di valutazione — **non** vanno promossi a root |

---

## Flusso di build ⚙️

I `.jsx` sono i **sorgenti modificabili**. Il browser carica `app.bundle.js`,
non i singoli `.jsx`.

```bash
cd test    # (o root, dopo un promote)
npm install        # solo la prima volta (installa esbuild)
npm run build      # rigenera app.bundle.js dai .jsx
```

**Dopo ogni modifica a un `.jsx` va rilanciata la build**, altrimenti il browser
continua a servire la versione precedente. L'ordine di concatenazione in
`build.mjs` è: `icons → utils → components → calendar → screens → mobile → app`
(le dipendenze globali devono essere definite prima dell'uso).

> I `.jsx` usano lo **scope globale condiviso** (non `import`/`export`): una
> costante top-level in `utils.jsx` è visibile in `app.jsx`. La concatenazione +
> transpile preserva esattamente questa semantica. Non introdurre `import`/`export`
> nei `.jsx` senza migrare a un bundler (es. Vite).

---

## Modello dati (Firestore)

Collezioni e nomi dei campi (**case-sensitive, camelCase**):

- **`tutors`** — `{ id, nome, cognome, cf, azienda, color }`
  - Iniziali = prima lettera di `cognome` + prima di `nome`
  - Colore display = campo `color` (hex)
- **`anagraficaCorsi`** — `{ id, nome, codice, colore, stato, dataInizio, dataFine, durataOre, note, avvisoId }`
  - `stato` ∈ `"In corso" | "Concluso" | "Sospeso"`
  - **Il `codice` appartiene all'avviso, non al corso**: se un corso non ha codice
    proprio resta vuoto. (Errore già commesso in passato — non aggiungere fallback
    al codice dell'avviso.)
- **`corsi`** — `{ id, events[] }` con `id` che corrisponde a `anagraficaCorsi.id`.
  Ogni event: `{ id, month, day, start, end, verified, ... }`
- **`avvisi_progetti`** (prop `avvisi`) — `{ id, nome, codice, ente, anno, stato, note }`
  - Collegato da `anagraficaCorsi.avvisoId`
- **`tutEvents`** — struttura `tutEvents[tutorId][monthKey]` = array di eventi
  `{ id, name, day, start, end, ore, tutorId, verified }`
  - `name` = nome del corso (string che combacia con `anagraficaCorsi.nome`)
- **`settings`** — `{ logoBase64, logoWhiteBase64, accentColor, brandNavy, ... }`

Note trasversali:
- **`ore`** non sempre memorizzato: derivabile come `end - start` (ore decimali)
- **`monthKey`** formato `"mag-26"` (abbreviazione mese IT + anno a 2 cifre)
- **`verified`** = boolean sull'evento
- `MONTHS` (in `utils.jsx`): array di `{ key, label, year, month, days }`

---

## Sezione Mobile

`mobile.jsx` è un **albero React autonomo** attivato sotto i 768px. Filosofia:

- **Sola consultazione** (no editing, drag, AI import, verifica, impostazioni
  avanzate — quelle restano desktop-only).
- Riceve i dati già caricati via props da `App` (in `app.jsx`); riusa le util
  globali (`MONTHS`, `fmt`, `fmtOreMin`, `Icon`, ...).
- Schermate: **Calendario** (agenda giorno + striscia giorni), **Tutor**,
  **Corsi**, **Insights** — navigazione con bottom tab bar sempre visibile.
- `.m-app { position:fixed; inset:0 }` per tenere la tab bar sempre visibile sui
  browser mobile (il `100vh` includerebbe la barra indirizzi).
- Topbar (layout "C"): logo + **TutorIA** in font Fraunces, nome schermata come
  sottotitolo muted, avatar a destra.

Per modifiche al mobile basta intervenire su `mobile.jsx` + `mobile.css` (tutto
isolato, prefisso `.m-`). Il desktop non viene toccato.

---

## Convenzioni

- **Regola degli hook**: l'early-return `if(isMobile) return <MobileApp .../>` in
  `app.jsx` deve stare **dopo tutti gli hook** (niente hook condizionali).
- **CSS**: usare i token di `tokens.css`. Classi mobile sempre con prefisso `.m-`.
- **Font**: Fraunces (display/brand), Inter Tight (UI), JetBrains Mono (monospace).
- **Colori brand**: navy `#1A1F4D`, arancio accent `#EC7A26`, bg `#FAF8F4`.
- **Niente segreti nei commit** oltre alla Firebase config (pubblica per design).

---

## Verifica (prima di promuovere)

1. `npm run build` senza errori; `node --check app.bundle.js`.
2. Tutte le reference in `index.html` risolvono a file esistenti.
3. Bundle ricostruito dai sorgenti = byte-identico a quello promosso.
4. Smoke test di rendering (headless) senza errori JS in console.
5. CDN/Firebase: le librerie sono su CDN (a volte bloccate nell'ambiente di
   sviluppo); per test di rendering locale si servono React/ReactDOM da
   `node_modules` e si stubbano `firebase` e `Recharts`.

---

## Stato / roadmap compliance produzione

Vedi il report di produzione (PDF) per il piano completo. In sintesi, da fare a
costo zero prima del go-live: audit Firestore Security Rules, regione EU,
App Check, Privacy Policy, backup automatico (GitHub Actions), CSP. AI Act:
rischio minimo, serve disclosure UI + AI literacy. NIS 2: non applicabile.

---

_Ultimo aggiornamento: 2026-06-01 — dopo il promote di bundle + service worker
(mobile + desktop) su root._
