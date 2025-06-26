export async function deleteUser(userId) {
  const response = await fetch("/api/deleteUser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete user");
  }

  return response.json();
}
