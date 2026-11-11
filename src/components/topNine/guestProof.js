export function guestSalt(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');}
export function normalizeGuestSalt(value){
 if(Array.isArray(value))value=value[0];
 if(value&&typeof value==='object')value=value.salt||value.guest_salt||value.get_top_nine_guest_salt;
 if(typeof value!=='string'||! /^[a-f0-9]{32}$/i.test(value))throw Error('GUEST_SALT_UNAVAILABLE');
 return value;
}
export async function guestProof(password,salt){
 salt=normalizeGuestSalt(salt);
 if(typeof password!=='string'||password.length<4||password.length>100)throw Error('GUEST_PASSWORD');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:600000,hash:'SHA-256'},key,256);
 return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');
}
