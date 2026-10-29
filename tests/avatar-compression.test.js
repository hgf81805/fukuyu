import {test} from 'node:test';import assert from 'node:assert/strict';
import {prepareAvatar} from '../dist/avatar.js';
function mockEncoder(encode){const calls=[];let closed=false;const bitmap={width:4000,height:3000,close(){closed=true}};const canvas={width:0,height:0,getContext:()=>({drawImage(...args){calls.push({crop:args.slice(1)})}}),toDataURL(type,quality){calls.push({size:this.width,quality});return encode(this.width,quality)}};const oldDocument=globalThis.document,oldBitmap=globalThis.createImageBitmap;globalThis.document={createElement:()=>canvas};globalThis.createImageBitmap=async()=>bitmap;return {calls,get closed(){return closed},restore(){globalThis.document=oldDocument;globalThis.createImageBitmap=oldBitmap}}}
const image='data:image/webp;base64,'+'A'.repeat(100);
test('large source images are accepted and centre-cropped before compression',async()=>{const m=mockEncoder(()=>image);try{assert.equal(await prepareAvatar({type:'image/png',size:40*1024*1024}),image);assert.deepEqual(m.calls[0].crop,[500,0,3000,3000,0,0,256,256]);assert(m.closed)}finally{m.restore()}});
test('quality is reduced automatically before reducing dimensions',async()=>{const m=mockEncoder((size,q)=>size<=192||q<=.48?image:'data:image/webp;base64,'+'A'.repeat(140000));try{assert.equal(await prepareAvatar({type:'image/jpeg',size:12*1024*1024}),image);assert.deepEqual(m.calls.filter(c=>c.quality).map(c=>c.quality),[.82,.65,.48]);assert(m.closed)}finally{m.restore()}});
test('dimensions shrink if quality alone cannot fit; PNG fallback also fits',async()=>{for(const mime of ['webp','png']){const m=mockEncoder(size=>size<=128?'data:image/'+mime+';base64,AAAA':'data:image/'+mime+';base64,'+'A'.repeat(140000));try{const result=await prepareAvatar({type:'image/png',size:20*1024*1024});assert(result.length<=131072);assert(m.calls.some(c=>c.size===128));assert(m.closed)}finally{m.restore()}}});
test('failed encoding still releases the decoded bitmap',async()=>{const m=mockEncoder(()=>{throw new Error('encoding failed')});try{await assert.rejects(prepareAvatar({type:'image/png'}));assert(m.closed)}finally{m.restore()}});
test('mobile HEIC/HEIF MIME types and empty-type camera filenames reach native decoding',async()=>{
 for(const file of [{type:'image/heic',name:'IMG_001.HEIC'},{type:'image/heif-sequence',name:'photo.heif'},{type:'',name:'IMG_002.JPG'},{type:'application/octet-stream',name:'IMG_003.HEIF'},{type:'image/avif',name:'photo.avif'}]){
  const m=mockEncoder(()=>image);try{assert.equal(await prepareAvatar(file),image);assert(m.closed)}finally{m.restore()}
 }
 const m=mockEncoder(()=>image);try{await assert.rejects(prepareAvatar({type:'image/svg+xml',name:'image.svg'}));assert.equal(m.calls.length,0)}finally{m.restore()}
});
test('mobile browsers without bitmap decoding use Image and release their object URLs on success and failure',async()=>{
 for(const fail of [false,true]){
  const m=mockEncoder(()=>image),oldImage=globalThis.Image,create=URL.createObjectURL,revoke=URL.revokeObjectURL;let revoked=false;
  globalThis.createImageBitmap=undefined;
  URL.createObjectURL=()=> 'blob:mobile-test';URL.revokeObjectURL=url=>{assert.equal(url,'blob:mobile-test');revoked=true};
  globalThis.Image=class{naturalWidth=4000;naturalHeight=3000;set src(value){queueMicrotask(()=>fail?this.onerror(new Error('decode failed')):this.onload())}};
  try{if(fail)await assert.rejects(prepareAvatar({type:'image/jpeg'}),/読み込めません/);else assert.equal(await prepareAvatar({type:'image/jpeg'}),image);assert(revoked)}finally{m.restore();globalThis.Image=oldImage;URL.createObjectURL=create;URL.revokeObjectURL=revoke}
 }
});
