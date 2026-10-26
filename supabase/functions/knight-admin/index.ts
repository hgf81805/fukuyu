import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
const MASTER_EMAIL='hgf51805@gmail.com',MASTER_ID='1e51d88b-9657-47b0-86d3-57f25e3bca38';
const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const fail=(status:number,message:string)=>Object.assign(new Error(message),{status});
const validPassword=(p:unknown)=>typeof p==='string'&&p.length>=12&&p.length<=128;
const validEmail=(p:unknown)=>typeof p==='string'&&p.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p);
Deno.serve(async(req:Request)=>{try{
 if(!['GET','POST'].includes(req.method))throw fail(405,'対応していない操作です。');
 const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token)throw fail(401,'ログインしてください。');
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user||user.id!==MASTER_ID||user.email?.toLowerCase()!==MASTER_EMAIL||!user.email_confirmed_at)throw fail(403,'マスター専用の操作です。');
 const {data:master,error:masterError}=await db.from('knight_accounts').select('active,session_valid_after').eq('user_id',user.id).single();
 const iat=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).iat||0;
 const sessionId=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).session_id;const {data:masterSession}=await db.from('knight_sessions').select('auth_session_id').eq('auth_session_id',sessionId).eq('user_id',user.id).maybeSingle();
 if(masterError||!master?.active||!masterSession||iat<master.session_valid_after)throw fail(403,'ログインし直してください。');
 if(req.method==='GET'){const {data,error}=await db.from('knight_accounts').select('user_id,email,active,managed_by_knight,created_at').order('created_at');if(error)throw fail(503,'利用者を読み込めませんでした。');return reply({accounts:data})}
 const body=await req.json();
 if(body.action==='create'){
 const email=String(body.email||'').trim().toLowerCase();if(!validEmail(email)||!validPassword(body.password))throw fail(400,'メールアドレスと12〜128文字のパスワードを入力してください。');if(email===MASTER_EMAIL)throw fail(400,'マスターのアカウントは追加できません。');
 const {data,error}=await db.auth.admin.createUser({email,password:body.password,email_confirm:true,app_metadata:{knight_managed:true}});
 if(error||!data.user)throw fail(400,'登録できませんでした。使用済みのメールアドレスか、パスワードの条件を確認してください。');
 const {error:insertError}=await db.from('knight_accounts').insert({user_id:data.user.id,email,managed_by_knight:true});
 if(insertError){await db.auth.admin.deleteUser(data.user.id);throw fail(503,'登録に失敗しました。時間をおいてやり直してください。')}
 return reply({ok:true});
 }
 if(body.action==='update'){
 if(body.userId===MASTER_ID)throw fail(403,'マスターのメールアドレス・認証情報は、この画面では変更できません。');
 const {data:account,error}=await db.from('knight_accounts').select('*').eq('user_id',body.userId).maybeSingle();if(error||!account||!account.managed_by_knight)throw fail(403,'このアプリで作成した利用者だけを変更できます。');
 const changes:Record<string,unknown>={},attributes:Record<string,unknown>={};
 if(body.email!==undefined){const email=String(body.email).trim().toLowerCase();if(!validEmail(email)||email===MASTER_EMAIL)throw fail(400,'利用できるメールアドレスを入力してください。');attributes.email=email;attributes.email_confirm=true;changes.email=email}
 if(body.password!==undefined){if(!validPassword(body.password))throw fail(400,'パスワードは12〜128文字で入力してください。');attributes.password=body.password}
 if(body.active!==undefined){if(typeof body.active!=='boolean')throw fail(400,'利用状態が正しくありません。');changes.active=body.active}
 if(!Object.keys(changes).length&&!Object.keys(attributes).length)throw fail(400,'変更内容を入力してください。');
 // Revoke app access before a credential change; if Auth update fails the account remains recoverable by the master.
 changes.session_valid_after=Math.floor(Date.now()/1000);
 const {error:blockError}=await db.from('knight_accounts').update({session_valid_after:changes.session_valid_after}).eq('user_id',body.userId);if(blockError)throw fail(503,'変更を開始できませんでした。');const {error:revokeError}=await db.from('knight_sessions').delete().eq('user_id',body.userId);if(revokeError)throw fail(503,'既存のログインを無効にできませんでした。');
 if(Object.keys(attributes).length){const {error:authUpdateError}=await db.auth.admin.updateUserById(body.userId,attributes);if(authUpdateError)throw fail(400,'認証情報を変更できませんでした。使用済みのメールアドレスやパスワード条件を確認してください。')}
 const {error:updateError}=await db.from('knight_accounts').update(changes).eq('user_id',body.userId);if(updateError)throw fail(503,'変更を完了できませんでした。利用者の表示を確認し、やり直してください。');return reply({ok:true});
 }
 throw fail(400,'操作を確認してください。');
 }catch(e){const err=e as Error&{status?:number};return reply({error:err.status?err.message:'処理を完了できませんでした。'},err.status||500)}});
