import{i as e,s as t}from"./preload-helper-CT_b8DTk.js";import{z as n}from"./iframe-C4Mo0zok.js";import{d as r,l as i,r as a,s as o,u as s}from"./CardLabel-BhZER6fd.js";import{r as c,t as l}from"./SortOrderName-BuMtj5pl.js";import{i as u,n as d,t as f}from"./stories.common-DS7hcHEz.js";import{o as p,t as m,u as h}from"./expectedCribPoints-DNklQyfF.js";import{C as g,D as _,O as v,S as y,b,n as x,t as S,w as C,x as w}from"./ScoredPossibleKeepDiscard-_iX6rmzA.js";var T,E=e((()=>{r(),C(),h(),v(),T=(e,t)=>{let n=_([...e,...t]).map(t=>{let n=g([...e,t]);return{fifteens:n.fifteens,flushes:n.flushes,nobs:n.nobs,pairs:n.pairs,runs:n.runs,total:n.total}}).reduce((e,t)=>({fifteens:e.fifteens+t.fifteens,flushes:e.flushes+t.flushes,nobs:e.nobs+t.nobs,pairs:e.pairs+t.pairs,runs:e.runs+t.runs,total:e.total+t.total}),{fifteens:0,flushes:0,nobs:0,pairs:0,runs:0,total:0});return Object.fromEntries(Object.entries(n).map(([n,r])=>[n,r/(52-e.length-t.length)]))}})),D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G;e((()=>{r(),d(),w(),p(),x(),D=t(n()),E(),C(),{expect:O,within:k}=__STORYBOOK_MODULE_TEST__,A={argTypes:f(`sortOrder`,l),component:S,decorators:[e=>(0,D.createElement)(`table`,null,(0,D.createElement)(`tbody`,null,(0,D.createElement)(e,null)))],parameters:{layout:`centered`},tags:[`autodocs`],title:`ScoredPossibleKeepDiscard`},j=(e,t)=>({...e,dealOrder:t}),M=[{expectedCribPoints:1.25,pointBreakdown:new Map().get(`missing`),remainingStarterCount:4,signedExpectedCribPoints:1.25,starterRank:`K`,starterSuitRelationPoints:[]}],N={fifteens:.3,flushes:.2,nobs:.1,pairs:.4,runs:.25},P={dealer:{pointBreakdown:{fifteens:.4,go:.2,lastCard:.3,pairs:.6,runs:.5,thirtyOnes:.4},total:2.4},delta:.9,pone:{pointBreakdown:{fifteens:.2,go:.1,lastCard:.2,pairs:.3,runs:.4,thirtyOnes:.3},total:1.5}},F=[{expectedCribPoints:4.5,pointBreakdown:N,remainingStarterCount:3,signedExpectedCribPoints:4.5,starterRank:`5`,starterSuitRelationPoints:[{expectedCribPoints:5.1,pointBreakdown:{fifteens:1.1,flushes:.4,nobs:.1,pairs:.8,runs:2.7},relation:`matching_discard_suit`,remainingStarterCount:1,starterRank:`5`,suits:[i.DIAMONDS]},{expectedCribPoints:4.2,pointBreakdown:{fifteens:.8,flushes:0,nobs:.2,pairs:.7,runs:2.5},relation:`non_matching_discard_suit`,remainingStarterCount:2,starterRank:`5`,suits:[i.HEARTS,i.SPADES]}]}],I=({keep:e,discard:t,sortOrder:n,cribPoints:r=1.25,cribStarterPoints:i=M,expectedCribPointBreakdown:a,isHighlighted:o=!1})=>{let s=b(e,t),c=T(e,t).total,l=g(e);return{args:{cribRole:m.Dealer,isHighlighted:o,rowIndex:0,scoredKeepDiscard:{...y(s),cribStarterPoints:i,discard:t.map(j),expectedCribPointBreakdown:a,expectedCribPoints:r,expectedHandPoints:c,expectedNetPoints:c+r+P.delta,expectedPlayPoints:P,handPoints:l.total,handPointsBreakdown:l,keep:e.map(j),signedExpectedCribPoints:r},sortOrder:n}}},L={discard:[a.KING,a.QUEEN],keep:[a.JACK,a.SIX,a.FIVE,a.FOUR]},R=I({...L,sortOrder:c.Descending}),z=I({...L,isHighlighted:!0,sortOrder:c.Descending}),B=I({discard:[a.KING,a.FOUR],keep:[a.TWO,a.TEN,a.NINE,a.JACK],sortOrder:c.Ascending}),V=I({discard:[a.FOUR,a.SEVEN],keep:[a.FIVE,a.FIVE,a.ACE,a.JACK],sortOrder:c.DealOrder}),H={...z,play:u},U={...H,play:e=>u(e,{toggleCribDetails:!0,togglePlayDetails:!0,toggleStarterDetails:!0})},W=I({cribPoints:4.5,cribStarterPoints:F,discard:[s(o.ACE,i.DIAMONDS),s(o.TWO,i.DIAMONDS)],expectedCribPointBreakdown:N,isHighlighted:!0,keep:[s(o.THREE,i.HEARTS),s(o.FOUR,i.SPADES),s(o.NINE,i.CLUBS),s(o.JACK,i.HEARTS)],sortOrder:c.Ascending}),W.play=async e=>{await u(e,{toggleCribDetails:!0});let t=k(e.canvasElement);await O(await t.findByText(`5.10`)).toBeVisible(),await O(await t.findByText(`4.20`)).toBeVisible()},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`createStory({
  ...jackSixFiveFourKeepKingQueenDiscard,
  sortOrder: SortOrder.Descending
})`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`createStory({
  ...jackSixFiveFourKeepKingQueenDiscard,
  isHighlighted: true,
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
  isHighlighted: true,
  keep: [createCard(Rank.THREE, Suit.HEARTS), createCard(Rank.FOUR, Suit.SPADES), createCard(Rank.NINE, Suit.CLUBS), createCard(Rank.JACK, Suit.HEARTS)],
  sortOrder: SortOrder.Ascending
})`,...W.parameters?.docs?.source}}},G=[`JackSixFiveFourDiscardKingQueenSortedDescending`,`JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted`,`TwoTenNineJackDiscardKingFourSortedAscending`,`FiveFiveAceJackDiscardFourSevenSortedInDealOrder`,`ExpandedRow`,`DoubleExpandedRow`,`SuitedCribDetailsExpanded`]}))();export{U as DoubleExpandedRow,H as ExpandedRow,V as FiveFiveAceJackDiscardFourSevenSortedInDealOrder,R as JackSixFiveFourDiscardKingQueenSortedDescending,z as JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted,W as SuitedCribDetailsExpanded,B as TwoTenNineJackDiscardKingFourSortedAscending,G as __namedExportsOrder,A as default};