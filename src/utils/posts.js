// Auto-generated file - do not edit manually
// Run 'npm run build-posts' to regenerate

export const posts = [
  {
    "slug": "example",
    "title": "Example Post",
    "date": "2025-08-07",
    "excerpt": "This is an example post.",
    "content": "# Example Post\n\nThis is an example post.\n\n- ok\n- this is a test\n- another item\n\n1. First item\n2. _Second item_\n\n```javascript\nconsole.log('This is a code block');\n```\n\n**This post serves** as a template for future entries. It includes various elements such as lists, code blocks, and formatting to demonstrate how content can be structured.\n\n> This is a blockquote to highlight important information.",
    "frontmatter": {
      "title": "Example Post",
      "date": "2025-08-07",
      "tags": "[example, post]",
      "excerpt": "This is an example post."
    }
  },
  {
    "slug": "e2",
    "title": "Welcome to My Digital Space",
    "date": "2025-01-15",
    "excerpt": "A brief introduction to this new iteration of my personal website.",
    "content": "# Welcome to My Digital Space\n\nThis is the inaugural post of my redesigned personal website. After years of complexity, I've decided to embrace simplicity.\n\nThe design draws subtle inspiration from terminal interfaces—clean, functional, and distraction-free. But it's designed for everyone, not just those familiar with command lines.",
    "frontmatter": {
      "title": "Welcome to My Digital Space",
      "date": "2025-01-15",
      "excerpt": "A brief introduction to this new iteration of my personal website."
    }
  }
]

export function getPost(slug) {
  return posts.find(post => post.slug === slug)
}

export function getAllPosts() {
  return posts
}
