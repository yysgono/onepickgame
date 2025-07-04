import { supabase } from './supabaseClient';

// 회원가입 (랜덤닉 포함)
export async function signupUser(email, password, nickname) {
  // 1) Supabase Auth로 회원가입
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  // 2) 실패시 error 반환
  if (signUpError) return { error: signUpError };

  // 3) 신규 정책에서 signUpData.user에 user객체가 옴
  const user = signUpData.user;
  if (!user) return { error: { message: '회원가입 실패: user 정보 없음' } };

  // 4) profiles 테이블에 닉네임 등 row 삽입
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: user.id,         // user 고유 id
        email: email,
        nickname: nickname,  // 랜덤 닉네임
        uid: user.id,        // profiles 테이블에 uid 컬럼이 있다면 같이 삽입
      }
    ]);

  if (profileError) return { error: profileError };

  // 5) 성공시 user 반환
  return { user };
}

// (참고) Supabase Edge Function 호출로 회원탈퇴(서버리스)
// 실제 도메인은 본인 프로젝트에 맞게 변경 필요
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
