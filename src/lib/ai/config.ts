// Same weights in both builds; f16 shaders are lighter and faster where the GPU adapter exposes them.
export const MODEL_IDS = { f16: 'Qwen3-1.7B-q4f16_1-MLC', f32: 'Qwen3-1.7B-q4f32_1-MLC' } as const;
export const modelFor = (shaderF16: boolean): string => shaderF16 ? MODEL_IDS.f16 : MODEL_IDS.f32;
// A short answer of a few sentences; prompt plus answer must stay inside the 4 096 token context.
export const ANSWER_TOKENS = 400;
