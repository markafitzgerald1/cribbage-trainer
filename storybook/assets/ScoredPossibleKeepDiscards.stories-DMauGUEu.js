import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{f as t,m as n,r}from"./CardLabel-BxaxW3FO.js";import{i,t as ee}from"./SortOrderName-DnS2ytQU.js";import{a as te,c as a,d as o,i as ne,n as re,u as s}from"./stories.common-DNls5WNy.js";import{s as c,t as l}from"./expectedCribPoints-Bw5cFIcJ.js";import{c as u,u as d}from"./classifyMistake-xWy0NnkA.js";import{c as ie,i as ae,l as oe,o as se,s as ce}from"./expectedTables-CsCzKi7k.js";import{a as le,c as f,i as p,l as m,n as h,o as ue,r as g,s as de,t as fe,u as pe}from"./ScoredPossibleKeepDiscards-B-s6983m.js";var _,v;function y(){return(y=e((()=>{pe(),le(),c(),`0`.repeat(64),m({discardKey:`A_2_Suited`,role:l.Dealer,slot:`total`,starterRank:`K`}),ue({handKey:`A_2_3_4`,role:l.Dealer}),_=()=>new Promise(e=>{setTimeout(e,0)}),v=e=>{let t=[];return{loadCount:()=>t.length,settled:async()=>{await Promise.all(t),await _()},source:{getUncertaintySync:()=>null,loadUncertainty:()=>{let n=_().then(()=>{if(e===`reject`)throw Error(`offline`);return null});return t.push(n.catch(()=>null)),n}}}}})))()}var b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q;function $(){return($=e((()=>{ce(),ae(),t(),ne(),c(),d(),h(),de(),g(),y(),{expect:b,fireEvent:x,fn:S,waitFor:C,within:w}=__STORYBOOK_MODULE_TEST__,T=!1,E=()=>T?(T=!1,Promise.reject(Error(`Fake load error`))):ie(),D={argTypes:re(`sortOrder`,ee),component:fe,parameters:{layout:`centered`},tags:[`autodocs`],title:`ScoredPossibleKeepDiscards`},O=(e,t)=>({args:{cribRole:l.Dealer,dealtCards:e,onAnalysisRendered:S(),onScoreSortKeyChange:S(),scoreSortKey:u.ExpectedNetPoints,sortOrder:t}}),k=s([r.JACK,r.SIX,r.FIVE,r.FOUR,r.KING,r.QUEEN],[0,1]),A=O(k,i.Descending),j={...O(k,i.Ascending),args:{...O(k,i.Ascending).args,cribRole:l.Pone}},M=O(k,i.DealOrder),N={...A,play:a},P={...N,play:te},F={...P,args:{...P.args,cribRole:l.Pone}},I={...A,args:{...A.args,scoreSortKey:u.ExpectedHandPoints},play:async({canvasElement:e})=>{let t=w(e);await o(t);let n=await t.findByRole(`columnheader`,{name:/Hand/u});await b(n).toHaveAttribute(`aria-sort`,`descending`)}},L=async(e,t)=>{let n=w(e);await o(n);let r=e.querySelector(`figcaption`);return await b(r).not.toBeNull(),await b(r).toHaveTextContent(t),n},R={...O(s(n(`9D,9C,9H,4C,4H,3S`),[0,5]),i.Descending),play:async({canvasElement:e})=>{let t=(await L(e,`Sub-optimal: 3.11 as dealer, 0.00 as pone`)).getByText(`0.00 as pone`),n=window.getComputedStyle(t),r=t.parentElement;await b(n.textDecorationLine).toBe(`underline`),await b(n.textDecorationThickness).toBe(`2px`),await b(n.color).toBe(window.getComputedStyle(r).color)}},z=O(s(n(`KH,QS,10D,9C,6S,5H`),[0,4]),i.Descending),B={...z,args:{...z.args,cribRole:l.Pone},play:async({canvasElement:e})=>{let t=await L(e,`Sub-optimal: 0.82 pts lost`);await b(t.queryByText(/as dealer/u)).toBeNull()}},V=v(`resolve`),H=V.source,U=async e=>(await a(e),w(e.canvasElement)),W=/^\u00b1\d+\.\d\d$/u,G=/\u00b1\d+\.\d\d/u,K=async(e,t)=>{let n=await U(e);return await V.settled(),await C(async()=>{await b(n.queryAllByText(W)).toHaveLength(t)},{timeout:1e4}),n},q=(e,t,n)=>({...N,args:{...N.args,cribUncertaintySource:e,playUncertaintySource:t},play:async e=>{let t=await K(e,1);await b(t.getByRole(`button`,{name:n})).toHaveTextContent(G)}}),J=q(f,H,/Crib avg/u),Y=q(H,p,/You - Opp/u),X={...N,args:{...N.args,cribUncertaintySource:H,playUncertaintySource:H},play:async e=>{let t=await K(e,0);await b(await t.findByText(/Crib avg/u)).toBeVisible()}},Z={...A,args:{...A.args,loadCribTable:E},loaders:[()=>{T=!0,oe(null),se(null)}],play:async({canvasElement:e})=>{let t=w(e),n=await t.findByRole(`button`,{name:/Retry/u});await b(n).toBeVisible(),await x.click(n),await o(t)}},Q=[`JackSixFiveFourKingQueenSortedDescending`,`JackSixFiveFourKingQueenSortedAscending`,`JackSixFiveFourKingQueenSortedDealOrder`,`Expanded`,`DoubleExpanded`,`DoubleExpandedPone`,`SortedByHandPoints`,`RoleLossPair`,`RoleLossWithheld`,`CribUncertainty`,`PlayUncertainty`,`UncertaintyUnavailable`,`LoadError`],A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.Descending)`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  ...createStory(dealtCards, SortOrder.Ascending),
  args: {
    ...createStory(dealtCards, SortOrder.Ascending).args,
    cribRole: CribRole.Pone
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`createStory(dealtCards, SortOrder.DealOrder)`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourKingQueenSortedDescending,
  play: playToggle
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  ...Expanded,
  play: playDoubleExpanded
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  ...DoubleExpanded,
  args: {
    ...DoubleExpanded.args,
    cribRole: CribRole.Pone
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
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
}`,...I.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  ...createStory(toDealtCards(parseHand("9D,9C,9H,4C,4H,3S"), [0, 5]), SortOrder.Descending),
  play: async ({
    canvasElement
  }) => {
    const canvas = await captionAfterLoad(canvasElement, "Sub-optimal: 3.11 as dealer, 0.00 as pone");

    /*
     * Assert what the reader sees rather than the class that produced it.
     * The underline is now the whole mark, so its thickness is pinned too:
     * the browser default is thinner and would satisfy a bare "underline"
     * while reading as a quirk of the font. The color is pinned to the
     * badge's own, because a brighter one here outshouted the figure that
     * matters — the cost under the role actually held.
     */
    const figure = canvas.getByText("0.00 as pone");
    const rendered = window.getComputedStyle(figure);
    const badge = figure.parentElement as HTMLElement;
    await expect(rendered.textDecorationLine).toBe("underline");
    await expect(rendered.textDecorationThickness).toBe("2px");
    await expect(rendered.color).toBe(window.getComputedStyle(badge).color);
  }
}`,...R.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
    await expect(canvas.queryByText(/as dealer/u)).toBeNull();
  }
}`,...B.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`figureStory(shippedCribUncertainty, NO_UNCERTAINTY, /Crib avg/u)`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`figureStory(NO_UNCERTAINTY, shippedPlayUncertainty, /You - Opp/u)`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
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
}`,...Z.parameters?.docs?.source}}}})))()}$();export{J as CribUncertainty,P as DoubleExpanded,F as DoubleExpandedPone,N as Expanded,j as JackSixFiveFourKingQueenSortedAscending,M as JackSixFiveFourKingQueenSortedDealOrder,A as JackSixFiveFourKingQueenSortedDescending,Z as LoadError,Y as PlayUncertainty,R as RoleLossPair,B as RoleLossWithheld,I as SortedByHandPoints,X as UncertaintyUnavailable,Q as __namedExportsOrder,D as default};