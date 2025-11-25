/**
 * Detects if the current device is an iOS device
 * @returns true if the device is iOS (iPhone, iPad, iPod)
 */
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  // Check for ?mobile=true in URL for testing
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('mobile') === 'true') {
    return true
  }

  if (typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  // Check for iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream

  // Check for iPad on iOS 13+ which reports as Mac
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

  return isIOS || isIPadOS
}

/**
 * Detects if the current device is a mobile device (iOS or Android)
 * @returns true if the device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false
  }

  // Check for iOS
  if (isIOSDevice()) {
    return true
  }

  // Check for Android
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  return /android/i.test(userAgent)
}

/**
 * Gets device type as a string
 * @returns 'ios', 'android', or 'desktop'
 */
export const getDeviceType = (): 'ios' | 'android' | 'desktop' => {
  if (isIOSDevice()) {
    return 'ios'
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  if (/android/i.test(userAgent)) {
    return 'android'
  }

  return 'desktop'
}
