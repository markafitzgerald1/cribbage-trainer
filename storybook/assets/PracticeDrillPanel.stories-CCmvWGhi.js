import{i as e}from"./preload-helper-BdFrVu1K.js";import{i as t,r as n,t as r}from"./stories.common-Ch_UTuRa.js";import{n as i,r as a,t as o}from"./PracticeDrillPanel.test.common-CAi5zT7-.js";import{n as s,t as c}from"./PracticeDrillPanel-C9N79gc2.js";var l,u,d,f,p,m,h;e((()=>{i(),t(),s(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={args:{...o(),onCommit:l(),onExit:l(),onNextHand:l()},component:c,parameters:{layout:`centered`},tags:[`autodocs`],title:`PracticeDrillPanel`},d={play:async({args:e,canvasElement:t})=>{await r(t,`Check discard`,e.onCommit)}},f={args:{phase:`revealed`}},p={args:{phase:`revealed`,verdict:a()},play:async({canvasElement:e})=>{await n(e,/toward mastery/u)}},m={args:{hasNextHand:!1,phase:`revealed`,verdict:a({chosenDiscard:`10H,10S`,chosenLoss:.63,consecutiveSuccesses:0,isOptimal:!1,previousDiscard:null,previousLoss:.63})},play:async({canvasElement:e})=>{await n(e,/behind the best discard/u)}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    await clickStoryButtonExpectingCall(canvasElement, "Check discard", args.onCommit);
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    phase: "revealed"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    phase: "revealed",
    verdict: sampleVerdict()
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, /toward mastery/u);
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    hasNextHand: false,
    phase: "revealed",
    verdict: sampleVerdict({
      chosenDiscard: "10H,10S",
      chosenLoss: 0.63,
      consecutiveSuccesses: 0,
      isOptimal: false,
      previousDiscard: null,
      previousLoss: 0.63
    })
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, /behind the best discard/u);
  }
}`,...m.parameters?.docs?.source}}},h=[`Choosing`,`AwaitingAnswer`,`OptimalVerdict`,`MissVerdict`]}))();export{f as AwaitingAnswer,d as Choosing,m as MissVerdict,p as OptimalVerdict,h as __namedExportsOrder,u as default};