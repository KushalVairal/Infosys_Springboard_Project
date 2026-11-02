import React from 'react';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  icon = null,
  error = null,
  hint = null,
  required = false,
  disabled = false,
  autoComplete,
  className = '',
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId}>
          {label}
          {required && <span style={{ color: 'var(--accent-coral)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <div className={`input-with-icon ${error ? 'has-error' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          {...props}
        />
      </div>
      {error && <span className="field-error-message">{error}</span>}
      {hint && !error && <span className="field-hint">{hint}</span>}
    </div>
  );
}
