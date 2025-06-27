export async function deleteUser(id) {
  const response = await fetch("/api/deleteuser", {  // api 경로도 소문자 맞추기
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),  // 서버에서 기대하는 key 이름(id)로 맞춤
  });

  if (!response.ok) {
    throw new Error("Failed to delete user");
  }

  return response.json();
}
