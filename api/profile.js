import {handler,guard,authenticate,userInfo,fail} from '../lib/auth.js';
import {validAvatar} from '../supabase/functions/knight-admin/account-values.js';
import {validateProfileName} from '../lib/validation.js';
export function profileHandler(authenticateRequest=authenticate){return handler(async(req,res)=>{
 guard(req,res,['PATCH']);
 const {user,db,account}=await authenticateRequest(req,res);
 const body=req.body;
 if(!body||Array.isArray(body)||!Object.keys(body).length||Object.keys(body).some(k=>!['displayName','avatarData'].includes(k)))throw fail(400,'プロフィールの変更内容を確認してください。');
 const changes={};
 if(body.displayName!==undefined){if(!validateProfileName(body.displayName))throw fail(400,'名前は80文字以内で入力してください。');changes.display_name=body.displayName.trim()}
 if(body.avatarData!==undefined){if(!validAvatar(body.avatarData))throw fail(400,'アイコンはPNG・JPEG・WebP画像を選んでください。');changes.avatar_data=body.avatarData}
 const {data,error}=await db.from('knight_accounts').update(changes).eq('user_id',user.id).select('display_name,avatar_data').maybeSingle();
 if(error)throw fail(503,'プロフィールを保存できませんでした。時間をおいてお試しください。');
 if(!data)throw fail(403,'プロフィールを変更できませんでした。ログインし直してください。');
 res.json({user:userInfo(user,{...account,...data})});
})}
export default profileHandler();
