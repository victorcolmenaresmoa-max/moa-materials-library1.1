import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Tag from './Tag.jsx'

export default function MultiSelect({ label, options, selected, onChange, color = 'teal', placeholder = 'Seleccionar…' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
  }

  return (
    <div className="moa-multiselect" ref={ref}>
      {label && <label className="moa-label">{label}</label>}
      <button type="button" className={`moa-multiselect__trigger ${open ? 'is-open' : ''}`} onClick={() => setOpen((value) => !value)}>
        <span>{selected.length ? `${selected.length} seleccionado${selected.length === 1 ? '' : 's'}` : placeholder}</span>
        <Icon name="chevronDown" size={17} />
      </button>
      {selected.length > 0 && (
        <div className="moa-multiselect__selected">
          {selected.map((item) => (
            <button key={item} type="button" className="moa-multiselect__chip" onClick={() => toggle(item)} title={`Quitar ${item}`}>
              <Tag label={item} color={color} small /><span>×</span>
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="moa-multiselect__menu">
          <div className="moa-multiselect__options">
            {options.map((option) => {
              const active = selected.includes(option)
              return (
                <button key={option} type="button" className={`moa-option ${active ? 'is-active' : ''}`} onClick={() => toggle(option)}>
                  <span className="moa-option__check">{active ? <Icon name="check" size={14} /> : null}</span>
                  <span>{option}</span>
                </button>
              )
            })}
          </div>
          {selected.length > 0 && <button type="button" className="moa-multiselect__clear" onClick={() => onChange([])}>Limpiar selección</button>}
        </div>
      )}
    </div>
  )
}
