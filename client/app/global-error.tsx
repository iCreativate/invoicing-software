'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '40rem', margin: '0 auto' }}>
        <h1 style={{ color: '#b91c1c', marginBottom: '0.5rem' }}>Application error</h1>
        <pre style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '14px' }}>
          {error?.message || 'Unknown error'}
        </pre>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '1rem' }}>
          Restart the dev server (stop any process on port 3003, then run <code>npm run dev</code> from the project root).
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
