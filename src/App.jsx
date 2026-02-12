import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router'
import { getAllPosts, getPost } from './utils/posts.js'
import Markdown from 'marked-react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import './App.css'

function Header() {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header className="header">
      <h1 className="site-title">Benjamin Friedman Wilson</h1>
      <nav className="nav">
        <Link
          to="/"
          className={isActive('/') ? 'active' : ''}
        >
          home
        </Link>
        <Link
          to="/about"
          className={isActive('/about') ? 'active' : ''}
        >
          about
        </Link>
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

function PostCard({ post }) {
  return (
    <article className="post-item">
      <h2 className="post-title">
        <Link to={`/post/${post.slug}`}>{post.title}</Link>
      </h2>
      <time className="post-date">{post.date}</time>
      <p className="post-excerpt">{post.excerpt}</p>
      <Link to={`/post/${post.slug}`} className="read-more">
        read more →
      </Link>
    </article>
  )
}

function HomePage() {
  const posts = getAllPosts()

  return (
    <div className="post-list">
      {posts.map(post => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  )
}

function PostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const post = getPost(slug)

  useEffect(() => {
    // apply syntax highlighting to all code blocks
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block)
    })
  }, [post])

  if (!post) {
    return (
      <div>
        <p>Post not found</p>
        <Link to="/" className="back-link">← back to posts</Link>
      </div>
    )
  }

  return (
    <>
      <button onClick={() => navigate('/')} className="back-link">← back to posts</button>
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
  return (
    <BrowserRouter>
      <div className="container">
        <Header />
        <main className="content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/post/:slug" element={<PostPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
