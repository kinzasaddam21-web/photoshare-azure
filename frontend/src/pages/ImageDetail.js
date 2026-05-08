import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { imageApi, commentApi, ratingApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ImageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [comments, setComments] = useState([]);
  const [rating, setRating] = useState({ average: 0, count: 0, my_rating: null });
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [imgRes, commentsRes, ratingRes] = await Promise.all([
        imageApi.get(id),
        commentApi.list(id),
        ratingApi.get(id).catch(() => ({ average: 0, count: 0, my_rating: null })),
      ]);
      setImage(imgRes.image);
      setComments(commentsRes.comments || []);
      setRating(ratingRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await commentApi.add(id, newComment.trim());
      setNewComment('');
      const res = await commentApi.list(id);
      setComments(res.comments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRate(value) {
    if (!user) return;
    try {
      await ratingApi.set(id, value);
      const res = await ratingApi.get(id);
      setRating(res);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this image permanently?')) return;
    try {
      await imageApi.delete(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="container"><div className="loading">Loading...</div></div>;
  if (error && !image) {
    return (
      <div className="container">
        <div className="form-error">{error}</div>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 16 }}>← Back to feed</Link>
      </div>
    );
  }
  if (!image) return null;

  return (
    <div className="container">
      <Link to="/" className="auth-link" style={{ marginBottom: 16, display: 'inline-block' }}>← Back to feed</Link>

      <div className="detail-wrapper">
        <div>
          <img src={image.blob_url} alt={image.title} className="detail-image" />
        </div>

        <div className="card">
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>{image.title}</h1>
          {image.caption && <p style={{ marginBottom: 16, color: 'var(--text-muted)' }}>{image.caption}</p>}

          {image.location && (
            <div className="detail-meta-item">
              <div className="detail-meta-label">Location</div>
              <div className="detail-meta-value">📍 {image.location}</div>
            </div>
          )}

          {image.people_present && image.people_present.length > 0 && (
            <div className="detail-meta-item">
              <div className="detail-meta-label">People</div>
              <div className="detail-meta-value">{image.people_present.join(', ')}</div>
            </div>
          )}

          {image.tags && image.tags.length > 0 && (
            <div className="detail-meta-item">
              <div className="detail-meta-label">AI-detected tags</div>
              <div className="tags">
                {image.tags.map((t) => (
                  <span key={t} className="tag ai">{t}</span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-meta-item">
            <div className="detail-meta-label">Uploaded</div>
            <div className="detail-meta-value">
              {new Date(image.upload_timestamp).toLocaleString()}
            </div>
          </div>

          <div className="detail-meta-item">
            <div className="detail-meta-label">Rating</div>
            <div className="stars" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hoverRating || rating.my_rating || 0) >= n;
                return (
                  <span
                    key={n}
                    className={`star ${filled ? 'filled' : ''}`}
                    onMouseEnter={() => user && setHoverRating(n)}
                    onClick={() => handleRate(n)}
                    style={{ cursor: user ? 'pointer' : 'default' }}
                  >★</span>
                );
              })}
            </div>
            <div className="rating-meta">
              {rating.count > 0 ? (
                <>Average: <strong>{rating.average}</strong> ({rating.count} rating{rating.count !== 1 ? 's' : ''})</>
              ) : 'No ratings yet'}
              {!user && ' · Sign in to rate'}
            </div>
          </div>

          {user && user.role === 'admin' && (
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
              style={{ marginTop: 12 }}
            >
              Delete photo
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Comments ({comments.length})</h2>

        {user ? (
          <form onSubmit={handleAddComment} className="card" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={1000}
                rows={3}
              />
            </div>
            <button type="submit" className="btn" disabled={submitting || !newComment.trim()}>
              {submitting ? 'Posting...' : 'Post comment'}
            </button>
          </form>
        ) : (
          <div className="card" style={{ marginBottom: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            <Link to="/login" className="auth-link">Sign in</Link> to post a comment.
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        {comments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="comment-header">
                <span className="comment-author">{c.username}</span>
                <span>{new Date(c.timestamp).toLocaleString()}</span>
              </div>
              <div className="comment-text">{c.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
