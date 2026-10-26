const MAX_AVATAR_LENGTH=131072;
const SIZES=[256,192,128,96,64];
const QUALITIES=[.82,.65,.48,.3];
export async function prepareAvatar(file){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG・JPEG・WebP画像を選んでください。');
 const bitmap=await createImageBitmap(file).catch(()=>{throw new Error('画像を読み込めませんでした。別の画像をお試しください。')});
 try{
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  if(!context)throw new Error('このブラウザでは画像を処理できませんでした。');
  const side=Math.min(bitmap.width,bitmap.height);
  if(!side)throw new Error('画像のサイズを読み込めませんでした。');
  // Keep the centre crop and reduce quality, then dimensions, until storage fits.
  for(const size of new Set(SIZES.map(size=>Math.min(size,side)))){
   canvas.width=size;canvas.height=size;
   context.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,size,size);
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
