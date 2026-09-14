// src/pages/FAQ.js

import React from "react";

export default function FAQ() {
  return (
    <div style={{
      maxWidth: 650,
      margin: "50px auto 100px auto",
      padding: 30,
      background: "#ffffff",
      color: "#202534",
      borderRadius: 18,
      boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
      fontSize: 19,
      lineHeight: 1.7
    }}>
      <h1 style={{fontWeight: 800, fontSize: 31, marginBottom: 24, color: "#5542b8"}}>
        FAQ – Frequently Asked Questions
      </h1>
      <b>Q. Can I use the site without signing up?</b>
      <div>Yes, most features are freely available for non-members as well.</div>
      <br/>
      <b>Q. Can I create my own Worldcup (tournament)?</b>
      <div>Yes! Click the <b>Create Worldcup</b> button to register a tournament on your desired topic.</div>
      <br/>
      <b>Q. Is creating or joining a Worldcup free?</b>
      <div>All features are provided for free. (Advertisements may be displayed)</div>
      <br/>
      <b>Q. What about image uploads and copyright issues?</b>
      <div>You are responsible for images you upload. Please be careful when using copyrighted images.</div>
      <br/>
      <b>Q. How can I report inappropriate content or send inquiries?</b>
      <div>Please use the report button on each Worldcup, or contact us at <a href="yysgono@gmail.com" style={{color:"#5542b8"}}>onepickgame@gmail.com</a>.</div>
      <br/>
      <b>Q. (Additional) The site is slow or has bugs.</b>
      <div>We are working on improvements! Feedback is always welcome.</div>
    </div>
  );
}
