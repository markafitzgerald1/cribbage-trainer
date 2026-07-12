import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{f as t,t as n,u as r}from"./Card-atDF3gat.js";import{n as ee,t as i}from"./SortOrder-CEtbOzlr.js";import{t as te}from"./SortOrderName-CZNMd6op.js";import{a as ne,d as a,f as o,l as s,n as re,o as ie}from"./stories.common-ClFJeHpz.js";import{c,u as ae}from"./classifyMistake-C1n_ZRH3.js";import{s as l,t as u}from"./expectedCribPoints-BcTYWPuV.js";import{c as oe,i as se,l as ce,o as le,s as ue}from"./expectedTables-WcBSp9qY.js";import{a as d,c as de,d as fe,f as pe,i as me,l as he,n as ge,o as _e,r as ve,s as ye,t as be,u as f}from"./ScoredPossibleKeepDiscards-D4C_r7Su.js";var p,m;function h(){return(h=e((()=>{f(),d(),l(),`0`.repeat(64),he({discardKey:`A_2_Suited`,role:u.Dealer,slot:`total`,starterRank:`K`}),_e({handKey:`A_2_3_4`,role:u.Dealer}),p=()=>new Promise(e=>{setTimeout(e,0)}),m=e=>{let t=[];return{loadCount:()=>t.length,settled:async()=>{await Promise.all(t),await p()},source:{getUncertaintySync:()=>null,loadUncertainty:()=>{let n=p().then(()=>{if(e===`reject`)throw Error(`offline`);return null});return t.push(n.catch(()=>null)),n}}}}})))()}var g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q;function $(){return($=e((()=>{ue(),se(),r(),ee(),ne(),l(),pe(),ae(),ge(),ye(),ve(),h(),{expect:g,fireEvent:_,fn:v,waitFor:y,within:b}=__STORYBOOK_MODULE_TEST__,x=!1,S=()=>x?(x=!1,Promise.reject(Error(`Fake load error`))):oe(),C={argTypes:re(`sortOrder`,te),component:be,parameters:{layout:`centered`},tags:[`autodocs`],title:`ScoredPossibleKeepDiscards`},w=(e,t)=>({args:{cribRole:u.Dealer,dealtCards:e,onAnalysisRendered:v(),onScoreSortKeyChange:v(),scoreSortKey:c.ExpectedNetPoints,sortOrder:t}}),T=a([n.JACK,n.SIX,n.FIVE,n.FOUR,n.KING,n.QUEEN],[0,1]),E=w(T,i.Descending),D={...w(T,i.Ascending),args:{...w(T,i.Ascending).args,cribRole:u.Pone}},O=w(T,i.DealOrder),k={...E,play:s},A={...k,play:ie},j={...A,args:{...A.args,cribRole:u.Pone}},M={...E,args:{...E.args,scoreSortKey:c.ExpectedHandPoints},play:async({canvasElement:e})=>{let t=b(e);await o(t);let n=await t.findByRole(`columnheader`,{name:/Hand/u});await g(n).toHaveAttribute(`aria-sort`,`descending`)}},N=async(e,t)=>{let n=b(e);return await o(n),await y(async()=>{await g(e.querySelector(`figcaption`)).not.toBeNull()},{timeout:fe*2}),await g(e.querySelector(`figcaption`)).toHaveTextContent(t),n},P={...w(a(t(`9D,9C,9H,4C,4H,3S`),[0,5]),i.Descending),play:async({canvasElement:e})=>{let t=(await N(e,`Sub-optimal: 3.11 dealer, 0.00 pone`)).getByText(`0.00 pone`),n=window.getComputedStyle(t),r=t.parentElement;await g(n.textDecorationLine).toBe(`underline`),await g(n.textDecorationThickness).toBe(`2px`),await g(n.color).toBe(window.getComputedStyle(r).color)}},F=w(a(t(`KH,QS,10D,9C,6S,5H`),[0,4]),i.Descending),I={...F,args:{...F.args,cribRole:u.Pone},play:async({canvasElement:e})=>{let t=await N(e,`Sub-optimal: 0.82 pts lost`);await g(t.queryByText(/dealer/u)).toBeNull()}},L=m(`resolve`),R=L.source,z=async e=>(await s(e),b(e.canvasElement)),B=/^\u00b1\d+\.\d\d$/u,V=/\u00b1\d+\.\d\d/u,H=async(e,t)=>{let n=await z(e);return await L.settled(),await y(async()=>{await g(n.queryAllByText(B)).toHaveLength(t)},{timeout:1e4}),n},U=(e,t,n)=>({...k,args:{...k.args,cribUncertaintySource:e,playUncertaintySource:t},play:async e=>{let t=await H(e,1);await g(t.getByRole(`button`,{name:n})).toHaveTextContent(V)}}),W=U(de,R,/Crib avg/u),G=U(R,me,/You - Opp/u),K={...k,args:{...k.args,cribUncertaintySource:R,playUncertaintySource:R},play:async e=>{let t=await H(e,0);await g(await t.findByText(/Crib avg/u)).toBeVisible()}},q={getUncertaintySync:()=>null,loadUncertainty:()=>Promise.resolve({totals:{get:()=>.25}})},J=w(a(t(`4H,5D,KH,6H,8C,KC`),[2,5]),i.Descending),Y={...J,args:{...J.args,cribRole:u.Dealer,cribUncertaintySource:q,playUncertaintySource:q},play:async({canvasElement:e})=>{let t=await N(e,`Within noise: 0.09 pts lost`);await g(t.queryByText(/Sub-optimal/u)).toBeNull()}},X={...E,args:{...E.args,loadCribTable:S},loaders:[()=>{x=!0,ce(null),le(null)}],play:async({canvasElement:e})=>{let t=b(e),n=await t.findByRole(`button`,{name:/Retry/u});await g(n).toBeVisible(),await _.click(n),await o(t)}},Z={...E,args:{...E.args,drillPreviousDiscard:`KC,QS`,isPracticeDrill:!0},play:async({canvasElement:e})=>{let t=b(e);await o(t);let n=await t.findByRole(`row`,{name:`Earlier drill discard`});await g(n).toHaveAttribute(`data-is-earlier-choice`,`true`),await g(n).toHaveAttribute(`id`,`drill-earlier-choice-row`)}},Q=[`JackSixFiveFourKingQueenSortedDescending`,`JackSixFiveFourKingQueenSortedAscending`,`JackSixFiveFourKingQueenSortedDealOrder`,`Expanded`,`DoubleExpanded`,`DoubleExpandedPone`,`SortedByHandPoints`,`RoleLossPair`,`RoleLossWithheld`,`CribUncertainty`,`PlayUncertainty`,`UncertaintyUnavailable`,`WithinSimulationNoise`,`LoadError`,`InDrillReviewWithEarlierChoiceHighlighted`],E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.Descending)`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  ...createStory(dealtCards, SortOrder.Ascending),
  args: {
    ...createStory(dealtCards, SortOrder.Ascending).args,
    cribRole: CribRole.Pone
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.DealOrder)`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedDescending,
  play: playToggle
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  ...Expanded,
  play: playDoubleExpanded
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  ...DoubleExpanded,
  args: {
    ...DoubleExpanded.args,
    cribRole: CribRole.Pone
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  ...createStory(toDealtCards(parseHand("9D,9C,9H,4C,4H,3S"), [0, 5]), SortOrder.Descending),
  play: async ({
    canvasElement
  }) => {
    const canvas = await captionAfterLoad(canvasElement, "Sub-optimal: 3.11 dealer, 0.00 pone");

    /*
     * Assert what the reader sees rather than the class that produced it.
     * The underline is now the whole mark, so its thickness is pinned too:
     * the browser default is thinner and would satisfy a bare "underline"
     * while reading as a quirk of the font. The color is pinned to the
     * badge's own, because a brighter one here outshouted the figure that
     * matters — the cost under the role actually held.
     */
    const figure = canvas.getByText("0.00 pone");
    const rendered = window.getComputedStyle(figure);
    const badge = figure.parentElement as HTMLElement;
    await expect(rendered.textDecorationLine).toBe("underline");
    await expect(rendered.textDecorationThickness).toBe("2px");
    await expect(rendered.color).toBe(window.getComputedStyle(badge).color);
  }
}`,...P.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  ...roleLossWithheldStory,
  args: {
    ...roleLossWithheldStory.args,
    cribRole: CribRole.Pone
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = await captionAfterLoad(canvasElement, "Sub-optimal: 0.82 pts lost");

    // The caption is on screen with its single figure, so the reversed-role clause is absent rather than simply not rendered.
    await expect(canvas.queryByText(/dealer/u)).toBeNull();
  }
}`,...I.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`figureStory(shippedCribUncertainty, NO_UNCERTAINTY, /Crib avg/u)`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`figureStory(NO_UNCERTAINTY, shippedPlayUncertainty, /You - Opp/u)`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  ...Expanded,
  args: {
    ...Expanded.args,
    cribUncertaintySource: NO_UNCERTAINTY,
    playUncertaintySource: NO_UNCERTAINTY
  },
  play: async context => {
    const canvas = await expandedWithFigures(context, 0);
    await expect(await canvas.findByText(/Crib avg/u)).toBeVisible();
  }
}`,...K.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  ...withinNoiseStory,
  args: {
    ...withinNoiseStory.args,
    cribRole: CribRole.Dealer,
    cribUncertaintySource: WIDE_NOISE,
    playUncertaintySource: WIDE_NOISE
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = await captionAfterLoad(canvasElement, "Within noise: 0.09 pts lost");
    await expect(canvas.queryByText(/Sub-optimal/u)).toBeNull();
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
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
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedDescending,
  args: {
    ...JackSixFiveFourKingQueenSortedDescending.args,
    drillPreviousDiscard: "KC,QS",
    isPracticeDrill: true
  },
  play: async ({
    canvasElement
  }) => {
    const tableScope = within(canvasElement);
    await waitForLoadingToDisappear(tableScope);
    const row = await tableScope.findByRole("row", {
      name: "Earlier drill discard"
    });
    await expect(row).toHaveAttribute("data-is-earlier-choice", "true");
    await expect(row).toHaveAttribute("id", "drill-earlier-choice-row");
  }
}`,...Z.parameters?.docs?.source}}}})))()}$();export{W as CribUncertainty,A as DoubleExpanded,j as DoubleExpandedPone,k as Expanded,Z as InDrillReviewWithEarlierChoiceHighlighted,D as JackSixFiveFourKingQueenSortedAscending,O as JackSixFiveFourKingQueenSortedDealOrder,E as JackSixFiveFourKingQueenSortedDescending,X as LoadError,G as PlayUncertainty,P as RoleLossPair,I as RoleLossWithheld,M as SortedByHandPoints,K as UncertaintyUnavailable,Y as WithinSimulationNoise,Q as __namedExportsOrder,C as default};