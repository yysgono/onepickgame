import React from 'react';
export default function PageIntro({ icon, title, description, buttonLabel, onCreate, personal = false, accentColor }) {
  return <section className={`page-intro${personal ? ' is-personal' : ''}`}>
    {!personal && <><h1><span aria-hidden="true">{icon}</span> {title}</h1><p>{description}</p></>}
    <button type="button" className="page-create-button" style={accentColor ? { '--accent': accentColor, background: accentColor, borderColor: accentColor } : undefined} onClick={onCreate}>＋ {buttonLabel}</button>
  </section>;
}
