import axiosInstance from "./axiosInstance";

// ======================================
// LIST LANGUAGES
// ======================================
export const getLanguages = async () => {
  const response = await axiosInstance.get("/api/languages");
  return response.data;
};

// ======================================
// CREATE LANGUAGE
// ======================================
export const createLanguage = async ({
  name,
  code,
  displayName,
  isPublished,
  isDefault,
}) => {
  const response = await axiosInstance.post("/api/languages", {
    name,
    code,
    displayName,
    isPublished,
    isDefault,
  });

  return response.data;
};

// ======================================
// UPDATE LANGUAGE
// ======================================
export const updateLanguage = async (
  languageId,
  { name, code, displayName, isPublished }
) => {
  const response = await axiosInstance.put(
    `/api/languages/${languageId}`,
    { name, code, displayName, isPublished }
  );

  return response.data;
};

// ======================================
// PUBLISH / UNPUBLISH
// ======================================
export const toggleLanguagePublish = async (languageId, isPublished) => {
  const action = isPublished ? "unpublish" : "publish";

  const response = await axiosInstance.patch(
    `/api/languages/${languageId}/${action}`
  );

  return response.data;
};

// ======================================
// SET DEFAULT
// ======================================
export const setDefaultLanguage = async (languageId) => {
  const response = await axiosInstance.patch(
    `/api/languages/${languageId}/set-default`
  );

  return response.data;
};