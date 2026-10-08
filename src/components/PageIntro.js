import React from 'react';
import { Link } from 'react-router-dom';
export default function PageIntro({ icon, title, description, hideDescription = false, buttonLabel, onCreate, createTo, personal = false, accentColor }) {
  const buttonStyle = accentColor ? { '--accent': accentColor, background: accentColor, borderColor: accentColor } : {};
  return <section className={`page-intro${personal ? ' is-personal' : ''}`}>
    {!personal && <><h1><span aria-hidden="true">{icon}</span> {title}</h1>{!hideDescription && <p>{description}</p>}</>}
    {createTo ? <Link to={createTo} className="page-create-button" style={{ ...buttonStyle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }} onClick={(event) => {
      if (onCreate && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        onCreate();
      }
    }}>＋ {buttonLabel}</Link> : <button type="button" className="page-create-button" style={buttonStyle} onClick={onCreate}>＋ {buttonLabel}</button>}
  </section>;
}
