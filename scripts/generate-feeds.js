import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { posts } from '../src/utils/posts.js'
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION, AUTHOR, escapeMarkup, pageUrl, postUrl, postDate } from './site.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.join(__dirname, '../dist')

function generateSitemap() {
  const entries = [
    { loc: pageUrl('/'), lastmod: posts.length ? posts[0].date : null },
    { loc: pageUrl('/about'), lastmod: null },
    { loc: pageUrl('/resume'), lastmod: null }
  ]
  for (const post of posts) {
    entries.push({ loc: postUrl(post), lastmod: post.date })
  }

  const urls = []
  for (const entry of entries) {
    const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''
    urls.push(`  <url>\n    <loc>${escapeMarkup(entry.loc)}</loc>${lastmod}\n  </url>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

function generateRss() {
  const items = []
  for (const post of posts) {
    const url = escapeMarkup(postUrl(post))
    items.push(`    <item>
      <title>${escapeMarkup(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${postDate(post).toUTCString()}</pubDate>
      <description>${escapeMarkup(post.excerpt)}</description>
    </item>`)
  }

  const lastBuild = posts.length ? postDate(posts[0]) : new Date()

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeMarkup(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeMarkup(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`
}

function generateAtom() {
  const entries = []
  for (const post of posts) {
    const url = escapeMarkup(postUrl(post))
    const date = postDate(post).toISOString()
    entries.push(`  <entry>
    <title>${escapeMarkup(post.title)}</title>
    <link href="${url}" />
    <id>${url}</id>
    <published>${date}</published>
    <updated>${date}</updated>
    <summary>${escapeMarkup(post.excerpt)}</summary>
  </entry>`)
  }

  const updated = posts.length ? postDate(posts[0]) : new Date()

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeMarkup(SITE_TITLE)}</title>
  <subtitle>${escapeMarkup(SITE_DESCRIPTION)}</subtitle>
  <link href="${SITE_URL}/" />
  <link href="${SITE_URL}/atom.xml" rel="self" type="application/atom+xml" />
  <id>${SITE_URL}/</id>
  <updated>${updated.toISOString()}</updated>
  <author>
    <name>${escapeMarkup(AUTHOR)}</name>
  </author>
${entries.join('\n')}
</feed>
`
}

function generateFeeds() {
  console.log('🔨 Generating sitemap & feeds...')

  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('Build output not found. Run "vite build" first.')
  }

  const outputs = {
    'sitemap.xml': generateSitemap(),
    'feed.xml': generateRss(),
    'atom.xml': generateAtom()
  }
  for (const [file, content] of Object.entries(outputs)) {
    fs.writeFileSync(path.join(DIST_DIR, file), content)
    console.log(`   ✓ /${file}`)
  }
}

generateFeeds()
