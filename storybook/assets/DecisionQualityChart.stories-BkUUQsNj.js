import{i as e}from"./preload-helper-BdFrVu1K.js";import{a as t,i as n}from"./SortOrderName-MXRr2nWr.js";import{i as r,o as i}from"./stories.common-Ch_UTuRa.js";import{n as a,t as o}from"./DecisionQualityChart-Di9w5SfV.js";var s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E;e((()=>{a(),t(),r(),{expect:s,fireEvent:c,fn:l,waitFor:u,within:d}=__STORYBOOK_MODULE_TEST__,f=[{decisions:20,endTime:17000036e5,key:`1-20`,label:`Decisions 1–20`,meanExpectedPointsLoss:.65,optimalDecisions:10,skippedHands:1,startTime:17e11},{decisions:20,endTime:17000072e5,key:`21-40`,label:`Decisions 21–40`,meanExpectedPointsLoss:.35,optimalDecisions:14,skippedHands:0,startTime:17000036e5},{decisions:15,endTime:17000108e5,key:`41-55`,label:`Decisions 41–55`,meanExpectedPointsLoss:.12,optimalDecisions:12,skippedHands:2,startTime:17000072e5}],p={args:{buckets:f,granularity:`rolling20`},component:o,parameters:{layout:`centered`},tags:[`autodocs`],title:`DecisionQualityChart`},m=async e=>{let t=d(e).getByRole(`group`,{name:`Decision quality over time trend chart`});await s(t).toBeVisible()},h=async({canvasElement:e})=>{await m(e)},g={play:h},_={args:{buckets:[f[0]],granularity:`rolling20`}},v={buckets:f,decisionPoints:[{loss:0,mastered:!1,mean:0},{loss:.5,mastered:!0,mean:.25},{loss:1.2,mastered:!1,mean:.57},{loss:0,mastered:!1,mean:.43},{loss:.25,mastered:!1,mean:.39}].map(({loss:e,mastered:t,mean:n},r)=>({discardKey:`5H,6H`,expectedPointsLoss:e,handKey:`5H,6H,7H,8H,9H,10H|Dealer`,isMastered:t,isOptimal:e===0,isRetained:!1,ordinal:r+1,recencyAt:17e11+r,rollingMeanLoss:n,timestamp:17e11+r*1e5})),granularity:`rolling20`},y={args:v,play:h},b=e=>{let t=e.querySelector(`[data-decision-ordinal]`);if(t===null)throw Error(`expected a loss marker in the chart`);return t},x=e=>{e.dispatchEvent(new MouseEvent(`click`,{bubbles:!0}))},S=async e=>{await u(async()=>{await s(d(e).queryByRole(`region`)).not.toBeInTheDocument()})},C={args:v,play:async({canvasElement:e})=>{let t=d(e),n=b(e);x(n);let r=await t.findByRole(`region`);await s(r).toHaveTextContent(`lost`),await s(r).toHaveTextContent(`Dealer`),await s(r).toHaveTextContent(`Hand`),await s(r).toHaveTextContent(`Discarded`),x(n),await S(e),x(n),await t.findByRole(`region`),await c.keyDown(window,{key:`Escape`}),await S(e),x(n),x(await t.findByRole(`button`,{name:`Close`})),await S(e)}},w={args:{...v,onPracticeDecision:l(),sortOrder:n.Descending},play:({args:e,canvasElement:t})=>i(t,e.onPracticeDecision)},T={args:{buckets:[],granularity:`rolling20`},play:async({canvasElement:e})=>{await s(e.textContent).toContain(`No discard decisions recorded yet`)}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  play: playExpectChart
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    buckets: [sampleBuckets[0]!],
    granularity: "rolling20"
  }
}`,..._.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: rollingWithPointsArgs,
  play: playExpectChart
}`,...y.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: rollingWithPointsArgs,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const marker = firstLossMarker(canvasElement);
    clickElement(marker);
    const panel = await canvas.findByRole("region");
    await expect(panel).toHaveTextContent("lost");
    await expect(panel).toHaveTextContent("Dealer");
    await expect(panel).toHaveTextContent("Hand");
    await expect(panel).toHaveTextContent("Discarded");
    clickElement(marker);
    await expectPanelGone(canvasElement);
    clickElement(marker);
    await canvas.findByRole("region");
    await fireEvent.keyDown(window, {
      key: "Escape"
    });
    await expectPanelGone(canvasElement);
    clickElement(marker);
    clickElement(await canvas.findByRole("button", {
      name: "Close"
    }));
    await expectPanelGone(canvasElement);
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    ...rollingWithPointsArgs,
    onPracticeDecision: fn(),
    sortOrder: SortOrder.Descending
  },
  play: ({
    args,
    canvasElement
  }) => playPracticeFromDecisionMarker(canvasElement, args.onPracticeDecision)
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    buckets: [],
    granularity: "rolling20"
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.textContent).toContain("No discard decisions recorded yet");
  }
}`,...T.parameters?.docs?.source}}},E=[`Default`,`SinglePeriod`,`WithDecisionPoints`,`DecisionDetailPopup`,`PracticeFromDetail`,`Empty`]}))();export{C as DecisionDetailPopup,g as Default,T as Empty,w as PracticeFromDetail,_ as SinglePeriod,y as WithDecisionPoints,E as __namedExportsOrder,p as default};