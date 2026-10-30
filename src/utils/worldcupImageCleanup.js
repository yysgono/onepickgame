import {supabase} from './supabaseClient';

// Only remove files in this project's candidate bucket, never external media.
export function candidateStoragePath(value, origin = supabase.supabaseUrl) {
  if (typeof value !== 'string' || !origin) return null;
  try {
    if(decodeURIComponent(value.split(/[?#]/)[0]).split('/').some(part=>part==='.'||part==='..'))return null;
    const url=new URL(value,origin);
    if(url.origin!==new URL(origin).origin)return null;
    const match=url.pathname.match(/^\/storage\/v1\/(?:object|render\/image)\/(?:public|sign|authenticated)\/candidates\/(.+)$/);
    if(!match)return null;
    const path=decodeURIComponent(match[1]);
    return path && !path.split('/').some(part=>part==='.'||part==='..') ? path : null;
  }catch{return null;}
}
function rows(value){if(typeof value==='string'){try{value=JSON.parse(value);}catch{return [];}}return Array.isArray(value)?value:[];}
export function removedCandidateImagePaths(before,after){
 const kept=new Set(rows(after).map(row=>candidateStoragePath(row?.image)).filter(Boolean));
 return [...new Set(rows(before).filter(row=>row?.image_reused!==true).map(row=>candidateStoragePath(row?.image)).filter(path=>path&&!kept.has(path)))];
}
export async function removeCandidateImageFiles(paths){
 const unique=[...new Set(paths.filter(Boolean))],removed=[],failed=[];
 for(let start=0;start<unique.length;start+=100){
  let batch=unique.slice(start,start+100);
  try{
   const {data:safe,error:checkError}=await supabase.rpc('filter_trash_safe_candidate_paths',{p_paths:batch});
   if(checkError)throw checkError;
   if(!Array.isArray(safe))throw new Error('Invalid protected image response');
   const allowed=new Set(safe);
   batch=batch.filter(path=>allowed.has(path));
   if(!batch.length)continue;
   const {data,error}=await supabase.storage.from('candidates').remove(batch);
   if(error)throw error;
   const confirmed=new Set((data||[]).map(file=>file.name||file.path));
   removed.push(...batch.filter(path=>confirmed.has(path)));
   failed.push(...batch.filter(path=>!confirmed.has(path)));
  }catch(error){failed.push(...batch);console.warn('Candidate file cleanup incomplete',error?.message||'Storage request failed');}
 }
 return {removed,failed};
}
const WARNINGS={
 ko:'게임은 저장·삭제됐지만 일부 사진 파일 삭제를 확인하지 못했습니다. 저장소 권한 또는 연결 상태를 확인해 주세요.',
 en:'The game was saved/deleted, but removal of some image files could not be confirmed. Check storage permissions or your connection.',
 ja:'ゲームの保存・削除は完了しましたが、一部の画像ファイルの削除を確認できませんでした。保存先の権限と接続をご確認ください。',
 zh:'游戏已保存或删除，但无法确认部分图片文件已删除。请检查存储权限或网络连接。',
 es:'El juego se guardó o eliminó, pero no se confirmó la eliminación de algunas imágenes. Revisa los permisos o la conexión.',
 fr:'Le jeu a été enregistré ou supprimé, mais la suppression de certaines images reste à confirmer. Vérifiez les permissions et la connexion.',
 vi:'Trò chơi đã được lưu hoặc xóa, nhưng chưa xác nhận xóa một số ảnh. Hãy kiểm tra quyền lưu trữ và kết nối.',
 de:'Das Spiel wurde gespeichert oder gelöscht. Das Löschen einiger Bilder konnte nicht bestätigt werden. Prüfe Speicherrechte und Verbindung.',
 ru:'Игра сохранена или удалена, но удаление некоторых изображений не подтверждено. Проверьте права хранилища и подключение.',
 id:'Game telah disimpan atau dihapus, tetapi penghapusan sebagian gambar belum terkonfirmasi. Periksa izin penyimpanan atau koneksi.',
 pt:'O jogo foi salvo ou excluído, mas a exclusão de algumas imagens não foi confirmada. Verifique as permissões ou a conexão.',
 hi:'गेम सहेजा या हटाया गया है, लेकिन कुछ तस्वीरें हटने की पुष्टि नहीं हुई। स्टोरेज की अनुमति या कनेक्शन जाँचें।',
 bn:'গেম সংরক্ষণ বা মুছে ফেলা হয়েছে, তবে কিছু ছবি মোছা নিশ্চিত হয়নি। স্টোরেজের অনুমতি বা সংযোগ দেখুন।',
 ar:'تم حفظ اللعبة أو حذفها، لكن تعذر تأكيد حذف بعض الصور. تحقق من أذونات التخزين أو الاتصال.',
 th:'บันทึกหรือลบเกมแล้ว แต่ยังยืนยันการลบรูปบางไฟล์ไม่ได้ โปรดตรวจสอบสิทธิ์พื้นที่จัดเก็บหรือการเชื่อมต่อ',
 tr:'Oyun kaydedildi veya silindi ancak bazı resimlerin silindiği doğrulanamadı. Depolama izinlerini veya bağlantıyı kontrol edin.'
,
"it":"Il gioco è stato salvato/cancellato, ma non è stato possibile confermare la rimozione di alcuni file immagine. Controllare i permessi di archiviazione o la connessione.",
"pl":"Gra została zapisana/usunięta, ale usunięcie niektórych plików obrazu nie może być potwierdzone. Sprawdź uprawnienia do przechowywania lub połączenie.",
"nl":"Het spel werd opgeslagen / verwijderd, maar het verwijderen van sommige afbeeldingsbestanden kon niet worden bevestigd. Controleer opslagrechten of uw verbinding.",
"cs":"Hra byla uložena/smazána, ale odstranění některých obrazových souborů nebylo možné potvrdit. Zkontrolujte práva k ukládání nebo vaše připojení."
};
export function notifyImageCleanupFailure(result,language){
 if(!result.failed.length||typeof window==='undefined')return;
 const lang=String(language||window.location.pathname.split('/')[1]||'en').split(/[-_]/)[0];
 window.alert(WARNINGS[lang]||WARNINGS.en);
}
