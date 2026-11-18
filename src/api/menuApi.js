import axiosInstance from "./axiosInstance";

// ======================================
// LIST MENUS
// ======================================
export const getMenus = async () => {
  const response = await axiosInstance.get("/api/menus");
  return response.data;
};

// ======================================
// CREATE MENU
// ======================================
export const createMenu = async ({
  menuTitle,
  menuURL,
  parentId = null,
  isPublished = false,
  isDefault = false,
}) => {
  const response = await axiosInstance.post("/api/menus", {
    menuTitle,
    menuURL,
    parentId,
    isPublished,
    isDefault,
  });

  return response.data;
};

// ======================================
// UPDATE MENU (parent / publish)
// ======================================
export const updateMenu = async (menuId, { parentId = null, isPublished }) => {
  const response = await axiosInstance.patch(`/api/menus/${menuId}`, {
    parentId,
    isPublished,
  });

  return response.data;
};

// ======================================
// DELETE MENU
// ======================================
export const deleteMenu = async (menuId) => {
  const response = await axiosInstance.delete(`/api/menus/${menuId}`);
  return response.data;
};

// ======================================
// PUBLISH / UNPUBLISH
// ======================================
export const toggleMenuPublish = async (menuId, isPublished) => {
  const action = isPublished ? "unpublish" : "publish";

  const response = await axiosInstance.patch(
    `/api/menus/${menuId}/${action}`
  );

  return response.data;
};

// ======================================
// SET DEFAULT (home)
// ======================================
export const setDefaultMenu = async (menuId) => {
  const response = await axiosInstance.patch(
    `/api/menus/${menuId}/set-default`
  );

  return response.data;
};

// ======================================
// PARENT URL PATH (hierarchy helper)
// ======================================
export const getMenuParentUrlPath = async ({ parentId, languageId }) => {
  const response = await axiosInstance.get("/api/menus/parent-url-path", {
    params: { parentId, languageId },
  });

  return response.data;
};

// ======================================
// TRANSLATIONS — CREATE
// ======================================
export const createMenuTranslation = async (
  menuId,
  { languageId, menuTitle, menuURL }
) => {
  const response = await axiosInstance.post(
    `/api/menus/${menuId}/translations`,
    { languageId, menuTitle, menuURL }
  );

  return response.data;
};

// ======================================
// TRANSLATIONS — UPDATE
// ======================================
export const updateMenuTranslation = async (
  menuId,
  translationId,
  { menuTitle, menuURL }
) => {
  const response = await axiosInstance.patch(
    `/api/menus/${menuId}/translations/${translationId}`,
    { menuTitle, menuURL }
  );

  return response.data;
};

// ======================================
// TRANSLATIONS — DELETE (optional, future use)
// ======================================
export const deleteMenuTranslation = async (menuId, translationId) => {
  const response = await axiosInstance.delete(
    `/api/menus/${menuId}/translations/${translationId}`
  );

  return response.data;
};