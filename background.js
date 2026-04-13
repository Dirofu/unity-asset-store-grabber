// Unity Asset Store Grabber — Background Service Worker

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateBadge" && sender.tab) {
    chrome.action.setBadgeText({
      text: message.count > 0 ? String(message.count) : "",
      tabId: sender.tab.id,
    });
    chrome.action.setBadgeBackgroundColor({ color: "#43a047" });
  }
});
