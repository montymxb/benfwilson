import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOCS_DIR = path.join(__dirname, '../docs')
const POSTS_FILE = path.join(__dirname, '../src/utils/posts.js')

// read the base index.html from the build output
function getBaseHtml() {
  const indexPath = path.join(DOCS_DIR, 'index.html')
  if (!fs.existsSync(indexPath)) {
    throw new Error('Build output not found. Run "vite build" first.')
  }
  return fs.readFileSync(indexPath, 'utf-8')
}

// extract posts data from the generated posts.js file
function getPosts() {
  const postsContent = fs.readFileSync(POSTS_FILE, 'utf-8')
  // extract the JSON array from the posts.js file
  const match = postsContent.match(/export const posts = (\[[\s\S]*?\n\])/m)
  if (!match) {
    throw new Error('Could not parse posts from posts.js')
  }
  return JSON.parse(match[1])
}

// create an HTML page with optional meta tags for SEO
function createHtmlPage(baseHtml, title, description) {
  let html = baseHtml

  // update title if provided
  if (title) {
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${title} - Benjamin F. Wilson</title>`
    )

    // add meta tags for better SEO and social sharing
    const metaTags = `
    <meta property="og:title" content="${title}" />
    <meta name="description" content="${description || title}" />
    <meta property="og:description" content="${description || title}" />`

    html = html.replace('</head>', `${metaTags}\n  </head>`)
  }

  return html
}

function generatePages() {
  console.log('🔨 Generating static pages...')

  const baseHtml = getBaseHtml()
  const posts = getPosts()

  // generate page for /about
  const aboutDir = path.join(DOCS_DIR, 'about')
  if (!fs.existsSync(aboutDir)) {
    fs.mkdirSync(aboutDir, { recursive: true })
  }
  const aboutHtml = createHtmlPage(
    baseHtml,
    'About',
    'Software engineer specializing in programming language theory and DSL development'
  )
  fs.writeFileSync(path.join(aboutDir, 'index.html'), aboutHtml)
  console.log('   ✓ /about')

  // generate pages for each post
  let postCount = 0
  for (const post of posts) {
    const postDir = path.join(DOCS_DIR, 'post', post.slug)
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true })
    }

    const postHtml = createHtmlPage(
      baseHtml,
      post.title,
      post.excerpt
    )
    fs.writeFileSync(path.join(postDir, 'index.html'), postHtml)
    console.log(`   ✓ /post/${post.slug}`)
    postCount++
  }

  console.log(`\n✅ Generated ${postCount + 1} pages (${postCount} posts + 1 about page)`)
}

generatePages()
