import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { imageApi } from '../api/client';

export default function Upload() {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please choose an image file');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title);
      fd.append('caption', caption);
      fd.append('location', location);
      fd.append('people_present', people);
      const res = await imageApi.upload(fd);
      navigate(`/images/${res.image.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="page-title">Upload a Photo</h1>
      <p className="page-subtitle">Share a photo with the PhotoShare community</p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="file">Image file *</label>
            <input
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              required
            />
          </div>

          {preview && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={preview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, display: 'block' }}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
            />
          </div>

          <div className="form-group">
            <label htmlFor="caption">Caption</label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              placeholder="e.g. Brighton, UK"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="people">People in photo (comma-separated)</label>
            <input
              id="people"
              type="text"
              placeholder="e.g. Alice, Bob"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            ✨ AI Vision will automatically detect tags from your image after upload.
          </p>
        </form>
      </div>
    </div>
  );
}
