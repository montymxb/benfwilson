// resume content, mirrored from cv-industry-public.typ in the Resume repo
// the PDF in public/assets/resume/ is compiled from cv-industry-onepage-public.typ

export const resumePdfs = [
  { label: 'resume (pdf)', href: '/assets/resume/benjamin-wilson-resume.pdf' },
]

export const experience = [
  {
    role: 'Sr. Software Engineer & Consultant',
    org: 'TypeFox GmbH',
    location: 'Germany (Remote)',
    period: '2024 – Present',
    points: [
      'Design and deliver Langium-based DSLs, type systems, and code generators for enterprise clients',
      {
        text: 'Founded and lead [Langium AI](https://github.com/eclipse-langium/langium-ai), an Eclipse Foundation project bringing AI-assisted development to DSLs',
        sub: ['Featured as part of the Eclipse Foundation\'s open source AI innovation efforts ([aieclipse.org](https://aieclipse.org))'],
      },
      'Driving AI integration into the company\'s general engineering workflows',
      'Served as primary point of contact for U.S. and European clients, leading multiple concurrent projects',
      'Drove practical AI adoption across language-engineering workflows, from prototyping to production guidance',
      'Active contributor to Eclipse Foundation projects (Langium, Langium AI)',
      'Conference speaker for the Langium ecosystem (LangDev, OCX)',
      'Linux Foundation contributor (PL/I language support)',
    ],
  },
  {
    role: 'Language Engineer',
    org: 'TypeFox GmbH',
    location: 'Germany (Remote)',
    period: '2022 – 2024',
    points: [
      'Project lead for a major client developing legacy DSL support with a Sprotty graphical integration',
      'Took over two in-progress DSL engagements and guided them to successful delivery through consistent, incremental releases, overhauling grammar, validation, and type-checking logic along the way',
      'Active contributor to Eclipse Langium, the language-engineering workbench',
      'Authored early Langium guides and videos, and spoke at conferences to drive Langium adoption',
      'Provided DSL consultation and acted as primary contact for U.S. and European clients',
    ],
  },
  {
    role: 'Research Assistant',
    org: 'Programming Languages Group, OSU',
    location: 'Corvallis, OR',
    period: '2020 – 2021',
    points: [
      'Researched classification and ordering systems for guiding the presentation of programming examples, under Prof. Martin Erwig',
      'Developed BoGL, an educational programming language written in Haskell, and studied its impact in the classroom',
      'Engineered and maintained OSU\'s BoGL stack on Amazon EC2',
      'Led development for the [Childsplay](https://research.engr.oregonstate.edu/childsplay) research group showcase site',
    ],
  },
  {
    role: 'Core Contributor (Open Source)',
    org: 'Parse Community',
    location: 'GitHub (Remote)',
    period: '2017 – 2018',
    points: [
      'Maintained and developed the [Parse PHP SDK](https://github.com/parse-community/parse-php-sdk/) for the Parse BaaS',
      'Boosted CI coverage past 90%, making it the most-covered repo in the org at the time, with automated style enforcement and docs generation',
      'Reviewed pull requests, mentored contributors, and helped migrate Parse from Facebook to a community-run organization',
    ],
  },
  {
    role: 'Head Software Engineer & Co-Founder',
    org: 'Axolsoft',
    location: 'Upland, CA',
    period: '2015 – 2017',
    points: [
      'Co-founded a general software LLC and ran day-to-day operations',
      'Built CRM and administration portals for services and payments (PHP, SQL, Braintree) and delivered full-stack web projects for clients',
      'Maintained Ubuntu-based server infrastructure (HP Proliant DL360/DL380) and built a DKIM-signed HTML email SDK and a MySQL data-access layer',
    ],
  },
  {
    role: 'Independent Software Development',
    org: 'Self-employed',
    location: 'Remote',
    period: '2013 – 2021',
    points: [
      'Created [Latria](https://latria.uphouseworks.com), a cross-platform scripting language in ANSI-C',
      'Wrote [Banter](https://github.com/montymxb/banter), a C/OpenGL tool for 3D structure-agnostic data visualization of files',
      'Designed and built a [personal website](https://www.uphouseworks.com) from scratch',
    ],
  },
]

export const education = [
  {
    role: 'M.S., Computer Science',
    org: 'Oregon State University',
    location: 'Corvallis, OR',
    period: '2019 – 2021',
    points: [
      'Focus: Programming Language Theory, Computer Graphics, AI',
      'Thesis: Structuring Teachable Knowledge through Program-Concept Classifications',
    ],
  },
  {
    role: 'B.S., Computer Science',
    org: 'Oregon State University',
    location: 'Corvallis, OR',
    period: '2016 – 2020',
    points: [
      'Cum Laude, Computer Systems option',
      'Wrote the educational domain-specific language BoGL with capstone team',
    ],
  },
]

export const publications = [
  'Meier, Smyth, **Wilson**, Fuhrmann. [*Langium: A TypeScript-Based Language Workbench for Domain-Specific Languages*](https://doi.org/10.1145/3837062.3838881). MODELS Companion \'26, ACM, 2026.',
]

export const talks = [
  {
    role: 'Building AI Assistants for DSLs: Experiences and Findings from Langium AI',
    org: 'Open Community Experience (OCX)',
    location: 'Brussels, Belgium',
    period: '2026',
    url: 'https://www.youtube.com/watch?v=azEviJdNZ5E',
  },
  {
    role: 'Langium + AI: Building AI Applications for DSLs',
    org: 'LangDev',
    location: 'Sevilla, Spain',
    period: '2024',
    url: 'https://www.youtube.com/watch?v=G0zqx7MqUKs',
  },
  {
    role: 'Langium, a Modern Day Language Engineering Framework',
    org: 'LangDev',
    location: 'Aachen, Germany',
    period: '2022',
    url: 'https://langdevcon.org/slides/2022/9589.pdf',
  },
]

export const service = [
  {
    role: 'Grant Participation',
    period: '2019 – 2022',
    points: [
      'Parham-Mocello, J., Erwig, M., & Niess, M. Child\'s Play: Learning Computer Science Through Tabletop Games, National Science Foundation, Award No. 1923628, $1,000,000',
      'Researcher and developer for the BoGL language and subsequent curriculum',
    ],
  },
  {
    role: 'VLHCC Conference Paper Co-Reviewer',
    period: '2021',
    points: [
      'Assisted a PhD student with review of a VLHCC 2021 submission, contributing web-engineering expertise',
    ],
  },
  {
    role: 'Invited Participant, Portland Connect',
    period: '2019',
    points: [
      'One of 20 undergraduates selected to showcase OSU\'s top students',
    ],
  },
]

export const skills = [
  '**Languages & Protocols:** TypeScript/JavaScript, Language Server Protocol (LSP); *Familiar*: C, C++, Haskell, Java, Python, PHP, Bash, Zig, Go, Lua',
  '**Language Engineering:** Language Design & Development (Front-end), Type System Development, Code Generator & Compiler Design',
  '**Tooling & Platforms:** VSCode Extension Development, Custom IDEs (Monaco-based), AI Workflow Engineering (Software Engineering Automation), Ansible, Nix',
  '**Web & Data:** Full-Stack Development, HTML5 & CSS, SQL, MySQL & MongoDB',
  '**Engineering Practice:** Software Verification, Testing, CI/CD',
  '**Professional:** Project Leadership, Public Speaking & Presentation, Native English Communication, International Client Relations (US–EU), Consultation',
]
