import axiosInstance from "./axiosInstance";

// ======================================
// LIST PAGES
// ======================================
export const getPages = async () => {
  const response = await axiosInstance.get("/api/pages");
  return response.data;
};

// ======================================
// CREATE PAGE
// ======================================
export const createPage = async ({
  menuTranslationId,
  content,
  isPublished = false,
}) => {
  const response = await axiosInstance.post("/api/pages", {
    menuTranslationId,
    content,
    isPublished,
  });

  return response.data;
};

// ======================================
// UPDATE PAGE
// ======================================
export const updatePage = async (
  pageId,
  { menuTranslationId, content, isPublished }
) => {
  const response = await axiosInstance.patch(`/api/pages/${pageId}`, {
    menuTranslationId,
    content,
    isPublished,
  });

  return response.data;
};

// ======================================
// DELETE PAGE
// ======================================
export const deletePage = async (pageId) => {
  const response = await axiosInstance.delete(`/api/pages/${pageId}`);
  return response.data;
};