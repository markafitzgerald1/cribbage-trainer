import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-Q1GcV6wX.js";import{c as n,d as r,f as i,r as a,u as o}from"./CardLabel-BxaxW3FO.js";import{i as s,t as c}from"./SortOrderName-DnS2ytQU.js";import{c as l,i as u,n as d}from"./stories.common-DNls5WNy.js";import{s as f,t as p}from"./expectedCribPoints-Bw5cFIcJ.js";import{_ as m,b as h,g,h as _,m as v,p as y,x as b}from"./classifyMistake-xWy0NnkA.js";import{r as x,t as S}from"./ScoredPossibleKeepDiscard-DfLXST1O.js";var C;function w(){return(w=e((()=>{i(),m(),b(),C=(e,t)=>{let n=h([...e,...t]).map(t=>{let n=g([...e,t]);return{fifteens:n.fifteens,flushes:n.flushes,nobs:n.nobs,pairs:n.pairs,runs:n.runs,total:n.total}}).reduce((e,t)=>({fifteens:e.fifteens+t.fifteens,flushes:e.flushes+t.flushes,nobs:e.nobs+t.nobs,pairs:e.pairs+t.pairs,runs:e.runs+t.runs,total:e.total+t.total}),{fifteens:0,flushes:0,nobs:0,pairs:0,runs:0,total:0});return Object.fromEntries(Object.entries(n).map(([n,r])=>[n,r/(52-e.length-t.length)]))}})))()}var T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W;function G(){return(G=e((()=>{i(),x(),u(),v(),f(),T=t(),w(),m(),{expect:E,within:D}=__STORYBOOK_MODULE_TEST__,O={argTypes:d(`sortOrder`,c),component:S,decorators:[e=>(0,T.createElement)(`table`,null,(0,T.createElement)(`tbody`,null,(0,T.createElement)(e,null)))],parameters:{layout:`centered`},tags:[`autodocs`],title:`ScoredPossibleKeepDiscard`},k=(e,t)=>({...e,dealOrder:t}),A=[{expectedCribPoints:1.25,pointBreakdown:new Map().get(`missing`),remainingStarterCount:4,signedExpectedCribPoints:1.25,starterRank:`K`,starterSuitRelationPoints:[]}],j={fifteens:.3,flushes:.2,nobs:.1,pairs:.4,runs:.25},M={dealer:{pointBreakdown:{fifteens:.4,go:.2,lastCard:.3,pairs:.6,runs:.5,thirtyOnes:.4},total:2.4},delta:.9,pone:{pointBreakdown:{fifteens:.2,go:.1,lastCard:.2,pairs:.3,runs:.4,thirtyOnes:.3},total:1.5}},N=[{expectedCribPoints:4.5,pointBreakdown:j,remainingStarterCount:3,signedExpectedCribPoints:4.5,starterRank:`5`,starterSuitRelationPoints:[{expectedCribPoints:5.1,pointBreakdown:{fifteens:1.1,flushes:.4,nobs:.1,pairs:.8,runs:2.7},relation:`matching_discard_suit`,remainingStarterCount:1,starterRank:`5`,suits:[o.DIAMONDS]},{expectedCribPoints:4.2,pointBreakdown:{fifteens:.8,flushes:0,nobs:.2,pairs:.7,runs:2.5},relation:`non_matching_discard_suit`,remainingStarterCount:2,starterRank:`5`,suits:[o.HEARTS,o.SPADES]}]}],P=({keep:e,discard:t,sortOrder:n,cribPoints:r=1.25,cribStarterPoints:i=A,expectedCribPointBreakdown:a,highlightTier:o=`none`})=>{let s=y(e,t),c=C(e,t).total,l=g(e);return{args:{cribRole:p.Dealer,highlightTier:o,rowIndex:0,scoredKeepDiscard:{..._(s),cribStarterPoints:i,discard:t.map(k),expectedCribPointBreakdown:a,expectedCribPoints:r,expectedHandPoints:c,expectedNetPoints:c+r+M.delta,expectedPlayPoints:M,handPoints:l.total,handPointsBreakdown:l,keep:e.map(k),signedExpectedCribPoints:r},sortOrder:n}}},F={discard:[a.KING,a.QUEEN],keep:[a.JACK,a.SIX,a.FIVE,a.FOUR]},I=P({...F,sortOrder:s.Descending}),L=P({...F,highlightTier:`chosen`,sortOrder:s.Descending}),R=P({...F,highlightTier:`equal-best`,sortOrder:s.Descending}),z=P({discard:[a.KING,a.FOUR],keep:[a.TWO,a.TEN,a.NINE,a.JACK],sortOrder:s.Ascending}),B=P({discard:[a.FOUR,a.SEVEN],keep:[a.FIVE,a.FIVE,a.ACE,a.JACK],sortOrder:s.DealOrder}),V={...L,play:l},H={...V,play:e=>l(e,{toggleCribDetails:!0,togglePlayDetails:!0,toggleStarterDetails:!0})},U=P({cribPoints:4.5,cribStarterPoints:N,discard:[r(n.ACE,o.DIAMONDS),r(n.TWO,o.DIAMONDS)],expectedCribPointBreakdown:j,highlightTier:`chosen`,keep:[r(n.THREE,o.HEARTS),r(n.FOUR,o.SPADES),r(n.NINE,o.CLUBS),r(n.JACK,o.HEARTS)],sortOrder:s.Ascending}),U.play=async e=>{await l(e,{toggleCribDetails:!0});let t=D(e.canvasElement);await E(await t.findByText(`5.10`)).toBeVisible(),await E(await t.findByText(`4.20`)).toBeVisible()},W=[`JackSixFiveFourDiscardKingQueenSortedDescending`,`JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted`,`JackSixFiveFourDiscardKingQueenSortedDescendingEqualBest`,`TwoTenNineJackDiscardKingFourSortedAscending`,`FiveFiveAceJackDiscardFourSevenSortedInDealOrder`,`ExpandedRow`,`DoubleExpandedRow`,`SuitedCribDetailsExpanded`],I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`createStory({
  ...jackSixFiveFourKeepKingQueenDiscard,
  sortOrder: SortOrder.Descending
})`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`createStory({
  ...jackSixFiveFourKeepKingQueenDiscard,
  highlightTier: "chosen",
  sortOrder: SortOrder.Descending
})`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`createStory({
  ...jackSixFiveFourKeepKingQueenDiscard,
  highlightTier: "equal-best",
  sortOrder: SortOrder.Descending
})`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`createStory({
  discard: [CARDS.KING, CARDS.FOUR],
  keep: [CARDS.TWO, CARDS.TEN, CARDS.NINE, CARDS.JACK],
  sortOrder: SortOrder.Ascending
})`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`createStory({
  discard: [CARDS.FOUR, CARDS.SEVEN],
  keep: [CARDS.FIVE, CARDS.FIVE, CARDS.ACE, CARDS.JACK],
  sortOrder: SortOrder.DealOrder
})`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  ...JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted,
  play: playToggle
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  ...ExpandedRow,
  play: context => playToggle(context, {
    toggleCribDetails: true,
    togglePlayDetails: true,
    toggleStarterDetails: true
  })
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`createStory({
  cribPoints: 4.5,
  cribStarterPoints: suitedCribStarterPoints,
  discard: [createCard(Rank.ACE, Suit.DIAMONDS), createCard(Rank.TWO, Suit.DIAMONDS)],
  expectedCribPointBreakdown: cribPointBreakdown,
  highlightTier: "chosen",
  keep: [createCard(Rank.THREE, Suit.HEARTS), createCard(Rank.FOUR, Suit.SPADES), createCard(Rank.NINE, Suit.CLUBS), createCard(Rank.JACK, Suit.HEARTS)],
  sortOrder: SortOrder.Ascending
})`,...U.parameters?.docs?.source}}}})))()}G();export{H as DoubleExpandedRow,V as ExpandedRow,B as FiveFiveAceJackDiscardFourSevenSortedInDealOrder,I as JackSixFiveFourDiscardKingQueenSortedDescending,R as JackSixFiveFourDiscardKingQueenSortedDescendingEqualBest,L as JackSixFiveFourDiscardKingQueenSortedDescendingHighlighted,U as SuitedCribDetailsExpanded,z as TwoTenNineJackDiscardKingFourSortedAscending,W as __namedExportsOrder,O as default};