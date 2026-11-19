import React from 'react';
import {Link} from 'react-router-dom';
import labels from './categoryLabels.json';
export default function CategoryNav({lang,category='all'}) {
 return <nav className="tn-category-filters" aria-label={(labels[lang]||labels.en).all}>{Object.entries(labels[lang]||labels.en).map(([key,label])=><Link key={key} to={`/${lang}/mytop9${key==='all'?'':'?category='+key}`} aria-current={category===key?'page':undefined}>{label}</Link>)}</nav>;
}
