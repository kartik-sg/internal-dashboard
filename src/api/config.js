const BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "https://validator.stackguard.io/api";

export const API_CONFIG = {
  BASE_URL,
  ENDPOINTS: {
    HEALTH: "/health",
    GET_PUBLIC_KEY: "/client",
    CREATE_CLIENT: "/client",
    GET_CLIENTS: "/clients",
  },
};
