import{i as e,r as t,s as n}from"./preload-helper-BdFrVu1K.js";import{t as r}from"./react-uS7UyY4Q.js";import{t as i}from"./jsx-runtime-f3rHp9ZU.js";import{n as a,t as o}from"./AnalyticsConsentDialog-2ooxeWME.js";import{a as s,d as c,f as l,l as u,m as d,p as f,s as p,u as m}from"./CardLabel-DOrztDns.js";import{a as h,i as g,n as _,r as v,t as y}from"./SortOrderName-MXRr2nWr.js";import{i as b,n as x,t as ee}from"./stories.common-DDKxRJET.js";import{o as S,s as te,t as C,u as w}from"./expectedCribPoints-BOulACVp.js";import{n as ne,t as re}from"./EnterCardsDialog-CGaK2nKC.js";import{n as ie,t as ae}from"./InteractiveHand-Bg6C19wg.js";import{i as T,n as oe,r as E,t as se}from"./ScoredPossibleKeepDiscards-BqFm1Enw.js";var ce,le,ue,de,fe,pe=e((()=>{ce=`_app_dolmr_3`,le=`_app-header_dolmr_13`,ue=`_app-title_dolmr_20`,de=`_tagline_dolmr_26`,fe=`_dynamic-ui_dolmr_31`})),D,me,O,he,ge,_e,ve,ye,be,xe,Se,Ce,we,Te,Ee,De,Oe,ke=e((()=>{w(),c(),S(),T(),h(),D=`hand`,me=`role`,O=`discard`,he=`sort`,ge=`analysis-sort`,_e=e=>{try{return f(e)}catch{return null}},ve=e=>{let t=e?_e(e):null;return t&&t.length===6?t:null},ye=e=>{switch(e?.toLowerCase()){case`dealer`:return C.Dealer;case`pone`:return C.Pone;default:return null}},be=(e,t)=>{if(!e||!t)return null;let n=_e(e);return n!==null&&n.length<=2&&n.every(e=>t.some(t=>l(t,e)))?n:null},xe=e=>{switch(e?.toLowerCase()){case`deal-order`:return g.DealOrder;case`descending`:return g.Descending;case`ascending`:return g.Ascending;default:return null}},Se=e=>{switch(e){case g.DealOrder:return`deal-order`;case g.Ascending:return`ascending`;default:return`descending`}},Ce=e=>{switch(e?.toLowerCase()){case`hand`:return E.ExpectedHandPoints;case`crib`:return E.ExpectedCribPoints;case`play`:return E.ExpectedPlayPoints;case`net`:return E.ExpectedNetPoints;default:return null}},we=e=>{switch(e){case E.ExpectedHandPoints:return`hand`;case E.ExpectedCribPoints:return`crib`;case E.ExpectedPlayPoints:return`play`;default:return`net`}},Te=e=>{let t=new URLSearchParams(e),n=ve(t.get(D));return{cards:n,cribRole:ye(t.get(me)),discards:be(t.get(O),n),scoreSortKey:Ce(t.get(ge)),sortOrder:xe(t.get(he))}},Ee=[D,O],De=e=>e.split(`&`).map(e=>Ee.some(t=>e.startsWith(`${t}=`))?e.replace(/%2C/gu,`,`):e).join(`&`),Oe=(e,{cribRole:t,dealtCards:n,scoreSortKey:r,sortOrder:i})=>{let a=new URLSearchParams(e),o=[...n].sort((e,t)=>e.dealOrder-t.dealOrder);a.set(D,d(o)),a.set(me,t.toLowerCase());let s=o.filter(e=>!e.kept);return s.length>0?a.set(O,d(s)):a.delete(O),a.set(he,Se(i)),a.set(ge,we(r)),`?${De(a.toString())}`}})),Ae,je=e((()=>{c(),w(),Ae=e=>{let t=[...s],n=[];for(let r=0;r<6;r+=1){let i=Math.floor(e()*t.length),[a]=t.splice(i,1);n.push({...a,dealOrder:r,kept:!0})}return n}})),Me,Ne=e((()=>{w(),Me=e=>e.filter(e=>e.kept).length===4})),Pe,Fe=e((()=>{Ne(),Pe=e=>e.every(e=>e.kept)||Me(e)})),k,Ie=e((()=>{c(),k=(e,t)=>e.map((e,n)=>({...e,dealOrder:n,kept:!(t??[]).some(t=>l(e,t))}))}));function A({generateRandomNumber:e,loadGoogleAnalytics:t,initialCards:n=null,initialCribRole:r=null,initialDiscards:i=null,initialScoreSortKey:a=null,initialSortOrder:s=null}){let c=(0,j.useCallback)(()=>Ae(e),[e]),l=(0,j.useCallback)(t=>({cribRole:te(e),dealtCards:t}),[e]),[u,f]=(0,j.useState)(()=>{let t=n?k(n,i):c();return{cribRole:r??te(e),dealtCards:t}}),{cribRole:p,dealtCards:m}=u,[h,_]=(0,j.useState)(s??g.Descending),[v,y]=(0,j.useState)(a??E.ExpectedNetPoints),b=(0,j.useMemo)(()=>Le(),[]),[x,ee]=(0,j.useState)(b),S=(0,j.useRef)(!1);(0,j.useEffect)(()=>{let e=Oe(window.location.search,{cribRole:p,dealtCards:m,scoreSortKey:v,sortOrder:h});S.current?window.history.pushState({previousUrl:window.location.search},``,e):e===Re()?window.history.back():window.history.replaceState(window.history.state,``,e),S.current=!1},[p,m,v,h]),(0,j.useEffect)(()=>{let e=()=>{S.current=!1;let e=Te(window.location.search);if(e.cards){let{cards:t,discards:n}=e;f(r=>({cribRole:e.cribRole??r.cribRole,dealtCards:k(t,n)}))}e.sortOrder!==null&&_(e.sortOrder),e.scoreSortKey!==null&&y(e.scoreSortKey)};return window.addEventListener(`popstate`,e),()=>{window.removeEventListener(`popstate`,e)}},[]);let C=(0,j.useCallback)(()=>{S.current=Pe(m)},[m]),w=Be(u,f,C),ne=(0,j.useCallback)(e=>{C();let t=[...m],n=t[e];n.kept=!n.kept,f({cribRole:p,dealtCards:t})},[p,m,C]),ie=(0,j.useCallback)(()=>{C(),f(l(c()))},[l,c,C]),T=(0,j.useCallback)(e=>{C(),_(e)},[C]),oe=(0,j.useCallback)(e=>{C(),y(e)},[C]),pe=(0,j.useCallback)(e=>{ee(e),localStorage.setItem(N,JSON.stringify(e))},[]);return(0,j.useEffect)(()=>{t(x)},[x,t]),(0,M.jsxs)(`div`,{className:ce,children:[(0,M.jsxs)(`header`,{className:le,children:[(0,M.jsx)(`h1`,{className:ue,children:`Cribbage Trainer`}),(0,M.jsx)(`p`,{className:de,children:`Sharpen your cribbage discards with expected-score analysis.`})]}),(0,M.jsxs)(`div`,{className:fe,children:[(0,M.jsx)(ae,{cribRole:p,dealtCards:m,onCardChange:ne,onDeal:ie,onEnterCards:w.handleOpen,onSortOrderChange:T,sortOrder:h}),(0,M.jsx)(re,{initialCards:m,initialCribRole:p,onClose:w.handleClose,onSubmit:w.handleSubmit,show:w.show,sortOrder:h},`${w.show}-${p}-${d(m)}`),Me(m)&&(0,M.jsx)(se,{cribRole:p,dealtCards:m,onScoreSortKeyChange:oe,scoreSortKey:v,sortOrder:h}),(0,M.jsx)(o,{consent:x,onChange:pe,wasInitiallyConsented:b!==null})]})]})}var j,M,N,Le,Re,ze,Be,Ve=e((()=>{pe(),c(),S(),ke(),j=n(r()),a(),ne(),ie(),T(),oe(),h(),je(),Ne(),Fe(),Ie(),M=i(),N=`analyticsConsent`,Le=()=>{let e=localStorage.getItem(N);return e===null?null:JSON.parse(e)},Re=()=>window.history.state?.previousUrl,ze=(e,t,n)=>t===n.cribRole&&n.dealtCards.every(e=>e.kept)&&d(e)===d(n.dealtCards),Be=(e,t,n)=>{let[r,i]=(0,j.useState)(!1),a=(0,j.useCallback)(()=>{i(!0)},[]);return{handleClose:(0,j.useCallback)(()=>{i(!1)},[]),handleOpen:a,handleSubmit:(0,j.useCallback)((r,a)=>{if(ze(r,a,e)){i(!1);return}n(),t({cribRole:a,dealtCards:k(r,null)}),i(!1)},[e,n,t]),show:r}},A.defaultProps={initialCards:null,initialCribRole:null,initialDiscards:null,initialScoreSortKey:null,initialSortOrder:null},A.__docgenInfo={description:``,methods:[],displayName:`Trainer`,props:{generateRandomNumber:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => number`,signature:{arguments:[],return:{name:`number`}}},description:``},loadGoogleAnalytics:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(consented: boolean | null) => void`,signature:{arguments:[{type:{name:`union`,raw:`boolean | null`,elements:[{name:`boolean`},{name:`null`}]},name:`consented`}],return:{name:`void`}}},description:``},initialCards:{required:!1,tsType:{name:`union`,raw:`Card[] | null`,elements:[{name:`Array`,elements:[{name:`Card`}],raw:`Card[]`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialCribRole:{required:!1,tsType:{name:`union`,raw:`CribRole | null`,elements:[{name:`CribRole`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialDiscards:{required:!1,tsType:{name:`union`,raw:`Card[] | null`,elements:[{name:`Array`,elements:[{name:`Card`}],raw:`Card[]`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialScoreSortKey:{required:!1,tsType:{name:`union`,raw:`ScoredKeepDiscardSortKey | null`,elements:[{name:`ScoredKeepDiscardSortKey`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialSortOrder:{required:!1,tsType:{name:`union`,raw:`SortOrder | null`,elements:[{name:`SortOrder`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}}}}})),He=t(((e,t)=>{(function(e,t,n){function r(e){var t=this,n=o();t.next=function(){var e=2091639*t.s0+t.c*23283064365386963e-26;return t.s0=t.s1,t.s1=t.s2,t.s2=e-(t.c=e|0)},t.c=1,t.s0=n(` `),t.s1=n(` `),t.s2=n(` `),t.s0-=n(e),t.s0<0&&(t.s0+=1),t.s1-=n(e),t.s1<0&&(t.s1+=1),t.s2-=n(e),t.s2<0&&(t.s2+=1),n=null}function i(e,t){return t.c=e.c,t.s0=e.s0,t.s1=e.s1,t.s2=e.s2,t}function a(e,t){var n=new r(e),a=t&&t.state,o=n.next;return o.int32=function(){return n.next()*4294967296|0},o.double=function(){return o()+(o()*2097152|0)*11102230246251565e-32},o.quick=o,a&&(typeof a==`object`&&i(a,n),o.state=function(){return i(n,{})}),o}function o(){var e=4022871197;return function(t){t=String(t);for(var n=0;n<t.length;n++){e+=t.charCodeAt(n);var r=.02519603282416938*e;e=r>>>0,r-=e,r*=e,e=r>>>0,r-=e,e+=r*4294967296}return(e>>>0)*23283064365386963e-26}}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.alea=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),Ue=t(((e,t)=>{(function(e,t,n){function r(e){var t=this,n=``;t.x=0,t.y=0,t.z=0,t.w=0,t.next=function(){var e=t.x^t.x<<11;return t.x=t.y,t.y=t.z,t.z=t.w,t.w^=t.w>>>19^e^e>>>8},e===(e|0)?t.x=e:n+=e;for(var r=0;r<n.length+64;r++)t.x^=n.charCodeAt(r)|0,t.next()}function i(e,t){return t.x=e.x,t.y=e.y,t.z=e.z,t.w=e.w,t}function a(e,t){var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(typeof a==`object`&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.xor128=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),We=t(((e,t)=>{(function(e,t,n){function r(e){var t=this,n=``;t.next=function(){var e=t.x^t.x>>>2;return t.x=t.y,t.y=t.z,t.z=t.w,t.w=t.v,(t.d=t.d+362437|0)+(t.v=t.v^t.v<<4^(e^e<<1))|0},t.x=0,t.y=0,t.z=0,t.w=0,t.v=0,e===(e|0)?t.x=e:n+=e;for(var r=0;r<n.length+64;r++)t.x^=n.charCodeAt(r)|0,r==n.length&&(t.d=t.x<<10^t.x>>>4),t.next()}function i(e,t){return t.x=e.x,t.y=e.y,t.z=e.z,t.w=e.w,t.v=e.v,t.d=e.d,t}function a(e,t){var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(typeof a==`object`&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.xorwow=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),Ge=t(((e,t)=>{(function(e,t,n){function r(e){var t=this;t.next=function(){var e=t.x,n=t.i,r=e[n],i;return r^=r>>>7,i=r^r<<24,r=e[n+1&7],i^=r^r>>>10,r=e[n+3&7],i^=r^r>>>3,r=e[n+4&7],i^=r^r<<7,r=e[n+7&7],r^=r<<13,i^=r^r<<9,e[n]=i,t.i=n+1&7,i};function n(e,t){var n,r=[];if(t===(t|0))r[0]=t;else for(t=``+t,n=0;n<t.length;++n)r[n&7]=r[n&7]<<15^t.charCodeAt(n)+r[n+1&7]<<13;for(;r.length<8;)r.push(0);for(n=0;n<8&&r[n]===0;++n);for(n==8?r[7]=-1:r[n],e.x=r,e.i=0,n=256;n>0;--n)e.next()}n(t,e)}function i(e,t){return t.x=e.x.slice(),t.i=e.i,t}function a(e,t){e??=+new Date;var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(a.x&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.xorshift7=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),Ke=t(((e,t)=>{(function(e,t,n){function r(e){var t=this;t.next=function(){var e=t.w,n=t.X,r=t.i,i,a;return t.w=e=e+1640531527|0,a=n[r+34&127],i=n[r=r+1&127],a^=a<<13,i^=i<<17,a^=a>>>15,i^=i>>>12,a=n[r]=a^i,t.i=r,a+(e^e>>>16)|0};function n(e,t){var n,r,i,a,o,s=[],c=128;for(t===(t|0)?(r=t,t=null):(t+=`\0`,r=0,c=Math.max(c,t.length)),i=0,a=-32;a<c;++a)t&&(r^=t.charCodeAt((a+32)%t.length)),a===0&&(o=r),r^=r<<10,r^=r>>>15,r^=r<<4,r^=r>>>13,a>=0&&(o=o+1640531527|0,n=s[a&127]^=r+o,i=n==0?i+1:0);for(i>=128&&(s[(t&&t.length||0)&127]=-1),i=127,a=512;a>0;--a)r=s[i+34&127],n=s[i=i+1&127],r^=r<<13,n^=n<<17,r^=r>>>15,n^=n>>>12,s[i]=r^n;e.w=o,e.X=s,e.i=i}n(t,e)}function i(e,t){return t.i=e.i,t.w=e.w,t.X=e.X.slice(),t}function a(e,t){e??=+new Date;var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(a.X&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.xor4096=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),qe=t(((e,t)=>{(function(e,t,n){function r(e){var t=this,n=``;t.next=function(){var e=t.b,n=t.c,r=t.d,i=t.a;return e=e<<25^e>>>7^n,n=n-r|0,r=r<<24^r>>>8^i,i=i-e|0,t.b=e=e<<20^e>>>12^n,t.c=n=n-r|0,t.d=r<<16^n>>>16^i,t.a=i-e|0},t.a=0,t.b=0,t.c=-1640531527,t.d=1367130551,e===Math.floor(e)?(t.a=e/4294967296|0,t.b=e|0):n+=e;for(var r=0;r<n.length+20;r++)t.b^=n.charCodeAt(r)|0,t.next()}function i(e,t){return t.a=e.a,t.b=e.b,t.c=e.c,t.d=e.d,t}function a(e,t){var n=new r(e),a=t&&t.state,o=function(){return(n.next()>>>0)/4294967296};return o.double=function(){do var e=((n.next()>>>11)+(n.next()>>>0)/4294967296)/(1<<21);while(e===0);return e},o.int32=n.next,o.quick=o,a&&(typeof a==`object`&&i(a,n),o.state=function(){return i(n,{})}),o}t&&t.exports?t.exports=a:n&&n.amd?n(function(){return a}):this.tychei=a})(e,typeof t==`object`&&t,typeof define==`function`&&define)})),Je=t(((e,t)=>{t.exports={}})),Ye=t(((e,t)=>{(function(e,n,r){var i=256,a=6,o=52,s=`random`,c=r.pow(i,a),l=r.pow(2,o),u=l*2,d=i-1,f;function p(e,t,o){var d=[];t=t==1?{entropy:!0}:t||{};var f=_(g(t.entropy?[e,y(n)]:e??v(),3),d),p=new m(d),b=function(){for(var e=p.g(a),t=c,n=0;e<l;)e=(e+n)*i,t*=i,n=p.g(1);for(;e>=u;)e/=2,t/=2,n>>>=1;return(e+n)/t};return b.int32=function(){return p.g(4)|0},b.quick=function(){return p.g(4)/4294967296},b.double=b,_(y(p.S),n),(t.pass||o||function(e,t,n,i){return i&&(i.S&&h(i,p),e.state=function(){return h(p,{})}),n?(r[s]=e,t):e})(b,f,`global`in t?t.global:this==r,t.state)}function m(e){var t,n=e.length,r=this,a=0,o=r.i=r.j=0,s=r.S=[];for(n||(e=[n++]);a<i;)s[a]=a++;for(a=0;a<i;a++)s[a]=s[o=d&o+e[a%n]+(t=s[a])],s[o]=t;(r.g=function(e){for(var t,n=0,a=r.i,o=r.j,s=r.S;e--;)t=s[a=d&a+1],n=n*i+s[d&(s[a]=s[o=d&o+t])+(s[o]=t)];return r.i=a,r.j=o,n})(i)}function h(e,t){return t.i=e.i,t.j=e.j,t.S=e.S.slice(),t}function g(e,t){var n=[],r=typeof e,i;if(t&&r==`object`)for(i in e)try{n.push(g(e[i],t-1))}catch{}return n.length?n:r==`string`?e:e+`\0`}function _(e,t){for(var n=e+``,r,i=0;i<n.length;)t[d&i]=d&(r^=t[d&i]*19)+n.charCodeAt(i++);return y(t)}function v(){try{var t;return f&&(t=f.randomBytes)?t=t(i):(t=new Uint8Array(i),(e.crypto||e.msCrypto).getRandomValues(t)),y(t)}catch{var r=e.navigator,a=r&&r.plugins;return[+new Date,e,a,e.screen,y(n)]}}function y(e){return String.fromCharCode.apply(0,e)}if(_(r.random(),n),typeof t==`object`&&t.exports){t.exports=p;try{f=Je()}catch{}}else typeof define==`function`&&define.amd?define(function(){return p}):r[`seed`+s]=p})(typeof self<`u`?self:e,[],Math)})),Xe=t(((e,t)=>{var n=He(),r=Ue(),i=We(),a=Ge(),o=Ke(),s=qe(),c=Ye();c.alea=n,c.xor128=r,c.xorwow=i,c.xorshift7=a,c.xor4096=o,c.tychei=s,t.exports=c})),Ze,Qe,$e=e((()=>{Ze=n(Xe()),Qe=e=>e?(0,Ze.default)(e):Math.random})),et,P,F,tt,I,nt,L,rt,R,z,B,V,it,H,at,U,W,G,K,q,ot,st,J,Y,X,Z,Q,$,ct;e((()=>{x(),c(),Ve(),S(),T(),$e(),v(),et=i(),{expect:P,fireEvent:F,waitFor:tt,within:I}=__STORYBOOK_MODULE_TEST__,nt={argTypes:ee(`sortOrder`,y),args:{generateRandomNumber:Qe(`1`),loadGoogleAnalytics:()=>null},beforeEach:()=>()=>{localStorage.removeItem(N)},component:A,parameters:{layout:`fullscreen`},tags:[`autodocs`],title:`Trainer`},L=(e,t)=>I(e).getByRole(`button`,{name:t}),rt=async(e,t)=>{await tt(async()=>{await P(I(e).queryByText(`Loading analysis...`)).toBeNull()},{timeout:5e3}),await Promise.all(t.map(async t=>await P(I(e).getByRole(`columnheader`,{name:t})).toBeVisible()))},R={play:async({canvasElement:e})=>{let t=L(e,`Accept`);await F.click(t),await P(e).toHaveTextContent(`Thank you! Your consent helps us improve our site using tools like Google Analytics. For more details, please see our Privacy Policy.`)}},z={play:async({canvasElement:e})=>{let t=L(e,`Decline`);await F.click(t),await P(e).toHaveTextContent(`Analytics have been disabled. You can find more information in our Privacy Policy.`)}},B={play:async({canvasElement:e})=>{await tt(async()=>{await P(I(e).getByText(`Privacy Policy`)).toBeVisible()},{timeout:1e3}),await P(I(e).queryByText(`Thank you!`)).not.toBeInTheDocument()},render:({generateRandomNumber:e,loadGoogleAnalytics:t})=>(localStorage.setItem(N,`true`),(0,et.jsx)(A,{generateRandomNumber:e,loadGoogleAnalytics:t}))},V={play:async({canvasElement:e})=>{let t=L(e,`Deal`),n=e.textContent;await F.click(t),await P(e.textContent).not.toEqual(n)}},it=e=>rt(e,[`Hand`,`Crib`,`Play`,`Net`]),H={play:async({canvasElement:e})=>{let t=I(e).getAllByRole(`checkbox`);await F.click(t[0]),await F.click(t[1]),await it(e)}},at=(e=!1)=>async t=>{await H.play(t),await b(t,{toggleStarterDetails:e})},U={...H,play:at()},W={...H,play:at(!0)},G=e=>async({canvasElement:t})=>{let n=I(t).getAllByRole(`radio`).find(t=>t.getAttribute(`value`)===_(e)),r=t.textContent;await F.click(n),await P(t.textContent).not.toEqual(r)},K={play:G(g.DealOrder)},q={play:G(g.Ascending)},ot=m(p.SIX,u.SPADES),st=m(p.FIVE,u.HEARTS),J={args:{initialCards:[m(p.KING,u.HEARTS),m(p.QUEEN,u.SPADES),m(p.TEN,u.DIAMONDS),m(p.NINE,u.CLUBS),ot,st],initialCribRole:C.Pone,initialDiscards:[ot,st],initialScoreSortKey:E.ExpectedHandPoints,initialSortOrder:g.DealOrder},play:async({canvasElement:e})=>{await P(I(e).getByText(`Pone`)).toBeVisible(),await it(e);let t=I(e).getByRole(`columnheader`,{name:/Hand/u});await P(t).toHaveAttribute(`aria-sort`,`descending`)}},Y={play:async e=>{await H.play(e);let t=I(e.canvasElement).getByRole(`button`,{name:/^Play:/u});await F.click(t);let n=I(e.canvasElement).getByRole(`columnheader`,{name:/Play/u});await P(n).toHaveAttribute(`aria-sort`,`descending`)}},X={args:{initialCards:[m(p.ACE,u.SPADES),m(p.TWO,u.HEARTS),m(p.THREE,u.DIAMONDS),m(p.FOUR,u.CLUBS),m(p.FIVE,u.SPADES),m(p.SIX,u.HEARTS)]},play:async({canvasElement:e})=>{let t=I(e).getAllByRole(`checkbox`).map(e=>e.closest(`label`)?.textContent);await P(t).toEqual([`6♥`,`5♠`,`4♣`,`3♦`,`2♥`,`A♠`])}},Z=e=>async({canvasElement:t})=>{let n=I(t);await F.click(L(t,`Enter cards`)),e&&(await F.click(n.getByRole(`button`,{name:e[0],pressed:!0})),await F.click(n.getByRole(`button`,{name:e[1]}))),await F.click(L(t,`Use hand`)),await P(n.queryByRole(`heading`,{name:`Enter cards`})).not.toBeInTheDocument()},Q={args:X.args,play:Z()},$={args:X.args,play:Z([`A♠`,`A♣`])},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const acceptButton = getButton(canvasElement, "Accept");
    await fireEvent.click(acceptButton);
    await expect(canvasElement).toHaveTextContent("Thank you! Your consent helps us improve our site using tools like Google Analytics. For more details, please see our Privacy Policy.");
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const declineButton = getButton(canvasElement, "Decline");
    await fireEvent.click(declineButton);
    await expect(canvasElement).toHaveTextContent("Analytics have been disabled. You can find more information in our Privacy Policy.");
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
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
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle()
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle(true)
}`,...W.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  play: createPlay(SortOrder.DealOrder)
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  play: createPlay(SortOrder.Ascending)
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
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
}`,...X.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  args: WithInitialCards.args,
  play: createManualEntryPlay()
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  args: WithInitialCards.args,
  play: createManualEntryPlay(["A♠", "A♣"])
}`,...$.parameters?.docs?.source}}},ct=[`AnalyticsAccepted`,`AnalyticsDisabled`,`StoredConsentGiven`,`DealNewHandReplacesCards`,`DiscardShowsScoredPossibilities`,`Expanded`,`DoubleExpanded`,`SortHandInDealOrder`,`SortHandInAscendingOrder`,`DeepLinkedAnalysisState`,`SortAnalysisByPlayPoints`,`WithInitialCards`,`UnchangedManualEntryCloses`,`ChangedManualEntryApplies`]}))();export{R as AnalyticsAccepted,z as AnalyticsDisabled,$ as ChangedManualEntryApplies,V as DealNewHandReplacesCards,J as DeepLinkedAnalysisState,H as DiscardShowsScoredPossibilities,W as DoubleExpanded,U as Expanded,Y as SortAnalysisByPlayPoints,q as SortHandInAscendingOrder,K as SortHandInDealOrder,B as StoredConsentGiven,Q as UnchangedManualEntryCloses,X as WithInitialCards,ct as __namedExportsOrder,nt as default};