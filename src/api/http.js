import apiClient from "./client.js";
import { API_CONFIG } from "./config.js";

function resolveEndpoint(keyOrPath) {
  return API_CONFIG.ENDPOINTS[keyOrPath] || keyOrPath;
}

export async function get(keyOrPath, config) {
  const url = resolveEndpoint(keyOrPath);
  const response = await apiClient.get(url, config);
  return response.data;
}

export async function post(keyOrPath, data, config) {
  const url = resolveEndpoint(keyOrPath);
  const response = await apiClient.post(url, data, config);
  return response.data;
}

export async function put(keyOrPath, data, config) {
  const url = resolveEndpoint(keyOrPath);
  const response = await apiClient.put(url, data, config);
  return response.data;
}

export async function patch(keyOrPath, data, config) {
  const url = resolveEndpoint(keyOrPath);
  const response = await apiClient.patch(url, data, config);
  return response.data;
}

export async function del(keyOrPath, config) {
  const url = resolveEndpoint(keyOrPath);
  const response = await apiClient.delete(url, config);
  return response.data;
}


