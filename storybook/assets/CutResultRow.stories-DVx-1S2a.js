import{i as e}from"./preload-helper-BdFrVu1K.js";import{d as t,l as n,s as r}from"./CardLabel-DOrztDns.js";import{i,t as a}from"./SortOrderName-MXRr2nWr.js";import{n as o,t as s}from"./stories.common-DDKxRJET.js";import{t as c}from"./vars-BFauNtSB.js";import{i as l,n as u,t as d}from"./CutResultRow-DazjQCPD.js";function f(e){return{isAllRemaining:!0,rank:e,suits:[]}}var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k;e((()=>{c(),o(),t(),u(),l(),p=4,m=6,h=10,g={argTypes:s(`sortOrder`,a),component:d,parameters:{layout:`centered`},tags:[`autodocs`],title:`CutResultRow`},_={sortOrder:i.Descending},v={fifteensPoints:0,flushesPoints:0,nobsPoints:0,pairsPoints:0,runsPoints:0},y=[r.TEN,r.JACK,r.QUEEN,r.KING].map(f),b={..._,...v,cuts:y,totalPoints:m},x={args:{..._,...v,cuts:[f(r.FIVE)],fifteensPoints:2,pairsPoints:2,totalPoints:p}},S={args:{...b}},C={args:{...b,sortOrder:i.Ascending}},w={args:{..._,cuts:[f(r.ACE)],fifteensPoints:2,flushesPoints:4,nobsPoints:1,pairsPoints:0,runsPoints:3,totalPoints:h}},T={args:{..._,...v,cuts:[f(r.KING)],totalPoints:0}},E={..._,...v,fifteensPoints:2,pairsPoints:2,totalPoints:p},D={args:{...E,cuts:[{isAllRemaining:!1,rank:r.FIVE,suits:[n.HEARTS]},{isAllRemaining:!1,rank:r.FIVE,suits:[n.DIAMONDS]}]}},O={args:{...E,cuts:[f(r.FIVE),f(r.FIVE)]}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    ...SHARED_BASE_ARGS,
    ...ZERO_POINTS,
    cuts: [makeRankCut(Rank.FIVE)],
    fifteensPoints: 2,
    pairsPoints: 2,
    totalPoints: FOUR_POINTS
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    ...MULTIPLE_CUTS_SHARED_ARGS
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    ...MULTIPLE_CUTS_SHARED_ARGS,
    sortOrder: SortOrder.Ascending
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    ...SHARED_BASE_ARGS,
    cuts: [makeRankCut(Rank.ACE)],
    fifteensPoints: 2,
    flushesPoints: 4,
    nobsPoints: 1,
    pairsPoints: 0,
    runsPoints: 3,
    totalPoints: TEN_POINTS
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    ...SHARED_BASE_ARGS,
    ...ZERO_POINTS,
    cuts: [makeRankCut(Rank.KING)],
    totalPoints: 0
  }
}`,...T.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    ...FIVE_FIFTEEN_AND_PAIRS_ARGS,
    cuts: [{
      isAllRemaining: false,
      rank: Rank.FIVE,
      suits: [Suit.HEARTS]
    }, {
      isAllRemaining: false,
      rank: Rank.FIVE,
      suits: [Suit.DIAMONDS]
    }]
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    ...FIVE_FIFTEEN_AND_PAIRS_ARGS,
    cuts: [makeRankCut(Rank.FIVE), makeRankCut(Rank.FIVE)]
  }
}`,...O.parameters?.docs?.source}}},k=[`SingleCut`,`MultipleCutsDescending`,`MultipleCutsAscending`,`AllCategories`,`NoPoints`,`SameRankCuts`,`MultipleSameRankRanks`]}))();export{w as AllCategories,C as MultipleCutsAscending,S as MultipleCutsDescending,O as MultipleSameRankRanks,T as NoPoints,D as SameRankCuts,x as SingleCut,k as __namedExportsOrder,g as default};