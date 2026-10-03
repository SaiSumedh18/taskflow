import http from 'k6/http';
import {check} from 'k6';
export const options={vus:Number(__ENV.VUS||5),duration:__ENV.DURATION||'30s',summaryTrendStats:['med','p(95)','p(99)'],thresholds:{http_req_failed:['rate<0.01'],checks:['rate>0.99']}};
export default function(){
 const headers={Authorization:`Bearer ${__ENV.TOKEN}`,'Content-Type':'application/json'};
 let r;
 if(__ENV.MODE==='update') r=http.patch(`${__ENV.BASE_URL}/api/tasks/1`,JSON.stringify({status:'IN_PROGRESS'}),{headers});
 else r=http.get(`${__ENV.BASE_URL}/api/projects/1/tasks${__ENV.MODE==='filtered'?'?status=TODO&priority=HIGH':''}`,{headers});
 check(r,{'status 200':r=>r.status===200});
}
export function handleSummary(data){return {[__ENV.RESULT_FILE]:JSON.stringify(data,null,2)};}
