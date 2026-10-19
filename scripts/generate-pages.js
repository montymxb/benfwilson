import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { posts } from '../src/utils/posts.js'
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION, AUTHOR, escapeMarkup, pageUrl, postUrl, absoluteUrl, postDate, postTags } from './site.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.join(__dirname, '../dist')

// read the base index.html from the build output
function getBaseHtml() {
  const indexPath = path.join(DIST_DIR, 'index.html')
  if (!fs.existsSync(indexPath)) {
    throw new Error('Build output not found. Run "vite build" first.')
  }
  return fs.readFileSync(indexPath, 'utf-8')
}

// serialize JSON-LD so it can't close the surrounding script tag early
function jsonLd(data) {
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">\n${json}\n</script>`
}

const PERSON = {
  '@type': 'Person',
  name: AUTHOR,
  url: `${SITE_URL}/`
}

// build the <head> tags for a page
// page: { title, description, url, type, image?, imageAlt?, article?, structuredData }
function headTags(page) {
  const tags = [
    `<meta name="description" content="${escapeMarkup(page.description)}" />`,
    `<meta name="author" content="${escapeMarkup(AUTHOR)}" />`,
    `<link rel="canonical" href="${escapeMarkup(page.url)}" />`,
    `<meta property="og:site_name" content="${escapeMarkup(SITE_TITLE)}" />`,
    '<meta property="og:locale" content="en_US" />',
    `<meta property="og:type" content="${page.type}" />`,
    `<meta property="og:url" content="${escapeMarkup(page.url)}" />`,
    `<meta property="og:title" content="${escapeMarkup(page.title)}" />`,
    `<meta property="og:description" content="${escapeMarkup(page.description)}" />`,
    `<meta name="twitter:card" content="${page.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeMarkup(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeMarkup(page.description)}" />`
  ]

  // only emit image tags when the page has one
  if (page.image) {
    const image = escapeMarkup(absoluteUrl(page.image))
    tags.push(`<meta property="og:image" content="${image}" />`)
    tags.push(`<meta name="twitter:image" content="${image}" />`)
    if (page.imageAlt) {
      tags.push(`<meta property="og:image:alt" content="${escapeMarkup(page.imageAlt)}" />`)
      tags.push(`<meta name="twitter:image:alt" content="${escapeMarkup(page.imageAlt)}" />`)
    }
  }

  // article specific tags for posts
  if (page.article) {
    tags.push(`<meta property="article:published_time" content="${page.article.published}" />`)
    tags.push(`<meta property="article:author" content="${escapeMarkup(AUTHOR)}" />`)
    for (const tag of page.article.tags) {
      tags.push(`<meta property="article:tag" content="${escapeMarkup(tag)}" />`)
    }
  }

  tags.push(jsonLd(page.structuredData))
  return tags
}

// create an HTML page with the title & meta tags for SEO and social sharing
function createHtmlPage(baseHtml, page, pageTitle) {
  const html = baseHtml.replace(
    /<title>.*?<\/title>/,
    `<title>${escapeMarkup(pageTitle)}</title>`
  )
  const head = headTags(page).join('\n    ')
  return html.replace('</head>', `  ${head}\n  </head>`)
}

function writePage(pathname, html) {
  const dir = path.join(DIST_DIR, pathname)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
  console.log(`   ✓ ${pathname}`)
}

function generatePages() {
  console.log('🔨 Generating static pages...')

  const baseHtml = getBaseHtml()

  // home page, rewritten in place
  writePage('/', createHtmlPage(baseHtml, {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: pageUrl('/'),
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      url: pageUrl('/'),
      author: PERSON
    }
  }, SITE_TITLE))

  // static about & resume pages
  const staticPages = [
    {
      pathname: '/about',
      title: 'About',
      description: 'Software engineer specializing in programming language theory and DSL development',
      schemaType: 'AboutPage'
    },
    {
      pathname: '/resume',
      title: 'Resume',
      description: 'Resume of Benjamin F. Wilson, software & language engineer',
      schemaType: 'ProfilePage'
    }
  ]
  for (const staticPage of staticPages) {
    const url = pageUrl(staticPage.pathname)
    writePage(staticPage.pathname, createHtmlPage(baseHtml, {
      title: staticPage.title,
      description: staticPage.description,
      url,
      type: 'website',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': staticPage.schemaType,
        name: staticPage.title,
        description: staticPage.description,
        url,
        mainEntity: PERSON
      }
    }, `${staticPage.title} - ${SITE_TITLE}`))
  }

  // generate pages for each post
  for (const post of posts) {
    const url = postUrl(post)
    const published = postDate(post).toISOString()
    const tags = postTags(post)
    const image = post.frontmatter.image
    const imageAlt = post.frontmatter.imageAlt

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url,
      mainEntityOfPage: url,
      datePublished: published,
      author: PERSON
    }
    if (tags.length) {
      structuredData.keywords = tags.join(', ')
    }
    if (image) {
      structuredData.image = absoluteUrl(image)
    }

    writePage(`/post/${post.slug}`, createHtmlPage(baseHtml, {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      image,
      imageAlt,
      article: { published, tags },
      structuredData
    }, `${post.title} - ${SITE_TITLE}`))
  }

  console.log(`\n✅ Generated ${posts.length + 3} pages (${posts.length} posts + home, about & resume pages)`)
}

generatePages()
