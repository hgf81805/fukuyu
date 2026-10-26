export const validPassword=value=>typeof value==='string'&&value.length===6;
export function validAvatar(value){
 if(value==='')return true;
 if(typeof value!=='string'||value.length>131072)return false;
 const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
 if(!match||match[2].length%4!==0)return false;
 let bytes;try{bytes=atob(match[2])}catch{return false}
 if(bytes.length<12)return false;
 const code=i=>bytes.charCodeAt(i);
 if(match[1]==='png')return [137,80,78,71,13,10,26,10].every((x,i)=>code(i)===x);
 if(match[1]==='jpeg')return code(0)===255&&code(1)===216&&code(2)===255;
 return bytes.slice(0,4)==='RIFF'&&bytes.slice(8,12)==='WEBP';
}
