import { useEffect } from 'react';
import { useAppStore, type CoverType } from '../store/appStore';

// 64x64 SVG Badges
export const BUDDY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#2F6F73"/>
  <circle cx="23" cy="26" r="3.5" fill="#FFFFFF"/>
  <circle cx="41" cy="26" r="3.5" fill="#FFFFFF"/>
  <path d="M 21 37 Q 32 49 43 37" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" fill="none"/>
</svg>`;

export const GROCERY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#2E7D4F"/>
  <rect x="16" y="12" width="32" height="40" rx="6" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>
  <rect x="21" y="17" width="22" height="10" rx="2" fill="#FFFFFF" fill-opacity="0.25"/>
  <text x="32" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="bold" font-size="8" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">₹</text>
  <circle cx="23" cy="34" r="1.8" fill="#FFFFFF"/>
  <circle cx="32" cy="34" r="1.8" fill="#FFFFFF"/>
  <circle cx="41" cy="34" r="1.8" fill="#FFFFFF"/>
  <circle cx="23" cy="42" r="1.8" fill="#FFFFFF"/>
  <circle cx="32" cy="42" r="1.8" fill="#FFFFFF"/>
  <circle cx="41" cy="42" r="1.8" fill="#FFFFFF"/>
</svg>`;

export const CGPA_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#3F6FD8"/>
  <path d="M 32 16 L 50 25 L 32 34 L 14 25 Z" fill="#FFFFFF"/>
  <path d="M 20 29 v 7 c 0 4 5 7 12 7 s 12 -3 12 -7 v -7" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 32 25 L 47 28 v 10" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" fill="none"/>
  <circle cx="47" cy="39" r="2" fill="#F59E0B"/>
</svg>`;

export const CYCLE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#E88AA6"/>
  <path d="M 32 16 C 32 16 46 31 46 38 C 46 46 40 51 32 51 C 24 51 18 46 18 38 C 18 31 32 16 32 16 Z" fill="#FFFFFF"/>
</svg>`;

export function encodeSvg(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

export interface AppIdentity {
  title: string;
  themeColor: string;
  iconSvg: string;
}

export function getIdentity(isOnboarded: boolean, cover: CoverType): AppIdentity {
  if (!isOnboarded) {
    return {
      title: 'Buddy',
      themeColor: '#2F6F73',
      iconSvg: BUDDY_ICON_SVG,
    };
  }

  switch (cover) {
    case 'cgpa':
      return {
        title: 'CGPA Buddy • Semester GPA Calculator',
        themeColor: '#F2F6FF',
        iconSvg: CGPA_ICON_SVG,
      };
    case 'wellness':
      return {
        title: 'My Cycle • Period & Wellness Tracker',
        themeColor: '#FFF3F7',
        iconSvg: CYCLE_ICON_SVG,
      };
    case 'grocery':
    default:
      return {
        title: 'Ghar-Kharcha • Daily Expense & Budget',
        themeColor: '#FFF6EA',
        iconSvg: GROCERY_ICON_SVG,
      };
  }
}

export function applyIdentity(isOnboarded: boolean, cover: CoverType): void {
  if (typeof document === 'undefined') return;

  const identity = getIdentity(isOnboarded, cover);

  // 1. Update document.title
  document.title = identity.title;

  // 2. Update <meta name="theme-color">
  let metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.content = identity.themeColor;

  // 3. Replace <link rel="icon">
  const linkId = 'chuppi-dynamic-favicon';
  const existingIcon = document.getElementById(linkId);
  if (existingIcon) {
    existingIcon.remove();
  }
  // Also remove any default static icon if present
  const defaultIcon = document.querySelector('link[rel="icon"]:not(#' + linkId + ')');
  if (defaultIcon) {
    defaultIcon.remove();
  }

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = encodeSvg(identity.iconSvg);
  document.head.appendChild(link);
}

export function applyIdentityFromStorage(): void {
  try {
    const setupComplete = localStorage.getItem('chuppi_setupComplete') === 'true';
    const cover = (localStorage.getItem('chuppi_cover') as CoverType) || 'grocery';
    applyIdentity(setupComplete, cover);
  } catch {
    applyIdentity(false, 'grocery');
  }
}

export function useDynamicIdentity(): void {
  const setupComplete = useAppStore((s) => s.setupComplete);
  const cover = useAppStore((s) => s.cover);

  useEffect(() => {
    applyIdentity(setupComplete, cover);
  }, [setupComplete, cover]);
}
