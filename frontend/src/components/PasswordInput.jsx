import React, { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

/**
 * Reusable password input with show/hide toggle.
 * Props mirror a standard <input> element.
 */
export default function PasswordInput({ id, value, onChange, placeholder = '••••••••', showLockIcon = true, style = {}, ...rest }) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {showLockIcon && (
        <Lock
          size={16}
          style={{
            position: 'absolute', left: '0.75rem',
            top: '50%', transform: 'translateY(-50%)',
            color: 'var(--gray-400)', pointerEvents: 'none',
          }}
        />
      )}
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          paddingLeft:  showLockIcon ? '2.25rem' : '0.875rem',
          paddingRight: '2.5rem',
          ...style,
        }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', right: '0.625rem',
          top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', padding: '0.25rem',
          color: 'var(--gray-400)', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          borderRadius: 4,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--navy)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-400)'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
