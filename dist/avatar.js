export async function prepareAvatar(file){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG・JPEG・WebP画像を選んでください。');
 if(file.size>8*1024*1024)throw new Error('8MB以下の画像を選んでください。');
 const bitmap=await createImageBitmap(file).catch(()=>{throw new Error('画像を読み込めませんでした。別の画像をお試しください。')});
 try{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const context=canvas.getContext('2d');const side=Math.min(bitmap.width,bitmap.height);context.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);const result=canvas.toDataURL('image/webp',.82);if(result.length>131072)throw new Error('画像を小さくできませんでした。別の画像をお試しください。');return result}finally{bitmap.close()}
}
