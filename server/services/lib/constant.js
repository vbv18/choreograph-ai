export const SESSION_TTL = 7 * 24 * 60 * 60; // in seconds
export const AGENT_MEMORY_TTL = 24 * 60 * 60; // in seconds
export const URL_EXPIRY = 24 * 60; // in minutes

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

export const PPT_COLOR_PALETTE = {
  primary: "2563EB",
  secondary: "0F172A",
  tetriary: "DBEAFE",
  text: "334155",
  light: "F8FAFC",
  border: "E2E8F0",
  white: "FFFFFF",
  muted: "64748B",
  filler_1: "60A5FA",
  filler_2: "F8FAFC",
  filler_3: "EFF6FF",
};

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    amount: 0,
    credits: 125,
    validity: 30, //in days
  },
  starter: {
    id: "starter",
    name: "Starter",
    amount: 499,
    credits: 500,
    validity: 30, // in days
  },
  pro: {
    id: "pro",
    name: "Pro",
    amount: 999,
    credits: 1000,
    validity: 30, // in days
  },
};

export const AGENT_COST = {
  chat: 1,
  coding: 5,
  image: 10,
  pdf: 7,
  ppt: 7,
  search: 5,
};
