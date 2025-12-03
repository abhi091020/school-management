// backend/utils/cookieService.js

export const COOKIE_SECURE = process.env.NODE_ENV === "production";

export const refreshCookieOptions = (days = 365) => ({
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: "strict",
  path: "/",
  maxAge: days * 24 * 60 * 60 * 1000,
});

/**
 * Sets refresh token cookie
 */
export const setRefreshCookie = (res, token, days = 365) => {
  res.cookie("refreshToken", token, refreshCookieOptions(days));
};
