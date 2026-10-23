import React from 'react';
import { Link } from 'react-router-dom';
// Real navigation links retain native middle-click, Ctrl-click and context menus.
const NavigationLink = React.forwardRef(function NavigationLink({appearance='div',style,...props},ref){
 const base=appearance==='button'?{display:'inline-flex',alignItems:'center',justifyContent:'center',font:'inherit',color:'inherit',background:'#fff',border:'1px solid #dde2ea',borderRadius:8,padding:'8px 12px',cursor:'pointer',boxSizing:'border-box'}:{display:'block',color:'inherit'};
 return <Link {...props} ref={ref} style={{...base,textDecoration:'none',...style}}/>;
});
export default NavigationLink;
