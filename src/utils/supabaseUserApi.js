// src/utils/supabaseUserApi.js

export async function deleteUser(userId) {
  const response = await fetch(
    'https://YOURPROJECT.functions.supabase.co/delete-user',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    }
  );
  if (!response.ok) throw new Error('회원탈퇴 실패');
  return await response.json();
}

// src/utils/supabaseUserApi.js
import { supabase } from './supabaseClient';

export async function signupUser(email, password, nickname) {
  // 1) Supabase Auth로 회원가입
  const { user, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) return { error };

  // 2) 회원정보 테이블(profiles)에 nickname 저장
  // (회원가입 완료 시 프로필 row도 만들어줌)
  const { data, error: profileError } = await supabase
    .from('profiles')
    .insert([
      { id: user.id, email, nickname }
    ]);

  return { user, error: profileError };
}
