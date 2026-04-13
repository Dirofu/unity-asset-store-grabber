// Unity Asset Store Grabber — Content Script

(function () {
  "use strict";

  const LOG_PREFIX = "[USG]";
  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  // ── CSRF Token ──────────────────────────────────────────────────────
  function getCsrfToken() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; _csrf=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  // ── GraphQL: Add asset to library ───────────────────────────────────
  async function grabAsset(packageId) {
    const csrf = getCsrfToken();
    if (!csrf) throw new Error("Not logged in (no CSRF token)");

    const res = await fetch("https://assetstore.unity.com/api/graphql", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrf,
        "x-requested-with": "XMLHttpRequest",
        "x-source": "storefront, storefront",
      },
      body: JSON.stringify({
        query: `mutation AddToDownload($id: String!) {
          addToDownload(id: $id) {
            id
            userOverview { lastDownloadAt: last_downloaded_at }
            userEntitlement { id orderId grantTime }
          }
        }`,
        variables: { id: String(packageId) },
        operationName: "AddToDownload",
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0]?.message || "GraphQL error");
    return data;
  }

  // ── Extract package ID from href ────────────────────────────────────
  function extractPackageId(href) {
    if (!href) return null;
    // New format: /packages/package/65817
    const matchNew = href.match(/\/packages\/package\/(\d+)/);
    if (matchNew) return matchNew[1];
    // Old format: /packages/category/slug-name-123456
    const parts = href.split("-");
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) return last;
    return null;
  }

  // ── Find all product cards (article elements) ───────────────────────
  function getAllProductCards() {
    // Cards are <article> elements containing a link with data-test="product-card-name"
    const cards = [];
    const articles = document.querySelectorAll("article");
    const seenIds = new Set();

    for (const article of articles) {
      const link = article.querySelector('a[data-test="product-card-name"]');
      if (!link) continue;

      const href = link.getAttribute("href");
      const packageId = extractPackageId(href);
      if (!packageId || seenIds.has(packageId)) continue;
      seenIds.add(packageId);

      cards.push({ card: article, packageId, href });
    }

    return cards;
  }

  // ── Check if card is free and not yet owned ─────────────────────────
  function isFreeAndAvailable(card) {
    const text = card.textContent || "";
    // textContent concatenates without spaces, so "3DFree" won't match \bFree\b
    // Just check if "Free" appears anywhere in the card text
    const isFree = text.includes("Free");
    const isOwned =
      text.includes("Open in Unity") ||
      text.includes("Import") ||
      text.includes("Owned");
    return isFree && !isOwned;
  }

  // ── Inject Grab button into a card ──────────────────────────────────
  function injectGrabButton(card, packageId) {
    if (card.querySelector(".usg-grab-btn")) return;

    const btn = document.createElement("button");
    btn.className = "usg-grab-btn usg-grab-ready";
    btn.textContent = "Grab";
    btn.dataset.packageId = packageId;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      btn.disabled = true;
      btn.className = "usg-grab-btn usg-grab-loading";
      btn.textContent = "...";

      try {
        await grabAsset(packageId);
        btn.className = "usg-grab-btn usg-grab-success";
        btn.textContent = "Done";
        grabbedCount++;
        try {
          chrome.runtime.sendMessage({ type: "updateBadge", count: grabbedCount });
        } catch (_) {}
        log(`Grabbed asset #${packageId}`);
      } catch (err) {
        btn.className = "usg-grab-btn usg-grab-error";
        btn.textContent = "Error";
        btn.title = err.message;
        log(`Error grabbing #${packageId}:`, err.message);
        setTimeout(() => {
          btn.disabled = false;
          btn.className = "usg-grab-btn usg-grab-ready";
          btn.textContent = "Grab";
          btn.title = "";
        }, 3000);
      }
    });

    // Insert button into the image area (first child div with the image)
    const imgContainer = card.querySelector(".relative.aspect-3\\/2");
    if (imgContainer) {
      imgContainer.appendChild(btn);
    } else {
      // Fallback: card itself is position:relative already
      card.style.position = "relative";
      card.appendChild(btn);
    }
  }

  // ── Scan page and inject buttons ────────────────────────────────────
  let grabbedCount = 0;

  function scanAndInjectButtons() {
    const products = getAllProductCards();
    let injected = 0;

    for (const { card, packageId } of products) {
      if (card.querySelector(".usg-grab-btn")) continue;
      if (!isFreeAndAvailable(card)) continue;

      injectGrabButton(card, packageId);
      injected++;
    }

    if (injected > 0) {
      log(`Injected ${injected} Grab button(s), total cards: ${products.length}`);
    }

    updateGrabAllButton();
  }

  // ── "Grab All" floating button ──────────────────────────────────────
  let grabAllBtn = null;

  function createGrabAllButton() {
    grabAllBtn = document.createElement("button");
    grabAllBtn.id = "usg-grab-all";
    grabAllBtn.textContent = "Grab All Free";
    grabAllBtn.style.display = "none";

    grabAllBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const buttons = document.querySelectorAll(".usg-grab-btn.usg-grab-ready");
      if (buttons.length === 0) return;

      grabAllBtn.disabled = true;
      grabAllBtn.textContent = `Grabbing 0/${buttons.length}...`;

      let done = 0;
      for (const btn of buttons) {
        btn.click();
        done++;
        grabAllBtn.textContent = `Grabbing ${done}/${buttons.length}...`;
        await new Promise((r) => setTimeout(r, 600));
      }

      grabAllBtn.textContent = `Done! (${done})`;
      setTimeout(() => {
        grabAllBtn.disabled = false;
        updateGrabAllButton();
      }, 3000);
    });

    document.body.appendChild(grabAllBtn);
  }

  function updateGrabAllButton() {
    if (!grabAllBtn) return;
    const count = document.querySelectorAll(".usg-grab-btn.usg-grab-ready").length;
    if (count > 0) {
      grabAllBtn.textContent = `Grab All Free (${count})`;
      grabAllBtn.style.display = "block";
    } else {
      grabAllBtn.style.display = "none";
    }
  }

  // ── Polling + MutationObserver for SPA ──────────────────────────────
  let debounceTimer = null;
  let pollInterval = null;
  let pollAttempts = 0;

  function startPolling() {
    pollInterval = setInterval(() => {
      pollAttempts++;
      scanAndInjectButtons();

      // After 60s stop aggressive polling, rely on MutationObserver
      if (pollAttempts >= 60 && pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        log("Polling stopped, MutationObserver active");
      }
    }, 1000);
  }

  function initObserver() {
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(scanAndInjectButtons, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Init ────────────────────────────────────────────────────────────
  function init() {
    log("Extension loaded on", window.location.href);
    createGrabAllButton();
    scanAndInjectButtons();
    startPolling();
    initObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
