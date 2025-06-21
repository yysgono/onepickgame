import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ❌ import { app } from "./firebase"; // ← 이거 지우기

// Storage는 별도 인자 없이 호출 가능 (firebase 9+)
export async function uploadCandidateImage(file, userId = "guest") {
  const storage = getStorage(); // 인자 없이!
  const ext = file.name.split(".").pop();
  const storageRef = ref(storage, `candidates/${userId}/${Date.now()}.${ext}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
