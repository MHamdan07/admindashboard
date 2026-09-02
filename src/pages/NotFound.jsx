import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="aydara-container" style={{ padding: '120px 20px', textAlign: 'center' }}>
      <span className="editorial-sub gold-accent">ERROR 404</span>
      <h1 className="editorial-title" style={{ fontSize: '3rem', margin: '16px 0 24px 0' }}>
        CREATION NOT FOUND
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: 480, margin: '0 auto 36px auto' }}>
        The luxury silhouette or page you are seeking is either restricted or no longer in the archival catalog.
      </p>
      <Link to="/" className="btn-aydara-primary">
        RETURN TO MAISON HOMEPAGE
      </Link>
    </div>
  );
}
