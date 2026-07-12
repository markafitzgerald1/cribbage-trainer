import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{t}from"./react-DlPsW1c0.js";import{c as n,l as r,o as i,t as a,u as o}from"./Card-atDF3gat.js";import{n as s,t as c}from"./SortOrder-CEtbOzlr.js";import{t as l}from"./SortOrderName-CZNMd6op.js";import{a as u,l as d,n as f}from"./stories.common-ClFJeHpz.js";import{_ as p,b as m,g as h,h as g,m as _,p as v,x as y}from"./classifyMistake-C1n_ZRH3.js";import{s as b,t as x}from"./expectedCribPoints-BcTYWPuV.js";import{r as S,t as C}from"./ScoredPossibleKeepDiscard-CUNgdhND.js";var w;function T(){return(T=e((()=>{o(),p(),y(),w=(e,t)=>{let n=m([...e,...t]).map(t=>{let n=h([...e,t]);return{fifteens:n.fifteens,flushes:n.flushes,nobs:n.nobs,pairs:n.pairs,runs:n.runs,total:n.total}}).reduce((e,t)=>({fifteens:e.fifteens+t.fifteens,flushes:e.flushes+t.flushes,nobs:e.nobs+t.nobs,pairs:e.pairs+t.pairs,runs:e.runs+t.runs,total:e.total+t.total}),{fifteens:0,flushes:0,nobs:0,pairs:0,runs:0,total:0});return Object.fromEntries(Object.entries(n).map(([n,r])=>[n,r/(52-e.length-t.length)]))}})))()}var E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G;function K(){return(K=e((()=>{o(),S(),s(),u(),_(),b(),E=t(),T(),p(),{expect:D,within:O}=__STORYBOOK_MODULE_TEST__,k={argTypes:f(`sortOrder`,l),component:C,decorators:[e=>(0,E.createElement)(`table`,null,(0,E.createElement)(`tbody`,null,(0,E.createElement)(e,null)))],parameters:{layout:`centered`},tags:[`autodocs`],title:`ScoredPossibleKeepDiscard`},A=(e,t)=>({...e,dealOrder:t}),j=[{expectedCribPoints:1.25,pointBreakdown:new Map().get(`missing`),remainingStarterCount:4,signedExpectedCribPoints:1.25,starterRank:`K`,starterSuitRelationPoints:[]}],M={fifteens:.3,flushes:.2,nobs:.1,pairs:.4,runs:.25},N={dealer:{pointBreakdown:{fifteens:.4,go:.2,lastCard:.3,pairs:.6,runs:.5,thirtyOnes:.4},total:2.4},delta:.9,pone:{pointBreakdown:{fifteens:.2,go:.1,lastCard:.2,pairs:.3,runs:.4,thirtyOnes:.3},total:1.5}},P=[{expectedCribPoints:4.5,pointBreakdown:M,remainingStarterCount:3,signedExpectedCribPoints:4.5,starterRank:`5`,starterSuitRelationPoints:[{expectedCribPoints:5.1,pointBreakdown:{fifteens:1.1,flushes:.4,nobs:.1,pairs:.8,runs:2.7},relation:`matching_discard_suit`,remainingStarterCount:1,starterRank:`5`,suits:[n.DIAMONDS]},{expectedCribPoints:4.2,pointBreakdown:{fifteens:.8,flushes:0,nobs:.2,pairs:.7,runs:2.5},relation:`non_matching_discard_suit`,remainingStarterCount:2,starterRank:`5`,suits:[n.HEARTS,n.SPADES]}]}],F=({keep:e,discard:t,sortOrder:n,cribPoints:r=1.25,cribStarterPoints:i=j,expectedCribPointBreakdown:a,highlightTier:o=`none`})=>{let s=v(e,t),c=w(e,t).total,l=h(e);return{args:{cribRole:x.Dealer,highlightTier:o,rowIndex:0,scoredKeepDiscard:{...g(s),cribStarterPoints:i,discard:t.map(A),expectedCribPointBreakdown:a,expectedCribPoints:r,expectedHandPoints:c,expectedNetPoints:c+r+N.delta,expectedPlayPoints:N,handPoints:l.total,handPointsBreakdown:l,keep:e.map(A),signedExpectedCribPoints:r},sortOrder:n}}},I={discard:[a.KING,a.QUEEN],keep:[a.JACK,a.SIX,a.FIVE,a.FOUR]},L=F({...I,sortOrder:c.Descending}),R=F({...I,highlightTier:`chosen`,sortOrder:c.Descending}),z=F({...I,highlightTier:`equal-best`,sortOrder:c.Descending}),B=F({discard:[a.KING,a.FOUR],keep:[a.TWO,a.TEN,a.NINE,a.JACK],sortOrder:c.Ascending}),V=F({discard:[a.FOUR,a.SEVEN],keep:[a.FIVE,a.FIVE,a.ACE,a.JACK],sortOrder:c.DealOrder}),H={...R,play:d},U={...H,play:e=>d(e,{toggleCribDetails:!0,togglePlayDetails:!0,toggleStarterDetails:!0})},W=F({cribPoints:4.5,cribStarterPoints:P,discard:[r(i.ACE,n.DIAMONDS),r(i.TWO,n.DIAMONDS)],expectedCribPointBreakdown:M,highlightTier:`chosen`,keep:[r(i.THREE,n.HEARTS),r(i.FOUR,n.SPADES),r(i.NINE,n.CLUBS),r(i.JACK,n.HEARTS)],sortOrder:c.Ascending}),W.play=async e=>{await d(e,{toggleCribDetails:!0});let t=O(e.canvasElement);await D(await t.findByText(`5.10`)).toBeVisible(),await D(await t.findByText(`4.20`)).toBeVisible()},G=[`JackSixFiveFourDiscardKingQueenSortedDescending`,`JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted`,`JackSixFiveFourDiscardKingQueenSortedDescendingEqualBest`,`TwoTenNineJackDiscardKingFourSortedAscending`,`FiveFiveAceJackDiscardFourSevenSortedInDealOrder`,`ExpandedRow`,`DoubleExpandedRow`,`SuitedCribDetailsExpanded`],L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`createStory({
  ...jackSixFiveFourKeepKingQueenDiscard,
  sortOrder: SortOrder.Descending
})`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`createStory({
  ...jackSixFiveFourKeepKingQueenDiscard,
  highlightTier: "chosen",
  sortOrder: SortOrder.Descending
})`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`createStory({
  ...jackSixFiveFourKeepKingQueenDiscard,
  highlightTier: "equal-best",
  sortOrder: SortOrder.Descending
})`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`createStory({
  discard: [CARDS.KING, CARDS.FOUR],
  keep: [CARDS.TWO, CARDS.TEN, CARDS.NINE, CARDS.JACK],
  sortOrder: SortOrder.Ascending
})`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`createStory({
  discard: [CARDS.FOUR, CARDS.SEVEN],
  keep: [CARDS.FIVE, CARDS.FIVE, CARDS.ACE, CARDS.JACK],
  sortOrder: SortOrder.DealOrder
})`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted,
  play: playToggle
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  ...ExpandedRow,
  play: context => playToggle(context, {
    toggleCribDetails: true,
    togglePlayDetails: true,
    toggleStarterDetails: true
  })
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`createStory({
  cribPoints: 4.5,
  cribStarterPoints: suitedCribStarterPoints,
  discard: [createCard(Rank.ACE, Suit.DIAMONDS), createCard(Rank.TWO, Suit.DIAMONDS)],
  expectedCribPointBreakdown: cribPointBreakdown,
  highlightTier: "chosen",
  keep: [createCard(Rank.THREE, Suit.HEARTS), createCard(Rank.FOUR, Suit.SPADES), createCard(Rank.NINE, Suit.CLUBS), createCard(Rank.JACK, Suit.HEARTS)],
  sortOrder: SortOrder.Ascending
})`,...W.parameters?.docs?.source}}}})))()}K();export{U as DoubleExpandedRow,H as ExpandedRow,V as FiveFiveAceJackDiscardFourSevenSortedInDealOrder,L as JackSixFiveFourDiscardKingQueenSortedDescending,z as JackSixFiveFourDiscardKingQueenSortedDescendingEqualBest,R as JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted,W as SuitedCribDetailsExpanded,B as TwoTenNineJackDiscardKingFourSortedAscending,G as __namedExportsOrder,k as default};