import { useState } from 'react'
import { getAllPosts } from './utils/posts.js'
import './App.css'

function Header({ currentPage, onNavigate }) {
  return (
    <header className="header">
      <h1 className="site-title">Benjamin Friedman Wilson</h1>
      <nav className="nav">
        <button 
          onClick={() => onNavigate('home')} 
          className={currentPage === 'home' ? 'active' : ''}
        >
          home
        </button>
        <button 
          onClick={() => onNavigate('about')} 
          className={currentPage === 'about' ? 'active' : ''}
        >
          about
        </button>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <p>© Benjamin Friedman Wilson 2025</p>
    </footer>
  )
}

function PostCard({ post, onSelectPost }) {
  return (
    <article className="post-item">
      <h2 className="post-title">
        <button onClick={() => onSelectPost(post)}>{post.title}</button>
      </h2>
      <time className="post-date">{post.date}</time>
      <p className="post-excerpt">{post.excerpt}</p>
      <button onClick={() => onSelectPost(post)} className="read-more">
        read more →
      </button>
    </article>
  )
}

function HomePage({ posts, onSelectPost }) {
  return (
    <div className="post-list">
      {posts.map(post => (
        <PostCard key={post.slug} post={post} onSelectPost={onSelectPost} />
      ))}
    </div>
  )
}

function PostPage({ post, onBack }) {
  // Simple markdown-to-HTML conversion for now
  const renderContent = (content) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.startsWith('# ')) {
          return <h1 key={index}>{paragraph.slice(2)}</h1>
        }
        if (paragraph.startsWith('## ')) {
          return <h2 key={index}>{paragraph.slice(3)}</h2>
        }
        if (paragraph.trim() === '') {
          return null
        }
        return <p key={index}>{paragraph}</p>
      })
      .filter(Boolean)
  }

  return (
    <>
      <button onClick={onBack} className="back-link">← back to posts</button>
      <article>
        <time className="post-date">{post.date}</time>
        <div className="post-content">
          {renderContent(post.content)}
        </div>
      </article>
    </>
  )
}

function AboutPage() {
  return (
    <div className="about-content">
      <h1>About</h1>
      <p>
        I'm a designer and developer interested in the intersection of digital and physical spaces. 
        This website is my attempt to create a calm corner of the internet.
      </p>
      <p>
        This site is built with React and Vite, styled with pure CSS, and designed with 
        readability and simplicity in mind.
      </p>
    </div>
  )
}

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedPost, setSelectedPost] = useState(null)
  
  // Load posts from build script
  const posts = getAllPosts()

  const handleNavigate = (page) => {
    setCurrentPage(page)
    setSelectedPost(null)
  }

  const handleSelectPost = (post) => {
    setSelectedPost(post)
    setCurrentPage('post')
  }

  const handleBackToPosts = () => {
    setSelectedPost(null)
    setCurrentPage('home')
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'about':
        return <AboutPage />
      case 'post':
        return <PostPage post={selectedPost} onBack={handleBackToPosts} />
      default:
        return <HomePage posts={posts} onSelectPost={handleSelectPost} />
    }
  }

  return (
    <div className="container">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="content">
        {renderContent()}
      </main>
      <Footer />
    </div>
  )
}

export default App