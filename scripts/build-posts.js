import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const POSTS_DIR = path.join(__dirname, '../src/posts')
const OUTPUT_FILE = path.join(__dirname, '../src/utils/posts.js')

// Simple frontmatter parser (basic implementation)
function parseFrontmatter(content) {
  const lines = content.split('\n')
  if (lines[0] !== '---') {
    return { frontmatter: {}, content }
  }

  let endIndex = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i
      break
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {}, content }
  }

  const frontmatterLines = lines.slice(1, endIndex)
  const frontmatter = {}
  
  frontmatterLines.forEach(line => {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
      frontmatter[key.trim()] = value
    }
  })

  const contentLines = lines.slice(endIndex + 1)
  return {
    frontmatter,
    content: contentLines.join('\n').trim()
  }
}

function buildPosts() {
  try {
    // Read all markdown files
    const files = fs.readdirSync(POSTS_DIR)
      .filter(file => file.endsWith('.md'))
      .sort()

    const posts = files.map(file => {
      const filePath = path.join(POSTS_DIR, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { frontmatter, content } = parseFrontmatter(fileContent)
      
      const slug = path.basename(file, '.md')
      
      return {
        slug,
        title: frontmatter.title || slug,
        date: frontmatter.date || new Date().toISOString().split('T')[0],
        excerpt: frontmatter.excerpt || content.split('\n')[0].slice(0, 120) + '...',
        content,
        frontmatter
      }
    })

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Generate the posts.js file
    const output = `// Auto-generated file - do not edit manually
// Run 'npm run build-posts' to regenerate

export const posts = ${JSON.stringify(posts, null, 2)}

export function getPost(slug) {
  return posts.find(post => post.slug === slug)
}

export function getAllPosts() {
  return posts
}
`

    // Ensure utils directory exists
    const utilsDir = path.dirname(OUTPUT_FILE)
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true })
    }

    fs.writeFileSync(OUTPUT_FILE, output)
    console.log(`✅ Built ${posts.length} posts`)
    posts.forEach(post => {
      console.log(`   - ${post.title} (${post.date})`)
    })
  } catch (error) {
    console.error('❌ Error building posts:', error)
    process.exit(1)
  }
}

buildPosts()