import{i as e}from"./preload-helper-BdFrVu1K.js";import{n as t,t as n}from"./DiscardTallyView-DBQBBQZA.js";import{n as r,r as i}from"./MistakeQueueDialog.test.common-BZUSlnbB.js";var a,o=e((()=>{a=(e={})=>({decisions:24,meanExpectedPointsLoss:.7361,optimalDecisions:9,skippedHands:0,todayDecisions:0,todayMeanExpectedPointsLoss:null,todayOptimalDecisions:0,todaySkippedHands:0,...e})})),s,c,l,u,d,f,p,m,h,g,_,v,y;e((()=>{t(),i(),o(),{expect:s,userEvent:c}=__STORYBOOK_MODULE_TEST__,l=r(),u={component:n,parameters:{layout:`centered`},tags:[`autodocs`],title:`DiscardTallyView`},d=(e,t)=>({args:{summary:e},play:async({canvas:e})=>{await s(e.getByText(t)).toBeVisible()}}),f=d(a({todayDecisions:5,todayMeanExpectedPointsLoss:.4128,todayOptimalDecisions:2}),`0.41`),p=d(a({decisions:3,meanExpectedPointsLoss:0,optimalDecisions:3}),`0.00`),m=d(a({skippedHands:7,todayDecisions:5,todayMeanExpectedPointsLoss:.4128,todayOptimalDecisions:2,todaySkippedHands:3}),`Hands skipped`),h={args:{summary:a({decisions:0,meanExpectedPointsLoss:null,optimalDecisions:0})},play:async({canvasElement:e})=>{await s(e.textContent).toBe(``)}},g=a({decisions:10,meanExpectedPointsLoss:.25,optimalDecisions:7}),_={args:{summary:g},play:async({canvas:e})=>{let t=e.getByRole(`button`,{name:`Quality trend`});await s(t).toBeVisible(),await c.click(t),await s(e.getByText(`Decision quality over time`)).toBeVisible()}},v={args:{summary:g,tally:l},play:async({canvas:e})=>{let t=e.getByRole(`button`,{name:`Mistake queue`});await s(t).toBeVisible(),await c.click(t),await s(e.getByRole(`heading`,{name:`Mistake queue`})).toBeVisible()}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  todayDecisions: 5,
  todayMeanExpectedPointsLoss: 0.4128,
  todayOptimalDecisions: 2
}), "0.41")`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  decisions: 3,
  meanExpectedPointsLoss: 0,
  optimalDecisions: 3
}), "0.00")`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`showing(discardTallySummary({
  skippedHands: 7,
  todayDecisions: 5,
  todayMeanExpectedPointsLoss: 0.4128,
  todayOptimalDecisions: 2,
  todaySkippedHands: 3
}), "Hands skipped")`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`FaultlessSoFar`,`WithSkippedHands`,`NothingFacedYet`,`OpenQualityTrend`,`OpenMistakeQueue`]}))();export{f as Default,p as FaultlessSoFar,h as NothingFacedYet,v as OpenMistakeQueue,_ as OpenQualityTrend,m as WithSkippedHands,y as __namedExportsOrder,u as default};