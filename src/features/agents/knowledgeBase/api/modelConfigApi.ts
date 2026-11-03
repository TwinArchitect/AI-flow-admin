import { http } from '@/api/client';
import type { MineruProbeResult, KbModelCategory, KbModelConfig, KbModelConfigSave, KbModelOption } from '../types';

const CONFIG_BASE = '/gpt/kb/model-config';
const MODEL_BASE = '/gpt/base/model';

export function getKbModelConfig() {
  return http.get<KbModelConfig>(`${CONFIG_BASE}/get`).then((response) => response.data);
}

export function saveKbModelConfig(payload: KbModelConfigSave) {
  return http.post<KbModelConfig>(`${CONFIG_BASE}/save`, payload).then((response) => response.data);
}

export function listEnabledModels(category: KbModelCategory) {
  return http.get<KbModelOption[]>(`${MODEL_BASE}/list`, {
    params: { category, status: 0 },
  }).then((response) => response.data ?? []);
}

export function probeMineru() {
  return http.post<MineruProbeResult>(`${CONFIG_BASE}/mineru/probe`).then((response) => response.data);
}
export function verifyMineru() {
  return http.post<MineruProbeResult>(`${CONFIG_BASE}/mineru/verify`).then((response) => response.data);
}
