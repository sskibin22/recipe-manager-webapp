import { useState, useEffect } from "react";

const DocumentPreview = ({ fileContent, fileContentType, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [textContent, setTextContent] = useState("");

  useEffect(() => {
    if (!fileContent || !fileContentType) {
      setError("No document content available");
      setIsLoading(false);
      return;
    }

    try {
      // Create data URL from base64 content
      const url = `data:${fileContentType};base64,${fileContent}`;
      setDataUrl(url);
      setIsLoading(false);
    } catch {
      setError("Failed to load document preview");
      setIsLoading(false);
    }
  }, [fileContent, fileContentType]);

  // Load text content for text files
  useEffect(() => {
    if (fileContentType === "text/plain" && dataUrl) {
      fetch(dataUrl)
        .then((response) => response.text())
        .then((text) => setTextContent(text))
        .catch(() => setError("Failed to load text content"));
    }
  }, [dataUrl, fileContentType]);

  const handleDownload = () => {
    if (!dataUrl) return;

    try {
      // Create a temporary link element to trigger download
      const link = document.createElement("a");
      link.href = dataUrl;

      // Generate filename with appropriate extension
      const extension = getFileExtension(fileContentType);
      link.download = `${title || "recipe"}${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download document. Please try again.");
    }
  };

  const getFileExtension = (contentType) => {
    const extensionMap = {
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
      "text/plain": ".txt",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
    };
    return extensionMap[contentType] || "";
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      );
    }

    // PDF Preview
    if (fileContentType === "application/pdf") {
      return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <iframe
            src={dataUrl}
            className="w-full h-[600px]"
            title="PDF Preview"
            onError={() => setError("Failed to load PDF preview")}
          />
        </div>
      );
    }

    // Image Preview
    if (fileContentType?.startsWith("image/")) {
      return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 p-4">
          <img
            src={dataUrl}
            alt={title || "Recipe document"}
            className="max-w-full h-auto mx-auto rounded shadow-lg"
            onError={() => setError("Failed to load image")}
          />
        </div>
      );
    }

    // Text File Preview
    if (fileContentType === "text/plain") {
      return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
          <pre className="p-6 whitespace-pre-wrap font-mono text-sm text-gray-800 max-h-[600px] overflow-y-auto">
            {textContent || "Loading text content..."}
          </pre>
        </div>
      );
    }

    // Unsupported file type - show download option only
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <svg
          className="w-12 h-12 text-yellow-500 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <p className="text-yellow-800 font-medium mb-2">
          Preview not available
        </p>
        <p className="text-yellow-700 text-sm mb-4">
          File type: <span className="font-mono">{fileContentType}</span>
        </p>
        <p className="text-yellow-600 text-sm">
          Please download the file to view it.
        </p>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4">{renderPreview()}</div>

      {/* Download button - always visible */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!dataUrl}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Document
        </button>
      </div>
    </div>
  );
};

export default DocumentPreview;
