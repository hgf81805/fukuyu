const localKey=date=>`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
const shifted=(date,days)=>{const d=new Date(date);d.setDate(d.getDate()+days);return d};
export function effortSummary(items,logs,now=Date.now()) {
 const today=new Date(now);today.setHours(0,0,0,0);
 const days=new Map();
 function add(at,kind){if(!Number.isFinite(at)||at>now)return;const d=new Date(at);if(Number.isNaN(d.getTime()))return;const key=localKey(d);const row=days.get(key)||{reviews:0,created:0};row[kind]++;days.set(key,row)}
 items.forEach(item=>add(item.created,'created'));
 logs.forEach(log=>add(log.at,'reviews'));
 let streak=0,cursor=days.has(localKey(today))?today:shifted(today,-1);
 while(days.has(localKey(cursor))){streak++;cursor=shifted(cursor,-1)}
 const recent=Array.from({length:28},(_,i)=>{const d=shifted(today,i-27);return {key:localKey(d),date:d.getTime(),day:d.getDate(),weekday:d.getDay(),today:i===27,...(days.get(localKey(d))||{reviews:0,created:0})}});
 const week=recent.slice(-7),weekReviews=week.reduce((n,d)=>n+d.reviews,0);
 const totalReviews=[...days.values()].reduce((n,d)=>n+d.reviews,0);
 const milestones=[10,30,50,100,200,300,500,1000];
 const next=milestones.find(n=>n>totalReviews)||((Math.floor(totalReviews/500)+1)*500);
 const previous=[0,...milestones].filter(n=>n<=totalReviews).at(-1)||0;
 const base=totalReviews>=1000?Math.floor(totalReviews/500)*500:previous;
 return {recent,streak,weekReviews,totalReviews,learningDays:days.size,weekDays:week.filter(d=>d.reviews+d.created>0).length,todayActive:days.has(localKey(today)),nextMilestone:next,remaining:next-totalReviews,progress:Math.round((totalReviews-base)/(next-base)*100)};
}
