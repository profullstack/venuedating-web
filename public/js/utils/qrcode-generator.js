/**
 * QR Code Generator Utility
 * 
 * This utility provides functions for generating QR codes client-side
 * without relying on external services like Google Charts API.
 */

/**
 * Generate a QR code as a data URL
 * @param {string} text - The text to encode in the QR code
 * @param {Object} options - Options for the QR code
 * @returns {Promise<string>} - A data URL containing the QR code image
 */
export async function generateQRCode(text, options = {}) {
  // Default options
  const defaultOptions = {
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: 'H', // High error correction
    margin: 4
  };
  
  // Merge options
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // Dynamically import the QRCode library
    const QRCode = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');
    
    // Generate QR code as data URL
    return await QRCode.toDataURL(text, {
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: {
        dark: mergedOptions.colorDark,
        light: mergedOptions.colorLight
      },
      errorCorrectionLevel: mergedOptions.correctLevel
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate a QR code and render it to a canvas element
 * @param {string} text - The text to encode in the QR code
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @param {Object} options - Options for the QR code
 * @returns {Promise<void>}
 */
export async function generateQRCodeToCanvas(text, canvas, options = {}) {
  // Default options
  const defaultOptions = {
    width: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: 'H', // High error correction
    margin: 4
  };
  
  // Merge options
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // Dynamically import the QRCode library
    const QRCode = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');
    
    // Generate QR code on canvas
    await QRCode.toCanvas(canvas, text, {
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: {
        dark: mergedOptions.colorDark,
        light: mergedOptions.colorLight
      },
      errorCorrectionLevel: mergedOptions.correctLevel
    });
  } catch (error) {
    console.error('Error generating QR code to canvas:', error);
    throw error;
  }
}