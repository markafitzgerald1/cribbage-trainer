import{i as e,r as t,s as n}from"./preload-helper-CT_b8DTk.js";import{z as r}from"./iframe-C4Mo0zok.js";import{t as i}from"./jsx-runtime-DqZldVDK.js";import{n as a,t as o}from"./AnalyticsConsentDialog-DK--Fyyn.js";import{a as s,d as c,f as l,l as u,m as d,p as f,s as p,u as m}from"./CardLabel-BhZER6fd.js";import{i as h,r as g,t as _}from"./SortOrderName-BuMtj5pl.js";import{i as v,n as y,t as b}from"./stories.common-DS7hcHEz.js";import{o as x,s as ee,t as S,u as C}from"./expectedCribPoints-DNklQyfF.js";import{n as w,t as te}from"./EnterCardsDialog--GEnFrsJ.js";import{n as T,t as ne}from"./InteractiveHand-iNpr1SsZ.js";import{i as E,n as re,r as D,t as ie}from"./ScoredPossibleKeepDiscards-DWrvL1A_.js";var ae,oe=e((()=>{ae=`_dynamic-ui_1k57z_1`})),O,k,A,se,ce,le,ue,de,fe,pe,me,he,ge,_e,ve,ye,be,xe=e((()=>{C(),c(),x(),E(),h(),O=`hand`,k=`role`,A=`discard`,se=`sort`,ce=`analysis-sort`,le=e=>{try{return f(e)}catch{return null}},ue=e=>{let t=e?le(e):null;return t&&t.length===6?t:null},de=e=>{switch(e?.toLowerCase()){case`dealer`:return S.Dealer;case`pone`:return S.Pone;default:return null}},fe=(e,t)=>{if(!e||!t)return null;let n=le(e);return n!==null&&n.length<=2&&n.every(e=>t.some(t=>l(t,e)))?n:null},pe=e=>{switch(e?.toLowerCase()){case`deal-order`:return g.DealOrder;case`descending`:return g.Descending;case`ascending`:return g.Ascending;default:return null}},me=e=>{switch(e){case g.DealOrder:return`deal-order`;case g.Ascending:return`ascending`;default:return`descending`}},he=e=>{switch(e?.toLowerCase()){case`hand`:return D.ExpectedHandPoints;case`crib`:return D.ExpectedCribPoints;case`play`:return D.ExpectedPlayPoints;case`net`:return D.ExpectedNetPoints;default:return null}},ge=e=>{switch(e){case D.ExpectedHandPoints:return`hand`;case D.ExpectedCribPoints:return`crib`;case D.ExpectedPlayPoints:return`play`;default:return`net`}},_e=e=>{let t=new URLSearchParams(e),n=ue(t.get(O));return{cards:n,cribRole:de(t.get(k)),discards:fe(t.get(A),n),scoreSortKey:he(t.get(ce)),sortOrder:pe(t.get(se))}},ve=[O,A],ye=e=>e.split(`&`).map(e=>ve.some(t=>e.startsWith(`${t}=`))?e.replace(/%2C/gu,`,`):e).join(`&`),be=(e,{cribRole:t,dealtCards:n,scoreSortKey:r,sortOrder:i})=>{let a=new URLSearchParams(e),o=[...n].sort((e,t)=>e.dealOrder-t.dealOrder);a.set(O,d(o)),a.set(k,t.toLowerCase());let s=o.filter(e=>!e.kept);return s.length>0?a.set(A,d(s)):a.delete(A),a.set(se,me(i)),a.set(ce,ge(r)),`?${ye(a.toString())}`}})),Se,Ce=e((()=>{c(),C(),Se=e=>{let t=[...s],n=[];for(let r=0;r<6;r+=1){let i=Math.floor(e()*t.length),[a]=t.splice(i,1);n.push({...a,dealOrder:r,kept:!0})}return n}})),we,Te=e((()=>{C(),we=e=>e.filter(e=>e.kept).length===4})),Ee,De=e((()=>{Te(),Ee=e=>e.every(e=>e.kept)||we(e)})),j,Oe=e((()=>{c(),j=(e,t)=>e.map((e,n)=>({...e,dealOrder:n,kept:!(t??[]).some(t=>l(e,t))}))}));function M({generateRandomNumber:e,loadGoogleAnalytics:t,initialCards:n=null,initialCribRole:r=null,initialDiscards:i=null,initialScoreSortKey:a=null,initialSortOrder:s=null}){let c=(0,N.useCallback)(()=>Se(e),[e]),l=(0,N.useCallback)(t=>({cribRole:ee(e),dealtCards:t}),[e]),[u,f]=(0,N.useState)(()=>{let t=n?j(n,i):c();return{cribRole:r??ee(e),dealtCards:t}}),{cribRole:p,dealtCards:m}=u,[h,_]=(0,N.useState)(s??g.Descending),[v,y]=(0,N.useState)(a??D.ExpectedNetPoints),b=(0,N.useMemo)(()=>ke(),[]),[x,S]=(0,N.useState)(b),C=(0,N.useRef)(!1);(0,N.useEffect)(()=>{let e=be(window.location.search,{cribRole:p,dealtCards:m,scoreSortKey:v,sortOrder:h});C.current?window.history.pushState({previousUrl:window.location.search},``,e):e===Ae()?window.history.back():window.history.replaceState(window.history.state,``,e),C.current=!1},[p,m,v,h]),(0,N.useEffect)(()=>{let e=()=>{C.current=!1;let e=_e(window.location.search);if(e.cards){let{cards:t,discards:n}=e;f(r=>({cribRole:e.cribRole??r.cribRole,dealtCards:j(t,n)}))}e.sortOrder!==null&&_(e.sortOrder),e.scoreSortKey!==null&&y(e.scoreSortKey)};return window.addEventListener(`popstate`,e),()=>{window.removeEventListener(`popstate`,e)}},[]);let w=(0,N.useCallback)(()=>{C.current=Ee(m)},[m]),T=Me(u,f,w),E=(0,N.useCallback)(e=>{w();let t=[...m],n=t[e];n.kept=!n.kept,f({cribRole:p,dealtCards:t})},[p,m,w]),re=(0,N.useCallback)(()=>{w(),f(l(c()))},[l,c,w]),oe=(0,N.useCallback)(e=>{w(),_(e)},[w]),O=(0,N.useCallback)(e=>{w(),y(e)},[w]),k=(0,N.useCallback)(e=>{S(e),localStorage.setItem(F,JSON.stringify(e))},[]);return(0,N.useEffect)(()=>{t(x)},[x,t]),(0,P.jsxs)(`div`,{className:ae,children:[(0,P.jsx)(ne,{cribRole:p,dealtCards:m,onCardChange:E,onDeal:re,onEnterCards:T.handleOpen,onSortOrderChange:oe,sortOrder:h}),(0,P.jsx)(te,{initialCards:m,initialCribRole:p,onClose:T.handleClose,onSubmit:T.handleSubmit,show:T.show,sortOrder:h},`${T.show}-${p}-${d(m)}`),we(m)&&(0,P.jsx)(ie,{cribRole:p,dealtCards:m,onScoreSortKeyChange:O,scoreSortKey:v,sortOrder:h}),(0,P.jsx)(o,{consent:x,onChange:k,wasInitiallyConsented:b!==null})]})}var N,P,F,ke,Ae,je,Me,Ne=e((()=>{oe(),c(),x(),xe(),N=n(r()),a(),w(),T(),E(),re(),h(),Ce(),Te(),De(),Oe(),P=i(),F=`analyticsConsent`,ke=()=>{let e=localStorage.getItem(F);return e===null?null:JSON.parse(e)},Ae=()=>window.history.state?.previousUrl,je=(e,t,n)=>t===n.cribRole&&n.dealtCards.every(e=>e.kept)&&d(e)===d(n.dealtCards),Me=(e,t,n)=>{let[r,i]=(0,N.useState)(!1),a=(0,N.useCallback)(()=>{i(!0)},[]);return{handleClose:(0,N.useCallback)(()=>{i(!1)},[]),handleOpen:a,handleSubmit:(0,N.useCallback)((r,a)=>{if(je(r,a,e)){i(!1);return}n(),t({cribRole:a,dealtCards:j(r,null)}),i(!1)},[e,n,t]),show:r}},M.defaultProps={initialCards:null,initialCribRole:null,initialDiscards:null,initialScoreSortKey:null,initialSortOrder:null},M.__docgenInfo={description:``,methods:[],displayName:`Trainer`,props:{generateRandomNumber:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => number`,signature:{arguments:[],return:{name:`number`}}},description:``},loadGoogleAnalytics:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(consented: boolean | null) => void`,signature:{arguments:[{type:{name:`union`,raw:`boolean | null`,elements:[{name:`boolean`},{name:`null`}]},name:`consented`}],return:{name:`void`}}},description:``},initialCards:{required:!1,tsType:{name:`union`,raw:`Card[] | null`,elements:[{name:`Array`,elements:[{name:`Card`}],raw:`Card[]`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialCribRole:{required:!1,tsType:{name:`union`,raw:`CribRole | null`,elements:[{name:`CribRole`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialDiscards:{required:!1,tsType:{name:`union`,raw:`Card[] | null`,elements:[{name:`Array`,elements:[{name:`Card`}],raw:`Card[]`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialScoreSortKey:{required:!1,tsType:{name:`union`,raw:`ScoredKeepDiscardSortKey | null`,elements:[{name:`ScoredKeepDiscardSortKey`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialSortOrder:{required:!1,tsType:{name:`union`,raw:`SortOrder | null`,elements:[{name:`SortOrder`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}}}}})),Pe=t(((e,t)=>{(function(e,t,n){function r(e){var t=this,n=o();t.next=function(){var e=2091639*t.s0+t.c*23283064365386963e-26;return t.s0=t.s1,t.s1=t.s2,t.s2=e-(t.c=e|0)},t.c=1,t.s0=n(` `),t.s1=n(` `),t.s2=n(` `),t.s0-=n(e),t.s0<0&&(t.s0+=1),t.s1-=n(e),t.s1<0&&(t.s1+=1),t.s2-=n(e),t.s2<0&&(t.s2+=1),n=null}function i(e,t){return t.c=e.c,t.s0=e.s0,t.s1=e.s1,t.s2=e.s2,t}function a(e,t){var n=new r(e),a=t&&t.state,o=n.next;return o.int32=function(){return n.next()*4294967296|0},o.double=function(){return o()+(o()*2097152|0)*11102230246251565e-32},o.quick=o,a&&(typeof a==`object`&&i(a,n),o.state=function(){return i(n,{})}),o}function o(){var e=4022871197;return function(t){t=String(t);for(var n=0;n<t.length;n++){e+=t.charCodeAt(n);var r=.02519603282416938*e;e=r>>>0,r-=e,r*=e,e=r>>>0,r-=e,e+=r*4294967296}return(e>>>0)*23283064365386963e-26}}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.alea=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),Fe=t(((e,t)=>{(function(e,t,n){function r(e){var t=this,n=``;t.x=0,t.y=0,t.z=0,t.w=0,t.next=function(){var e=t.x^t.x<<11;return t.x=t.y,t.y=t.z,t.z=t.w,t.w^=t.w>>>19^e^e>>>8},e===(e|0)?t.x=e:n+=e;for(var r=0;r<n.length+64;r++)t.x^=n.charCodeAt(r)|0,t.next()}function i(e,t){return t.x=e.x,t.y=e.y,t.z=e.z,t.w=e.w,t}function a(e,t){var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(typeof a==`object`&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.xor128=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),Ie=t(((e,t)=>{(function(e,t,n){function r(e){var t=this,n=``;t.next=function(){var e=t.x^t.x>>>2;return t.x=t.y,t.y=t.z,t.z=t.w,t.w=t.v,(t.d=t.d+362437|0)+(t.v=t.v^t.v<<4^(e^e<<1))|0},t.x=0,t.y=0,t.z=0,t.w=0,t.v=0,e===(e|0)?t.x=e:n+=e;for(var r=0;r<n.length+64;r++)t.x^=n.charCodeAt(r)|0,r==n.length&&(t.d=t.x<<10^t.x>>>4),t.next()}function i(e,t){return t.x=e.x,t.y=e.y,t.z=e.z,t.w=e.w,t.v=e.v,t.d=e.d,t}function a(e,t){var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(typeof a==`object`&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.xorwow=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),Le=t(((e,t)=>{(function(e,t,n){function r(e){var t=this;t.next=function(){var e=t.x,n=t.i,r=e[n],i;return r^=r>>>7,i=r^r<<24,r=e[n+1&7],i^=r^r>>>10,r=e[n+3&7],i^=r^r>>>3,r=e[n+4&7],i^=r^r<<7,r=e[n+7&7],r^=r<<13,i^=r^r<<9,e[n]=i,t.i=n+1&7,i};function n(e,t){var n,r=[];if(t===(t|0))r[0]=t;else for(t=``+t,n=0;n<t.length;++n)r[n&7]=r[n&7]<<15^t.charCodeAt(n)+r[n+1&7]<<13;for(;r.length<8;)r.push(0);for(n=0;n<8&&r[n]===0;++n);for(n==8?r[7]=-1:r[n],e.x=r,e.i=0,n=256;n>0;--n)e.next()}n(t,e)}function i(e,t){return t.x=e.x.slice(),t.i=e.i,t}function a(e,t){e??=+new Date;var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(a.x&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.xorshift7=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),Re=t(((e,t)=>{(function(e,t,n){function r(e){var t=this;t.next=function(){var e=t.w,n=t.X,r=t.i,i,a;return t.w=e=e+1640531527|0,a=n[r+34&127],i=n[r=r+1&127],a^=a<<13,i^=i<<17,a^=a>>>15,i^=i>>>12,a=n[r]=a^i,t.i=r,a+(e^e>>>16)|0};function n(e,t){var n,r,i,a,o,s=[],c=128;for(t===(t|0)?(r=t,t=null):(t+=`\0`,r=0,c=Math.max(c,t.length)),i=0,a=-32;a<c;++a)t&&(r^=t.charCodeAt((a+32)%t.length)),a===0&&(o=r),r^=r<<10,r^=r>>>15,r^=r<<4,r^=r>>>13,a>=0&&(o=o+1640531527|0,n=s[a&127]^=r+o,i=n==0?i+1:0);for(i>=128&&(s[(t&&t.length||0)&127]=-1),i=127,a=512;a>0;--a)r=s[i+34&127],n=s[i=i+1&127],r^=r<<13,n^=n<<17,r^=r>>>15,n^=n>>>12,s[i]=r^n;e.w=o,e.X=s,e.i=i}n(t,e)}function i(e,t){return t.i=e.i,t.w=e.w,t.X=e.X.slice(),t}function a(e,t){e??=+new Date;var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(a.X&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.xor4096=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),ze=t(((e,t)=>{(function(e,t,n){function r(e){var t=this,n=``;t.next=function(){var e=t.b,n=t.c,r=t.d,i=t.a;return e=e<<25^e>>>7^n,n=n-r|0,r=r<<24^r>>>8^i,i=i-e|0,t.b=e=e<<20^e>>>12^n,t.c=n=n-r|0,t.d=r<<16^n>>>16^i,t.a=i-e|0},t.a=0,t.b=0,t.c=-1640531527,t.d=1367130551,e===Math.floor(e)?(t.a=e/4294967296|0,t.b=e|0):n+=e;for(var r=0;r<n.length+20;r++)t.b^=n.charCodeAt(r)|0,t.next()}function i(e,t){return t.a=e.a,t.b=e.b,t.c=e.c,t.d=e.d,t}function a(e,t){var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(typeof a==`object`&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.tychei=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),Be=t(((e,t)=>{t.exports={}})),Ve=t(((e,t)=>{(function(e,n,r){var i=256,a=6,o=52,s=`random`,c=r.pow(i,a),l=r.pow(2,o),u=l*2,d=i-1,f;function p(e,t,o){var d=[];t=t==1?{entropy:!0}:t||{};var f=_(g(t.entropy?[e,y(n)]:e??v(),3),d),p=new m(d),b=function(){for(var e=p.g(a),t=c,n=0;e<l;)e=(e+n)*i,t*=i,n=p.g(1);for(;e>=u;)e/=2,t/=2,n>>>=1;return(e+n)/t};return b.int32=function(){return p.g(4)|0},b.quick=function(){return p.g(4)/4294967296},b.double=b,_(y(p.S),n),(t.pass||o||function(e,t,n,i){return i&&(i.S&&h(i,p),e.state=function(){return h(p,{})}),n?(r[s]=e,t):e})(b,f,`global`in t?t.global:this==r,t.state)}function m(e){var t,n=e.length,r=this,a=0,o=r.i=r.j=0,s=r.S=[];for(n||(e=[n++]);a<i;)s[a]=a++;for(a=0;a<i;a++)s[a]=s[o=d&o+e[a%n]+(t=s[a])],s[o]=t;(r.g=function(e){for(var t,n=0,a=r.i,o=r.j,s=r.S;e--;)t=s[a=d&a+1],n=n*i+s[d&(s[a]=s[o=d&o+t])+(s[o]=t)];return r.i=a,r.j=o,n})(i)}function h(e,t){return t.i=e.i,t.j=e.j,t.S=e.S.slice(),t}function g(e,t){var n=[],r=typeof e,i;if(t&&r==`object`)for(i in e)try{n.push(g(e[i],t-1))}catch{}return n.length?n:r==`string`?e:e+`\0`}function _(e,t){for(var n=e+``,r,i=0;i<n.length;)t[d&i]=d&(r^=t[d&i]*19)+n.charCodeAt(i++);return y(t)}function v(){try{var t;return f&&(t=f.randomBytes)?t=t(i):(t=new Uint8Array(i),(e.crypto||e.msCrypto).getRandomValues(t)),y(t)}catch{var r=e.navigator,a=r&&r.plugins;return[+new Date,e,a,e.screen,y(n)]}}function y(e){return String.fromCharCode.apply(0,e)}if(_(r.random(),n),typeof t==`object`&&t.exports){t.exports=p;try{f=Be()}catch{}}else typeof define==`function`&&define.amd?define(function(){return p}):r[`seed`+s]=p})(typeof self<`u`?self:e,[],Math)})),He=t(((e,t)=>{var n=Pe(),r=Fe(),i=Ie(),a=Le(),o=Re(),s=ze(),c=Ve();c.alea=n,c.xor128=r,c.xorwow=i,c.xorshift7=a,c.xor4096=o,c.tychei=s,t.exports=c})),Ue,We,Ge=e((()=>{Ue=n(He()),We=e=>e?(0,Ue.default)(e):Math.random})),Ke,I,L,qe,R,Je,z,Ye,B,V,H,U,Xe,W,Ze,G,K,Qe,q,J,$e,et,Y,X,Z,tt,Q,$,nt;e((()=>{y(),c(),Ne(),x(),E(),Ge(),Ke=i(),{expect:I,fireEvent:L,waitFor:qe,within:R}=__STORYBOOK_MODULE_TEST__,Je={argTypes:b(`sortOrder`,_),args:{generateRandomNumber:We(`1`),loadGoogleAnalytics:()=>null},beforeEach:()=>()=>{localStorage.removeItem(F)},component:M,parameters:{layout:`fullscreen`},tags:[`autodocs`],title:`Trainer`},z=(e,t)=>R(e).getByRole(`button`,{name:t}),Ye=async(e,t)=>{await qe(async()=>{await I(R(e).queryByText(`Loading analysis...`)).toBeNull()},{timeout:5e3}),await Promise.all(t.map(async t=>await I(R(e).getByRole(`columnheader`,{name:t})).toBeVisible()))},B={play:async({canvasElement:e})=>{let t=z(e,`Accept`);await L.click(t),await I(e).toHaveTextContent(`Thank you! Your consent helps us improve our site using tools like Google Analytics. For more details, please see our Privacy Policy.`)}},V={play:async({canvasElement:e})=>{let t=z(e,`Decline`);await L.click(t),await I(e).toHaveTextContent(`Analytics have been disabled. You can find more information in our Privacy Policy.`)}},H={play:async({canvasElement:e})=>{await qe(async()=>{await I(R(e).getByText(`Privacy Policy`)).toBeVisible()},{timeout:1e3}),await I(R(e).queryByText(`Thank you!`)).not.toBeInTheDocument()},render:({generateRandomNumber:e,loadGoogleAnalytics:t})=>(localStorage.setItem(F,`true`),(0,Ke.jsx)(M,{generateRandomNumber:e,loadGoogleAnalytics:t}))},U={play:async({canvasElement:e})=>{let t=z(e,`Deal`),n=e.textContent;await L.click(t),await I(e.textContent).not.toEqual(n)}},Xe=e=>Ye(e,[`Hand`,`Crib`,`Play`,`Net`]),W={play:async({canvasElement:e})=>{let t=R(e).getAllByRole(`checkbox`);await L.click(t[0]),await L.click(t[1]),await Xe(e)}},Ze=(e=!1)=>async t=>{await W.play(t),await v(t,{toggleStarterDetails:e})},G={...W,play:Ze()},K={...W,play:Ze(!0)},Qe=e=>async({canvasElement:t})=>{let n=R(t).getAllByRole(`radio`).find(t=>t.getAttribute(`value`)===Object.keys(g).find(t=>g[t]===e)),r=t.textContent;await L.click(n),await I(t.textContent).not.toEqual(r)},q={play:Qe(g.DealOrder)},J={play:Qe(g.Ascending)},$e=m(p.SIX,u.SPADES),et=m(p.FIVE,u.HEARTS),Y={args:{initialCards:[m(p.KING,u.HEARTS),m(p.QUEEN,u.SPADES),m(p.TEN,u.DIAMONDS),m(p.NINE,u.CLUBS),$e,et],initialCribRole:S.Pone,initialDiscards:[$e,et],initialScoreSortKey:D.ExpectedHandPoints,initialSortOrder:g.DealOrder},play:async({canvasElement:e})=>{await I(R(e).getByText(`Pone`)).toBeVisible(),await Xe(e),await I(R(e).getByRole(`columnheader`,{name:/Hand/u})).toHaveAttribute(`aria-sort`,`descending`)}},X={play:async e=>{await W.play(e);let t=R(e.canvasElement).getByRole(`button`,{name:/^Play:/u});await L.click(t),await I(R(e.canvasElement).getByRole(`columnheader`,{name:/Play/u})).toHaveAttribute(`aria-sort`,`descending`)}},Z={args:{initialCards:[m(p.ACE,u.SPADES),m(p.TWO,u.HEARTS),m(p.THREE,u.DIAMONDS),m(p.FOUR,u.CLUBS),m(p.FIVE,u.SPADES),m(p.SIX,u.HEARTS)]},play:async({canvasElement:e})=>{await I(R(e).getAllByRole(`checkbox`).map(e=>e.closest(`label`)?.textContent)).toEqual([`6♥`,`5♠`,`4♣`,`3♦`,`2♥`,`A♠`])}},tt=e=>async({canvasElement:t})=>{let n=R(t);await L.click(z(t,`Enter cards`)),e&&(await L.click(n.getByRole(`button`,{name:e[0],pressed:!0})),await L.click(n.getByRole(`button`,{name:e[1]}))),await L.click(z(t,`Use hand`)),await I(n.queryByRole(`heading`,{name:`Enter cards`})).not.toBeInTheDocument()},Q={args:Z.args,play:tt()},$={args:Z.args,play:tt([`A♠`,`A♣`])},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const acceptButton = getButton(canvasElement, "Accept");
    await fireEvent.click(acceptButton);
    await expect(canvasElement).toHaveTextContent("Thank you! Your consent helps us improve our site using tools like Google Analytics. For more details, please see our Privacy Policy.");
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const declineButton = getButton(canvasElement, "Decline");
    await fireEvent.click(declineButton);
    await expect(canvasElement).toHaveTextContent("Analytics have been disabled. You can find more information in our Privacy Policy.");
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    // When consent is already stored, only the Privacy Policy link is shown (no Thank You message)
    // Wait for fade-in animation to complete before checking visibility
    await waitFor(async () => {
      await expect(within(canvasElement).getByText("Privacy Policy")).toBeVisible();
    }, {
      timeout: 1000
    });
    await expect(within(canvasElement).queryByText("Thank you!")).not.toBeInTheDocument();
  },
  render: ({
    generateRandomNumber,
    loadGoogleAnalytics
  }: Parameters<typeof Trainer>[0]) => {
    localStorage.setItem(analyticsConsentKey, "true");
    return <Trainer generateRandomNumber={generateRandomNumber} loadGoogleAnalytics={loadGoogleAnalytics} />;
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const dealButton = getButton(canvasElement, "Deal");
    const initialHandText = canvasElement.textContent;
    await fireEvent.click(dealButton);
    await expect(canvasElement.textContent).not.toEqual(initialHandText);
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const checkboxes = within(canvasElement).getAllByRole("checkbox");
    await fireEvent.click(checkboxes[0]!);
    await fireEvent.click(checkboxes[1]!);
    await expectAnalysisColumnHeaders(canvasElement);
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle()
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle(true)
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  play: createPlay(SortOrder.DealOrder)
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  play: createPlay(SortOrder.Ascending)
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    initialCards: [createCard(Rank.KING, Suit.HEARTS), createCard(Rank.QUEEN, Suit.SPADES), createCard(Rank.TEN, Suit.DIAMONDS), createCard(Rank.NINE, Suit.CLUBS), SIX_OF_SPADES, FIVE_OF_HEARTS],
    initialCribRole: CribRole.Pone,
    initialDiscards: [SIX_OF_SPADES, FIVE_OF_HEARTS],
    initialScoreSortKey: ScoredKeepDiscardSortKey.ExpectedHandPoints,
    initialSortOrder: SortOrder.DealOrder
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    await expect(within(canvasElement).getByText("Pone")).toBeVisible();
    await expectAnalysisColumnHeaders(canvasElement);
    const handHeader = within(canvasElement).getByRole("columnheader", {
      name: /Hand/u
    });
    await expect(handHeader).toHaveAttribute("aria-sort", "descending");
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  play: async (context: {
    canvasElement: HTMLElement;
  }) => {
    await DiscardShowsScoredPossibilities.play(context);
    const playHeaderButton = within(context.canvasElement).getByRole("button", {
      name: /^Play:/u
    });
    await fireEvent.click(playHeaderButton);
    const playHeader = within(context.canvasElement).getByRole("columnheader", {
      name: /Play/u
    });
    await expect(playHeader).toHaveAttribute("aria-sort", "descending");
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  args: {
    initialCards: [createCard(Rank.ACE, Suit.SPADES), createCard(Rank.TWO, Suit.HEARTS), createCard(Rank.THREE, Suit.DIAMONDS), createCard(Rank.FOUR, Suit.CLUBS), createCard(Rank.FIVE, Suit.SPADES), createCard(Rank.SIX, Suit.HEARTS)]
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const handCardLabels = within(canvasElement).getAllByRole("checkbox").map(checkbox => checkbox.closest("label")?.textContent);
    await expect(handCardLabels).toEqual(["6♥", "5♠", "4♣", "3♦", "2♥", "A♠"]);
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  args: WithInitialCards.args,
  play: createManualEntryPlay()
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  args: WithInitialCards.args,
  play: createManualEntryPlay(["A♠", "A♣"])
}`,...$.parameters?.docs?.source}}},nt=[`AnalyticsAccepted`,`AnalyticsDisabled`,`StoredConsentGiven`,`DealNewHandReplacesCards`,`DiscardShowsScoredPossibilities`,`Expanded`,`DoubleExpanded`,`SortHandInDealOrder`,`SortHandInAscendingOrder`,`DeepLinkedAnalysisState`,`SortAnalysisByPlayPoints`,`WithInitialCards`,`UnchangedManualEntryCloses`,`ChangedManualEntryApplies`]}))();export{B as AnalyticsAccepted,V as AnalyticsDisabled,$ as ChangedManualEntryApplies,U as DealNewHandReplacesCards,Y as DeepLinkedAnalysisState,W as DiscardShowsScoredPossibilities,K as DoubleExpanded,G as Expanded,X as SortAnalysisByPlayPoints,J as SortHandInAscendingOrder,q as SortHandInDealOrder,H as StoredConsentGiven,Q as UnchangedManualEntryCloses,Z as WithInitialCards,nt as __namedExportsOrder,Je as default};