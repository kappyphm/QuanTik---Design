import type { Page } from "@playwright/test";

export async function stubTradingView(page: Page) {
  await page.route("https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js", route => route.fulfill({
    contentType: "application/javascript",
    body: `(() => { const script = document.currentScript; const config = JSON.parse(script.textContent); const frame = document.createElement("iframe"); frame.title = "TradingView"; frame.dataset.symbol = config.symbol; frame.dataset.interval = config.interval; frame.src = "about:blank"; script.parentElement.querySelector(".tradingview-widget-container__widget").append(frame); })();`,
  }));
}

