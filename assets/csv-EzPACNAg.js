import{c as p}from"./index-B-S10I32.js";/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=p("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=p("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]);function u(n){const r=[];let o="",i=[],l=!1;for(let e=0;e<n.length;e++){const s=n[e];l?s==='"'?n[e+1]==='"'?(o+='"',e++):l=!1:o+=s:s==='"'?l=!0:s===","?(i.push(o),o=""):s===`
`||s==="\r"?(s==="\r"&&n[e+1]===`
`&&e++,i.push(o),o="",i.some(t=>t.trim()!=="")&&r.push(i),i=[]):o+=s}if(i.push(o),i.some(e=>e.trim()!=="")&&r.push(i),r.length===0)return{headers:[],rows:[]};const a=r[0].map(e=>e.trim().toLowerCase().replace(/\s+/g,"_")),c=r.slice(1).map(e=>{const s={};return a.forEach((t,f)=>{s[t]=(e[f]??"").trim()}),s});return{headers:a,rows:c}}export{d as D,y as U,u as p};
