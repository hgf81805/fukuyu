export function validateLearningData(data){
 if(!data||!Array.isArray(data.items)||!Array.isArray(data.logs)||!Array.isArray(data.categories)||data.items.length>10000||data.logs.length>100000||data.categories.length<1||data.categories.length>200)return false;
 if(!data.categories.every(x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=100)||new Set(data.categories).size!==data.categories.length)return false;
 if(!data.items.every(x=>x&&typeof x.id==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(x.id)&&typeof x.title==='string'&&x.title.length<=100&&typeof x.body==='string'&&x.body.length<=10000&&data.categories.includes(x.category)&&Number.isFinite(x.next)&&Number.isFinite(x.created)&&Number.isInteger(x.step)&&x.step>=0&&x.step<=4&&Number.isInteger(x.count)&&x.count>=0)||new Set(data.items.map(x=>x.id)).size!==data.items.length)return false;
 return data.logs.every(x=>x&&typeof x.id==='string'&&Number.isFinite(x.at)&&['again','hard','good'].includes(x.grade));
}

export function validateProfileName(value){return typeof value==='string'&&value.trim().length<=80&&!/[\u0000-\u001f\u007f]/.test(value)}
