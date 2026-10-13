// Same weights in both builds; f16 shaders are lighter and faster where the GPU adapter exposes them.
export const MODEL_IDS = { f16: 'gemma-4-E2B-it-q4f16_1-MLC', f32: 'gemma-4-E2B-it-q4f32_1-MLC' } as const;
export const modelFor = (shaderF16: boolean): string => shaderF16 ? MODEL_IDS.f16 : MODEL_IDS.f32;
// Shown in the consent dialog and status; weights per tensor-cache.json, VRAM per prebuiltAppConfig.
export const MODEL_NAME = 'Gemma 4 E2B';
export const DOWNLOAD_SIZE = '2,8 GB';
export const VRAM_RANGE = '3,4–3,9 GB';
// A short answer of a few sentences; prompt plus answer must stay inside the 4 096 token context.
export const ANSWER_TOKENS = 400;
