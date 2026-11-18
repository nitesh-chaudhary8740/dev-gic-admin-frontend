import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Folder,
} from "lucide-react";

// ======================================
// UI / STYLE
// ======================================
export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const MEDIA_CATEGORIES = [
  "image",
  "audio",
  "video",
  "document",
  "archive",
];

// ======================================
// FORMATTERS
// ======================================
export const formatBytes = (bytes = 0) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = Math.floor(Math.log10(n) / Math.log10(1024));
  index = Math.max(0, Math.min(index, units.length - 1));

  return `${Math.floor(n / Math.pow(1024, index))} ${units[index]}`;
};

export const bytesToHuman = (bytes = 0) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = Math.floor(Math.log10(n) / Math.log10(1024));
  index = Math.max(0, Math.min(index, units.length - 1));

  return `${Math.floor(n / Math.pow(1024, index))} ${units[index]}`;
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

export const joinLocation = (parent, child) =>
  [parent, child].filter(Boolean).join("/").replace(/\\/g, "/");

// ======================================
// ICONS
// ======================================
export const getFileIcon = (item) => {
  if (item.type === "folder") return Folder;

  const ext = (item.format || item.name?.split(".").pop() || "").toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return FileImage;

  if (["mp3", "wav", "m4a", "ogg"].includes(ext)) return FileAudio;

  if (["mp4", "mov", "avi", "webm"].includes(ext)) return FileVideo;

  if (["zip", "rar", "7z"].includes(ext)) return FileArchive;

  if (
    [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "csv",
    ].includes(ext)
  ) {
    return FileText;
  }

  return File;
};

// ======================================
// RESPONSE EXTRACTORS
// ======================================
export const getContents = (response) =>
  Array.isArray(response?.data?.contents) ? response.data.contents : [];

export const getFormats = (response) =>
  Array.isArray(response?.data) ? response.data : [];

// ======================================
// SIZE PARSER
// ======================================
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