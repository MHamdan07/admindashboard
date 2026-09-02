/**
 * AYDARA Luxury Currency Service
 * Standardized Pakistani Rupee (PKR) Currency Engine for the entire Maison
 */

export const CURRENCY_METADATA = {
  PKR: {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: '₨',
    displaySymbol: 'PKR',
    locale: 'en-PK',
    defaultRate: 1.0,
    decimals: 0,
    rounding: 'integer',
    flag: '🇵🇰'
  }
};

/**
 * Returns the base price in PKR
 * @param {number} amountInBase - Base price in PKR
 * @returns {number} Numeric value in PKR
 */
export function convertPrice(amountInBase) {
  if (typeof amountInBase !== 'number' || isNaN(amountInBase)) return 0;
  return amountInBase;
}

/**
 * Formats a price into standard Pakistani Rupee format across all devices
 * @param {number} amountInBase - Price in PKR
 * @param {string} targetCurrency - Fixed to 'PKR'
 * @returns {string} Formatted string (e.g. "PKR 45,000")
 */
export function formatCurrencyPrice(amountInBase) {
  if (amountInBase === null || amountInBase === undefined || isNaN(Number(amountInBase))) {
    return 'PKR 0';
  }

  const numericBase = Math.round(Number(amountInBase));
  const formattedNumber = numericBase.toLocaleString('en-US');
  return `PKR ${formattedNumber}`;
}
