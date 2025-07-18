chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openURLs") {
    const urls = message.urls;
    urls.forEach((url, i) => {
      setTimeout(() => {
        const validURL = /^https?:\/\//.test(url) ? url : "https://" + url;
        chrome.tabs.create({ url: validURL });
      }, i * 500); // throttle
    });
  }
});
