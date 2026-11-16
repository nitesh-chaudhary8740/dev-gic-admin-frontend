
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Folder,
  LoaderCircle,
  X,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";

import MediaHeader from "./components/MediaHeader";
import MediaStats from "./components/MediaStats";
import MediaToolbar from "./components/MediaToolbar";
import MediaGrid from "./components/MediaGrid";
import MediaList from "./components/MediaList";
import FolderModal from "./components/FolderModal";
import UploadModal from "./components/UploadModal";
import ConflictModal from "./components/ConflictModal";
import FormatsModal from "./components/FormatsModal";
import BulkUploadReportModal from "./components/BulkUploadReportModal";

import {
  API_BASE_URL,
  MEDIA_API,
  apiRequest,
  getContents,
  getFormats,
  joinLocation,
  bytesToHuman,
  bulkApiRequest,
  cancelBulkUpload,
  connectUploadProgress,
  generateUploadId,
} from "./utils/mediaHelpers";

export default function Media() {
  const [items, setItems] = useState([]);
  const [formats, setFormats] = useState([]);

  // File selection and deletion
  const [selectedFileNames, setSelectedFileNames] = useState([]);
  const [deletingFiles, setDeletingFiles] = useState(false);

  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  const [loading, setLoading] = useState(true);
  const [savingFolder, setSavingFolder] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  // ======================================
  // UPLOAD STATES
  // ======================================

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [customFileName, setCustomFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState({
    processed: 0,
    total: 0,
    currentFile: "",
    percent: 0,
    message: "",
  });

  const [uploadReport, setUploadReport] = useState(null);

  const [activeUploadId, setActiveUploadId] = useState(null);
  const abortControllerRef = useRef(null);

  // ======================================
  // CONFLICT STATES
  // ======================================

  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const [pendingConflictFile, setPendingConflictFile] = useState(null);

  // ======================================
  // FORMATS
  // ======================================

  const [formatModalOpen, setFormatModalOpen] = useState(false);
  const [formatLoadingId, setFormatLoadingId] = useState(null);

  // ======================================
  // LOAD DATA
  // ======================================

  const loadContents = useCallback(async (targetLocation = "") => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        location: targetLocation,
      });

      const response = await apiRequest(
        `${MEDIA_API}/contents?${query.toString()}`
      );

      setItems(getContents(response));
    } catch (err) {
      setItems([]);
      setError(err.message || "Unable to load media contents.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFormats = useCallback(async () => {
    try {
      const response = await apiRequest(`${MEDIA_API}/formats`);
      setFormats(getFormats(response));
    } catch (err) {
      setError(err.message || "Unable to load media formats.");
    }
  }, []);

  useEffect(() => {
    loadContents(location);
  }, [location, loadContents]);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  // ======================================
  // LOCATION CHANGE
  // ======================================

  const changeLocation = (nextLocation) => {
    setSelectedFileNames([]);
    setSearch("");
    setLocation(nextLocation);
  };

  // ======================================
  // FILTER, SORT AND BREADCRUMBS
  // ======================================

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    const sorted = [...items].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }

      return (a.name || "").localeCompare(b.name || "");
    });

    if (!term) return sorted;

    return sorted.filter((item) =>
      (item.name || "").toLowerCase().includes(term)
    );
  }, [items, search]);

  const breadcrumbs = useMemo(() => {
    const parts = location
      ? location.split("/").filter(Boolean)
      : [];

    return [
      {
        label: "Media Library",
        path: "",
      },
      ...parts.map((part, index) => ({
        label: part,
        path: parts.slice(0, index + 1).join("/"),
      })),
    ];
  }, [location]);

  // ======================================
  // OPEN UPLOAD MODAL
  // ======================================

  const resetUploadState = () => {
    setSelectedFiles([]);
    setCustomFileName("");
    setError("");
    setMessage("");
    setUploadReport(null);

    setUploadProgress({
      processed: 0,
      total: 0,
      currentFile: "",
      percent: 0,
      message: "",
    });
  };

  const openSingleUpload = () => {
    setIsBulkMode(false);
    resetUploadState();
    setUploadModalOpen(true);
  };

  const openBulkUpload = () => {
    setIsBulkMode(true);
    resetUploadState();
    setUploadModalOpen(true);
  };

  const handleFilesChange = (files) => {
    if (files.length > 100) {
      setError("You can select a maximum of 100 files.");
      return;
    }

    setSelectedFiles(files);
    setError("");
  };

  // ======================================
  // SINGLE UPLOAD
  // ======================================

  const submitSingleUpload = async (conflictAction = "cancel") => {
    if (selectedFiles.length === 0) return;

    const file = selectedFiles[0];

    setUploading(true);
    setError("");
    setMessage("");

    const body = new FormData();

    body.append("file", file);
    body.append("location", location);

    if (customFileName.trim()) {
      body.append("fileName", customFileName.trim());
    }

    body.append("conflictAction", conflictAction);

    try {
      await apiRequest(`${MEDIA_API}/upload`, {
        method: "POST",
        body,
      });

      setUploadModalOpen(false);
      setConflictModalOpen(false);
      setPendingConflictFile(null);
      setSelectedFiles([]);

      setMessage("File uploaded successfully.");

      await loadContents(location);
    } catch (err) {
      if (
        err.status === 409 ||
        err.code === "FILE_ALREADY_EXISTS"
      ) {
        setPendingConflictFile({
          file,
          fileName: customFileName,
        });

        setConflictMessage(
          err.message || "A file with this name already exists."
        );

        setConflictModalOpen(true);
        setUploadModalOpen(false);
      } else {
        const rawMessage =
          err.message || "Unable to upload file.";

        const cleanMessage = rawMessage.replace(
          /(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)\b/gi,
          (_, num, unit) => {
            const multipliers = {
              B: 1,
              KB: 1024,
              MB: 1024 ** 2,
              GB: 1024 ** 3,
            };

            const bytes =
              parseFloat(num) * multipliers[unit.toUpperCase()];

            return bytesToHuman(bytes);
          }
        );

        setError(cleanMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  // ======================================
  // BULK UPLOAD
  // ======================================

  const submitBulkUpload = async () => {
    if (selectedFiles.length === 0 || uploading) return;

    const files = [...selectedFiles];
    const total = files.length;

    setUploading(true);
    setError("");
    setMessage("");
    setUploadReport(null);

    setUploadProgress({
      processed: 0,
      total,
      currentFile: "",
      percent: 0,
      message: "Preparing upload...",
    });

    const uploadId = generateUploadId();

    setActiveUploadId(uploadId);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let closeSSE = null;

    try {
      // Connect SSE before starting upload request.
      closeSSE = connectUploadProgress(
        uploadId,
        (data) => {
          const processed = Number(data.processedFiles || 0);
          const totalFiles = Number(data.totalFiles || total);
          const currentProgress = Number(
            data.currentFileProgress || 0
          );

          const overallPercent =
            totalFiles > 0
              ? Math.min(
                  100,
                  Math.round(
                    ((processed + currentProgress / 100) /
                      totalFiles) *
                      100
                  )
                )
              : 0;

          setUploadProgress({
            processed,
            total: totalFiles,
            currentFile: data.currentFile || "",
            percent:
              data.status === "completed"
                ? 100
                : overallPercent,
            message: data.message || "Processing files...",
          });
        },
        (err) => {
          console.warn(
            "Upload progress connection interrupted.",
            err
          );
        }
      );

      // Send all files in one HTTP request.
      const response = await bulkApiRequest(
        files,
        location,
        "rename",
        uploadId,
        abortController.signal
      );

      const result = response.data || {};

      const successfulFiles = Array.isArray(result.success)
        ? result.success
        : [];

      const skippedFiles = Array.isArray(result.skipped)
        ? result.skipped
        : [];

      const failedFiles = Array.isArray(result.failed)
        ? result.failed
        : [];

      const report = [
        ...successfulFiles.map((file) => ({
          name:
            file.originalName ||
            file.name ||
            file.savedName ||
            "Unknown file",
          savedName: file.savedName || null,
          status: "success",
          reason: null,
        })),

        ...skippedFiles.map((file) => ({
          name: file.originalName || file.name || "Unknown file",
          status: "skipped",
          reason: file.reason || "File skipped.",
        })),

        ...failedFiles.map((file) => ({
          name: file.originalName || file.name || "Unknown file",
          status: "failed",
          reason: file.reason || "Upload failed.",
        })),
      ];

      const successCount = successfulFiles.length;
      const skippedCount = skippedFiles.length;
      const failedCount = failedFiles.length;

      setUploadProgress({
        processed: successCount + skippedCount + failedCount,
        total,
        currentFile: "",
        percent: 100,
        message: "Upload processing completed.",
      });

      setUploadModalOpen(false);
      setSelectedFiles([]);

      if (result.status === "cancelled") {
        setMessage(
          `Upload cancelled. ${successCount} succeeded, ${failedCount} failed, ${skippedCount} skipped.`
        );
      } else {
        setMessage(
          `Bulk upload complete. ${successCount} succeeded, ${failedCount} failed, ${skippedCount} skipped.`
        );
      }

      if (report.length > 0) {
        setUploadReport(report);
      }

      await loadContents(location);
    } catch (err) {
      if (err.name === "AbortError") {
        setMessage("Upload cancelled.");
      } else {
        setError(err.message || "Bulk upload failed.");

        setUploadReport(
          files.map((file) => ({
            name: file.name,
            status: "failed",
            reason: err.message || "Upload request failed.",
          }))
        );

        setUploadModalOpen(false);
        await loadContents(location);
      }
    } finally {
      if (closeSSE) {
        closeSSE();
      }

      setUploading(false);
      setActiveUploadId(null);
      abortControllerRef.current = null;
    }
  };

  // ======================================
  // MAIN UPLOAD SUBMIT
  // ======================================

  const submitUpload = async () => {
    if (selectedFiles.length === 0) return;

    if (!isBulkMode && selectedFiles.length === 1) {
      await submitSingleUpload("cancel");
    } else {
      await submitBulkUpload();
    }
  };

  // ======================================
  // CANCEL UPLOAD
  // ======================================

  const handleCancelUpload = async () => {
    const uploadId = activeUploadId;

    if (uploadId) {
      await cancelBulkUpload(uploadId);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setUploadModalOpen(false);
    setSelectedFiles([]);
    setMessage("Upload cancellation requested.");
  };

  // ======================================
  // RESOLVE SINGLE UPLOAD CONFLICT
  // ======================================

  const resolveConflict = async (action) => {
    if (!pendingConflictFile) return;

    setConflictModalOpen(false);
    setUploading(true);
    setError("");
    setMessage("");

    const body = new FormData();

    body.append("file", pendingConflictFile.file);
    body.append("location", location);

    if (pendingConflictFile.fileName?.trim()) {
      body.append(
        "fileName",
        pendingConflictFile.fileName.trim()
      );
    }

    body.append("conflictAction", action);

    try {
      await apiRequest(`${MEDIA_API}/upload`, {
        method: "POST",
        body,
      });

      setPendingConflictFile(null);
      setSelectedFiles([]);
      setUploadModalOpen(false);

      setMessage(
        action === "replace"
          ? "File replaced."
          : "File uploaded with new name."
      );

      await loadContents(location);
    } catch (err) {
      setError(err.message || "Unable to complete upload.");

      if (err.status === 409) {
        setConflictModalOpen(true);
      }
    } finally {
      setUploading(false);
    }
  };

  // ======================================
  // CREATE FOLDER
  // ======================================

  const createFolder = async (event) => {
    event.preventDefault();

    if (!folderName.trim()) return;

    setSavingFolder(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(`${MEDIA_API}/folders`, {
        method: "POST",
        body: JSON.stringify({
          folderName: folderName.trim(),
          parentPath: location,
        }),
      });

      setFolderModalOpen(false);
      setFolderName("");
      setMessage("Folder created successfully.");

      await loadContents(location);
    } catch (err) {
      setError(err.message || "Unable to create folder.");
    } finally {
      setSavingFolder(false);
    }
  };

  // ======================================
  // FILE SELECTION
  // ======================================

  const toggleFileSelection = (fileName) => {
    setSelectedFileNames((previous) =>
      previous.includes(fileName)
        ? previous.filter((name) => name !== fileName)
        : [...previous, fileName]
    );
  };

  const visibleFileNames = filteredItems
    .filter((item) => item.type === "file")
    .map((item) => item.name);

  const allVisibleSelected =
    visibleFileNames.length > 0 &&
    visibleFileNames.every((name) =>
      selectedFileNames.includes(name)
    );

  const toggleSelectAll = () => {
    setSelectedFileNames((previous) => {
      if (allVisibleSelected) {
        return previous.filter(
          (name) => !visibleFileNames.includes(name)
        );
      }

      return [
        ...new Set([...previous, ...visibleFileNames]),
      ];
    });
  };

  // ======================================
  // COPY FILE LINK
  // ======================================

  const copyTextToClipboard = async (text) => {
    if (
      navigator.clipboard?.writeText &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback for HTTP/LAN environments.
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");

    document.body.removeChild(textarea);

    if (!copied) {
      throw new Error("COPY_FAILED");
    }
  };

  const copyFileLink = async (item) => {
    try {
      if (!item?.url) {
        throw new Error("File URL is not available.");
      }

      const encodedPath = item.url
        .split("/")
        .map((segment, index) =>
          index < 2 ? segment : encodeURIComponent(segment)
        )
        .join("/");

      const url = item.url.startsWith("http")
        ? item.url
        : `${API_BASE_URL.replace(/\/$/, "")}${encodedPath}`;

      await copyTextToClipboard(url);

      setError("");
      setMessage(`Link copied: ${item.name}`);
    } catch (err) {
      setError(
        err.message === "File URL is not available."
          ? err.message
          : "Unable to copy link. Check browser clipboard permissions."
      );
    }
  };

  // ======================================
  // BULK DELETE FILES
  // ======================================

  const deleteSelectedFiles = async () => {
    if (selectedFileNames.length === 0 || deletingFiles) {
      return;
    }

    const filesToDelete = [...selectedFileNames];
    const count = filesToDelete.length;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${count} selected file(s)?`
    );

    if (!confirmed) return;

    setDeletingFiles(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest(`${MEDIA_API}/files`, {
        method: "DELETE",
        body: JSON.stringify({
          location,
          fileNames: filesToDelete,
        }),
      });

      const result = response.data || {};

      const deletedCount =
        result.totalDeleted ?? result.deleted?.length ?? 0;

      const failedCount =
        result.totalFailed ?? result.failed?.length ?? 0;

      setSelectedFileNames([]);

      if (failedCount > 0) {
        setMessage(
          `${deletedCount} file(s) deleted. ${failedCount} file(s) could not be deleted.`
        );

        setError(
          (result.failed || [])
            .map(
              (file) =>
                `${file.fileName}: ${file.reason}`
            )
            .join(" | ")
        );
      } else {
        setMessage(
          `${deletedCount} file(s) deleted successfully.`
        );
      }

      await loadContents(location);
    } catch (err) {
      setError(
        err.message || "Unable to delete selected files."
      );
    } finally {
      setDeletingFiles(false);
    }
  };

  // ======================================
  // SINGLE FILE DELETE
  // ======================================

  const deleteFile = async (item) => {
    if (!item?.name || deletingFiles) return;

    const confirmed = window.confirm(
      `Delete "${item.name}" permanently?`
    );

    if (!confirmed) return;

    setDeletingFiles(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest(`${MEDIA_API}/files`, {
        method: "DELETE",
        body: JSON.stringify({
          location,
          fileNames: [item.name],
        }),
      });

      const result = response.data || {};

      if (result.totalDeleted > 0) {
        setMessage(`"${item.name}" deleted successfully.`);
      } else {
        const reason =
          result.failed?.[0]?.reason ||
          "Unable to delete file.";

        throw new Error(reason);
      }

      setSelectedFileNames((previous) =>
        previous.filter((name) => name !== item.name)
      );

      await loadContents(location);
    } catch (err) {
      setError(err.message || "Unable to delete file.");
    } finally {
      setDeletingFiles(false);
    }
  };

  // ======================================
  // DELETE FOLDER
  // ======================================

  const deleteFolder = async (item) => {
    const confirmed = window.confirm(
      `Delete folder "${item.name}"? Only empty folders can be deleted.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const folderPath =
        item.path || joinLocation(location, item.name);

      await apiRequest(`${MEDIA_API}/folders`, {
        method: "DELETE",
        body: JSON.stringify({
          location: folderPath,
        }),
      });

      setMessage("Folder deleted successfully.");

      await loadContents(location);
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete folder. It may not be empty."
      );
    }
  };

  // ======================================
  // FORMAT TOGGLE
  // ======================================

  const toggleFormat = async (format) => {
    setFormatLoadingId(format.id);
    setError("");
    setMessage("");

    try {
      const newStatus = !format.isAllowed;

      await apiRequest(
        `${MEDIA_API}/formats/${format.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isAllowed: newStatus,
          }),
        }
      );

      await loadFormats();

      setMessage(
        `${format.extension.toUpperCase()} ${
          newStatus ? "enabled" : "disabled"
        } successfully.`
      );
    } catch (err) {
      setError(err.message || "Unable to update format.");
    } finally {
      setFormatLoadingId(null);
    }
  };

  // ======================================
  // OPEN ITEM
  // ======================================

  const openItem = (item) => {
    if (item.type === "folder") {
      changeLocation(
        item.path || joinLocation(location, item.name)
      );
    } else if (item.url) {
      const encodedPath = item.url
        .split("/")
        .map((segment, index) =>
          index < 2 ? segment : encodeURIComponent(segment)
        )
        .join("/");

      const url = item.url.startsWith("http")
        ? item.url
        : `${API_BASE_URL.replace(/\/$/, "")}${encodedPath}`;

      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // ======================================
  // COUNTS
  // ======================================

  const totalFiles = items.filter(
    (item) => item.type === "file"
  ).length;

  const totalFolders = items.filter(
    (item) => item.type === "folder"
  ).length;

  const allowedFormats = formats.filter(
    (format) => format.isAllowed
  ).length;

  // ======================================
  // UI
  // ======================================

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <MediaHeader
        onOpenFolderModal={() => setFolderModalOpen(true)}
        onOpenSingleUpload={openSingleUpload}
        onOpenBulkUpload={openBulkUpload}
      />

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="ml-auto text-rose-500 hover:text-rose-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {message && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0"
          />

          <span>{message}</span>

          <button
            onClick={() => setMessage("")}
            className="ml-auto text-emerald-500 hover:text-emerald-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <MediaStats
        totalFiles={totalFiles}
        totalFolders={totalFolders}
        allowedFormats={allowedFormats}
        formatsLength={formats.length}
      />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <MediaToolbar
          location={location}
          breadcrumbs={breadcrumbs}
          search={search}
          view={view}
          loading={loading}
          onLocationChange={changeLocation}
          onSearchChange={setSearch}
          onViewChange={setView}
          onRefresh={() => loadContents(location)}
        />

        {/* FILE SELECTION TOOLBAR */}
        {visibleFileNames.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-700"
              >
                {allVisibleSelected ? (
                  <CheckSquare
                    size={17}
                    className="text-blue-600"
                  />
                ) : (
                  <Square size={17} />
                )}

                {allVisibleSelected
                  ? "Deselect all"
                  : "Select all files"}
              </button>

              <span className="text-sm text-slate-500">
                {selectedFileNames.length} selected
              </span>
            </div>

            {selectedFileNames.length > 0 && (
              <button
                type="button"
                onClick={deleteSelectedFiles}
                disabled={deletingFiles}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingFiles ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                {deletingFiles
                  ? "Deleting..."
                  : `Delete (${selectedFileNames.length})`}
              </button>
            )}
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle
              size={25}
              className="animate-spin text-blue-600"
            />

            Loading media library...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Folder size={30} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-800">
              {search
                ? "No matching items"
                : "This folder is empty"}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Upload a file or create a folder to start organizing your media."}
            </p>

            {!search && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setFolderModalOpen(true)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Create folder
                </button>

                <button
                  onClick={openSingleUpload}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Upload file
                </button>
              </div>
            )}
          </div>
        ) : view === "grid" ? (
          <MediaGrid
            items={filteredItems}
            onOpen={openItem}
            onDelete={deleteFile}
            onDeleteFolder={deleteFolder}
            onCopyLink={copyFileLink}
            selectedFileNames={selectedFileNames}
            onToggleSelect={toggleFileSelection}
          />
        ) : (
          <MediaList
            items={filteredItems}
            onOpen={openItem}
            onDelete={deleteFile}
            onDeleteFolder={deleteFolder}
            onCopyLink={copyFileLink}
            selectedFileNames={selectedFileNames}
            onToggleSelect={toggleFileSelection}
          />
        )}
      </section>

      <div className="flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Files are served from the public media directory.
        </span>

        <span>
          {filteredItems.length} item
          {filteredItems.length === 1 ? "" : "s"} shown
        </span>
      </div>

      {/* MODALS */}

      <FolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        folderName={folderName}
        onFolderNameChange={setFolderName}
        location={location}
        saving={savingFolder}
        onSubmit={createFolder}
      />

      <UploadModal
        open={uploadModalOpen}
        onClose={() =>
          !uploading && setUploadModalOpen(false)
        }
        uploading={uploading}
        location={location}
        selectedFiles={selectedFiles}
        onFilesChange={handleFilesChange}
        customFileName={customFileName}
        onCustomFileNameChange={setCustomFileName}
        onSubmit={submitUpload}
        uploadProgress={uploadProgress}
        isBulkMode={isBulkMode}
        onCancelUpload={handleCancelUpload}
      />

      <ConflictModal
        open={conflictModalOpen}
        uploading={uploading}
        conflictMessage={conflictMessage}
        onResolve={resolveConflict}
        onCancel={() => {
          setConflictModalOpen(false);
          setPendingConflictFile(null);
        }}
      />

      <FormatsModal
        open={formatModalOpen}
        onClose={() => setFormatModalOpen(false)}
        formats={formats}
        formatLoadingId={formatLoadingId}
        onToggleFormat={toggleFormat}
      />

      <BulkUploadReportModal
        open={!!uploadReport}
        report={uploadReport}
        onClose={() => setUploadReport(null)}
      />
    </div>
  );
}
