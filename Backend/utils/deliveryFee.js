/**
 * Delivery Fee Utility Functions
 * 
 * Policy: Orders above GH₵200 get free delivery
 * Orders below GH₵200 get a GH₵5 delivery fee
 */

/**
 * Calculate delivery fee based on order subtotal
 * @param {number} subtotal - The order subtotal amount
 * @returns {number} - The delivery fee (0 for free delivery, 5 for paid delivery)
 */
const calculateDeliveryFee = (subtotal) => {
  if (subtotal >= 200) {
    return 0; // Free delivery for orders above GH₵200
  }
  return 5; // GH₵5 delivery fee for orders below GH₵200
};

/**
 * Calculate final total including delivery fee
 * @param {number} subtotal - The order subtotal amount
 * @returns {number} - The final total including delivery fee
 */
const calculateFinalTotal = (subtotal) => {
  const deliveryFee = calculateDeliveryFee(subtotal);
  return subtotal + deliveryFee;
};

/**
 * Check if delivery is free for a given order amount
 * @param {number} subtotal - The order subtotal amount
 * @returns {boolean} - True if delivery is free, false otherwise
 */
const isDeliveryFree = (subtotal) => {
  return subtotal >= 200;
};

/**
 * Get delivery fee description for display
 * @param {number} subtotal - The order subtotal amount
 * @returns {string} - Description of delivery fee
 */
const getDeliveryFeeDescription = (subtotal) => {
  if (isDeliveryFree(subtotal)) {
    return "Free Delivery";
  }
  return "+ GH₵5.00 Delivery";
};

module.exports = {
  calculateDeliveryFee,
  calculateFinalTotal,
  isDeliveryFree,
  getDeliveryFeeDescription
}; 