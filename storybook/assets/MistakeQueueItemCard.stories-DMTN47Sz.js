import{i as e}from"./preload-helper-BdFrVu1K.js";import{a as t,i as n}from"./SortOrderName-MXRr2nWr.js";import{i as r,r as i,t as a}from"./stories.common-Ch_UTuRa.js";import{i as o,r as s}from"./mistakeQueue.test.common-DO37ZRrK.js";import{n as c,t as l}from"./MistakeQueueItemCard-B7h4dUX8.js";var u,d,f,p,m,h;e((()=>{r(),c(),t(),s(),{fn:u}=__STORYBOOK_MODULE_TEST__,d={args:{item:o,onPractice:u(),sortOrder:n.DealOrder},component:l,parameters:{layout:`centered`},tags:[`autodocs`],title:`MistakeQueueItemCard`},f={play:async({args:e,canvasElement:t})=>{await a(t,`Practice this`,e.onPractice)}},p={args:{item:{...o,consecutiveSuccesses:2,isMastered:!0,lossQuantile:`high`}},play:async({canvasElement:e})=>{await i(e,`Mastered`)}},m={args:{item:{...o,lossQuantile:null,previousDiscard:null}},play:async({canvasElement:e})=>{await i(e,`Previous choice not recorded`)}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    await clickStoryButtonExpectingCall(canvasElement, "Practice this", args.onPractice);
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    item: {
      ...mockItemA,
      consecutiveSuccesses: 2,
      isMastered: true,
      lossQuantile: "high"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "Mastered");
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    item: {
      ...mockItemA,
      lossQuantile: null,
      previousDiscard: null
    }
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "Previous choice not recorded");
  }
}`,...m.parameters?.docs?.source}}},h=[`Active`,`Mastered`,`WithoutPreviousDiscard`]}))();export{f as Active,p as Mastered,m as WithoutPreviousDiscard,h as __namedExportsOrder,d as default};