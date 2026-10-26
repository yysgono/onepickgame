import {trashContent,listTrash,restoreContent,purgeContent} from "./contentTrashApi";
import { invalidateStatsCache } from "./statsCache";
import { supabase } from "./supabaseClient";

const WORLDCUP_TABLE = "worldcups";
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

  const { data, error } = await supabase
    .from(WORLDCUP_TABLE)
    .update(updates)
    .eq("id", id).select("id").single();

  if (error || !data?.id) {
    console.error("월드컵 수정 실패:", error);
    throw error || new Error("수정 권한이 없거나 월드컵을 찾을 수 없습니다.");
  }

  invalidateStatsCache(id);
  return true;
}

/**
 * =====================================================
 * 일반 사용자 삭제
 *
 * 최소 30일 보관하는 휴지통으로 이동합니다. 이미지와 연결된 행은 유지합니다.
 * =====================================================
 */
export async function deleteWorldcupGame(id) { await trashContent("worldcup",id); return {success:true,deletedWorldcupId:id,deletedImageCount:0,deletedImagePaths:[],imageCleanupFailed:[]}; }

export async function softDeleteWorldcupGame(id) { await trashContent("worldcup",id); return true; }

export async function getDeletedWorldcupGames() { const page=await listTrash({kind:"worldcup"}); return page.items || []; }

export async function restoreWorldcupGame(id) { await restoreContent("worldcup",id); return true; }

export async function permanentlyDeleteWorldcupGame(id) { await purgeContent("worldcup",id); return {success:true,deletedWorldcupId:id,deletedImageCount:0,deletedImagePaths:[],imageCleanupFailed:[]}; }

