import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{a as t,i as n}from"./SortOrderName-DnS2ytQU.js";import{i as r,r as i,t as a}from"./stories.common-DNls5WNy.js";import{a as o,i as s,r as c}from"./mistakeQueue.test.common-II6qSlAf.js";import{n as l,t as u}from"./MistakeQueueItemCard-DaosuiJX.js";var d,f,p,m,h,g,_,v,y,b;function x(){return(x=e((()=>{r(),c(),l(),t(),{expect:d,fn:f,within:p}=__STORYBOOK_MODULE_TEST__,m={args:{item:s,onPractice:f(),sortOrder:n.DealOrder},component:u,parameters:{layout:`centered`},tags:[`autodocs`],title:`MistakeQueueItemCard`},h={play:async({args:e,canvasElement:t})=>{await a(t,`Practice this`,e.onPractice)}},g={args:{item:{...s,consecutiveSuccesses:2,isMastered:!0,lossQuantile:`high`}},play:async({canvasElement:e})=>{await i(e,`Mastered`)}},_={args:{item:{...s,lossQuantile:null,previousDiscard:null}},play:async({canvasElement:e})=>{await i(e,`Previous choice not recorded`)}},v={args:{lossReason:`Crib`},play:async({canvasElement:e})=>{await i(e,`Prev: Crib`)}},y={args:{classification:o},play:async({canvasElement:e})=>{let t=p(e).getByRole(`note`,{name:`Previous discard driven by 1.30 Crib gain does not cover 1.40 Hand loss`});await d(t).toBeVisible(),await d(t).toHaveTextContent(`Prev: Crib gain < Hand loss`),await d(t).toHaveAttribute(`title`,`Previous discard (0.10 pts lost) driven by 1.30 Crib gain does not cover 1.40 Hand loss`)}},b=[`Active`,`Mastered`,`WithoutPreviousDiscard`,`WithLossReason`,`WithClassification`],h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    await clickStoryButtonExpectingCall(canvasElement, "Practice this", args.onPractice);
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    lossReason: "Crib"
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "Prev: Crib");
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    classification: mockTradeOffClassification
  },
  play: async ({
    canvasElement
  }) => {
    const badge = within(canvasElement).getByRole("note", {
      name: "Previous discard driven by 1.30 Crib gain does not cover 1.40 Hand loss"
    });
    await expect(badge).toBeVisible();
    await expect(badge).toHaveTextContent("Prev: Crib gain < Hand loss");
    await expect(badge).toHaveAttribute("title", "Previous discard (0.10 pts lost) driven by 1.30 Crib gain does not cover 1.40 Hand loss");
  }
}`,...y.parameters?.docs?.source}}}})))()}x();export{h as Active,g as Mastered,y as WithClassification,v as WithLossReason,_ as WithoutPreviousDiscard,b as __namedExportsOrder,m as default};