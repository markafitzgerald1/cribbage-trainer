import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{a as t,i as n}from"./SortOrderName-DnS2ytQU.js";import{i as r,r as i,t as a}from"./stories.common-DNls5WNy.js";import{a as o,i as s,o as c,r as l}from"./mistakeQueue.test.common-DRRIb2jI.js";import{n as u,t as d}from"./MistakeQueueItemCard-CtL3PBMt.js";var f,p,m,h,g,_,v,y,b,x,S;function C(){return(C=e((()=>{r(),l(),u(),t(),{expect:f,fn:p,within:m}=__STORYBOOK_MODULE_TEST__,h={args:{item:s,onPractice:p(),sortOrder:n.DealOrder},component:d,parameters:{layout:`centered`},tags:[`autodocs`],title:`MistakeQueueItemCard`},g={play:async({args:e,canvasElement:t})=>{await a(t,`Practice this`,e.onPractice)}},_={args:{item:{...s,consecutiveSuccesses:2,isMastered:!0,lossQuantile:`high`}},play:async({canvasElement:e})=>{await i(e,`Mastered`)}},v={args:{item:{...s,lossQuantile:null,previousDiscard:null}},play:async({canvasElement:e})=>{await i(e,`Previous choice not recorded`)}},y={args:{lossReason:`Crib`},play:async({canvasElement:e})=>{await i(e,`Prev: Crib`)}},b={args:{classification:c,item:o},play:async({canvasElement:e})=>{let t=m(e),n=t.getByRole(`note`,{name:`Previous discard cost 1.00 points lost as dealer, 0.00 as pone`});await f(n).toBeVisible(),await f(n).toHaveTextContent(`1.00 as dealer, 0.00 as pone`),await f(t.getByText(`Prev: Crib gain < Hand loss`)).toBeVisible()}},x={args:{classification:c},play:async({canvasElement:e})=>{let t=m(e).getByRole(`note`,{name:`Previous discard driven by 1.30 Crib gain does not cover 1.40 Hand loss`});await f(t).toBeVisible(),await f(t).toHaveTextContent(`Prev: Crib gain < Hand loss`),await f(t).toHaveAttribute(`title`,`Previous discard (0.10 pts lost) driven by 1.30 Crib gain does not cover 1.40 Hand loss`)}},S=[`Active`,`Mastered`,`WithoutPreviousDiscard`,`WithLossReason`,`WithRoleLossPair`,`WithClassification`],g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    await clickStoryButtonExpectingCall(canvasElement, "Practice this", args.onPractice);
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    lossReason: "Crib"
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "Prev: Crib");
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    classification: mockTradeOffClassification,
    item: mockItemWithRoleLossPair
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const pair = canvas.getByRole("note", {
      name: "Previous discard cost 1.00 points lost as dealer, 0.00 as pone"
    });
    await expect(pair).toBeVisible();
    await expect(pair).toHaveTextContent("1.00 as dealer, 0.00 as pone");
    await expect(canvas.getByText("Prev: Crib gain < Hand loss")).toBeVisible();
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}}})))()}C();export{g as Active,_ as Mastered,x as WithClassification,y as WithLossReason,b as WithRoleLossPair,v as WithoutPreviousDiscard,S as __namedExportsOrder,h as default};