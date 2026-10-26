import {handler,guard,authenticate,fail} from '../lib/auth.js';
import {validateLearningData} from '../lib/validation.js';
export default handler(async(req,res)=>{guard(req,res,['GET','PUT']);const {user,db}=await authenticate(req,res);
 if(req.method==='GET'){const {data,error}=await db.from('knight_learning_data').select('data,revision').eq('user_id',user.id).maybeSingle();if(error)throw fail(503,'学びを読み込めませんでした。');return res.json(data||{data:null,revision:0})}
 const {data,revision}=req.body||{};if(!validateLearningData(data)||!Number.isInteger(revision)||revision<0)throw fail(400,'保存データの形式が正しくありません。');
 const row={data,revision:revision+1,updated_at:new Date().toISOString()};
 const result=revision===0?await db.from('knight_learning_data').insert({...row,user_id:user.id}).select('revision').single():await db.from('knight_learning_data').update(row).eq('user_id',user.id).eq('revision',revision).select('revision').maybeSingle();
 if(result.error?.code==='23505'||(!result.error&&!result.data))throw fail(409,'別の画面でデータが更新されました。未保存の変更を確認して再読み込みしてください。');if(result.error)throw fail(503,'サーバーに保存できませんでした。');res.json({revision:result.data.revision});
});
