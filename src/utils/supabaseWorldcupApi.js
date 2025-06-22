// src/utils/supabaseWorldcupApi.js

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://irfyuvuazhujtlgpkfci.supabase.co";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZnl1dnVhemh1anRsZ3BrZmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDY0MTAsImV4cCI6MjA2NjEyMjQxMH0.q4s3G9mGnCbX7Urtks6_63XOSD8Ry2_GcmGM1wE7TBE";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. 월드컵 전체 가져오기
export async function getWorldcupGames() {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// 2. 월드컵 1개 가져오기 (id로)
export async function getWorldcupGame(id) {
  const { data, error } = await supabase
    .from("worldcups")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// 3. 월드컵 추가
export async function addWorldcupGame(cup) {
  // cup = { title, desc, data, creator, owner, created_at }
  const { data, error } = await supabase
    .from("worldcups")
    .insert([cup])
    .select("id")
    .single();
  if (error) throw error;
  return data.id; // 새로 생성된 PK id 반환
}

// 4. 월드컵 수정 (id, 나머지 정보)
export async function updateWorldcupGame(id, updates) {
  // updates = { title, desc, data, ... }
  const { error } = await supabase
    .from("worldcups")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  return true;
}

// 5. 월드컵 삭제
export async function deleteWorldcupGame(id) {
  const { error } = await supabase
    .from("worldcups")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
