// Shared layout fragments used across pages. Pulled out of App.jsx so any
// page (marketing or app) can reuse the same header/section styling without
// creating a circular import back into App.jsx.

export function PageIntro({ kicker, title, copy }) {
  return (
    <section className="page-intro">
      <div className="container">
        <p className="eyebrow">{kicker}</p>
        <h1 className="page-title">{title}</h1>
        {copy && <p className="page-copy">{copy}</p>}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
