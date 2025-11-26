// Auto-generated file - do not edit manually
// Run 'npm run build-posts' to regenerate

export const posts = [
  {
    "slug": "new-site",
    "title": "New Site Setup",
    "date": "2025-11-26",
    "excerpt": "New site setup.",
    "content": "# New Site\n\nNew redesign after quite a few years, so I've decided to shift things over onto a different domain with a focus on project work. In particular the odds & ends that I tend to tinker with, as well as various personal interests.\n\nThis page is more or less a filler to test things out before I start adding more details.",
    "frontmatter": {
      "title": "New Site Setup",
      "date": "2025-11-26",
      "excerpt": "New site setup."
    }
  }
]

export function getPost(slug) {
  return posts.find(post => post.slug === slug)
}

export function getAllPosts() {
  return posts
}
