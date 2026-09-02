import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CURRENCY_METADATA,
  formatCurrencyPrice,
  convertPrice
} from '../services/currencyService';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  // Always lock to PKR
  const [currency] = useState('PKR');
  const [baseCurrency] = useState('PKR');
  const [rates] = useState({ PKR: 1.0 });
  const [supportedCurrencies] = useState(CURRENCY_METADATA);
  const [enabledCurrencies] = useState(['PKR']);
  const [isLoading] = useState(false);

  useEffect(() => {
    // Clear any previous foreign currency selection from localStorage
    try {
      localStorage.setItem('aydara_currency_preference', 'PKR');
    } catch (e) {
      // ignore
    }
  }, []);

  const setCurrency = () => {
    // Fixed to PKR across the whole platform
  };

  /**
   * Universal formatPrice helper returning PKR formatted currency
   */
  const formatPrice = (amountInBase) => {
    return formatCurrencyPrice(amountInBase);
  };

  /**
   * Numeric price calculation
   */
  const getConvertedPrice = (amountInBase) => {
    return convertPrice(amountInBase);
  };

  const currentMeta = CURRENCY_METADATA.PKR;

  return (
    <CurrencyContext.Provider
      value={{
        currency: 'PKR',
        setCurrency,
        baseCurrency: 'PKR',
        rates,
        ratesSource: 'State Bank of Pakistan / Maison PKR Standard',
        lastUpdated: new Date().toISOString(),
        supportedCurrencies,
        enabledCurrencies,
        symbol: '₨',
        displaySymbol: 'PKR',
        currencyMeta: currentMeta,
        formatPrice,
        getConvertedPrice,
        syncCurrencies: async () => {},
        isLoading
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    return {
      currency: 'PKR',
      setCurrency: () => {},
      baseCurrency: 'PKR',
      rates: { PKR: 1 },
      ratesSource: 'State Bank of Pakistan / Maison PKR Standard',
      lastUpdated: null,
      supportedCurrencies: CURRENCY_METADATA,
      enabledCurrencies: ['PKR'],
      symbol: '₨',
      displaySymbol: 'PKR',
      currencyMeta: CURRENCY_METADATA.PKR,
      formatPrice: (amt) => (amt ? `PKR ${Number(amt).toLocaleString()}` : 'PKR 0'),
      getConvertedPrice: (amt) => amt,
      syncCurrencies: async () => {},
      isLoading: false
    };
  }
  return context;
};
