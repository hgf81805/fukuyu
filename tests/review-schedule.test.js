import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewPlan,intervals} from '../dist/review-schedule.js';
test('passing lengthens and failing shortens by exactly one interval',()=>{
 for(let step=0;step<intervals.length;step++){
  const item={step,scheduleVersion:2};
  assert.deepEqual(reviewPlan(item,'good'),{step:Math.min(step+1,4),days:intervals[Math.min(step+1,4)],scheduleVersion:2});
  assert.deepEqual(reviewPlan(item,'again'),{step:Math.max(step-1,0),days:intervals[Math.max(step-1,0)],scheduleVersion:2});
 }
});
test('repeated failures retreat gradually, successes advance again and stop at bounds',()=>{
 let item={step:4,scheduleVersion:2};
 for(const expected of [14,7,3,1,1]){item=reviewPlan(item,'again');assert.equal(item.days,expected)}
 for(const expected of [3,7,14,30,30]){item=reviewPlan(item,'good');assert.equal(item.days,expected)}
});
test('legacy intervals convert without changing an existing due date or history',()=>{
 const old={step:3,count:3,next:123456,logs:[{grade:'hard'}]};const before=structuredClone(old);
 assert.equal(reviewPlan(old,'good').days,14);assert.equal(reviewPlan(old,'again').days,3);assert.deepEqual(old,before);
 assert.equal(reviewPlan({step:0},'again').days,1);assert.equal(reviewPlan({step:1},'good').days,3);
});

test('legacy accounts already reviewing at 30 days retain their longest step',()=>{const item={id:'old',step:4};const history=Array.from({length:5},()=>({id:'old',grade:'good'}));assert.equal(reviewPlan(item,'good',history).days,30);assert.equal(reviewPlan(item,'again',history).days,14);assert.equal(reviewPlan(item,'again',history.slice(0,4)).days,7)});
