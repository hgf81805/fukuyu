import {handler,guard,authenticate,userInfo,fail} from '../lib/auth.js';
import {validateProfileName} from '../lib/validation.js';
export function profileHandler(authenticateRequest=authenticate){return handler(async(req,res)=>{
 guard(req,res,['PATCH']);
 const {user,db,account}=await authenticateRequest(req,res);
 const body=req.body;
 if(!body||Array.isArray(body)||Object.keys(body).length!==1||!Object.hasOwn(body,'displayName')||!validateProfileName(body.displayName))throw fail(400,'名前は80文字以内で入力してください。');
 const displayName=body.displayName.trim();
 const {data,error}=await db.from('knight_accounts').update({display_name:displayName}).eq('user_id',user.id).select('display_name').maybeSingle();
 if(error)throw fail(503,'名前を保存できませんでした。時間をおいてお試しください。');
 if(!data)throw fail(403,'名前を変更できませんでした。ログインし直してください。');
 res.json({user:userInfo(user,{...account,display_name:data.display_name})});
})}
export default profileHandler();
