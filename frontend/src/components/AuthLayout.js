import React from 'react';

export default function AuthLayout({ tagline, children }) {
  return (
    <div className="auth-split">
      <aside className="auth-hero">
        <div className="auth-hero-inner">
          <div className="auth-hero-brand">
            <span className="brand-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </span>
            <span>PhotoShare</span>
          </div>

          <h2 className="auth-hero-title">
            {tagline || (
              <>
                Capture life.<br />
                <span className="accent">Share</span> the story.
              </>
            )}
          </h2>
          <p className="auth-hero-sub">
            A space for creators to share their photos and for everyone to discover, react and connect.
          </p>

          <div className="polaroid-stack" aria-hidden="true">
            <div className="polaroid p1">
              <img src="https://picsum.photos/seed/photoshare-a/360/440" alt="" loading="lazy" />
            </div>
            <div className="polaroid p2">
              <img src="https://picsum.photos/seed/photoshare-b/360/440" alt="" loading="lazy" />
            </div>
            <div className="polaroid p3">
              <img src="https://picsum.photos/seed/photoshare-c/360/440" alt="" loading="lazy" />
            </div>
          </div>
        </div>
      </aside>

      <main className="auth-form-side">
        {children}
      </main>
    </div>
  );
}
