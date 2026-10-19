// shared site metadata & helpers for the build scripts

export const SITE_URL = 'https://www.benfwilson.com'
export const SITE_TITLE = 'Benjamin F. Wilson'
export const SITE_DESCRIPTION = 'Posts on software, language engineering, and hardware projects'
export const AUTHOR = 'Benjamin F. Wilson'

// escape text for safe inclusion in XML or HTML text & attributes
export function escapeMarkup(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// GitHub Pages serves each page as a directory, so use the trailing slash form
export function pageUrl(pathname) {
  return pathname === '/' ? `${SITE_URL}/` : `${SITE_URL}${pathname}/`
}

export function postUrl(post) {
  return pageUrl(`/post/${post.slug}`)
}

// resolve a site relative path (e.g. /assets/images/x.jpg) to an absolute URL
export function absoluteUrl(value) {
  return /^https?:\/\//.test(value) ? value : `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

// post dates are YYYY-MM-DD, treat them as midnight UTC
export function postDate(post) {
  return new Date(`${post.date}T00:00:00Z`)
}

// front matter tags look like "[post, project, avr]", drop the 'post' marker
export function postTags(post) {
  const raw = post.frontmatter.tags || ''
  const tags = []
  for (const tag of raw.replace(/^\[|\]$/g, '').split(',')) {
    const trimmed = tag.trim()
    if (trimmed && trimmed !== 'post') {
      tags.push(trimmed)
    }
  }
  return tags
}
