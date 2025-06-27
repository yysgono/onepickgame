// src/utils/supabaseUserApi.js
import { supabase } from './supabaseClient';

// 회원가입 함수
export async function signupUser(email, password, nickname) {
  // 1) Supabase Auth로 회원가입
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) return { error: signUpError };

  // 2) user id 받아오기 (신규 정책에서 user는 signUpData.user)
  const user = signUpData.user;
  if (!user) return { error: { message: '회원가입 실패: user 정보 없음' } };

  // 3) profiles 테이블에 프로필 row 삽입 (닉네임 포함)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: user.id,        // user의 고유 id
        email: email,
        nickname: nickname, // 랜덤 닉네임!
        uid: user.id,       // profiles 테이블이 uid 컬럼까지 있을 경우
      }
    ]);

  if (profileError) return { error: profileError };

  return { user };
}

// (참고) 기존의 회원탈퇴 함수
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
