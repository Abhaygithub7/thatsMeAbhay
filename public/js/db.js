// public/js/db.js
// Client-side Database Manager for Abhay's Portfolio Visitor Gallery.
// Handles seed data, local storage fallback, and optional live Vercel Cloud Firestore syncing.

(function() {
  const DB_KEY = "visitor-cards";
  const HAT_KEY = "sitepet:hat-picks";
  const VALID_COLORS = ["indigo", "teal", "green", "orange"];
  const MAX_NAME_LENGTH = 25;
  const MAX_SIGNATURE_SIZE = 200000; // ~200KB limit for data URIs

  // Pre-populated visitor signature cards (empty now to rely on live data)
  const SEED_CARDS = [];

  // Baseline values for Site Pet hat choices (historical votes)
  const BASELINE_HATS = {
    sprout: 0,
    party: 0,
    cap: 0,
    bucket: 0,
    top: 0
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
