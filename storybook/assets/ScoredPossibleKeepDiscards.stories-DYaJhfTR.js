import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{f as t,t as n,u as r}from"./Card-atDF3gat.js";import{n as i,t as a}from"./SortOrder-CEtbOzlr.js";import{t as ee}from"./SortOrderName-CZNMd6op.js";import{a as te,d as o,f as s,l as ne,n as re,o as ie}from"./stories.common-ClFJeHpz.js";import{a as ae,c as oe,h as se,i as ce,l as le,m as ue,n as de,o as fe,r as pe,s as me,t as he,u as ge}from"./ScoredPossibleKeepDiscards-D5-Qcbv9.js";import{s as c,t as l}from"./expectedCribPoints-BcTYWPuV.js";import{D as _e,w as u}from"./classifyMistake-C-CRxSh1.js";import{c as ve,i as ye,l as be,o as xe,s as Se}from"./expectedTables-C_clywwe.js";var Ce,d,f;function we(){return(we=e((()=>{se(),me(),c(),`0`.repeat(64),ue({discardKey:`A_2_Suited`,role:l.Dealer,slot:`total`,starterRank:`K`}),oe({handKey:`A_2_3_4`,role:l.Dealer}),Ce=(e,t)=>function(n){Reflect.set(n,e,t)},d=()=>new Promise(e=>{setTimeout(e,0)}),f=e=>{let t=[];return{loadCount:()=>t.length,settled:async()=>{await Promise.all(t),await d()},source:{getUncertaintySync:()=>null,loadUncertainty:()=>{let n=d().then(()=>{if(e===`reject`)throw Error(`offline`);return null});return t.push(n.catch(()=>null)),n}}}},Ce(`policy_uncertainty`,.01)})))()}var p,m,h,g,_,v,Te,Ee,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,De,Oe,U,W,G,K,q,J,Y,X,Z,Q,ke;function $(){return($=e((()=>{Se(),ye(),r(),i(),te(),c(),ce(),_e(),de(),le(),ae(),we(),{expect:p,fireEvent:m,fn:h,waitFor:g,within:_}=__STORYBOOK_MODULE_TEST__,v=!1,Te=()=>v?(v=!1,Promise.reject(Error(`Fake load error`))):ve(),Ee={argTypes:re(`sortOrder`,ee),component:he,parameters:{layout:`centered`},tags:[`autodocs`],title:`ScoredPossibleKeepDiscards`},y=(e,t)=>({args:{cribRole:l.Dealer,dealtCards:e,onAnalysisRendered:h(),onScoreSortKeyChange:h(),scoreSortKey:u.ExpectedNetPoints,sortOrder:t}}),b=o([n.JACK,n.SIX,n.FIVE,n.FOUR,n.KING,n.QUEEN],[0,1]),x=y(b,a.Descending),S={...y(b,a.Ascending),args:{...y(b,a.Ascending).args,cribRole:l.Pone}},C=y(b,a.DealOrder),w={...x,play:ne},T={...w,play:ie},E={...T,args:{...T.args,cribRole:l.Pone}},D={...x,args:{...x.args,scoreSortKey:u.ExpectedHandPoints},play:async({canvasElement:e})=>{let t=_(e);await s(t);let n=await t.findByRole(`columnheader`,{name:/Hand/u});await p(n).toHaveAttribute(`aria-sort`,`descending`)}},O=e=>{let{textDecorationLine:t,textDecorationThickness:n}=getComputedStyle(e);return`${t} ${n===`auto`?`auto`:`set`}`},k=e=>{let t=getComputedStyle(e,`::before`),n=getComputedStyle(e,`::after`);return[t.content,n.content,n.borderTopStyle,n.borderBottomStyle,t.forcedColorAdjust,n.forcedColorAdjust].join(` `)},A=e=>{let[t,n]=e.querySelectorAll(`button > span`);return{arrow:n?k(n):``,underline:t?O(t):``}},j=async e=>(await s(_(e)),_(e).getAllByRole(`columnheader`).filter(e=>e.querySelector(`button`)!==null)),M=e=>{let t=e.querySelector(`button > span:last-child`),n=e=>{let n=getComputedStyle(t,e);return Math.round(100*parseFloat(n.top)/parseFloat(n.fontSize))/100};return[n(`::before`),n(`::after`)]},N=async(e,t)=>{let n=await j(e),r={arrow:`none none none none auto auto`,underline:`none auto`},i=n[2];await p(i).toHaveAttribute(`aria-sort`,t),await p(M(i)).toStrictEqual(t===`ascending`?[.6,.25]:[.25,.8]),await p(n.map(A)).toStrictEqual([r,r,{arrow:`"" "" ${t===`ascending`?`none solid`:`solid none`} none none`,underline:`underline set`},r,r])},P={...S,args:{...S.args,scoreSortKey:u.ExpectedHandAndCribPoints},play:({canvasElement:e})=>N(e,`descending`)},F={...P,args:{...P.args,analysisOrder:`ascending`},play:({canvasElement:e})=>N(e,`ascending`)},I=async(e,t)=>{let n=_(e);return await s(n),await g(async()=>{await p(e.querySelector(`figcaption`)).not.toBeNull()},{timeout:pe*2}),await p(e.querySelector(`figcaption`)).toHaveTextContent(t),n},L={...y(o(t(`9D,9C,9H,4C,4H,3S`),[0,5]),a.Descending),play:async({canvasElement:e})=>{let t=(await I(e,`Sub-optimal: 3.13 dealer, 0.00 pone`)).getByText(`0.00 pone`),n=window.getComputedStyle(t),r=t.parentElement;await p(n.textDecorationLine).toBe(`underline`),await p(n.textDecorationThickness).toBe(`2px`),await p(n.color).toBe(window.getComputedStyle(r).color)}},R=y(o(t(`KH,QS,10D,9C,6S,5H`),[0,4]),a.Descending),z={...R,args:{...R.args,cribRole:l.Pone},play:async({canvasElement:e})=>{let t=await I(e,`Sub-optimal: 0.77 pts lost`);await p(t.queryByText(/dealer/u)).toBeNull()}},B=f(`resolve`),V=B.source,H=async e=>(await ne(e),_(e.canvasElement)),De=/^\u00b1\d+\.\d\d$/u,Oe=/\u00b1\d+\.\d\d/u,U=async(e,t)=>{let n=await H(e);return await B.settled(),await g(async()=>{await p(n.queryAllByText(De)).toHaveLength(t)},{timeout:1e4}),n},W=(e,t,n)=>({...w,args:{...w.args,cribUncertaintySource:e,playUncertaintySource:t},play:async e=>{let t=await U(e,1);await p(t.getByRole(`button`,{name:n})).toHaveTextContent(Oe)}}),G=W(ge,V,/Crib avg/u),K=W(V,fe,/You - Opp/u),q={...w,args:{...w.args,cribUncertaintySource:V,playUncertaintySource:V},play:async e=>{let t=await U(e,0);await p(await t.findByText(/Crib avg/u)).toBeVisible()}},J={getUncertaintySync:()=>null,loadUncertainty:()=>Promise.resolve({totals:{get:()=>.25}})},Y=y(o(t(`4H,5D,KH,6H,8C,KC`),[2,5]),a.Descending),X={...Y,args:{...Y.args,cribRole:l.Dealer,cribUncertaintySource:J,playUncertaintySource:J},play:async({canvasElement:e})=>{let t=await I(e,`Within noise: 0.06 pts lost`);await p(t.queryByText(/Sub-optimal/u)).toBeNull()}},Z={...x,args:{...x.args,loadCribTable:Te},loaders:[()=>{v=!0,be(null),xe(null)}],play:async({canvasElement:e})=>{let t=_(e),n=await t.findByRole(`button`,{name:/Retry/u});await p(n).toBeVisible(),await m.click(n),await s(t)}},Q={...x,args:{...x.args,drillPreviousDiscard:`KC,QS`,isPracticeDrill:!0},play:async({canvasElement:e})=>{let t=_(e);await s(t);let n=await t.findByRole(`row`,{name:`Earlier drill discard`});await p(n).toHaveAttribute(`data-is-earlier-choice`,`true`),await p(n).toHaveAttribute(`id`,`drill-earlier-choice-row`)}},ke=[`JackSixFiveFourKingQueenSortedDescending`,`JackSixFiveFourKingQueenSortedAscending`,`JackSixFiveFourKingQueenSortedDealOrder`,`Expanded`,`DoubleExpanded`,`DoubleExpandedPone`,`SortedByHandPoints`,`SortedByHandAndCribPoints`,`WorstFirstByHandAndCribPoints`,`RoleLossPair`,`RoleLossWithheld`,`CribUncertainty`,`PlayUncertainty`,`UncertaintyUnavailable`,`WithinSimulationNoise`,`LoadError`,`InDrillReviewWithEarlierChoiceHighlighted`],x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.Descending)`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  ...createStory(dealtCards, SortOrder.Ascending),
  args: {
    ...createStory(dealtCards, SortOrder.Ascending).args,
    cribRole: CribRole.Pone
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.DealOrder)`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedDescending,
  play: playToggle
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  ...Expanded,
  play: playDoubleExpanded
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  ...DoubleExpanded,
  args: {
    ...DoubleExpanded.args,
    cribRole: CribRole.Pone
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedAscending,
  args: {
    ...JackSixFiveFourKingQueenSortedAscending.args,
    scoreSortKey: ScoredKeepDiscardSortKey.ExpectedHandAndCribPoints
  },
  play: ({
    canvasElement
  }) => assertHandAndCribMarker(canvasElement, "descending")
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  ...SortedByHandAndCribPoints,
  args: {
    ...SortedByHandAndCribPoints.args,
    analysisOrder: "ascending"
  },
  play: ({
    canvasElement
  }) => assertHandAndCribMarker(canvasElement, "ascending")
}`,...F.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  ...createStory(toDealtCards(parseHand("9D,9C,9H,4C,4H,3S"), [0, 5]), SortOrder.Descending),
  play: async ({
    canvasElement
  }) => {
    const canvas = await captionAfterLoad(canvasElement, "Sub-optimal: 3.13 dealer, 0.00 pone");

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
}`,...L.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  ...roleLossWithheldStory,
  args: {
    ...roleLossWithheldStory.args,
    cribRole: CribRole.Pone
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = await captionAfterLoad(canvasElement, "Sub-optimal: 0.77 pts lost");

    // The caption is on screen with its single figure, so the reversed-role clause is absent rather than simply not rendered.
    await expect(canvas.queryByText(/dealer/u)).toBeNull();
  }
}`,...z.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`figureStory(shippedCribUncertainty, NO_UNCERTAINTY, /Crib avg/u)`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`figureStory(NO_UNCERTAINTY, shippedPlayUncertainty, /You - Opp/u)`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
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
    const canvas = await captionAfterLoad(canvasElement, "Within noise: 0.06 pts lost");
    await expect(canvas.queryByText(/Sub-optimal/u)).toBeNull();
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
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
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}}})))()}$();export{G as CribUncertainty,T as DoubleExpanded,E as DoubleExpandedPone,w as Expanded,Q as InDrillReviewWithEarlierChoiceHighlighted,S as JackSixFiveFourKingQueenSortedAscending,C as JackSixFiveFourKingQueenSortedDealOrder,x as JackSixFiveFourKingQueenSortedDescending,Z as LoadError,K as PlayUncertainty,L as RoleLossPair,z as RoleLossWithheld,P as SortedByHandAndCribPoints,D as SortedByHandPoints,q as UncertaintyUnavailable,X as WithinSimulationNoise,F as WorstFirstByHandAndCribPoints,ke as __namedExportsOrder,Ee as default};