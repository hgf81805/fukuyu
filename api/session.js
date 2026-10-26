import {handler,guard,authenticate,accountFor,setSession,userInfo,fail,SUPABASE_URL,SUPABASE_KEY} from '../lib/auth.js';
export default handler(async(req,res)=>{guard(req,res,['GET','POST','DELETE']);
 if(req.method==='GET'){const {user,account}=await authenticate(req,res);return res.json({user:userInfo(user,account)})}
 if(req.method==='DELETE'){try{const {token}=await authenticate(req,res);const response=await fetch(`${SUPABASE_URL}/functions/v1/knight-login`,{method:'POST',headers:{Authorization:`Bearer ${token}`,apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});if(!response.ok&&response.status!==401)throw fail(503,'ログアウトを完了できませんでした。もう一度お試しください。')}catch(e){if(![401,403].includes(e.status))throw e}setSession(req,res,null);return res.json({ok:true})}
 const email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');if(!email||email.length>254||!password||password.length>256)throw fail(400,'メールアドレスとパスワードを入力してください。');
 const response=await fetch(`${SUPABASE_URL}/functions/v1/knight-login`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 const result=await response.json().catch(()=>({error:'ログインを完了できませんでした。'}));if(!response.ok||!result.session)throw fail(response.status||503,result.error||'ログインできませんでした。');
 const session=result.session;const {account}=await accountFor(session.user,session.access_token);setSession(req,res,session);res.json({user:userInfo(session.user,account)});
});
