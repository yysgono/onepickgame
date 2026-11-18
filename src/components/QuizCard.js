import React from 'react';
import { Link } from 'react-router-dom';
import MediaRenderer from './MediaRenderer';
import './QuizCategorySections.css';

export default function QuizCard({ href, title, image, questionCount, plays, copy, className = '' }) {
  return <Link className={'quiz-category-card '+className} to={href}>
    <div className="quiz-category-image">{image?<MediaRenderer url={image} alt={title} loading="lazy" deferUntilVisible playable={false} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 35%'}}/>:<span aria-hidden="true">❓</span>}</div>
    <div className="quiz-category-card-body"><h3 title={title}>{title}</h3><p>{Number(questionCount)||0} {copy.questions} · {Number(plays)||0} {copy.plays}</p><span className="quiz-category-play">{copy.playNow} →</span></div>
  </Link>;
}
