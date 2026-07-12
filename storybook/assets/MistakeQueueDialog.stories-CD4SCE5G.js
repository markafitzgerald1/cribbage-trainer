import{i as e}from"./preload-helper-BdFrVu1K.js";import{i as t,l as n,r,s as i,t as a}from"./stories.common-Ch_UTuRa.js";import{a as o,i as s,r as c,t as l}from"./MistakeQueueDialog.test.common-ynX9wUK6.js";var u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{t(),o(),c(),{expect:u,fn:d,within:f}=__STORYBOOK_MODULE_TEST__,p=l.createSampleMistakeTally(),m=l.createAllMasteredTally(),h=l.createEmptyMistakeTally(),g={args:{initialQuantileFilter:`all`,initialRoleFilter:`all`,initialSortOrder:`priority`,initialStatusFilter:`active`,onClose:d(),onStartAutoDrill:d(),onStartDrill:d(),show:!0,tally:p},component:s,tags:[`autodocs`],title:`MistakeQueueDialog`},_={play:async({canvasElement:e})=>{await r(e,`Mistake queue`),await n(e,`Highest loss`),await n(e,`Priority`)}},v={play:async({canvasElement:e})=>{await n(e,`Dealer`)}},y={play:async({canvasElement:e})=>{await n(e,`Mastered`)}},b={args:{initialStatusFilter:`all`},play:async({canvasElement:e})=>{await n(e,/^High severity/u)}},x={args:{tally:m},play:async({canvasElement:e})=>{await r(e,`All mistake hands mastered!`)}},S={args:{tally:h},play:async({canvasElement:e})=>{await r(e,/No mistake hands recorded yet/iu)}},C={play:i},w={play:async({args:e,canvasElement:t})=>{f(t).getAllByRole(`button`,{name:`Practice this`})[0]?.click(),await u(e.onStartDrill).toHaveBeenCalledTimes(1),await a(t,`Start drill`,e.onStartAutoDrill)}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "Mistake queue");
    await selectStoryRadioOption(canvasElement, "Highest loss");
    await selectStoryRadioOption(canvasElement, "Priority");
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    await selectStoryRadioOption(canvasElement, "Dealer");
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    await selectStoryRadioOption(canvasElement, "Mastered");
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    initialStatusFilter: "all"
  },
  play: async ({
    canvasElement
  }) => {
    await selectStoryRadioOption(canvasElement, /^High severity/u);
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    tally: allMasteredTally
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "All mistake hands mastered!");
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    tally: emptyMistakeTally
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, /No mistake hands recorded yet/iu);
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  play: playStoryEscape
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    within(canvasElement).getAllByRole("button", {
      name: "Practice this"
    })[0]?.click();
    await expect(args.onStartDrill).toHaveBeenCalledTimes(1);
    await clickStoryButtonExpectingCall(canvasElement, "Start drill", args.onStartAutoDrill);
  }
}`,...w.parameters?.docs?.source}}},T=[`DefaultOpen`,`FilterByRole`,`FilterByStatus`,`FilterByQuantile`,`AllMasteredEmptyState`,`EmptyQueueNotice`,`DismissWithEscape`,`StartDrillFromCard`]}))();export{x as AllMasteredEmptyState,_ as DefaultOpen,C as DismissWithEscape,S as EmptyQueueNotice,b as FilterByQuantile,v as FilterByRole,y as FilterByStatus,w as StartDrillFromCard,T as __namedExportsOrder,g as default};