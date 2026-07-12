import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{i as t,r as n,t as r}from"./stories.common-DNls5WNy.js";import{n as i,r as a,t as o}from"./PracticeDrillPanel.test.common-CwtVsLXQ.js";import{n as s,t as c}from"./PracticeDrillPanel-CZVXRrNr.js";var l,u,d,f,p,m,h,g,_,v,y;function b(){return(b=e((()=>{i(),t(),s(),{expect:l,fn:u,within:d}=__STORYBOOK_MODULE_TEST__,f={args:{...o(),onCommit:u(),onExit:u(),onNextHand:u()},component:c,parameters:{layout:`centered`},tags:[`autodocs`],title:`PracticeDrillPanel`},p={play:async({args:e,canvasElement:t})=>{await r(t,`Check discard`,e.onCommit)}},m={args:{phase:`revealed`}},h={args:{phase:`revealed`,verdict:a()},play:async({canvasElement:e})=>{await n(e,/toward mastery/u)}},g={args:{hasNextHand:!1,phase:`revealed`,verdict:a({chosenDiscard:`10H,10S`,chosenLoss:.63,consecutiveSuccesses:0,isOptimal:!1,previousDiscard:null,previousLoss:.63})},play:async({canvasElement:e})=>{await n(e,/behind the best discard/u)}},_={args:{onLocateEarlierChoice:u(),phase:`revealed`,verdict:a({chosenDiscard:`5H,6H`,chosenLoss:0,consecutiveSuccesses:1,isOptimal:!0,previousDiscard:`7C,8C`,previousLoss:1.42})},play:async({args:e,canvasElement:t})=>{await r(t,`Scroll to previous mistake in table`,e.onLocateEarlierChoice)}},v={args:{phase:`revealed`,verdict:a({chosenDiscard:`7C,8C`,chosenLoss:1.42,consecutiveSuccesses:0,isOptimal:!1,previousDiscard:`7C,8C`,previousLoss:1.42})},play:async({canvasElement:e})=>{let t=d(e);await l(t.getByRole(`button`,{name:`Scroll to previous mistake in table`})).toBeInTheDocument(),await n(e,/1\.42 behind the best discard/u)}},y=[`Choosing`,`AwaitingAnswer`,`OptimalVerdict`,`MissVerdict`,`ReviewWithEarlierDiscardLocate`,`ReviewWithRepeatedMistake`],p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    await clickStoryButtonExpectingCall(canvasElement, "Check discard", args.onCommit);
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    phase: "revealed"
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    phase: "revealed",
    verdict: sampleVerdict()
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, /toward mastery/u);
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    onLocateEarlierChoice: fn(),
    phase: "revealed",
    verdict: sampleVerdict({
      chosenDiscard: "5H,6H",
      chosenLoss: 0,
      consecutiveSuccesses: 1,
      isOptimal: true,
      previousDiscard: "7C,8C",
      previousLoss: 1.42
    })
  },
  play: async ({
    args,
    canvasElement
  }) => {
    await clickStoryButtonExpectingCall(canvasElement, "Scroll to previous mistake in table", args.onLocateEarlierChoice);
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    phase: "revealed",
    verdict: sampleVerdict({
      chosenDiscard: "7C,8C",
      chosenLoss: 1.42,
      consecutiveSuccesses: 0,
      isOptimal: false,
      previousDiscard: "7C,8C",
      previousLoss: 1.42
    })
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", {
      name: "Scroll to previous mistake in table"
    })).toBeInTheDocument();
    await expectStoryTextVisible(canvasElement, /1\\.42 behind the best discard/u);
  }
}`,...v.parameters?.docs?.source}}}})))()}b();export{m as AwaitingAnswer,p as Choosing,g as MissVerdict,h as OptimalVerdict,_ as ReviewWithEarlierDiscardLocate,v as ReviewWithRepeatedMistake,y as __namedExportsOrder,f as default};