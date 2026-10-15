import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Image,
  CheckCircle2,
  AlertCircle,
  Save,
  Shield,
  Calendar
} from 'lucide-react';

export default function ProfilePage() {
  const { profile, updateProfileState } = useAuth();
  const [loading, setLoading] = useState(!profile);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState(() => ({
    username: profile?.username || '',
    fullName: profile?.fullName || '',
    phoneNumber: profile?.phoneNumber || '',
    location: profile?.location || '',
    profileImageUrl: profile?.profileImageUrl || '',
    preferredUnit: profile?.preferredUnit || 'KG_CO2E',
    goalVisibility: profile?.goalVisibility ?? true
  }));

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
            goalVisibility: p.goalVisibility ?? true
          });
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

    if (formData.profileImageUrl) {
      const urlRegex = /^https?:\/\/\S+$/;
      if (!urlRegex.test(formData.profileImageUrl.trim())) {
        errors.profileImageUrl = 'Profile image must be a valid HTTP or HTTPS web URL';
      }
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

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {formData.profileImageUrl ? (
            <img
              src={formData.profileImageUrl}
              alt="Avatar preview"
              className="avatar-img-large"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span>{(formData.fullName || formData.username || 'U').charAt(0).toUpperCase()}</span>
          )}
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

            <div className="form-group">
              <label htmlFor="prof-imgUrl" className="form-label">
                Profile Image URL
              </label>
              <div className={`input-with-icon ${fieldErrors.profileImageUrl ? 'has-error' : ''}`}>
                <span className="input-icon">
                  <Image size={18} />
                </span>
                <input
                  id="prof-imgUrl"
                  name="profileImageUrl"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.profileImageUrl}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>
              {fieldErrors.profileImageUrl && (
                <span className="field-error-message">{fieldErrors.profileImageUrl}</span>
              )}
            </div>
          </div>
        </div>

        {/* Sustainability Preferences Card */}
        <div className="dashboard-card profile-section-card">
          <div className="card-header-clean">
            <div>
              <h2 className="card-heading">Emissions Preferences & Units</h2>
              <p className="card-subheading">Configure your default measurement and privacy settings</p>
            </div>
          </div>

          <div className="profile-form-fields">
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
