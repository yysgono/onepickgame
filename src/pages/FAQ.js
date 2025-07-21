// src/pages/FAQ.js

import React from "react";

export default function FAQ() {
  return (
    <div style={{
      maxWidth: 650,
      margin: "50px auto 100px auto",
      padding: 30,
      background: "rgba(16,24,40,0.88)",
      color: "#fff",
      borderRadius: 18,
      boxShadow: "0 4px 18px #0a132255",
      fontSize: 17,
      lineHeight: 1.7
    }}>
      <h1 style={{fontWeight: 800, fontSize: 29, marginBottom: 24, color: "#1976ed"}}>
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
      <div>Please use the report button on each Worldcup, or contact us at <a href="yysgono@gmail.com" style={{color:"#99bbee"}}>onepickgame@gmail.com</a>.</div>
      <br/>
      <b>Q. (Additional) The site is slow or has bugs.</b>
      <div>We are working on improvements! Feedback is always welcome.</div>
    </div>
  );
}
