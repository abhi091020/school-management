export const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-GB");
export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );
export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
