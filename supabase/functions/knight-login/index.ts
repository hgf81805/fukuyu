import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req:Request)=>{if(req.method!=='POST')return reply({error:'対応していない操作です。'},405);try{
 const body=await req.json();
 if(body.action==='logout'){
  const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token)return reply({error:'ログインしてください。'},401);
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await admin.auth.getUser(token);if(error||!user)return reply({error:'ログインしてください。'},401);
  const claims=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
  const {error:deleteError}=await admin.from('knight_sessions').delete().eq('auth_session_id',claims.session_id).eq('user_id',user.id);
  if(deleteError)return reply({error:'ログアウトを完了できませんでした。'},503);await admin.auth.admin.signOut(token,'local');return reply({ok:true});
 }
 const {email:raw,password}=body,email=String(raw||'').trim().toLowerCase();
 if(email.length>254||!email||typeof password!=='string'||!password||password.length>256)return reply({error:'メールアドレスとパスワードを入力してください。'},400);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.auth.signInWithPassword({email,password});if(error||!data.session)return reply({error:'メールアドレスまたはパスワードが正しくありません。'},401);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:account,error:accountError}=await admin.from('knight_accounts').select('email,active,session_valid_after').eq('user_id',data.user.id).maybeSingle();
 const claims=JSON.parse(atob(data.session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
 if(accountError||!account?.active||account.email!==email||claims.iat<account.session_valid_after){await db.auth.signOut({scope:'local'});return reply({error:'このアカウントは利用できません。マスターに確認してください。'},403)}
 const {error:insertError}=await admin.from('knight_sessions').upsert({auth_session_id:claims.session_id,user_id:data.user.id},{onConflict:'auth_session_id'});if(insertError){await db.auth.signOut({scope:'local'});return reply({error:'ログインを完了できませんでした。'},503)}
 return reply({session:data.session});
 }catch{return reply({error:'ログインを完了できませんでした。'},503)}});
