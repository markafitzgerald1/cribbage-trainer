import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{f as t,r as n}from"./CardLabel-BxaxW3FO.js";import{i as r,t as i}from"./SortOrderName-DnS2ytQU.js";import{a,c as o,d as s,i as c,n as l,u}from"./stories.common-DNls5WNy.js";import{o as d,t as f}from"./expectedCribPoints-DGUMH8-7.js";import{d as p,p as m}from"./classifyMistake-B7VCXP1m.js";import{c as h,i as g,n as _,o as v,s as y}from"./expectedPlayPointsTableLoader-xanysxem.js";import{n as b,t as x}from"./ScoredPossibleKeepDiscards-BMo6B_XX.js";var S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z;function B(){return(B=e((()=>{v(),_(),c(),t(),d(),m(),b(),{expect:S,fireEvent:C,fn:w,within:T}=__STORYBOOK_MODULE_TEST__,E=!1,D=()=>E?(E=!1,Promise.reject(Error(`Fake load error`))):y(),O={argTypes:l(`sortOrder`,i),component:x,parameters:{layout:`centered`},tags:[`autodocs`],title:`ScoredPossibleKeepDiscards`},k=(e,t)=>({args:{cribRole:f.Dealer,dealtCards:e,onAnalysisRendered:w(),onScoreSortKeyChange:w(),scoreSortKey:p.ExpectedNetPoints,sortOrder:t}}),A=u([n.JACK,n.SIX,n.FIVE,n.FOUR,n.KING,n.QUEEN],[0,1]),j=k(A,r.Descending),M={...k(A,r.Ascending),args:{...k(A,r.Ascending).args,cribRole:f.Pone}},N=k(A,r.DealOrder),P={...j,play:o},F={...P,play:a},I={...F,args:{...F.args,cribRole:f.Pone}},L={...j,args:{...j.args,scoreSortKey:p.ExpectedHandPoints},play:async({canvasElement:e})=>{let t=T(e);await s(t);let n=await t.findByRole(`columnheader`,{name:/Hand/u});await S(n).toHaveAttribute(`aria-sort`,`descending`)}},R={...j,args:{...j.args,loadCribTable:D},loaders:[()=>{E=!0,h(null),g(null)}],play:async({canvasElement:e})=>{let t=T(e),n=await t.findByRole(`button`,{name:/Retry/u});await S(n).toBeVisible(),await C.click(n),await s(t)}},z=[`JackSixFiveFourKingQueenSortedDescending`,`JackSixFiveFourKingQueenSortedAscending`,`JackSixFiveFourKingQueenSortedDealOrder`,`Expanded`,`DoubleExpanded`,`DoubleExpandedPone`,`SortedByHandPoints`,`LoadError`],j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.Descending)`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  ...createStory(dealtCards, SortOrder.Ascending),
  args: {
    ...createStory(dealtCards, SortOrder.Ascending).args,
    cribRole: CribRole.Pone
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.DealOrder)`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedDescending,
  play: playToggle
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  ...Expanded,
  play: playDoubleExpanded
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  ...DoubleExpanded,
  args: {
    ...DoubleExpanded.args,
    cribRole: CribRole.Pone
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedDescending,
  args: {
    ...JackSixFiveFourKingQueenSortedDescending.args,
    scoreSortKey: ScoredKeepDiscardSortKey.ExpectedHandPoints
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await waitForLoadingToDisappear(canvas);
    const handHeader = await canvas.findByRole("columnheader", {
      name: /Hand/u
    });
    await expect(handHeader).toHaveAttribute("aria-sort", "descending");
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedDescending,
  args: {
    ...JackSixFiveFourKingQueenSortedDescending.args,
    loadCribTable: failOnceLoader
  },
  loaders: [() => {
    failNextLoad = true;
    cribLoader.setTableSync(null);
    playLoader.setTableSync(null);
  }],
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const retryButton = await canvas.findByRole("button", {
      name: /Retry/u
    });
    await expect(retryButton).toBeVisible();
    await fireEvent.click(retryButton);
    await waitForLoadingToDisappear(canvas);
  }
}`,...R.parameters?.docs?.source}}}})))()}B();export{F as DoubleExpanded,I as DoubleExpandedPone,P as Expanded,M as JackSixFiveFourKingQueenSortedAscending,N as JackSixFiveFourKingQueenSortedDealOrder,j as JackSixFiveFourKingQueenSortedDescending,R as LoadError,L as SortedByHandPoints,z as __namedExportsOrder,O as default};