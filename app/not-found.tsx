export default function NotFound() {
  return <section className="wrap emptyState notFound">
    <span className="eyebrow">404</span>
    <h1>That job is no longer available.</h1>
    <p>The listing may have expired, been removed by the employer, or the address may be incorrect.</p>
    <a className="apply inlineButton" href="/jobs">Browse active jobs →</a>
  </section>;
}
