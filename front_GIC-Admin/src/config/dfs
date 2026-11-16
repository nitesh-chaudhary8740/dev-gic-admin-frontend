// src/config/sanitizeConfig.js

/**
 * DOMPurify Sanitization Configuration
 * 
 * Yeh config public site par HTML content render karne ke liye use hota hai.
 * Isme sirf safe tags aur attributes allow kiye gaye hain.
 * Scripts, iframes, aur inline event handlers completely blocked hain.
 */

export const SANITIZE_CONFIG = {
  // Allowed HTML tags
  ALLOWED_TAGS: [
    // Text formatting
    "p", "br", "strong", "b", "em", "i", "u", "s", "span", "div",
    
    // Headings
    "h1", "h2", "h3", "h4", "h5", "h6",
    
    // Lists
    "ul", "ol", "li",
    
    // Links & media
    "a", "img", "video", "audio", "source",
    
    // Quotes & code
    "blockquote", "pre", "code",
    
    // Tables
    "table", "thead", "tbody", "tr", "th", "td",
    
    // Semantic layout
    "section", "article", "header", "footer", "main", "aside", "nav",
    "figure", "figcaption", "hr",
    
    // CSS (embedded styles)
    "style",
  ],

  // Allowed attributes on HTML elements
  ALLOWED_ATTR: [
    "href", "src", "alt", "title",
    "width", "height", "class", "id",
    "style", "target", "rel", "loading", "controls", "type",
  ],

  // Tags jo completely block karne hain
  FORBID_TAGS: [
    "script",   // XSS ka main weapon
    "iframe",   // Clickjacking / embedding risk
    "object",   // Plugin-based attacks
    "embed",    // Plugin-based attacks
    "form",     // Form hijacking
  ],

  // Attributes jo completely block karne hain
  FORBID_ATTR: [
    "onerror", "onload", "onclick", "onmouseover", "onfocus",
    "onmouseenter", "onmouseleave", "onchange", "onsubmit",
  ],

  // URL schemes jo allow hain (data: aur javascript: block)
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitize HTML content using DOMPurify with the config above.
 * @param {string} html - Raw HTML content
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(DOMPurify, html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}