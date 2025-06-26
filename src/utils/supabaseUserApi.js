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
