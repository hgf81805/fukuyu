import { createClient } from '@supabase/supabase-js';
export const SUPABASE_URL='https://zfwweszgsrovuiabvzye.supabase.co';
export const SUPABASE_KEY='sb_publishable_VQueCVzf3qFVSvl-0G4axg_DXK7UArb';
export const MASTER_EMAIL='hgf51805@gmail.com';
export const MASTER_ID='1e51d88b-9657-47b0-86d3-57f25e3bca38';
export function isMaster(user){return user?.id===MASTER_ID&&user?.email?.toLowerCase()===MASTER_EMAIL&&!!user.email_confirmed_at}
export function client(token){return createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},...(token?{global:{headers:{Authorization:`Bearer ${token}`}}}:{})})}
export function fail(status,message){return Object.assign(new Error(message),{status})}
export function guard(req,res,methods){res.setHeader('Cache-Control','no-store, private');res.setHeader('Vary','Cookie');if(!methods.includes(req.method))throw fail(405,'この操作には対応していません。');if(req.method!=='GET'){
 const origin=req.headers.origin,host=req.headers.host;let parsed;try{parsed=new URL(origin)}catch{throw fail(403,'ページを再読み込みして操作してください。')}
 if(parsed.host!==host||req.headers['sec-fetch-site']==='cross-site')throw fail(403,'このサイトから操作してください。');
 if(req.method!=='DELETE'&&!String(req.headers['content-type']||'').startsWith('application/json'))throw fail(415,'JSON形式で送信してください。');
 if(Buffer.byteLength(JSON.stringify(req.body||{}))>1500000)throw fail(413,'データが大きすぎます。');
}}
export function cookies(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').map(p=>{const i=p.indexOf('=');return i<0?['','']:[p.slice(0,i).trim(),decodeURIComponent(p.slice(i+1))]}))}
export function setSession(req,res,session){const secure=!/^localhost(:|$)|^127\.0\.0\.1(:|$)/.test(req.headers.host||'');const flags=`Path=/; HttpOnly; SameSite=Lax${secure?'; Secure':''}`;res.setHeader('Set-Cookie',[
 `knight-access=${encodeURIComponent(session?.access_token||'')}; Max-Age=${session?3600:0}; ${flags}`,
 `knight-refresh=${encodeURIComponent(session?.refresh_token||'')}; Max-Age=${session?604800:0}; ${flags}`]);}
export function issuedAt(token){try{return JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).iat||0}catch{return 0}}
export function sessionId(token){try{return JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).session_id||''}catch{return ''}}
export async function accountFor(user,token){const db=client(token),{data,error}=await db.from('knight_accounts').select('user_id,email,display_name,avatar_data,active,session_valid_after,managed_by_knight').eq('user_id',user.id).maybeSingle();if(error)throw fail(503,'アカウント情報を確認できませんでした。');if(!data||!data.active||data.email!==user.email?.toLowerCase()||issuedAt(token)<data.session_valid_after)throw fail(403,'このアカウントは利用できません。マスターに確認してください。');const sid=sessionId(token);if(!sid)throw fail(401,'ログインし直してください。');const {data:session,error:sessionError}=await db.from('knight_sessions').select('auth_session_id').eq('auth_session_id',sid).eq('user_id',user.id).maybeSingle();if(sessionError)throw fail(503,'ログイン状態を確認できませんでした。');if(!session)throw fail(401,'ログインし直してください。');return {db,account:data}}
export async function authenticate(req,res){const c=cookies(req);let token=c['knight-access'];let user;
 if(token){const result=await client().auth.getUser(token);user=result.data.user;}
 if(!user&&c['knight-refresh']){const {data,error}=await client().auth.refreshSession({refresh_token:c['knight-refresh']});if(!error&&data.session){token=data.session.access_token;user=data.user;setSession(req,res,data.session)}}
 if(!user||!token){setSession(req,res,null);throw fail(401,'ログインしてください。')}
 const {db,account}=await accountFor(user,token);return {user,token,db,account};
}
export function userInfo(user,account){return {id:user.id,email:user.email,displayName:account?.display_name||'',avatarData:account?.avatar_data||'',isMaster:isMaster(user)}}
export function handler(fn){return async(req,res)=>{try{await fn(req,res)}catch(e){const status=e.status||500;res.status(status).json({error:status===500?'処理を完了できませんでした。時間をおいてお試しください。':e.message})}}}
