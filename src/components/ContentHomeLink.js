import React from 'react';
import { Link } from 'react-router-dom';
// A same-path visit still carries a new location key, so in-page game modes can return home.
export default function ContentHomeLink({mode,to,children,...props}) {
  return <Link {...props} to={to} state={{contentHome:mode}} onClick={event=>{
    if(event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey)window.scrollTo({top:0,behavior:'auto'});
  }}>{children}</Link>;
}
