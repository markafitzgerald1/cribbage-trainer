import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{c as t,f as n,u as r}from"./CardLabel-BxaxW3FO.js";import{i,t as a}from"./SortOrderName-DnS2ytQU.js";import{i as o,n as s}from"./stories.common-DNls5WNy.js";import"./vars-uD8VgyMF.js";import{i as c,n as l,t as u}from"./CutResultRow-BRmUYjkX.js";function d(e){return{isAllRemaining:!0,rank:e,suits:[]}}var f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O;function k(){return(k=e((()=>{o(),n(),l(),c(),f=4,p=6,m=10,h={argTypes:s(`sortOrder`,a),component:u,parameters:{layout:`centered`},tags:[`autodocs`],title:`CutResultRow`},g={sortOrder:i.Descending},_={fifteensPoints:0,flushesPoints:0,nobsPoints:0,pairsPoints:0,runsPoints:0},v=[t.TEN,t.JACK,t.QUEEN,t.KING].map(d),y={...g,..._,cuts:v,totalPoints:p},b={args:{...g,..._,cuts:[d(t.FIVE)],fifteensPoints:2,pairsPoints:2,totalPoints:f}},x={args:{...y}},S={args:{...y,sortOrder:i.Ascending}},C={args:{...g,cuts:[d(t.ACE)],fifteensPoints:2,flushesPoints:4,nobsPoints:1,pairsPoints:0,runsPoints:3,totalPoints:m}},w={args:{...g,..._,cuts:[d(t.KING)],totalPoints:0}},T={...g,..._,fifteensPoints:2,pairsPoints:2,totalPoints:f},E={args:{...T,cuts:[{isAllRemaining:!1,rank:t.FIVE,suits:[r.HEARTS]},{isAllRemaining:!1,rank:t.FIVE,suits:[r.DIAMONDS]}]}},D={args:{...T,cuts:[d(t.FIVE),d(t.FIVE)]}},O=[`SingleCut`,`MultipleCutsDescending`,`MultipleCutsAscending`,`AllCategories`,`NoPoints`,`SameRankCuts`,`MultipleSameRankRanks`],b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    ...SHARED_BASE_ARGS,
    ...ZERO_POINTS,
    cuts: [makeRankCut(Rank.FIVE)],
    fifteensPoints: 2,
    pairsPoints: 2,
    totalPoints: FOUR_POINTS
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    ...MULTIPLE_CUTS_SHARED_ARGS
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    ...MULTIPLE_CUTS_SHARED_ARGS,
    sortOrder: SortOrder.Ascending
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    ...SHARED_BASE_ARGS,
    ...ZERO_POINTS,
    cuts: [makeRankCut(Rank.KING)],
    totalPoints: 0
  }
}`,...w.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    ...FIVE_FIFTEEN_AND_PAIRS_ARGS,
    cuts: [makeRankCut(Rank.FIVE), makeRankCut(Rank.FIVE)]
  }
}`,...D.parameters?.docs?.source}}}})))()}k();export{C as AllCategories,S as MultipleCutsAscending,x as MultipleCutsDescending,D as MultipleSameRankRanks,w as NoPoints,E as SameRankCuts,b as SingleCut,O as __namedExportsOrder,h as default};