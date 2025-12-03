// frontend/src/utils/urlUtils.js

/**
 * Converts a parameter object into a URL query string (e.g., &key1=val1&key2=val2).
 * Excludes undefined, null, and empty string values.
 * @param {Object} params - The object containing query parameters.
 * @returns {string} - The formatted query string, prefixed with '&' if parameters exist.
 */
export const formatQueryParams = (params = {}) => {
  const query = Object.keys(params)
    .map((key) => {
      const value = params[key];
      // Only include valid (non-null/undefined/empty string) values
      if (value || value === 0 || value === false) {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }
      return null;
    })
    .filter((item) => item !== null)
    .join("&");

  return query ? `&${query}` : "";
};
