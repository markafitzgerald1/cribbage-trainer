import{i as e}from"./preload-helper-BdFrVu1K.js";import{a as t,n,r,s as i}from"./stories.common-B0_Wn-EV.js";import{n as a,t as o}from"./DecisionQualityTrendDialog-Ba07vrqM.js";import{o as s,t as c}from"./expectedCribPoints-vR0MW9Bt.js";import{r as l,t as u}from"./discardTally-Xr_prsa8.js";import{r as d,t as f}from"./mistakeQueue.test.common-DgEsZcRL.js";var p,m,h,g,_,v,y,b=e((()=>{l(),s(),d(),p=17e11,m=e=>f({lifetime:{decisions:e,expectedPointsLossTotal:e*.2,optimalDecisions:Math.ceil(e/2),skippedHands:1},records:Array.from({length:e},(e,t)=>({at:p+t*36e5,cribRole:t%2==0?c.Dealer:c.Pone,discardKey:`5H,6H`,expectedPointsLoss:.2,handKey:`dialog-${t}`,isOptimal:t%2==0,isPractice:!1})),skipped:[{at:170000001e4}]}),h=()=>f({lifetime:{decisions:u+1,expectedPointsLossTotal:4e3,optimalDecisions:Math.floor(u/2),skippedHands:0},records:Array.from({length:20},(e,t)=>({at:p+t*1e3,cribRole:c.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.2,handKey:`capped-${t}`,isOptimal:!0,isPractice:!1}))}),g=()=>f(),_=()=>f({lifetime:{decisions:1,expectedPointsLossTotal:.5,optimalDecisions:0,skippedHands:1},records:[{at:p,cribRole:c.Dealer,discardKey:null,expectedPointsLoss:.5,handKey:`h1`,isOptimal:!1,isPractice:!1}],skipped:[{at:1700432e6}]}),v=()=>f({lifetime:{decisions:5,expectedPointsLossTotal:2.8,optimalDecisions:1,skippedHands:0},records:[{at:p,cribRole:c.Dealer,discardKey:`5H,6H`,expectedPointsLoss:0,handKey:`h-opt`,isOptimal:!0,isPractice:!1},{at:17000864e5,cribRole:c.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.15,handKey:`h-1`,isOptimal:!1,isPractice:!1},{at:17001728e5,cribRole:c.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.35,handKey:`h-2`,isOptimal:!1,isPractice:!1},{at:17002592e5,cribRole:c.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.8,handKey:`h-3`,isOptimal:!1,isPractice:!1},{at:17003456e5,cribRole:c.Dealer,discardKey:`5H,6H`,expectedPointsLoss:1.5,handKey:`h-4`,isOptimal:!1,isPractice:!1}]}),y={cappedDialogTally:h,dialogTally:m,emptyDialogTally:g,multiLossDialogTally:v,skipOnlyDialogTally:_}})),x,S,C,w,T,E,D,O,k,A;e((()=>{r(),a(),b(),{fn:x}=__STORYBOOK_MODULE_TEST__,S=y.dialogTally(30),C=y.cappedDialogTally(),w={args:{initialGranularity:`rolling20`,initialRoleFilter:`all`,onClose:x(),show:!0,tally:S},component:o,tags:[`autodocs`],title:`DecisionQualityTrendDialog`},T={play:async({canvasElement:e})=>{await i(e,`Day`),await n(e,`Period / Batch`)}},E={args:{initialRoleFilter:`dealer`}},D={args:{initialRoleFilter:`pone`}},O={args:{tally:C},play:async({canvasElement:e})=>{await n(e,/retain up to 10,000 entries/iu)}},k={play:t},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    await selectStoryRadioOption(canvasElement, "Day");
    await expectStoryTextVisible(canvasElement, "Period / Batch");
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    initialRoleFilter: "dealer"
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    initialRoleFilter: "pone"
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    tally: cappedTally
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, /retain up to 10,000 entries/iu);
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  play: playStoryEscape
}`,...k.parameters?.docs?.source}}},A=[`DefaultOpen`,`DealerFilter`,`PoneFilter`,`AtRecordCap`,`DismissWithEscape`]}))();export{O as AtRecordCap,E as DealerFilter,T as DefaultOpen,k as DismissWithEscape,D as PoneFilter,A as __namedExportsOrder,w as default};