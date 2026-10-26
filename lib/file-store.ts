"use client";

// Kho file của bản demo: lưu nội dung file trong IndexedDB của trình duyệt.
// Production thay 3 hàm này bằng S3:
//   putFile  → xin presigned PUT URL từ server rồi upload thẳng lên S3
//   getFile  → xin presigned GET URL (hết hạn sau vài phút)
//   deleteFile → server xóa object và bản ghi Attachment

const DB_NAME = "yose-files";
const STORE = "files";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const ACCEPT = [
  "application/pdf",
  "image/*",
  "audio/*",
  "video/mp4",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
].join(",");

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function putFile(id: string, blob: Blob) {
  return tx("readwrite", (s) => s.put(blob, id));
}

export async function getFile(id: string): Promise<Blob | undefined> {
  try {
    return await tx<Blob | undefined>("readonly", (s) => s.get(id));
  } catch {
    return undefined;
  }
}

export async function deleteFile(id: string) {
  try {
    await tx("readwrite", (s) => s.delete(id));
  } catch {
    /* không có file thì thôi */
  }
}

export async function clearFiles() {
  try {
    await tx("readwrite", (s) => s.clear());
  } catch {
    /* ignore */
  }
}
