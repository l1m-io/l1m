export const isBase64 = (str: string): boolean => {
  try {
    return btoa(atob(str)) === str.replace(/\s/g, ''); // Normalize spaces
  } catch {
    return false;
  }
};

export const inferMimeType = async (base64: string): Promise<string | undefined> => {
  const { fileTypeFromBuffer } = await import("file-type");
  if (!isBase64(base64)) return;

  const buffer = Buffer.from(base64, "base64");
  const type = await fileTypeFromBuffer(buffer);
  return type?.mime;
};
