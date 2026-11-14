import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api, { getProfileImageUrl } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Shield,
  Calendar,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Palette,
  Check,
  Bell
} from 'lucide-react';

export default function ProfilePage() {
  const { profile, updateProfileState } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(!profile);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

  const [formData, setFormData] = useState(() => ({
    username: profile?.username || '',
    fullName: profile?.fullName || '',
    phoneNumber: profile?.phoneNumber || '',
    location: profile?.location || '',
    profileImageUrl: profile?.profileImageUrl || '',
    preferredUnit: profile?.preferredUnit || 'KG_CO2E',
    goalVisibility: profile?.goalVisibility ?? true,
    avatarSeed: profile?.avatarSeed || ''
  }));

  // Avatar Studio state
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState(() => profile?.avatarSeed || profile?.username || 'carbon-member');
  const [customSeedInput, setCustomSeedInput] = useState('');
  const [variationRoll, setVariationRoll] = useState(0);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState('');
  const [avatarErrorMsg, setAvatarErrorMsg] = useState('');

  // Sync profile details
  useEffect(() => {
    let isMounted = true;
    async function initProfile() {
      try {
        const p = await api.users.getMe();
        if (isMounted && p) {
          setFormData({
            username: p.username || '',
            fullName: p.fullName || '',
            phoneNumber: p.phoneNumber || '',
            location: p.location || '',
            profileImageUrl: p.profileImageUrl || '',
            preferredUnit: p.preferredUnit || 'KG_CO2E',
            goalVisibility: p.goalVisibility ?? true,
            avatarSeed: p.avatarSeed || ''
          });
          setSelectedAvatarSeed(p.avatarSeed || p.username || 'carbon-member');
          updateProfileState(p);
        }
      } catch (err) {
        if (isMounted) setGeneralError(err.message || 'Failed to load profile details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initProfile();

    return () => {
      isMounted = false;
    };
  }, [updateProfileState]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (generalError) setGeneralError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPG, PNG, WEBP, or GIF images are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image file size must be less than 5MB.');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setImageLoadError(false);

    // Provide instant visual feedback from selected file
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);

    try {
      const updated = await api.users.uploadProfileImage(file);
      setFormData((prev) => ({ ...prev, profileImageUrl: updated.profileImageUrl || '' }));
      updateProfileState(updated);
      setSuccessMessage('Profile photo updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setLocalPreviewUrl('');
      setUploadError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    setUploadError('');
    setLocalPreviewUrl('');
    setImageLoadError(false);

    try {
      const updated = await api.users.deleteProfileImage();
      setFormData((prev) => ({ ...prev, profileImageUrl: '' }));
      updateProfileState(updated);
      setSuccessMessage('Profile photo removed.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setUploadError(err.message || 'Failed to remove photo.');
    } finally {
      setIsUploading(false);
    }
  };

  // Clean up object URLs on unmount or replacement
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3 || formData.username.trim().length > 50) {
      errors.username = 'Username must be between 3 and 50 characters';
    }

    if (formData.fullName && formData.fullName.length > 100) {
      errors.fullName = 'Full name cannot exceed 100 characters';
    }

    if (formData.phoneNumber) {
      const phoneRegex = /^[+0-9()\- ]{7,25}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        errors.phoneNumber = 'Enter a valid phone number (7–25 characters, e.g. +1 555-0199)';
      }
    }

    if (formData.location && formData.location.length > 150) {
      errors.location = 'Location cannot exceed 150 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setGeneralError('');
    setSuccessMessage('');

    try {
      const updated = await api.users.updateMe({
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        location: formData.location.trim(),
        profileImageUrl: formData.profileImageUrl.trim(),
        avatarSeed: formData.avatarSeed ? formData.avatarSeed.trim() : '',
        preferredUnit: formData.preferredUnit,
        goalVisibility: formData.goalVisibility
      });

      updateProfileState(updated);
      setSuccessMessage('Profile and preferences updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      if (err.validationErrors) {
        setFieldErrors(err.validationErrors);
      } else {
        setGeneralError(err.message || 'Failed to update profile.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Studio Handlers
  const handleSelectSeed = (seed) => {
    setSelectedAvatarSeed(seed);
    setAvatarSuccessMsg('');
    setAvatarErrorMsg('');
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatarSeed || selectedAvatarSeed.trim().length === 0) {
      setAvatarErrorMsg('Please select or specify an avatar seed.');
      return;
    }
    const cleanSeed = selectedAvatarSeed.trim().replace(/[^a-zA-Z0-9_.-]/g, '-').slice(0, 100);
    setIsSavingAvatar(true);
    setAvatarErrorMsg('');
    setAvatarSuccessMsg('');

    try {
      const updated = await api.users.updateMe({
        ...formData,
        avatarSeed: cleanSeed
      });
      setFormData((prev) => ({ ...prev, avatarSeed: cleanSeed }));
      updateProfileState(updated);
      setAvatarSuccessMsg('Blobatar avatar saved successfully!');
      setTimeout(() => setAvatarSuccessMsg(''), 4000);
    } catch (err) {
      setAvatarErrorMsg(err?.message || 'Failed to save avatar choice.');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleResetAvatarToDefault = async () => {
    const defaultSeed = formData.username || 'carbon-member';
    setSelectedAvatarSeed(defaultSeed);
    setIsSavingAvatar(true);
    setAvatarErrorMsg('');
    setAvatarSuccessMsg('');

    try {
      const updated = await api.users.updateMe({
        ...formData,
        avatarSeed: ''
      });
      setFormData((prev) => ({ ...prev, avatarSeed: '' }));
      updateProfileState(updated);
      setAvatarSuccessMsg('Avatar reset to default account username!');
      setTimeout(() => setAvatarSuccessMsg(''), 4000);
    } catch (err) {
      setAvatarErrorMsg(err?.message || 'Failed to reset avatar.');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleRollVariations = () => {
    setVariationRoll((prev) => prev + 1);
  };

  // Generate 8 diverse seed variations based on the username & roll index
  const baseUsername = formData.username || 'member';
  const avatarVariations = [
    baseUsername,
    `${baseUsername}-leaf`,
    `${baseUsername}-forest`,
    `${baseUsername}-solar`,
    `${baseUsername}-ocean`,
    `${baseUsername}-eco${variationRoll > 0 ? variationRoll : ''}`,
    `${baseUsername}-bloom${variationRoll > 0 ? variationRoll : ''}`,
    `${baseUsername}-zen${variationRoll > 0 ? variationRoll : ''}`
  ];

  if (loading) {
    return (
      <div className="page-loading-wrapper">
        <LoadingSpinner message="Retrieving your profile..." size="lg" />
      </div>
    );
  }

  const emailDisplay = profile?.email || 'N/A';
  const roleDisplay = profile?.role || 'USER';
  const createdDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Active member';

  const activePhotoUrl = localPreviewUrl || getProfileImageUrl(formData.profileImageUrl);
  const showAvatarImage = Boolean(activePhotoUrl && !imageLoadError);
  const avatarInitial = (formData.fullName || formData.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-avatar-large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none' }}>
          <Avatar
            avatarSeed={formData.avatarSeed}
            seed={formData.avatarSeed || formData.username}
            username={formData.username}
            name={formData.fullName || formData.username}
            profileImageUrl={activePhotoUrl}
            size={88}
            shape="squircle"
          />
        </div>

        <div className="profile-header-info">
          <div className="profile-name-row">
            <h1 className="profile-user-fullname">
              {formData.fullName || formData.username || 'Sustainability Champion'}
            </h1>
            <span className="profile-role-pill">
              <Shield size={14} />
              <span>{roleDisplay}</span>
            </span>
          </div>
          <p className="profile-user-email">
            <Mail size={15} />
            <span>{emailDisplay}</span>
          </p>
          <p className="profile-joined-text">
            <Calendar size={14} />
            <span>Member since: {createdDate}</span>
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="auth-alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {generalError && (
        <div className="auth-alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form-grid" noValidate>
        {/* Personal Details Card */}
        <div className="dashboard-card profile-section-card">
          <div className="card-header-clean">
            <div>
              <h2 className="card-heading">Personal Information</h2>
              <p className="card-subheading">Update your identity and contact information</p>
            </div>
          </div>

          <div className="profile-form-fields">
            <div className="form-group">
              <label htmlFor="prof-username" className="form-label">
                Username <span className="text-coral">*</span>
              </label>
              <div className={`input-with-icon ${fieldErrors.username ? 'has-error' : ''}`}>
                <span className="input-icon">
                  <User size={18} />
                </span>
                <input
                  id="prof-username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isSaving}
                  required
                />
              </div>
              {fieldErrors.username && (
                <span className="field-error-message">{fieldErrors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="prof-fullName" className="form-label">
                Full Name
              </label>
              <div className={`input-with-icon ${fieldErrors.fullName ? 'has-error' : ''}`}>
                <span className="input-icon">
                  <User size={18} />
                </span>
                <input
                  id="prof-fullName"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>
              {fieldErrors.fullName && (
                <span className="field-error-message">{fieldErrors.fullName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="prof-email" className="form-label">
                Email Address (Managed by Account)
              </label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="prof-email"
                  type="email"
                  value={emailDisplay}
                  readOnly
                  className="read-only-input"
                  title="Email cannot be changed directly"
                />
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="prof-phone" className="form-label">
                  Phone Number
                </label>
                <div className={`input-with-icon ${fieldErrors.phoneNumber ? 'has-error' : ''}`}>
                  <span className="input-icon">
                    <Phone size={18} />
                  </span>
                  <input
                    id="prof-phone"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+1 555-0199"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
                {fieldErrors.phoneNumber && (
                  <span className="field-error-message">{fieldErrors.phoneNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="prof-location" className="form-label">
                  Location (City, Country)
                </label>
                <div className={`input-with-icon ${fieldErrors.location ? 'has-error' : ''}`}>
                  <span className="input-icon">
                    <MapPin size={18} />
                  </span>
                  <input
                    id="prof-location"
                    name="location"
                    type="text"
                    placeholder="e.g. Seattle, USA"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
                {fieldErrors.location && (
                  <span className="field-error-message">{fieldErrors.location}</span>
                )}
              </div>
            </div>

            <div className="form-group profile-upload-group">
              <label className="form-label">Profile Photo</label>
              <div className="profile-photo-control">
                <div className="profile-photo-preview">
                  {showAvatarImage ? (
                    <img
                      src={activePhotoUrl}
                      alt="Profile preview"
                      className="photo-preview-img"
                      onError={() => setImageLoadError(true)}
                    />
                  ) : (
                    <div className="photo-preview-placeholder" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                      <Avatar
                        seed={formData.avatarSeed || formData.username}
                        name={formData.fullName || formData.username}
                        size={64}
                        shape="squircle"
                      />
                    </div>
                  )}
                </div>
                <div className="profile-photo-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                    disabled={isUploading || isSaving}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isSaving}
                  >
                    <Upload size={16} />
                    <span>{isUploading ? 'Uploading…' : formData.profileImageUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                  {formData.profileImageUrl && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-coral"
                      onClick={handleRemovePhoto}
                      disabled={isUploading || isSaving}
                    >
                      <Trash2 size={16} />
                      <span>Remove Photo</span>
                    </button>
                  )}
                  <span className="upload-help-text">JPG, PNG, WEBP, or GIF. Max 5MB.</span>
                </div>
              </div>
              {uploadError && <span className="field-error-message">{uploadError}</span>}
            </div>
          </div>
        </div>

        {/* Blobatar Avatar Studio Section */}
        <div className="dashboard-card profile-section-card">
          <div className="card-header-clean">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--forest-primary, #2e7d32)" />
              <h2 className="card-heading" style={{ margin: 0 }}>Blobatar Avatar Studio</h2>
            </div>
            <p className="card-subheading">
              Customize your profile avatar with deterministic geometric avatars powered by{' '}
              <a
                href="https://blobatar.dev"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-primary, #2e7d32)', textDecoration: 'underline' }}
              >
                Blobatar
              </a>
              . Your chosen avatar persists across your profile, sidebar, leaderboards, and team listings.
            </p>
          </div>

          {avatarSuccessMsg && (
            <div className="auth-alert alert-info" style={{ margin: '1rem 0' }} role="status">
              <CheckCircle2 size={18} />
              <span>{avatarSuccessMsg}</span>
            </div>
          )}

          {avatarErrorMsg && (
            <div className="auth-alert alert-error" style={{ margin: '1rem 0' }} role="alert">
              <AlertCircle size={18} />
              <span>{avatarErrorMsg}</span>
            </div>
          )}

          {/* Avatar Preview & Comparison Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
              margin: '1.25rem 0',
              padding: '1.25rem',
              background: 'var(--bg-subtle, #f8fafc)',
              borderRadius: '12px',
              border: '1px solid var(--border-soft, #e2e8f0)'
            }}
          >
            {/* Selected / Live Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Avatar
                seed={selectedAvatarSeed}
                name={formData.fullName || formData.username}
                size={76}
                shape="squircle"
                style={{
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)',
                  border: '2px solid var(--forest-primary, #2e7d32)'
                }}
              />
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--forest-primary, #2e7d32)', fontWeight: 700 }}>
                  {selectedAvatarSeed === (formData.avatarSeed || formData.username) ? 'Current Active Avatar' : 'Unsaved Preview'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  Seed: <code>{selectedAvatarSeed}</code>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Deterministic SVG rendering
                </div>
              </div>
            </div>

            {/* Default Baseline Reference */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Avatar
                seed={formData.username || 'member'}
                name={formData.fullName || formData.username}
                size={76}
                shape="squircle"
                style={{ opacity: 0.85 }}
              />
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Default Account Avatar
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  Base Seed: <code>{formData.username || 'member'}</code>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={handleResetAvatarToDefault}
                  disabled={isSavingAvatar}
                  style={{ marginTop: '4px', padding: '2px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={12} />
                  <span>Reset to Default</span>
                </button>
              </div>
            </div>
          </div>

          {/* Generated Style Options */}
          <div style={{ margin: '1.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                Choose Another Generated Avatar
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleRollVariations}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} />
                <span>Roll New Variations</span>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {avatarVariations.map((vSeed) => {
                const isSelected = selectedAvatarSeed === vSeed;
                return (
                  <button
                    type="button"
                    key={vSeed}
                    onClick={() => handleSelectSeed(vSeed)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px',
                      background: isSelected ? 'var(--forest-tint, #e8f5e9)' : 'var(--bg-surface, #ffffff)',
                      border: isSelected ? '2px solid var(--forest-primary, #2e7d32)' : '1px solid var(--border-soft, #e2e8f0)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    title={`Select seed: ${vSeed}`}
                  >
                    {isSelected && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'var(--forest-primary, #2e7d32)',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                    <Avatar seed={vSeed} size={48} shape="squircle" />
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--forest-primary, #2e7d32)' : 'var(--text-muted)',
                        maxWidth: '90px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {vSeed.replace(`${baseUsername}-`, '') || 'Default'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Seed Input Option */}
          <div style={{ margin: '1.25rem 0' }}>
            <label htmlFor="custom-avatar-seed" className="form-label" style={{ fontSize: '0.85rem' }}>
              Or Enter a Custom Avatar Seed (Nickname / Theme)
            </label>
            <div style={{ display: 'flex', gap: '8px', maxWidth: '400px' }}>
              <input
                id="custom-avatar-seed"
                type="text"
                placeholder="e.g. eco-champion, leaf-2026"
                maxLength={50}
                value={customSeedInput}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^a-zA-Z0-9_.-]/g, '');
                  setCustomSeedInput(clean);
                  if (clean.trim()) {
                    setSelectedAvatarSeed(clean.trim());
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-soft, #e2e8f0)',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <span className="field-hint">Alphanumeric characters, underscores, and dashes allowed.</span>
          </div>

          {/* Avatar Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-soft, #e2e8f0)' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveAvatar}
              disabled={isSavingAvatar || selectedAvatarSeed === (formData.avatarSeed || formData.username)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSavingAvatar ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Avatar</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetAvatarToDefault}
              disabled={isSavingAvatar || (!formData.avatarSeed && selectedAvatarSeed === formData.username)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={15} />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>

        {/* Sustainability Preferences Card */}
        <div className="dashboard-card profile-section-card">
          <div className="card-header-clean">
            <div>
              <h2 className="card-heading">Emissions Preferences & Appearance</h2>
              <p className="card-subheading">Configure your default measurement unit, theme, and privacy settings</p>
            </div>
          </div>

          <div className="profile-form-fields">
            {/* Dark and Light Theme Toggle */}
            <div className="form-group">
              <label className="form-label">Appearance & Display Theme</label>
              <div className="theme-selector-grid">
                <label className={`theme-choice-card ${theme === 'light' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="themeChoice"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                  />
                  <div className="theme-choice-icon">
                    <Sun size={20} />
                  </div>
                  <div>
                    <div className="theme-choice-label">Light Theme</div>
                    <div className="theme-choice-desc">Clean, refreshing daylight nature theme (Default)</div>
                  </div>
                </label>

                <label className={`theme-choice-card ${theme === 'dark' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="themeChoice"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => setTheme('dark')}
                  />
                  <div className="theme-choice-icon">
                    <Moon size={20} />
                  </div>
                  <div>
                    <div className="theme-choice-label">Dark Theme</div>
                    <div className="theme-choice-desc">Deep forest night mode with reduced eye fatigue</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Preferred Unit Radio Group */}
            <div className="form-group">
              <label className="form-label">Preferred Emissions Measurement Unit</label>
              <div className="unit-selector-radios">
                <label className={`unit-radio-card ${formData.preferredUnit === 'KG_CO2E' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="preferredUnit"
                    value="KG_CO2E"
                    checked={formData.preferredUnit === 'KG_CO2E'}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                  <div className="radio-card-body">
                    <span className="radio-card-title">Kilograms (kg CO₂e)</span>
                    <span className="radio-card-desc">
                      Ideal for daily tracking and granular household activity recording.
                    </span>
                  </div>
                </label>

                <label className={`unit-radio-card ${formData.preferredUnit === 'TONNES_CO2E' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="preferredUnit"
                    value="TONNES_CO2E"
                    checked={formData.preferredUnit === 'TONNES_CO2E'}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                  <div className="radio-card-body">
                    <span className="radio-card-title">Metric Tonnes (t CO₂e)</span>
                    <span className="radio-card-desc">
                      Standard for corporate reporting, long-distance flights, and annual rollups.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Goal Visibility Checkbox */}
            <div className="form-group checkbox-group-card">
              <label className="checkbox-toggle-label">
                <input
                  type="checkbox"
                  name="goalVisibility"
                  checked={formData.goalVisibility}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                <div className="checkbox-text-group">
                  <span className="checkbox-title">Make sustainability goals visible</span>
                  <span className="checkbox-subtitle">
                    Allow teammates or community benchmarks to see your reduction goals and milestones.
                  </span>
                </div>
              </label>
            </div>

            {/* Notification Preferences Shortcut */}
            <div className="form-group" style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                    Notification Preferences
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Configure browser alerts, emails, milestone celebrations, and invitation updates.
                  </span>
                </div>
                <Link to="/notifications" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={15} />
                  <span>Manage Notifications</span>
                </Link>
              </div>
            </div>

            <div className="profile-save-action-row">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isSaving}
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" message="" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
