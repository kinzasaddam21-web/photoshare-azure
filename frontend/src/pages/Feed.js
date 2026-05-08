import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { imageApi, searchApi } from '../api/client';

export default function Feed() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [searchSource, setSearchSource] = useState('');
  const [popularTags, setPopularTags] = useState([]);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const isSearching = searchQ || searchLocation || searchTag;
      if (isSearching) {
        const res = await searchApi.query({ q: searchQ, location: searchLocation, tag: searchTag });
        setImages(res.results || []);
        setSearchSource(res.source || '');
      } else {
        const res = await imageApi.list();
        setImages(res.images || []);
        setSearchSource('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQ, searchLocation, searchTag]);

  useEffect(() => { loadImages(); }, [loadImages]);

  useEffect(() => {
    let cancelled = false;
    imageApi.popularTags(10)
      .then((res) => { if (!cancelled) setPopularTags(res.tags || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    loadImages();
  }

  function clearSearch() {
    setSearchQ(''); setSearchLocation(''); setSearchTag('');
  }

  function applyTagChip(tag) {
    setSearchTag((current) => (current === tag ? '' : tag));
  }

  const isSearching = searchQ || searchLocation || searchTag;

  return (
    <div className="container">
      <div className="feed-header">
        <div>
          <h1 className="page-title">Photo Feed</h1>
          <p className="page-subtitle">Browse, search, comment, and rate photos shared by creators</p>
        </div>
        {!loading && !error && images.length > 0 && (
          <span className="count-pill">
            <strong>{images.length}</strong> {images.length === 1 ? 'photo' : 'photos'}
          </span>
        )}
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <div className="search-input-wrap">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search title, caption, people, tags..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <input
          type="text"
          placeholder="Location"
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          style={{ maxWidth: 180 }}
        />
        <input
          type="text"
          placeholder="Tag"
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          style={{ maxWidth: 140 }}
        />
        <button type="submit" className="btn">Search</button>
        {isSearching && (
          <button type="button" className="btn btn-secondary" onClick={clearSearch}>Clear</button>
        )}
      </form>

      {popularTags.length > 0 && (
        <div className="tag-chips" aria-label="Popular tags">
          <span className="tag-chips-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            Trending tags
          </span>
          {popularTags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              className={`tag-chip ${searchTag === tag ? 'active' : ''}`}
              onClick={() => applyTagChip(tag)}
              title={`${count} photo${count !== 1 ? 's' : ''}`}
            >
              {tag}
              <span className="tag-chip-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      {searchSource && (
        <div className="search-meta">
          Search powered by <strong>{searchSource}</strong> · {images.length} result{images.length !== 1 ? 's' : ''}
        </div>
      )}

      {loading && <div className="loading">Loading photos</div>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && images.length === 0 && (
        <div className="empty empty-illustration">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          <div className="empty-title">No photos found</div>
          <p>{isSearching ? 'Try different search terms or clear filters.' : 'Be the first creator to share a photo!'}</p>
        </div>
      )}

      {!loading && images.length > 0 && (
        <div className="grid">
          {images.map((img) => (
            <Link to={`/images/${img.id}`} key={img.id} className="image-card">
              <div className="image-card-thumb-wrap">
                <img
                  src={img.thumbnail_url || img.blob_url}
                  alt={img.title}
                  className="image-card-thumb"
                  loading="lazy"
                />
                <div className="image-card-overlay" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                {Array.isArray(img.tags) && img.tags.length > 0 && (
                  <div className="image-card-tags">
                    {img.tags.slice(0, 2).map((t, i) => (
                      <span className="card-tag" key={i}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="image-card-body">
                <div className="image-card-title">{img.title}</div>
                <div className="image-card-meta">
                  <span className="meta-location">
                    {img.location ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {img.location}
                      </>
                    ) : '—'}
                  </span>
                  <span>{new Date(img.upload_timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
