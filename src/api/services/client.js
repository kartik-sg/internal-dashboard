import { get, post, patch } from "../http.js";

export async function fetchPublicKey() {
  return get("GET_PUBLIC_KEY");
}

export async function createClient(payload) {
  return post("CREATE_CLIENT", payload);
}

export async function fetchClients() {
  return get("GET_CLIENTS");
}

export async function fetchClientById(id) {
  return get(`/client/${id}`);
}

export async function patchClient(id, payload) {
  return patch(`/client/${id}`, payload);
}


