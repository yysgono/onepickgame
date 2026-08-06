import { supabase } from "./supabaseClient";

const WORLDCUP_TABLE = "worldcups";
const CANDIDATE_BUCKET = "candidates";

/**
 * 후보 이미지 URL 또는 상대 경로에서
 * candidates 버킷 내부의 실제 파일 경로를 추출합니다.
 *
 * 예:
 * https://xxx.supabase.co/storage/v1/object/public/candidates/admin/test.webp
 * → admin/test.webp
 *
 * https://xxx.supabase.co/storage/v1/object/public/candidates/candidates/admin/test.webp
 * → candidates/admin/test.webp
 */
function extractCandidateStoragePath(imageValue) {
  if (typeof imageValue !== "string") {
    return null;
  }

  const value = imageValue.trim();

  if (!value) {
    return null;
  }

  // 브라우저 임시 URL 및 Base64는 Storage 파일이 아닙니다.
  if (
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return null;
  }

  // Supabase candidates 공개 URL
  const publicUrlMatch = value.match(
    /\/storage\/v1\/object\/public\/candidates\/(.+?)(?:\?.*)?$/
  );

  if (publicUrlMatch?.[1]) {
    try {
      return decodeURIComponent(publicUrlMatch[1]);
    } catch {
      return publicUrlMatch[1];
    }
  }

  // Supabase signed URL도 대응
  const signedUrlMatch = value.match(
    /\/storage\/v1\/object\/sign\/candidates\/(.+?)(?:\?.*)?$/
  );

  if (signedUrlMatch?.[1]) {
    try {
      return decodeURIComponent(signedUrlMatch[1]);
    } catch {
      return signedUrlMatch[1];
    }
  }

  // 외부 URL은 Storage 삭제 대상이 아닙니다.
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
  ) {
    return null;
  }

  // 상대 경로가 저장된 경우
  // 맨 앞의 "/"는 Storage 경로에서 제거합니다.
  return value.replace(/^\/+/, "");
}

/**
 * 월드컵 후보 데이터에서 candidates 버킷 파일 경로를 추출합니다.
 */
function getCandidateImagePaths(worldcupData) {
  if (!Array.isArray(worldcupData)) {
    return [];
  }

  const paths = worldcupData
    .map((candidate) =>
      extractCandidateStoragePath(candidate?.image)
    )
    .filter(Boolean);

  // 같은 파일이 중복 저장되어 있어도 한 번만 삭제
  return [...new Set(paths)];
}

// 월드컵 전체 조회
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("월드컵 목록 조회 실패:", error);
    throw error;
  }

  return data || [];
}

// 월드컵 단일 조회
export async function getWorldcupGame(id) {
  if (!id) {
    throw new Error("월드컵 ID가 없습니다.");
  }

  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("월드컵 조회 실패:", error);
    throw error;
  }

  if (!data) {
    throw new Error("월드컵 데이터를 찾을 수 없습니다.");
  }

  return data;
}

// 월드컵 추가
export async function addWorldcupGame(cup) {
  if (!cup || typeof cup !== "object") {
    throw new Error("저장할 월드컵 데이터가 없습니다.");
  }

  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .insert([cup])
    .select("id")
    .single();

  if (error) {
    console.error("월드컵 추가 실패:", error);
    throw error;
  }

  if (!data?.id) {
    throw new Error("생성된 월드컵 ID를 확인할 수 없습니다.");
  }

  return data.id;
}

// 월드컵 수정
export async function updateWorldcupGame(id, updates) {
  if (!id) {
    throw new Error("월드컵 ID가 없습니다.");
  }

  if (!updates || typeof updates !== "object") {
    throw new Error("수정할 데이터가 없습니다.");
  }

  const { error } = await supabase
    .from(WORLDCUP_TABLE)
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("월드컵 수정 실패:", error);
    throw error;
  }

  return true;
}

// 월드컵 삭제 및 Storage 후보 파일 삭제
export async function deleteWorldcupGame(id) {
  if (!id) {
    throw new Error("월드컵 ID가 없습니다.");
  }

  // 1. DB를 지우기 전에 후보 이미지 URL을 먼저 가져옵니다.
  const { data: worldcup, error: fetchError } = await supabase
    .from(WORLDCUP_TABLE)
    .select("id, data")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("삭제할 월드컵 조회 실패:", fetchError);
    throw fetchError;
  }

  if (!worldcup) {
    throw new Error("삭제할 월드컵을 찾을 수 없습니다.");
  }

  const imagePaths = getCandidateImagePaths(worldcup.data);

  // 2. Storage 파일을 먼저 삭제합니다.
  if (imagePaths.length > 0) {
    const { data: removedFiles, error: storageError } =
      await supabase.storage
        .from(CANDIDATE_BUCKET)
        .remove(imagePaths);

    if (storageError) {
      console.error(
        "후보 이미지 Storage 삭제 실패:",
        storageError,
        imagePaths
      );

      /*
       * Storage 삭제에 실패했을 때 DB까지 삭제하면
       * 다시 찾기 힘든 고아 파일이 남을 수 있습니다.
       * 따라서 여기서 중단합니다.
       */
      throw new Error(
        `후보 이미지 삭제에 실패했습니다: ${storageError.message}`
      );
    }

    console.log(
      `Storage 이미지 삭제 완료: ${removedFiles?.length || 0}개`,
      removedFiles
    );
  }

  // 3. Storage 삭제가 성공한 뒤 DB 행을 삭제합니다.
  const { error: deleteError } = await supabase
    .from(WORLDCUP_TABLE)
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("월드컵 DB 삭제 실패:", deleteError);
    throw deleteError;
  }

  return {
    success: true,
    deletedWorldcupId: id,
    deletedImageCount: imagePaths.length,
    deletedImagePaths: imagePaths,
  };
}