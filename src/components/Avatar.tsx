import { useEffect, useState } from 'react';

/** Profile picture, saved on this device until the server exists (to-do 1). */
const key = (userId: string) => `cardinal.avatar.v1.${userId}`;
const EVT = 'cardinal-avatar';

export function getAvatar(userId: string): string | null {
  try { return localStorage.getItem(key(userId)); } catch { return null; }
}

export function setAvatar(userId: string, dataUrl: string | null) {
  try {
    if (dataUrl) localStorage.setItem(key(userId), dataUrl); else localStorage.removeItem(key(userId));
  } catch { /* storage full */ }
  window.dispatchEvent(new Event(EVT));
}

export function useAvatar(userId: string | undefined) {
  const [src, setSrc] = useState<string | null>(() => (userId ? getAvatar(userId) : null));
  useEffect(() => {
    if (!userId) return;
    const on = () => setSrc(getAvatar(userId));
    on();
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, [userId]);
  return src;
}

/** Centre-crops a picked photo to a 256px square JPEG so it stays small. */
export function resizeToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = 256;
      const c = document.createElement('canvas');
      c.width = s; c.height = s;
      const side = Math.min(img.width, img.height);
      c.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, s, s);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that picture')); };
    img.src = url;
  });
}
