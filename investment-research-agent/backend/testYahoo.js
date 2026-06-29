import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();async function run() {
  try {
    // 1. Search
    const searchResult = await yahooFinance.search('Tesla');
    console.log("Search Result:");
    console.log(searchResult.quotes[0]);

    // 2. quoteSummary
    const ticker = searchResult.quotes[0].symbol;
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'assetProfile']
    });
    console.log("\nQuote Summary:");
    console.log(JSON.stringify(summary, null, 2));

    // 3. historical
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    const historical = await yahooFinance.historical(ticker, {
      period1: oneYearAgo,
      period2: now,
      interval: '1d'
    });
    console.log(`\nHistorical: got ${historical.length} days`);
  } catch (err) {
    console.error(err);
  }
}
run();
