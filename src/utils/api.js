export async function deleteUser(id, token) {
  if (!id || !token) throw new Error("No id or token provided");

  const response = await fetch("/api/deleteuser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    let errorMsg = "Failed to delete user";
    try {
      const errorData = await response.json();
      errorMsg = errorData?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}
