/**
 * Calculates the final price after applying a discount percentage.
 * @param {number} price - The original price
 * @param {number|null} discountPercent - The discount percentage (0-100), or null for no discount
 * @returns {number} - The final price, minimum 0
 */
export const calculateFinalPrice = (price, discountPercent) => {
  if (!discountPercent) return price;
  return Math.max(0, price - (price * (discountPercent / 100)));
};

/**
 * Formats a price number as Arabic currency string.
 * @param {number} price
 * @returns {string}
 */
export const formatPrice = (price) => `${price} ج.م`;
