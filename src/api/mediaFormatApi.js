import axiosInstance from "./axiosInstance";

// ======================================
// LIST FORMATS
// ======================================
export const getMediaFormats = async () => {
  const response = await axiosInstance.get("/api/admin/media/formats");
  return response.data;
};

// ======================================
// CREATE FORMAT
// ======================================
export const createMediaFormat = async ({
  extension,
  mimeTypes,
  category,
  allowedSize,
}) => {
  const response = await axiosInstance.post(
    "/api/admin/media/formats",
    { extension, mimeTypes, category, allowedSize }
  );
  return response.data;
};

// ======================================
// UPDATE FORMAT
// ======================================
export const updateMediaFormat = async (
  formatId,
  { mimeTypes, category, allowedSize }
) => {
  const response = await axiosInstance.put(
    `/api/admin/media/formats/${formatId}`,
    { mimeTypes, category, allowedSize }
  );
  return response.data;
};

// ======================================
// TOGGLE FORMAT STATUS
// ======================================
export const updateMediaFormatStatus = async (formatId, isAllowed) => {
  const response = await axiosInstance.patch(
    `/api/admin/media/formats/${formatId}/status`,
    { isAllowed }
  );
  return response.data;
};

// ======================================
// DELETE FORMAT
// ======================================
export const deleteMediaFormat = async (formatId) => {
  const response = await axiosInstance.delete(
    `/api/admin/media/formats/${formatId}`
  );
  return response.data;
};