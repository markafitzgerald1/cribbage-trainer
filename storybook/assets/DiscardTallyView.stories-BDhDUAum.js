import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{a as t,s as n}from"./stories.common-CiSrL75A.js";import{n as r,t as i}from"./DiscardTallyView-5x5w46gv.js";import{a,i as o}from"./MistakeQueueDialog.test.common-ApwVO2qe.js";var s;function c(){return(c=e((()=>{s=(e={})=>({decisions:24,meanExpectedPointsLoss:.7361,optimalDecisions:9,skippedHands:0,todayDecisions:0,todayMeanExpectedPointsLoss:null,todayOptimalDecisions:0,todaySkippedHands:0,...e})})))()}var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D;function O(){return(O=e((()=>{r(),a(),c(),t(),{expect:l,fn:u,userEvent:d,waitFor:f}=__STORYBOOK_MODULE_TEST__,p=o(),m={component:i,parameters:{layout:`centered`},tags:[`autodocs`],title:`DiscardTallyView`},h=(e,t)=>({args:{summary:e},play:async({canvas:e})=>{await l(e.getByText(t)).toBeVisible()}}),g=h(s({todayDecisions:5,todayMeanExpectedPointsLoss:.4128,todayOptimalDecisions:2}),`0.41`),_=h(s({decisions:3,meanExpectedPointsLoss:0,optimalDecisions:3}),`0.00`),v=h(s({skippedHands:7,todayDecisions:5,todayMeanExpectedPointsLoss:.4128,todayOptimalDecisions:2,todaySkippedHands:3}),`Hands skipped`),y={args:{summary:s({decisions:0,meanExpectedPointsLoss:null,optimalDecisions:0})},play:async({canvasElement:e})=>{await l(e.textContent).toBe(``)}},b=s({decisions:10,meanExpectedPointsLoss:.25,optimalDecisions:7}),x={args:{summary:b},play:async({canvas:e})=>{let t=e.getByRole(`button`,{name:`Quality trend`});await l(t).toBeVisible(),await d.click(t),await l(e.getByText(`Decision quality over time`)).toBeVisible(),await d.click(e.getByRole(`button`,{name:`Close modal`})),await l(e.queryByText(`Decision quality over time`)).toBeNull()}},S={args:{summary:b,tally:p},play:async({canvas:e})=>{let t=e.getByRole(`button`,{name:`Mistake queue`});await l(t).toBeVisible(),await d.click(t),await l(e.getByRole(`heading`,{name:`Mistake queue`})).toBeVisible(),await f(async()=>{await l(e.getAllByRole(`note`,{name:/^Current-table comparison:/u})).toHaveLength(2)},{timeout:1e4})}},C={args:{summary:s({meanExpectedPointsLoss:.004})},play:async({canvas:e})=>{await l(e.getByRole(`note`,{name:`Recorded loss all time: less than 0.01 points per discard`})).toHaveTextContent(`< 0.01`),await d.click(e.getByText(`As recorded`)),await l(e.getByText(/Earlier results, queue membership and mastery are kept/u)).toBeVisible()}},w=h(s({skippedHands:2,todaySkippedHands:1}),`1/1`),T={args:{...S.args,onStartAutoDrill:u()},play:async({args:e,canvas:t})=>{await d.click(t.getByRole(`button`,{name:`Mistake queue`})),await d.click(t.getByRole(`button`,{name:`Start drill`})),await l(e.onStartAutoDrill).toHaveBeenCalledTimes(1),await l(t.queryByRole(`heading`,{name:`Mistake queue`})).toBeNull()}},E={args:{...S.args,onStartDrill:u()},play:async({args:e,canvas:t,canvasElement:r})=>{await d.click(t.getByRole(`button`,{name:`Quality trend`})),await n(r,e.onStartDrill),await l(t.queryByRole(`region`)).toBeNull(),await l(t.queryByText(`Decision quality over time`)).toBeNull()}},D=[`Default`,`FaultlessSoFar`,`WithSkippedHands`,`NothingFacedYet`,`OpenQualityTrend`,`OpenMistakeQueue`,`RecordedSmallLoss`,`OnlySkippedToday`,`StartAutomaticDrill`,`PracticeClosesTrend`],g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  todayDecisions: 5,
  todayMeanExpectedPointsLoss: 0.4128,
  todayOptimalDecisions: 2
}), "0.41")`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  decisions: 3,
  meanExpectedPointsLoss: 0,
  optimalDecisions: 3
}), "0.00")`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  skippedHands: 7,
  todayDecisions: 5,
  todayMeanExpectedPointsLoss: 0.4128,
  todayOptimalDecisions: 2,
  todaySkippedHands: 3
}), "Hands skipped")`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  skippedHands: 2,
  todaySkippedHands: 1
}), "1/1")`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}}})))()}O();export{g as Default,_ as FaultlessSoFar,y as NothingFacedYet,w as OnlySkippedToday,S as OpenMistakeQueue,x as OpenQualityTrend,E as PracticeClosesTrend,C as RecordedSmallLoss,T as StartAutomaticDrill,v as WithSkippedHands,D as __namedExportsOrder,m as default};