import{i as e}from"./preload-helper-BdFrVu1K.js";import{a as t,i as n}from"./SortOrderName-MXRr2nWr.js";import{i as r,l as i,o as a,r as o,s}from"./stories.common-Ch_UTuRa.js";import{o as c,t as l}from"./expectedCribPoints-BOulACVp.js";import{n as u,t as d}from"./DecisionQualityTrendDialog-Dzf6QgKu.js";import{s as f,u as p}from"./mistakeQueue-D__bGeVP.js";import{r as m,t as h}from"./mistakeQueue.test.common-DO37ZRrK.js";var g,_,v,y,b,x,S,C,w,T,E=e((()=>{p(),c(),m(),g=17e11,_=864e5,v=[{handKey:`5H,6H,7H,8H,9H,10H|Dealer`,loss:1.4,role:l.Dealer},{handKey:`AC,2C,3C,4C,5C,6C|Pone`,loss:.5,role:l.Pone},{handKey:`2D,3D,4D,5D,6D,7D|Dealer`,loss:0,role:l.Dealer}],y=e=>h({lifetime:{decisions:e,expectedPointsLossTotal:e*.2,optimalDecisions:Math.ceil(e/2),skippedHands:1},records:Array.from({length:e},(e,t)=>({at:g+t*36e5,cribRole:t%2==0?l.Dealer:l.Pone,discardKey:`5H,6H`,expectedPointsLoss:.2,handKey:`dialog-${t}`,isOptimal:t%2==0,isPractice:!1})),skipped:[{at:170000001e4}]}),b=()=>h({lifetime:{decisions:f+1,expectedPointsLossTotal:4e3,optimalDecisions:Math.floor(f/2),skippedHands:0},records:Array.from({length:20},(e,t)=>({at:g+t*1e3,cribRole:l.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.2,handKey:`capped-${t}`,isOptimal:!0,isPractice:!1}))}),x=()=>h(),S=()=>h({lifetime:{decisions:1,expectedPointsLossTotal:.5,optimalDecisions:0,skippedHands:1},records:[{at:g,cribRole:l.Dealer,discardKey:null,expectedPointsLoss:.5,handKey:`h1`,isOptimal:!1,isPractice:!1}],skipped:[{at:1700432e6}]}),C=()=>h({lifetime:{decisions:3,expectedPointsLossTotal:1.9,optimalDecisions:1,skippedHands:0},records:v.map((e,t)=>({at:g+_*t,cribRole:e.role,discardKey:`5H,6H`,expectedPointsLoss:e.loss,handKey:e.handKey,isOptimal:!1,isPractice:!1}))}),w=()=>h({lifetime:{decisions:5,expectedPointsLossTotal:2.8,optimalDecisions:1,skippedHands:0},records:[{at:g,cribRole:l.Dealer,discardKey:`5H,6H`,expectedPointsLoss:0,handKey:`h-opt`,isOptimal:!0,isPractice:!1},{at:17000864e5,cribRole:l.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.15,handKey:`h-1`,isOptimal:!1,isPractice:!1},{at:17001728e5,cribRole:l.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.35,handKey:`h-2`,isOptimal:!1,isPractice:!1},{at:17002592e5,cribRole:l.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.8,handKey:`h-3`,isOptimal:!1,isPractice:!1},{at:17003456e5,cribRole:l.Dealer,discardKey:`5H,6H`,expectedPointsLoss:1.5,handKey:`h-4`,isOptimal:!1,isPractice:!1}]}),T={cappedDialogTally:b,dialogTally:y,emptyDialogTally:x,multiLossDialogTally:w,practiceReadyDialogTally:C,skipOnlyDialogTally:S}})),D,O,k,A,j,M,N,P,F,I,L,R;e((()=>{r(),u(),t(),E(),{fn:D}=__STORYBOOK_MODULE_TEST__,O=T.dialogTally(30),k=T.cappedDialogTally(),A=T.practiceReadyDialogTally(),j={args:{initialGranularity:`rolling20`,initialRoleFilter:`all`,onClose:D(),show:!0,tally:O},component:d,tags:[`autodocs`],title:`DecisionQualityTrendDialog`},M={play:async({canvasElement:e})=>{await i(e,`Day`),await o(e,`Period / Batch`)}},N={args:{initialRoleFilter:`dealer`}},P={args:{initialRoleFilter:`pone`}},F={args:{tally:k},play:async({canvasElement:e})=>{await o(e,/retain up to 10,000 entries/iu)}},I={play:s},L={args:{onStartDrill:D(),sortOrder:n.Descending,tally:A},play:({args:e,canvasElement:t})=>a(t,e.onStartDrill)},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    await selectStoryRadioOption(canvasElement, "Day");
    await expectStoryTextVisible(canvasElement, "Period / Batch");
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    initialRoleFilter: "dealer"
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    initialRoleFilter: "pone"
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    tally: cappedTally
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, /retain up to 10,000 entries/iu);
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  play: playStoryEscape
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    onStartDrill: fn(),
    sortOrder: SortOrder.Descending,
    tally: practiceReadyTally
  },
  play: ({
    args,
    canvasElement
  }) => playPracticeFromDecisionMarker(canvasElement, args.onStartDrill)
}`,...L.parameters?.docs?.source}}},R=[`DefaultOpen`,`DealerFilter`,`PoneFilter`,`AtRecordCap`,`DismissWithEscape`,`PracticeFromChartMistake`]}))();export{F as AtRecordCap,N as DealerFilter,M as DefaultOpen,I as DismissWithEscape,P as PoneFilter,L as PracticeFromChartMistake,R as __namedExportsOrder,j as default};