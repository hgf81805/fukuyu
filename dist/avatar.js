const MAX_AVATAR_LENGTH=131072;
const SIZES=[256,192,128,96,64];
const QUALITIES=[.82,.65,.48,.3];
const HEIF_TYPES=['image/heic','image/heif','image/heic-sequence','image/heif-sequence'];
const IMAGE_TYPES=['image/png','image/jpeg','image/jpg','image/webp','image/avif',...HEIF_TYPES];
function isHeif(file){return HEIF_TYPES.includes((file.type||'').toLowerCase())||/\.hei[cf]$/i.test(file.name||'')}
function isSupported(file){
 const type=(file?.type||'').toLowerCase();
 return !!file&&(IMAGE_TYPES.includes(type)||((!type||type==='application/octet-stream')&&/\.(png|jpe?g|webp|avif|hei[cf])$/i.test(file.name||'')));
}
async function nativeImage(file){
 if(typeof createImageBitmap==='function')try{return await createImageBitmap(file,{imageOrientation:'from-image'})}catch{}
 if(typeof Image==='undefined')throw new Error('Unsupported image');
 const image=new Image(),url=URL.createObjectURL(file);
 try{
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url});
  return {source:image,width:image.naturalWidth,height:image.naturalHeight,close(){URL.revokeObjectURL(url)}};
 }catch(error){URL.revokeObjectURL(url);throw error}
}
async function decodeImage(file){
 try{return await nativeImage(file)}catch{
  if(isHeif(file))try{
   const {heicTo}=await import('./vendor/heic-to.js');
   const jpeg=await heicTo({blob:file,type:'image/jpeg',quality:.9});
   return await nativeImage(jpeg);
  }catch{throw new Error('HEIC・HEIF画像を変換できませんでした。別の写真をお試しください。')}
  throw new Error('画像を読み込めませんでした。別の画像をお試しください。');
 }
}
export async function prepareAvatar(file){
 if(!isSupported(file))throw new Error('PNG・JPEG・WebP・AVIF・HEIC・HEIF画像を選んでください。');
 const bitmap=await decodeImage(file);
 try{
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  if(!context)throw new Error('このブラウザでは画像を処理できませんでした。');
  const side=Math.min(bitmap.width,bitmap.height);
  if(!side)throw new Error('画像のサイズを読み込めませんでした。');
  // Keep the centre crop and reduce quality, then dimensions, until storage fits.
  for(const size of new Set(SIZES.map(size=>Math.min(size,side)))){
   canvas.width=size;canvas.height=size;
   context.drawImage(bitmap.source||bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,size,size);
   for(const quality of QUALITIES){
    const result=canvas.toDataURL('image/webp',quality);
    if(result.length<=MAX_AVATAR_LENGTH&&/^data:image\/(webp|png);base64,/.test(result))return result;
    // Browsers without WebP encoding return PNG; quality does not affect PNG.
    if(!result.startsWith('data:image/webp;'))break;
   }
  }
  throw new Error('画像を処理できませんでした。別の画像をお試しください。');
 }finally{bitmap.close()}
}
