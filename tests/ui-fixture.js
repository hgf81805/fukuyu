// Local browser QA fixture. Imported only by scripts/dev-server.js with an explicit flag.
const master={id:'1e51d88b-9657-47b0-86d3-57f25e3bca38',email:'hgf51805@gmail.com',isMaster:true};
const user={id:'33333333-3333-4333-8333-333333333333',email:'learner@example.invalid',isMaster:false};
const currentUser=process.env.KNIGHT_UI_ROLE==='user'?user:master;
let loggedIn=true,revision=0,learning=null;
const accounts=[{user_id:master.id,email:master.email,display_name:'管理者',password:'DemoMaster-Only123',active:true,managed_by_knight:false,created_at:new Date().toISOString()},{user_id:'33333333-3333-4333-8333-333333333333',email:'learner@example.invalid',display_name:'山田 太郎',password:'DemoLearner-12345',active:true,managed_by_knight:true,created_at:new Date().toISOString()}];
export function handleFixture(req,res,name){
 if(name==='session'){if(req.method==='DELETE'){loggedIn=false;return res.json({ok:true})}if(req.method==='POST'){loggedIn=true;return res.json({user:currentUser})}return loggedIn?res.json({user:currentUser}):res.status(401).json({error:'ログインしてください。'})}
 if(!loggedIn)return res.status(401).json({error:'ログインしてください。'});
 if(name==='data'){if(req.method==='GET')return res.json({data:learning,revision});if(req.body.revision!==revision)return res.status(409).json({error:'別の画面で更新されました。'});learning=req.body.data;return res.json({revision:++revision})}
 if(name==='admin'){if(!currentUser.isMaster)return res.status(403).json({error:'マスター専用の操作です。'});if(req.method==='GET')return res.json({accounts});const body=req.body;if(body.action==='create'){accounts.push({user_id:crypto.randomUUID(),email:body.email,display_name:body.displayName||'',password:body.password,active:true,managed_by_knight:true,created_at:new Date().toISOString()})}else if(body.action==='delete'){const i=accounts.findIndex(x=>x.user_id===body.userId&&x.managed_by_knight);if(i<0)return res.status(403).json({error:'削除できません。'});accounts.splice(i,1)}else{const a=accounts.find(x=>x.user_id===body.userId);if(body.email)a.email=body.email;if(body.displayName!==undefined)a.display_name=body.displayName;if(body.password)a.password=body.password;if(body.active!==undefined)a.active=body.active}return res.json({ok:true})}
 return res.status(404).json({error:'Not found'});
}
