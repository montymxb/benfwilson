import { useState } from 'react'
import { getAllPosts } from './utils/posts.js'
import Markdown from 'marked-react'
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
  return (
    <>
      <button onClick={onBack} className="back-link">← back to posts</button>
      <article>
        <h1 className="post-title">{post.title}</h1>
        <time className="post-date">{post.date}</time>
        <div className="post-content">
          <Markdown>{post.content}</Markdown>
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
        Hey! I'm a software engineer at <a href="https://www.typefox.io/">TypeFox</a> with a specialization in programming language theory.
        I do a lot of work with Langium to design & develop domain-specific programming languages, and their associated components (parsers, type checkers, transpilers, etc.).
        I've done work in a variety of domains: from industrial automation, finance, embedded systems, and more.
        I also lead the development of <a href="https://github.com/eclipse-langium/langium-ai?tab=readme-ov-file#langium-ai">Langium AI</a>, which makes it easier to build capable AI assistants for DSLs.
        Beyond work I enjoy cooking, designing 3D printable mechanisms, and reparing or recyling old tech into something new.
      </p>
      <p>
        This site is primarily focused on sharing my experiences building projects or working through tear-downs that I do in my spare time.
        Most of these projects are personal explorations, as a way to learn new skills, meditate on a task, and find personal joy & inspiration in the work itself.
        The work I share here reflects my experiences & thoughts as I proceed through these projects.
        Not all of them go exactly as planned, but quite frankly that's half the fun!
      </p>
      <p>
        It's hard to pin down <span style={{fontStyle: 'italic'}}>what</span> these projects are precisely, as my focus changes over time.
        As of late I've been focused on creating dioramas with interactive components, as a way to combine design, electronics, and programming into a single context.
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