import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-page" aria-labelledby="error-title">
      <img className="error-page__visual" src="/images/editorial/woven-texture.jpg" alt="Woven cotton texture" />
      <div className="error-page__veil" aria-hidden="true" />
      <div className="error-page__content">
        <p className="error-page__code">404</p>
        <h1 id="error-title" className="error-page__title">Page not found</h1>
        <Link href="/" className="error-page__back">
          <span aria-hidden="true">←</span>
          Back to the mill
        </Link>
      </div>
    </main>
  );
}
