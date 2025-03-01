import mimetics from "mimetics";

export const validTypes = [
  "text/plain",
  "application/json",
  "image/jpeg",
  "image/png",
];

export const inferType = async (
  base64: string
): Promise<string | undefined> => {
  if (!isBase64(base64)) return;

  const buffer = Buffer.from(base64, "base64");
  const type = await mimetics.parseAsync(buffer);
  return type?.mime;
};


const isBase64 = (str: string): boolean => {
  try {
    return btoa(atob(str)) === str.replace(/\s/g, ""); // Normalize spaces
  } catch {
    return false;
  }
};
