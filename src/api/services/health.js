import { get } from "../http.js";

export async function fetchHealth() {
  return get("HEALTH");
}


