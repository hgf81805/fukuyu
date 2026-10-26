export const DAY = 86400000;
export const intervals = Object.freeze([1, 3, 7, 14, 30]);
// v1 stored the *next successful* step. v2 stores the interval currently in use.
// Convert on review so existing due dates and learning histories remain intact.
export function currentReviewStep(item, history=[]) {
 const step=Number.isInteger(item.step)?item.step:0;
 if(item.scheduleVersion!==2&&step===4&&history.filter(log=>log.id===item.id&&log.grade==='good').length>=5)return 4;
 return Math.max(0,Math.min(intervals.length-1,item.scheduleVersion===2?step:step-1));
}
export function reviewPlan(item, grade, history=[]) {
 if(!['good','again'].includes(grade))throw new TypeError('Unknown review result');
 const step=Math.max(0,Math.min(intervals.length-1,currentReviewStep(item,history)+(grade==='good'?1:-1)));
 return {step,days:intervals[step],scheduleVersion:2};
}
