/**
 * Client-side passport MRZ extraction pipeline.
 *
 * 1. Crop the bottom MRZ band from the captured frame
 * 2. Preprocess (grayscale + contrast) for OCR-B readability
 * 3. Run Tesseract.js with an MRZ character whitelist
 * 4. Parse and validate check digits via the `mrz` library
 */

import Tesseract, { PSM } from 'tesseract.js';
import { parse, type ParseResult } from 'mrz';
import { ALL_COUNTRIES, convertAlpha3ToAlpha2 } from './countries';

/** MRZ OCR-B allowed characters (ICAO 9303). */
export const MRZ_CHAR_WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<';

/** Bottom fraction of the passport page that typically contains both MRZ lines. */
const MRZ_REGION_HEIGHT_RATIO = 0.2;

/** User-facing error when check-digit validation fails. */
export const MRZ_SCAN_FAILED_MESSAGE =
  'Scan failed. Please ensure the bottom lines are clear, unblurred, and free of glare.';

export interface PassportMrzFields {
  firstName: string;
  lastName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  sex: string;
  issuingAuthority: string;
  issueDate: string;
  placeOfBirth: string;
  mrzLine1: string;
  mrzLine2: string;
}

export interface MrzOcrResult {
  fields: PassportMrzFields;
  parseResult: ParseResult;
  rawText: string;
}

let workerPromise: Promise<Tesseract.Worker> | null = null;

/** Reuse a single Tesseract worker across scans to avoid cold-start latency. */
async function getMrzWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await Tesseract.createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: MRZ_CHAR_WHITELIST,
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      return worker;
    })();
  }
  return workerPromise;
}

/** Release the shared worker (e.g. on route unmount). */
export async function terminateMrzWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}

/** Load a File/Blob into an HTMLImageElement for canvas processing. */
export function loadImageFromFile(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load passport image.'));
    };
    img.src = url;
  });
}

/**
 * Draw the MRZ band from a source image/canvas, convert to grayscale,
 * and boost contrast before OCR.
 */
export function preprocessMrzRegion(
  source: HTMLImageElement | HTMLCanvasElement,
  targetCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const canvas = targetCanvas ?? document.createElement('canvas');
  const sourceWidth =
    source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sourceHeight =
    source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  const mrzHeight = Math.max(Math.floor(sourceHeight * MRZ_REGION_HEIGHT_RATIO), 48);
  const mrzY = sourceHeight - mrzHeight;

  canvas.width = sourceWidth;
  canvas.height = mrzHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.');
  }

  ctx.drawImage(source, 0, mrzY, sourceWidth, mrzHeight, 0, 0, sourceWidth, mrzHeight);

  const imageData = ctx.getImageData(0, 0, sourceWidth, mrzHeight);
  const { data } = imageData;
  const contrast = 1.85;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const boosted = (gray - 128) * contrast + 128;
    const value = Math.max(0, Math.min(255, boosted));
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Capture a video frame to canvas at native resolution. */
export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.');
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function normalizeMrzLine(line: string, length = 44): string {
  const cleaned = line.replace(/\s/g, '').toUpperCase();
  if (cleaned.length >= length) {
    return cleaned.slice(0, length);
  }
  return cleaned.padEnd(length, '<');
}

/** Pull likely TD3 MRZ line pairs from raw OCR text. */
export function extractMrzLinesFromText(text: string): string[] | null {
  const lines = text
    .split('\n')
    .map((line) => line.trim().toUpperCase().replace(/\s/g, ''))
    .filter((line) => line.length >= 30 && /^[A-Z0-9<]+$/.test(line));

  for (let i = 0; i < lines.length - 1; i += 1) {
    const line1 = normalizeMrzLine(lines[i]);
    const line2 = normalizeMrzLine(lines[i + 1]);
    if (!line1.includes('<')) continue;

    try {
      const result = parse([line1, line2], { autocorrect: true });
      if (result.format === 'TD3') {
        return [line1, line2];
      }
    } catch {
      // Try next pair
    }
  }

  if (lines.length >= 2) {
    return [
      normalizeMrzLine(lines[lines.length - 2]),
      normalizeMrzLine(lines[lines.length - 1]),
    ];
  }

  return null;
}

function formatMrzDate(value: string | null | undefined): string {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length !== 6) {
    return value;
  }

  const yy = parseInt(digits.slice(0, 2), 10);
  const mm = digits.slice(2, 4);
  const dd = digits.slice(4, 6);
  const currentYear = new Date().getFullYear() % 100;
  const century = yy > currentYear ? '19' : '20';

  return `${century}${String(yy).padStart(2, '0')}-${mm}-${dd}`;
}

function mapSex(value: string | null | undefined): string {
  if (!value) return '';
  const normalized = value.toLowerCase();
  if (normalized === 'male' || normalized === 'm') return 'Male';
  if (normalized === 'female' || normalized === 'f') return 'Female';
  return value;
}

function mapCountryCode(code: string | null | undefined): string {
  if (!code) return '';
  const alpha2 = convertAlpha3ToAlpha2(code);
  if (!alpha2) return code;
  const country = ALL_COUNTRIES.find((entry) => entry.code === alpha2);
  return country?.name ?? code;
}

export function mapParseResultToPassportFields(
  parseResult: ParseResult,
  mrzLines: string[]
): PassportMrzFields {
  const { fields } = parseResult;

  return {
    firstName: fields.firstName ?? '',
    lastName: fields.lastName ?? '',
    passportNumber: parseResult.documentNumber ?? fields.documentNumber ?? '',
    nationality: mapCountryCode(fields.nationality),
    dateOfBirth: formatMrzDate(fields.birthDate),
    expiryDate: formatMrzDate(fields.expirationDate),
    sex: mapSex(fields.sex),
    issuingAuthority: mapCountryCode(fields.issuingState),
    issueDate: formatMrzDate(fields.issueDate),
    placeOfBirth: '',
    mrzLine1: mrzLines[0] ?? '',
    mrzLine2: mrzLines[1] ?? '',
  };
}

/**
 * Parse MRZ lines and enforce ICAO check-digit validation.
 * Throws with a user-friendly message when validation fails.
 */
export function parseAndValidateMrz(mrzLines: string[]): MrzOcrResult {
  const normalized = mrzLines.map((line) => normalizeMrzLine(line));
  const parseResult = parse(normalized, { autocorrect: true });

  if (!parseResult.valid) {
    throw new Error(MRZ_SCAN_FAILED_MESSAGE);
  }

  return {
    fields: mapParseResultToPassportFields(parseResult, normalized),
    parseResult,
    rawText: normalized.join('\n'),
  };
}

/** Run Tesseract on a preprocessed MRZ canvas. */
async function recognizeMrzCanvas(canvas: HTMLCanvasElement): Promise<string> {
  const worker = await getMrzWorker();
  const { data } = await worker.recognize(canvas);
  return data.text ?? '';
}

/**
 * Full pipeline: preprocess → OCR → MRZ parse → check-digit validation.
 */
export async function extractPassportMrzFromImageSource(
  source: HTMLImageElement | HTMLCanvasElement
): Promise<MrzOcrResult> {
  const mrzCanvas = preprocessMrzRegion(source);
  const ocrText = await recognizeMrzCanvas(mrzCanvas);

  let mrzLines = extractMrzLinesFromText(ocrText);

  // Fallback: OCR the full frame if the MRZ crop did not yield two lines
  if (!mrzLines) {
    const fullCanvas = document.createElement('canvas');
    const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    fullCanvas.width = width;
    fullCanvas.height = height;
    const ctx = fullCanvas.getContext('2d');
    ctx?.drawImage(source, 0, 0, width, height);
    const fullText = await recognizeMrzCanvas(preprocessMrzRegion(fullCanvas));
    mrzLines = extractMrzLinesFromText(`${ocrText}\n${fullText}`);
  }

  if (!mrzLines || mrzLines.length < 2) {
    throw new Error(MRZ_SCAN_FAILED_MESSAGE);
  }

  return parseAndValidateMrz(mrzLines);
}

/** Convenience wrapper for File uploads. */
export async function extractPassportMrzFromFile(file: Blob): Promise<MrzOcrResult> {
  const image = await loadImageFromFile(file);
  return extractPassportMrzFromImageSource(image);
}

/** Convenience wrapper for live camera frames. */
export async function extractPassportMrzFromVideo(video: HTMLVideoElement): Promise<MrzOcrResult> {
  const frame = captureVideoFrame(video);
  return extractPassportMrzFromImageSource(frame);
}
