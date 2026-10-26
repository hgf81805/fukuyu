import {test} from 'node:test';
import assert from 'node:assert/strict';
import {effortSummary} from '../dist/effort.js';
const now=new Date(2026,9,26,12).getTime();
const at=(offset,hour=10)=>new Date(2026,9,26+offset,hour).getTime();
test('effort combines registration and all review results, counting distinct local dates',()=>{
 const s=effortSummary([{created:at(-2)},{created:at(-2)}],[{at:at(-1),grade:'again'},{at:at(-1),grade:'good'},{at:at(0),grade:'again'}],now);
 assert.equal(s.streak,3);assert.equal(s.learningDays,3);assert.equal(s.weekReviews,3);assert.equal(s.totalReviews,3);assert.equal(s.weekDays,3);assert.equal(s.recent.length,28);assert.equal(s.recent.at(-1).reviews,1);assert(s.todayActive);
});
test('yesterday streak remains available today, gaps break it, future events are excluded',()=>{
 assert.equal(effortSummary([],[{at:at(-1)},{at:at(-2)},{at:at(-4)},{at:at(1)}],now).streak,2);
 assert.equal(effortSummary([],[{at:at(-2)}],now).streak,0);
 assert.equal(effortSummary([],[{at:at(1)}],now).learningDays,0);
});
test('milestones advance on achievement, remain bounded and work after 1000 reviews',()=>{
 for(const count of [0,9,10,29,30,50,100,999,1000,1500]){
  const s=effortSummary([],Array.from({length:count},()=>({at:at(0)})),now);
  assert(s.nextMilestone>count);assert.equal(s.remaining,s.nextMilestone-count);assert(s.progress>=0&&s.progress<=100);
 }
 assert.equal(effortSummary([],Array.from({length:10},()=>({at:at(0)})),now).nextMilestone,30);
});
