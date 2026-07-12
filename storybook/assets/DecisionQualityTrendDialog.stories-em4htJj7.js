import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t,t as n}from"./SortOrder-CEtbOzlr.js";import{a as r,c as i,i as a,r as o,s,u as c}from"./stories.common-ClFJeHpz.js";import{s as l,t as u}from"./expectedCribPoints-BcTYWPuV.js";import{n as d,t as f}from"./DecisionQualityTrendDialog-BRRX3PBl.js";import{s as p,u as m}from"./mistakeQueue-XAdBG93Q.js";import{i as h,t as g}from"./mistakeQueue.test.common-DZ-RbY_E.js";var _,v,y,b,x,S,C,w,T,E;function D(){return(D=e((()=>{m(),l(),h(),_=17e11,v=864e5,y=[{handKey:`5H,6H,7H,8H,9H,10H|Dealer`,loss:1.4,role:u.Dealer},{handKey:`AC,2C,3C,4C,5C,6C|Pone`,loss:.5,role:u.Pone},{handKey:`2D,3D,4D,5D,6D,7D|Dealer`,loss:.2,role:u.Dealer}],b=e=>g({lifetime:{decisions:e,expectedPointsLossTotal:e*.2,optimalDecisions:Math.ceil(e/2),skippedHands:1},records:Array.from({length:e},(e,t)=>({at:_+t*36e5,cribRole:t%2==0?u.Dealer:u.Pone,discardKey:`5H,6H`,expectedPointsLoss:.2,handKey:`dialog-${t}`,isOptimal:t%2==0,isPractice:!1})),skipped:[{at:170000001e4}]}),x=()=>g({lifetime:{decisions:p+1,expectedPointsLossTotal:4e3,optimalDecisions:Math.floor(p/2),skippedHands:0},records:Array.from({length:20},(e,t)=>({at:_+t*1e3,cribRole:u.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.2,handKey:`capped-${t}`,isOptimal:!0,isPractice:!1}))}),S=()=>g(),C=()=>g({lifetime:{decisions:1,expectedPointsLossTotal:.5,optimalDecisions:0,skippedHands:1},records:[{at:_,cribRole:u.Dealer,discardKey:null,expectedPointsLoss:.5,handKey:`h1`,isOptimal:!1,isPractice:!1}],skipped:[{at:1700432e6}]}),w=()=>g({lifetime:{decisions:3,expectedPointsLossTotal:2.1,optimalDecisions:0,skippedHands:0},records:y.map((e,t)=>({at:_+v*t,cribRole:e.role,discardKey:e.handKey.split(`|`)[0].split(`,`).slice(0,2).join(`,`),expectedPointsLoss:e.loss,handKey:e.handKey,isOptimal:!1,isPractice:!1,recordedAdmission:{basis:`sampling-noise-v1`,eligible:t<2}}))}),T=()=>g({lifetime:{decisions:5,expectedPointsLossTotal:2.8,optimalDecisions:1,skippedHands:0},records:[{at:_,cribRole:u.Dealer,discardKey:`5H,6H`,expectedPointsLoss:0,handKey:`h-opt`,isOptimal:!0,isPractice:!1},{at:17000864e5,cribRole:u.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.15,handKey:`h-1`,isOptimal:!1,isPractice:!1},{at:17001728e5,cribRole:u.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.35,handKey:`h-2`,isOptimal:!1,isPractice:!1},{at:17002592e5,cribRole:u.Dealer,discardKey:`5H,6H`,expectedPointsLoss:.8,handKey:`h-3`,isOptimal:!1,isPractice:!1},{at:17003456e5,cribRole:u.Dealer,discardKey:`5H,6H`,expectedPointsLoss:1.5,handKey:`h-4`,isOptimal:!1,isPractice:!1}]}),E={cappedDialogTally:x,dialogTally:b,emptyDialogTally:S,multiLossDialogTally:T,practiceReadyDialogTally:w,skipOnlyDialogTally:C}})))()}var O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G;function K(){return(K=e((()=>{r(),d(),t(),D(),{expect:O,fn:k,within:A}=__STORYBOOK_MODULE_TEST__,j=E.dialogTally(30),M=E.cappedDialogTally(),N=E.practiceReadyDialogTally(),P={args:{initialGranularity:`rolling20`,initialRoleFilter:`all`,onClose:k(),show:!0,tally:j},component:f,tags:[`autodocs`],title:`DecisionQualityTrendDialog`},F={play:async({canvasElement:e})=>{await c(e,`Day`),await a(e,`Period / Batch`)}},I={args:{initialRoleFilter:`dealer`}},L={args:{initialRoleFilter:`pone`}},R={args:{tally:M},play:async({canvasElement:e})=>{await a(e,/retain up to 10,000 entries/iu)}},z={play:i},B={args:{onStartDrill:k(),sortOrder:n.Descending,tally:N},play:({args:e,canvasElement:t})=>s(t,e.onStartDrill)},V={args:{initialGranularity:`day`,tally:{...N,lifetime:{decisions:1,expectedPointsLossTotal:.004,optimalDecisions:0,skippedHands:0},records:N.records.slice(0,1).map(e=>({...e,expectedPointsLoss:.004}))}},play:async({canvas:e,canvasElement:t})=>{let n=A(e.getByRole(`table`,{name:`Recorded decision history`}));await O(n.getByRole(`note`,{name:/^Recorded loss for .+: less than 0\.01 points per discard$/u})).toHaveTextContent(`< 0.01`),await o(t,`Recorded loss overall: less than 0.01 points per discard`,`< 0.01`)}},H={args:{tally:E.emptyDialogTally()},play:async({canvas:e,canvasElement:t})=>{await o(t,`Recorded loss overall unavailable`,`—`),await O(e.getByText(`No discard decisions recorded yet for this view.`)).toBeVisible()}},U={args:{initialGranularity:`day`,tally:E.skipOnlyDialogTally()},play:async({canvas:e,canvasElement:t})=>{let n=e.getByRole(`note`,{name:/^Recorded loss for .+ unavailable$/u});await O(n).toHaveTextContent(`—`),await O(n.closest(`tr`)).toHaveTextContent(`1 (100.0%)`),await O(e.getByRole(`group`,{name:`Decision quality over time trend chart`})).toHaveAccessibleDescription(/Latest scored period/u),await c(t,`Pone`),await o(t,`Recorded loss overall unavailable`,`—`)}},W={args:{initialGranularity:`day`,tally:E.multiLossDialogTally()},play:async({canvas:e})=>{let t=e.getByRole(`note`,{name:/^Recorded loss for .+: 0\.00 points per discard$/u});await O(t).toHaveTextContent(`0.00`),await O(t.closest(`tr`)).toHaveTextContent(`100.0%`)}},G=[`DefaultOpen`,`DealerFilter`,`PoneFilter`,`AtRecordCap`,`DismissWithEscape`,`PracticeFromChartMistake`,`RecordedCalendarLoss`,`EmptyRecordedHistory`,`SkippedCalendarPeriod`,`BestRecordedCalendarChoice`],F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    await selectStoryRadioOption(canvasElement, "Day");
    await expectStoryTextVisible(canvasElement, "Period / Batch");
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    initialRoleFilter: "dealer"
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    initialRoleFilter: "pone"
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    tally: cappedTally
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, /retain up to 10,000 entries/iu);
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  play: playStoryEscape
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    onStartDrill: fn(),
    sortOrder: SortOrder.Descending,
    tally: practiceReadyTally
  },
  play: ({
    args,
    canvasElement
  }) => playPracticeFromDecisionMarker(canvasElement, args.onStartDrill)
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  args: {
    initialGranularity: "day",
    tally: {
      ...practiceReadyTally,
      lifetime: {
        decisions: 1,
        expectedPointsLossTotal: 0.004,
        optimalDecisions: 0,
        skippedHands: 0
      },
      records: practiceReadyTally.records.slice(0, 1).map(record => ({
        ...record,
        expectedPointsLoss: 0.004
      }))
    }
  },
  play: async ({
    canvas,
    canvasElement
  }) => {
    const history = within(canvas.getByRole("table", {
      name: "Recorded decision history"
    }));
    await expect(history.getByRole("note", {
      name: /^Recorded loss for .+: less than 0\\.01 points per discard$/u
    })).toHaveTextContent("< 0.01");
    await expectStoryNote(canvasElement, "Recorded loss overall: less than 0.01 points per discard", "< 0.01");
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    tally: dialogFixtures.emptyDialogTally()
  },
  play: async ({
    canvas,
    canvasElement
  }) => {
    await expectStoryNote(canvasElement, "Recorded loss overall unavailable", "—");
    await expect(canvas.getByText("No discard decisions recorded yet for this view.")).toBeVisible();
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    initialGranularity: "day",
    tally: dialogFixtures.skipOnlyDialogTally()
  },
  play: async ({
    canvas,
    canvasElement
  }) => {
    const unavailable = canvas.getByRole("note", {
      name: /^Recorded loss for .+ unavailable$/u
    });
    await expect(unavailable).toHaveTextContent("—");
    await expect(unavailable.closest("tr")).toHaveTextContent("1 (100.0%)");
    await expect(canvas.getByRole("group", {
      name: "Decision quality over time trend chart"
    })).toHaveAccessibleDescription(/Latest scored period/u);
    await selectStoryRadioOption(canvasElement, "Pone");
    await expectStoryNote(canvasElement, "Recorded loss overall unavailable", "—");
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    initialGranularity: "day",
    tally: dialogFixtures.multiLossDialogTally()
  },
  play: async ({
    canvas
  }) => {
    const bestPeriod = canvas.getByRole("note", {
      name: /^Recorded loss for .+: 0\\.00 points per discard$/u
    });
    await expect(bestPeriod).toHaveTextContent("0.00");
    await expect(bestPeriod.closest("tr")).toHaveTextContent("100.0%");
  }
}`,...W.parameters?.docs?.source}}}})))()}K();export{R as AtRecordCap,W as BestRecordedCalendarChoice,I as DealerFilter,F as DefaultOpen,z as DismissWithEscape,H as EmptyRecordedHistory,L as PoneFilter,B as PracticeFromChartMistake,V as RecordedCalendarLoss,U as SkippedCalendarPeriod,G as __namedExportsOrder,P as default};