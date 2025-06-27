export async function deleteUser(id, token) {
  const response = await fetch("/api/deleteuser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete user");
  }

  return response.json();
}
