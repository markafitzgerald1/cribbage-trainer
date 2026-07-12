import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{f as t,t as n,u as r}from"./Card-atDF3gat.js";import{n as i,t as a}from"./SortOrder-CEtbOzlr.js";import{t as ee}from"./SortOrderName-CZNMd6op.js";import{a as te,d as o,f as s,l as c,n as ne,o as re}from"./stories.common-ClFJeHpz.js";import{a as ie,c as ae,h as oe,i as se,l as ce,m as le,n as ue,o as de,r as fe,s as pe,t as me,u as he}from"./ScoredPossibleKeepDiscards-B2M5b8GM.js";import{s as ge,t as l}from"./expectedCribPoints-BcTYWPuV.js";import{D as _e,w as u}from"./classifyMistake-C-CRxSh1.js";import{c as ve,i as ye,l as be,o as xe,s as Se}from"./expectedTables-B3tc3fXU.js";var d,f;function p(){return(p=e((()=>{oe(),pe(),ge(),`0`.repeat(64),le({discardKey:`A_2_Suited`,role:l.Dealer,slot:`total`,starterRank:`K`}),ae({handKey:`A_2_3_4`,role:l.Dealer}),d=()=>new Promise(e=>{setTimeout(e,0)}),f=e=>{let t=[];return{loadCount:()=>t.length,settled:async()=>{await Promise.all(t),await d()},source:{getUncertaintySync:()=>null,loadUncertainty:()=>{let n=d().then(()=>{if(e===`reject`)throw Error(`offline`);return null});return t.push(n.catch(()=>null)),n}}}}})))()}var m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,Ce,F,I,L,R,z,B,V,H,U,we,Te,Ee,W,G,K,q,J,Y,X,Z,Q,$,De;function Oe(){return(Oe=e((()=>{Se(),ye(),r(),i(),te(),ge(),se(),_e(),ue(),ce(),ie(),p(),{expect:m,fireEvent:h,fn:g,waitFor:_,within:v}=__STORYBOOK_MODULE_TEST__,y=!1,b=()=>y?(y=!1,Promise.reject(Error(`Fake load error`))):ve(),x={argTypes:ne(`sortOrder`,ee),component:me,parameters:{layout:`centered`},tags:[`autodocs`],title:`ScoredPossibleKeepDiscards`},S=(e,t)=>({args:{cribRole:l.Dealer,dealtCards:e,onAnalysisRendered:g(),onScoreSortKeyChange:g(),scoreSortKey:u.ExpectedNetPoints,sortOrder:t}}),C=o([n.JACK,n.SIX,n.FIVE,n.FOUR,n.KING,n.QUEEN],[0,1]),w=S(C,a.Descending),T={...S(C,a.Ascending),args:{...S(C,a.Ascending).args,cribRole:l.Pone}},E=S(C,a.DealOrder),D={...w,play:c},O={...D,play:re},k={...O,args:{...O.args,cribRole:l.Pone}},A={...w,args:{...w.args,scoreSortKey:u.ExpectedHandPoints},play:async({canvasElement:e})=>{let t=v(e);await s(t);let n=await t.findByRole(`columnheader`,{name:/Hand/u});await m(n).toHaveAttribute(`aria-sort`,`descending`)}},j=e=>{let{textDecorationLine:t,textDecorationThickness:n}=getComputedStyle(e);return`${t} ${n===`auto`?`auto`:`set`}`},M=e=>{let t=getComputedStyle(e,`::before`),n=getComputedStyle(e,`::after`);return[t.content,n.content,n.borderTopStyle,n.borderBottomStyle,t.forcedColorAdjust,n.forcedColorAdjust].join(` `)},N=e=>{let[t,n]=e.querySelectorAll(`button > span`);return{arrow:n?M(n):``,underline:t?j(t):``}},P=async e=>(await s(v(e)),v(e).getAllByRole(`columnheader`).filter(e=>e.querySelector(`button`)!==null)),Ce=e=>{let t=e.querySelector(`button > span:last-child`),n=e=>{let n=getComputedStyle(t,e);return Math.round(100*parseFloat(n.top)/parseFloat(n.fontSize))/100};return[n(`::before`),n(`::after`)]},F=async(e,t)=>{let n=await P(e),r={arrow:`none none none none auto auto`,underline:`none auto`},i=n[2];await m(i).toHaveAttribute(`aria-sort`,t),await m(Ce(i)).toStrictEqual(t===`ascending`?[.6,.25]:[.25,.8]),await m(n.map(N)).toStrictEqual([r,r,{arrow:`"" "" ${t===`ascending`?`none solid`:`solid none`} none none`,underline:`underline set`},r,r])},I={...T,args:{...T.args,scoreSortKey:u.ExpectedHandAndCribPoints},play:({canvasElement:e})=>F(e,`descending`)},L={...I,args:{...I.args,analysisOrder:`ascending`},play:({canvasElement:e})=>F(e,`ascending`)},R=async(e,t)=>{let n=v(e);return await s(n),await _(async()=>{await m(e.querySelector(`figcaption`)).not.toBeNull()},{timeout:fe*2}),await m(e.querySelector(`figcaption`)).toHaveTextContent(t),n},z={...S(o(t(`9D,9C,9H,4C,4H,3S`),[0,5]),a.Descending),play:async({canvasElement:e})=>{let t=(await R(e,`Sub-optimal: 3.11 dealer, 0.00 pone`)).getByText(`0.00 pone`),n=window.getComputedStyle(t),r=t.parentElement;await m(n.textDecorationLine).toBe(`underline`),await m(n.textDecorationThickness).toBe(`2px`),await m(n.color).toBe(window.getComputedStyle(r).color)}},B=S(o(t(`KH,QS,10D,9C,6S,5H`),[0,4]),a.Descending),V={...B,args:{...B.args,cribRole:l.Pone},play:async({canvasElement:e})=>{let t=await R(e,`Sub-optimal: 0.82 pts lost`);await m(t.queryByText(/dealer/u)).toBeNull()}},H=f(`resolve`),U=H.source,we=async e=>(await c(e),v(e.canvasElement)),Te=/^\u00b1\d+\.\d\d$/u,Ee=/\u00b1\d+\.\d\d/u,W=async(e,t)=>{let n=await we(e);return await H.settled(),await _(async()=>{await m(n.queryAllByText(Te)).toHaveLength(t)},{timeout:1e4}),n},G=(e,t,n)=>({...D,args:{...D.args,cribUncertaintySource:e,playUncertaintySource:t},play:async e=>{let t=await W(e,1);await m(t.getByRole(`button`,{name:n})).toHaveTextContent(Ee)}}),K=G(he,U,/Crib avg/u),q=G(U,de,/You - Opp/u),J={...D,args:{...D.args,cribUncertaintySource:U,playUncertaintySource:U},play:async e=>{let t=await W(e,0);await m(await t.findByText(/Crib avg/u)).toBeVisible()}},Y={getUncertaintySync:()=>null,loadUncertainty:()=>Promise.resolve({totals:{get:()=>.25}})},X=S(o(t(`4H,5D,KH,6H,8C,KC`),[2,5]),a.Descending),Z={...X,args:{...X.args,cribRole:l.Dealer,cribUncertaintySource:Y,playUncertaintySource:Y},play:async({canvasElement:e})=>{let t=await R(e,`Within noise: 0.09 pts lost`);await m(t.queryByText(/Sub-optimal/u)).toBeNull()}},Q={...w,args:{...w.args,loadCribTable:b},loaders:[()=>{y=!0,be(null),xe(null)}],play:async({canvasElement:e})=>{let t=v(e),n=await t.findByRole(`button`,{name:/Retry/u});await m(n).toBeVisible(),await h.click(n),await s(t)}},$={...w,args:{...w.args,drillPreviousDiscard:`KC,QS`,isPracticeDrill:!0},play:async({canvasElement:e})=>{let t=v(e);await s(t);let n=await t.findByRole(`row`,{name:`Earlier drill discard`});await m(n).toHaveAttribute(`data-is-earlier-choice`,`true`),await m(n).toHaveAttribute(`id`,`drill-earlier-choice-row`)}},De=[`JackSixFiveFourKingQueenSortedDescending`,`JackSixFiveFourKingQueenSortedAscending`,`JackSixFiveFourKingQueenSortedDealOrder`,`Expanded`,`DoubleExpanded`,`DoubleExpandedPone`,`SortedByHandPoints`,`SortedByHandAndCribPoints`,`WorstFirstByHandAndCribPoints`,`RoleLossPair`,`RoleLossWithheld`,`CribUncertainty`,`PlayUncertainty`,`UncertaintyUnavailable`,`WithinSimulationNoise`,`LoadError`,`InDrillReviewWithEarlierChoiceHighlighted`],w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.Descending)`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  ...createStory(dealtCards, SortOrder.Ascending),
  args: {
    ...createStory(dealtCards, SortOrder.Ascending).args,
    cribRole: CribRole.Pone
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.DealOrder)`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedDescending,
  play: playToggle
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  ...Expanded,
  play: playDoubleExpanded
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  ...DoubleExpanded,
  args: {
    ...DoubleExpanded.args,
    cribRole: CribRole.Pone
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
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
}`,...A.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedAscending,
  args: {
    ...JackSixFiveFourKingQueenSortedAscending.args,
    scoreSortKey: ScoredKeepDiscardSortKey.ExpectedHandAndCribPoints
  },
  play: ({
    canvasElement
  }) => assertHandAndCribMarker(canvasElement, "descending")
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  ...SortedByHandAndCribPoints,
  args: {
    ...SortedByHandAndCribPoints.args,
    analysisOrder: "ascending"
  },
  play: ({
    canvasElement
  }) => assertHandAndCribMarker(canvasElement, "ascending")
}`,...L.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
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
}`,...z.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`figureStory(shippedCribUncertainty, NO_UNCERTAINTY, /Crib avg/u)`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`figureStory(NO_UNCERTAINTY, shippedPlayUncertainty, /You - Opp/u)`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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
}`,...J.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
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
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
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
}`,...$.parameters?.docs?.source}}}})))()}Oe();export{K as CribUncertainty,O as DoubleExpanded,k as DoubleExpandedPone,D as Expanded,$ as InDrillReviewWithEarlierChoiceHighlighted,T as JackSixFiveFourKingQueenSortedAscending,E as JackSixFiveFourKingQueenSortedDealOrder,w as JackSixFiveFourKingQueenSortedDescending,Q as LoadError,q as PlayUncertainty,z as RoleLossPair,V as RoleLossWithheld,I as SortedByHandAndCribPoints,A as SortedByHandPoints,J as UncertaintyUnavailable,Z as WithinSimulationNoise,L as WorstFirstByHandAndCribPoints,De as __namedExportsOrder,x as default};