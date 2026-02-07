import { supabase } from '@/lib/customSupabaseClient';

const BASE_URL = 'https://finnhub.io/api/v1';

// In-memory cache
const priceCache = new Map();
const profileCache = new Map();
const newsCache = new Map();
const recommendationCache = new Map();
const metricCache = new Map();
const CACHE_DURATION = 60000; // 1 minute

export const finnhubService = {
  async getApiKey(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('user_preferences')
      .select('finnhub_api_key')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }
    return data?.finnhub_api_key;
  },

  async getQuote(symbol, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${apiKey}`);
      if (!response.ok) throw new Error('Failed to fetch quote');
      const data = await response.json();
      
      const result = {
        current: data.c,
        change: data.d,
        percentChange: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        prevClose: data.pc
      };

      priceCache.set(symbol, { timestamp: Date.now(), data: result });
      return result;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  },

  async getCompanyProfile(symbol, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    
    const cached = profileCache.get(symbol);
    if (cached) return cached;

    try {
      const response = await fetch(`${BASE_URL}/stock/profile2?symbol=${symbol}&token=${apiKey}`);
      const data = await response.json();
      profileCache.set(symbol, data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async getCandles(symbol, resolution, from, to, apiKey) {
    // resolution: '1', '5', '15', '30', '60', 'D', 'W', 'M'
    if (!apiKey) throw new Error('API key is missing');
    try {
      const url = `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.s === 'ok') {
        return data.t.map((timestamp, index) => ({
          time: new Date(timestamp * 1000).toLocaleDateString(),
          timestamp: timestamp,
          open: data.o[index],
          high: data.h[index],
          low: data.l[index],
          close: data.c[index],
          volume: data.v[index]
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching candles:', error);
      return [];
    }
  },

  async searchSymbols(query, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    try {
      const response = await fetch(`${BASE_URL}/search?q=${query}&token=${apiKey}`);
      const data = await response.json();
      return data.result || [];
    } catch (error) {
      return [];
    }
  },

  async getCompanyNews(symbol, from, to, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    const cacheKey = `${symbol}-${from}-${to}`;
    const cached = newsCache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`);
      const data = await response.json();
      newsCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  },

  async getAnalystRecommendation(symbol, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    const cached = recommendationCache.get(symbol);
    if (cached) return cached;

    try {
      const response = await fetch(`${BASE_URL}/stock/recommendation?symbol=${symbol}&token=${apiKey}`);
      const data = await response.json();
      recommendationCache.set(symbol, data);
      return data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  },
  
  async getBasicFinancials(symbol, apiKey) {
    if (!apiKey) throw new Error('API key is missing');
    const cached = metricCache.get(symbol);
    if (cached) return cached;

    try {
      const response = await fetch(`${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`);
      const data = await response.json();
      metricCache.set(symbol, data);
      return data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return null;
    }
  },

  async getExchangeRates(baseCurrency, apiKey) {
     return { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150 };
  }
};