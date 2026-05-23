// public/js/db.js
// Client-side Database Manager for Abhay's Portfolio Visitor Gallery.
// Handles seed data, local storage fallback, and optional live Vercel Cloud Firestore syncing.

(function() {
  const DB_KEY = "visitor-cards";
  const HAT_KEY = "sitepet:hat-picks";
  const VALID_COLORS = ["indigo", "teal", "green", "orange"];
  const MAX_NAME_LENGTH = 25;
  const MAX_SIGNATURE_SIZE = 200000; // ~200KB limit for data URIs

  // Pre-populated visitor signature cards (30+ to provide rich stats panels)
  const SEED_CARDS = [
    {
      id: "seed_1",
      name: "Bug Hunter",
      color: "teal",
      date: "05/23/26",
      number: 4096,
      timestamp: "2026-05-23T10:15:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M100 130 C120 110, 160 160, 200 130 S240 100, 280 140' stroke='white' stroke-width='3' fill='none' stroke-linecap='round'/></svg>"
    },
    {
      id: "seed_2",
      name: "AI Whisperer",
      color: "indigo",
      date: "05/23/26",
      number: 8820,
      timestamp: "2026-05-23T08:30:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M194 140 C170 100 130 110 130 140 C130 180 194 210 194 210 C194 210 258 180 258 140 C258 110 218 100 194 140 Z' stroke='white' stroke-width='3.2' fill='none'/></svg>"
    },
    {
      id: "seed_3",
      name: "Astro Captain",
      color: "green",
      date: "05/22/26",
      number: 1024,
      timestamp: "2026-05-22T19:40:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M194 80 L210 120 L250 120 L220 145 L235 185 L194 160 L153 185 L168 145 L138 120 L178 120 Z' stroke='white' stroke-width='2.8' fill='none'/></svg>"
    },
    {
      id: "seed_4",
      name: "Trackmania King",
      color: "orange",
      date: "05/22/26",
      number: 7715,
      timestamp: "2026-05-22T14:10:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M80 130 C120 90 160 170 200 130 S280 90 320 130' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_5",
      name: "Siu Master",
      color: "indigo",
      date: "05/21/26",
      number: 3007,
      timestamp: "2026-05-21T21:05:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M110 130 C110 100 150 100 194 130 C238 160 278 160 278 130 C278 100 238 100 194 130 C150 160 110 160 110 130 Z' stroke='white' stroke-width='3.2' fill='none'/></svg>"
    },
    {
      id: "seed_6",
      name: "Diver Jack",
      color: "teal",
      date: "05/21/26",
      number: 1420,
      timestamp: "2026-05-21T11:50:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M150 140 C130 110 100 120 100 140 C100 170 150 190 150 190 C150 190 200 170 200 140 C200 120 170 110 150 140 Z M240 140 C220 110 190 120 190 140 C190 170 240 190 240 190 C240 190 290 170 290 140 C290 120 260 110 240 140 Z' stroke='white' stroke-width='2.6' fill='none'/></svg>"
    },
    {
      id: "seed_7",
      name: "Creative Mind",
      color: "green",
      date: "05/20/26",
      number: 9948,
      timestamp: "2026-05-20T17:22:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M194 130 A10 10 0 0 0 184 130 A20 20 0 0 0 204 130 A30 30 0 0 0 174 130 A40 40 0 0 0 214 130' stroke='white' stroke-width='2.8' fill='none'/></svg>"
    },
    {
      id: "seed_8",
      name: "Ronaldo Fan",
      color: "orange",
      date: "05/20/26",
      number: 7777,
      timestamp: "2026-05-20T09:12:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M100 160 L140 120 L180 160 L220 120 L260 160 L300 120' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_9",
      name: "Cornell Techie",
      color: "indigo",
      date: "05/19/26",
      number: 4882,
      timestamp: "2026-05-19T20:18:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M120 150 C140 100, 180 120, 220 140 S260 160, 300 110' stroke='white' stroke-width='3.2' fill='none'/></svg>"
    },
    {
      id: "seed_10",
      name: "Tennis Lover",
      color: "teal",
      date: "05/19/26",
      number: 2204,
      timestamp: "2026-05-19T13:02:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M110 120 C130 140, 170 90, 210 150 S270 110, 290 130' stroke='white' stroke-width='2.8' fill='none'/></svg>"
    },
    {
      id: "seed_11",
      name: "Clash Master",
      color: "orange",
      date: "05/18/26",
      number: 6224,
      timestamp: "2026-05-18T16:45:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><circle cx='194' cy='126' r='40' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_12",
      name: "Artillery Guru",
      color: "green",
      date: "05/18/26",
      number: 5590,
      timestamp: "2026-05-18T10:04:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M110 100 L278 152 M278 100 L110 152' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_13",
      name: "Optimus Prime",
      color: "indigo",
      date: "05/17/26",
      number: 1017,
      timestamp: "2026-05-17T15:22:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M130 90 H258 V170 H130 Z M130 130 H258' stroke='white' stroke-width='3.2' fill='none'/></svg>"
    },
    {
      id: "seed_14",
      name: "OneD Fan",
      color: "teal",
      date: "05/17/26",
      number: 9918,
      timestamp: "2026-05-17T09:30:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M100 130 C120 180, 200 180, 220 130 S300 80, 320 130' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_15",
      name: "Sabrina C",
      color: "orange",
      date: "05/16/26",
      number: 8240,
      timestamp: "2026-05-16T18:24:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M194 90 C194 90, 140 150, 140 180 A54 54 0 0 0 248 180' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_16",
      name: "Role Model",
      color: "green",
      date: "05/16/26",
      number: 6312,
      timestamp: "2026-05-16T12:05:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M120 120 Q194 70 268 120 T120 170' stroke='white' stroke-width='2.8' fill='none'/></svg>"
    },
    {
      id: "seed_17",
      name: "Age of Empires",
      color: "indigo",
      date: "05/15/26",
      number: 2884,
      timestamp: "2026-05-15T22:15:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M140 100 L248 100 L194 170 Z' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_18",
      name: "Subnautica fan",
      color: "teal",
      date: "05/15/26",
      number: 4432,
      timestamp: "2026-05-15T14:50:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M100 130 C120 150, 260 150, 280 130' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_19",
      name: "Trackmania 2",
      color: "green",
      date: "05/14/26",
      number: 8940,
      timestamp: "2026-05-14T11:05:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M120 150 Q194 210 268 150' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_20",
      name: "Clash Legend",
      color: "orange",
      date: "05/14/26",
      number: 7724,
      timestamp: "2026-05-14T09:12:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M194 70 V190 M134 130 H254' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_21",
      name: "INJI listener",
      color: "indigo",
      date: "05/13/26",
      number: 1044,
      timestamp: "2026-05-13T23:42:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M120 130 Q194 170 268 130' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_22",
      name: "Artillery King",
      color: "teal",
      date: "05/13/26",
      number: 4948,
      timestamp: "2026-05-13T16:15:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M140 100 L248 160 H140' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_23",
      name: "Gradient Wizard",
      color: "green",
      date: "05/12/26",
      number: 3012,
      timestamp: "2026-05-12T13:04:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M140 160 L248 100 H140' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_24",
      name: "Code Crafter",
      color: "orange",
      date: "05/12/26",
      number: 9482,
      timestamp: "2026-05-12T08:12:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M120 100 L120 160 L268 160' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_25",
      name: "Pixel Fanatic",
      color: "indigo",
      date: "05/11/26",
      number: 7748,
      timestamp: "2026-05-11T20:18:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M120 100 H268 L120 160 H268' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_26",
      name: "Subnautica Deep",
      color: "teal",
      date: "05/11/26",
      number: 5520,
      timestamp: "2026-05-11T14:40:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M120 100 H268 V160 H120' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_27",
      name: "Cristiano Fan",
      color: "green",
      date: "05/10/26",
      number: 7107,
      timestamp: "2026-05-10T11:05:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M194 70 L248 190 L140 190 Z' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_28",
      name: "Subway Surf",
      color: "orange",
      date: "05/10/26",
      number: 3004,
      timestamp: "2026-05-10T09:12:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M110 110 H278 V152 H110 Z' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_29",
      name: "Tennis Champ",
      color: "indigo",
      date: "05/09/26",
      number: 8840,
      timestamp: "2026-05-09T22:15:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M120 130 C120 100, 260 100, 260 130 S120 160, 120 130 Z' stroke='white' stroke-width='3' fill='none'/></svg>"
    },
    {
      id: "seed_30",
      name: "Astro Fan",
      color: "teal",
      date: "05/09/26",
      number: 1045,
      timestamp: "2026-05-09T14:50:00.000Z",
      signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='388' height='252'><path d='M140 110 C140 110, 194 70, 194 130 S248 110, 248 110' stroke='white' stroke-width='3.2' fill='none'/></svg>"
    }
  ];

  // Baseline values for Site Pet hat choices (historical votes)
  const BASELINE_HATS = {
    sprout: 333,
    party: 285,
    cap: 170,
    bucket: 148,
    top: 71
  };

  let firestoreDb = null;
  let isFirebaseLoading = false;
  let firebaseLoadedPromise = null;

  // Dynamically load Firebase SDK if configuration exists
  function loadFirebaseSDK() {
    if (firebaseLoadedPromise) return firebaseLoadedPromise;

    firebaseLoadedPromise = new Promise(async (resolve, reject) => {
      if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
        resolve(null);
        return;
      }

      isFirebaseLoading = true;
      try {
        // Load firebase-app compat
        if (typeof firebase === "undefined") {
          await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
          await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js");
        }
        
        const app = firebase.initializeApp(window.firebaseConfig);
        firestoreDb = firebase.firestore(app);
        isFirebaseLoading = false;
        console.log("Firebase Firestore initialized successfully.");
        resolve(firestoreDb);
      } catch (err) {
        console.error("Failed to load Firebase SDK:", err);
        isFirebaseLoading = false;
        resolve(null); // Fallback to LocalStorage
      }
    });

    return firebaseLoadedPromise;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Retrieve local votes from LocalStorage
  function getLocalHatPicks() {
    try {
      return JSON.parse(localStorage.getItem(HAT_KEY) || "{}");
    } catch {
      return {};
    }
  }

  // Database Manager Interface
  const visitorDb = {
    // Check if Firebase is active
    async getDb() {
      return await loadFirebaseSDK();
    },

    // Load visitor cards (combined local/firebase + seeds)
    async loadCards() {
      const db = await this.getDb();
      let userCards = [];

      if (db) {
        try {
          const snapshot = await db.collection("visitor_cards")
                                   .orderBy("timestamp", "desc")
                                   .get();
          snapshot.forEach(doc => {
            const data = doc.data();
            userCards.push({
              id: doc.id,
              ...data
            });
          });
        } catch (err) {
          console.error("Firestore read error. Falling back to LocalStorage:", err);
          userCards = this.loadLocalStorageCards();
        }
      } else {
        userCards = this.loadLocalStorageCards();
      }

      // Merge and sort descend by timestamp/date
      const allCards = [...userCards, ...SEED_CARDS];
      
      // Deduplicate cards by id
      const uniqueMap = new Map();
      allCards.forEach(c => {
        if (!uniqueMap.has(c.id)) {
          uniqueMap.set(c.id, c);
        }
      });

      const deduplicated = Array.from(uniqueMap.values());
      deduplicated.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

      return deduplicated;
    },

    loadLocalStorageCards() {
      try {
        return JSON.parse(localStorage.getItem(DB_KEY) || "[]");
      } catch {
        return [];
      }
    },

    // Save a new visitor card
    async saveCard(cardData) {
      // Sanitize and validate inputs before persisting
      const sanitizedName = String(cardData.name || "").replace(/<[^>]*>/g, "").trim().slice(0, MAX_NAME_LENGTH);
      if (!sanitizedName) {
        throw new Error("Visitor name is required.");
      }

      const sanitizedColor = VALID_COLORS.includes(cardData.color) ? cardData.color : "indigo";
      const sanitizedDate = /^\d{2}\/\d{2}\/\d{2}$/.test(cardData.date) ? cardData.date : new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
      const sanitizedNumber = Math.max(1000, Math.min(9999, Math.floor(Number(cardData.number)) || 1000));
      
      // Validate signature is a safe data URI (SVG or PNG)
      const sig = String(cardData.signature || "");
      const isSafeSig = sig.startsWith("data:image/") && sig.length <= MAX_SIGNATURE_SIZE;
      const sanitizedSignature = isSafeSig ? sig : "";

      const card = {
        name: sanitizedName,
        color: sanitizedColor,
        date: sanitizedDate,
        number: sanitizedNumber,
        signature: sanitizedSignature,
        timestamp: cardData.timestamp || new Date().toISOString()
      };

      const db = await this.getDb();
      if (db) {
        try {
          const ref = await db.collection("visitor_cards").add(card);
          card.id = ref.id;
          console.log("Card saved to Firestore.");
        } catch (err) {
          console.error("Firestore write failed. Saving to LocalStorage:", err);
          this.saveLocalStorageCard(card);
        }
      } else {
        this.saveLocalStorageCard(card);
      }

      // Keep trace of the current user card ID in session
      sessionStorage.setItem("gallery:current_user_card_id", card.id || "local_" + Date.now());
      return card;
    },

    saveLocalStorageCard(card) {
      card.id = card.id || "local_" + Date.now();
      try {
        const saved = JSON.parse(localStorage.getItem(DB_KEY) || "[]");
        saved.unshift(card);
        localStorage.setItem(DB_KEY, JSON.stringify(saved));
      } catch (err) {
        console.error("LocalStorage write failed:", err);
      }
    },

    // Hat picks increment persistence
    async registerHatPick(from, to) {
      // Local tracking
      const picks = getLocalHatPicks();
      if (from && from !== "none" && picks[from] > 0) {
        picks[from]--;
      }
      if (to && to !== "none") {
        picks[to] = (picks[to] || 0) + 1;
      }
      localStorage.setItem(HAT_KEY, JSON.stringify(picks));

      // Optional database logging for Vercel
      const db = await this.getDb();
      if (db) {
        try {
          const docRef = db.collection("hat_picks").doc("aggregates");
          await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            let current = doc.exists ? doc.data() : {};
            if (from && from !== "none") current[from] = Math.max(0, (current[from] || 0) - 1);
            if (to && to !== "none") current[to] = (current[to] || 0) + 1;
            transaction.set(docRef, current, { merge: true });
          });
        } catch (err) {
          console.warn("Firestore hat increment transaction skipped:", err);
        }
      }
    },

    // Load hat selection stats
    async loadHatStats() {
      const stats = { ...BASELINE_HATS };
      const localPicks = getLocalHatPicks();

      // Add local picking
      Object.keys(localPicks).forEach(hat => {
        if (stats[hat] !== undefined) {
          stats[hat] = Math.max(0, stats[hat] + localPicks[hat]);
        }
      });

      // Attempt to load Firestore counts
      const db = await this.getDb();
      if (db) {
        try {
          const doc = await db.collection("hat_picks").doc("aggregates").get();
          if (doc.exists) {
            const data = doc.data();
            Object.keys(data).forEach(hat => {
              if (stats[hat] !== undefined) {
                // Firebase overrides baseline + adds local picks
                stats[hat] = Math.max(0, BASELINE_HATS[hat] + data[hat]);
              }
            });
          }
        } catch (err) {
          console.warn("Failed to load hat aggregates from Firestore:", err);
        }
      }

      return stats;
    }
  };

  // Expose DB interface to global window scope
  window.visitorDb = visitorDb;
  
  // Eagerly try to boot Firebase
  loadFirebaseSDK();
})();
