import{a as e,n as t}from"./rolldown-runtime-sJBDdmOt.js";import{t as n}from"./react-BGJ90fIb.js";import{a as r,c as i,i as a,l as o,n as s,o as c,r as l,s as u}from"./iframe-CgK3cEC6.js";import{t as d}from"./oppositeRoleLoss-DnYuZhgT.js";import{n as f,t as p}from"./NoiseVerdictBadge-ChA5f_fY.js";function m(){return(m=t((()=>{u(),a(),s()})))()}var h,g,_,v,y,b,x,S;function C(){return(C=t((()=>{m(),u(),a(),s(),o(),r(),h=e(n(),1),{global:g}=__STORYBOOK_MODULE_GLOBAL__,{window:_}=g,_&&(_.STORYBOOK_ENV=`react`),{composeConfigs:v,composeStories:y,composeStory:b,setProjectAnnotations:x,setDefaultProjectAnnotations:S}=__STORYBOOK_MODULE_PREVIEW_API__,v([c,l,{renderToCanvas:async(e,t)=>{if(e.storyContext.testingLibraryRender==null)return i(e,t);let{storyContext:{context:n,unboundStoryFn:r,testingLibraryRender:a}}=e,{unmount:o}=a(h.createElement(r,{...n}),{container:n.canvasElement});return o}}])})))()}function w(){return(w=t((()=>{C()})))()}var T,E,D,O,k,A,j,M;function N(){return(N=t((()=>{w(),f(),d(),{expect:T,userEvent:E,within:D}=__STORYBOOK_MODULE_TEST__,O={accessibleLabel:`0.06 points lost`,leadingText:``,oppositeRoleCost:`0.06 pts lost`,oppositeRoleCostsNothing:!1},k=async e=>{await E.click(D(e).getByRole(`button`)),await T(D(e).getByText(/^Approximate threshold 0\.07 pts/u)).toBeVisible()},A={component:p,title:`NoiseVerdictBadge`},j={args:{rolePair:O,threshold:.07,title:`Within noise: at or below the approximate 0.07 point threshold.`},play:async({canvasElement:e})=>{await k(e)}},M=[`RevealsThresholdOnTap`],j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    rolePair: singleFigure,
    threshold: 0.07,
    title: "Within noise: at or below the approximate 0.07 point threshold."
  },
  play: async ({
    canvasElement
  }) => {
    await tapBadgeAndExpectThreshold(canvasElement);
  }
}`,...j.parameters?.docs?.source}}}})))()}N();export{j as RevealsThresholdOnTap,M as __namedExportsOrder,A as default};