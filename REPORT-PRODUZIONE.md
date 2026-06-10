# Report Produzione — TutorIA · Stato vivo

> Documento di lavoro aggiornato in corso d'opera. Sostituisce/integra il report
> PDF "Passaggio in Produzione v2" (giugno 2026). Scenario di riferimento:
> **uso interno** (unico superadmin, utenti fidati). Le note "distribuzione esterna"
> del report originale restano valide ma non sono prioritarie qui.
>
> **Legenda stato:** ✅ fatto/verificato · ⏸️ in sospeso (decisione) · ❌ da fare ·
> ⚠️ parziale/da correggere
>
> _Ultimo aggiornamento: 2026-06-10_

---

## 1. Sicurezza

| ID | Voce | Stato | Note |
|---|---|---|---|
| S1 | **Firestore Security Rules** | ✅ verificato | Regole **deployate e solide**: accesso via `authorizedEmails`, ruoli rispettati lato server, catch-all `match /{document=**} { allow read, write: if false }`, `activityLog` immutabile, `settings` scrivibile solo da superadmin. La barriera di sicurezza reale **c'è**. Unica raccomandazione: **versionare le rules nel repo** (`firestore.rules`) — oggi non sono tracciate in git. |
| S3 | **Escalation di privilegio** | ✅ risolto | Le regole su `authorizedEmails` impediscono auto-promozione: create/update/delete del ruolo sono vincolati a `isSuperAdmin()` / `isAdmin()+newRoleNonAdmin()`. Non è più solo controllo UI. |
| S2 | **Chiavi API OpenAI/Gemini in chiaro** | ⚠️ parziale | Esposizione verso utenti autorizzati: **rischio accettato** (solo superadmin, credenziali Google non condivise, niente registrazione libera). **Da correggere però**: la UI dichiara "Salvate cifrate su Firestore" (`screens.jsx:951`) ma **non c'è cifratura** → affermazione falsa verso l'utente. Fix minimo: correggere la dicitura. Fix pulito futuro: doc `settings/secrets` leggibile solo da `isSuperAdmin()`, o proxy server-side (Cloud Function). |
| — | **Regione Firestore EU** | ✅ verificato | Database `(default)` in `eur3` (multi-regione europea). Conforme GDPR. |
| — | **Restrizione API key Firebase + CSP** | ❌ da fare | (a) Restringere la Firebase API key al dominio di produzione in Google Cloud Console → Credentials. (b) Aggiungere `<meta>` CSP in `index.html`. Overhead prestazioni: nullo. **Prossimo step sicurezza consigliato.** |
| — | **Firebase App Check** | ⏸️ in sospeso | Protegge da uso della config Firebase fuori dominio. ~100KB reCAPTCHA + ~100-200ms al primo avvio a freddo. Beneficio basso nello scenario interno → rimandabile. |
| — | **MFA (TOTP)** | ⏸️ opzionale | Fortemente raccomandato per distribuzione esterna. Per uso interno con un account è opzionale. Firebase Auth supporta TOTP nativamente. |
| — | **Service Worker** | ✅ verificato | Solo GET, esclude auth/firestore dalla cache, nessun dato sensibile memorizzato. |

---

## 2. Integrità dati

| ID | Problema | File | Fix |
|---|---|---|---|
| D1 | Cancellare un corso dall'anagrafica lascia **orfani**: resta `corsi/{id}` con gli eventi e gli slot tutoraggio con quel `name` | `app.jsx:434` | Estendere ai corsi la stessa cascata già applicata ai tutor |
| D2 | Cancellare un avviso/progetto lascia i corsi con `avvisoId` pendente | `app.jsx:435` | Bloccare (con conteggio corsi collegati) oppure azzerare `avvisoId` |
| D3 | Cambio `tutorId` di uno slot lo riscrive sotto il **vecchio** documento tutor → incoerenza chiave-doc/campo | `app.jsx` `editTutoraggio` | Move tra documenti, non merge in place |
| D4 | Import AI: un `pushUndo` per **ogni** evento → stack undo intasato, undo "a un evento per volta" | `app.jsx:60` | Un solo `pushUndo` + una scrittura per (tutor, mese) |
| D5 | `overwriteCorsoEvents` non aggiunge l'id a `activeCorsi` → eventi importati invisibili fino a reload | `app.jsx:426` | `setActiveCorsi(...)` come in `addCorso` |
| D6 | Id evento `ave-${Date.now()}` senza indice → id duplicati nello stesso ms | `app.jsx:425` | Suffisso random |

**⚠️ Revisione modifica recente:** l'auto-pulizia degli orfani al caricamento
(`app.jsx:307`) cancella `tutEvents` in modo **irreversibile e fire-and-forget**
(`.catch(()=>{})`), senza undo. Se un caricamento di `tutors` è incompleto,
distrugge dati storici. Da rendere difensiva (pulizia su conferma o con backup
preventivo).

---

## 3. Crash UI (dipendono da dati reali)

| ID | Problema | File | Fix |
|---|---|---|---|
| U1 | Crash di Insights su tutor con nome mancante: `t.nome[0]` senza guardia | `screens.jsx:421` | `t.nome?.[0]||""` |
| U2 | `co.events.reduce` / `e.ore` senza guardia → crash o `NaN` nei grafici | `screens.jsx:217,400-401` | Rendere coerente con `(co.events||[])` / `e.ore||0` |
| U3 | `key` basate su indice negli slot calendario → drag/stato applicati allo slot sbagliato | `calendar.jsx:98-101` | `key={ev.id}` |
| U4 | VerificaScreen: errori calcolati solo al mount, stale finché non premi "Riesegui" | `screens.jsx:43` | `useEffect` sui prop |
| U5 | TimePicker crasha se `value` non è `"HH:MM"` | `components.jsx:71` | Guardia su formato |

---

## 4. Mobile / utils

| ID | Problema | File | Fix |
|---|---|---|---|
| M1 | Mobile: `ore` non derivata da `end-start` come desktop → "0h" su eventi senza ore | `mobile.jsx:332-333` | `ore: e.ore ?? (e.end - e.start)` |
| M2 | `fmt`/`fmtDurata` producono `NaN` con `start`/`end` mancanti | `utils.jsx:79-80` | Guardie su input null |
| M3 | `cleanObj` distrugge Date/Timestamp Firestore (copia campo-campo) | `utils.jsx:97` | Preservare istanze non-plain |

---

## 5. Compliance (GDPR / AI Act)

| Voce | Stato | Note |
|---|---|---|
| Privacy Policy interna | ❌ da fare | Dati trattati (email utenti, nomi/CF tutor), base giuridica, titolare, diritti, conservazione |
| DPA con Google | ❌ da fare | Accettare in Firebase Console → Settings → Data Processing Terms |
| Procedura di cancellazione | ❌ da documentare | Come eliminare un utente da Auth + dati Firestore su richiesta |
| AI Act — disclosure UI (Art. 50) | ⚠️ parziale | Il passaggio di revisione (controllo umano) c'è ✅. Manca la **label esplicita** "Contenuto analizzato con AI (OpenAI/Gemini). Verifica prima di salvare." |
| AI Act — AI literacy (Art. 4) | ❌ da fare | Nota nell'onboarding/documentazione interna |
| Menzione AI nella Privacy Policy | ❌ da fare | I documenti caricati vengono inviati a OpenAI/Google (anche extra-UE) |
| CF come dato sensibile | ⚠️ da presidiare | Non esporre in log o notifiche di errore |

---

## 6. Backup & Database

| Voce | Stato | Note |
|---|---|---|
| Versioning applicativo (in-app) | ✅ presente | Backup/restore dall'interfaccia già esistente |
| Backup automatico schedulato | ❌ da fare | "Backup pianificati" risultano **disattivi** in console. Opzioni: GitHub Actions notturno (`firestore:export`) o backup nativi Firestore. Costo ~zero. |
| PITR (Point-in-Time Recovery) | ⏸️ opzionale | Su piano Blaze, ripristino fino a 7 giorni. Trascurabile per pochi MB. |

---

## 7. Minori / miglioramenti

| Voce | File | Note |
|---|---|---|
| Duplicato `checkAndConfirm`: confronto per `name+day` ignora l'orario → blocca una 2ª sessione legittima lo stesso giorno | `app.jsx:59` | Includere l'orario nel confronto |
| UX: manca empty-state "Nessun corso trovato" in AnaCorsiScreen | `screens.jsx` | Presente nelle altre liste |
| UX: `confirm()` nativo per logout/cancellazioni | vari | Sostituire con dialog dell'app |
| A11y: swatch colore e celle calendario sono `<div onClick>` non navigabili da tastiera | vari | Ruoli/tabindex/keydown |
| A11y: pulsanti icona (x, frecce) senza `aria-label` | vari | Aggiungere label accessibili |
| Enumerazione email: la registrazione distingue "non autorizzata" vs successo | login | Messaggio generico unico |
| `manifest.json` → PWA installabile | `index.html` | ❌ da fare, ~30min, costo zero |

---

## 8. Già completato

- ✅ **CLAUDE.md** — presente e aggiornato
- ✅ **Firestore Security Rules** — deployate e verificate solide
- ✅ **Regione EU** (`eur3`) — conforme GDPR
- ✅ **Service Worker** — analizzato e corretto
- ✅ **NIS 2** — non applicabile (clienti privati, fuori soglie/settori)
- ✅ **Calendario/Verifica** (lavoro recente): slot a zero ore e fuori fascia ora
  visibili come errore; click su errore centra la data (anche in vista settimana);
  domenica segnalata come errore (sabato no); alone lampeggiante esteso ai corsi

---

## 9. Piano d'azione consigliato (uso interno)

1. **Restrizione API key Firebase + CSP** (sicurezza, overhead nullo) — codice + console
2. **Correggere dicitura "Salvate cifrate"** (S2) — onestà verso l'utente, 5 min
3. **Versionare le rules nel repo** (`firestore.rules`) — disaster recovery
4. **Crash UI U1/U2** — fix difensivi rapidi, prevengono crash su dati reali
5. **Integrità dati D1/D2** — cascata cancellazione corsi/avvisi
6. **Backup automatico** (GitHub Actions o nativo Firestore)
7. **manifest.json** → PWA installabile
8. **Privacy Policy + DPA Google + disclosure AI Act** — documenti/UI
9. Resto: D3-D6, U3-U5, M1-M3, a11y, UX — a seguire
