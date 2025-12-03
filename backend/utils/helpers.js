/**
 * Ensures a value is a number within a certain range, providing a safe fallback.
 * This is crucial for handling pagination, limits, and other numeric inputs from queries.
 * @param {any} value - The input value.
 * @param {number} fallback - The value to return if the input is not a number.
 * @param {number} max - Optional maximum value constraint.
 * @returns {number} - The safe number.
 */
export const safeNum = (value, fallback = 0, max = Infinity) => {
  const num = Number(value);
  // 1. Check if the result is NaN
  if (isNaN(num)) return fallback;
  // 2. Check if the number exceeds the max limit
  if (num > max) return max;
  // 3. Return the number
  return num;
};

// You might need to add other utilities here later, but this resolves the current import issue
// if the userService is trying to access `safeNum` or just needs the file to exist.
