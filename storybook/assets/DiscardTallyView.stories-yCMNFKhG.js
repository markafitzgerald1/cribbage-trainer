import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{a as t,s as n}from"./stories.common-ClFJeHpz.js";import{s as r,t as i}from"./expectedCribPoints-BcTYWPuV.js";import{u as a}from"./mistakeQueue-XAdBG93Q.js";import{i as o,t as s}from"./mistakeQueue.test.common-DZ-RbY_E.js";import{n as c,t as l}from"./DiscardTallyView-LvWkRcYK.js";import{a as u,i as d}from"./MistakeQueueDialog.test.common-Cy19bV_6.js";var f,p,m,h,g;function _(){return(_=e((()=>{a(),r(),o(),f=Date.now(),p={at:f-2,cribRole:i.Dealer,discardKey:`8C,KC`,expectedPointsLoss:0,handKey:`4H,5D,KH,6H,8C,KC|Dealer`,isOptimal:!0,isPractice:!1,recordedAdmission:{basis:`exact-v1`,eligible:!1},tableIdentity:null},m={...p,at:f-1,discardKey:`KH,8C`,expectedPointsLoss:.041,handKey:`5D,4H,KH,6H,8C,KC|Dealer`,isOptimal:!1,recordedAdmission:{basis:`sampling-noise-v1`,eligible:!1}},h={...m,at:f,discardKey:`5H,6H`,expectedPointsLoss:1.5,handKey:`AH,2H,3H,4H,5H,6H|Dealer`,recordedAdmission:{basis:`sampling-noise-v1`,eligible:!0}},g=e=>{let t=e.map(e=>e.expectedPointsLoss);return s({lifetime:{decisions:e.length,expectedPointsLossTotal:t.reduce((e,t)=>e+t,0),optimalDecisions:t.filter(e=>e===0).length,skippedHands:0},records:e,version:8})}})))()}var v;function y(){return(y=e((()=>{v=(e={})=>({decisions:24,meanExpectedPointsLoss:.7361,optimalDecisions:9,skippedHands:0,todayDecisions:0,todayMeanExpectedPointsLoss:null,todayOptimalDecisions:0,todaySkippedHands:0,todayWithinNoiseDecisions:0,withinNoiseDecisions:0,...e})})))()}var b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W;function G(){return(G=e((()=>{_(),c(),u(),y(),t(),{expect:b,fn:x,userEvent:S,waitFor:C}=__STORYBOOK_MODULE_TEST__,w=d(),T={component:l,parameters:{layout:`centered`},tags:[`autodocs`],title:`DiscardTallyView`},E=(e,t)=>({args:{summary:e},play:async({canvas:e})=>{await b(e.getByText(t)).toBeVisible()}}),D=E(v({todayDecisions:5,todayMeanExpectedPointsLoss:.4128,todayOptimalDecisions:2}),`0.41`),O=E(v({decisions:3,meanExpectedPointsLoss:0,optimalDecisions:3}),`0.00`),k=E(v({skippedHands:7,todayDecisions:5,todayMeanExpectedPointsLoss:.4128,todayOptimalDecisions:2,todaySkippedHands:3}),`Hands skipped`),A={args:{summary:v({decisions:0,meanExpectedPointsLoss:null,optimalDecisions:0})},play:async({canvasElement:e})=>{await b(e.textContent).toBe(``)}},j=v({decisions:10,meanExpectedPointsLoss:.25,optimalDecisions:7}),M={args:{summary:j},play:async({canvas:e})=>{let t=e.getByRole(`button`,{name:`Quality trend`});await b(t).toBeVisible(),await S.click(t),await b(e.getByText(`Decision quality over time`)).toBeVisible(),await S.click(e.getByRole(`button`,{name:`Close modal`})),await b(e.queryByText(`Decision quality over time`)).toBeNull()}},N={args:{summary:j,tally:w},play:async({canvas:e})=>{let t=e.getByRole(`button`,{name:`Mistake queue`});await b(t).toBeVisible(),await S.click(t),await b(e.getByRole(`heading`,{name:`Mistake queue`})).toBeVisible(),await C(async()=>{await b(e.getAllByRole(`note`,{name:/^Current-table comparison:/u})).toHaveLength(2)},{timeout:1e4})}},P={args:{summary:v({meanExpectedPointsLoss:.004})},play:async({canvas:e})=>{await b(e.getByRole(`note`,{name:`Recorded loss all time: less than 0.01 points per discard`})).toHaveTextContent(`< 0.01`),await S.click(e.getByText(`As recorded`)),await b(e.getByText(/Earlier results, queue membership and mastery are kept/u)).toBeVisible()}},F=E(v({skippedHands:2,todaySkippedHands:1}),`1/1`),I={args:{...N.args,onStartAutoDrill:x()},play:async({args:e,canvas:t})=>{await S.click(t.getByRole(`button`,{name:`Mistake queue`})),await S.click(t.getByRole(`button`,{name:`Start drill`})),await b(e.onStartAutoDrill).toHaveBeenCalledTimes(1),await b(t.queryByRole(`heading`,{name:`Mistake queue`})).toBeNull()}},L={args:{...N.args,onStartDrill:x()},play:async({args:e,canvas:t,canvasElement:r})=>{await S.click(t.getByRole(`button`,{name:`Quality trend`})),await n(r,e.onStartDrill),await b(t.queryByRole(`region`)).toBeNull(),await b(t.queryByText(`Decision quality over time`)).toBeNull()}},R=[p,m,h],z=(e,t)=>v({decisions:e,meanExpectedPointsLoss:t,optimalDecisions:1,withinNoiseDecisions:1}),B=z(3,.5137),V=E(B,`1/2`),H={args:{summary:z(2,.0205)},play:async({canvas:e})=>{await b(e.getByText(`1/1`)).toBeVisible(),await b(e.queryByRole(`button`,{name:`Mistake queue`})).not.toBeInTheDocument()}},U={args:{summary:B,tally:g(R)},play:async({canvas:e})=>{await b(e.getByText(`1/2`)).toBeVisible(),await S.click(e.getByRole(`button`,{name:`Quality trend`})),await b(e.getAllByText(`50.0%`)).toHaveLength(2),e.getByRole(`button`,{name:`Decision #2, recorded cost 0.04 points, within simulation noise. Select to see the hand.`}).dispatchEvent(new MouseEvent(`click`,{bubbles:!0})),await b(await e.findByText(`Within noise`)).toBeVisible()}},W=[`Default`,`FaultlessSoFar`,`WithSkippedHands`,`NothingFacedYet`,`OpenQualityTrend`,`OpenMistakeQueue`,`RecordedSmallLoss`,`OnlySkippedToday`,`StartAutomaticDrill`,`PracticeClosesTrend`,`WithinNoiseLeftOutOfBestChoice`,`EveryMistakeWithinNoise`,`WithinNoiseInQualityTrend`],D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  todayDecisions: 5,
  todayMeanExpectedPointsLoss: 0.4128,
  todayOptimalDecisions: 2
}), "0.41")`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  decisions: 3,
  meanExpectedPointsLoss: 0,
  optimalDecisions: 3
}), "0.00")`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  skippedHands: 7,
  todayDecisions: 5,
  todayMeanExpectedPointsLoss: 0.4128,
  todayOptimalDecisions: 2,
  todaySkippedHands: 3
}), "Hands skipped")`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    summary: discardTallySummary({
      decisions: 0,
      meanExpectedPointsLoss: null,
      optimalDecisions: 0
    })
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.textContent).toBe("");
  }
}`,...A.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    summary: summaryWithMistakes
  },
  play: async ({
    canvas
  }) => {
    const trendButton = canvas.getByRole("button", {
      name: "Quality trend"
    });
    await expect(trendButton).toBeVisible();
    await userEvent.click(trendButton);
    await expect(canvas.getByText("Decision quality over time")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", {
      name: "Close modal"
    }));
    await expect(canvas.queryByText("Decision quality over time")).toBeNull();
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    summary: summaryWithMistakes,
    tally: sampleMistakeTally
  },
  play: async ({
    canvas
  }) => {
    const queueButton = canvas.getByRole("button", {
      name: "Mistake queue"
    });
    await expect(queueButton).toBeVisible();
    await userEvent.click(queueButton);
    await expect(canvas.getByRole("heading", {
      name: "Mistake queue"
    })).toBeVisible();

    // Classification runs in chunks after the dialog opens; wait for both recorded discards.
    await waitFor(async () => {
      await expect(canvas.getAllByRole("note", {
        name: /^Current-table comparison:/u
      })).toHaveLength(2);
    }, {
      timeout: 10000
    });
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    summary: discardTallySummary({
      meanExpectedPointsLoss: 0.004
    })
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByRole("note", {
      name: "Recorded loss all time: less than 0.01 points per discard"
    })).toHaveTextContent("< 0.01");
    await userEvent.click(canvas.getByText("As recorded"));
    await expect(canvas.getByText(/Earlier results, queue membership and mastery are kept/u)).toBeVisible();
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  skippedHands: 2,
  todaySkippedHands: 1
}), "1/1")`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    ...OpenMistakeQueue.args,
    onStartAutoDrill: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("button", {
      name: "Mistake queue"
    }));
    await userEvent.click(canvas.getByRole("button", {
      name: "Start drill"
    }));
    await expect(args.onStartAutoDrill).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole("heading", {
      name: "Mistake queue"
    })).toBeNull();
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    ...OpenMistakeQueue.args,
    onStartDrill: fn()
  },
  play: async ({
    args,
    canvas,
    canvasElement
  }) => {
    await userEvent.click(canvas.getByRole("button", {
      name: "Quality trend"
    }));
    await playPracticeFromDecisionMarker(canvasElement, args.onStartDrill);
    await expect(canvas.queryByRole("region")).toBeNull();
    await expect(canvas.queryByText("Decision quality over time")).toBeNull();
  }
}`,...L.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`showing(allThreeSummary, "1/2")`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    summary: oneWithinNoise(2, 0.0205)
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText("1/1")).toBeVisible();
    await expect(canvas.queryByRole("button", {
      name: "Mistake queue"
    })).not.toBeInTheDocument();
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    summary: allThreeSummary,
    tally: recordedTally(ALL_THREE)
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText("1/2")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", {
      name: "Quality trend"
    }));

    // The Best choice card and the one rolling batch's row agree.
    await expect(canvas.getAllByText("50.0%")).toHaveLength(2);
    canvas.getByRole("button", {
      name: "Decision #2, recorded cost 0.04 points, within simulation noise. Select to see the hand."
    }).dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));
    await expect(await canvas.findByText("Within noise")).toBeVisible();
  }
}`,...U.parameters?.docs?.source}}}})))()}G();export{D as Default,H as EveryMistakeWithinNoise,O as FaultlessSoFar,A as NothingFacedYet,F as OnlySkippedToday,N as OpenMistakeQueue,M as OpenQualityTrend,L as PracticeClosesTrend,P as RecordedSmallLoss,I as StartAutomaticDrill,k as WithSkippedHands,U as WithinNoiseInQualityTrend,V as WithinNoiseLeftOutOfBestChoice,W as __namedExportsOrder,T as default};