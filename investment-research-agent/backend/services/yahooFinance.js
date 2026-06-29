import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

export async function resolveTicker(companyName) {
  try {
    const searchResult = await yahooFinance.search(companyName);
    if (searchResult && searchResult.quotes && searchResult.quotes.length > 0) {
      // Find the first equity result
      const equity = searchResult.quotes.find(q => q.quoteType === 'EQUITY');
      return equity ? equity.symbol : searchResult.quotes[0].symbol;
    }
    return null;
  } catch (error) {
    console.error(`Error resolving ticker for ${companyName}:`, error);
    return null;
  }
}

export async function getFinancials(ticker) {
  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'assetProfile']
    });

    const fd = summary.financialData || {};
    const dks = summary.defaultKeyStatistics || {};
    const sd = summary.summaryDetail || {};
    const ap = summary.assetProfile || {};

    return {
      marketCap: sd.marketCap || null,
      peRatio: sd.forwardPE || sd.trailingPE || null,
      eps: dks.forwardEps || dks.trailingEps || null,
      grossMargin: fd.grossMargins || null,
      operatingMargin: fd.operatingMargins || null,
      netMargin: fd.profitMargins || null,
      roe: fd.returnOnEquity || null,
      roa: fd.returnOnAssets || null,
      totalDebt: fd.totalDebt || null,
      freeCashFlow: fd.freeCashflow || null,
      sector: ap.sector || null,
      industry: ap.industry || null,
      currentPrice: fd.currentPrice || null,
    };
  } catch (error) {
    console.error(`Error getting financials for ${ticker}:`, error);
    return null;
  }
}

export async function getHistoricalPrices(ticker) {
  try {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    // Using chart as recommended by yahoo-finance2 deprecation notices
    const historical = await yahooFinance.chart(ticker, {
      period1: oneYearAgo,
      period2: now,
      interval: '1d'
    });

    if (historical && historical.quotes) {
        return historical.quotes.map(q => ({
            date: q.date,
            close: q.close
        }));
    }
    return [];
  } catch (error) {
    console.error(`Error getting historical prices for ${ticker}:`, error);
    return [];
  }
}
