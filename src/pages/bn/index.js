import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function BnPage(props) {
  return (
    <>
      <Helmet>
        <title>One Pick Game - ব্র্যাকেট গেম সাইট</title>
        <meta
          name="description"
          content="ব্র্যাকেট গেম সাইট One Pick Game. নিজের টুর্নামেন্ট ব্র্যাকেট তৈরি করুন, মজার ম্যাচআপ উপভোগ করুন এবং বিশ্বজুড়ে ব্যবহারকারীদের সঙ্গে খেলুন!"
        />
        <meta property="og:title" content="One Pick Game - ব্র্যাকেট গেম সাইট" />
        <meta property="og:description" content="ব্র্যাকেট গেম সাইট One Pick Game. নিজের টুর্নামেন্ট ব্র্যাকেট তৈরি করুন, মজার ম্যাচআপ উপভোগ করুন এবং বিশ্বজুড়ে ব্যবহারকারীদের সঙ্গে খেলুন!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/bn" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
