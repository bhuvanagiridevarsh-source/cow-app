import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { isUsableUrl } from '@/domain/urls';

/**
 * Opens a URL in the phone's own browser (Safari/Chrome). Used for donations,
 * which must happen outside the app. Returns false if the link couldn't be opened.
 */
export async function openExternal(url: string): Promise<boolean> {
  if (!isUsableUrl(url)) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Opens a web page in an in-app browser sheet (About links, Join form, legal pages). */
export async function openInApp(url: string): Promise<boolean> {
  if (!isUsableUrl(url)) return false;
  try {
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch {
    return openExternal(url);
  }
}

/** Opens the mail app addressed to `email`. */
export async function openEmail(email: string): Promise<boolean> {
  try {
    await Linking.openURL(`mailto:${email}`);
    return true;
  } catch {
    return false;
  }
}
