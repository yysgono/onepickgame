import { supabase } from "./supabaseClient";

const WORLDCUP_TABLE = "worldcups";
const CANDIDATE_BUCKET = "candidates";

/**
 * 후보 이미지 URL 또는 상대경로에서
 * candidates 버킷 내부 실제 파일 경로 추출
 */
function extractCandidateStoragePath(imageValue) {
  if (typeof imageValue !== "string") {
    return null;
  }

  const value = imageValue.trim();

  if (!value) {
    return null;
  }

  // Storage 파일이 아닌 것들
  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("/default-thumb")
  ) {
    return null;
  }

  // Supabase public URL
  const publicUrlMatch = value.match(
    /\/storage\/v1\/object\/public\/candidates\/(.+?)(?:\?.*)?$/
  );

  if (publicUrlMatch?.[1]) {
    try {
      return decodeURIComponent(publicUrlMatch[1]).replace(/^\/+/, "");
    } catch {
      return publicUrlMatch[1].replace(/^\/+/, "");
    }
  }

  // Supabase signed URL
  const signedUrlMatch = value.match(
    /\/storage\/v1\/object\/sign\/candidates\/(.+?)(?:\?.*)?$/
  );

  if (signedUrlMatch?.[1]) {
    try {
      return decodeURIComponent(signedUrlMatch[1]).replace(/^\/+/, "");
    } catch {
      return signedUrlMatch[1].replace(/^\/+/, "");
    }
  }

  // 외부 URL은 삭제 대상 아님
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
  ) {
    return null;
  }

  // 상대경로
  return value.replace(/^\/+/, "");
}

/**
 * 후보 데이터에서 Storage 이미지 경로 추출
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

  return [...new Set(paths)];
}

/**
 * =====================================================
 * 정상 월드컵 전체 조회
 *
 * deleted_at이 있는 휴지통 월드컵은 제외
 * =====================================================
 */
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("월드컵 목록 조회 실패:", error);
    throw error;
  }

  return data || [];
}

/**
 * =====================================================
 * 정상 월드컵 단일 조회
 * =====================================================
 */
export async function getWorldcupGame(id) {
  if (!id) {
    throw new Error("월드컵 ID가 없습니다.");
  }

  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
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

/**
 * =====================================================
 * 월드컵 추가
 * =====================================================
 */
export async function addWorldcupGame(cup) {
  if (!cup || typeof cup !== "object") {
    throw new Error("저장할 월드컵 데이터가 없습니다.");
  }

  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .insert([
      {
        ...cup,
        deleted_at: null,
      },
    ])
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

/**
 * =====================================================
 * 월드컵 수정
 * =====================================================
 */
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

/**
 * =====================================================
 * 일반 사용자 삭제
 *
 * 즉시 영구삭제
 *
 * 1. Storage 이미지 삭제
 * 2. DB row 삭제
 * =====================================================
 */
export async function deleteWorldcupGame(id) {
  if (!id) {
    throw new Error("월드컵 ID가 없습니다.");
  }

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

  // Storage 이미지 삭제
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

      throw new Error(
        `후보 이미지 삭제에 실패했습니다: ${storageError.message}`
      );
    }

    console.log(
      `Storage 이미지 삭제 완료: ${removedFiles?.length || 0}개`
    );
  }

  // 운영자 PICK 등록이 되어 있다면 먼저 제거
  const { error: fixedError } = await supabase
    .from("fixed_worldcups")
    .delete()
    .eq("worldcup_id", id);

  if (fixedError) {
    console.warn(
      "fixed_worldcups 정리 실패:",
      fixedError
    );
  }

  // DB 실제 삭제
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

/**
 * =====================================================
 * 관리자 삭제
 *
 * 실제 삭제하지 않음
 * Storage 이미지도 유지
 *
 * deleted_at만 설정해서 휴지통으로 이동
 * =====================================================
 */
export async function softDeleteWorldcupGame(id) {
  if (!id) {
    throw new Error("월드컵 ID가 없습니다.");
  }

  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    console.error("휴지통 이동 실패:", error);
    throw error;
  }

  if (!data?.id) {
    throw new Error("휴지통으로 이동할 월드컵을 찾을 수 없습니다.");
  }

  return true;
}

/**
 * =====================================================
 * 관리자 휴지통 목록
 * =====================================================
 */
export async function getDeletedWorldcupGames() {
  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("휴지통 조회 실패:", error);
    throw error;
  }

  return data || [];
}

/**
 * =====================================================
 * 관리자 휴지통 복구
 * =====================================================
 */
export async function restoreWorldcupGame(id) {
  if (!id) {
    throw new Error("월드컵 ID가 없습니다.");
  }

  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .update({
      deleted_at: null,
    })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select("id")
    .single();

  if (error) {
    console.error("월드컵 복구 실패:", error);
    throw error;
  }

  if (!data?.id) {
    throw new Error("복구할 월드컵을 찾을 수 없습니다.");
  }

  return true;
}

/**
 * =====================================================
 * 관리자 휴지통 영구삭제
 *
 * 휴지통에 있는 월드컵만 처리
 *
 * 1. Storage 삭제
 * 2. 운영자 PICK 정리
 * 3. DB 삭제
 * =====================================================
 */
export async function permanentlyDeleteWorldcupGame(id) {
  if (!id) {
    throw new Error("월드컵 ID가 없습니다.");
  }

  const { data: worldcup, error: fetchError } = await supabase
    .from(WORLDCUP_TABLE)
    .select("id, data, deleted_at")
    .eq("id", id)
    .not("deleted_at", "is", null)
    .single();

  if (fetchError) {
    console.error(
      "영구삭제할 월드컵 조회 실패:",
      fetchError
    );
    throw fetchError;
  }

  if (!worldcup) {
    throw new Error("휴지통의 월드컵을 찾을 수 없습니다.");
  }

  const imagePaths = getCandidateImagePaths(worldcup.data);

  // Storage 실제 삭제
  if (imagePaths.length > 0) {
    const { data: removedFiles, error: storageError } =
      await supabase.storage
        .from(CANDIDATE_BUCKET)
        .remove(imagePaths);

    if (storageError) {
      console.error(
        "영구삭제 Storage 실패:",
        storageError,
        imagePaths
      );

      throw new Error(
        `후보 이미지 영구삭제 실패: ${storageError.message}`
      );
    }

    console.log(
      `영구삭제 이미지: ${removedFiles?.length || 0}개`
    );
  }

  // 운영자 PICK에서도 제거
  const { error: fixedError } = await supabase
    .from("fixed_worldcups")
    .delete()
    .eq("worldcup_id", id);

  if (fixedError) {
    console.warn(
      "fixed_worldcups 정리 실패:",
      fixedError
    );
  }

  // DB 실제 삭제
  const { error: deleteError } = await supabase
    .from(WORLDCUP_TABLE)
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null);

  if (deleteError) {
    console.error(
      "월드컵 DB 영구삭제 실패:",
      deleteError
    );
    throw deleteError;
  }

  return {
    success: true,
    deletedWorldcupId: id,
    deletedImageCount: imagePaths.length,
    deletedImagePaths: imagePaths,
  };
}