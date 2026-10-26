import {test} from 'node:test';
import assert from 'node:assert/strict';
import {profileHandler} from '../api/profile.js';
import {userInfo} from '../lib/auth.js';
const user={id:'self-user-id',email:'learner@example.invalid'};
const request=body=>({method:'PATCH',headers:{host:'oboe-kngiht.vercel.app',origin:'https://oboe-kngiht.vercel.app','content-type':'application/json'},body});
const response=()=>({statusCode:200,setHeader(){},status(n){this.statusCode=n;return this},json(body){this.body=body}});
function fixture(error=null){const calls=[];let saved;const db={from(table){calls.push(['table',table]);return {update(values){calls.push(['update',values]);saved=values.display_name;return this},eq(column,id){calls.push(['where',column,id]);return this},select(columns){calls.push(['select',columns]);return this},async maybeSingle(){return {data:{display_name:saved},error}}}}};return {calls,run:profileHandler(async()=>({user,db,account:{display_name:'古い名前'}}))}}
test('self profile writes only the authenticated user name and returns the saved profile',async()=>{
 const {run,calls}=fixture(),res=response();await run(request({displayName:'  新しい名前  '}),res);
 assert.equal(res.statusCode,200);assert.deepEqual(calls,[['table','knight_accounts'],['update',{display_name:'新しい名前'}],['where','user_id',user.id],['select','display_name']]);assert.deepEqual(res.body,{user:{id:user.id,email:user.email,displayName:'新しい名前',isMaster:false}});
});
test('self profile rejects target IDs, credentials, role changes and invalid names before writing',async()=>{
 for(const body of [{displayName:'名前',userId:'other'},{displayName:'名前',email:'other@example.invalid'},{displayName:'名前',active:true},{displayName:'名前',isMaster:true},{displayName:'a'.repeat(81)},{displayName:'line\nbreak'},{displayName:123},{},null,[]]){const {run,calls}=fixture(),res=response();await run(request(body),res);assert.equal(res.statusCode,400);assert.equal(calls.length,0)}
});
test('clearing a name is allowed; database errors do not return private details',async()=>{
 let f=fixture(),res=response();await f.run(request({displayName:'   '}),res);assert.equal(res.body.user.displayName,'');
 f=fixture({message:'private database detail'});res=response();await f.run(request({displayName:'名前'}),res);assert.equal(res.statusCode,503);assert(!JSON.stringify(res.body).includes('private database detail'));
});
test('session profile exposes only name, email and verified role, without account secrets',()=>{
 assert.deepEqual(userInfo(user,{display_name:'名前',password:'private',active:true}),{id:user.id,email:user.email,displayName:'名前',isMaster:false});
});
