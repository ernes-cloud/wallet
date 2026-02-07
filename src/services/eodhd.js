import { supabase } from '@/lib/customSupabaseClient';

const BASE_URL = 'https://eodhd.com/api';

// In-memory cache
const priceCache = new Map();
const historicalCache = new Map();
const fundamentalCache = new Map();
const newsCache = new Map();
const tickersCache = new Map();
const CACHE_DURATION = 60000; // 1 minute

export const eodhdService = {
  async getApiKey(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('user_preferences')
      .select('eodhd_api_key')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }
    return data?.eodhd_api_key;
  },

  async getQuote(ticker, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    
    const cached = priceCache.get(ticker);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      // EODHD Live API v2 format: /real-time/{TICKER}?api_token={API_KEY}&fmt=json
      const response = await fetch(`${BASE_URL}/real-time/${ticker}?api_token=${apiKey}&fmt=json`);
      if (!response.ok) throw new Error('Failed to fetch quote');
      const data = await response.json();
      
      // Transform EODHD response to match expected format
      const result = {
        current: data.close || 0,
        change: data.change || 0,
        percentChange: data.change_p || 0,
        high: data.high || 0,
        low: data.low || 0,
        open: data.open || 0,
        prevClose: data.previousClose || 0,
        volume: data.volume || 0
      };

      priceCache.set(ticker, { timestamp: Date.now(), data: result });
      return result;
    } catch (error) {
      console.error(`Error fetching quote for ${ticker}:`, error);
      throw error;
    }
  },

  async getHistoricalData(ticker, period, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    
    const cacheKey = `${ticker}-${period}`;
    const cached = historicalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const today = new Date();
      let fromDate = new Date();
      
      // Calculate date range based on period
      switch(period) {
        case '1D':
          fromDate.setDate(today.getDate() - 1);
          break;
        case '1W':
          fromDate.setDate(today.getDate() - 7);
          break;
        case '1M':
          fromDate.setMonth(today.getMonth() - 1);
          break;
        case '3M':
          fromDate.setMonth(today.getMonth() - 3);
          break;
        case '6M':
          fromDate.setMonth(today.getMonth() - 6);
          break;
        case '1Y':
          fromDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          fromDate.setMonth(today.getMonth() - 1);
      }

      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = today.toISOString().split('T')[0];

      // EODHD End-of-Day API: /eod/{TICKER}?from={FROM}&to={TO}&period=d&api_token={API_KEY}&fmt=json
      const response = await fetch(
        `${BASE_URL}/eod/${ticker}?from=${fromStr}&to=${toStr}&period=d&api_token=${apiKey}&fmt=json`
      );
      
      if (!response.ok) throw new Error('Failed to fetch historical data');
      const data = await response.json();
      
      // Transform to match expected format for charts
      const result = data.map(item => ({
        time: new Date(item.date).toLocaleDateString(),
        timestamp: new Date(item.date).getTime() / 1000,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));

      historicalCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      return [];
    }
  },

  async getFundamentalData(ticker, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    
    const cached = fundamentalCache.get(ticker);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      // EODHD Fundamentals API: /fundamentals/{TICKER}?api_token={API_KEY}&fmt=json
      const response = await fetch(`${BASE_URL}/fundamentals/${ticker}?api_token=${apiKey}&fmt=json`);
      if (!response.ok) throw new Error('Failed to fetch fundamental data');
      const data = await response.json();
      
      // Transform to match expected format
      const result = {
        profile: {
          name: data.General?.Name || '',
          ticker: ticker,
          exchange: data.General?.Exchange || '',
          sector: data.General?.Sector || '',
          industry: data.General?.Industry || '',
          description: data.General?.Description || '',
          weburl: data.General?.WebURL || '',
          ipo: data.General?.IPODate || '',
          marketCapitalization: data.Highlights?.MarketCapitalization || 0,
          finnhubIndustry: data.General?.Industry || ''
        },
        metric: {
          peTTM: data.Highlights?.PERatio || 0,
          dividendYieldIndicatedAnnual: data.Highlights?.DividendYield ? data.Highlights.DividendYield * 100 : 0,
          '52WeekHigh': data.Highlights?.['52WeekHigh'] || 0,
          '52WeekLow': data.Highlights?.['52WeekLow'] || 0,
          beta: data.Technicals?.Beta || 0,
          bookValue: data.Highlights?.BookValue || 0,
          epsEstimateCurrentYear: data.Highlights?.EarningsShare || 0
        }
      };

      fundamentalCache.set(ticker, { timestamp: Date.now(), data: result });
      return result;
    } catch (error) {
      console.error(`Error fetching fundamentals for ${ticker}:`, error);
      return null;
    }
  },

  async searchTickers(query, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    
    try {
      // EODHD Search API: /search/{QUERY}?api_token={API_KEY}&limit=10
      const response = await fetch(`${BASE_URL}/search/${encodeURIComponent(query)}?api_token=${apiKey}&limit=15`);
      if (!response.ok) throw new Error('Failed to search tickers');
      const data = await response.json();
      
      // Transform to match expected format
      return data.map(item => ({
        symbol: item.Code,
        displaySymbol: `${item.Code}.${item.Exchange}`,
        description: item.Name,
        type: item.Type || 'Common Stock'
      }));
    } catch (error) {
      console.error('Error searching tickers:', error);
      return [];
    }
  },

  async getNews(ticker, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    
    const cached = newsCache.get(ticker);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const today = new Date();
      const fromDate = new Date();
      fromDate.setDate(today.getDate() - 7);
      
      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = today.toISOString().split('T')[0];

      // EODHD News API: /news?s={TICKER}&from={FROM}&to={TO}&api_token={API_KEY}&fmt=json
      const response = await fetch(
        `${BASE_URL}/news?s=${ticker}&from=${fromStr}&to=${toStr}&api_token=${apiKey}&fmt=json&limit=20`
      );
      
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      
      // Transform to match expected format
      const result = data.map(item => ({
        id: item.link || Math.random().toString(),
        headline: item.title,
        summary: item.content || item.title,
        url: item.link,
        source: item.source || 'News',
        datetime: new Date(item.date).getTime() / 1000,
        image: item.image || null
      }));

      newsCache.set(ticker, { timestamp: Date.now(), data: result });
      return result;
    } catch (error) {
      console.error(`Error fetching news for ${ticker}:`, error);
      return [];
    }
  },

  async getSupportedTickers(exchange = 'US', apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    
    const cacheKey = `tickers-${exchange}`;
    const cached = tickersCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) { // Cache for 1 hour
      return cached.data;
    }

    try {
      // EODHD Exchange Symbol List: /exchange-symbol-list/{EXCHANGE}?api_token={API_KEY}&fmt=json
      const response = await fetch(`${BASE_URL}/exchange-symbol-list/${exchange}?api_token=${apiKey}&fmt=json`);
      if (!response.ok) throw new Error('Failed to fetch supported tickers');
      const data = await response.json();
      
      // Transform to match expected format
      const result = data.map(item => ({
        symbol: item.Code,
        name: item.Name,
        exchange: item.Exchange,
        type: item.Type
      }));

      tickersCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (error) {
      console.error('Error fetching supported tickers:', error);
      return [];
    }
  },

  // Compatibility methods
  async getCompanyProfile(ticker, apiKey) {
    const data = await this.getFundamentalData(ticker, apiKey);
    return data?.profile || null;
  },

  async getAnalystRecommendation(ticker, apiKey) {
    // EODHD doesn't have direct analyst recommendations
    // Return empty array to maintain compatibility
    return [];
  },

  async getBasicFinancials(ticker, apiKey) {
    const data = await this.getFundamentalData(ticker, apiKey);
    return data || null;
  },

  async getCandles(ticker, resolution, from, to, apiKey) {
    // Map resolution to period for EODHD
    const period = this.mapResolutionToPeriod(resolution);
    return await this.getHistoricalData(ticker, period, apiKey);
  },

  mapResolutionToPeriod(resolution) {
    const map = {
      '1': '1D',
      '5': '1D',
      '15': '1D',
      '30': '1D',
      '60': '1W',
      'D': '1M',
      'W': '6M',
      'M': '1Y'
    };
    return map[resolution] || '1M';
  }
};