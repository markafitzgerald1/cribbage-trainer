import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{a as t,i as n,t as r}from"./stories.common-ClFJeHpz.js";import{a as i,c as a,d as o,i as s,l as c,n as l,o as u,r as d,t as f,u as p}from"./PracticeDrillPanel.test.common-CetS_-1i.js";import{n as m,t as h}from"./PracticeDrillPanel-D44ZqI7J.js";var g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M;function N(){return(N=e((()=>{u(),t(),m(),{expect:g,fn:_,within:v}=__STORYBOOK_MODULE_TEST__,y={args:{...f(),onCommit:_(),onExit:_(),onNextHand:_()},component:h,parameters:{layout:`centered`},tags:[`autodocs`],title:`PracticeDrillPanel`},b={play:async({args:e,canvasElement:t})=>{let n=t.querySelector(`section > div > :first-child`);await g(n).toHaveTextContent(/^PracticeCheck discardExit drill$/u),await r(t,`Check discard`,e.onCommit)}},x={args:{phase:`revealed`}},S={args:{phase:`revealed`,verdict:p()},play:async({canvasElement:e})=>{let t=v(e).getByText(`Practice`);await g(t.parentElement?.nextElementSibling).toHaveTextContent(/toward mastery/u),await n(e,/toward mastery/u)}},C={args:{hasNextHand:!1,phase:`revealed`,verdict:p({chosenDiscard:`10H,10S`,chosenLoss:.63,consecutiveSuccesses:0,isOptimal:!1,previousDiscard:null,previousLoss:.63})},play:async({canvasElement:e})=>{await n(e,/points behind the best choice with current tables/u)}},w={args:{phase:`revealed`,verdict:p({chosenDiscard:`10H,10S`,chosenLoss:.06,consecutiveSuccesses:1,isOptimal:!1,isWithinNoise:!0,previousLoss:.63})}},T={args:{onLocateEarlierChoice:_(),phase:`revealed`,verdict:p({chosenDiscard:`5H,6H`,chosenLoss:0,consecutiveSuccesses:1,isOptimal:!0,previousDiscard:`7C,8C`,previousLoss:1.42})},play:async({args:e,canvasElement:t})=>{await r(t,`Scroll to previous mistake in table`,e.onLocateEarlierChoice)}},E={args:{phase:`revealed`,verdict:p({chosenDiscard:`7C,8C`,chosenLoss:1.42,consecutiveSuccesses:0,isOptimal:!1,previousDiscard:`7C,8C`,previousLoss:1.42})},play:async({canvasElement:e})=>{await g(v(e).getByRole(`button`,{name:`Scroll to previous mistake in table`})).toBeInTheDocument(),await n(e,/1\.42 points behind the best choice with current tables/u)}},D={args:c(d()),play:async({canvasElement:e})=>{await n(e,l)}},O={args:c(s()),play:async({canvasElement:e})=>{let t=v(e);await g(t.queryByText(l)).toBeNull(),await g(t.getByText(`Retry — current tables`)).toBeVisible()}},k={args:c(p({retryTableIdentity:a})),play:async({canvasElement:e})=>{await n(e,o)}},A={args:{hasNextHand:!1,phase:`revealed`,verdict:p({...d(),consecutiveSuccesses:2,isMastered:!0})},play:async({canvasElement:e})=>{await n(e,`Mastered.`)}},j={args:c(i(.004)),play:async({canvasElement:e})=>{await g(v(e).getByRole(`note`,{name:`less than 0.01 points behind the best choice with current tables.`})).toBeVisible()}},M=[`Choosing`,`AwaitingAnswer`,`OptimalVerdict`,`MissVerdict`,`WithinNoiseVerdict`,`ReviewWithEarlierDiscardLocate`,`ReviewWithRepeatedMistake`,`ChangedTables`,`CurrentTables`,`UnknownOriginalTables`,`MasteredUnderChangedTables`,`SubCentRetry`],b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    const first = canvasElement.querySelector("section > div > :first-child");
    await expect(first).toHaveTextContent(/^PracticeCheck discardExit drill$/u);
    await clickStoryButtonExpectingCall(canvasElement, "Check discard", args.onCommit);
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    phase: "revealed"
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    phase: "revealed",
    verdict: sampleVerdict()
  },
  play: async ({
    canvasElement
  }) => {
    const badge = within(canvasElement).getByText("Practice");
    await expect(badge.parentElement?.nextElementSibling).toHaveTextContent(/toward mastery/u);
    await expectStoryTextVisible(canvasElement, /toward mastery/u);
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
    await expectStoryTextVisible(canvasElement, /points behind the best choice with current tables/u);
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    phase: "revealed",
    verdict: sampleVerdict({
      chosenDiscard: "10H,10S",
      chosenLoss: 0.06,
      consecutiveSuccesses: 1,
      isOptimal: false,
      isWithinNoise: true,
      previousLoss: 0.63
    })
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
    await expect(within(canvasElement).getByRole("button", {
      name: "Scroll to previous mistake in table"
    })).toBeInTheDocument();
    await expectStoryTextVisible(canvasElement, /1\\.42 points behind the best choice with current tables/u);
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: revealedPanelArgs(changedVerdict()),
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, changedTablesNote);
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: revealedPanelArgs(currentVerdict()),
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(changedTablesNote)).toBeNull();
    await expect(canvas.getByText("Retry — current tables")).toBeVisible();
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: revealedPanelArgs(sampleVerdict({
    retryTableIdentity: retryIdentity
  })),
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, unknownTablesNote);
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    hasNextHand: false,
    phase: "revealed",
    verdict: sampleVerdict({
      ...changedVerdict(),
      consecutiveSuccesses: 2,
      isMastered: true
    })
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "Mastered.");
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: revealedPanelArgs(failedVerdict(0.004)),
  play: async ({
    canvasElement
  }) => {
    await expect(within(canvasElement).getByRole("note", {
      name: "less than 0.01 points behind the best choice with current tables."
    })).toBeVisible();
  }
}`,...j.parameters?.docs?.source}}}})))()}N();export{x as AwaitingAnswer,D as ChangedTables,b as Choosing,O as CurrentTables,A as MasteredUnderChangedTables,C as MissVerdict,S as OptimalVerdict,T as ReviewWithEarlierDiscardLocate,E as ReviewWithRepeatedMistake,j as SubCentRetry,k as UnknownOriginalTables,w as WithinNoiseVerdict,M as __namedExportsOrder,y as default};