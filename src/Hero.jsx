export default function Hero() {
  return (
    <>
      {/* Floating frosted-glass navigation pill */}
      <nav className="nav-pill" data-cursor="hover" aria-label="Primary">
        <a href="#work" className="nav-link">
          Work
        </a>
        <span className="nav-sep" aria-hidden="true" />
        <a href="#about" className="nav-link">
          About
        </a>
        <span className="nav-sep" aria-hidden="true" />
        <a href="#contact" className="nav-link">
          Contact
        </a>
      </nav>

      {/* Hero typography, bottom-left */}
      <div className="hero-copy">
        <p className="hero-greet">Hi, I&apos;m</p>
        <h1 className="hero-name">Sanya</h1>
        <p className="hero-bio">
          Passionate about optimizing system reliability, 
          operational efficiency, and developer productivity through 
          continuous improvement and scalable architectural design.
        </p>

        <div className="hero-actions">
          <a href="#resume" className="btn btn-solid" data-cursor="hover">
            Resume
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a href="#contact" className="btn btn-ghost" data-cursor="hover">
            Let&apos;s Talk
          </a>
        </div>
      </div>
    </>
  );
}
