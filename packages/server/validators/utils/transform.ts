import {
  normalizeTextForMultipleLines,
  normalizeTextForSingleLine,
} from '$shared/normalize';

export function tStringNormalizeSingleLine(value: unknown): unknown {
  return typeof value === 'string'
    ? normalizeTextForSingleLine(value) || ''
    : value;
}

export function tStringNormalizeMultipleLines(value: unknown): unknown {
  return typeof value === 'string'
    ? normalizeTextForMultipleLines(value) || ''
    : value;
}
