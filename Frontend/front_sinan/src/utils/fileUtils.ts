// Utility functions for handling file operations
import { getApiBaseUrl } from './network';

/**
 * Extract file ID from Google Drive URL
 * Supports various Google Drive URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/document/d/FILE_ID/edit
 * etc.
 */
export const extractFileIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Pattern 1: /file/d/FILE_ID/
  const filePattern = /\/file\/d\/([a-zA-Z0-9-_]+)/;
  const fileMatch = url.match(filePattern);
  if (fileMatch) {
    return fileMatch[1];
  }
  
  // Pattern 2: /document/d/FILE_ID/ or /spreadsheets/d/FILE_ID/
  const docPattern = /\/(?:document|spreadsheets|presentation)\/d\/([a-zA-Z0-9-_]+)/;
  const docMatch = url.match(docPattern);
  if (docMatch) {
    return docMatch[1];
  }
  
  // Pattern 3: ?id=FILE_ID
  const idPattern = /[?&]id=([a-zA-Z0-9-_]+)/;
  const idMatch = url.match(idPattern);
  if (idMatch) {
    return idMatch[1];
  }
  
  // Pattern 4: /folders/FOLDER_ID or /d/FILE_ID
  const dPattern = /\/d\/([a-zA-Z0-9-_]+)/;
  const dMatch = url.match(dPattern);
  if (dMatch) {
    return dMatch[1];
  }
  
  return null;
};

/**
 * Get backend file viewer URL for a Google Drive file
 */
export const getFileViewerUrl = (googleDriveUrl: string): string | null => {
  const fileId = extractFileIdFromUrl(googleDriveUrl);
  if (!fileId) return null;

  // Construct backend file viewer URL
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/masterdata/file/${fileId}/`;
};

/**
 * Check if a file type can be viewed in browser
 */
export const canViewInBrowser = (mimeType?: string): boolean => {
  if (!mimeType) return false;
  
  const viewableTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/json'
  ];
  
  return viewableTypes.some(type => mimeType.includes(type));
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Get file type icon based on extension or mime type
 */
export const getFileTypeIcon = (filename?: string, mimeType?: string): string => {
  const extension = filename ? getFileExtension(filename) : '';
  
  // Check by extension first
  if (extension) {
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️';
      case 'zip':
      case 'rar':
      case '7z':
        return '🗜️';
      case 'dst':
        return '🧵';
      case 'dgt':
        return '🎨';
      default:
        break;
    }
  }
  
  // Check by mime type
  if (mimeType) {
    if (mimeType.includes('image/')) return '🖼️';
    if (mimeType.includes('video/')) return '🎥';
    if (mimeType.includes('audio/')) return '🎵';
    if (mimeType.includes('text/')) return '📄';
    if (mimeType.includes('application/pdf')) return '📄';
  }
  
  return '📁';
};

/**
 * Fetch file content from backend with proper authentication
 */
export const fetchFileContent = async (googleDriveUrl: string, authHeaders: any): Promise<{
  success: boolean;
  data?: Blob;
  filename?: string;
  mimeType?: string;
  error?: string;
}> => {
  try {
    const fileId = extractFileIdFromUrl(googleDriveUrl);
    if (!fileId) {
      return { success: false, error: 'Could not extract file ID from URL' };
    }

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/masterdata/file/${fileId}/`;

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders.headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `file_${fileId}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    const mimeType = response.headers.get('Content-Type') || 'application/octet-stream';
    const data = await response.blob();
    
    return {
      success: true,
      data,
      filename,
      mimeType
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Create a downloadable URL from blob data
 */
export const createBlobUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

/**
 * Download a blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = createBlobUrl(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
