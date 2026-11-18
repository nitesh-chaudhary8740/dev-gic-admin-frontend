import axiosInstance from "./axiosInstance";

// ======================================
// LIST CONTENTS
// ======================================
export const getMediaContents = async (location = "") => {
  const response = await axiosInstance.get("/api/admin/media/contents", {
    params: location ? { location } : {},
  });

  return response.data;
};

// ======================================
// FORMATS
// ======================================
export const getMediaFormats = async () => {
  const response = await axiosInstance.get("/api/admin/media/formats");

  return response.data;
};

// ======================================
// UPDATE FORMAT STATUS
// ======================================
export const updateMediaFormatStatus = async (formatId, isAllowed) => {
  const response = await axiosInstance.patch(
    `/api/admin/media/formats/${formatId}/status`,
    { isAllowed }
  );

  return response.data;
};

// ======================================
// SINGLE UPLOAD
// Content-Type auto-handled by axiosInstance interceptor
// ======================================
export const uploadSingleFile = async ({
  file,
  location = "",
  fileName = "",
  conflictAction = "cancel",
}) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("location", location);

  if (fileName?.trim()) {
    formData.append("fileName", fileName.trim());
  }

  formData.append("conflictAction", conflictAction);

  const response = await axiosInstance.post(
    "/api/admin/media/upload",
    formData
  );

  return response.data;
};

// ======================================
// BULK UPLOAD
// Content-Type auto-handled by axiosInstance interceptor
// ======================================
export const bulkUploadMedia = async ({
  files,
  location = "",
  conflictAction = "cancel",
  uploadId = "",
  signal,
  onUploadProgress,
}) => {
  const formData = new FormData();

  files.forEach((file) => formData.append("files", file));

  formData.append("location", location);
  formData.append("conflictAction", conflictAction);

  if (uploadId) formData.append("uploadId", uploadId);

  const response = await axiosInstance.post(
    "/api/admin/media/bulk-upload",
    formData,
    { signal, onUploadProgress }
  );

  return response.data;
};

// ======================================
// CANCEL BULK UPLOAD
// Best-effort — failure silently ignored
// ======================================
export const cancelBulkUpload = async (uploadId) => {
  if (!uploadId) return false;

  try {
    await axiosInstance.post(
      `/api/admin/media/cancel-upload/${encodeURIComponent(uploadId)}`
    );
    return true;
  } catch (err) {
    console.error("Failed to send cancel request:", err);
    return false;
  }
};

// ======================================
// UPLOAD PROGRESS (SSE)
// Note: EventSource can't use axios — native API required
// ======================================
export const connectUploadProgress = (uploadId, onMessage, onError) => {
  const baseURL = axiosInstance.defaults.baseURL || "";
  const eventSource = new EventSource(
    `${baseURL}/api/admin/media/upload-progress/${encodeURIComponent(uploadId)}`
  );

  eventSource.onmessage = (event) => {
    try {
      onMessage?.(JSON.parse(event.data));
    } catch (err) {
      console.error("SSE parse error:", err);
    }
  };

  eventSource.onerror = (err) => {
    console.error("SSE connection error:", err);
    onError?.(err);
  };

  return () => eventSource.close();
};

// ======================================
// UPLOAD ID
// ======================================
export const generateUploadId = () =>
  `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// ======================================
// FOLDERS
// ======================================
export const createMediaFolder = async ({
  folderName,
  parentPath = "",
}) => {
  const response = await axiosInstance.post(
    "/api/admin/media/folders",
    { folderName, parentPath }
  );

  return response.data;
};

export const deleteMediaFolder = async (location) => {
  const response = await axiosInstance.delete(
    "/api/admin/media/folders",
    { data: { location } }
  );

  return response.data;
};

// ======================================
// DELETE FILES (single + bulk)
// ======================================
export const deleteMediaFiles = async ({
  location = "",
  fileNames = [],
}) => {
  const response = await axiosInstance.delete(
    "/api/admin/media/files",
    { data: { location, fileNames } }
  );

  return response.data;
};