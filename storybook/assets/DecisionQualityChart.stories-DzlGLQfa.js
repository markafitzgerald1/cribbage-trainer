import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t,t as n}from"./SortOrder-CEtbOzlr.js";import{a as r,s as i}from"./stories.common-ClFJeHpz.js";import{n as a,t as o}from"./DecisionQualityChart-m9NZ-0_u.js";import{o as s,s as c}from"./PracticeDrillPanel.test.common-CetS_-1i.js";var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M;function N(){return(N=e((()=>{a(),t(),s(),r(),{expect:l,fireEvent:u,fn:d,waitFor:f,within:p}=__STORYBOOK_MODULE_TEST__,m=[{decisions:20,endTime:17000036e5,judgedDecisions:20,key:`1-20`,label:`Decisions 1–20`,meanExpectedPointsLoss:.65,optimalDecisions:10,skippedHands:1,startTime:17e11},{decisions:20,endTime:17000072e5,judgedDecisions:20,key:`21-40`,label:`Decisions 21–40`,meanExpectedPointsLoss:.35,optimalDecisions:14,skippedHands:0,startTime:17000036e5},{decisions:15,endTime:17000108e5,judgedDecisions:15,key:`41-55`,label:`Decisions 41–55`,meanExpectedPointsLoss:.12,optimalDecisions:12,skippedHands:2,startTime:17000072e5}],h={args:{buckets:m,granularity:`rolling20`},component:o,parameters:{layout:`centered`},tags:[`autodocs`],title:`DecisionQualityChart`},g=async e=>{let t=p(e).getByRole(`group`,{name:`Decision quality over time trend chart`});await l(t).toBeVisible()},_=async({canvasElement:e})=>{await g(e)},v={play:_},y={args:{buckets:[m[0]],granularity:`rolling20`}},b=[{loss:0,mastered:!1,mean:0},{loss:.5,mastered:!0,mean:.25},{loss:1.2,mastered:!1,mean:.57},{loss:0,mastered:!1,mean:.43},{loss:.25,mastered:!1,mean:.39}].map(({loss:e,mastered:t,mean:n},r)=>({discardKey:`5H,6H`,expectedPointsLoss:e,handKey:`5H,6H,7H,8H,9H,10H|Dealer`,isMastered:t,isOptimal:e===0,isPracticeEligible:e>0,isRetained:!1,isWithinNoise:!1,ordinal:r+1,recencyAt:17e11+r,rollingMeanLoss:n,tableIdentity:null,timestamp:17e11+r*1e5})),x={buckets:m,decisionPoints:b,granularity:`rolling20`},S={args:x,play:_},C=e=>{let t=e.querySelector(`[data-decision-ordinal]`);if(t===null)throw Error(`expected a loss marker in the chart`);return t},w=e=>{e.dispatchEvent(new MouseEvent(`click`,{bubbles:!0}))},T=async e=>{await f(async()=>{await l(p(e).queryByRole(`region`)).not.toBeInTheDocument()})},E={args:x,play:async({canvasElement:e})=>{let t=p(e),n=C(e);w(n);let r=await t.findByRole(`region`);await l(r).toHaveTextContent(`Recorded cost:`),await l(r).toHaveTextContent(`Dealer`),await l(r).toHaveTextContent(`Hand`),await l(r).toHaveTextContent(`Discarded`),w(n),await T(e),w(n),await t.findByRole(`region`),await u.keyDown(window,{key:`Escape`}),await T(e),w(n),w(await t.findByRole(`button`,{name:`Dismiss`})),await T(e)}},D={args:{...x,onPracticeDecision:d(),sortOrder:n.Descending},play:({args:e,canvasElement:t})=>i(t,e.onPracticeDecision)},O={args:{...x,decisionPoints:b.map(e=>e.ordinal===5?{...e,isPracticeEligible:!1,isWithinNoise:!0}:e),onPracticeDecision:d()},play:async({canvas:e})=>{w(e.getByRole(`button`,{name:`Decision #5, recorded cost 0.25 points, within simulation noise. Select to see the hand.`})),await l(await e.findByText(`Within noise`)).toBeVisible(),await l(e.queryByText(`Practice this hand`)).toBeNull()}},k={args:{buckets:[],granularity:`rolling20`},play:async({canvasElement:e})=>{await l(e.textContent).toContain(`No discard decisions recorded yet`)}},A={args:{buckets:[{...m[0],decisions:1,meanExpectedPointsLoss:.004}],decisionPoints:[{...b[1],expectedPointsLoss:.004,ordinal:1,rollingMeanLoss:.004,tableIdentity:c}],granularity:`rolling20`,onPracticeDecision:d()},play:async({args:e,canvasElement:t})=>{let n=p(t),r=n.getByRole(`button`,{name:`Decision #1, recorded cost less than 0.01 points, mastered in later retries. Select to see the hand.`});await u.click(r),await l(n.getByRole(`note`,{name:`Recorded cost for selected decision: less than 0.01 points`})).toHaveTextContent(`Recorded cost: < 0.01 points`),await l(n.getByText(`Mastered in later retries`)).toBeVisible(),await u.click(n.getByText(`Judged with different tables`)),await l(n.getByText(`Crib: ${c.crib.means_sha256.slice(0,12)}…`)).toBeVisible(),await u.click(n.getByRole(`button`,{name:`Practice this hand`})),await l(e.onPracticeDecision).toHaveBeenCalledWith(e.decisionPoints[0])}},j={args:{...x,decisionPoints:b.slice(0,2).map(e=>({...e,isRetained:!0})),totalDecisions:200},play:async({canvas:e})=>{await l(e.getByRole(`group`,{name:`Decision quality over time trend chart`})).toHaveAccessibleDescription(/the most recent 2 of 200/u);let t=e.getByRole(`button`,{name:/^Retained decision #2, recorded cost 0\.50 points/u});t.focus(),await u.keyDown(t,{key:`Enter`}),await l(e.getByRole(`region`,{name:`Retained decision #2 detail`})).toHaveTextContent(`Recorded cost: 0.50 points`),await l(e.getByText(`Retained decision #1, recorded cost 0.00 points (best choice then)`)).toBeInTheDocument()}},M=[`Default`,`SinglePeriod`,`WithDecisionPoints`,`DecisionDetailPopup`,`PracticeFromDetail`,`WithinNoiseDecision`,`Empty`,`EarlierRecordedDetail`,`RetainedDecisionDetail`],v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  play: playExpectChart
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    buckets: [sampleBuckets[0]!],
    granularity: "rolling20"
  }
}`,...y.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: rollingWithPointsArgs,
  play: playExpectChart
}`,...S.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: rollingWithPointsArgs,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const marker = firstLossMarker(canvasElement);
    clickElement(marker);
    const panel = await canvas.findByRole("region");
    await expect(panel).toHaveTextContent("Recorded cost:");
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
      name: "Dismiss"
    }));
    await expectPanelGone(canvasElement);
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    ...rollingWithPointsArgs,
    onPracticeDecision: fn(),
    sortOrder: SortOrder.Descending
  },
  play: ({
    args,
    canvasElement
  }) => playPracticeFromDecisionMarker(canvasElement, args.onPracticeDecision)
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    ...rollingWithPointsArgs,
    decisionPoints: sampleDecisionPoints.map(point => point.ordinal === 5 ? {
      ...point,
      isPracticeEligible: false,
      isWithinNoise: true
    } : point),
    onPracticeDecision: fn()
  },
  play: async ({
    canvas
  }) => {
    clickElement(canvas.getByRole("button", {
      name: "Decision #5, recorded cost 0.25 points, within simulation noise. Select to see the hand."
    }));
    await expect(await canvas.findByText("Within noise")).toBeVisible();
    await expect(canvas.queryByText("Practice this hand")).toBeNull();
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    buckets: [],
    granularity: "rolling20"
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.textContent).toContain("No discard decisions recorded yet");
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    buckets: [{
      ...sampleBuckets[0]!,
      decisions: 1,
      meanExpectedPointsLoss: 0.004
    }],
    decisionPoints: [{
      ...sampleDecisionPoints[1]!,
      expectedPointsLoss: 0.004,
      ordinal: 1,
      rollingMeanLoss: 0.004,
      tableIdentity: originalIdentity
    }],
    granularity: "rolling20",
    onPracticeDecision: fn()
  },
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const marker = canvas.getByRole("button", {
      name: "Decision #1, recorded cost less than 0.01 points, mastered in later retries. Select to see the hand."
    });
    await fireEvent.click(marker);
    await expect(canvas.getByRole("note", {
      name: "Recorded cost for selected decision: less than 0.01 points"
    })).toHaveTextContent("Recorded cost: < 0.01 points");
    await expect(canvas.getByText("Mastered in later retries")).toBeVisible();
    await fireEvent.click(canvas.getByText("Judged with different tables"));
    await expect(canvas.getByText(\`Crib: \${originalIdentity.crib.means_sha256.slice(0, 12)}…\`)).toBeVisible();
    await fireEvent.click(canvas.getByRole("button", {
      name: "Practice this hand"
    }));
    await expect(args.onPracticeDecision).toHaveBeenCalledWith(args.decisionPoints![0]);
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    ...rollingWithPointsArgs,
    decisionPoints: sampleDecisionPoints.slice(0, 2).map(point => ({
      ...point,
      isRetained: true
    })),
    totalDecisions: 200
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByRole("group", {
      name: "Decision quality over time trend chart"
    })).toHaveAccessibleDescription(/the most recent 2 of 200/u);
    const retained = canvas.getByRole("button", {
      name: /^Retained decision #2, recorded cost 0\\.50 points/u
    });
    retained.focus();
    await fireEvent.keyDown(retained, {
      key: "Enter"
    });
    await expect(canvas.getByRole("region", {
      name: "Retained decision #2 detail"
    })).toHaveTextContent("Recorded cost: 0.50 points");
    await expect(canvas.getByText("Retained decision #1, recorded cost 0.00 points (best choice then)")).toBeInTheDocument();
  }
}`,...j.parameters?.docs?.source}}}})))()}N();export{E as DecisionDetailPopup,v as Default,A as EarlierRecordedDetail,k as Empty,D as PracticeFromDetail,j as RetainedDecisionDetail,y as SinglePeriod,S as WithDecisionPoints,O as WithinNoiseDecision,M as __namedExportsOrder,h as default};