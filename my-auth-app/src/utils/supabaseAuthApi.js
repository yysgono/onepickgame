// src/utils/supabaseAuthApi.js
import { supabase } from "./supabaseClient";

// 이메일 회원가입
export async function signUp(email, password) {
  return await supabase.auth.signUp({ email, password });
}

// 이메일 로그인
export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

// 로그아웃
export async function signOut() {
  return await supabase.auth.signOut();
}

// 현재 로그인한 사용자
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user;
}
