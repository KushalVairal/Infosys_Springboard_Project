import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * Reusable Show/Hide Password Input component across CarbonTrack.
 *
 * Requirements satisfied:
 * 1. Eye icon positioned vertically centered on the right side.
 * 2. Default state is hidden (`type="password"`).
 * 3. Toggles visibility:
 *    - Eye icon: password visible (`type="text"`).
 *    - Eye-off icon: password hidden (`type="password"`).
 * 4. Uses Lucide React `Eye` and `EyeOff`.
 * 5. Reusable across Login, Register, Confirm, Forgot/Reset, and Change Password.
 * 6. Each field maintains its own isolated visibility state.
 * 7. Preserves validation, minLength/maxLength, and form submission.
 * 8. Button uses `type="button"` to avoid accidental form submission.
 * 9. Accessible `aria-label` and `title`: "Show password" and "Hide password".
 * 10. Styled to match light and dark CarbonTrack themes.
 * 11. Right padding ensures password text never overlaps the icon.
 */
export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  disabled = false,
  required = false,
  minLength,
  maxLength,
  autoComplete = 'current-password',
  className = '',
  containerClassName = '',
  hasError = false,
  icon = <Lock size={18} />,
  showLeftIcon = true,
  style = {},
  inputStyle = {},
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword((prev) => !prev);
  };

  const containerClasses = [
    'input-with-icon',
    'password-input-wrapper',
    hasError ? 'has-error' : '',
    containerClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} style={{ position: 'relative', width: '100%', ...style }}>
      {showLeftIcon && (
        <span className="input-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={`password-input-field ${className}`}
        style={{
          paddingRight: '44px',
          ...(!showLeftIcon ? { paddingLeft: '14px' } : {}),
          ...inputStyle
        }}
        {...rest}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={toggleVisibility}
        disabled={disabled}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
        tabIndex={0}
      >
        {showPassword ? (
          <Eye size={18} aria-hidden="true" />
        ) : (
          <EyeOff size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

