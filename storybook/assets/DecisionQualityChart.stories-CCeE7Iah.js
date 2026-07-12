import{i as e}from"./preload-helper-BdFrVu1K.js";import{n as t,t as n}from"./DecisionQualityChart-BiBF-ebf.js";var r,i,a,o,s,c,l,u,d,f,p,m;e((()=>{t(),{expect:r,within:i}=__STORYBOOK_MODULE_TEST__,a=[{decisions:20,endTime:17000036e5,key:`1-20`,label:`Decisions 1–20`,meanExpectedPointsLoss:.65,optimalDecisions:10,skippedHands:1,startTime:17e11},{decisions:20,endTime:17000072e5,key:`21-40`,label:`Decisions 21–40`,meanExpectedPointsLoss:.35,optimalDecisions:14,skippedHands:0,startTime:17000036e5},{decisions:15,endTime:17000108e5,key:`41-55`,label:`Decisions 41–55`,meanExpectedPointsLoss:.12,optimalDecisions:12,skippedHands:2,startTime:17000072e5}],o={args:{buckets:a,granularity:`rolling20`},component:n,parameters:{layout:`centered`},tags:[`autodocs`],title:`DecisionQualityChart`},s=async e=>{let t=i(e).getByRole(`img`,{name:`Decision quality over time trend chart`});await r(t).toBeVisible()},c=async({canvasElement:e})=>{await s(e)},l={play:c},u={args:{buckets:[a[0]],granularity:`rolling20`}},d=[{loss:0,mean:0},{loss:.5,mean:.25},{loss:1.2,mean:.57},{loss:0,mean:.43},{loss:.25,mean:.39}].map(({loss:e,mean:t},n)=>({expectedPointsLoss:e,isOptimal:e===0,isRetained:!1,ordinal:n+1,rollingMeanLoss:t,timestamp:17e11+n*1e5})),f={args:{buckets:a,decisionPoints:d,granularity:`rolling20`},play:c},p={args:{buckets:[],granularity:`rolling20`},play:async({canvasElement:e})=>{await r(e.textContent).toContain(`No discard decisions recorded yet`)}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  play: playExpectChart
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    buckets: [sampleBuckets[0]!],
    granularity: "rolling20"
  }
}`,...u.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    buckets: sampleBuckets,
    decisionPoints: sampleDecisionPoints,
    granularity: "rolling20"
  },
  play: playExpectChart
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    buckets: [],
    granularity: "rolling20"
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement.textContent).toContain("No discard decisions recorded yet");
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`SinglePeriod`,`WithDecisionPoints`,`Empty`]}))();export{l as Default,p as Empty,u as SinglePeriod,f as WithDecisionPoints,m as __namedExportsOrder,o as default};