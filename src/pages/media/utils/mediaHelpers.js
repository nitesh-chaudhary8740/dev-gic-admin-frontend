import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Folder,
} from "lucide-react";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://192.168.1.191:3000"
).replace(/\/+$/, "");

export const MEDIA_API = "/api/admin/media";

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

export const MEDIA_CATEGORIES = ["image", "audio", "video", "document", "archive"];

/**
 * Format bytes to human string WITHOUT decimals.
 * - < 1 KB  -> bytes   (e.g. "512 B")
 * - < 1 MB  -> KB      (e.g. "300 KB", not "0.30 MB")
 * - < 1 GB  -> MB      (e.g. "5 MB")
 * - >= 1 GB -> GB      (e.g. "2 GB")
 *
 * Uses log10 to pick the correct unit. Returns "—" for 0 / invalid.
 */
export const formatBytes = (bytes = 0) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";

  const units = ["B", "KB", "MB", "GB", "TB"];

  // log10(1024) ≈ 3.0103 → correct unit index
  let index = Math.floor(Math.log10(n) / Math.log10(1024));
  if (index < 0) index = 0;
  if (index >= units.length) index = units.length - 1;

  const value = Math.floor(n / Math.pow(1024, index));
  return `${value} ${units[index]}`;
};

/**
 * Same as formatBytes but returns "0 B" for zero instead of "—".
 * Used in contexts where "0 B" is more meaningful than a dash.
 */
export const bytesToHuman = (bytes = 0) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];

  let index = Math.floor(Math.log10(n) / Math.log10(1024));
  if (index < 0) index = 0;
  if (index >= units.length) index = units.length - 1;

  const value = Math.floor(n / Math.pow(1024, index));
  return `${value} ${units[index]}`;
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

export const joinLocation = (parent, child) =>
  [parent, child].filter(Boolean).join("/").replace(/\\/g, "/");

export const getFileIcon = (item) => {
  if (item.type === "folder") return Folder;

  const ext = (
    item.format ||
    item.name?.split(".").pop() ||
    ""
  ).toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return FileImage;
  if (["mp3", "wav", "m4a", "ogg"].includes(ext)) return FileAudio;
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return FileVideo;
  if (["zip", "rar", "7z"].includes(ext)) return FileArchive;
  if (
    [
      "pdf", "doc", "docx", "xls", "xlsx",
      "ppt", "pptx", "txt", "csv",
    ].includes(ext)
  )
    return FileText;

  return File;
};

export const getContents = (response) =>
  Array.isArray(response?.data?.contents) ? response.data.contents : [];

export const getFormats = (response) =>
  Array.isArray(response?.data) ? response.data : [];

export async function apiRequest(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      result.message || `Request failed (${response.status}).`
    );
    error.status = response.status;
    error.code = result.code;
    error.data = result.data;
    throw error;
  }

  return result;
}

/**
 * Parse human size like "5 MB" / "300 KB" / "512 B" -> bytes.
 * Returns null on invalid input.
 */
export const parseSizeToBytes = (input = "") => {
  const match = String(input)
    .trim()
    .match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);

  if (!match) return null;

  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  const unit = (match[2] || "B").toUpperCase();
  const multipliers = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };

  return Math.round(value * multipliers[unit]);
};

// ======================================
// 🟢 BULK UPLOAD & SSE HELPERS
// ======================================

/**
 * Bulk upload multiple files at once.
 * 
 * @param {File[]} files - Array of File objects
 * @param {string} location - Target folder path (e.g., "images")
 * @param {string} conflictAction - "cancel" | "replace" | "rename"
 * @param {string} uploadId - Unique ID for SSE tracking
 * @returns {Promise<Object>} Result with { success: [], skipped: [], failed: [] }
 */
export async function bulkApiRequest(files, location = "", conflictAction = "cancel", uploadId = "") {
  const formData = new FormData();
  
  // Append all files under "files" key (matches backend multer config)
  files.forEach((file) => formData.append("files", file));
  
  formData.append("location", location);
  formData.append("conflictAction", conflictAction);
  if (uploadId) formData.append("uploadId", uploadId);

  const response = await fetch(`${API_BASE_URL}${MEDIA_API}/bulk-upload`, {
    method: "POST",
    body: formData,
    // Note: Do NOT set Content-Type header. Browser auto-sets it for FormData.
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      result.message || `Bulk upload failed (${response.status}).`
    );
    error.status = response.status;
    error.code = result.code;
    error.data = result.data;
    throw error;
  }

  return result;
}

/**
 * Connect to SSE endpoint for real-time upload progress.
 * 
 * @param {string} uploadId - Unique ID generated on frontend (must match backend)
 * @param {Function} onMessage - Callback receiving progress data:
 *   {
 *     status: "processing" | "completed" | "error" | "waiting",
 *     totalFiles: number,
 *     processedFiles: number,
 *     currentFile: string,
 *     currentFileProgress: number, // 0-100
 *     message: string
 *   }
 * @param {Function} onError - Optional error callback
 * @returns {Function} Cleanup function to close SSE connection
 */
export function connectUploadProgress(uploadId, onMessage, onError) {
  // Create EventSource pointing to SSE endpoint
  const eventSource = new EventSource(
    `${API_BASE_URL}${MEDIA_API}/upload-progress/${uploadId}`
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (err) {
      console.error("SSE parse error:", err);
    }
  };

  eventSource.onerror = (err) => {
    console.error("SSE connection error:", err);
    if (onError) onError(err);
    // Don't auto-close here; EventSource auto-reconnects
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}

/**
 * Generate a unique upload ID for SSE tracking.
 * Combines timestamp + random string to avoid collisions.
 */
export const generateUploadId = () => {
  return `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};